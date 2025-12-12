# Presentations Feature Brainstorm

**Status:** Brainstorming
**Date:** 2025-12-11

## Overview

Exploring the idea of adding presentation support to Play Smith, allowing coaches to create and deliver animated play presentations.

---

## Questions & Answers

### Q1: What is the primary use case?

**Answer:** Both
- In-app presentation mode (coach presents to players during practice/film sessions)
- Exportable formats for external sharing (video/PDF/slides)

### Q2: What export formats are most important?

**Answer:** Google Slides/PowerPoint and PDF
- NOT video (at least not initially)
- Slides for editable presentations coaches can customize
- PDF for printable game-day materials

### Q3: What content goes into a presentation?

**Answer:** Curated play selection
- Coach picks specific plays from their playbooks (like a playlist)
- Not full playbook export or mixed content with custom slides

### Q4: How should animations work in-app vs exports?

**Answer:** Static + animate on demand
- Shows static diagram by default
- Coach triggers animation when ready to demonstrate
- Good for teaching: explain the diagram, then show motion

### Q5: Where should presentations live in the app?

**Answer:** Hybrid approach
- Created from within a playbook context (sourcing plays from that playbook)
- Accessible/managed through the Playbook Manager page
- Playbook Manager becomes a high-level hub for managing and distributing content
- Hierarchy: Team > Playbooks > (Plays + Presentations)

### Q6: For PDF/Slides export, how should it work?

**Answer:** Server-side generation
- Backend generates files using libraries (puppeteer for PDF, pptxgenjs for PowerPoint)
- More reliable, works offline
- Download triggered from UI, file generated on server

### Q7: What information should appear on each play slide?

**Answer:** Diagram + metadata
- Large play diagram
- Play name, formation, personnel, tags displayed around it
- Clean layout with relevant context

---

## Summary of Requirements

Based on our discussion:

1. **In-App Presentation Mode**
   - Full-screen slideshow of curated plays
   - Static diagram by default, animate on-demand
   - Coach controls (next/prev, animate, pause)

2. **Export Formats**
   - PDF (printable)
   - PowerPoint/Google Slides (editable)
   - Server-side generation

3. **Content Model**
   - Presentations are curated play selections (playlists)
   - Sourced from a single playbook
   - Each slide shows diagram + metadata

4. **UI Location**
   - Created within playbook context
   - Managed from Playbook Manager page
   - Playbook Manager becomes hub for plays + presentations

---

## Proposed Design

### Database Schema

**Table: `presentations`**
```sql
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT presentations_name_playbook_unique UNIQUE (playbook_id, name)
);

CREATE INDEX idx_presentations_playbook ON presentations(playbook_id);
```

**Table: `presentation_slides`**
```sql
CREATE TABLE presentation_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT slides_order_unique UNIQUE (presentation_id, order_index),
  CONSTRAINT slides_play_unique UNIQUE (presentation_id, play_id)
);

CREATE INDEX idx_slides_presentation ON presentation_slides(presentation_id);
CREATE INDEX idx_slides_order ON presentation_slides(presentation_id, order_index);
```

**Key decisions:**
- Presentations belong to a playbook (CASCADE delete)
- Slides reference plays (not copies) - plays are finalized before adding to presentation
- Order preserved via `order_index`
- No duplicate plays in same presentation

---

### UI & Component Architecture

**Entry Points (Playbook Manager Page):**
1. Add "Presentations" tab or section alongside plays list
2. "New Presentation" button opens creation dialog
3. Presentation cards show name, play count, last modified
4. Actions: Open, Edit, Present, Export, Delete

**Presentation Editor:**
- Similar to a playlist editor
- Left panel: available plays from the playbook (searchable, filterable)
- Right panel: presentation slides in order (drag to reorder)
- Add plays via drag-drop or click
- Preview thumbnail for each slide
- Save/Cancel buttons

**Presentation Viewer (In-App Mode):**
- Full-screen modal (similar to existing PlayViewerModal)
- Shows one play at a time with large diagram + metadata
- Controls:
  - Previous / Next slide
  - Animate button (triggers play animation)
  - Animation controls (play/pause/speed) when animating
  - Exit presentation
- Keyboard shortcuts: Arrow keys (nav), Space (animate), Esc (exit)

**Export Dialog:**
- Opens from presentation card menu
- Format selector: PDF or PowerPoint
- Optional: page layout settings (landscape/portrait)
- "Generate" button triggers server-side export
- Download link provided when ready

---

### Export Implementation

**Libraries:**
- **PDF:** `puppeteer` - Render HTML to PDF server-side
- **PowerPoint:** `pptxgenjs` - Generate .pptx files programmatically

**API Endpoints:**
```
POST /api/presentations/:id/export
  Body: { format: 'pdf' | 'pptx', options?: { orientation: 'landscape' | 'portrait' } }
  Response: { downloadUrl: string } or { jobId: string } for async

GET /api/exports/:jobId
  Response: { status: 'pending' | 'complete' | 'failed', downloadUrl?: string }
```

**Slide Layout (common to both formats):**
```
┌────────────────────────────────────────────────┐
│  Play Name                     Formation: Twins │
├────────────────────────────────────────────────┤
│                                                │
│                                                │
│             [PLAY DIAGRAM]                     │
│              (Large, centered)                 │
│                                                │
│                                                │
├────────────────────────────────────────────────┤
│  Personnel: 11    Tags: [Redzone] [3rd Down]   │
└────────────────────────────────────────────────┘
```

**PDF Generation Flow:**
1. Fetch presentation with slides and play data
2. Render each slide as HTML using existing `PlayThumbnailSVG` component (or similar)
3. Use puppeteer to render HTML to PDF pages
4. Save to temp file, return download URL
5. Clean up after download or TTL expiry

**PowerPoint Generation Flow:**
1. Fetch presentation data
2. For each slide:
   - Create pptx slide
   - Render play diagram as SVG, embed as image
   - Add text boxes for name, formation, personnel, tags
3. Save .pptx file, return download URL

**Considerations:**
- Async generation for large presentations (10+ slides)
- Progress indication in UI
- Temp file cleanup via cron job or TTL

---

### Implementation Phases

**Phase 1: Core Infrastructure**
- Database migration (presentations, presentation_slides tables)
- API endpoints for CRUD operations
- TypeScript types for presentations

**Phase 2: Presentation Editor**
- PresentationEditor component (playlist-style)
- Integration into Playbook Manager page
- Presentation cards with actions menu

**Phase 3: Presentation Viewer**
- PresentationViewerModal component
- Static diagram display with metadata
- Animate-on-demand using existing AnimationContext
- Keyboard navigation

**Phase 4: Export - PDF**
- Install puppeteer
- Export API endpoint
- PDF generation service
- Slide HTML template

**Phase 5: Export - PowerPoint**
- Install pptxgenjs
- PowerPoint generation service
- SVG-to-image conversion for diagrams

---

## Files to Create/Modify

**New Files:**
- `src/db/migrations/XXX_presentations.ts`
- `src/types/presentation.types.ts`
- `src/api/presentations.ts`
- `src/api/queries/presentationQueries.ts`
- `src/components/presentations/PresentationEditor.tsx`
- `src/components/presentations/PresentationCard.tsx`
- `src/components/presentations/PresentationViewerModal.tsx`
- `src/components/presentations/ExportDialog.tsx`
- `src/services/export/pdfGenerator.ts`
- `src/services/export/pptxGenerator.ts`
- `src/templates/slideTemplate.html`

**Modified Files:**
- `src/pages/PlaybookManagerPage.tsx` - Add presentations tab
- `src/server/index.ts` - Register presentation routes

---

## Status

**Design Status:** ✅ Complete
**Ready for Implementation:** Yes

---

## Current Understanding

### Existing Animation Infrastructure
- `AnimationContext` - Centralized animation state (play/pause/seek/speed)
- `AnimationCanvas` - Renders animated routes and players
- `AnimationControls` - Play/pause, scrubber, speed selector, loop toggle
- `PlayViewerModal` - Full-screen modal with slideshow navigation between plays
- Animation runs at configurable speeds (0.25x - 2x)
- Ghost trails show player movement history

### Existing Export (Not Implemented)
- Placeholder handlers exist in PlaybookEditorPage and PlaybookManagerPage
- Design doc mentions future: "Import/export to PDF/slides"

---

## Design Options

*To be explored after understanding requirements...*

---

## Database Schema Ideas

*To be designed after clarifying scope...*

---

## Implementation Notes

*To be added after design is finalized...*
