# Playbook Editor Interface

A complete, self-contained playbook editor interface for Play Smith following strict mako-review code quality standards.

## Structure

```
/playbookEditorInterface/
├── PlaybookEditor.tsx           # Main entry component
├── constants/
│   └── playbook.ts              # All constants (play types, colors, styles)
├── components/
│   ├── PlayCard.tsx             # Individual play card component (grid view)
│   ├── PlayListView.tsx         # List view for plays
│   ├── PlaybookEditorToolbar.tsx # Toolbar with actions and section filters
│   ├── Modal.tsx                # Reusable modal component
│   ├── SettingsDialog.tsx       # Settings configuration dialog
│   └── ShareDialog.tsx          # Share playbook dialog
└── contexts/
    └── ConfigContext.tsx        # Configuration state management
```

## Code Quality Standards

All code in this module follows mako-review conventions:

### TypeScript/React Rules
- ✅ No semicolons at end of lines
- ✅ Use `==` and `!=` instead of `===` and `!==`
- ✅ Single quotes for string literals
- ✅ Named functions use `function` keyword
- ✅ No `$` prefix on variables

### Code Quality
- ✅ KISS: Simple, understandable code
- ✅ DRY: No repeated logic
- ✅ YAGNI: No unused features or variables
- ✅ Constants defined for all magic strings and numbers
- ✅ Zero tolerance for incorrect behavior

### Constants
All constants are defined in `/constants/playbook.ts`:
- Play types (Pass, Run)
- View modes (Grid, List)
- UI constants (MAX_VISIBLE_TAGS)
- Tag colors from design document
- Common class names for reusability

## Usage

```tsx
import PlaybookEditor from './playbookEditorInterface/PlaybookEditor'

function App() {
  return (
    <PlaybookEditor
      playbookId="123"
      playbookName="Offensive Game Plan - Week 1"
      onBack={() => console.log('Back clicked')}
    />
  )
}
```

## Features

### Play Management
- Grid and list view modes
- Create, rename, duplicate, and delete plays
- Section organization
- Search functionality
- Multi-select capabilities

### Play Cards
- Visual thumbnail preview
- Play type badge (Pass/Run)
- Formation and personnel display
- Defensive formation
- Color-coded tags
- Last modified timestamp

### Sharing
- Email invitations with roles (Viewer/Collaborator)
- Link sharing with copy functionality
- Role management per recipient

### Settings
- Theme toggle (Light/Dark)
- Position naming systems
- Competition level (High School, College, Pro)
- Field configuration options

## Components

### PlaybookEditor
Main container component with state management for:
- View mode (grid/list)
- Search filtering
- Section filtering
- Play selection
- Modal dialogs

### PlayCard
Split into sub-components for clarity:
- `PlayCardThumbnail`: Visual preview with play type badge
- `PlayCardMenu`: Dropdown menu for actions
- `PlayCardTags`: Color-coded tag display

### PlayListView
Table view with:
- Sortable columns
- Inline actions
- Row selection
- Responsive layout

## Design System

All components use CSS variables from the global design system:
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--border`

Dark mode is automatically applied via the `dark` class on `document.documentElement`.

## Dependencies

External dependencies:
- `react` - UI framework
- `lucide-react` - Icon library

Internal dependencies:
- Design system CSS variables (assumed to be in global styles)
- Tailwind CSS for utility classes
