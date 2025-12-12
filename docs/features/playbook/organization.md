# Playbook Organization Features

**Status:** ✅ Implemented (December 2024)

Organization features help coaches manage large playbook collections through starring, trash/restore, and flexible view modes.

## Starred Playbooks

Quick-access favorites system for frequently used playbooks.

### Overview

Starring playbooks provides fast access to frequently used playbooks without scrolling through the entire collection. Starred playbooks appear in a dedicated sidebar section in the playbook manager.

### Starring a Playbook

**Methods:**

1. **Playbook Card:**
   - Hover over playbook card
   - Click star icon in top-right corner
   - Star fills in (solid) indicating starred status

2. **Playbook Detail:**
   - Open playbook detail page
   - Click star icon in header
   - Toggle starred/unstarred

3. **Keyboard Shortcut (Future):**
   - Select playbook, press S
   - Toggle starred status

### Starred Status

**Visual Indicators:**
- Filled star icon on starred playbooks
- Empty star icon on unstarred playbooks
- Starred section in sidebar shows count

**Persistence:**
- Starred status per user (not team-wide)
- Persists across sessions
- Synced across devices (if logged in)

### API Endpoint

**Endpoint:** `PUT /api/playbooks/:id/star`

**Request:** No body (toggle action)

**Response:**
```json
{
  "id": "playbook-uuid",
  "starred": true
}
```

**Behavior:**
- If unstarred: Sets starred to true
- If starred: Sets starred to false
- Returns updated starred status

### Starred Playbooks View

**Location:** Playbook manager sidebar

**Display:**
- Section titled "Starred"
- Count badge showing number of starred playbooks
- Click to filter to starred playbooks only

**Sorting:**
- Most recently starred appears first
- Or alphabetical (user preference - future)

**Empty State:**
- "No starred playbooks"
- "Star playbooks for quick access"
- Icon showing how to star (click star on card)

### Use Cases

**Active Game Planning:**
- Star current week's game plan playbook
- Star scouting report playbook
- Quick access during practice planning

**Frequently Referenced:**
- Star master formations playbook
- Star route tree reference playbook
- Star install priority playbooks

**Work in Progress:**
- Star playbooks under active development
- Unstar when complete/archived

---

## Trash & Restore

Soft delete system with recovery capability to prevent accidental data loss.

### Overview

Deleted playbooks are not permanently removed immediately. Instead, they are marked as deleted and moved to Trash, where they can be restored or permanently deleted.

### Soft Delete

**API Endpoint:** `DELETE /api/playbooks/:id`

**Response:** 204 No Content

**Behavior:**
1. Playbook marked with `deleted: true`
2. Removed from normal playbook views
3. Moved to Trash section
4. All plays remain intact
5. Shares remain active (target teams lose access - future: make configurable)
6. Audit log entry created

**Access Control:**
- Only team owners can delete playbooks
- Editors and viewers cannot delete

**Visual Feedback:**
- Playbook disappears from main list
- Appears in Trash section
- Toast notification: "Playbook moved to trash"
- Undo option (10-second window - future)

### Trash View

**Location:** Playbook manager sidebar

**Display:**
- Section titled "Trash"
- Count badge showing number of deleted playbooks
- Click to view trash contents

**Trash Contents:**
- List of deleted playbooks
- Deletion date
- Deleted by (user)
- Restore button
- Permanent delete button
- Empty trash button (bulk delete all)

**Sorting:**
- Most recently deleted first
- Oldest deletions at bottom (approaching auto-purge - future)

### Restore from Trash

**API Endpoint:** `PUT /api/playbooks/:id/restore`

**Response:** Restored playbook object

**Behavior:**
1. Sets `deleted: false`
2. Playbook reappears in normal views
3. Shares reactivated (if preserved)
4. Starred status preserved
5. Audit log entry created

**Visual Feedback:**
- Playbook removed from trash
- Appears in main playbook list
- Toast notification: "Playbook restored"

**Access Control:**
- Team owners can restore
- Original deleter can restore (future)

### Permanent Delete

**API Endpoint:** `DELETE /api/playbooks/:id/permanent`

**Response:** 204 No Content

**Behavior:**
1. Playbook permanently removed from database
2. All plays deleted (CASCADE)
3. All sections deleted
4. All shares deleted
5. Audit log entries remain (for compliance)
6. Cannot be undone

**Confirmation Dialog:**
```
Permanently delete "[Playbook Name]"?

This action cannot be undone. All plays, sections, and shares will be permanently deleted.

[Cancel] [Permanently Delete]
```

**Access Control:** Only team owners can permanently delete

### Empty Trash

**API Endpoint:** `DELETE /api/trash`

**Response:** 204 No Content

**Behavior:**
- Permanently deletes all playbooks in trash
- Bulk operation (single database transaction)
- All plays, sections, shares deleted

**Confirmation Dialog:**
```
Empty trash and permanently delete [N] playbooks?

This action cannot be undone.

[Cancel] [Empty Trash]
```

**Access Control:** Only team owners can empty trash

### Auto-Purge (Future)

**Policy:**
- Deleted playbooks auto-purge after 30 days
- Warning notification at 7 days remaining
- Final warning at 1 day remaining

**User Control:**
- Disable auto-purge in settings
- Extend retention period (60, 90 days)

---

## View Modes

Multiple viewing options for playbook display preferences.

### Overview

View modes control how playbooks are displayed in the playbook manager. Users can toggle between grid and list views based on preference or task.

### Grid View

**Default view mode**

**Display:**
- Card-based layout
- Playbook thumbnail (3-4 sample plays)
- Playbook name
- Description (truncated)
- Metadata (play count, last modified)
- Tags (if applicable - future)
- Star icon

**Grid Layout:**
- Responsive columns (2-5 depending on screen width)
- Equal height cards
- Hover effects (elevation, shadow)

**Benefits:**
- Visual browsing
- Quick recognition by thumbnail
- Better for many playbooks

**Best For:**
- Large playbook collections
- Visual learners
- Browsing/exploration

### List View

**Alternative view mode**

**Display:**
- Table-based layout
- Rows for each playbook
- Columns:
  - Name
  - Description
  - Play count
  - Last modified
  - Created by
  - Actions (star, share, delete)

**Sorting:**
- Click column headers to sort
- Ascending/descending toggle
- Multi-column sort (future)

**Benefits:**
- Information density
- Easy comparison
- Quick scanning for metadata

**Best For:**
- Small-medium playbook collections
- Finding specific playbook by metadata
- Detailed information needs

### View Mode Toggle

**Location:** Playbook manager toolbar (top-right)

**Control:**
- Toggle button with icons
- Grid icon (grid view)
- List icon (list view)
- Current view highlighted

**Keyboard Shortcut (Future):**
- Cmd/Ctrl + Shift + V: Toggle view mode

### Persistence

**User Preference:**
- View mode saved per user
- Persists across sessions
- Applied to all playbook views (owned, shared, starred)

**API Endpoint:** `PUT /api/user/preferences`

**Request Body:**
```json
{
  "playbookViewMode": "grid"  // or "list"
}
```

### Responsive Behavior

**Grid View:**
- Desktop: 4-5 columns
- Tablet: 2-3 columns
- Mobile: 1-2 columns

**List View:**
- Desktop: Full table
- Tablet: Condensed columns (hide description)
- Mobile: Stacked cards (reverts to grid-like on very small screens)

---

## Combined Organization Features

### Sidebar Navigation

**Structure:**
```
Playbooks
├─ All Playbooks (12)
├─ Starred (3)
├─ Shared with Me (2)
└─ Trash (1)
```

**Interaction:**
- Click section to filter playbooks
- Count badges update dynamically
- Active section highlighted

**Keyboard Navigation (Future):**
- Arrow keys to navigate sections
- Enter to select section
- Numbers 1-4 to jump to sections

### Filter Combinations

**Supported Combinations:**
- Starred + Grid/List view
- Trash + Grid/List view
- Shared + Grid/List view
- Section filter + View mode

**Unsupported:**
- Cannot combine Starred + Trash (mutually exclusive)
- Cannot combine All + Shared (separate views)

### Search Integration (Future)

**Global Search:**
- Search across all playbooks (respecting view filter)
- Search within starred playbooks only
- Exclude trash from search (unless viewing trash)

**Search + View Mode:**
- Search results respect view mode preference
- Grid: Search results as cards
- List: Search results as table rows

---

## Database Schema

### Starred Status

**playbooks Table:**
```sql
ALTER TABLE playbooks ADD COLUMN starred BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_playbooks_starred ON playbooks(starred);
```

**User-Specific Starring (Future):**
```sql
CREATE TABLE playbook_stars (
  user_id UUID REFERENCES users(id),
  playbook_id UUID REFERENCES playbooks(id),
  starred_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, playbook_id)
);
```

### Deleted Status

**playbooks Table:**
```sql
ALTER TABLE playbooks ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE playbooks ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE playbooks ADD COLUMN deleted_by UUID REFERENCES users(id);
CREATE INDEX idx_playbooks_deleted ON playbooks(deleted);
```

### View Mode Preference

**user_preferences Table:**
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  playbook_view_mode VARCHAR(10) DEFAULT 'grid' CHECK (playbook_view_mode IN ('grid', 'list')),
  -- other preferences...
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Technical Implementation

### Repository Methods

**PlaybookRepository:** `src/db/repositories/PlaybookRepository.ts`

**Starring:**
- `toggleStar(playbookId, userId)` - Toggle starred status
- `findStarred(userId)` - Get starred playbooks for user

**Trash:**
- `delete(playbookId, userId)` - Soft delete (set deleted=true)
- `restore(playbookId)` - Restore from trash (set deleted=false)
- `permanentDelete(playbookId)` - Hard delete from database
- `findDeleted(teamId)` - Get trash contents
- `emptyTrash(teamId, userId)` - Bulk permanent delete

**View Mode:**
- Handled in user preferences (not playbook-specific)

### Frontend Components

**PlaybookCard:** `src/components/playbooks/PlaybookCard.tsx`
- Displays playbook in grid view
- Star icon toggle
- Context menu (share, delete)

**PlaybookListRow:** `src/components/playbooks/PlaybookListRow.tsx`
- Displays playbook in list view
- Sortable columns
- Inline actions

**PlaybookSidebar:** `src/components/playbooks/PlaybookSidebar.tsx`
- Navigation sections
- Count badges
- Active section highlighting

**ViewModeToggle:** `src/components/playbooks/ViewModeToggle.tsx`
- Grid/List toggle button
- Persists preference

---

## Use Cases

### Weekly Game Planning
1. Create new playbook for week
2. Star playbook for quick access
3. Work on plays throughout week
4. After game, unstar and archive (future)

### Spring Cleaning
1. Review old playbooks
2. Delete outdated playbooks (move to trash)
3. Review trash before season
4. Restore any still useful
5. Empty trash of truly obsolete playbooks

### Team Transition
1. Incoming coordinator reviews playbooks
2. Stars current season playbooks
3. Deletes previous regime's playbooks
4. Previous coordinator (if still on team) can restore if needed
5. After transition period, empty trash

---

## See Also

- [Management](./management.md) - Playbook CRUD operations
- [Sharing](./sharing.md) - Cross-team playbook sharing
- [Team Libraries](./team-libraries.md) - Formations and templates
- [Playbook Sections](./management.md#playbook-sections) - Organizing plays within playbooks
