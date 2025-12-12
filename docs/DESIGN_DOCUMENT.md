# Play Smith Design Document

## Overview

Play Smith is an American football play and playbook creator. The registered domain
is "play-smith.com" (via Squarespace). The application provides a whiteboard-style
system where users can create individual plays and collect them into playbooks.
Playbooks are team-owned, with owner/editor/viewer roles and optional
	cross-team sharing for collaborative editing or read-only access.

---

## The Whiteboard

The whiteboard serves as the primary canvas for play creation. Its base background
color is `#f2f2f2` (grey/white).

### Field Specifications

The field must match exact college football field specifications. All measurements
are recorded in feet with a scaling factor applied for pixels (approximately
1 foot = 3 pixels).

| Property | Value |
|----------|-------|
| Background color | `#f2f2f2` |
| Total field width | 160 feet |
| Edge to innermost hash | 60 feet (both sides) |
| Space between hashes | 40 feet |
| Hash mark spacing | 3 feet apart |

### Field Markings

- Every 5th hash mark has a line extending the full width of the field
- Every 10 yards displays numbers straddling the width-spanning lines
- Numbers are 6 feet tall with tops positioned 15 feet from the field edge
- Numbers are represented with hashtags (#)
- Numbers are oriented "on their side" (tops closer to field edge, bottoms
	closer to center)
- Lines should have relatively low opacity so they don't obscure drawings

---

## Play Editor

The play editor is the main workspace for creating and editing plays.

### Layout

- **Center**: Whiteboard canvas
- **Left**: Toolbar with tool icons
- **Top**: Unified search for formations/concepts/groups with draggable chips
- **Above whiteboard**: Four input fields (left to right)
	1. Formation
	2. Play
	3. Personnel
	4. Defensive Formation
- **Below inputs**: Tags row
- **Below whiteboard**: Play cards section (scrollable)

### Input Fields

All inputs start empty with their names as placeholders.

**Personnel Dropdown**
- Defaults to "Any"
- Options: 11, 10, 12, 13, 21, 22
- Ability to create custom personnel packages

### Tags System

Tags are color-coded labels used to group plays by similar qualities (short
yardage, long yardage, third down, redzone, etc.).

**Behavior:**
- Tags fill in left to right as colored rounded rectangles
- An "Add Tag" button appears at the end with a tooltip below it
- Clicking opens a dialog with preset default tags and custom creation option
- Hovering over a tag reveals an X button to remove it
- Tags are per-play and appear on play cards in the scrollable section

**Preset Tags:**
| Tag | Color |
|-----|-------|
| Short Yardage | Green |
| Mid Yardage | Yellow |
| Long Yardage | Orange |
| Redzone | Red |

**Custom Tags:**
- Dialog includes color picker and name input
- Preset tags are global; custom tags are team-specific and persist across that
	team’s playbooks

### Play Cards Section

- Located below the whiteboard
- Shows all plays in the current playbook (excluding the currently open play)
- Uses the same PlayCard components as the Playbook Manager page
- Scrollable horizontally (no vertical scroll)
- An "Add Play" button appears at the far right (283px height to match cards)
- Clicking "Add Play" auto-saves the current play then creates a new one

**Technical Implementation:**
- Container height: 340px when visible, 0px when hidden
- Canvas height adjusts via `calc(100vh - Xpx)` where X includes the play bar height
- Animation: 800ms ease-in-out transition on height
- Delayed unmount: Content stays rendered during hide animation (800ms delay) for smooth visual transition
- Performance: Content unmounts after animation completes to reduce computational load

### Default Elements

By default, each play auto-populates with 5 offensive linemen:
- Represented as 2-foot radius circles
- Spaced 1 foot apart from each other
- Not removable, but individually movable
- Each lineman is an individual player component
- Center (middle lineman) is automatically placed at field center
- Position can be adjusted via the hash button (left hash, middle, or right hash)

### Concept Application Search

**Status:** ✅ Implemented with Frecency Ranking (December 2024)

- **Unified search bar** surfaces formations, concepts, and concept groups
- **Frecency-based ranking:** Results prioritized by frequency of use + recency
- Selecting a result adds a draggable chip above the canvas
- Chips can be reordered via drag-and-drop and removed inline
- Applied chips automatically apply their formation/concept/group to the canvas
- **API Endpoint:** `GET /api/search` - Unified search across concept types

### Drawing–Player Linking

- Link by dragging a drawing node inside a player’s radius (glow indicates snap); one drawing per player
- The linked control point hides (drawn behind the player) and moves in lockstep with the player
- Dragging a linked drawing moves its player; dragging the player moves the drawing (bidirectional lock)
- Unlink via the player label dialog (unlink button beside custom text/delete); the node reappears ~5 ft along the prior segment direction from the player
- If no link exists, the player dialog’s custom text input spans the full row
- Prevent merging two drawings when both drawings already have player links

### Multi-Selection Overlay

- Selecting 2+ objects shows an overlay with actions:
	- Save selection as concept (opens concept dialog)
	- Duplicate selection (placeholder)
	- Delete selection

### Canvas Zoom & Pan

**Status:** ✅ Implemented (December 2024)

Advanced viewport controls for navigating large field diagrams.

**Features:**
- **Mouse Wheel Zoom:** Cursor-centered zooming for precise control
- **Spacebar + Drag:** Pan canvas while holding spacebar
- **Middle Mouse Button:** Alternative panning method
- **Zoom Limits:** Configurable min/max zoom levels
- **Viewport State:** Persisted via CanvasViewportContext

**Technical Implementation:**
- **CanvasViewportContext:** Global zoom and pan state (`src/contexts/CanvasViewportContext.tsx`)
- Transform-based rendering for smooth performance
- Prevents accidental tool interactions while panning

### Persistence

- Plays load from `/api/plays/{id}` (players, drawings, hash alignment, name)
- Save via `PUT /api/plays/{id}` (name, players, drawings, hash)
- Delete via `DELETE /api/plays/{id}` with post-delete navigation to playbook

### Placeholder Ideas

- Individual player tags depending on system
- Concepts support
- Send to playbook button
- Save functionality
- Color button

---

## Tools

Tools are accessed via the toolbar on the left side of the editor. They are used
to create and edit components on the whiteboard.

### Select

| Property | Value |
|----------|-------|
| Icon | Cursor |
| Shortcut | S |

**Function:** Enables selection of existing components for interaction (move,
resize, add interactions, etc.).

### Add Player

| Property | Value |
|----------|-------|
| Icon | Stick figure human |
| Shortcut | A |

**Function:** Adds a player to the center of the visible screen. Players are
distinct components with independent functionality. When selected, dragging
the cursor into the drawing area changes it to a circle indicating player
placement location.

### Draw

| Property | Value |
|----------|-------|
| Icon | Pencil (tip bottom-left, eraser top-right, 45° angle) |
| Shortcut | D |
| Custom Cursor | Yes (pencil tip indicates drawing position, canvas only) |

**Function:** Allows freehand drawing of lines and shapes on the whiteboard.
Completed drawings are saved as components. A sub-dialog opens next to the tool
for line customization:
- Line style: solid or dashed
- End style: arrow, T-shape, or none
- Path mode: sharp (angular) or curve (smoothed)
- Line thickness presets: Thin/Medium/Thick/Extra Thick
- Drawing properties dialog lets users edit color, style, ends, path mode, and
	thickness after creation

### Erase

| Property | Value |
|----------|-------|
| Icon | Rubber eraser |
| Shortcut | E |

**Function:** Allows clicking on canvas elements to erase them.

### Fill Color

| Property | Value |
|----------|-------|
| Icon | Paint bucket |
| Shortcut | F |

**Function:** Applies the currently selected color from the color wheel to
clicked elements.

### Color

| Property | Value |
|----------|-------|
| Icon | Color wheel |
| Shortcut | C |

**Function:** Opens a color selector with preset options to determine drawing color.

### Route

| Property | Value |
|----------|-------|
| Icon | Route tree (TBD) |
| Shortcut | R |

**Function:** Opens a dialog with pre-defined routes from the basic route tree:

| Number | Route |
|--------|-------|
| 1 | Flat |
| 2 | Slant |
| 3 | Comeback |
| 4 | Curl |
| 5 | Out |
| 6 | Dig |
| 7 | Corner |
| 8 | Post |
| 9 | Go |

### Add Component

| Property | Value |
|----------|-------|
| Icon | Plus (+) |
| Shortcut | G |

**Function:** Adds a copy of a saved component to the field.

### Ball on Hash

| Property | Value |
|----------|-------|
| Icon | Hash marker (three dashed lines stacked vertically) |
| Shortcut | H (future: 1=Left, 2=Middle, 3=Right) |

**Function:** Opens a dialog with three options: Left, Middle, Right. Default
is Middle. This controls ball placement, shifting the 5 offensive linemen to
align on the left hash, field center, or right hash.

### Hide/Show Play Bar

| Property | Value |
|----------|-------|
| Icon | Open eye (visible) / Closed eye (hidden) |

**Function:** Toggles the play bar visibility below the whiteboard. Includes
smooth animations:
- Play cards drift off/on the bottom of the screen
- Whiteboard expands/contracts accordingly
- All whiteboard elements (players, drawings) move with the expansion/contraction
- New space appears from the top of the whiteboard

### Settings

| Property | Value |
|----------|-------|
| Icon | Cog wheel |

**Function:** Opens a settings dialog with user preferences that persist across
all plays and playbooks.

#### Settings Options

**Position Naming System**
- Values: (X, Y, Z, A, B, Q), (X, Y, Z, F, T, Q), or Custom
- Function: Defines letters representing different offensive skill positions

**Competition Level**
- Values: High School, College, Pro
- Function: Changes hash distances and other field specifications

**Appearance**
- Values: Light Mode, Dark Mode
- Function: Toggles between light and dark color schemes

**Snap Distance**
- Range: 10–50 px (default 20 px)
- Function: Sets snap threshold used for merging points and alignment

**Move Skills on Hash Change**
- Values: Yes, No
- Function: Determines whether skill position players move with linemen when
	hash position changes

**Role Terminology** (Team-level setting)
- **Status:** ✅ Implemented (December 2024)
- Function: Customize position labels per team (e.g., "X" vs "Split End")
- Scope: Team-specific, persists across all team playbooks
- **API Endpoints:**
  - `GET /api/teams/:teamId/roles` - List team role terminology
  - `PUT /api/teams/:teamId/roles` - Update/upsert role terminology
- **Database:** `role_terminology` table with team_id, role_id, custom_label

---

## Keyboard Shortcuts

- S: Select tool
- A: Add player
- D: Draw (opens/toggles draw options)
- E: Erase
- C: Color picker dialog
- F: Fill tool
- H: Ball-on-hash dialog
- G: Add component/concept dialog
- Delete/⌫: Delete selection
- ⌘Z: Undo canvas history

---

## Play Animation

**Status:** ✅ Implemented (December 2024)

The animation system allows users to view plays in motion, with players moving along their assigned routes in a synchronized playback.

### Animation Features

- **Playback Controls:**
  - Play/Pause toggle
  - Speed controls: 0.5x, 1x, 1.5x, 2x
  - Timeline scrubbing (future)

- **Visual Effects:**
  - Animated players following route paths
  - Ghost trail effect showing player movement history
  - Synchronized animation across all players

- **Animation Page:**
  - Route: `/playbooks/:playbookId/animate/:playId`
  - Full-screen animation canvas
  - Dedicated animation viewer

### Technical Implementation

- **AnimationContext:** Global animation state (playback, speed, current time)
- **AnimationCanvas:** Renders animated routes and players (`src/components/animation/AnimationCanvas.tsx`)
- **AnimatedPlayer:** Player component with position interpolation (`src/components/animation/AnimatedPlayer.tsx`)
- **AnimatedRoute:** Route rendering with progressive drawing (`src/components/animation/AnimatedRoute.tsx`)
- **GhostTrail:** Visual trail effect for player movement (`src/components/animation/GhostTrail.tsx`)
- **useAnimationEngine:** Custom hook for frame calculations
- **useAnimationTiming:** Timeline and timing calculations

---

## Playbook Management

A system to manage playbooks is needed. Playbooks are collections of plays with
additional features (TBD).

**Requirements:**
- Export/import functionality
- Page design (consider Google Drive UI for inspiration)
- Playbooks belong to a team; members inherit permissions from their role
	(owner > editor > viewer)
- Playbooks can be shared with other teams with view or edit access; a user’s
	effective permission is the highest between team role and share
- Basic audit logging for create/update/delete/share events

### Team Libraries & Templates

- Each team maintains libraries for formations, personnel packages, and route
	templates
- Formation templates can auto-populate player positions relative to the chosen
	hash position
- Route templates instantiate full drawing geometry (segments and control
	points) with default styling
- Team position labels live in team settings so position naming aligns with the
	team's chosen terminology

### Modifier Overrides

**Status:** ✅ Implemented (December 2024)

Modifier overrides allow formation-specific adjustments to concept behavior, enabling coaches to fine-tune how modifiers (motion, shifts, etc.) apply differently based on the formation.

**Features:**
- Define formation-specific override rules for modifier concepts
- Override player assignments, routes, or positions per formation
- Enables context-aware concept application (e.g., "motion left" means different things in different formations)
- Stored with modifier concepts, applied automatically when formation is detected

**API Endpoints:**
- `GET /api/modifiers/:modifierId/overrides` - List overrides for a modifier
- `POST /api/modifiers/:modifierId/overrides` - Create formation-specific override
- `PUT /api/modifier-overrides/:id` - Update override rules
- `DELETE /api/modifier-overrides/:id` - Delete override

**Technical Implementation:**
- **ModifierOverrideRepository:** Database operations (`src/db/repositories/ModifierOverrideRepository.ts`)
- **Database:** `modifier_overrides` table linking modifiers to formations with custom rules
- Concept application engine checks for overrides before applying defaults

### Playbook Sections

**Status:** ✅ Implemented (December 2024)

Sections provide organizational structure within playbooks, allowing coaches to group plays by category, situation, or any custom grouping.

**Features:**
- Create/rename/delete sections within a playbook
- Assign plays to sections
- Special "Ideas & Experiments" section type for work-in-progress plays
- Protected sections (Ideas section cannot be deleted)
- Section-based filtering and organization

**API Endpoints:**
- `GET /api/playbooks/:playbookId/sections` - List sections
- `POST /api/playbooks/:playbookId/sections` - Create section
- `PUT /api/sections/:sectionId` - Update section
- `DELETE /api/sections/:sectionId` - Delete section (Ideas section protected)

**Permission Model:**
- Standard sections: owner/editor can create/edit
- Ideas sections: viewers can create and edit their own plays

### Cross-Team Playbook Sharing

**Status:** ✅ Implemented (December 2024)

Playbooks can be shared across teams with granular permission control, enabling collaboration between different coaching staffs.

**Features:**
- Share playbooks with other teams
- Two permission levels:
  - **View:** Read-only access to plays and concepts
  - **Edit:** Full editing capabilities
- User's effective permission is the highest between team role and share permission
- Share dialog UI for managing playbook access
- Remove shares to revoke access

**API Endpoints:**
- `GET /api/playbooks/:id/shares` - List shares for a playbook
- `POST /api/playbooks/:id/shares` - Share playbook with team
- `DELETE /api/playbooks/:id/shares/:teamId` - Remove share

### Trash & Restore

**Status:** ✅ Implemented (December 2024)

Soft delete system with recovery capability to prevent accidental data loss.

**Features:**
- Soft delete playbooks (marked as deleted, not permanently removed)
- Trash sidebar section showing deleted playbooks
- Restore from trash (undo deletion)
- Permanent delete (irreversible)
- Empty trash (bulk permanent delete)
- Deleted playbooks excluded from normal views

**API Endpoints:**
- `DELETE /api/playbooks/:id` - Soft delete playbook
- `PUT /api/playbooks/:id/restore` - Restore from trash
- `DELETE /api/playbooks/:id/permanent` - Permanent delete
- `DELETE /api/trash` - Empty trash (all deleted playbooks)

### Starred Playbooks

**Status:** ✅ Implemented (December 2024)

Quick-access favorites system for frequently used playbooks.

**Features:**
- Star/unstar playbooks
- Starred sidebar section for quick access
- Toggle starred status from playbook cards

**API Endpoint:**
- `PUT /api/playbooks/:id/star` - Toggle starred status

### View Modes

**Status:** ✅ Implemented (December 2024)

Multiple viewing options for playbook display preferences.

**Features:**
- **Grid View:** Card-based layout with thumbnails
- **List View:** Table-based layout with metadata columns
- Persistent preference saved in settings
- Toggle button in playbook manager toolbar

---

## Presentations

**Status:** ✅ Implemented (December 2024)

The presentations system allows coaches to create slideshow-style presentations from playbook plays for teaching, game planning, and film sessions.

### Presentation Features

- **Create Presentations:** Organize plays into ordered slide decks
- **Slide Management:**
  - Add plays as slides
  - Reorder slides via drag-and-drop
  - Remove slides from presentation
- **Presentation Viewer:** Full-screen slideshow mode with navigation controls
- **Playbook Integration:** Presentations belong to specific playbooks

### Technical Implementation

**Components:**
- **PresentationCard:** Display presentation in list (`src/components/presentations/PresentationCard.tsx`)
- **PresentationEditor:** Add/remove/reorder slides (`src/components/presentations/PresentationEditor.tsx`)
- **PresentationViewerModal:** Slideshow viewer (`src/components/presentations/PresentationViewerModal.tsx`)
- **NewPresentationDialog:** Create new presentation (`src/components/presentations/NewPresentationDialog.tsx`)

**API Endpoints:**
- `GET /api/playbooks/:playbookId/presentations` - List presentations
- `POST /api/playbooks/:playbookId/presentations` - Create presentation
- `GET /api/presentations/:presentationId` - Get presentation with slides
- `PUT /api/presentations/:presentationId` - Update presentation
- `DELETE /api/presentations/:presentationId` - Delete presentation
- `POST /api/presentations/:presentationId/slides` - Add slide
- `PUT /api/presentations/:presentationId/slides` - Reorder slides
- `DELETE /api/presentations/:presentationId/slides/:slideId` - Remove slide

**Database:**
- `presentations` table with playbook relationship
- `presentation_slides` junction table with ordering

---

## Login & Authentication

**Status:** ✅ Implemented (December 2024)

The application now includes a production-ready session-based authentication system that gates the entire application behind a login modal.

### Authentication Features

- **Session-based authentication** with PostgreSQL-backed storage
- **HTTP-only cookies** with SameSite=Strict for security (XSS and CSRF protection)
- **Bcrypt password hashing** (cost factor: 10) via Bun's built-in password API
- **7-day session expiration** with automatic cleanup
- **Self-registration** with client-side validation (email format, password strength)
- **Modal login UI** with smooth animations and dual login/register modes

### API Endpoints

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and create session
- `POST /api/auth/logout` - Destroy session
- `GET /api/auth/me` - Get current authenticated user

### Development Setup

For local development, an admin user can be seeded with:
```bash
bun run seed:dev  # Creates admin/admin user
```

### Technical Implementation

- **Backend:** AuthService, SessionRepository, auth API endpoints
- **Database:** Sessions table with indexes on token, user_id, and expires_at
- **Frontend:** React Context (AuthContext) for global auth state, LoginModal component with validation
- **Security:** Passwords never stored in plain text, sessions validated on every request
- **Testing:** Comprehensive test coverage including unit, integration, and end-to-end tests

### Team Invitations

**Status:** ✅ Implemented (December 2024)

Token-based system for inviting new members to join teams.

**Features:**
- Team owners can invite members by email
- Secure invitation tokens (32-byte random, URL-safe)
- Accept/decline invitation flow
- Cancel pending invitations
- Email service integration (interface defined, ready for Resend/SendGrid/AWS SES)
- Invitations tracked in database with expiration

**API Endpoints:**
- `POST /api/teams/:id/invitations` - Create invitation (owner-only)
- `DELETE /api/teams/:id/invitations/:invitationId` - Cancel invitation
- `POST /api/invitations/accept` - Accept invitation by token

**Technical Implementation:**
- **InvitationRepository:** Database operations for invitations (`src/db/repositories/InvitationRepository.ts`)
- **EmailService:** Abstract email interface (`src/services/EmailService.ts`)
  - `ConsoleEmailService` for development (logs to console)
  - Ready for production email provider integration
- **Frontend:** Invitation management in team settings dialog

---

## Deployment & Infrastructure

**Status:** ✅ Production (December 2024)

### Domain & Hosting

- **Domain:** play-smith.com (registered via Squarespace)
- **Production URL:** https://www.play-smith.com
- **Staging URL:** https://stag.play-smith.com
- **Hosting Platform:** Railway (replaced AWS RDS in December 2024)
- **Database:** PostgreSQL on Railway

### DNS Configuration

**Domain Registrar:** Squarespace

**DNS Records:**
- `www.play-smith.com` → CNAME to Railway production service
- `stag.play-smith.com` → CNAME to Railway staging service
- `play-smith.com` → Forwards to `www.play-smith.com` (via Squarespace domain forwarding)

**SSL Certificates:** Auto-provisioned by Railway via Let's Encrypt

### Deployment Environments

Play Smith uses a three-environment deployment strategy:

1. **Local** - Development on developer machines
   - Branch: `main` (or feature branches)
   - Database: Local PostgreSQL or Railway staging DB
   - Runtime: `BUN_ENV=development`

2. **Staging** - Integration testing on Railway
   - Branch: `staging`
   - URL: https://stag.play-smith.com
   - Database: Separate PostgreSQL instance on Railway
   - Runtime: `BUN_ENV=staging`
   - Auto-deploy: ✅ ON

3. **Production** - Live application
   - Branch: `release-1.0`
   - URL: https://www.play-smith.com
   - Database: Production PostgreSQL on Railway
   - Runtime: `BUN_ENV=production`
   - Auto-deploy: ⚠️ OFF (manual deployments only)

### Branch Strategy

```
main          → Active development work (local)
  ↓
staging       → Integration & testing (Railway staging)
  ↓
release-1.0   → Production release (Railway production)
```

**Workflow:**
1. Develop features on `main` or feature branches
2. Merge to `staging` for integration testing on Railway
3. Test thoroughly on staging environment
4. Merge `staging` to `release-1.0` for production release
5. Manually trigger deployment in Railway

**Release Tagging:** Production releases are tagged with semantic versions (e.g., `v1.0.0`)

### Technology Stack

- **Runtime:** Bun v1.3+
- **Frontend:** React 19, Plain CSS (component-scoped stylesheets)
- **Backend:** Bun.serve (native HTTP server)
- **Database:** PostgreSQL 17.7 with PostGIS extensions
- **Deployment:** Railway with Nixpacks build system

### Migration from AWS

Play Smith migrated from AWS RDS PostgreSQL to Railway in December 2024:
- Simplified infrastructure management
- Reduced hosting costs (~50% reduction)
- Improved developer experience with auto-deployments
- Maintained database schema via migration system

See `docs/DeploymentGuide.md` for detailed deployment procedures.

---

## Technical Considerations

- Implement an efficient system for saving and retrieving components
- Ensure good modularity in the architecture
- Maintain clear documentation of color schemes and styling conventions
- Add audit logging that records who changed what and when
- **Idea:** Type a play call to intelligently generate a play using a
	combination of deterministic programming and LLM integration (LLM interprets
	and formats to JSON, which connects to the API for component creation)

---

## Future Ideas

### Analytics & User Insights (PostHog)

**Status:** 🔮 Future consideration (implement after 20-50 active users)

PostHog is an open-source product analytics platform that would help understand user behavior and optimize the Play Smith experience.

**Key capabilities:**
- **Event tracking** - Monitor tool usage, play creation, playbook management
- **Session recording** - Watch how users interact with the whiteboard (privacy controls required)
- **Feature flags** - Controlled rollouts for new features (formations, concepts, route templates)
- **Funnels** - Track conversion paths (registration → first play → first playbook)
- **Heatmaps** - Visualize toolbar clicks, canvas interactions
- **User cohorts** - Segment by team role, usage patterns, feature adoption

**High-value metrics to track:**
- Tool usage frequency (which tools are most/least used?)
- Keyboard shortcut adoption vs. mouse clicks
- Time to first play created after registration
- Play creation completion rate (started vs. saved)
- Feature discovery (do users find formations/concepts/tags?)
- Drop-off points in the editor workflow
- Playbook sharing patterns
- Average plays per playbook
- Hash position changes per play (field positioning preferences)

**Implementation considerations:**

*Deployment options:*
- **Self-hosted on Railway** - Adds PostgreSQL + ClickHouse services, full data control
- **PostHog Cloud** - Simpler setup, scales automatically, costs based on event volume

*Technical integration:*
```typescript
// Frontend tracking
import posthog from 'posthog-js'

posthog.init('PROJECT_KEY', {
  api_host: 'https://analytics.play-smith.com',
  capture_pageview: false, // Manual SPA tracking
  disable_session_recording: false,
  session_recording: {
    maskAllInputs: true, // Protect play names, tags
    maskTextSelector: '[data-sensitive]',
  }
})

// Track key events
posthog.capture('play_created', {
  personnel: play.personnel,
  tag_count: play.tags.length,
  player_count: play.players.length,
  hash_position: play.hashAlignment,
})

posthog.capture('tool_selected', {
  tool: 'draw',
  previous_tool: 'select',
  keyboard_shortcut: true,
})
```

*Privacy & security:*
- Mask sensitive data (play names, custom tags, team names)
- Disable session recording for playbook content (only track UI interactions)
- GDPR compliance via data retention policies
- Allow users to opt out of analytics

*When to implement:*
- **Wait until:** 20-50 active users generating meaningful patterns
- **Implement before:** Major feature launches (concepts, formations, templates)
- **Early alternative:** Basic event logging to PostgreSQL with simple dashboard

*Cost considerations:*
- **Cloud:** Free tier (1M events/month), then ~$200-500/mo for growth stage
- **Self-hosted:** Infrastructure costs (~$50-100/mo Railway), free PostHog license
- Events scale with active users × actions per session

**Complements existing systems:**
- **Audit logs** (who changed what, when) → Compliance & debugging
- **PostHog analytics** (how users behave) → Product decisions & UX optimization

### Play Sheet Creation
- Ability to curate and create custom playsheets that can be printed and used in game

### Route Features
- Pre-set routes with terminology based on offensive system
- Play concept support (specific routes and plays combined together)
- Route annotations at specific points:
	- Small icons/markers at key points (breaks, endpoints)
	- Markers showing details on hover (e.g., "12-yard break", "45° angle")
	- Draggable handles at key points for vector-style editing
	- Coach notes/technique cues at specific points (e.g., "head fake here",
		"stack the DB")

### Export & Integration

Play Smith should support multiple export formats tailored to different game day and study use cases. Research from coaching best practices (GoRout, 2025) identifies key export requirements:

**Game Day Formats:**
- **Call Sheets** - Sideline reference for coaches with condensed play information
  - Quick-scan format with play name, formation, personnel
  - Organized by situation (down-and-distance, red zone, etc.)
  - Printable PDF optimized for laminated cards or clipboards
- **Wristband Cards** - Player wristbands with play numbers/codes
  - Compact grid layout mapping codes to plays
  - Position-specific views showing only relevant assignments
  - Color-coded by play type (run/pass) or situation
- **Digital Play Calling** - Integration with wearable tech for real-time communication
  - Mobile-optimized play cards for tablets/phones
  - API support for systems like GoRout Scout

**Study Materials:**
- **Practice Packets** - Full playbook sections for player home study
  - Detailed diagrams with route depths and timing notes
  - Assignment breakdowns by position
  - Multiple plays per page for comparison
- **Install Sheets** - Teaching materials for introducing new plays
  - Step-by-step progression from basic to advanced concepts
  - Visual focus on key coaching points
  - Space for player notes

**Universal Export Features:**
- Consistent terminology across all formats (aligned with team settings)
- Visual clarity optimized for each medium (screen vs. print)
- Batch export by section, tag, or custom selection
- Templates for common layouts (call sheet, wristband, study guide)

**Integration Targets:**
- Import/export to/from Hudl
- PDF generation for printing
- PowerPoint/Keynote slides for film sessions
- CSV/JSON for custom integrations

### Analysis & Strategy
- Analysis of strengths/weaknesses vs opponent formation/play
- Weekly playbooks with defense appearance based on opposing team tendencies

### Infrastructure
- Outsource MySQL hosting

### UX Improvements
- Double-click items in dialogs to set as defaults
- Use targeted z-index values (minimal, effective) rather than arbitrarily
	high values
- Landing page idea: I have some idea for things I want try and include in this 
landing page. Have play cards that get displayed in the play book manager. I 
imagine on the landing page we will have a roledex type display where users will 
see play cards display and they will be rotating along the roledex. Additionally, 
we would have a animation which animates play cards getting transformed from play 
cards to getting shrunk down to the grid view of the playbook and then being 
grouped up and placed on a book.

### Information Resources
- Potential for a walkthrough of the features on the first time opening the software
- Keep tutorials modular so if someone doesn't understand how to use something we 
could add a ? icon/button to the feature which will play the tutorial for that one

## To-Do
- Figure out how we should handle adding concepts/formations
- Figure out how to handle terminology differences
- Figure out the updated player edit dialog with