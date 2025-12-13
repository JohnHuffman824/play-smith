# PlaySmith Playbook Capability Gap Analysis & Feature Plan

## Overview

**Goal**: Ensure PlaySmith can represent complex real-world playbooks like Bishop Diego's offensive system. This is NOT about hard-coding specific playbook data, but about building generic features that enable ANY team to create sophisticated play-call compositions.

**Test Case**: Bishop Diego 2019 Offensive Playbook (48 pages)
- Hierarchical play calls: `"3 I Z 44 Power"` = Formation 3 + I-backs + Z motion + 44 Power
- If PlaySmith can represent this, it can represent most football playbooks

---

## UX Design Principles

### Core Philosophy
> Coaches understand plays through **vocabulary** (words) and **drawings** (visuals). The system should let them associate drawings with words through explicit definition, not auto-inference.

### Why NOT Auto-Inference
When a coach names a play "3 I actor dakota", we should NOT auto-parse this into vocabulary because:
- The meaning comes from EXPLICIT prior definitions
- "3 I actor dakota" means that combination BECAUSE coach already defined "3 I" as formation, "actor" as play action, etc.
- Auto-inference makes assumptions about modularity that may be wrong

### UX Patterns

**1. Explicit Vocabulary Definition**
- Dedicated "Vocabulary Setup" feature (similar to existing concept dialog)
- Two fields when creating formations/concepts: "Name" + "Shorthand Code"
- Example: Name="Pro Right", Code="3"
- Parser ONLY uses explicitly defined codes

**2. Name + Code Fields (Top Toolbar)**
- When creating formation: "Name" field + "Code" field in toolbar
- Both are optional, but code enables play-call parsing
- System stores vocabulary entry when code is provided

**3. Guided Playbook Setup**
- On playbook creation, wizard-style onboarding:
  1. "Import from another playbook?" (optional)
  2. "Setup your formations" (or defer)
  3. "Setup your concepts" (or defer)
  4. "Setup your vocabulary codes" (or defer)
- Similar UX to existing add concept dialog

**4. Parser Uses Explicit Vocabulary Only**
- Type "3 I Z 44 Power" in search
- Parser looks up each token in team_vocabulary
- Only resolves tokens that have explicit definitions
- Unknown tokens: "I don't know '44 Power'. Is this a concept?"

### Future Enhancement (Out of Scope)
- LLM-powered import: Upload PDF/play call sheet → parse to JSON → create entities
- "Save as concept" directly from play editor

---

## Gap Analysis Summary

### What EXISTS Today

| Capability | Status | Notes |
|------------|--------|-------|
| Formations with player positions | ✅ | `formations` + `formation_player_positions` tables |
| Concepts (routes, patterns) | ✅ | `base_concepts` + `concept_player_assignments` |
| Motions as concepts | ✅ | `is_motion` flag on `base_concepts` |
| Modifiers with formation overrides | ✅ | `is_modifier` flag + `modifier_overrides` table |
| Concept groups (bundles) | ✅ | `concept_groups` table |
| Application engine | ✅ | PlayContext with `applyFormation`, `applyConcept` |
| Simple search | ✅ | "Role Route" pattern in `smartParsing.ts` |
| Frecency ranking | ✅ | `usage_count` + `last_used_at` on concepts |

### What's MISSING

| Gap | Impact | Priority |
|-----|--------|----------|
| **Team Vocabulary Registry** | Can't map "3" → Formation, "Z" → Motion | HIGH |
| **Play Call Parser** | Can't parse "3 I Z 44 Power" into components | HIGH |
| **Backfield Alignment Separation** | Backs baked into formations, can't mix/match | MEDIUM |
| **Formation Numbering** | No `formation_number` field for shorthand | MEDIUM |
| **Play Call Field** | No structured storage for play call strings | MEDIUM |
| **System Motion Templates** | No preset motions (all must be user-created) | LOW |

---

## Recommended Features (Prioritized)

### Phase 1: Team Vocabulary System (HIGH PRIORITY)

**Problem**: Teams have shorthand codes ("3", "I", "Z", "Power") that map to entities. No way to define these mappings.

**Solution**: Generic vocabulary registry per team

```sql
CREATE TABLE team_vocabulary (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    code TEXT NOT NULL,              -- "3", "I", "Z", "Power", "44"
    category TEXT NOT NULL,          -- "formation", "backfield", "motion", "play"
    entity_type TEXT NOT NULL,       -- "formation", "concept", "concept_group"
    entity_id BIGINT NOT NULL,       -- FK to the actual entity
    priority INTEGER DEFAULT 0,      -- For disambiguation
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, code, category)
);
```

**How It Works**:
- Team creates Formation "Pro Right" with positions
- Team adds vocabulary entry: code="3", category="formation", entity_id=<pro_right_id>
- Now typing "3" resolves to "Pro Right" formation

**Files to Create/Modify**:
- `src/db/migrations/020_team_vocabulary.sql`
- `src/db/types.ts` - Add `TeamVocabulary` interface
- `src/db/repositories/TeamVocabularyRepository.ts`
- `src/api/team-vocabulary.ts`

---

### Phase 2: Play Call Parser (HIGH PRIORITY)

**Problem**: Current `smartParsing.ts` only handles single tokens or "Role Route" patterns.

**Solution**: Multi-token parser that uses team vocabulary to resolve components

```typescript
// src/utils/playCallParser.ts
interface ParsedPlayCall {
  type: 'complete' | 'partial' | 'ambiguous' | 'invalid'
  tokens: ParsedToken[]
  resolvedComponents: {
    formation?: { id: number; name: string }
    backfield?: { id: number; name: string }
    motion?: { id: number; name: string }
    play?: { id: number; name: string }
  }
  confidence: number
  suggestions: string[]  // For autocomplete
}

function parsePlayCall(input: string, teamId: number): ParsedPlayCall
```

**Parsing Strategy**:
1. Tokenize input by whitespace
2. For each token, query `team_vocabulary` for matches
3. Use category priority: formation > backfield > motion > play
4. Return structured result with resolved entity IDs
5. For partial input, return suggestions based on vocabulary

**Files to Create/Modify**:
- `src/utils/playCallParser.ts` - Main parser
- `src/types/play-call.types.ts` - Type definitions
- `src/utils/smartParsing.ts` - Integrate play-call detection
- `src/hooks/usePlayCallParser.ts` - React hook for autocomplete

---

### Phase 3: Backfield via Modifier System (MEDIUM PRIORITY)

**Problem**: Backfield positions (QB, RB, FB) are baked into formations. Can't say "Trips + Gun" vs "Trips + I-Form" without two separate formations.

**Philosophy**: Don't create new entity types. Extend existing modifier system to handle this.

**Current Modifier System**:
- Concepts can have `is_modifier: true`
- Modifiers have rules with `delta_x`, `delta_y` for position adjustments
- `ModifierOverride` allows formation-specific behavior

**Solution**: Extend modifier rules to support **absolute positioning**, not just deltas

```typescript
// Current modifier rules (position deltas)
interface ModifierRules {
  role: string
  delta_x: number
  delta_y: number
}

// Extended modifier rules (also supports absolute positions)
interface ExtendedModifierRules {
  role: string
  delta_x?: number       // Relative adjustment
  delta_y?: number       // Relative adjustment
  absolute_x?: number    // Override to absolute position
  absolute_y?: number    // Override to absolute position
}
```

**How Backfield Works with This**:
1. Create modifier concept "I-Form Backs" with `is_modifier: true`
2. Add modifier rules: `QB: {absolute_x: 50, absolute_y: 5}`, `RB: {absolute_x: 50, absolute_y: 12}`, etc.
3. Apply formation "Trips Right" (defines WRs, TE, OL)
4. Apply modifier "I-Form Backs" (overrides QB, RB, FB positions)
5. Result: Trips Right + I-Form backfield

**Schema Change** (minimal):
```sql
-- Extend modifier_rules column to support absolute positions
-- No new tables needed! Just update how rules are interpreted
```

**Files to Modify**:
- `src/types/concept.types.ts` - Extend `ModifierRules` type
- `src/utils/modifierApplication.ts` - Handle absolute positions
- `src/contexts/PlayContext.tsx` - Apply extended modifier logic

---

### Phase 4: Formation Variants via Vocabulary (LOW PRIORITY)

**Problem**: Teams want to reference "Formation 3" or "3 Open" as shorthand.

**Philosophy**: This is already solved by the vocabulary system. No schema changes needed.

**Solution**: Use vocabulary entries for formation numbering and variants

**How It Works**:
1. Create formations as usual: "Pro Right", "Pro Right Open", "Pro Right Flex"
2. Add vocabulary entries:
   - `code: "3", category: "formation", entity_id: <pro_right_id>`
   - `code: "3 Open", category: "formation", entity_id: <pro_right_open_id>`
   - `code: "3 Flex", category: "formation", entity_id: <pro_right_flex_id>`
3. Parser resolves "3" → Pro Right, "3 Open" → Pro Right Open

**No Schema Changes Required**: The vocabulary system from Phase 1 handles this.

**Future Enhancement** (if needed):
- If teams want true inheritance (variant auto-copies parent positions), we could add `parent_formation_id`
- But that's optimization, not necessity

---

### Phase 5: Play Call Storage (MEDIUM PRIORITY)

**Problem**: No way to store the original play call string with a play.

**Solution**: Add `play_call` field to plays

```sql
ALTER TABLE plays ADD COLUMN play_call TEXT;
```

**Benefits**:
- Search plays by call string
- Display original call in UI
- Re-parse call for editing

**Files to Modify**:
- `src/db/migrations/023_play_call_field.sql`
- `src/db/types.ts` - Update `Play` interface

---

## Implementation Order

### Milestone 1: Team Vocabulary System
1. Create `team_vocabulary` table migration
2. Add `TeamVocabulary` interface to types
3. Create `TeamVocabularyRepository.ts`
4. Create `src/api/team-vocabulary.ts` endpoints
5. **Test**: Add vocabulary entries, query by code

### Milestone 2: Play Call Parser
6. Create `src/types/play-call.types.ts`
7. Implement `src/utils/playCallParser.ts` with vocabulary lookups
8. Create `src/hooks/usePlayCallParser.ts` for React
9. Integrate with `smartParsing.ts`
10. **Test**: Enter Bishop Diego vocabulary, parse "3 I Z 44 Power"

### Milestone 3: SearchBar Autocomplete
11. Update `SearchBar.tsx` to use play call parser
12. Show suggestions as user types
13. **Test**: Type "3 I ", see backfield suggestions

### Milestone 4: Modifier System Extension
14. Extend `ModifierRules` type with `absolute_x`, `absolute_y`
15. Update `modifierApplication.ts` to handle absolute positions
16. Update `PlayContext.tsx` modifier application
17. **Test**: Create "I-Form" modifier, apply to formation, see backfield positions

### Milestone 5: Play Call Storage
18. Add `play_call` column to plays table
19. Update Play types and API
20. **Test**: Save play with call string, search by call

### Milestone 6: UI Components
21. Add "Code" field to formation/concept creation (toolbar or dialog)
22. Create Vocabulary Setup view (similar to concept dialog)
23. Update playbook creation with guided setup wizard
24. **Test**: Create formation with code, see it in vocabulary setup

---

## UI Components to Build

### 1. Code Field in Toolbar/Dialog
- Add "Code" input alongside "Name" when creating formations/concepts
- When code is provided, auto-create vocabulary entry
- Keep it simple: just a text field, no dropdown/selector

### 2. Vocabulary Setup View
**Location**: New view accessible from playbook settings or toolbar
**Pattern**: Similar to existing concept dialog

**Features**:
- List all vocabulary entries for team
- Filter by category (formation, backfield, motion, play)
- Add/edit/delete entries
- Each entry shows: Code | Category | Entity Name | Entity Type

**Table Structure**:
```
| Code | Category   | Maps To          |
|------|------------|------------------|
| 3    | formation  | Pro Right        |
| I    | backfield  | I-Form Backs     |
| Z    | motion     | Z Motion         |
| 44   | play       | 44 Power         |
```

### 3. Guided Playbook Setup
**Trigger**: When creating new playbook
**Pattern**: Wizard/stepper UI

**Steps**:
1. Basic Info (name, description)
2. Import (from another playbook, or skip)
3. Formations Setup (create/import, or defer)
4. Concepts Setup (create/import, or defer)
5. Vocabulary Setup (add codes, or defer)

Each step is optional/skippable.

### 4. Search Bar Enhancements
- Show vocabulary suggestions as user types
- Display parsed tokens with color coding
- Unknown tokens highlighted, can click to define

---

## Files Reference

### New Files to Create
| File | Purpose |
|------|---------|
| `src/db/migrations/020_team_vocabulary.sql` | Vocabulary registry table |
| `src/db/migrations/021_play_call_field.sql` | Add play_call column to plays |
| `src/db/repositories/TeamVocabularyRepository.ts` | CRUD for vocabulary |
| `src/api/team-vocabulary.ts` | API endpoints |
| `src/utils/playCallParser.ts` | Multi-token parser |
| `src/types/play-call.types.ts` | Parser types |
| `src/hooks/usePlayCallParser.ts` | React hook |
| `src/components/vocabulary/VocabularySetup.tsx` | Vocabulary management view |
| `src/components/playbook/PlaybookSetupWizard.tsx` | Guided playbook creation |

### Existing Files to Modify
| File | Purpose |
|------|---------|
| `src/db/types.ts` | Add `TeamVocabulary`, update `Play` interface |
| `src/types/concept.types.ts` | Extend `ModifierRules` with absolute positions |
| `src/utils/smartParsing.ts` | Integrate play-call detection |
| `src/utils/modifierApplication.ts` | Handle absolute position rules |
| `src/contexts/PlayContext.tsx` | Apply extended modifier logic |
| `src/components/search/SearchBar.tsx` | Autocomplete UI |

---

## Success Criteria

1. **Vocabulary Setup**: Team can define codes that map to their formations, concepts, motions
2. **Parser Works**: Typing "3 I Z 44 Power" with proper vocabulary returns:
   - Formation entity (e.g., "Pro Right")
   - Backfield entity (e.g., "I-Form backs")
   - Motion concept (e.g., "Z Motion")
   - Play concept (e.g., "44 Power")
3. **Composition Renders**: Parser result can be applied to canvas showing correct player positions and routes
4. **Autocomplete**: Partial input shows suggestions from team's vocabulary

---

## Out of Scope (For Now)

- Blocking scheme visualization (complex OL assignments)
- Motion animation timing
- Audible/check system
- Pre-built "system" vocabularies (teams define their own)
- Formation inheritance (variants auto-copy parent positions)
- Vocabulary import/export

These can be added later once core vocabulary + parser is working.

---

## Testing with Bishop Diego Playbook

After implementing the features, we'll manually test by:

1. **Create formations**: Pro Right, Trips, etc. with player positions
2. **Create backfield modifiers**: I-Form, Gun, Split, Pistol as modifier concepts with absolute positions
3. **Create motions**: Z, Zap, Rocket, etc. as motion concepts
4. **Create plays**: 44 Power, 178 Pass, etc. as concepts
5. **Add vocabulary**: Map codes to entities ("3" → Pro Right, "I" → I-Form modifier, etc.)
6. **Test parser**: Type "3 I Z 44 Power" and verify it resolves to correct entities
7. **Test composition**: Apply parsed result to canvas and verify visualization
