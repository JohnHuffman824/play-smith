# PlaySmith Frontend Architecture

## Overview

PlaySmith is a football play drawing application built with React, TypeScript, and Bun. The architecture follows clean code principles with clear separation of concerns, type safety, and zero code duplication.

## Directory Structure

```
src/
├── constants/          # Centralized constants
│   └── field.constants.ts
├── types/              # TypeScript type definitions
│   ├── play.types.ts
│   ├── drawing.types.ts
│   └── field.types.ts
├── utils/              # Pure utility functions
│   ├── coordinates.ts
│   └── canvas.utils.ts
├── hooks/              # Custom React hooks
│   ├── useFieldCoordinates.ts
│   ├── useDialogAutoClose.ts
│   ├── useKeyboardShortcuts.ts
│   └── usePlayerDrag.ts
├── services/           # Application services
│   └── EventBus.ts
├── contexts/           # React contexts
│   ├── ThemeContext.tsx
│   └── PlayContext.tsx
└── components/         # React components (domain-organized)
    ├── canvas/         # Canvas and drawing
    ├── toolbar/        # Toolbar and dialogs
    ├── player/         # Players and linemen
    ├── plays/          # Play management
    ├── field/          # Football field
    └── ui/             # Shadcn UI components
```

## Core Systems

### Coordinate System

The application uses a dual coordinate system:

**Feet Coordinates (Storage)**
- Origin: Bottom-left (0, 0)
- Y-axis: Increases upward
- Width: 160 feet (college football field)
- Used for: Data storage, logical positioning

**Web Pixel Coordinates (Rendering)**
- Origin: Top-left (0, 0)
- Y-axis: Increases downward
- Width: Dynamic (responsive)
- Used for: DOM rendering, mouse events

**Implementation:**
- `FieldCoordinateSystem` class handles all conversions
- `useFieldCoordinates` hook provides access to coordinate system
- Automatic scaling based on container dimensions
- Single source of truth for field dimensions

### Event System

Type-safe event bus replaces unsafe window events:

**Features:**
- TypeScript-enforced event types and payloads
- No global scope pollution
- Easy to trace event dependencies
- Full IDE autocomplete support

**Usage:**
```typescript
// Emit event
eventBus.emit('canvas:clear')
eventBus.emit('player:fill', { id: 'player-1', color: '#ff0000' })

// Listen for event
eventBus.on('canvas:undo', () => handleUndo())
eventBus.off('canvas:undo', handlerRef)
```

### State Management

**PlayContext** provides centralized state management:
- Eliminates props drilling
- Reducer pattern for predictable updates
- Convenience methods for common operations
- Type-safe actions

## Custom Hooks

### useFieldCoordinates
Provides coordinate system with automatic dimension updates.

### useDialogAutoClose
Generic hook for auto-closing dialogs when cursor moves away.

### useKeyboardShortcuts
Centralizes all keyboard shortcut definitions and handling.

### usePlayerDrag
Reusable drag-and-drop logic for players and linemen.

## Testing

Comprehensive test suite with 75+ tests:
- Unit tests for all utilities and hooks
- Integration tests for main app flow
- 100% coverage of critical paths
- Fast execution (215ms)

Run tests:
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage report
```

## Development Guidelines

### Adding New Features

1. **Add types first** in `src/types/`
2. **Add constants** in `src/constants/` if needed
3. **Create utilities/hooks** in `src/utils/` or `src/hooks/`
4. **Add tests** for utilities and hooks
5. **Create/update components** in appropriate domain folder
6. **Update barrel exports** (index.ts) if needed

### Code Organization

- Components: Organize by domain (canvas, toolbar, player, etc.)
- Keep components < 250 lines
- Extract reusable logic into hooks
- Pure functions go in utils/
- Constants are centralized
- Types are shared

### Event Communication

- Use `eventBus` for cross-component communication
- Add new events to `EventMap` in EventBus.ts
- Prefer events over prop callbacks for loosely coupled components

## Performance

- Build time: ~240ms
- Hot reload: ~15ms
- Zero runtime errors
- Responsive coordinate system
- Optimized rendering with proper React patterns

## Future Improvements

Possible enhancements (not required):
- Split Canvas.tsx further into layer components
- Add undo/redo history management
- Implement play saving/loading
- Add more keyboard shortcuts
- Create custom Toolbar buttons component
