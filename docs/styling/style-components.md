# PlaySmith Component Library

**Purpose:** Reference for all reusable UI components
**Location:** `src/components/ui/`

> **When creating a new reusable component**, add it to this file.

---

## Buttons

| Component | Import | Use For |
|-----------|--------|---------|
| `Button` | `@/components/ui/button` | Text buttons, forms, CTAs |
| `IconButton` | `@/components/ui/icon-button` | Icon-only actions with tooltip (40x40 or 24x24) |
| `ToolbarButton` | `@/components/ui/toolbar-button` | Main toolbar buttons with active state (56x56) |
| `DialogCloseButton` | `@/components/ui/dialog-close-button` | Dialog X close button (24x24) |
| `ClickableButton` | `@/components/ui/clickable-button` | Base clickable element |

### Button Variants
```tsx
<Button variant="default">Default</Button>
<Button variant="action">Save</Button>        // Blue primary action
<Button variant="destructive">Delete</Button> // Red danger
<Button variant="outline">Cancel</Button>     // Bordered
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>        // No background
<Button variant="link">Link</Button>          // Text link style
```

---

## Form Elements

| Component | Import | Use For |
|-----------|--------|---------|
| `Input` | `@/components/ui/input` | Text input fields |
| `Textarea` | `@/components/ui/textarea` | Multi-line text |
| `Select` | `@/components/ui/select` | Dropdown selection |
| `Checkbox` | `@/components/ui/checkbox` | Boolean toggle (checkbox) |
| `Switch` | `@/components/ui/switch` | Boolean toggle (switch) |
| `RadioGroup` | `@/components/ui/radio-group` | Single selection from options |
| `Slider` | `@/components/ui/slider` | Range input |
| `Label` | `@/components/ui/label` | Form labels |
| `Form` | `@/components/ui/form` | Form wrapper with validation |
| `InputOTP` | `@/components/ui/input-otp` | One-time password input |
| `SearchInput` | `@/components/ui/search-input` | Search field with icon |

---

## Layout & Containers

| Component | Import | Use For |
|-----------|--------|---------|
| `Card` | `@/components/ui/card` | Content cards |
| `Dialog` | `@/components/ui/dialog` | Modal dialogs |
| `Sheet` | `@/components/ui/sheet` | Slide-out panels |
| `Drawer` | `@/components/ui/drawer` | Bottom/side drawers |
| `Popover` | `@/components/ui/popover` | Floating content |
| `HoverCard` | `@/components/ui/hover-card` | Hover-triggered cards |
| `AlertDialog` | `@/components/ui/alert-dialog` | Confirmation dialogs |
| `Collapsible` | `@/components/ui/collapsible` | Expandable sections |
| `Accordion` | `@/components/ui/accordion` | Collapsible sections |
| `Tabs` | `@/components/ui/tabs` | Tabbed content |
| `ScrollArea` | `@/components/ui/scroll-area` | Custom scrollbars |
| `Resizable` | `@/components/ui/resizable` | Resizable panels |
| `AspectRatio` | `@/components/ui/aspect-ratio` | Fixed aspect containers |
| `Separator` | `@/components/ui/separator` | Visual dividers |

---

## Navigation

| Component | Import | Use For |
|-----------|--------|---------|
| `NavigationMenu` | `@/components/ui/navigation-menu` | Main navigation |
| `Menubar` | `@/components/ui/menubar` | Menu bar |
| `DropdownMenu` | `@/components/ui/dropdown-menu` | Dropdown menus |
| `ContextMenu` | `@/components/ui/context-menu` | Right-click menus |
| `Command` | `@/components/ui/command` | Command palette |
| `Breadcrumb` | `@/components/ui/breadcrumb` | Breadcrumb navigation |
| `Pagination` | `@/components/ui/pagination` | Page navigation |
| `Sidebar` | `@/components/ui/sidebar` | App sidebar |

---

## Feedback & Status

| Component | Import | Use For |
|-----------|--------|---------|
| `Alert` | `@/components/ui/alert` | Alert messages |
| `Badge` | `@/components/ui/badge` | Status badges |
| `Progress` | `@/components/ui/progress` | Progress bars |
| `Skeleton` | `@/components/ui/skeleton` | Loading placeholders |
| `Sonner` | `@/components/ui/sonner` | Toast notifications |
| `Tooltip` | `@/components/ui/tooltip` | Hover tooltips |

---

## Data Display

| Component | Import | Use For |
|-----------|--------|---------|
| `Table` | `@/components/ui/table` | Data tables |
| `Chart` | `@/components/ui/chart` | Charts/graphs |
| `Avatar` | `@/components/ui/avatar` | User avatars |
| `Calendar` | `@/components/ui/calendar` | Date picker |
| `Carousel` | `@/components/ui/carousel` | Image/content carousel |

---

## Primitives

| Component | Import | Use For |
|-----------|--------|---------|
| `Toggle` | `@/components/ui/toggle` | Toggle button |
| `ToggleGroup` | `@/components/ui/toggle-group` | Grouped toggles |

---

## Usage Notes

### Tooltip Requirement
Components with built-in tooltips require `TooltipProvider`:
```tsx
import { TooltipProvider } from '@/components/ui/tooltip'

<TooltipProvider>
  <IconButton icon={Settings} tooltip="Settings" />
</TooltipProvider>
```

### Custom Icons with ToolbarButton
`ToolbarButton` expects `LucideIcon` type. For custom icons, use manual tooltip wrapping - see [STYLE_GUIDE.md](./STYLE_GUIDE.md) Section 8.
