# PlaySmith Component Documentation

**Last Updated:** 2025-01

Quick reference for all 46 shadcn/ui components in PlaySmith.

---

## Quick Lookup Table

| Component | Category | Key Variants | Documentation |
|-----------|----------|--------------|---------------|
| Accordion | Utility | - | [utilities/accordion.md](./utilities/accordion.md) |
| Alert | Data Display | default, destructive | [data-display/badges.md](./data-display/badges.md) |
| AlertDialog | Overlay | - | [overlay/dialogs.md](./overlay/dialogs.md) |
| AspectRatio | Layout | - | [layout/containers.md](./layout/containers.md) |
| Avatar | Data Display | - | [data-display/avatars.md](./data-display/avatars.md) |
| Badge | Data Display | default, secondary, destructive, outline | [data-display/badges.md](./data-display/badges.md) |
| Breadcrumb | Navigation | - | [navigation/tabs.md](./navigation/tabs.md) |
| Button | Foundational | default, destructive, outline, secondary, ghost, link | [foundational/buttons.md](./foundational/buttons.md) |
| Calendar | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| Card | Layout | - | [layout/cards.md](./layout/cards.md) |
| Carousel | Layout | - | [layout/carousel.md](./layout/carousel.md) |
| Chart | Data Display | - | [data-display/charts.md](./data-display/charts.md) |
| Checkbox | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| Collapsible | Utility | - | [utilities/accordion.md](./utilities/accordion.md) |
| Command | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| ContextMenu | Overlay | - | [overlay/menus.md](./overlay/menus.md) |
| Dialog | Overlay | - | [overlay/dialogs.md](./overlay/dialogs.md) |
| Drawer | Overlay | - | [overlay/sheets.md](./overlay/sheets.md) |
| DropdownMenu | Overlay | - | [overlay/menus.md](./overlay/menus.md) |
| Form | Form | - | [forms/form-system.md](./forms/form-system.md) |
| HoverCard | Overlay | - | [overlay/popovers.md](./overlay/popovers.md) |
| Input | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| InputOTP | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| Label | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| Menubar | Navigation | - | [navigation/sidebars.md](./navigation/sidebars.md) |
| NavigationMenu | Navigation | - | [navigation/sidebars.md](./navigation/sidebars.md) |
| Pagination | Navigation | - | [navigation/pagination.md](./navigation/pagination.md) |
| Popover | Overlay | - | [overlay/popovers.md](./overlay/popovers.md) |
| Progress | Data Display | - | [data-display/badges.md](./data-display/badges.md) |
| RadioGroup | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| Resizable | Layout | - | [layout/containers.md](./layout/containers.md) |
| ScrollArea | Layout | - | [layout/containers.md](./layout/containers.md) |
| Select | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| Separator | Layout | - | [layout/cards.md](./layout/cards.md) |
| Sheet | Overlay | - | [overlay/sheets.md](./overlay/sheets.md) |
| Sidebar | Navigation | - | [navigation/sidebars.md](./navigation/sidebars.md) |
| Skeleton | Data Display | - | [data-display/avatars.md](./data-display/avatars.md) |
| Slider | Foundational | - | [foundational/toggles.md](./foundational/toggles.md) |
| Sonner | Utility | - | [utilities/notifications.md](./utilities/notifications.md) |
| Switch | Foundational | - | [foundational/toggles.md](./foundational/toggles.md) |
| Table | Data Display | - | [data-display/tables.md](./data-display/tables.md) |
| Tabs | Navigation | - | [navigation/tabs.md](./navigation/tabs.md) |
| Textarea | Foundational | - | [foundational/form-inputs.md](./foundational/form-inputs.md) |
| Toggle | Foundational | default, outline | [foundational/toggles.md](./foundational/toggles.md) |
| ToggleGroup | Foundational | - | [foundational/toggles.md](./foundational/toggles.md) |
| Tooltip | Overlay | - | [overlay/popovers.md](./overlay/popovers.md) |

**Total:** 46 shadcn/ui components

---

## Documentation Structure

### Foundational Components
Core input and interactive elements that form the basis of user interactions.
- [Buttons](./foundational/buttons.md) - Button component
- [Form Inputs](./foundational/form-inputs.md) - Input, Textarea, Checkbox, RadioGroup, Select, Label, Calendar, Command, InputOTP
- [Toggles](./foundational/toggles.md) - Toggle, ToggleGroup, Switch, Slider

### Layout Components
Components that control page structure and content organization.
- [Cards](./layout/cards.md) - Card, Separator
- [Containers](./layout/containers.md) - ScrollArea, AspectRatio, Resizable
- [Carousel](./layout/carousel.md) - Carousel component

### Overlay Components
Modal and floating UI elements that appear above the main content.
- [Dialogs](./overlay/dialogs.md) - Dialog, AlertDialog
- [Sheets](./overlay/sheets.md) - Sheet, Drawer
- [Popovers](./overlay/popovers.md) - Popover, HoverCard, Tooltip
- [Menus](./overlay/menus.md) - DropdownMenu, ContextMenu

### Navigation Components
Components that help users move through the application.
- [Tabs](./navigation/tabs.md) - Tabs, Breadcrumb
- [Pagination](./navigation/pagination.md) - Pagination component
- [Sidebars](./navigation/sidebars.md) - Sidebar, NavigationMenu, Menubar

### Data Display Components
Components for presenting information to users.
- [Tables](./data-display/tables.md) - Table component
- [Badges](./data-display/badges.md) - Badge, Alert, Progress
- [Avatars](./data-display/avatars.md) - Avatar, Skeleton
- [Charts](./data-display/charts.md) - Chart component

### Form Components
Advanced form management and validation.
- [Form System](./forms/form-system.md) - Form component with React Hook Form integration

### Utility Components
Specialized components for specific use cases.
- [Accordion](./utilities/accordion.md) - Accordion, Collapsible
- [Notifications](./utilities/notifications.md) - Sonner (Toast notifications)

---

## Import Paths

All components use the `@/components/ui/` import path:

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
```

---

## Related Documentation

- [Style Guide](../STYLE_GUIDE.md) - Comprehensive styling reference
- [Component Catalog](../COMPONENT_CATALOG.md) - Full component reference (legacy)
- [Design Document](../DESIGN_DOCUMENT.md) - Application design patterns
