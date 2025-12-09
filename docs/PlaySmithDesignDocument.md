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
- Scrollable left to right
- Each card is a rounded rectangle showing the play with a label at the bottom
- An "Add" button appears at the far right to create new plays

### Default Elements

By default, each play auto-populates with 5 offensive linemen:
- Represented as 2-foot radius circles
- Spaced 1 foot apart from each other
- Not removable, but individually movable
- Each lineman is an individual player component
- Center (middle lineman) is automatically placed at field center
- Position can be adjusted via the hash button (left hash, middle, or right hash)

### Drawing–Player Linking

- Link by dragging a drawing node inside a player’s radius (glow indicates snap); one drawing per player
- The linked control point hides (drawn behind the player) and moves in lockstep with the player
- Dragging a linked drawing moves its player; dragging the player moves the drawing (bidirectional lock)
- Unlink via the player label dialog (unlink button beside custom text/delete); the node reappears ~5 ft along the prior segment direction from the player
- If no link exists, the player dialog’s custom text input spans the full row
- Prevent merging two drawings when both drawings already have player links

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

**Move Skills on Hash Change**
- Values: Yes, No
- Function: Determines whether skill position players move with linemen when
	hash position changes

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
	team’s chosen terminology

---

## Login & Authentication

A login page with user authentication is required. This is planned for a later
development stage, likely when migrating from SQLite to MySQL.

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
- Play sheet creation
- Import/export to/from Hudl
- Import/export to PDF/slides

### Analysis & Strategy
- Analysis of strengths/weaknesses vs opponent formation/play
- Weekly playbooks with defense appearance based on opposing team tendencies

### Infrastructure
- Outsource MySQL hosting

### UX Improvements
- Double-click items in dialogs to set as defaults
- Use targeted z-index values (minimal, effective) rather than arbitrarily
	high values

### Information Resources
- Potential for a walkthrough of the features on the first time opening the software
- Keep tutorials modular so if someone doesn't understand how to use something we 
could add a ? icon/button to the feature which will play the tutorial for that one
