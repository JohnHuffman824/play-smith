# Playbook Management

Playbooks are collections of plays with organizational features, permissions, and audit logging. They belong to teams and support role-based access control.

## Overview

A playbook serves as the primary container for organizing plays. Each playbook is owned by a team, and access is controlled through team roles (owner, editor, viewer) and optional cross-team sharing.

## CRUD Operations

### Create Playbook

**API Endpoint:** `POST /api/teams/:teamId/playbooks`

**Request Body:**
```json
{
  "name": "2024 Offensive Playbook",
  "description": "Main offensive schemes for the season"
}
```

**Response:**
```json
{
  "id": "playbook-uuid",
  "teamId": "team-uuid",
  "name": "2024 Offensive Playbook",
  "description": "Main offensive schemes for the season",
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-01T10:00:00Z",
  "createdBy": "user-uuid",
  "starred": false,
  "deleted": false
}
```

**Access Control:**
- Team owners and editors can create playbooks
- Viewers cannot create playbooks

### Read Playbook

**API Endpoint:** `GET /api/playbooks/:id`

**Response:**
```json
{
  "id": "playbook-uuid",
  "teamId": "team-uuid",
  "name": "2024 Offensive Playbook",
  "description": "Main offensive schemes for the season",
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-15T14:30:00Z",
  "createdBy": "user-uuid",
  "starred": true,
  "deleted": false,
  "plays": [
    {
      "id": "play-uuid-1",
      "name": "Z Post",
      "formation": "Trips Right",
      "personnel": "11",
      "tags": ["short-yardage"],
      "sectionId": "section-uuid"
    }
  ],
  "sections": [
    {
      "id": "section-uuid",
      "name": "Red Zone Plays",
      "playCount": 12
    }
  ]
}
```

**Access Control:**
- Team members can view based on role
- Shared teams can view if granted view/edit access

### Update Playbook

**API Endpoint:** `PUT /api/playbooks/:id`

**Request Body:**
```json
{
  "name": "2024 Offensive Playbook - Updated",
  "description": "Updated description"
}
```

**Response:** Updated playbook object

**Access Control:**
- Team owners and editors can update
- Shared teams with edit access can update
- Viewers cannot update

### Delete Playbook

**API Endpoint:** `DELETE /api/playbooks/:id`

**Response:** 204 No Content

**Behavior:**
- Soft delete (marks `deleted: true`, not permanently removed)
- Playbook moves to Trash
- Excluded from normal playbook lists
- Can be restored (see [Organization](./organization.md))

**Access Control:**
- Only team owners can delete playbooks
- Editors and viewers cannot delete

## Permissions Model

### Team Roles

Playbooks inherit access control from team membership:

| Role | Create | Read | Update | Delete | Share |
|------|--------|------|--------|--------|-------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ❌ | ✅ | ❌ | ❌ | ❌ |

### Cross-Team Sharing

Playbooks can be shared with other teams (see [Sharing](./sharing.md)):

- **View Access:** Read-only access to plays and concepts
- **Edit Access:** Full editing capabilities (add/modify/delete plays)

**Effective Permission:**
- User's permission = highest between team role and share permission
- Example: Team viewer + edit share = effective editor

### Special Section Permissions

**Ideas & Experiments Section:**
- Protected section type (cannot be deleted)
- Viewers can create and edit their own plays in this section
- Encourages experimentation without affecting main playbook
- See [Playbook Sections](./management.md#playbook-sections) below

## Playbook Sections

**Status:** ✅ Implemented (December 2024)

Sections provide organizational structure within playbooks for grouping plays by category, situation, or custom criteria.

### Section Features

**Create Section:**
- Organize plays by situation (Red Zone, Third Down, Two Minute)
- Category-based (Run Plays, Pass Plays, Play Action)
- Custom grouping (Week 1 Game Plan, Practice Installs)

**Special Sections:**
- **Ideas & Experiments:** Protected section for work-in-progress plays
- Cannot be deleted
- Open to all team members for experimentation

**Section Operations:**
- Create, rename, delete sections
- Assign plays to sections
- Filter plays by section
- Reorder sections (future)

### API Endpoints

#### List Sections
**Endpoint:** `GET /api/playbooks/:playbookId/sections`

**Response:**
```json
[
  {
    "id": "section-uuid-1",
    "playbookId": "playbook-uuid",
    "name": "Red Zone Plays",
    "isProtected": false,
    "playCount": 12,
    "createdAt": "2024-12-01T10:00:00Z"
  },
  {
    "id": "section-uuid-2",
    "playbookId": "playbook-uuid",
    "name": "Ideas & Experiments",
    "isProtected": true,
    "playCount": 5,
    "createdAt": "2024-12-01T10:00:00Z"
  }
]
```

#### Create Section
**Endpoint:** `POST /api/playbooks/:playbookId/sections`

**Request Body:**
```json
{
  "name": "Third Down Plays"
}
```

**Response:** Created section object

**Access Control:** Owners and editors only

#### Update Section
**Endpoint:** `PUT /api/sections/:sectionId`

**Request Body:**
```json
{
  "name": "Third & Long Plays"
}
```

**Response:** Updated section object

**Access Control:** Owners and editors only

#### Delete Section
**Endpoint:** `DELETE /api/sections/:sectionId`

**Response:** 204 No Content

**Behavior:**
- Plays in section become unsectioned (section_id = null)
- Protected sections (Ideas) cannot be deleted (returns 403 Forbidden)

**Access Control:** Owners and editors only

### Section-Based Filtering

**Playbook Manager UI:**
- Sidebar with section list
- Click section to filter plays
- "All Plays" option shows unsectioned + all sections
- Play count badge on each section

**Search Integration:**
- Filter search results by section
- Combine section filter with tag filters
- Section appears in play metadata

## Export & Import

### Export Playbook

**Endpoint:** `GET /api/playbooks/:id/export`

**Response:** JSON file download

**Export Format:**
```json
{
  "version": "1.0",
  "playbook": {
    "name": "2024 Offensive Playbook",
    "description": "Main offensive schemes",
    "plays": [...],
    "sections": [...],
    "formations": [...],
    "concepts": [...]
  },
  "exportedAt": "2024-12-15T14:30:00Z",
  "exportedBy": "user-uuid"
}
```

**Use Cases:**
- Backup before major changes
- Share with other teams (outside Play Smith)
- Archive old playbooks
- Migration between systems

### Import Playbook

**Endpoint:** `POST /api/teams/:teamId/playbooks/import`

**Request:** Multipart form-data with JSON file

**Behavior:**
- Creates new playbook
- Imports all plays, sections, formations
- Resolves ID conflicts (generates new UUIDs)
- Maps to importing team's terminology

**Validation:**
- Checks export format version
- Validates play data structure
- Reports errors if import fails

## Audit Logging

**Status:** ✅ Implemented (December 2024)

Basic audit logging tracks create, update, delete, and share events for playbooks.

### Logged Events

| Event | Details Captured |
|-------|-----------------|
| Created | User, timestamp, playbook name |
| Updated | User, timestamp, changed fields |
| Deleted | User, timestamp, soft delete flag |
| Restored | User, timestamp (from trash) |
| Shared | User, timestamp, target team, permission level |
| Unshared | User, timestamp, target team |

### Audit Log Schema

```json
{
  "id": "audit-uuid",
  "entityType": "playbook",
  "entityId": "playbook-uuid",
  "action": "updated",
  "userId": "user-uuid",
  "teamId": "team-uuid",
  "changes": {
    "name": {
      "old": "2024 Offensive Playbook",
      "new": "2024 Offensive Playbook - Updated"
    }
  },
  "timestamp": "2024-12-15T14:30:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Viewing Audit Logs

**Endpoint:** `GET /api/playbooks/:id/audit-log`

**Response:** Array of audit log entries

**Access Control:**
- Team owners can view all audit logs
- Editors can view logs for playbooks they can edit
- Viewers cannot access audit logs

**UI Display:**
- Playbook settings dialog includes "History" tab
- Shows recent changes with user, timestamp, action
- Filterable by date range, user, action type

## List Playbooks

### Team Playbooks
**Endpoint:** `GET /api/teams/:teamId/playbooks`

**Query Parameters:**
- `starred`: Filter to starred playbooks only
- `deleted`: Include/exclude deleted playbooks
- `section`: Filter by section ID

**Response:** Array of playbook objects

### Shared Playbooks
**Endpoint:** `GET /api/teams/:teamId/shared-playbooks`

**Response:** Array of playbooks shared with the team

**Playbook Object Includes:**
- Original team information
- Share permission level (view/edit)
- Shared date and by whom

## Playbook Metadata

### Last Modified
- Updated whenever:
  - Playbook name/description changes
  - Play added/modified/deleted
  - Section created/renamed/deleted
  - Formation/concept added/modified

### Play Count
- Total number of plays in playbook
- Excludes deleted plays
- Displayed on playbook cards in manager

### Creation Info
- Created by (user)
- Created at (timestamp)
- Immutable after creation

## Technical Implementation

### Database Schema

**playbooks Table:**
```sql
CREATE TABLE playbooks (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  starred BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE
);
```

**Performance Indexes:**
- `team_id` for team playbook queries
- `deleted` for filtering trash
- `starred` for starred playbook views
- Composite index on (team_id, deleted, starred) for common queries

### Repository Pattern

**PlaybookRepository:** `src/db/repositories/PlaybookRepository.ts`

**Key Methods:**
- `create(teamId, data)` - Create new playbook
- `findById(id)` - Get playbook with plays
- `update(id, data)` - Update playbook
- `delete(id)` - Soft delete
- `listByTeam(teamId, filters)` - List team playbooks
- `restore(id)` - Restore from trash

## See Also

- [Sharing](./sharing.md) - Cross-team playbook sharing
- [Organization](./organization.md) - Starred, trash, and view modes
- [Team Libraries](./team-libraries.md) - Formations and templates
- [Presentations](../presentations/presentation-system.md) - Creating presentations from playbooks
