# Cross-Team Playbook Sharing

**Status:** ✅ Implemented (December 2024)

Cross-team sharing enables collaboration between different coaching staffs by allowing playbooks to be shared with granular permission control.

## Overview

Playbooks belong to a single team (the "owner team"), but can be shared with other teams for collaborative editing or read-only access. This enables:

- Guest coaching positions across multiple teams
- Shared play libraries between varsity and JV
- Collaborative development between offensive coordinators
- Read-only access for scout teams or analysts

## Permission Levels

### View Permission

**Capabilities:**
- Read all plays in playbook
- View formations and concepts
- View sections and organization
- Access play animation
- Export playbook (future)

**Restrictions:**
- Cannot create, edit, or delete plays
- Cannot modify playbook metadata
- Cannot share playbook with additional teams
- Cannot delete playbook

**Use Cases:**
- Scout team accessing game plan
- Analyst reviewing opponent tendencies
- Junior coach learning from senior staff

### Edit Permission

**Capabilities:**
- All view permissions
- Create new plays
- Edit existing plays
- Delete plays
- Create and manage sections
- Modify formations and concepts
- Modify playbook description

**Restrictions:**
- Cannot delete entire playbook
- Cannot share playbook with additional teams
- Cannot change owner team

**Use Cases:**
- Guest coach contributing plays
- Collaborative playbook between coordinators
- Shared library across program levels

## Effective Permissions

A user's effective permission on a playbook is the **highest** between:
1. Their team role (owner/editor/viewer)
2. Share permission (edit/view)

### Permission Matrix

| Team Role | Share Permission | Effective Permission |
|-----------|-----------------|---------------------|
| Owner | N/A | Owner (full control) |
| Editor | N/A | Editor (edit all) |
| Viewer | N/A | Viewer (read only) |
| None (other team) | Edit | Editor (edit all) |
| None (other team) | View | Viewer (read only) |
| Viewer | Edit | Editor (highest wins) |
| Editor | View | Editor (already has edit) |

### Example Scenarios

**Scenario 1: Guest Coach**
- User is member of Team A (viewer role)
- Team B shares playbook with Team A (edit permission)
- User's effective permission: Editor on Team B's playbook

**Scenario 2: Shared Library**
- User is member of Team A (owner role on Team A playbooks)
- Team B shares playbook with Team A (view permission)
- User's effective permission: Viewer on Team B's playbook

**Scenario 3: Internal Editor**
- User is member of Team A (editor role)
- Team A playbook (no external share)
- User's effective permission: Editor on Team A playbooks

## API Endpoints

### List Shares

**Endpoint:** `GET /api/playbooks/:id/shares`

**Response:**
```json
[
  {
    "id": "share-uuid",
    "playbookId": "playbook-uuid",
    "teamId": "target-team-uuid",
    "teamName": "Varsity Eagles",
    "permission": "edit",
    "sharedBy": "user-uuid",
    "sharedAt": "2024-12-01T10:00:00Z"
  }
]
```

**Access Control:** Only owner team members can list shares

### Create Share

**Endpoint:** `POST /api/playbooks/:id/shares`

**Request Body:**
```json
{
  "teamId": "target-team-uuid",
  "permission": "edit"  // or "view"
}
```

**Response:** Created share object

**Validation:**
- Target team must exist
- Cannot share with own team (redundant)
- Cannot share already-shared playbook with same team (update instead)
- Permission must be "view" or "edit"

**Access Control:** Only team owners can share playbooks

**Behavior:**
- Share created immediately
- All members of target team gain access
- Target team sees playbook in "Shared with Me" section
- Audit log entry created

### Update Share (Future)

**Endpoint:** `PUT /api/playbooks/:id/shares/:teamId`

**Request Body:**
```json
{
  "permission": "view"  // Change from edit to view
}
```

**Response:** Updated share object

**Access Control:** Only team owners can update shares

### Delete Share (Remove Access)

**Endpoint:** `DELETE /api/playbooks/:id/shares/:teamId`

**Response:** 204 No Content

**Behavior:**
- Share removed immediately
- Target team members lose access
- Playbook disappears from target team's "Shared with Me"
- Audit log entry created

**Access Control:** Only team owners can remove shares

## Share Dialog UI

### Accessing Share Dialog

**Location:** Playbook settings/context menu

**Trigger:**
1. Open playbook in manager
2. Click playbook card menu (three dots)
3. Select "Share Playbook"
4. Dialog opens

**Alternative:**
- Playbook detail page → Share button

### Dialog Content

**Share List Section:**
- Shows all current shares
- Team name, permission level, shared date
- Remove button (X) for each share

**Add Share Section:**
- Team selector dropdown (autocomplete)
- Permission radio buttons (View/Edit)
- "Share" button

**Empty State:**
- "This playbook is not shared with any teams"
- Encourages sharing for collaboration

### Team Selector

**Features:**
- Autocomplete search by team name
- Excludes:
  - Own team (can't share with self)
  - Already-shared teams
- Shows team name and member count
- Recent teams appear first

**Search:**
- Real-time filtering
- Matches team name
- Shows all teams user has visibility into (future: org-level sharing)

### Permission Radio Buttons

**View Option:**
- Label: "View"
- Description: "Can view plays but not edit"
- Icon: Eye

**Edit Option:**
- Label: "Edit"
- Description: "Can view and edit plays"
- Icon: Pencil

**Default:** View (safer default)

### Remove Share Action

**Trigger:** Click X button on share in list

**Confirmation Dialog:**
```
Remove share with [Team Name]?

[Team Name] will lose access to this playbook.

[Cancel] [Remove Share]
```

**Post-Removal:**
- Share removed from list
- Success toast: "Removed share with [Team Name]"
- Target team members immediately lose access

## Shared Playbook Display

### In Playbook Manager

**Owned Playbooks Section:**
- Shows team's own playbooks
- Full control (create, edit, delete, share)

**Shared with Me Section:**
- Shows playbooks shared by other teams
- Displays original team name
- Permission badge (View/Edit)
- Cannot delete (only owner team can delete)

**Visual Differentiation:**
- Shared playbooks have subtle indicator (icon or badge)
- Original team name displayed below playbook name
- Permission level shown in card metadata

### In Play Editor

**When editing shared playbook:**
- Banner at top: "Shared by [Team Name] - [Permission]"
- If view-only: All edit controls disabled
- If edit: Full functionality except delete playbook

**Reminder Toast (on first open):**
```
You're viewing a playbook shared by [Team Name]
You have [view/edit] access
```

## Database Schema

### playbook_shares Table

```sql
CREATE TABLE playbook_shares (
  id UUID PRIMARY KEY,
  playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  permission VARCHAR(10) CHECK (permission IN ('view', 'edit')),
  shared_by UUID REFERENCES users(id),
  shared_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (playbook_id, team_id)
);
```

**Indexes:**
- `playbook_id` for listing shares of a playbook
- `team_id` for finding playbooks shared with a team
- Composite unique index prevents duplicate shares

### Cascade Behavior

**On playbook deletion:**
- All shares deleted automatically (ON DELETE CASCADE)
- Shared teams immediately lose access

**On team deletion:**
- All shares to/from that team deleted (ON DELETE CASCADE)
- Playbooks remain for owner team

## Technical Implementation

**PlaybookShareRepository:** `src/db/repositories/PlaybookShareRepository.ts`

**Key Methods:**
- `create(playbookId, teamId, permission, sharedBy)` - Create share
- `findByPlaybook(playbookId)` - List shares for a playbook
- `findByTeam(teamId)` - List playbooks shared with a team
- `delete(playbookId, teamId)` - Remove share
- `getEffectivePermission(userId, playbookId)` - Calculate effective permission

**Permission Check Flow:**
```typescript
function getEffectivePermission(userId, playbookId) {
  // 1. Check team membership (owner/editor/viewer)
  const teamRole = getTeamRole(userId, playbookId.teamId);

  // 2. Check shares (for other teams)
  const share = getShare(playbookId, userId.teamId);

  // 3. Return highest permission
  return max(teamRole, share?.permission);
}
```

## Use Cases

### Multi-Level Programs

**Scenario:** High school with varsity and JV teams

1. Varsity team creates full playbook
2. Shares with JV team (edit permission)
3. JV coaches add simplified variations
4. Both teams benefit from shared concepts

### Guest Coaching

**Scenario:** Offensive coordinator works with two teams

1. Coach is member of Team A (owner)
2. Coach is member of Team B (viewer)
3. Team A shares playbook with Team B (edit permission)
4. Coach can edit both playbooks

### Scout Team Access

**Scenario:** Scout team needs opponent's plays

1. Offensive team creates "opponent scout" playbook
2. Shares with scout team (view permission)
3. Scout team runs plays in practice
4. Cannot accidentally modify opponent playbook

### Collaborative Development

**Scenario:** Two coordinators collaborating on air raid package

1. Coordinator A creates "Air Raid Concepts" playbook
2. Shares with Coordinator B's team (edit permission)
3. Both add plays and refine concepts
4. Final playbook owned by Coordinator A's team

## Future Enhancements

### Fine-Grained Permissions
- Section-level permissions (edit sections 1-3, view section 4)
- Time-limited shares (expire after 30 days)
- Revocable links (share via URL, revoke anytime)

### Share Analytics
- Track which teams access playbook
- Last accessed timestamp
- Most-viewed plays

### Share Templates
- "Share with all teams in organization"
- "Share with team hierarchy (varsity → JV → freshman)"

### Notification System
- Email notification when playbook shared
- In-app notification of new shared playbooks
- Updates to shared playbooks

## See Also

- [Management](./management.md) - Playbook CRUD and permissions
- [Organization](./organization.md) - Playbook organization features
- [Team Libraries](./team-libraries.md) - Shared formations and concepts
- [Authentication](../auth/teams.md) - Team structure and roles
