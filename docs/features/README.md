# Play Smith Features Documentation

This directory contains focused feature documentation extracted from the main design document. Each subdirectory covers a major feature area with detailed specifications, API endpoints, and implementation details.

## Feature Areas

### [Whiteboard](./whiteboard/)
The canvas where plays are created with precise field specifications and viewport controls.

- **[Field Specifications](./whiteboard/field-specifications.md)** - Exact college football field dimensions, markings, and visual styling
- **[Canvas Controls](./whiteboard/canvas-controls.md)** - Zoom, pan, and viewport management

### [Play Editor](./play-editor/)
The main workspace for creating and editing individual plays.

- **[Overview](./play-editor/overview.md)** - Layout, input fields, tags system, and play cards
- **[Toolbar Tools](./play-editor/toolbar-tools.md)** - Complete tool reference (select, draw, erase, color, routes, etc.)
- **[Drawing System](./play-editor/drawing-system.md)** - Drawing mechanics and player linking
- **[Player Management](./play-editor/player-management.md)** - Default linemen, positioning, and hash alignment
- **[Keyboard Shortcuts](./play-editor/keyboard-shortcuts.md)** - Complete keyboard shortcut reference

### [Playbook](./playbook/)
Organization and management of play collections.

- **[Management](./playbook/management.md)** - CRUD operations, permissions, and audit logging
- **[Sharing](./playbook/sharing.md)** - Cross-team playbook sharing with granular permissions
- **[Organization](./playbook/organization.md)** - Starred playbooks, trash/restore, and view modes
- **[Team Libraries](./playbook/team-libraries.md)** - Formations, personnel packages, and route templates

### [Concepts](./concepts/)
The concept system for reusable formations, plays, and modifiers.

- **[Overview](./concepts/overview.md)** - What concepts are and how they work
- **[Unified Search](./concepts/unified-search.md)** - Frecency-based search across formations, concepts, and groups
- **[Modifiers](./concepts/modifiers.md)** - Formation-specific modifier overrides

### [Animation](./animation/)
Play animation and visualization system.

- **[Play Animation](./animation/play-animation.md)** - Animation engine, playback controls, and visual effects

### [Presentations](./presentations/)
Slideshow-style presentation system for teaching and game planning.

- **[Presentation System](./presentations/presentation-system.md)** - Creating, managing, and viewing presentations

### [Authentication](./auth/)
User authentication, sessions, and team management.

- **[Authentication](./auth/authentication.md)** - Login, registration, and session management
- **[Teams](./auth/teams.md)** - Team structure, roles, and invitation system

## Document Conventions

### Status Indicators
- **✅ Implemented** - Feature is built and deployed
- **🔮 Future** - Planned for future development
- **No indicator** - Specification or baseline feature

### File Organization
Each feature document includes:
- **Overview** - High-level description of the feature
- **Features** - Detailed feature specifications
- **API Endpoints** (where applicable) - REST endpoints for backend integration
- **Technical Implementation** - Key files, components, and architecture details
- **See Also** - Cross-references to related features

## Navigation Tips

- Start with overview documents (`overview.md`, `README.md`) for high-level understanding
- Use "See Also" sections to discover related features
- API endpoint sections provide complete backend integration reference
- Technical implementation sections point to source code locations

## Contributing to Documentation

When updating feature documentation:
1. Keep files focused (200-400 lines target)
2. Include cross-references in "See Also" sections
3. Mark feature status clearly (✅ Implemented, 🔮 Future, etc.)
4. Update API endpoint documentation when routes change
5. Link to source code files when referencing implementation details

---

**Last Updated:** December 2024
**Source:** [DESIGN_DOCUMENT.md](../DESIGN_DOCUMENT.md)
