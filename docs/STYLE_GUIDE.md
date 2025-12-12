# PlaySmith Style Guide (AI Agent Reference)

**Purpose:** Quick reference for AI agents implementing PlaySmith UI
**Audience:** AI assistants working on the codebase
**Last Updated:** 2025-01

---

## 1. Quick Reference

### Most Common Patterns

| Pattern | Classes |
|---------|---------|
| **Action Button** | `px-4 py-2 rounded-lg bg-action-button text-action-button-foreground hover:bg-action-button/90 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| **Secondary Button** | `px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| **Destructive Button** | `px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| **Card** | `bg-card border border-border rounded-xl p-4` |
| **Input** | `px-4 py-2.5 bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus-visible:ring-ring/20 transition-all duration-200` |
| **Dialog** | `rounded-2xl shadow-2xl border border-border p-6 bg-popover` |

### Color Tokens

```tsx
// Backgrounds & Foregrounds
bg-background text-foreground
bg-card text-card-foreground
bg-popover text-popover-foreground

// Buttons & Actions
bg-action-button text-action-button-foreground  // Blue action buttons
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-destructive text-destructive-foreground

// States
bg-muted text-muted-foreground
bg-accent text-accent-foreground

// Borders & Inputs
border-border
bg-input-background
ring-ring
```

### Spacing Scale (4px increments)

| Class | Value | Use |
|-------|-------|-----|
| `gap-2` | 8px | Icon + text |
| `gap-3` | 12px | Toolbar spacing |
| `gap-4` | 16px | Section spacing |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Dialog padding |

---

## 2. Theme System (CRITICAL RULES)

### ⚠️ MUST FOLLOW

1. **ALWAYS use semantic color tokens**
   - ✅ `bg-background`, `text-foreground`, `border-border`
   - ❌ `bg-white`, `bg-gray-800`, `text-black`

2. **NEVER use theme ternaries**
   - ❌ `theme === 'dark' ? 'bg-gray-800' : 'bg-white'`
   - ✅ `bg-card` (auto-switches)

3. **All components MUST work in light AND dark modes**
   - Test every component in both modes
   - Use semantic tokens that auto-switch

4. **Exception: Canvas/SVG only**
   ```tsx
   // ONLY for <canvas> or <svg> elements
   const { theme } = useTheme()
   <canvas style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f2f2f2' }} />
   ```

### Color Replacement Cheat Sheet

| Hardcoded | Semantic Token |
|-----------|----------------|
| `bg-white` | `bg-card` or `bg-background` |
| `bg-gray-50` | `bg-background` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-700/800` | `bg-muted` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500/600` | `text-muted-foreground` |
| `border-gray-200/700` | `border-border` |
| `bg-blue-500 text-white` | `bg-action-button text-action-button-foreground` |

### Dark Mode Visual Hierarchy

**IMPORTANT:** Dark mode uses a layered lightness system for depth perception:

```
16% ─── Page background (bg-background) - darkest base layer
  ↓
18% ─── Input fields (bg-input-background, bg-switch-background) - recessed wells
  ↓
20% ─── Cards (bg-card) - elevated surfaces
  ↓
24% ─── Dialogs & Popovers (bg-popover) - floating elements, most elevated
  ↓
25-30% ─ Interactive accents (bg-muted, bg-accent, border-border)
```

**Key principles:**
- Each layer is 2-6% lighter than the previous
- Input elements (18%) are DARKER than their containers (20-24%) - creates "well" effect
- Dialogs (24%) must be lighter than cards (20%) for clear separation
- All interactive elements use `border-border` (30%) for visible edges
- NEVER override dark mode colors with opacity blends (e.g., `dark:bg-input/30`)

---

## 3. Component Patterns

### Buttons

```tsx
// Primary action
<button className="px-4 py-2 rounded-lg bg-action-button text-action-button-foreground
                   hover:bg-action-button/90 transition-all duration-200 cursor-pointer
                   outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Save
</button>

// Destructive
<button className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground
                   hover:bg-destructive/90 transition-all duration-200 cursor-pointer
                   outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Delete
</button>

// Secondary/Cancel
<button className="px-4 py-2 border border-border rounded-lg hover:bg-accent
                   transition-all duration-200 cursor-pointer outline-none
                   focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Cancel
</button>
```

### Cards & Containers

```tsx
// Card
<div className="bg-card border border-border rounded-xl p-4">
  {children}
</div>

// Dialog
<div className="rounded-2xl shadow-2xl border border-border p-6 bg-popover">
  {children}
</div>
```

### Inputs & Form Elements

```tsx
// Text Input
<input className="w-full px-4 py-2.5 bg-input-background rounded-lg border border-border
                  outline-none focus:ring-2 focus:ring-ring/20
                  transition-all duration-200" />

// Select Dropdown (use Select component from @/components/ui/select)
// - Background: bg-input-background (18% in dark mode)
// - Border: border-border (30% in dark mode)
// - NEVER use dark:bg-input/XX opacity overrides

// Switch Toggle (use Switch component from @/components/ui/switch)
// - Unchecked: bg-switch-background (18% in dark mode) with border-border
// - Checked: bg-primary with transparent border
// - NEVER use dark:bg-input/XX opacity overrides
```

**Form Element Rules:**
- ALL form inputs must use `bg-input-background` in dark mode (no opacity overrides)
- ALL form inputs must use `border-border` for consistent, visible edges
- Form elements should appear as "wells" (darker than their container)

---

## 4. Interactive States

### Required States

```tsx
// Hover
hover:bg-accent transition-all duration-200

// Focus (ALWAYS include on interactive elements)
outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50

// Active
active:scale-95 transition-transform

// Disabled
disabled:opacity-50 disabled:pointer-events-none

// Cursor (ALWAYS on clickables)
cursor-pointer
```

### State Order

```tsx
className="
  bg-primary text-primary-foreground          // base
  hover:bg-primary/90                          // hover
  focus-visible:ring-[3px] focus-visible:ring-ring/50  // focus
  active:scale-95                              // active
  disabled:opacity-50 disabled:pointer-events-none     // disabled
  transition-all duration-200 cursor-pointer   // animation + cursor
"
```

---

## 5. Layout & Spacing

### Use gap-* not margins

```tsx
// ✅ CORRECT
<div className="flex gap-3">
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>

// ❌ AVOID
<Button className="mr-3">Cancel</Button>
```

### Border Radius

| Component | Radius |
|-----------|--------|
| Buttons | `rounded-lg` |
| Cards | `rounded-xl` |
| Dialogs | `rounded-2xl` |
| Inputs | `rounded-lg` |
| Badges | `rounded-full` |

### Shadows & Glow Effects

| Use Case | Class |
|----------|-------|
| Active toolbar button | `shadow-lg` |
| Dialogs | `shadow-2xl` |
| Hover glow with overflow-hidden | `ring-4 ring-blue-500/50` (NOT shadow) |

**Note:** When adding hover glow to elements with `overflow-hidden`, use `ring` instead of `shadow`:
- `shadow` gets clipped by overflow-hidden
- `ring` renders outside the element boundary

### Z-Index Layers

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base | `z-10` | Players, field elements |
| Dialogs | `z-50` | All dialogs, popovers |
| Overlays | `z-[70]` | Context menus over dialogs |

---

## 6. Anti-Patterns (NEVER DO)

### ❌ Hardcoded Colors
```tsx
// WRONG
<div className="bg-white text-gray-900 border-gray-200">
<button className="bg-blue-500 text-white">

// CORRECT
<div className="bg-card text-card-foreground border-border">
<button className="bg-action-button text-action-button-foreground">
```

### ❌ Theme Ternaries
```tsx
// WRONG
<div className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>

// CORRECT
<div className="bg-card">
```

### ❌ Missing cursor-pointer
```tsx
// WRONG
<div onClick={handleClick}>Click me</div>

// CORRECT
<div onClick={handleClick} className="cursor-pointer">Click me</div>
```

### ❌ Missing focus states
```tsx
// WRONG
<button className="outline-none">Button</button>

// CORRECT
<button className="outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Button
</button>
```

### ❌ Light/Dark mode only components
```tsx
// WRONG - only works in light mode
<div className="bg-white text-gray-900">

// CORRECT - works in both modes
<div className="bg-card text-card-foreground">
```

---

## 7. Typography

### Font Weights
- **500 (medium)**: Headers, labels, buttons
- **400 (normal)**: Body text, inputs

### Size Scale
- `text-2xl` - h1 (~24px)
- `text-xl` - h2 (~20px)
- `text-lg` - h3 (~18px)
- `text-base` - default (16px)
- `text-sm` - small text
- `text-xs` - badges, captions

### Line Height
All text uses `line-height: 1.5`

### Font Family

```css
font-family: 'SF Compact Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Applied globally via `index.css`. Do not override.

---

## 8. Accessibility

### Required
1. **Color contrast**: WCAG AA (4.5:1 for normal text)
2. **Focus states**: All interactive elements must have `focus-visible:ring-*`
3. **Cursor states**: All clickables need `cursor-pointer`
4. **ARIA labels**: Icon-only buttons need `aria-label`
5. **Keyboard nav**: Support `Tab`, `Enter`, `Escape`

### Example
```tsx
<button
  aria-label="Close dialog"
  className="cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
  onKeyDown={(e) => e.key === 'Escape' && onClose()}
>
  <X />
</button>
```

---

## 9. Utilities

### cn() for conditional classes

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'px-4 py-2 rounded-lg',
  isActive && 'bg-primary text-primary-foreground',
  isDisabled && 'opacity-50'
)} />
```

### Constants for repeated patterns

```tsx
const BUTTON_BASE = 'px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer'

<button className={cn(BUTTON_BASE, 'bg-action-button text-action-button-foreground')}>
  Click me
</button>
```

---

## 10. Checklist for New Components

When creating or modifying components:

- [ ] Uses semantic color tokens (`bg-background`, `text-foreground`, NOT `bg-white`, `bg-gray-*`)
- [ ] ⚠️ **CRITICAL**: Tested in BOTH light and dark modes
- [ ] All clickable elements have `cursor-pointer`
- [ ] All interactive elements have focus states (`focus-visible:ring-[3px] focus-visible:ring-ring/50`)
- [ ] Uses `gap-*` instead of margins for spacing
- [ ] Has transitions (`transition-all duration-200`)
- [ ] Disabled states included (`disabled:opacity-50 disabled:pointer-events-none`)
- [ ] WCAG AA color contrast verified (in BOTH modes)
- [ ] Keyboard navigation supported
- [ ] Uses `type` instead of `interface` for TypeScript
- [ ] Icon-only buttons have `aria-label`

---

## 11. Common Mistakes

1. **Forgetting dark mode** - Always test in both light and dark
2. **Using hardcoded grays** - Use `bg-muted`, `text-muted-foreground`
3. **Missing cursor-pointer** - Add to all clickables
4. **Theme ternaries** - Use semantic tokens instead
5. **No focus state** - Required for accessibility
6. **Using `bg-white`** - Use `bg-card` or `bg-background`

---

## Related Docs

- [Component Catalog](./COMPONENT_CATALOG.md) - Complete UI component reference
- [SQL Guidelines](SQL_GUIDELINES.md) - Database patterns
