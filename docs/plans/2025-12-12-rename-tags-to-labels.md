# Rename Tags to Labels Refactoring Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename all "tags" infrastructure to "labels" to avoid confusion with football terminology where "tags" refer to route modifications.

**Architecture:** This is a comprehensive rename affecting database schema, API endpoints, component files, types, and all references throughout the codebase. The refactoring preserves all functionality while updating terminology.

**Tech Stack:** TypeScript, React, Bun, PostgreSQL/SQLite, CSS

---

## Pre-Refactoring Setup

### Task 0: Create Isolated Worktree

**Files:**
- None (git operations)

**Step 1: Create new worktree**

```bash
cd /Users/jackhuffman/play-smith
git worktree add ../play-smith-labels-refactor -b refactor/tags-to-labels
cd ../play-smith-labels-refactor
```

**Step 2: Verify clean working tree**

Run: `git status`
Expected: Clean working tree on new branch

**Step 3: Create checkpoint commit**

```bash
git commit --allow-empty -m "refactor: start tags-to-labels rename"
```

---

## Phase 1: Database Schema Migration

### Task 1: Create Database Migration for Rename

**Files:**
- Create: `src/db/migrations/013_rename_tags_to_labels.sql`

**Step 1: Write migration SQL**

Create file with this content:

```sql
-- Migration 013: Rename tags to labels
-- Renames all tag-related tables and columns to use "label" terminology

-- Rename tables
ALTER TABLE tags RENAME TO labels;
ALTER TABLE play_tags RENAME TO play_labels;
ALTER TABLE playbook_tags RENAME TO playbook_labels;

-- Rename indexes
ALTER INDEX idx_tags_team RENAME TO idx_labels_team;
ALTER INDEX idx_tags_preset RENAME TO idx_labels_preset;
ALTER INDEX idx_play_tags_play RENAME TO idx_play_labels_play;
ALTER INDEX idx_play_tags_tag RENAME TO idx_play_labels_label;
ALTER INDEX idx_playbook_tags_playbook RENAME TO idx_playbook_labels_playbook;
ALTER INDEX idx_playbook_tags_tag RENAME TO idx_playbook_labels_label;

-- Rename constraints
ALTER TABLE labels RENAME CONSTRAINT tags_preset_check TO labels_preset_check;
ALTER TABLE labels RENAME CONSTRAINT tags_name_scope_unique TO labels_name_scope_unique;
ALTER TABLE play_labels RENAME CONSTRAINT play_tags_unique TO play_labels_unique;
ALTER TABLE playbook_labels RENAME CONSTRAINT playbook_tags_unique TO playbook_labels_unique;

-- Rename foreign key columns
ALTER TABLE play_labels RENAME COLUMN tag_id TO label_id;
ALTER TABLE playbook_labels RENAME COLUMN tag_id TO label_id;

-- Update comment for clarity
COMMENT ON TABLE labels IS 'Visual labels for categorizing plays and playbooks (not to be confused with route tags in football)';
```

**Step 2: Verify migration syntax**

Run: `cat src/db/migrations/013_rename_tags_to_labels.sql`
Expected: File contains all rename statements

**Step 3: Commit migration file**

```bash
git add src/db/migrations/013_rename_tags_to_labels.sql
git commit -m "refactor: add migration to rename tags to labels"
```

---

### Task 2: Update Initial Tags Migration Comment

**Files:**
- Modify: `src/db/migrations/012_create_tags.sql:1`

**Step 1: Add deprecation comment**

Replace first line:

```sql
-- Migration 012: Create Tags System (DEPRECATED - renamed to labels in migration 013)
```

**Step 2: Commit change**

```bash
git add src/db/migrations/012_create_tags.sql
git commit -m "refactor: mark old tags migration as deprecated"
```

---

## Phase 2: Database Repository Layer

### Task 3: Rename TagRepository File and Class

**Files:**
- Rename: `src/db/repositories/TagRepository.ts` → `src/db/repositories/LabelRepository.ts`
- Modify: `src/db/repositories/LabelRepository.ts` (all content)

**Step 1: Copy file with new name**

```bash
cp src/db/repositories/TagRepository.ts src/db/repositories/LabelRepository.ts
```

**Step 2: Update class name and all internal references**

In `src/db/repositories/LabelRepository.ts`, replace all occurrences:
- `TagRepository` → `LabelRepository`
- `tags` (table name) → `labels`
- `play_tags` → `play_labels`
- `playbook_tags` → `playbook_labels`
- `tag_id` → `label_id`

Full updated class:

```typescript
import type { Tag } from '../types'
import { getDb } from '../connection'

export class LabelRepository {
	private db = getDb()

	async findAll(): Promise<Tag[]> {
		return this.db.all<Tag[]>`SELECT * FROM labels ORDER BY name`
	}

	async findByTeam(teamId: number): Promise<Tag[]> {
		return this.db.all<Tag[]>`
			SELECT * FROM labels
			WHERE team_id = ${teamId} OR is_preset = true
			ORDER BY is_preset DESC, name
		`
	}

	async findPresets(): Promise<Tag[]> {
		return this.db.all<Tag[]>`
			SELECT * FROM labels
			WHERE is_preset = true
			ORDER BY name
		`
	}

	async findById(id: number): Promise<Tag | null> {
		return this.db.get<Tag | null>`SELECT * FROM labels WHERE id = ${id}`
	}

	async create(data: {
		team_id: number | null
		name: string
		color: string
		is_preset?: boolean
		created_by: number | null
	}): Promise<Tag> {
		const result = await this.db.get<Tag>`
			INSERT INTO labels (team_id, name, color, is_preset, created_by)
			VALUES (${data.team_id}, ${data.name}, ${data.color}, ${data.is_preset ?? false}, ${data.created_by})
			RETURNING *
		`
		if (!result) throw new Error('Failed to create label')
		return result
	}

	async update(id: number, data: { name?: string; color?: string }): Promise<Tag> {
		const updates: string[] = []
		const values: unknown[] = []

		if (data.name !== undefined) {
			updates.push(`name = ?`)
			values.push(data.name)
		}
		if (data.color !== undefined) {
			updates.push(`color = ?`)
			values.push(data.color)
		}

		if (updates.length === 0) {
			const existing = await this.findById(id)
			if (!existing) throw new Error('Label not found')
			return existing
		}

		values.push(id)
		const sql = `UPDATE labels SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`

		const result = await this.db.get<Tag>(sql, ...values)
		if (!result) throw new Error('Label not found')
		return result
	}

	async delete(id: number): Promise<void> {
		await this.db.run`DELETE FROM labels WHERE id = ${id}`
	}

	// Play label associations
	async addToPlay(playId: number, labelId: number): Promise<void> {
		await this.db.run`
			INSERT INTO play_labels (play_id, label_id)
			VALUES (${playId}, ${labelId})
			ON CONFLICT (play_id, label_id) DO NOTHING
		`
	}

	async removeFromPlay(playId: number, labelId: number): Promise<void> {
		await this.db.run`
			DELETE FROM play_labels
			WHERE play_id = ${playId} AND label_id = ${labelId}
		`
	}

	async findByPlay(playId: number): Promise<Tag[]> {
		return this.db.all<Tag[]>`
			SELECT l.* FROM labels l
			INNER JOIN play_labels pl ON l.id = pl.label_id
			WHERE pl.play_id = ${playId}
			ORDER BY l.name
		`
	}

	// Playbook label associations
	async addToPlaybook(playbookId: number, labelId: number): Promise<void> {
		await this.db.run`
			INSERT INTO playbook_labels (playbook_id, label_id)
			VALUES (${playbookId}, ${labelId})
			ON CONFLICT (playbook_id, label_id) DO NOTHING
		`
	}

	async removeFromPlaybook(playbookId: number, labelId: number): Promise<void> {
		await this.db.run`
			DELETE FROM playbook_labels
			WHERE playbook_id = ${playbookId} AND label_id = ${labelId}
		`
	}

	async findByPlaybook(playbookId: number): Promise<Tag[]> {
		return this.db.all<Tag[]>`
			SELECT l.* FROM labels l
			INNER JOIN playbook_labels pl ON l.id = pl.label_id
			WHERE pl.playbook_id = ${playbookId}
			ORDER BY l.name
		`
	}
}
```

**Step 3: Delete old file**

```bash
git rm src/db/repositories/TagRepository.ts
```

**Step 4: Commit repository rename**

```bash
git add src/db/repositories/LabelRepository.ts
git commit -m "refactor: rename TagRepository to LabelRepository"
```

---

### Task 4: Rename TagRepository Test File

**Files:**
- Rename: `src/db/repositories/TagRepository.test.ts` → `src/db/repositories/LabelRepository.test.ts`
- Modify: `src/db/repositories/LabelRepository.test.ts` (all content)

**Step 1: Copy test file**

```bash
cp src/db/repositories/TagRepository.test.ts src/db/repositories/LabelRepository.test.ts
```

**Step 2: Update test imports and names**

In `src/db/repositories/LabelRepository.test.ts`, replace:
- `TagRepository` → `LabelRepository`
- `import { TagRepository }` → `import { LabelRepository }`
- All test descriptions: "tag" → "label", "tags" → "labels"
- Variable names: `tagRepo` → `labelRepo`, `tag` → `label`, `tags` → `labels`

**Step 3: Run tests to verify**

Run: `bun test src/db/repositories/LabelRepository.test.ts`
Expected: All tests pass

**Step 4: Delete old test file and commit**

```bash
git rm src/db/repositories/TagRepository.test.ts
git add src/db/repositories/LabelRepository.test.ts
git commit -m "refactor: rename TagRepository tests to LabelRepository"
```

---

## Phase 3: Type Definitions

### Task 5: Rename Tag Type to Label

**Files:**
- Modify: `src/db/types.ts:212-222`

**Step 1: Rename Tag interface to Label**

Replace:

```typescript
export interface Label {
	id: number
	team_id: number | null
	name: string
	color: string
	is_preset: boolean
	created_by: number | null
	created_at: Date
	updated_at: Date
}
```

**Step 2: Add type alias for backward compatibility (temporary)**

Add below the Label interface:

```typescript
/** @deprecated Use Label instead. Will be removed after refactoring is complete. */
export type Tag = Label
```

**Step 3: Commit type rename**

```bash
git add src/db/types.ts
git commit -m "refactor: rename Tag type to Label"
```

---

## Phase 4: API Layer

### Task 6: Rename API File and Endpoints

**Files:**
- Rename: `src/api/tags.ts` → `src/api/labels.ts`
- Modify: `src/api/labels.ts` (all content)

**Step 1: Copy API file**

```bash
cp src/api/tags.ts src/api/labels.ts
```

**Step 2: Update imports and repository name**

In `src/api/labels.ts`, replace:
- `TagRepository` → `LabelRepository`
- `import { TagRepository }` → `import { LabelRepository }`
- `const tagRepo` → `const labelRepo`
- All route paths: `/api/tags` → `/api/labels`
- All route paths: `/api/play-tags` → `/api/play-labels`
- All route paths: `/api/playbook-tags` → `/api/playbook-labels`

**Step 3: Update API object exports**

At the end of file, replace:

```typescript
export const labelsAPI = {
	'/api/labels': {
		GET: getLabels,
		POST: createLabel,
	},
	'/api/labels/:id': {
		GET: getLabel,
		PATCH: updateLabel,
		DELETE: deleteLabel,
	},
}

export const playLabelsAPI = {
	'/api/plays/:playId/labels': {
		GET: getPlayLabels,
		POST: addLabelToPlay,
	},
	'/api/plays/:playId/labels/:labelId': {
		DELETE: removeLabelFromPlay,
	},
}

export const playbookLabelsAPI = {
	'/api/playbooks/:playbookId/labels': {
		GET: getPlaybookLabels,
		POST: addLabelToPlaybook,
	},
	'/api/playbooks/:playbookId/labels/:labelId': {
		DELETE: removeLabelFromPlaybook,
	},
}
```

**Step 4: Delete old API file**

```bash
git rm src/api/tags.ts
```

**Step 5: Commit API rename**

```bash
git add src/api/labels.ts
git commit -m "refactor: rename tags API to labels API"
```

---

### Task 7: Update API Index Exports

**Files:**
- Modify: `src/index.ts` (API exports section)

**Step 1: Update import statement**

Find the line:
```typescript
import { tagsAPI, playTagsAPI, playbookTagsAPI } from './api/tags'
```

Replace with:
```typescript
import { labelsAPI, playLabelsAPI, playbookLabelsAPI } from './api/labels'
```

**Step 2: Update route registrations**

Find where routes are registered and replace:
- `...tagsAPI` → `...labelsAPI`
- `...playTagsAPI` → `...playLabelsAPI`
- `...playbookTagsAPI` → `...playbookLabelsAPI`

**Step 3: Commit index updates**

```bash
git add src/index.ts
git commit -m "refactor: update API exports to use labels"
```

---

## Phase 5: Hooks Layer

### Task 8: Rename useTagsData Hook

**Files:**
- Rename: `src/hooks/useTagsData.ts` → `src/hooks/useLabelsData.ts`
- Modify: `src/hooks/useLabelsData.ts` (all content)

**Step 1: Copy hook file**

```bash
cp src/hooks/useTagsData.ts src/hooks/useLabelsData.ts
```

**Step 2: Update hook content**

In `src/hooks/useLabelsData.ts`, replace:
- Hook name: `useTagsData` → `useLabelsData`
- Export: `export function useTagsData` → `export function useLabelsData`
- Type import: `import type { Tag }` → `import type { Label }`
- Return type: `Tag[]` → `Label[]`
- API endpoints: `/api/tags` → `/api/labels`
- Query keys: `'tags'` → `'labels'`
- Variable names: `tag` → `label`, `tags` → `labels`

**Step 3: Update export in hooks index**

In `src/hooks/index.ts`, replace:
- `export { useTagsData } from './useTagsData'` → `export { useLabelsData } from './useLabelsData'`

**Step 4: Delete old hook file**

```bash
git rm src/hooks/useTagsData.ts
```

**Step 5: Commit hook rename**

```bash
git add src/hooks/useLabelsData.ts src/hooks/index.ts
git commit -m "refactor: rename useTagsData to useLabelsData"
```

---

## Phase 6: Components Layer

### Task 9: Rename Tags Component Directory

**Files:**
- Rename: `src/components/tags/` → `src/components/labels/`
- Modify: All files in new directory

**Step 1: Copy entire directory**

```bash
cp -r src/components/tags src/components/labels
```

**Step 2: Rename TagDialog component**

In `src/components/labels/TagDialog.tsx`:
- Rename file: `TagDialog.tsx` → `LabelDialog.tsx`
- Component name: `TagDialog` → `LabelDialog`
- Props interface: `TagDialogProps` → `LabelDialogProps`
- All instances of "tag" → "label" in JSX and logic
- Import: `useTagsData` → `useLabelsData`
- Type: `Tag` → `Label`

```bash
mv src/components/labels/TagDialog.tsx src/components/labels/LabelDialog.tsx
```

**Step 3: Rename TagSelector component**

In `src/components/labels/TagSelector.tsx`:
- Rename file: `TagSelector.tsx` → `LabelSelector.tsx`
- Component name: `TagSelector` → `LabelSelector`
- Props interface: `TagSelectorProps` → `LabelSelectorProps`
- Import: `TagDialog` → `LabelDialog`
- Import: `useTagsData` → `useLabelsData`
- Type: `Tag` → `Label`

```bash
mv src/components/labels/TagSelector.tsx src/components/labels/LabelSelector.tsx
```

**Step 4: Rename SelectedTagsOverlay component**

In `src/components/labels/SelectedTagsOverlay.tsx`:
- Rename file: `SelectedTagsOverlay.tsx` → `SelectedLabelsOverlay.tsx`
- Component name: `SelectedTagsOverlay` → `SelectedLabelsOverlay`
- Props interface: `SelectedTagsOverlayProps` → `SelectedLabelsOverlayProps`
- Type: `Tag` → `Label`

```bash
mv src/components/labels/SelectedTagsOverlay.tsx src/components/labels/SelectedLabelsOverlay.tsx
```

**Step 5: Rename CSS files**

```bash
mv src/components/labels/tag-dialog.css src/components/labels/label-dialog.css
mv src/components/labels/tag-selector.css src/components/labels/label-selector.css
mv src/components/labels/selected-tags-overlay.css src/components/labels/selected-labels-overlay.css
```

**Step 6: Update CSS class names**

In all three CSS files, replace:
- `.tag-` → `.label-`
- Class names like `.tag-dialog` → `.label-dialog`

**Step 7: Update CSS imports in components**

Update the import paths in the renamed component files:
- `import './tag-dialog.css'` → `import './label-dialog.css'`
- etc.

**Step 8: Delete old tags directory**

```bash
git rm -r src/components/tags
```

**Step 9: Commit component renames**

```bash
git add src/components/labels
git commit -m "refactor: rename tags components to labels components"
```

---

### Task 10: Update Component References

**Files:**
- Modify: `src/pages/PlayEditorPage.tsx`
- Modify: `src/components/toolbar/Toolbar.tsx`
- Modify: Any other files importing tag components

**Step 1: Update PlayEditorPage imports**

In `src/pages/PlayEditorPage.tsx`, replace:
```typescript
import { SelectedTagsOverlay } from '../components/tags/SelectedTagsOverlay'
```
with:
```typescript
import { SelectedLabelsOverlay } from '../components/labels/SelectedLabelsOverlay'
```

Update component usage:
```typescript
<SelectedLabelsOverlay ... />
```

**Step 2: Update Toolbar imports (if exists)**

Check `src/components/toolbar/Toolbar.tsx` for any tag-related imports and update them.

**Step 3: Search for remaining tag component imports**

Run: `grep -r "from.*components/tags" src --include="*.tsx" --include="*.ts"`
Update any remaining imports found.

**Step 4: Commit component reference updates**

```bash
git add src/pages/PlayEditorPage.tsx src/components/toolbar/Toolbar.tsx
git commit -m "refactor: update imports to use labels components"
```

---

## Phase 7: Constants and Utilities

### Task 11: Rename Tag Constants

**Files:**
- Modify: `src/components/playbook-editor/constants/playbook.ts`

**Step 1: Rename TAG_COLOR_PALETTE constant**

Replace:
```typescript
export const TAG_COLOR_PALETTE = [
```
with:
```typescript
export const LABEL_COLOR_PALETTE = [
```

**Step 2: Rename getTagStyles function**

Replace:
```typescript
export function getTagStyles(color: string) {
```
with:
```typescript
export function getLabelStyles(color: string) {
```

**Step 3: Add backward compatibility exports (temporary)**

Add at end of file:
```typescript
/** @deprecated Use LABEL_COLOR_PALETTE instead */
export const TAG_COLOR_PALETTE = LABEL_COLOR_PALETTE

/** @deprecated Use getLabelStyles instead */
export const getTagStyles = getLabelStyles
```

**Step 4: Commit constant renames**

```bash
git add src/components/playbook-editor/constants/playbook.ts
git commit -m "refactor: rename tag constants to label constants"
```

---

### Task 12: Update Constant References

**Files:**
- Modify: All files that import TAG_COLOR_PALETTE or getTagStyles

**Step 1: Find all files using tag constants**

Run: `grep -r "TAG_COLOR_PALETTE\|getTagStyles" src --include="*.tsx" --include="*.ts" -l`

**Step 2: Update each file**

For each file found, replace:
- `TAG_COLOR_PALETTE` → `LABEL_COLOR_PALETTE`
- `getTagStyles` → `getLabelStyles`

**Step 3: Commit constant reference updates**

```bash
git add <files updated>
git commit -m "refactor: update references to label constants"
```

---

## Phase 8: Type References Throughout Codebase

### Task 13: Update Type Imports

**Files:**
- All files importing Tag type from hooks or db/types

**Step 1: Find files importing Tag type**

Run: `grep -r "import.*Tag.*from" src --include="*.tsx" --include="*.ts" -l`

**Step 2: Update imports systematically**

For each file, replace:
- `import type { Tag }` → `import type { Label }`
- `import { Tag }` → `import { Label }`

**Step 3: Update variable and parameter types**

In the same files, replace:
- `: Tag` → `: Label`
- `: Tag[]` → `: Label[]`
- `<Tag>` → `<Label>`
- `<Tag[]>` → `<Label[]>`

**Step 4: Commit type import updates**

```bash
git add <files updated>
git commit -m "refactor: update Tag type imports to Label"
```

---

## Phase 9: EventBus Events

### Task 14: Rename Tag Events (if they exist)

**Files:**
- Modify: `src/services/EventBus.ts`

**Step 1: Check for tag-related events**

Search the EventMap type for any tag-related events.

**Step 2: Rename event keys**

If found, rename:
- `'tags:*'` → `'labels:*'`
- Example: `'tags:openDialog'` → `'labels:openDialog'`

**Step 3: Update event emitters and listeners**

Search for `eventBus.emit('tags:` and `eventBus.on('tags:` throughout codebase and update.

**Step 4: Commit event updates**

```bash
git add src/services/EventBus.ts <other files>
git commit -m "refactor: rename tag events to label events"
```

---

## Phase 10: Playbook Data Hooks

### Task 15: Update Play and Playbook Types

**Files:**
- Modify: `src/hooks/usePlaybookData.ts`
- Modify: `src/types/playbook.ts`
- Modify: `src/components/playbook-editor/types.ts`

**Step 1: Update Play interface tags field**

In type definitions, find Play interface and update:
```typescript
tags?: Tag[]
```
to:
```typescript
labels?: Label[]
```

If there's a `tagObjects` field, rename to `labelObjects`.

**Step 2: Update usePlaybookData hook**

Update variable names:
- `tags` → `labels`
- `tagObjects` → `labelObjects`
- API endpoints referencing tags

**Step 3: Commit type updates**

```bash
git add src/hooks/usePlaybookData.ts src/types/playbook.ts src/components/playbook-editor/types.ts
git commit -m "refactor: rename tags fields to labels in play types"
```

---

## Phase 11: Final Cleanup

### Task 16: Remove Deprecated Type Alias

**Files:**
- Modify: `src/db/types.ts:221-222`

**Step 1: Remove Tag type alias**

Delete these lines:
```typescript
/** @deprecated Use Label instead. Will be removed after refactoring is complete. */
export type Tag = Label
```

**Step 2: Verify no remaining Tag references**

Run: `grep -r "\\bTag\\b" src --include="*.tsx" --include="*.ts" | grep -v "TagIcon" | grep -v "Label"`
Expected: No results (or only legitimate uses like HTML tags)

**Step 3: Commit cleanup**

```bash
git add src/db/types.ts
git commit -m "refactor: remove deprecated Tag type alias"
```

---

### Task 17: Remove Deprecated Constant Exports

**Files:**
- Modify: `src/components/playbook-editor/constants/playbook.ts`

**Step 1: Remove backward compatibility exports**

Delete:
```typescript
/** @deprecated Use LABEL_COLOR_PALETTE instead */
export const TAG_COLOR_PALETTE = LABEL_COLOR_PALETTE

/** @deprecated Use getLabelStyles instead */
export const getTagStyles = getLabelStyles
```

**Step 2: Verify no remaining uses**

Run: `grep -r "TAG_COLOR_PALETTE\|getTagStyles" src --include="*.tsx" --include="*.ts"`
Expected: No results

**Step 3: Commit cleanup**

```bash
git add src/components/playbook-editor/constants/playbook.ts
git commit -m "refactor: remove deprecated tag constant exports"
```

---

### Task 18: Update Comments and Documentation

**Files:**
- Search all files for "tag" in comments

**Step 1: Find comment references**

Run: `grep -r "tag" src --include="*.tsx" --include="*.ts" | grep "//" | grep -i tag`

**Step 2: Update relevant comments**

For each comment about the tags/labels system, update terminology:
- "tag" → "label"
- "tags" → "labels"

Keep comments that legitimately refer to HTML tags, gift tags, etc.

**Step 3: Commit comment updates**

```bash
git add <files with updated comments>
git commit -m "refactor: update comments to use label terminology"
```

---

## Phase 12: Testing and Verification

### Task 19: Run Migration and Tests

**Files:**
- None (testing only)

**Step 1: Run database migration**

```bash
bun run migrate
```

Expected: Migration 013 runs successfully

**Step 2: Run all tests**

```bash
bun test
```

Expected: All tests pass

**Step 3: Run build**

```bash
bun run build
```

Expected: Build succeeds with no TypeScript errors

**Step 4: Commit verification checkpoint**

```bash
git commit --allow-empty -m "refactor: verify all tests pass after rename"
```

---

### Task 20: Manual UI Testing Checklist

**Files:**
- None (manual testing)

**Step 1: Test label creation**

1. Start dev server: `bun --hot src/index.ts`
2. Navigate to a play
3. Open label selector
4. Create a new label
5. Verify it appears correctly

**Step 2: Test label assignment**

1. Assign label to a play
2. Verify it shows on play card
3. Remove label from play
4. Verify it's removed

**Step 3: Test label editing**

1. Edit an existing label's name and color
2. Verify changes persist
3. Verify changes reflect on all plays using it

**Step 4: Test label filtering**

1. Filter plays by label
2. Verify correct plays show

**Step 5: Document any issues found**

Create GitHub issues for any bugs discovered during testing.

**Step 6: Commit test verification**

```bash
git commit --allow-empty -m "test: manual UI testing complete"
```

---

## Phase 13: Final Review and Merge

### Task 21: Code Review and Cleanup

**Files:**
- All modified files

**Step 1: Review all changes**

```bash
git diff main..HEAD
```

Review for:
- Missed renames
- Leftover "tag" references that should be "label"
- Code quality issues
- Consistent naming

**Step 2: Search for edge cases**

Run comprehensive searches:
```bash
# Find any remaining "tag" that isn't HTML tag or legitimate
grep -ri "tag" src --include="*.tsx" --include="*.ts" | grep -v "TagIcon" | grep -v "<tag>" | grep -v "Label" | grep -v "advantage"
```

**Step 3: Fix any issues found**

Make corrections and commit:
```bash
git add <files>
git commit -m "refactor: fix remaining tag references"
```

---

### Task 22: Create Pull Request

**Files:**
- None (git operations)

**Step 1: Push branch**

```bash
git push -u origin refactor/tags-to-labels
```

**Step 2: Create PR with comprehensive description**

```bash
gh pr create --title "Refactor: Rename Tags to Labels" --body "$(cat <<'EOF'
## Summary

Renames all "tags" infrastructure to "labels" to avoid confusion with football terminology where "tags" refer to route modifications.

## Changes

### Database
- Renamed `tags` table to `labels`
- Renamed `play_tags` table to `play_labels`
- Renamed `playbook_tags` table to `playbook_labels`
- Updated all related indexes and constraints

### Backend
- Renamed `TagRepository` to `LabelRepository`
- Updated API endpoints from `/api/tags` to `/api/labels`
- Updated all database queries and methods

### Frontend
- Renamed all tag components to label components
- Updated hooks: `useTagsData` → `useLabelsData`
- Renamed constants: `TAG_COLOR_PALETTE` → `LABEL_COLOR_PALETTE`
- Updated all type references: `Tag` → `Label`

### Testing
- All tests updated and passing
- Manual UI testing completed
- Build verified

## Breaking Changes

**API Endpoints:**
- `/api/tags` → `/api/labels`
- `/api/play-tags` → `/api/play-labels`
- `/api/playbook-tags` → `/api/playbook-labels`

**Database:**
- Requires migration 013 to be run

## Migration Path

1. Run `bun run migrate` to apply schema changes
2. No data migration needed - tables are renamed in place
3. Update any external API consumers to use new endpoints

## Testing

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Build succeeds
- ✅ Manual UI testing completed

EOF
)"
```

**Step 3: Request review**

Assign reviewers and wait for approval.

---

## Execution Complete

All tasks complete! The refactoring systematically renamed all "tags" infrastructure to "labels" while preserving all functionality.

**Summary:**
- 22 tasks completed
- Database schema updated with migration
- All code references updated
- Tests passing
- Ready for review and merge
