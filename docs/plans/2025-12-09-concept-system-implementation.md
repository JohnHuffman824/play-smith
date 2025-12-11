# Concept System Implementation Plan

**Date:** 2025-12-09
**Status:** Planning
**Phase:** Phase 1 - Core Concept System
**Architecture Reference:** [`docs/ConceptArchitecture.md`](../ConceptArchitecture.md)

---

## Overview

This plan outlines the implementation of Play Smith's Formations and Custom Concepts system, enabling coaches to create reusable formations, base concepts, and concept groups with smart search and composition features.

**Phase 1 Scope:**
- Formations (player positions only)
- Base Concepts (Absolute Role + Relative Selector modes)
- Concept Groups (bundled formation + concepts)
- Unified search bar with smart parsing
- Concept Dialog with canvas-centric design
- Vertical flip for mirroring concepts
- Frecency-based search ranking

**Out of Scope (Phase 2):**
- Conditional Rules targeting mode
- Route classification (AI/ML)

---

## Prerequisites

### Existing Infrastructure
- ✅ PostgreSQL database on AWS RDS with PostGIS
- ✅ Canvas component with drawing system (`src/components/canvas/`)
- ✅ Drawing types and utilities (`src/types/drawing.types.ts`, `src/utils/drawing.utils.ts`)
- ✅ Play editor with toolbar and PlayHeader
- ✅ Team and playbook tables already exist

### Dependencies
- Bun runtime
- React + TypeScript
- PostgreSQL 14+ with JSONB support
- Existing authentication system

---

## Implementation Phases

### Phase 1: Database Layer (Week 1)
**Goal:** Create all Phase 1 database tables and migrations

#### Tasks

**1.1 Create Migration Files** (1 day)
- [ ] Create migration `004_create_formations.sql`
  - Tables: `formations`, `formation_player_positions`
  - Indexes: team_id, name
  - Constraints: unique (team_id, name)
- [ ] Create migration `005_create_concepts.sql`
  - Tables: `base_concepts`, `concept_player_assignments`
  - Indexes: team_id, playbook_id, name, usage stats
  - Constraints: unique (team_id, playbook_id, name) NULLS NOT DISTINCT
- [ ] Create migration `006_create_concept_groups.sql`
  - Tables: `concept_groups`, `concept_group_concepts`
  - Indexes: team_id, playbook_id, name
- [ ] Create migration `007_create_concept_applications.sql`
  - Table: `concept_applications`
  - Indexes: play_id, concept_id, concept_group_id
- [ ] Create migration `008_create_role_terminology.sql`
  - Table: `role_terminology`
  - Seed default role terminology for existing teams
- [ ] Create migration `009_create_preset_routes.sql`
  - Table: `preset_routes`
  - Seed system routes (1-Flat through 9-Go)

**1.2 Repository Layer** (2 days)
- [ ] Create `src/db/repositories/FormationRepository.ts`
  - `create(formation)` - Create new formation
  - `update(id, formation)` - Update existing formation
  - `delete(id)` - Delete formation
  - `getById(id)` - Get formation by ID
  - `getByTeam(teamId)` - List all formations for team
  - `getByName(teamId, name)` - Find formation by name
  - `getWithPositions(id)` - Get formation with player positions joined

- [ ] Create `src/db/repositories/ConceptRepository.ts`
  - `create(concept)` - Create new base concept
  - `update(id, concept)` - Update existing concept
  - `delete(id)` - Delete concept
  - `getById(id)` - Get concept by ID
  - `getByTeam(teamId)` - List team-level concepts
  - `getByPlaybook(playbookId)` - List playbook-level concepts
  - `search(teamId, playbookId, query)` - Search with frecency ranking
  - `incrementUsage(id)` - Update usage_count and last_used_at
  - `getWithAssignments(id)` - Get concept with player assignments joined

- [ ] Create `src/db/repositories/ConceptGroupRepository.ts`
  - `create(group)` - Create new concept group
  - `update(id, group)` - Update existing group
  - `delete(id)` - Delete group
  - `getById(id)` - Get group by ID
  - `getByTeam(teamId)` - List team-level groups
  - `getByPlaybook(playbookId)` - List playbook-level groups
  - `getWithConcepts(id)` - Get group with concepts joined (ordered)

- [ ] Create `src/db/repositories/RoleTerminologyRepository.ts`
  - `create(role)` - Create custom role name
  - `update(teamId, standardRole, customName)` - Update role name
  - `getByTeam(teamId)` - Get all role terminology for team
  - `getByRole(teamId, standardRole)` - Get custom name for role

- [ ] Create `src/db/repositories/PresetRouteRepository.ts`
  - `getSystemRoutes()` - Get all system routes (1-9)
  - `getTeamRoutes(teamId)` - Get team custom routes
  - `getByNumber(number)` - Get route by number
  - `create(route)` - Create team custom route

**1.3 Testing** (1 day)
- [ ] Write unit tests for all repositories
- [ ] Test migrations up/down
- [ ] Test unique constraints
- [ ] Test JSONB queries for drawing_data
- [ ] Test frecency search query performance

**Deliverables:**
- ✅ 6 migration files
- ✅ 5 repository classes
- ✅ Unit tests with >80% coverage
- ✅ Seed data for preset routes and role terminology

---

### Phase 2: Backend API (Week 2)
**Goal:** Create REST API endpoints for concept management

#### Tasks

**2.1 Formation API** (1 day)
- [ ] Create `src/api/formations.ts`
  - `POST /api/formations` - Create formation
  - `GET /api/formations` - List formations for team
  - `GET /api/formations/:id` - Get formation with positions
  - `PUT /api/formations/:id` - Update formation
  - `DELETE /api/formations/:id` - Delete formation
- [ ] Add authentication middleware (team membership check)
- [ ] Add validation (Zod schemas)
- [ ] Write integration tests

**2.2 Concept API** (2 days)
- [ ] Create `src/api/concepts.ts`
  - `POST /api/concepts` - Create base concept
  - `GET /api/concepts` - List concepts (team + playbook scoped)
  - `GET /api/concepts/search?q=slice` - Search with frecency
  - `GET /api/concepts/:id` - Get concept with assignments
  - `PUT /api/concepts/:id` - Update concept
  - `DELETE /api/concepts/:id` - Delete concept (check usage first)
  - `POST /api/concepts/:id/clone` - Clone concept (for "Save as New")
- [ ] Add scope resolution logic (team vs playbook)
- [ ] Add conflict detection validation
- [ ] Write integration tests

**2.3 Concept Group API** (1 day)
- [ ] Create `src/api/concept-groups.ts`
  - `POST /api/concept-groups` - Create concept group
  - `GET /api/concept-groups` - List groups
  - `GET /api/concept-groups/:id` - Get group with concepts
  - `PUT /api/concept-groups/:id` - Update group
  - `DELETE /api/concept-groups/:id` - Delete group
- [ ] Add validation for concept order
- [ ] Write integration tests

**2.4 Utility APIs** (1 day)
- [ ] Create `src/api/role-terminology.ts`
  - `GET /api/teams/:teamId/roles` - Get role terminology
  - `PUT /api/teams/:teamId/roles/:role` - Update role name
- [ ] Create `src/api/preset-routes.ts`
  - `GET /api/routes/system` - Get system routes
  - `GET /api/routes/team/:teamId` - Get team routes
  - `POST /api/routes/team/:teamId` - Create team route
- [ ] Add smart parsing helper: `parseConceptInput(input)` → tokens
  - Tokenize on spaces
  - Match roles vs concepts
  - Return composition structure

**2.5 Index Route Updates** (0.5 day)
- [ ] Update `src/index.ts` to register all concept routes
  - `/api/formations`
  - `/api/concepts`
  - `/api/concept-groups`
  - `/api/teams/:teamId/roles`
  - `/api/routes`

**Deliverables:**
- ✅ 4 API modules
- ✅ All CRUD endpoints implemented
- ✅ Search with frecency ranking
- ✅ Clone endpoint for "Save as New"
- ✅ Integration tests with >80% coverage

---

### Phase 3: Frontend - Core Components (Week 3)
**Goal:** Build reusable components for concept system

#### Tasks

**3.1 Type Definitions** (0.5 day)
- [ ] Create `src/types/concept.types.ts`
  ```typescript
  export interface Formation {
    id: string;
    team_id: string;
    name: string;
    description?: string;
    positions: FormationPosition[];
  }

  export interface FormationPosition {
    role: string; // "X", "Y", "RB"
    position_x: number;
    position_y: number;
    hash_relative: boolean;
  }

  export interface BaseConcept {
    id: string;
    team_id?: string;
    playbook_id?: string;
    name: string;
    targeting_mode: 'absolute_role' | 'relative_selector';
    ball_position: 'left' | 'center' | 'right';
    play_direction?: 'left' | 'right' | 'na';
    assignments: PlayerAssignment[];
  }

  export interface PlayerAssignment {
    role?: string; // for absolute_role
    selector_type?: string; // for relative_selector
    selector_params?: { count?: number };
    drawing_data: Drawing; // from drawing.types.ts
  }

  export interface ConceptGroup {
    id: string;
    name: string;
    formation_id?: string;
    concepts: { concept_id: string; order_index: number }[];
  }
  ```

**3.2 Unified Search Bar Component** (2 days)
- [ ] Create `src/components/concepts/UnifiedSearchBar.tsx`
  - Replace PlayHeader formation/play inputs
  - Autocomplete dropdown with categorized results
  - Visual chips for selected concepts (color-coded)
  - Drag-to-reorder chips
  - X button on hover to remove chips
  - Smart parsing on input (detect role + concept patterns)
- [ ] Create `src/components/concepts/ConceptChip.tsx`
  - Color-coded by type (formation=blue, concept=green, group=purple)
  - Validation state icons (✓ ⚠ ❌)
  - Draggable with react-beautiful-dnd or similar
  - Tooltip on hover showing details
- [ ] Add autocomplete hook: `useConceptSearch(query)`
  - Debounced API call to `/api/concepts/search`
  - Categorizes results (Formations, Base Concepts, Groups)
  - Returns with metadata (tags, usage count)

**3.3 Concept Selection Sub-Dialog** (1 day)
- [ ] Create `src/components/concepts/ConceptSelectionDialog.tsx`
  - Appears when "Create Concept" toolbar button clicked
  - Lists available concepts (formations, base, groups)
  - Search filter
  - "[+ Create New Concept]" button → opens ConceptDialog
  - Select concept → applies to canvas, closes dialog

**3.4 Concept Dialog (Canvas-Centric)** (3 days)
- [ ] Create `src/components/concepts/ConceptDialog.tsx`
  - Modal dialog, center screen
  - Name input (with uniqueness validation)
  - Scope selector (Team / Playbook)
  - Targeting mode radio buttons (Absolute / Relative)
  - Ball position radio + [Flip Vertical] button
  - Play direction radio (if needed)
  - Full-size Canvas component (reused from Play Editor)
  - Toolbar (reused from Play Editor)
  - [Cancel] [Save as New] [Save Concept] buttons
- [ ] Add flip vertical logic: `flipConceptVertical(concept)`
  - Multiply all position_x by -1
  - Mirror drawing paths (flip control points)
  - Swap ball_position (left ↔ right)
- [ ] Add save vs save-as-new logic
  - "Save Concept": Update if editing, create if new
  - "Save as New": Always create copy (even when editing)

**3.5 Player Assignment UI** (2 days)
- [ ] Create `src/components/concepts/PlayerAssignmentEditor.tsx`
  - Mode-specific UI based on targeting_mode
  - **Absolute Role:** Role dropdown + route dropdown/draw
  - **Relative Selector:** Selector dropdown + numeric input + route
  - [+ Add Player] button to add rows
  - Delete button per row
- [ ] Create preset route selector dropdown
  - Fetches from `/api/routes/system` and `/api/routes/team`
  - Shows route tree (1-Flat, 2-Slant, ..., 9-Go)
  - Option to draw custom route instead

**Deliverables:**
- ✅ Type definitions
- ✅ UnifiedSearchBar with smart parsing
- ✅ ConceptSelectionDialog
- ✅ ConceptDialog with canvas-centric design
- ✅ PlayerAssignmentEditor
- ✅ Flip vertical feature

---

### Phase 4: Frontend - Integration (Week 4)
**Goal:** Integrate concept system into Play Editor and Playbook Manager

#### Tasks

**4.1 Play Editor Integration** (2 days)
- [ ] Update `src/components/plays/PlayHeader.tsx`
  - Replace formation/play inputs with UnifiedSearchBar
  - Keep tags separate (as per design)
  - Wire up concept application to canvas
- [ ] Update `src/components/plays/PlayToolbar.tsx`
  - Replace "Add Component" (G) button with "Create Concept"
  - Open ConceptSelectionDialog on click
- [ ] Add multi-select context menu
  - Shift-select multiple players/drawings
  - Show sub-dialog across top of canvas
  - [Save as Concept] button → opens ConceptDialog with pre-populated selections

**4.2 Concept Application Engine** (2 days)
- [ ] Create `src/utils/concept-application.ts`
  - `applyFormation(formation, canvas)` - Place players on canvas
  - `applyConcept(concept, canvas)` - Apply routes to players
  - `applyConceptGroup(group, canvas)` - Apply formation + concepts
  - `resolveRelativeSelector(selector, players)` - Find players by selector
  - `detectConflicts(concepts)` - Check if two concepts affect same player
  - `validateConceptApplication(concept, formation)` - Check requirements met
- [ ] Add conflict detection to UnifiedSearchBar
  - Validate on chip add
  - Show red highlight + error tooltip if conflict
  - Block invalid concepts from being added

**4.3 Playbook Manager Integration** (1 day)
- [ ] Add "Concept Library" view to Playbook Manager
  - Browse formations, concepts, groups
  - Filter by type, scope (team vs playbook)
  - Edit/delete concepts
  - Create new concepts (opens ConceptDialog)
- [ ] Add export/import concept libraries (future enhancement placeholder)

**4.4 Canvas Updates** (1 day)
- [ ] Update Canvas component to accept parameters
  - `backgroundColor` prop
  - `showFieldMarkings` prop
  - `readonly` prop
  - `size` prop (width/height)
  - `zoomLevel` prop
- [ ] Test Canvas in ConceptDialog context
  - Ensure toolbar works inside dialog
  - Ensure drawing/selection works
  - Ensure player linking works

**Deliverables:**
- ✅ UnifiedSearchBar integrated into PlayHeader
- ✅ Concept application engine with conflict detection
- ✅ Multi-select → Save as Concept workflow
- ✅ Concept Library in Playbook Manager
- ✅ Canvas parameterization for reuse

---

### Phase 5: Testing & Polish (Week 5)
**Goal:** End-to-end testing, bug fixes, and UX polish

#### Tasks

**5.1 End-to-End Testing** (2 days)
- [ ] Test full concept creation workflow
  - Create formation → apply to play → save
  - Create base concept → apply to play → save
  - Create concept group → apply to play → save
- [ ] Test smart parsing workflow
  - Type "X Post" → auto-compose → apply
  - Type "Twins Right Slice" → apply both
- [ ] Test Save vs Save as New
  - Edit concept → Save → verify updates
  - Edit concept → Flip → Save as New → verify copy created
- [ ] Test conflict detection
  - Apply conflicting concepts → verify blocked
  - Show appropriate error messages
- [ ] Test frecency search ranking
  - Use concepts → verify usage_count increments
  - Verify recent concepts appear first
- [ ] Test scope resolution
  - Team-level concepts visible across playbooks
  - Playbook-level concepts only visible in that playbook

**5.2 Performance Testing** (1 day)
- [ ] Test large concept libraries (100+ concepts)
  - Search performance
  - Autocomplete responsiveness
- [ ] Test Canvas rendering performance in dialog
- [ ] Optimize database queries (add missing indexes)
- [ ] Add pagination to concept lists if needed

**5.3 UX Polish** (2 days)
- [ ] Add loading states to all API calls
- [ ] Add toast notifications for success/error
  - "Formation saved successfully"
  - "Concept already exists"
  - "Conflict detected: X-Post affects same player as Slice"
- [ ] Add keyboard shortcuts
  - Esc to close ConceptDialog
  - Enter to save concept
  - Arrow keys to navigate autocomplete
- [ ] Add animations
  - Chip add/remove
  - Concept apply to canvas
  - Dialog open/close
- [ ] Add help tooltips
  - "?" icons next to targeting mode options
  - Explain difference between Absolute and Relative
- [ ] Accessibility audit
  - Keyboard navigation
  - Screen reader support
  - Color contrast

**Deliverables:**
- ✅ E2E test suite passing
- ✅ Performance optimizations
- ✅ UX polish (loading, toasts, shortcuts, animations)
- ✅ Accessibility compliance

---

## Testing Strategy

### Unit Tests
- **Database Layer:** Repository methods, query logic
- **Backend API:** Request validation, response formatting
- **Frontend Utils:** Concept application, conflict detection, flip vertical

### Integration Tests
- **API Endpoints:** Full request/response cycle with test database
- **Concept Application:** Apply formation/concept to canvas, verify state

### End-to-End Tests
- **User Workflows:**
  - Create and apply formation
  - Create and apply base concept (absolute + relative)
  - Create and apply concept group
  - Smart parsing workflow
  - Save vs Save as New
  - Flip vertical and save copy
  - Conflict detection

### Performance Tests
- Frecency search with 100+ concepts
- Canvas rendering with complex concepts
- Concurrent concept applications

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] All 6 migrations run successfully
- [ ] All repository tests pass
- [ ] All API endpoints functional and tested
- [ ] UnifiedSearchBar with smart parsing works
- [ ] ConceptDialog with canvas-centric design works
- [ ] Formations can be created and applied
- [ ] Base Concepts (Absolute + Relative) can be created and applied
- [ ] Concept Groups can be created and applied
- [ ] Flip vertical creates mirrored concepts
- [ ] Save vs Save as New workflows work
- [ ] Conflict detection blocks invalid concepts
- [ ] Frecency search ranks by usage
- [ ] All E2E tests pass
- [ ] UX polish complete (loading, toasts, shortcuts)

---

## Database Migration Checklist

### Pre-Migration
- [ ] Backup production database
- [ ] Test migrations on staging environment
- [ ] Verify rollback procedures

### Migration Order
1. `004_create_formations.sql`
2. `005_create_concepts.sql`
3. `006_create_concept_groups.sql`
4. `007_create_concept_applications.sql`
5. `008_create_role_terminology.sql` (includes seed data)
6. `009_create_preset_routes.sql` (includes seed data)

### Post-Migration
- [ ] Verify all tables created
- [ ] Verify indexes created
- [ ] Verify seed data inserted
- [ ] Run test suite against new schema
- [ ] Update database architecture docs

---

## API Endpoints Summary

### Formations
```
POST   /api/formations              Create formation
GET    /api/formations              List formations for team
GET    /api/formations/:id          Get formation with positions
PUT    /api/formations/:id          Update formation
DELETE /api/formations/:id          Delete formation
```

### Concepts
```
POST   /api/concepts                Create base concept
GET    /api/concepts                List concepts (scoped)
GET    /api/concepts/search?q=...   Search with frecency
GET    /api/concepts/:id            Get concept with assignments
PUT    /api/concepts/:id            Update concept
DELETE /api/concepts/:id            Delete concept
POST   /api/concepts/:id/clone      Clone concept (Save as New)
```

### Concept Groups
```
POST   /api/concept-groups          Create concept group
GET    /api/concept-groups          List groups (scoped)
GET    /api/concept-groups/:id      Get group with concepts
PUT    /api/concept-groups/:id      Update group
DELETE /api/concept-groups/:id      Delete group
```

### Utilities
```
GET    /api/teams/:teamId/roles     Get role terminology
PUT    /api/teams/:teamId/roles/:role  Update role name
GET    /api/routes/system           Get system routes
GET    /api/routes/team/:teamId     Get team routes
POST   /api/routes/team/:teamId     Create team route
```

---

## Component Hierarchy

```
PlayEditor
├── PlayHeader (updated)
│   └── UnifiedSearchBar (NEW)
│       ├── ConceptChip (NEW)
│       └── AutocompleteDropdown (NEW)
├── PlayToolbar (updated)
│   └── AddConceptButton (replaces AddComponent)
│       └── ConceptSelectionDialog (NEW)
│           └── ConceptDialog (NEW)
├── Canvas (parameterized)
│   └── [reused in ConceptDialog]
└── MultiSelectContextMenu (NEW)
    └── SaveAsConceptButton → ConceptDialog

PlaybookManager
└── ConceptLibrary (NEW)
    ├── ConceptList (NEW)
    └── ConceptDialog (reused)

ConceptDialog (shared)
├── Name input
├── Scope selector
├── Targeting mode selector
├── PlayerAssignmentEditor (NEW)
│   ├── AbsoluteRoleEditor (NEW)
│   └── RelativeSelectorEditor (NEW)
├── Ball position + Flip button
├── Canvas (full-size, with toolbar)
└── Save buttons (Cancel / Save as New / Save)
```

---

## File Structure

```
src/
├── api/
│   ├── formations.ts              (NEW)
│   ├── concepts.ts                (NEW)
│   ├── concept-groups.ts          (NEW)
│   ├── role-terminology.ts        (NEW)
│   └── preset-routes.ts           (NEW)
├── components/
│   ├── concepts/                  (NEW directory)
│   │   ├── UnifiedSearchBar.tsx
│   │   ├── ConceptChip.tsx
│   │   ├── ConceptSelectionDialog.tsx
│   │   ├── ConceptDialog.tsx
│   │   ├── PlayerAssignmentEditor.tsx
│   │   ├── ConceptLibrary.tsx
│   │   └── MultiSelectContextMenu.tsx
│   ├── plays/
│   │   ├── PlayHeader.tsx         (UPDATED)
│   │   └── PlayToolbar.tsx        (UPDATED)
│   └── canvas/
│       └── Canvas.tsx              (UPDATED - add props)
├── db/
│   ├── migrations/
│   │   ├── 004_create_formations.sql       (NEW)
│   │   ├── 005_create_concepts.sql         (NEW)
│   │   ├── 006_create_concept_groups.sql   (NEW)
│   │   ├── 007_create_concept_applications.sql (NEW)
│   │   ├── 008_create_role_terminology.sql (NEW)
│   │   └── 009_create_preset_routes.sql    (NEW)
│   └── repositories/
│       ├── FormationRepository.ts          (NEW)
│       ├── ConceptRepository.ts            (NEW)
│       ├── ConceptGroupRepository.ts       (NEW)
│       ├── RoleTerminologyRepository.ts    (NEW)
│       └── PresetRouteRepository.ts        (NEW)
├── types/
│   └── concept.types.ts           (NEW)
├── utils/
│   └── concept-application.ts     (NEW)
└── hooks/
    └── useConceptSearch.ts        (NEW)
```

---

## Risk Mitigation

### Technical Risks

**Risk:** JSONB query performance with large concept libraries
**Mitigation:** Add GIN indexes on drawing_data, test with 1000+ concepts, consider PostgreSQL tuning

**Risk:** Canvas performance in dialog with complex routes
**Mitigation:** Implement viewport culling, lazy load drawings, optimize re-renders

**Risk:** Conflict detection complexity with many concepts
**Mitigation:** Cache player assignments in memory, optimize conflict check algorithm, limit concepts per play

**Risk:** Smart parsing false positives (e.g., "X-Men" parsed as role + concept)
**Mitigation:** Use exact matching for roles, require space delimiter, add escape mechanism

### UX Risks

**Risk:** Unified search bar too complex for coaches
**Mitigation:** Add onboarding tooltips, video tutorial, fallback to separate inputs if needed

**Risk:** Concept Dialog overwhelming with too many options
**Mitigation:** Progressive disclosure (hide advanced options), default to simplest mode (Absolute Role)

**Risk:** Flip vertical produces unexpected results
**Mitigation:** Add preview before save, clearly label axis (vertical = left/right mirror)

---

## Future Work (Phase 2)

### Conditional Rules Targeting Mode
- Table: `concept_targeting_rules`
- UI: Condition builder with IF-THEN logic
- Backend: Rule evaluation engine
- Estimated: 2-3 weeks

### Route Classification (AI/ML)
- Pattern matching for common routes
- ML model for complex concepts
- Integration with concept creation workflow
- Estimated: 4-6 weeks

### Advanced Features
- Concept versioning (track changes over time)
- Concept import/export (JSON format)
- Concept sharing between teams
- Defensive concepts support
- Estimated: 1-2 weeks each

---

## Success Metrics

### User Adoption
- [ ] 80% of active coaches create at least one formation
- [ ] 60% of active coaches create at least one base concept
- [ ] 40% of active coaches create at least one concept group
- [ ] 50% of play creations use at least one concept

### Performance
- [ ] Search autocomplete responds < 200ms
- [ ] Concept application to canvas < 500ms
- [ ] ConceptDialog opens < 300ms
- [ ] No degradation with 100+ concepts in library

### Quality
- [ ] Zero critical bugs in production after 2 weeks
- [ ] 95% test coverage on core concept logic
- [ ] < 5% rollback rate on concept applications

---

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Week 1 | Database Layer |
| Phase 2 | Week 2 | Backend API |
| Phase 3 | Week 3 | Frontend Core Components |
| Phase 4 | Week 4 | Integration |
| Phase 5 | Week 5 | Testing & Polish |
| **Total** | **5 weeks** | **Phase 1 Complete** |

---

## References

- **Architecture Document:** [`docs/ConceptArchitecture.md`](../ConceptArchitecture.md)
- **Database Architecture:** [`docs/DatabaseArchitecture.md`](../DatabaseArchitecture.md)
- **Design Document:** [`docs/PlaySmithDesignDocument.md`](../PlaySmithDesignDocument.md)
- **Drawing Types:** [`src/types/drawing.types.ts`](../../src/types/drawing.types.ts)

---

## Approval

- [ ] Architecture reviewed and approved
- [ ] Implementation plan reviewed and approved
- [ ] Timeline reviewed and approved
- [ ] Resources allocated
- [ ] Ready to begin Phase 1

**Approved by:** _______________________
**Date:** _______________________
