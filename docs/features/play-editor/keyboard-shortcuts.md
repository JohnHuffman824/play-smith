# Keyboard Shortcuts

Complete reference of keyboard shortcuts available in the play editor for efficient workflow and quick tool access.

## Tool Shortcuts

| Shortcut | Tool | Description |
|----------|------|-------------|
| S | Select | Activate selection tool for clicking/dragging elements |
| A | Add Player | Activate player placement tool |
| D | Draw | Activate freehand drawing tool (opens draw options) |
| E | Erase | Activate erase tool for removing elements |
| C | Color | Open color picker dialog |
| F | Fill | Activate fill color tool (applies current color to clicked elements) |
| H | Ball on Hash | Open hash position dialog (Left/Middle/Right) |
| G | Add Component | Open component/concept selector dialog |
| R | Route | Open route tree dialog (1-9 basic routes) |

## Editing Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| Delete | Delete Selection | Remove selected element(s) from canvas |
| Backspace (⌫) | Delete Selection | Alternative delete key (Mac) |
| Cmd+Z | Undo | Undo last canvas action |
| Cmd+Shift+Z | Redo | Redo previously undone action (future) |
| Cmd+C | Copy | Copy selected element(s) (future) |
| Cmd+V | Paste | Paste copied element(s) (future) |
| Cmd+D | Duplicate | Duplicate selected element(s) (future) |

## Canvas Navigation Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| Spacebar (hold) | Pan Mode | Hold spacebar and drag to pan canvas |
| Cmd/Ctrl + | Zoom In | Increase zoom level (future) |
| Cmd/Ctrl - | Zoom Out | Decrease zoom level (future) |
| Cmd/Ctrl 0 | Reset Zoom | Reset zoom to 100% (future) |
| Cmd/Ctrl 9 | Fit to Screen | Zoom to fit entire field in viewport (future) |

## Hash Position Shortcuts (Future)

| Shortcut | Action | Description |
|----------|--------|-------------|
| 1 | Left Hash | Move ball to left hash |
| 2 | Middle Hash | Move ball to middle (field center) |
| 3 | Right Hash | Move ball to right hash |

**Note:** Currently requires opening hash dialog (H). Direct number shortcuts planned for future release.

## Selection Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| Click | Select Single | Select clicked element |
| Shift+Click | Add to Selection | Add clicked element to current selection (future) |
| Cmd+Click | Toggle Selection | Toggle clicked element in/out of selection (future) |
| Cmd+A | Select All | Select all elements on canvas (future) |
| Escape | Deselect All | Clear current selection |

## Multi-Selection Actions

**Prerequisites:** 2+ elements must be selected

| Action | Method | Description |
|--------|--------|-------------|
| Save as Concept | Multi-selection overlay button | Save selected elements as reusable concept |
| Delete Selection | Multi-selection overlay button | Remove all selected elements |
| Duplicate Selection | Multi-selection overlay button (future) | Create copy of selected elements |

## Drawing Shortcuts

**While using Draw tool:**

| Action | Method | Description |
|--------|--------|-------------|
| Click and drag | Draw path | Create freehand route or annotation |
| Release | Complete drawing | Finish drawing and create selectable component |

**Drawing property changes via sub-dialog (no keyboard shortcuts currently):**
- Line style (solid/dashed)
- End style (none/arrow/T-shape)
- Path mode (sharp/curve)
- Line thickness (thin/medium/thick/extra thick)

## Player Shortcuts

**When player selected:**

| Action | Method | Description |
|--------|--------|-------------|
| Click player | Open player dialog | Edit label, color, unlink, delete |
| Drag player | Move player | Reposition on field |
| Delete/Backspace | Delete player | Remove player (except default linemen) |

## Future Shortcuts (Planned)

### Quick Route Assignment
- 1-9 (with Route tool active): Instantly create numbered route from route tree
- Example: Press R (route tool), click player, press 8 (post route)

### Formation Shortcuts
- Cmd+1 through Cmd+9: Apply saved formation 1-9
- Shift+F: Open formation library

### View Shortcuts
- Cmd+H: Toggle play bar visibility (currently icon-only)
- Cmd+L: Toggle field markings (for clean screenshots)
- Cmd+G: Toggle grid/snap guides

### Concept Application
- Cmd+K: Open concept search (currently via Add Component or unified search)
- Cmd+Shift+K: Open formation search

## Shortcut Conflicts

### Operating System Conflicts

**Mac:**
- Cmd+H: Hides application (OS default). May conflict with future play bar toggle.
- Workaround: Use Ctrl+Cmd+H or toolbar icon

**Windows:**
- Alt+F4: Closes window (OS default). No conflict currently.

### Browser Conflicts

**Chrome/Edge:**
- Cmd/Ctrl+D: Bookmark page (browser default). May conflict with future Duplicate shortcut.
- Workaround: Use Cmd+Shift+D or menu option

**All Browsers:**
- Cmd/Ctrl+F: Find in page. No conflict (we don't use F modifier).

## Accessibility Notes

### Keyboard-Only Navigation

All editor functions are accessible via keyboard:

1. **Tab Navigation:**
   - Tab through toolbar tools
   - Tab through input fields
   - Tab through play cards

2. **Enter/Space:**
   - Activate buttons and tools
   - Open dialogs

3. **Arrow Keys:**
   - Navigate within dialogs and menus
   - Fine-tune selected element positions (future)

### Screen Reader Support

- Tool icons have aria-labels
- Keyboard shortcuts announced when tools activated
- Dialog content properly structured for screen readers

## Customization (Future)

**Settings Dialog - Keyboard Shortcuts Section:**
- View all shortcuts
- Customize key bindings
- Reset to defaults
- Import/export shortcut profiles
- Warning for conflicts

## Learning Shortcuts

### First-Time User Experience

**Tutorial Tooltips:**
- Hover tool icons to see keyboard shortcuts
- Tooltip format: "Draw (D)"
- Persistent hints until disabled

**Shortcut Hints:**
- Press `?` to show keyboard shortcut overlay (future)
- Searchable list of all shortcuts
- Organized by category (tools, editing, navigation)

### Power User Tips

**Most-Used Shortcuts:**
1. S (Select) - Switch from any tool back to selection mode
2. D (Draw) - Quick access to route creation
3. A (Add Player) - Rapid player placement
4. Cmd+Z (Undo) - Recover from mistakes
5. Delete - Quick element removal

**Workflow Example:**
1. Press A, click to add receiver
2. Press D, draw route from receiver
3. Press S, drag route start into receiver radius (link)
4. Press E, click errant drawing to erase
5. Cmd+Z if erased wrong element

## See Also

- [Toolbar Tools](./toolbar-tools.md) - Detailed tool documentation
- [Canvas Controls](../whiteboard/canvas-controls.md) - Zoom and pan controls
- [Drawing System](./drawing-system.md) - Drawing mechanics
- [Player Management](./player-management.md) - Player operations
