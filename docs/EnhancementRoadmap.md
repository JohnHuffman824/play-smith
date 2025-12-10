# Enhancement Roadmap - Concept Architecture

**Created:** 2025-12-10
**Status:** In Progress
**Based on:** MAKO_REVIEW_ANALYSIS.md

---

## Overview

This document tracks enhancements to the Concept Architecture implementation. Items are organized by priority tier with estimated effort and completion status.

---

## 🟡 Short Term (Quick Wins)

**Goal:** Improve UX and developer experience
**Total Effort:** ~3-4 hours
**Target:** This week

### 1. ✅ Replace Magic Strings with Constants
- **Status:** COMPLETE
- **Effort:** 30 minutes
- **Completed:** 2025-12-10
- **Files Modified:**
  - `src/constants/concept.constants.ts` (added 28 constants)
  - `src/pages/PlayEditorPage.tsx` (replaced magic strings)
- **Commit:** b546b9d

### 2. Add Form Validation to ConceptDialog
- **Status:** Not Started
- **Effort:** 45 minutes
- **Priority:** HIGH
- **Requirements:**
  - Name validation (min 1, max 100 chars)
  - At least one assignment required
  - Visual error messages below inputs
  - Disable save button when invalid
- **Files to Modify:**
  - `src/components/concepts/ConceptDialog.tsx`
- **Acceptance Criteria:**
  - [ ] Name cannot be empty
  - [ ] Name max 100 characters
  - [ ] Error message shows below name input
  - [ ] Save button disabled when invalid
  - [ ] Error clears when user fixes issue

### 3. Split Long Import Lines
- **Status:** Not Started
- **Effort:** 15 minutes
- **Priority:** MEDIUM
- **Files with Long Imports (>80 chars):**
  - `src/components/concepts/ConceptDialog.tsx:1`
  - `src/components/concepts/AddConceptSubDialog.tsx:1-5`
  - `src/pages/PlayEditorPage.tsx:16-22`
  - `src/hooks/useConceptData.ts:1-3`
- **Pattern:**
  ```typescript
  // Before:
  import type { BaseConcept, TargetingMode, BallPosition, PlayDirection } from '../../types/concept.types'

  // After:
  import type {
    BaseConcept,
    TargetingMode,
    BallPosition,
    PlayDirection
  } from '../../types/concept.types'
  ```
- **Acceptance Criteria:**
  - [ ] All imports under 80 characters per line
  - [ ] Multi-line imports use consistent formatting
  - [ ] Build still passes

### 4. Add JSDoc Comments to Public APIs
- **Status:** Not Started
- **Effort:** 2-3 hours
- **Priority:** MEDIUM
- **Files to Document:**
  - `src/hooks/useConceptData.ts` (all exported functions)
  - `src/hooks/useUnifiedSearch.ts` (hook return values)
  - `src/db/repositories/FormationRepository.ts` (all methods)
  - `src/db/repositories/BaseConceptRepository.ts` (all methods)
  - `src/db/repositories/ConceptGroupRepository.ts` (all methods)
  - `src/db/repositories/ConceptApplicationRepository.ts` (all methods)
- **JSDoc Template:**
  ```typescript
  /**
   * Creates a new formation with player positions
   * @param teamId - The team ID this formation belongs to
   * @param name - Name of the formation (e.g., "Trips Right")
   * @param positions - Array of player positions with roles and coordinates
   * @param description - Optional description of the formation
   * @returns The created formation with positions
   * @throws {Error} If teamId is invalid or positions array is empty
   */
  ```
- **Acceptance Criteria:**
  - [ ] All public functions documented
  - [ ] Parameters described with types
  - [ ] Return values documented
  - [ ] Throws clauses documented
  - [ ] VSCode autocomplete shows descriptions

---

## 🟢 Medium Term (Quality Assurance)

**Goal:** Comprehensive test coverage following TDD
**Total Effort:** ~12-16 hours
**Target:** This sprint (next 1-2 weeks)

### 5. Repository Unit Tests
- **Status:** Not Started
- **Effort:** 4-6 hours
- **Priority:** HIGH
- **Approach:** TDD - Write tests first, verify they fail, ensure they pass
- **Files to Create:**
  - `tests/unit/repositories/FormationRepository.test.ts`
  - `tests/unit/repositories/BaseConceptRepository.test.ts`
  - `tests/unit/repositories/ConceptGroupRepository.test.ts`
  - `tests/unit/repositories/ConceptApplicationRepository.test.ts`
- **Test Coverage:**
  - **FormationRepository:**
    - [ ] create: inserts formation + positions
    - [ ] findById: returns formation with positions
    - [ ] getTeamFormations: filters by team_id
    - [ ] update: replaces positions correctly
    - [ ] delete: cascades to positions
  - **BaseConceptRepository:**
    - [ ] Frecency algorithm: correct ranking
    - [ ] search: returns results by frecency score
    - [ ] incrementUsage: updates count and timestamp
    - [ ] Scoping: team vs playbook filtering
    - [ ] create: inserts concept + assignments
  - **ConceptGroupRepository:**
    - [ ] findById: returns group with formation + concepts
    - [ ] create: links formation and concepts correctly
    - [ ] update: replaces concept links
  - **ConceptApplicationRepository:**
    - [ ] create: applies concept to play
    - [ ] getPlayApplications: returns ordered list
    - [ ] delete: removes application
    - [ ] reorder: updates order_index
- **Acceptance Criteria:**
  - [ ] 90%+ repository code coverage
  - [ ] All CRUD operations tested
  - [ ] Error cases tested (invalid IDs, missing data)
  - [ ] Database transactions work correctly
  - [ ] Tests run in isolation (no dependencies)

### 6. Hook Unit Tests
- **Status:** Not Started
- **Effort:** 3-4 hours
- **Priority:** HIGH
- **Approach:** TDD with React Testing Library
- **Files to Create:**
  - `tests/unit/hooks/useConceptData.test.ts`
  - `tests/unit/hooks/useUnifiedSearch.test.ts`
- **Test Coverage:**
  - **useConceptData:**
    - [ ] Fetches all entities on mount (5 parallel requests)
    - [ ] Loading states work correctly
    - [ ] Error handling: 401 redirects to login
    - [ ] Error handling: 403 shows error message
    - [ ] createFormation: calls API and refetches
    - [ ] updateConcept: calls API and refetches
    - [ ] deleteConcept: calls API and refetches
    - [ ] applyConceptToPlay: increments usage count
  - **useUnifiedSearch:**
    - [ ] Debounces search (300ms delay)
    - [ ] Smart parsing: "X Post" → role + concept
    - [ ] Returns categorized results (formations, concepts, groups)
    - [ ] Frecency ranking works correctly
    - [ ] Empty query returns empty results
- **Acceptance Criteria:**
  - [ ] 80%+ hook code coverage
  - [ ] All data fetching scenarios tested
  - [ ] Auth redirects tested
  - [ ] Debounce timing verified

### 7. Component Tests
- **Status:** Not Started
- **Effort:** 4-6 hours
- **Priority:** MEDIUM
- **Approach:** TDD with React Testing Library + user-event
- **Files to Create:**
  - `tests/unit/components/UnifiedSearchBar.test.tsx`
  - `tests/unit/components/ConceptDialog.test.tsx`
  - `tests/unit/components/ConceptChip.test.tsx`
  - `tests/unit/components/AddConceptSubDialog.test.tsx`
- **Test Coverage:**
  - **UnifiedSearchBar:**
    - [ ] Renders search input
    - [ ] Shows dropdown on input
    - [ ] Adds chip on selection
    - [ ] Removes chip on X click
    - [ ] Reorders chips on drag and drop
    - [ ] Smart parsing triggers correctly
  - **ConceptDialog:**
    - [ ] Renders all form fields
    - [ ] Disables save without name
    - [ ] Calls onSave with correct data
    - [ ] Switches between team/playbook scope
    - [ ] Targeting mode toggle works
    - [ ] Ball position selection works
  - **ConceptChip:**
    - [ ] Renders with correct color
    - [ ] Draggable attribute set
    - [ ] Remove button calls handler
  - **AddConceptSubDialog:**
    - [ ] Shows all three tabs
    - [ ] Search filters results
    - [ ] Create new button opens ConceptDialog
- **Acceptance Criteria:**
  - [ ] 70%+ component code coverage
  - [ ] User interactions tested
  - [ ] Accessibility tested (keyboard nav, screen readers)
  - [ ] Tests use semantic queries (not test IDs)

### 8. Integration Tests
- **Status:** Not Started
- **Effort:** 2-3 hours
- **Priority:** MEDIUM
- **Files to Create:**
  - `tests/integration/ConceptFlow.test.tsx`
- **Test Coverage:**
  - [ ] Create formation → apply to play → verify canvas
  - [ ] Create concept → apply to play → verify drawings
  - [ ] Search concept → select → auto-applies
  - [ ] Multi-select on canvas → save as concept
  - [ ] Edit concept → verify all plays updated
- **Acceptance Criteria:**
  - [ ] 60%+ integration coverage
  - [ ] Happy paths tested end-to-end
  - [ ] Tests use real database (not mocks)

---

## 🔵 Long Term (Major Features)

**Goal:** Advanced features for better UX and performance
**Total Effort:** ~8-12 hours
**Target:** Next sprint (2-4 weeks)

### 9. React Query Integration
- **Status:** Not Started
- **Effort:** 3-4 hours
- **Priority:** MEDIUM
- **Benefits:**
  - Automatic caching (faster page loads)
  - Optimistic updates (instant UI feedback)
  - Background refetching
  - Deduplication of requests
  - Better loading states
- **Implementation Plan:**
  1. Install `@tanstack/react-query`
  2. Create `QueryClient` provider in `src/index.tsx`
  3. Convert `useConceptData` to use `useQuery` hooks
  4. Convert mutations to use `useMutation` hooks
  5. Add optimistic updates for CRUD operations
  6. Test cache invalidation
- **Files to Modify:**
  - `src/hooks/useConceptData.ts` (replace fetch logic)
  - `src/pages/PlayEditorPage.tsx` (wrap with QueryClientProvider)
  - `package.json` (add dependency)
- **Acceptance Criteria:**
  - [ ] Formations cached after first load
  - [ ] Concepts cached after first load
  - [ ] Optimistic updates work (instant UI)
  - [ ] Cache invalidates on mutations
  - [ ] Background refetching enabled
  - [ ] Loading states improved
  - [ ] Error states improved

### 10. Undo/Redo System for Concept Editor
- **Status:** Not Started
- **Effort:** 4-6 hours
- **Priority:** LOW
- **Benefits:**
  - Safer editing experience
  - Confidence to experiment
  - Standard UX pattern (Ctrl+Z / Ctrl+Y)
- **Implementation Plan:**
  1. Implement Command pattern
  2. Create history stack in ConceptContext
  3. Capture canvas state on each action
  4. Add undo/redo buttons to toolbar
  5. Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  6. Limit history (last 50 actions)
- **Commands to Track:**
  - Add player
  - Remove player
  - Move player
  - Draw path
  - Erase drawing
  - Change color
  - Change fill
- **Files to Create:**
  - `src/commands/CanvasCommand.ts` (abstract base)
  - `src/commands/AddPlayerCommand.ts`
  - `src/commands/DrawPathCommand.ts`
  - etc.
- **Files to Modify:**
  - `src/contexts/ConceptContext.tsx` (add history stack)
  - `src/components/concepts/ConceptToolbar.tsx` (add undo/redo buttons)
- **Acceptance Criteria:**
  - [ ] Undo reverses last action
  - [ ] Redo restores undone action
  - [ ] History limit (50 actions)
  - [ ] Keyboard shortcuts work
  - [ ] History clears on save
  - [ ] Visual feedback (button states)

### 11. Concept Thumbnails
- **Status:** Not Started
- **Effort:** 3-4 hours
- **Priority:** LOW
- **Benefits:**
  - Visual preview in search results
  - Easier to identify concepts
  - Better UX for browsing
- **Implementation Plan:**
  1. Add thumbnail generation to Canvas component
  2. Capture canvas as PNG on concept save
  3. Store thumbnail in database (bytea or S3)
  4. Add thumbnail column to `base_concepts` table
  5. Display thumbnails in search dropdown
  6. Add thumbnail to concept cards
- **Technical Approach:**
  - Use `html-to-image` library
  - Generate 200x150px thumbnails
  - Store as base64 or upload to S3
  - Lazy load thumbnails in search
- **Files to Create:**
  - `src/db/migrations/009_add_concept_thumbnails.sql`
  - `src/utils/thumbnailGenerator.ts`
- **Files to Modify:**
  - `src/components/canvas/Canvas.tsx` (add capture method)
  - `src/components/concepts/ConceptDialog.tsx` (generate on save)
  - `src/components/search/SearchDropdown.tsx` (display thumbnails)
  - `src/db/types.ts` (add thumbnail field)
- **Acceptance Criteria:**
  - [ ] Thumbnails generated on concept save
  - [ ] Thumbnails stored in database
  - [ ] Thumbnails display in search dropdown
  - [ ] Thumbnails display in concept browser
  - [ ] Thumbnails lazy load
  - [ ] Fallback for missing thumbnails

---

## Future Considerations

### Phase 2 Features (from ConceptArchitecture.md)
- **Status:** Not Started
- **Target:** Future sprint
- **Features:**
  - Semantic Targeting (player attributes: speed, strength, etc.)
  - Conditional Assignments (if/then rules)
  - Motion Assignments (pre-snap player movement)
  - Concept Inheritance (extend base concepts)
  - Advanced Search (filters, tags, categories)

### Performance Optimizations
- **Status:** Not Started
- **Ideas:**
  - Virtual scrolling for large concept lists
  - Canvas rendering optimizations (WebGL?)
  - Lazy loading for dialogs
  - Code splitting for routes
  - Bundle size optimization

### Developer Experience
- **Status:** Not Started
- **Ideas:**
  - Storybook for component development
  - E2E tests with Playwright
  - CI/CD pipeline
  - Automated deployment
  - Error tracking (Sentry)

---

## Progress Tracking

### Completion Summary
- **Short Term:** 1/4 complete (25%)
- **Medium Term:** 0/4 complete (0%)
- **Long Term:** 0/3 complete (0%)
- **Overall:** 1/11 complete (9%)

### Recent Updates
- **2025-12-10:** Created roadmap, completed magic string elimination

### Next Session Goals
1. Complete short-term items (form validation, imports, JSDoc)
2. Start repository tests (TDD approach)
3. Hook tests if time permits

---

## Notes

- Follow TDD for all testing work (write tests first, see them fail, make them pass)
- Commit frequently with descriptive messages
- Update this document as items are completed
- Add new enhancement ideas as they arise
- Consider user feedback and performance metrics

---

*Last Updated: 2025-12-10*
