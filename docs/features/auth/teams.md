# Teams & Invitation System

**Status:** ✅ Implemented (December 2024)

Team management system with role-based access control and token-based invitation system for adding new members.

## Overview

Teams are the organizational unit in Play Smith. Playbooks belong to teams, and users access playbooks based on their team membership role (owner, editor, viewer).

## Team Structure

### Team Ownership

**Team Creation:**
- User creates account
- User creates team (or is invited to existing team)
- Creator becomes team owner

**Team Metadata:**
- Team name (e.g., "Eagles Football", "JV Offense")
- Optional description
- Created date
- Owner (user who created team)

### Team Roles

Play Smith uses three role levels for team members:

| Role | Permissions |
|------|-------------|
| **Owner** | Full control: manage team, create/edit/delete playbooks, manage members, share playbooks |
| **Editor** | Create and edit playbooks, create plays, cannot delete playbooks or manage team |
| **Viewer** | Read-only access to playbooks, can view plays and presentations, cannot create or edit |

**Role Hierarchy:**
- Owner > Editor > Viewer
- Users can have different roles on different teams

### Multiple Teams

**Users can belong to multiple teams:**
- Head coach owns "Varsity Offense" team
- Also editor on "JV Offense" team
- Also viewer on "Varsity Defense" team

**Team Switcher:**
- Dropdown in header shows current team
- Switch between teams without logging out
- Different playbooks/permissions per team

## Team Members

### Adding Members

**Invitation System:**
- Team owners can invite members by email
- Invitations sent via email (or displayed as link if email not configured)
- Invitees click link to accept invitation
- Account created automatically (if new user) or linked to existing account

**Direct Add (Future):**
- Search for existing Play Smith users
- Add directly to team (no invitation email)
- Useful for known users already in system

### Member Roles

**Assigning Roles:**
- Owner assigns role when sending invitation
- Role can be changed later (owner only)
- Role change affects permissions immediately

**Role Change Process:**
1. Owner opens team settings
2. Clicks member name
3. Selects new role from dropdown
4. Confirm change
5. Member's permissions update

**Cannot Demote Last Owner:**
- Teams must have at least one owner
- If only one owner exists, cannot demote to editor/viewer
- Must promote another member to owner first

### Removing Members

**Member Removal:**
1. Owner opens team settings → Members tab
2. Clicks "Remove" on member
3. Confirms removal
4. Member immediately loses access to team playbooks

**Self-Removal:**
- Any member can leave team voluntarily
- Click "Leave Team" in team settings
- Confirmation dialog
- Cannot leave if last owner (must transfer ownership first)

## Invitation System

**Status:** ✅ Implemented (December 2024)

Token-based system for inviting new members to join teams.

### Creating Invitations

**Invitation Flow:**
1. Owner clicks "Invite Member" in team settings
2. Enters invitee email
3. Selects role (editor or viewer, not owner)
4. Optional: Custom message
5. Clicks "Send Invitation"

**API Endpoint:** `POST /api/teams/:id/invitations`

**Request Body:**
```json
{
  "email": "newcoach@example.com",
  "role": "editor",
  "message": "Join our offensive playbook team!"
}
```

**Response:**
```json
{
  "id": "invitation-uuid",
  "teamId": "team-uuid",
  "email": "newcoach@example.com",
  "role": "editor",
  "token": "secure-random-token",
  "expiresAt": "2024-12-15T10:00:00Z",
  "createdAt": "2024-12-01T10:00:00Z",
  "createdBy": "owner-user-uuid"
}
```

### Invitation Tokens

**Token Generation:**
- 32-byte random token via `crypto.randomBytes(32)`
- URL-safe base64 encoding
- Cryptographically secure (unpredictable)

**Token Properties:**
- One-time use (deleted after acceptance)
- Expires after 7 days (configurable)
- Unique per invitation

**Invitation URL:**
```
https://www.play-smith.com/invite?token=abc123def456...
```

### Email Delivery

**EmailService Interface:**

**Location:** `src/services/EmailService.ts`

**Abstract Interface:**
```typescript
interface EmailService {
  sendInvitation(invitation: Invitation): Promise<void>;
  sendPasswordReset(user: User, resetToken: string): Promise<void>;
}
```

**Implementations:**

**ConsoleEmailService (Development):**
- Logs email to console
- No actual email sent
- Shows invitation URL for manual testing

**Production Email Service (Future):**
- Integrate with Resend, SendGrid, or AWS SES
- Template-based emails
- Delivery tracking

**Email Content:**
```
Subject: You've been invited to join [Team Name] on Play Smith

Hi,

[Owner Name] has invited you to join [Team Name] as an [Editor/Viewer].

[Optional custom message]

Click the link below to accept:
https://www.play-smith.com/invite?token=abc123...

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
Play Smith
```

### Accepting Invitations

**Acceptance Flow:**
1. User clicks invitation link (from email)
2. Link opens `/invite?token=abc123...`
3. If not logged in: Prompt to login or register
4. If logged in: Show team name and role, confirm acceptance
5. Click "Accept Invitation"
6. User added to team with specified role
7. Invitation deleted (one-time use)

**API Endpoint:** `POST /api/invitations/accept`

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Response:**
```json
{
  "team": {
    "id": "team-uuid",
    "name": "Eagles Football",
    "role": "editor"
  }
}
```

**Error Responses:**
- 404: Invalid token (not found or already used)
- 410: Token expired
- 400: User already member of team

### Declining Invitations

**Decline Flow (Future):**
1. User clicks "Decline" button
2. Invitation deleted
3. Optional: Notify inviter of decline

**Currently:** Users can ignore invitations (auto-expire after 7 days)

### Canceling Invitations

**Owner Can Cancel:**
1. Owner opens team settings → Invitations tab
2. Sees pending invitations
3. Clicks "Cancel" on invitation
4. Invitation deleted immediately
5. Invitation link no longer valid

**API Endpoint:** `DELETE /api/teams/:id/invitations/:invitationId`

**Response:** 204 No Content

**Use Cases:**
- Sent invitation to wrong email
- Role changed (send new invitation)
- Position filled by someone else

## Database Schema

### teams Table

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teams_owner_id ON teams(owner_id);
```

### team_members Table

```sql
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
```

**Cascade Behavior:**
- Delete team → all memberships deleted
- Delete user → all memberships deleted

### invitations Table

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('editor', 'viewer')),
  token VARCHAR(255) UNIQUE NOT NULL,
  message TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_team_id ON invitations(team_id);
CREATE INDEX idx_invitations_email ON invitations(email);
```

**Indexes:**
- `token`: Fast lookup when accepting invitation
- `team_id`: List pending invitations for a team
- `email`: Check if user already has pending invitation

## Technical Implementation

### InvitationRepository

**Location:** `src/db/repositories/InvitationRepository.ts`

**Key Methods:**
```typescript
class InvitationRepository {
  // Create invitation with secure token
  async create(teamId: string, email: string, role: string, createdBy: string): Promise<Invitation>

  // Find invitation by token
  async findByToken(token: string): Promise<Invitation | null>

  // List pending invitations for a team
  async findByTeam(teamId: string): Promise<Invitation[]>

  // Accept invitation (add user to team, delete invitation)
  async accept(token: string, userId: string): Promise<TeamMember>

  // Cancel invitation
  async delete(invitationId: string): Promise<void>

  // Cleanup expired invitations (daily job)
  async deleteExpired(): Promise<number>
}
```

### EmailService

**Location:** `src/services/EmailService.ts`

**ConsoleEmailService:**
```typescript
class ConsoleEmailService implements EmailService {
  async sendInvitation(invitation: Invitation) {
    console.log('=== INVITATION EMAIL ===');
    console.log(`To: ${invitation.email}`);
    console.log(`Team: ${invitation.teamName}`);
    console.log(`Role: ${invitation.role}`);
    console.log(`Link: https://www.play-smith.com/invite?token=${invitation.token}`);
    console.log('========================');
  }
}
```

**Production Implementation (Future):**
```typescript
class ResendEmailService implements EmailService {
  async sendInvitation(invitation: Invitation) {
    await resend.emails.send({
      from: 'Play Smith <noreply@play-smith.com>',
      to: invitation.email,
      subject: `You've been invited to join ${invitation.teamName}`,
      html: renderInvitationTemplate(invitation),
    });
  }
}
```

## Invitation Management UI

### Pending Invitations

**Location:** Team Settings → Invitations Tab

**Display:**
- Table of pending invitations
- Columns: Email, Role, Sent By, Sent Date, Expires
- Actions: Cancel, Resend (future)

**Empty State:**
- "No pending invitations"
- "Invite members to collaborate on playbooks"

### Invite Member Dialog

**Trigger:** Click "Invite Member" button

**Form Fields:**
- Email (required, validated)
- Role (dropdown: Editor, Viewer)
- Custom message (optional, textarea)

**Submit:**
- Validate email format
- Check if email already invited or is existing member
- Send invitation
- Show success message with invitation link (if email not configured)
- Close dialog

### Invitation Accept Page

**Route:** `/invite?token=abc123...`

**Display:**
- Team name
- Role being granted
- "Accept Invitation" button
- "Decline" button (future)

**Authentication Check:**
- If not logged in: Prompt to login or register
- After login/register: Return to accept page
- If logged in: Show accept dialog

## Security Considerations

### Token Security

**Random Token Generation:**
- 32 bytes = 256 bits of entropy
- Cryptographically secure random number generator
- URL-safe base64 encoding

**One-Time Use:**
- Token deleted after acceptance
- Cannot be reused
- Prevents replay attacks

**Expiration:**
- 7-day expiration (configurable)
- Expired invitations auto-cleaned
- Reduces attack window

### Email Verification

**Current:** No email verification required

**Future:** Email verification prevents:
- Fake email registrations
- Invitations to non-existent emails
- Spam signups

**Implementation:**
- Verify email on registration
- Require verified email to accept invitations
- Resend verification email if expired

### Role Escalation Prevention

**Cannot Invite as Owner:**
- Invitations can only grant editor or viewer roles
- Owner role must be transferred explicitly
- Prevents accidental role escalation

**Transfer Ownership (Future):**
- Explicit "Transfer Ownership" action
- Confirmation dialog
- Irreversible (unless new owner transfers back)

## Use Cases

### Onboarding New Coach

**Scenario:** Head coach hires offensive coordinator

**Workflow:**
1. Head coach invites OC via email (editor role)
2. OC receives email with invitation link
3. OC clicks link, registers account
4. OC added to team, can now edit playbooks
5. OC creates first play, sees team's existing playbooks

### Guest Coach Access

**Scenario:** College coordinator helps high school team

**Workflow:**
1. High school coach invites college coordinator (viewer role)
2. Coordinator accepts, gains read-only access
3. Coordinator reviews playbook, provides feedback
4. After season, high school coach removes coordinator from team

### Multi-Level Program

**Scenario:** Varsity and JV teams share concepts

**Workflow:**
1. Varsity coach invites JV coach to "Varsity Offense" team (viewer role)
2. JV coach can view plays, but not edit
3. JV coach adapts plays for JV playbook (separate team)
4. Shared concepts maintain consistency across program

## Future Enhancements

### Invitation Templates

**Pre-defined Messages:**
- "Welcome to our offensive team!"
- "Join us for spring ball planning"
- "Guest access for consulting"

**Personalization:**
- Insert team name, inviter name
- Customize per role (different message for editors vs viewers)

### Bulk Invitations

**Invite Multiple Members:**
- CSV upload (email, role)
- Send 10+ invitations at once
- Useful for entire coaching staff

### Invitation Tracking

**Delivery Status:**
- Track email opens (if email service supports)
- Track link clicks
- Remind inviter if not accepted after 3 days

### Conditional Invitations

**Invite with Conditions:**
- "Accept by Friday or invitation expires"
- "Join team only if you agree to terms"
- Require signature/acknowledgment (future: legal compliance)

### Team Hierarchy

**Parent/Child Teams:**
- Varsity team is parent of JV team
- Inherit playbooks from parent (read-only)
- Maintain separate editable playbooks

**Organization-Level Teams:**
- School district with multiple teams
- Shared concept library across teams
- Org admins manage all teams

---

## See Also

- [Authentication](./authentication.md) - Login, registration, and session management
- [Playbook Management](../playbook/management.md) - Team ownership of playbooks
- [Sharing](../playbook/sharing.md) - Cross-team playbook sharing
- [Team Libraries](../playbook/team-libraries.md) - Team-specific formations and concepts
