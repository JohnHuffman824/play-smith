# Playbook Editor Integration Design

**Date:** 2025-12-09
**Status:** Approved
**Author:** AI Assistant with Jack Huffman

## Overview

This document describes the integration of the playbook editor UI (exported from Figma in `playbookEditorInterface/`) into the Play Smith application. The integration connects the playbook manager to the playbook editor to the play editor, implementing the complete playbook editing workflow.

---

## High-Level Architecture

The playbook editor integration follows a three-layer architecture:

**Backend Layer:**
- New `sections` table for organizing plays within playbooks
- Enhanced `plays` table with `play_type` and `section_id` columns
- RESTful API endpoints under `/api/playbooks/:playbookId/*`
- Uses existing repositories with new SectionRepository

**State Management Layer:**
- Extended ThemeContext adds `positionNaming` and `fieldLevel` settings
- Settings persist in localStorage, shared across entire app
- No new contexts needed - playbook data is page-local state

**UI Layer:**
- `src/components/playbook-editor/` - specific components (PlayCard, Toolbar, ListView)
- `src/components/shared/` - reusable components (Modal, SettingsDialog, ShareDialog)
- `src/pages/PlaybookEditorPage.tsx` - orchestrates data fetching and state
- Connects to existing PlayEditorPage via routing

**Key Principles:**
- Clean separation of concerns (data, state, UI)
- Reuse existing patterns (matches auth, routing structure)
- Fix quality issues before integration (no technical debt)
- TDD throughout (tests before implementation)

---

## Database Schema

### New `sections` Table

```sql
CREATE TABLE sections (
  id BIGSERIAL PRIMARY KEY,
  playbook_id BIGINT NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(playbook_id, display_order)
);

CREATE INDEX idx_sections_playbook_id ON sections(playbook_id);

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Enhanced `plays` Table

Only 2 additions needed (most columns already exist):

```sql
CREATE TYPE play_type AS ENUM ('pass', 'run');

ALTER TABLE plays ADD COLUMN play_type play_type;
ALTER TABLE plays ADD COLUMN section_id BIGINT REFERENCES sections(id) ON DELETE SET NULL;
CREATE INDEX idx_plays_section ON plays(section_id);
```

**Existing columns we leverage:**
- ✅ `name`, `formation_id`, `personnel_id`, `defensive_formation_id`
- ✅ `display_order`, `updated_at` (serves as lastModified)
- ✅ `play_tags` junction table for many-to-many tags

**Key Decisions:**
- `section_id` nullable (plays can exist without sections)
- `ON DELETE SET NULL` (deleting section keeps plays, just unassigns them)
- `play_type` nullable (can be unset initially)

---

## API Layer

### New API Endpoints (Nested RESTful)

```typescript
// Playbook details
GET    /api/playbooks/:playbookId
Response: { id, name, description, team_id, created_at, updated_at }

// Sections
GET    /api/playbooks/:playbookId/sections
Response: Section[] (with play count per section)

POST   /api/playbooks/:playbookId/sections
Body: { name }
Response: Created section

PUT    /api/sections/:sectionId
Body: { name?, display_order? }
Response: Updated section

DELETE /api/sections/:sectionId
Response: 204 No Content

// Plays (lightweight - no full geometry)
GET    /api/playbooks/:playbookId/plays
Response: Play[] (id, name, section_id, play_type, formation_id,
          personnel_id, defensive_formation_id, tags[], updated_at)

POST   /api/playbooks/:playbookId/plays
Body: { name, section_id? }
Response: Created play (minimal - full editing happens in PlayEditorPage)

PUT    /api/plays/:playId
Body: { name?, section_id?, play_type? }
Response: Updated play

DELETE /api/plays/:playId
Response: 204 No Content

POST   /api/plays/:playId/duplicate
Response: New play (copy with "(Copy)" suffix)
```

**Data Enrichment:**
- API joins with `formations`, `personnel_packages`, `tags` tables
- Returns display names (not just IDs) for frontend
- Includes `updated_at` formatted for display

**Authorization:**
- All endpoints validate user has access via team membership or playbook shares
- Create/Update/Delete require 'editor' or 'owner' role

---

## Context Management

### Extended ThemeContext

```typescript
// src/contexts/ThemeContext.tsx (extended)

interface ThemeContextType {
  // Existing
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void

  // New: Field settings (shared across app)
  positionNaming: string
  setPositionNaming: (naming: string) => void
  fieldLevel: string
  setFieldLevel: (level: string) => void
}

// All settings persist in localStorage
// Keys: 'theme', 'positionNaming', 'fieldLevel'
```

**Migration from ConfigContext:**
- Delete `playbookEditorInterface/contexts/ConfigContext.tsx`
- Update all components to use `useTheme()` instead of `useConfig()`
- Import: `import { useTheme } from '@/contexts/ThemeContext'`

**Settings Integration:**
- SettingsDialog reads/writes via `useTheme()`
- Settings apply globally (PlaybookEditor AND PlayEditor)
- Dark mode class toggling unchanged (`document.documentElement.classList`)

**No Additional Contexts:**
- Playbook data lives in PlaybookEditorPage local state
- Fetched via API on mount, updated via API calls
- No global playbook/section state management needed

---

## Navigation Flow

```
PlaybookManagerPage (/playbooks)
  Uses: PlaybookContext, TeamContext
  Component: PlaybookCard
  On Click: navigate(`/playbooks/${id}`)
    ↓
PlaybookEditorPage (/playbooks/:playbookId)
  Fetches: Playbook + sections + plays
  Components: From playbookEditorInterface (migrated)
  On "Open Play": navigate(`/playbooks/${playbookId}/plays/${playId}`)
  On "Back": navigate('/playbooks')
    ↓
PlayEditorPage (/playbooks/:playbookId/plays/:playId)
  Existing: Fully functional play editor
  Components: Toolbar, Canvas, PlayHeader, PlayCardsSection
```

**Key Integration Points:**

1. **PlaybookCard** (already implemented):
   - Line 37: `navigate(/playbooks/${id})` ✅

2. **PlaybookEditorPage** (implementing):
   - Extract `playbookId` from route params
   - Fetch data on mount
   - Pass handlers to PlaybookEditor component

3. **Navigation Handlers**:
   ```typescript
   const handleBack = () => navigate('/playbooks')
   const handleOpenPlay = (playId) =>
     navigate(`/playbooks/${playbookId}/plays/${playId}`)
   ```

---

## Component Structure

### File Organization (Shared Components Separated)

```
src/components/playbook-editor/
├── PlaybookEditorToolbar.tsx
├── PlayCard.tsx
└── PlayListView.tsx

src/components/shared/
├── Modal.tsx
├── SettingsDialog.tsx
└── ShareDialog.tsx

src/types/
└── playbook.ts (shared interfaces)

src/pages/
└── PlaybookEditorPage.tsx

playbookEditorInterface/
└── [DELETE entire folder after migration]
```

### Component Responsibilities

- **PlaybookEditorPage**: Orchestrates data fetching, manages local state
- **PlaybookEditorToolbar**: Search, filters, view toggle, section filters
- **PlayCard**: Display play with thumbnail, type badge, tags, menu actions
- **PlayListView**: Table view of plays with sortable columns
- **Modal**: Reusable dialog for create/edit operations
- **SettingsDialog**: Theme + field settings (reads/writes ThemeContext)
- **ShareDialog**: Team sharing (future - stub for now)

---

## Code Quality Fixes

### Issues Found in playbookEditorInterface

**Critical (Must Fix Before Migration):**

1. **Interface Duplication** - DRY Violation
   - `Play` interface in both `PlaybookEditor.tsx:30` and `PlayListView.tsx:17`
   - Fix: Extract to `src/types/playbook.ts`

2. **Alert/Prompt Usage** - UX Anti-pattern
   - `alert()` calls in `PlaybookEditor.tsx:244, 272, 288, 319, 324, 334`
   - `prompt()` call in `PlaybookEditor.tsx:272`
   - Fix: Use Modal component for all dialogs

3. **Missing Navigation**
   - Lines 244, 264: `alert()` placeholders
   - Fix: Use `useNavigate()` from React Router

4. **Line Length Violations**
   - Many className strings exceed 80 characters
   - Fix: Break into multiple lines or extract to constants

5. **Incomplete Functionality**
   - `SettingsDialog.tsx:155-168`: Empty onClick handlers
   - Fix: Implement or remove

6. **Hardcoded URL**
   - `ShareDialog.tsx:70`: `https://playsmith.app/shared/...`
   - Fix: Use environment variable or actual route

**Good Practices Already Present:**
- ✅ No semicolons (correct per mako-review)
- ✅ Uses `==` and `!=` (correct)
- ✅ Single quotes for strings
- ✅ Named functions use `function` keyword
- ✅ Good use of constants
- ✅ Clean component separation

---

## Migration Strategy

### Phase 1: Fix Code Quality Issues (In Place)

Before moving files to `src/`, fix all issues in `playbookEditorInterface/`:

1. Extract shared types to `types.ts`
2. Replace all `alert()` calls with Modal dialogs
3. Replace `prompt()` with input modals
4. Fix line lengths (break at 80 chars)
5. Remove hardcoded URLs
6. Complete or remove incomplete features

### Phase 2: Component Migration

Move cleaned files to proper locations:

1. Move to `src/components/playbook-editor/`:
   - PlaybookEditorToolbar.tsx
   - PlayCard.tsx
   - PlayListView.tsx

2. Move to `src/components/shared/`:
   - Modal.tsx
   - SettingsDialog.tsx
   - ShareDialog.tsx

3. Move to `src/types/`:
   - playbook.ts (shared interfaces)

4. Update imports:
   - Replace ConfigContext → ThemeContext
   - Fix relative paths for new locations

### Phase 3: Context Integration

1. Extend ThemeContext:
   - Add `positionNaming` and `fieldLevel` state
   - Add localStorage persistence
   - Update type definitions

2. Update all migrated components:
   - Replace `useConfig()` → `useTheme()`
   - Update import paths

3. Delete ConfigContext:
   - Remove `playbookEditorInterface/contexts/ConfigContext.tsx`

### Phase 4: API Implementation

1. Create migration file: `006_add_sections_and_play_type.sql`
2. Implement API endpoints (TDD):
   - Playbooks endpoints
   - Sections endpoints
   - Plays endpoints
3. Create SectionRepository
4. Add tests for all endpoints

### Phase 5: Page Integration

1. Replace PlaybookEditorPage placeholder
2. Implement data fetching logic
3. Wire up navigation handlers
4. Add loading/error states
5. Test complete flow end-to-end

### Phase 6: Cleanup

1. Delete `playbookEditorInterface/` folder
2. Run all tests
3. Fix any remaining issues
4. Code review against mako-review.md

---

## Implementation Order

Following "Clean Foundation First" approach (Option A):

1. ✅ **Design Document** (this file)
2. **Database Migration** (sections table, play_type column)
3. **API Layer** (endpoints with TDD)
4. **Context Extension** (ThemeContext)
5. **Code Quality Fixes** (in playbookEditorInterface/)
6. **Component Migration** (move to src/)
7. **Page Integration** (PlaybookEditorPage)
8. **Testing & Polish** (end-to-end validation)
9. **Cleanup** (delete playbookEditorInterface/)

---

## Success Criteria

Integration is complete when:

1. ✅ Database schema updated (sections table, play_type column)
2. ✅ API endpoints functional and tested
3. ✅ ThemeContext extended with field settings
4. ✅ All code quality issues fixed
5. ✅ Components migrated to proper src/ locations
6. ✅ PlaybookEditorPage fully functional with real data
7. ✅ Navigation flow works: Manager → Editor → Play Editor
8. ✅ Back navigation returns to manager
9. ✅ Settings persist and apply globally
10. ✅ All code passes mako-review.md checks
11. ✅ Comprehensive test coverage
12. ✅ No console errors or warnings
13. ✅ UI matches Figma design exactly
14. ✅ `playbookEditorInterface/` folder deleted

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration strategy | Clean foundation first | Prevents technical debt, cleaner git history |
| Database schema | Separate sections table | Proper relational structure, flexibility |
| ThemeContext | Extend with field settings | Single source of truth for settings |
| API endpoints | Nested RESTful routes | Shows hierarchy, easier authorization |
| Component organization | Separate shared components | Better reusability across app |
| Navigation | React Router navigate() | Follows existing patterns |
| Code quality | Fix before migration | Easier to review, prevents debt |
| Testing | TDD throughout | Ensures correctness from start |

---

## Next Steps

1. Use `superpowers:writing-plans` to create detailed implementation plan
2. Execute plan following TDD workflow
3. Use `superpowers:requesting-code-review` before merging
