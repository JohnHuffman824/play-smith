# Presentation System

**Status:** ✅ Implemented (December 2024)

The presentations system allows coaches to create slideshow-style presentations from playbook plays for teaching, game planning, and film sessions.

## Overview

Presentations transform playbooks into structured slide decks, enabling coaches to sequence plays for meetings, practice installs, and game day preparation. Each presentation belongs to a playbook and contains an ordered collection of play slides.

## Presentation Features

### Creating Presentations

**From Playbook Manager:**
1. Open playbook
2. Click "New Presentation" button
3. Enter presentation name
4. Select initial plays (optional)
5. Create presentation

**API Endpoint:** `POST /api/playbooks/:playbookId/presentations`

**Request Body:**
```json
{
  "name": "Week 1 Game Plan",
  "description": "Install priorities for Friday night"
}
```

**Response:**
```json
{
  "id": "presentation-uuid",
  "playbookId": "playbook-uuid",
  "name": "Week 1 Game Plan",
  "description": "Install priorities for Friday night",
  "slideCount": 0,
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-01T10:00:00Z"
}
```

### Slide Management

#### Add Slides

**From Presentation Editor:**
1. Open presentation
2. Click "Add Slide"
3. Select play from playbook
4. Play added as new slide at end

**Bulk Add:**
- Select multiple plays
- Click "Add to Presentation"
- All plays added as slides

**API Endpoint:** `POST /api/presentations/:presentationId/slides`

**Request Body:**
```json
{
  "playId": "play-uuid"
}
```

**Response:**
```json
{
  "id": "slide-uuid",
  "presentationId": "presentation-uuid",
  "playId": "play-uuid",
  "order": 5,
  "notes": null
}
```

#### Reorder Slides

**Drag-and-Drop:**
1. Click and hold slide thumbnail
2. Drag to new position
3. Drop to reorder
4. Other slides reflow automatically

**API Endpoint:** `PUT /api/presentations/:presentationId/slides`

**Request Body:**
```json
{
  "slideOrder": [
    { "slideId": "slide-1", "order": 0 },
    { "slideId": "slide-3", "order": 1 },
    { "slideId": "slide-2", "order": 2 }
  ]
}
```

**Response:** Updated slide order

#### Remove Slides

**Click "X" on slide thumbnail:**
- Slide removed from presentation
- Play remains in playbook (not deleted)
- Subsequent slides reorder automatically

**API Endpoint:** `DELETE /api/presentations/:presentationId/slides/:slideId`

**Response:** 204 No Content

### Presentation Viewer

**Full-Screen Slideshow Mode:**
- Route: `/presentations/:presentationId/view`
- Full viewport rendering
- Navigation controls overlay
- Distraction-free viewing

#### Viewer Controls

**Navigation:**
- **Next Slide:** Click right arrow, press Right Arrow key, or press Space
- **Previous Slide:** Click left arrow, press Left Arrow key
- **Jump to Slide:** Click slide number indicator
- **Exit:** Press Escape or click Exit button

**Display:**
- Current slide number (e.g., "3 of 12")
- Slide indicator dots (small circles, current highlighted)
- Play name and metadata overlay (toggleable)

**Playback Modes:**

**Manual Advance (Default):**
- User controls slide progression
- Pause on each slide indefinitely
- Advance when ready

**Auto-Advance (Future):**
- Configurable delay (5, 10, 15, 30 seconds per slide)
- Automatic progression through entire presentation
- Pause button to suspend auto-advance

**Loop Mode:**
- After last slide, return to first
- Continuous playback
- Useful for pre-practice looping

#### Slide Content

**Play Rendering:**
- Full play diagram (field, players, routes)
- Same rendering as play editor (accurate representation)
- Zoom level: Fit entire field in viewport

**Optional Overlays:**

**Play Metadata:**
- Play name
- Formation, personnel
- Tags
- Defensive formation

**Notes:**
- Coach notes for this slide (future)
- Teaching points, keys, adjustments
- Displayed at bottom of slide

**Animation (Future):**
- Auto-play animation when slide loads
- Configurable (on/off per slide)
- See [Play Animation](../animation/play-animation.md)

### Presentation Playbook Integration

**Presentation List:**
- Presentations tab in playbook detail
- Card view showing:
  - Presentation name
  - Slide count
  - Last modified date
  - Preview (first 3-4 slides)
- Click to open presentation editor

**Quick Access:**
- Recent presentations sidebar (future)
- Starred presentations (future)
- Search presentations by name

## API Endpoints

### List Presentations

**Endpoint:** `GET /api/playbooks/:playbookId/presentations`

**Response:**
```json
[
  {
    "id": "presentation-uuid-1",
    "playbookId": "playbook-uuid",
    "name": "Week 1 Game Plan",
    "description": "Install priorities",
    "slideCount": 12,
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-05T14:30:00Z"
  }
]
```

### Get Presentation with Slides

**Endpoint:** `GET /api/presentations/:presentationId`

**Response:**
```json
{
  "id": "presentation-uuid",
  "playbookId": "playbook-uuid",
  "name": "Week 1 Game Plan",
  "description": "Install priorities",
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-05T14:30:00Z",
  "slides": [
    {
      "id": "slide-uuid-1",
      "playId": "play-uuid-1",
      "playName": "Z Post",
      "playThumbnail": "data:image/png;base64,...",
      "order": 0,
      "notes": "Teach break at 12 yards"
    },
    {
      "id": "slide-uuid-2",
      "playId": "play-uuid-2",
      "playName": "Power O",
      "playThumbnail": "data:image/png;base64,...",
      "order": 1,
      "notes": null
    }
  ]
}
```

### Update Presentation

**Endpoint:** `PUT /api/presentations/:presentationId`

**Request Body:**
```json
{
  "name": "Week 1 Install - Updated",
  "description": "Updated description"
}
```

**Response:** Updated presentation object

### Delete Presentation

**Endpoint:** `DELETE /api/presentations/:presentationId`

**Response:** 204 No Content

**Behavior:**
- Presentation deleted
- All slides deleted (CASCADE)
- Plays remain in playbook (not deleted)

## Database Schema

### presentations Table

```sql
CREATE TABLE presentations (
  id UUID PRIMARY KEY,
  playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `playbook_id` for listing playbook presentations

### presentation_slides Table

```sql
CREATE TABLE presentation_slides (
  id UUID PRIMARY KEY,
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
  slide_order INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (presentation_id, slide_order)
);
```

**Indexes:**
- `presentation_id` for listing slides in a presentation
- `play_id` for finding presentations containing a play
- Unique constraint on (presentation_id, slide_order) prevents duplicate ordering

**Cascade Behavior:**
- Delete presentation → all slides deleted
- Delete play → slides referencing play deleted (or set play_id to null - configurable)

## Technical Implementation

### Frontend Components

**PresentationCard:**
- **Location:** `src/components/presentations/PresentationCard.tsx`
- **Displays:** Presentation in playbook list
- **Features:** Name, slide count, preview, edit/delete actions

**PresentationEditor:**
- **Location:** `src/components/presentations/PresentationEditor.tsx`
- **Features:** Add/remove/reorder slides
- **Drag-and-Drop:** Reorder slides via drag-and-drop

**PresentationViewerModal:**
- **Location:** `src/components/presentations/PresentationViewerModal.tsx`
- **Features:** Full-screen slideshow, navigation, playback controls

**NewPresentationDialog:**
- **Location:** `src/components/presentations/NewPresentationDialog.tsx`
- **Features:** Create new presentation, set name/description

### Drag-and-Drop Implementation

**Library:** react-beautiful-dnd (or native HTML5 drag-and-drop)

**Workflow:**
1. User drags slide thumbnail
2. Drag preview shows slide being moved
3. Drop zones highlight on hover
4. On drop, API call updates slide order
5. UI optimistically updates (no waiting for server)

## Use Cases

### Weekly Install

**Scenario:** Install new plays for Friday's game

**Workflow:**
1. Create "Week 1 Install" presentation
2. Add 5-8 key plays from playbook
3. Order by install priority (teach easiest first)
4. Present to team in meeting
5. Players see plays in sequence, logical progression

### Film Session

**Scenario:** Review plays after practice

**Workflow:**
1. Create "Wednesday Practice Review" presentation
2. Add plays that need correction
3. Present with film clips (side-by-side - future)
4. Compare designed play to actual execution
5. Identify coaching points

### Game Day Call Sheet

**Scenario:** Quick reference during game

**Workflow:**
1. Create "Friday Night Call Sheet" presentation
2. Add 15-20 most likely plays
3. Order by down-and-distance
4. Use tablet on sideline
5. Swipe through plays quickly for reminders

### Parent/Fan Education

**Scenario:** Explain offense to supporters (future: public sharing)

**Workflow:**
1. Create "Offense 101" presentation
2. Add basic plays with annotations
3. Share link with parents/fans
4. Public-friendly explanations (no complex terminology)

## Presentation Permissions

**Access Control:**
- Inherits from playbook permissions
- Team owners/editors can create/edit presentations
- Viewers can view presentations (read-only)
- Shared playbooks: Edit access allows presentation creation

**Sharing (Future):**
- Share presentation link (separate from playbook)
- Public presentations (no login required)
- Password-protected presentations

## Export & Integration

### PDF Export (Future)

**Format:** One slide per page
**Features:**
- Play diagrams rendered at high resolution
- Play metadata included
- Notes printed below diagram
- Page numbers and presentation name in footer

**Use Cases:**
- Print for coaches without tablets
- Archive presentations
- Share via email

### PowerPoint/Keynote Export (Future)

**Format:** Native slide deck
**Features:**
- Each play as editable image
- Metadata as text boxes
- Customizable templates
- Merge with other slides (film clips, text)

**Use Cases:**
- Full team presentations with film + plays
- Combine multiple sources
- Leverage existing presentation tools

### Interactive Sharing (Future)

**Web Link:**
- Generate shareable link
- Anyone with link can view
- No login required (optional)
- Analytics: track views, time per slide

**Embed Code:**
- Embed presentation on website
- Recruit showcase (highlight plays)
- Team website integration

## Future Enhancements

### Slide Annotations

**Drawing Tools:**
- Annotate plays during presentation
- Highlight specific players/routes
- Arrows, circles, text overlays
- Annotations saved per slide (optional)

### Presenter Notes

**Private Notes:**
- Coach-only notes (not visible to team)
- Teaching points, reminders, keys
- Displayed on presenter screen (dual monitor setup)

### Branching Presentations

**Conditional Slides:**
- "If opponent shows Cover 2, go to slide 5"
- Decision trees for game planning
- Interactive presentation flow

### Slide Templates

**Custom Layouts:**
- Split-screen (play + notes)
- Side-by-side (two plays for comparison)
- Grid (4-6 plays on one slide)
- Text-only (coaching points, no diagram)

### Collaboration

**Multi-User Editing:**
- Multiple coaches build presentation together
- Real-time updates
- Comment threads on slides

### Version History

**Track Changes:**
- Save presentation versions
- Revert to previous version
- Compare versions (what changed?)

---

## See Also

- [Play Animation](../animation/play-animation.md) - Animating plays in presentations
- [Playbook Management](../playbook/management.md) - Playbook organization
- [Play Editor Overview](../play-editor/overview.md) - Creating plays for presentations
