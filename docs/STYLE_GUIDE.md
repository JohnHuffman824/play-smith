# PlaySmith Style Guide

**Audience:** AI assistants working on PlaySmith codebase
**Purpose:** Comprehensive styling reference for consistent, Apple-inspired UI
**Last Updated:** 2025-01

---

## 1. Quick Reference (TL;DR)

### Most Common Class Combinations

| Pattern | Classes |
|---------|---------|
| Action Button | `px-4 py-2 rounded-lg bg-action-button text-action-button-foreground hover:bg-action-button/90 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| Button (Base) | `px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer` |
| Card | `bg-card border border-border rounded-xl p-4` |
| Input | `px-4 py-2.5 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20` |
| Dialog | `rounded-2xl shadow-2xl border border-border p-6 z-50` |
| Hover State | `hover:bg-accent transition-all duration-200` |
| Focus State | `focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none` |
| Disabled State | `disabled:pointer-events-none disabled:opacity-50` |

### Color Token Quick Lookup

```tsx
// Background & Foreground
bg-background text-foreground

// Cards & Popovers
bg-card text-card-foreground
bg-popover text-popover-foreground

// Semantic Colors
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-action-button text-action-button-foreground  // High-level action buttons (blue)
bg-destructive text-destructive-foreground
bg-muted text-muted-foreground
bg-accent text-accent-foreground

// Borders & Inputs
border-border
bg-input-background
ring-ring
```

### Spacing Scale (4px increments)

| Class | Value | Use Case |
|-------|-------|----------|
| `gap-2` | 8px | Tight spacing between icons/text |
| `gap-3` | 12px | Standard spacing in toolbars |
| `gap-4` | 16px | Default spacing between sections |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Dialog padding |
| `space-y-2` | 8px | Vertical stack spacing |

### Animation Defaults

```tsx
// Standard transition
transition-all duration-200

// Group hover scale
group-hover:scale-105 transition-transform

// Smooth movement
transition-all ease-in-out
```

---

## 2. Design Philosophy

PlaySmith follows an **Apple-inspired design aesthetic** with the following core principles:

### Visual Language
- **Clean, minimal interfaces** with generous whitespace
- **Rounded corners** throughout (base radius: 10px)
- **Soft shadows** for depth hierarchy
- **Smooth animations** for all state changes (200ms standard)
- **High-contrast, accessible** color pairings

### Typography Philosophy
- **SF Compact Rounded** for Apple-like friendliness with professional edge
- **Two weights only** (400 normal, 500 medium) for visual consistency
- **1.5 line height** across all text for readability
- **Font smoothing** enabled for crisp rendering on all platforms

### Color Philosophy
- **OKLCH color space** for perceptually uniform colors across themes
- **Semantic naming** (`primary`, `accent`, `destructive`) over specific colors
- **CSS variables** for theme-aware components
- **Dark mode parity** - every light mode color has a dark equivalent
- **⚠️ REQUIRED: All components MUST support both light and dark modes** - no component should be light-only or dark-only

### Interaction Philosophy
- **Purposeful motion** - animations enhance understanding, not decoration
- **Clear affordances** - `cursor-pointer` on all clickable elements
- **Instant feedback** - hover/focus states with <200ms response
- **Accessible by default** - WCAG AA contrast, focus rings, reduced motion support

### Professional Sports Aesthetic
- **Football field visual language** - clean lines, clear zones
- **Coaching tool precision** - every pixel serves a purpose
- **Team-oriented colors** - blues and greens for collaboration
- **Performance-focused** - smooth 60fps animations, optimized rendering

---

## 3. Theme System (THE Canonical Approach)

### ⚠️ CRITICAL REQUIREMENTS

1. **All components MUST support both light and dark modes** - This is not optional
2. **Use CSS variables ONLY** - PlaySmith uses **CSS custom properties via Tailwind v4's `@theme` directive** as the **ONLY** canonical theming approach

### Light/Dark Mode Support

**REQUIRED:** Every component you create or modify must work correctly in both light and dark modes.

**How to ensure support:**
- ✅ Use semantic color tokens (`bg-background`, `text-foreground`, etc.) - they automatically switch
- ✅ Test component in both modes before considering it complete
- ✅ Never hardcode light-mode-only or dark-mode-only colors

**DO NOT USE:**
- ❌ Ternary theme checks: `theme === 'dark' ? 'bg-gray-800' : 'bg-white'`
- ❌ Hardcoded Tailwind colors: `bg-blue-500`, `text-gray-700`
- ❌ Inline style objects with theme conditionals (except for canvas/SVG - see below)
- ❌ Light-mode-only colors like `bg-white`, `text-black`

**ALWAYS USE:**
- ✅ Semantic color tokens: `bg-background`, `text-foreground`, `border-border`
- ✅ CSS variables automatically handle light/dark switching
- ✅ Theme-aware tokens that have both light and dark values defined

### CSS Variables Definition

Located in `src/index.css`:

```css
:root {
  /* Backgrounds */
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);

  /* Cards & Overlays */
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  /* Semantic Colors */
  --primary: #030213;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --secondary-foreground: #030213;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #030213;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;

  /* Borders & Inputs */
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
  --ring: oklch(0.708 0 0);

  /* Charts */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);

  /* Border Radius */
  --radius: 0.625rem;  /* 10px */
}
```

### Dark Mode Overrides

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  /* ... */
}
```

### Tailwind v4 @theme Integration

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... maps all CSS vars to Tailwind tokens */
}
```

### Usage Examples

```tsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Click me
  </button>
  <p className="text-muted-foreground">Helper text</p>
</div>

// ❌ INCORRECT - Don't use ternaries or hardcoded colors
<div className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
  <button className="bg-blue-500 text-white">
    Click me
  </button>
</div>
```

### Exception: Canvas/SVG Elements

**ONLY** for `<canvas>` or `<svg>` elements that cannot use Tailwind classes, use theme-conditional inline styles:

```tsx
const { theme } = useTheme()

// ✅ CORRECT - Canvas requires inline styles
<div style={{
  backgroundColor: theme === 'dark' ? '#1f2937' : '#f2f2f2'
}}>
  <svg>
    <line stroke={theme === 'dark' ? '#4b5563' : '#a9a9a9'} />
  </svg>
</div>
```

### Theme Implementation

Theme toggling handled via `ThemeContext` (src/contexts/ThemeContext.tsx):

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function Component() {
  const { theme, setTheme } = useTheme()

  // Toggle theme
  setTheme(theme === 'dark' ? 'light' : 'dark')
}
```

Theme applies `.dark` class to `<html>` element, triggering CSS variable cascade.

---

## 4. Typography

### Font Stack

**Primary:** SF Compact Rounded
**Fallbacks:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

Applied globally in `src/index.css`:

```css
* {
  font-family: 'SF Compact Rounded', -apple-system, BlinkMacSystemFont,
               'Segoe UI', Roboto, sans-serif;
}
```

### Font Smoothing

```css
html, body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Font Weights

Only two weights used throughout:

```css
:root {
  --font-weight-medium: 500;  /* Headers, labels, buttons */
  --font-weight-normal: 400;  /* Body text, inputs */
}
```

| Element | Weight |
|---------|--------|
| `h1`, `h2`, `h3`, `h4` | 500 (medium) |
| `label`, `button` | 500 (medium) |
| `p`, `input`, body text | 400 (normal) |

### Size Scale

Base font size: `16px`

```css
:root {
  --font-size: 16px;
}

html {
  font-size: var(--font-size);
}
```

| Element | CSS Variable | Equivalent |
|---------|-------------|------------|
| `h1` | `var(--text-2xl)` | ~24px |
| `h2` | `var(--text-xl)` | ~20px |
| `h3` | `var(--text-lg)` | ~18px |
| `h4`, `p`, `button`, `input` | `var(--text-base)` | 16px |

Tailwind classes:
- `text-2xl` - h1
- `text-xl` - h2
- `text-lg` - h3
- `text-base` - default
- `text-sm` - small text
- `text-xs` - tiny text (badges, captions)

### Line Height

**Standard:** 1.5 across all elements

```css
h1, h2, h3, h4, p, label, button, input {
  line-height: 1.5;
}
```

### Usage Examples

```tsx
// Headings
<h1>Page Title</h1>  {/* text-2xl, font-medium */}
<h2>Section Title</h2>  {/* text-xl, font-medium */}
<h3 className="mb-2">Card Title</h3>  {/* text-lg, font-medium */}

// Body text
<p className="text-muted-foreground">Description text</p>

// Small text
<span className="text-sm text-muted-foreground">Helper text</span>

// Labels (automatically medium weight)
<label>Email Address</label>

// Custom sizing
<div className="text-xs px-2 py-0.5 rounded">Badge</div>
```

---

## 5. Spacing & Layout

### 4px Increment Scale

PlaySmith uses Tailwind's default spacing scale (4px increments):

| Class | Value | Common Use |
|-------|-------|------------|
| `gap-1` | 4px | Tight icon spacing |
| `gap-2` | 8px | Icon + text |
| `gap-3` | 12px | Toolbar items |
| `gap-4` | 16px | Section spacing |
| `gap-6` | 24px | Major sections |
| `p-2` | 8px | Small button padding |
| `p-3` | 12px | List item padding |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Dialog padding |
| `space-y-2` | 8px | Vertical stack |
| `space-y-4` | 16px | Spaced stack |
| `space-y-6` | 24px | Loose stack |

### Layout Patterns

#### Prefer `gap-*` Over Margin

```tsx
// ✅ CORRECT - Use gap for flex/grid spacing
<div className="flex gap-3">
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>

// ❌ AVOID - Don't use margins between siblings
<div className="flex">
  <Button className="mr-3">Cancel</Button>
  <Button>Save</Button>
</div>
```

#### Prefer `space-y-*` for Vertical Stacks

```tsx
// ✅ CORRECT - Use space-y for vertical spacing
<div className="space-y-4">
  <FormField />
  <FormField />
  <FormField />
</div>

// ❌ AVOID - Don't use mb on each child
<div>
  <FormField className="mb-4" />
  <FormField className="mb-4" />
  <FormField />
</div>
```

### Container Patterns

```tsx
// Dialog container
className="w-80 max-w-lg rounded-2xl p-6"

// Full-height sidebar
className="w-20 h-full"

// Card
className="p-4 rounded-xl"

// Button
className="px-4 py-2"

// List item
className="px-4 py-3"

// Icon button
className="p-2"
```

### Common Dimensions

| Component | Width | Height | Padding |
|-----------|-------|--------|---------|
| Toolbar | 80px (w-20) | 100% | - |
| Toolbar button | 56px (w-14) | 56px (h-14) | - |
| Dialog | 320px (w-80) | auto | 24px (p-6) |
| Standard button | auto | 36px (h-9) | px-4 py-2 |
| Icon button | 36px (size-9) | 36px | - |
| Input | 100% | auto | px-4 py-2.5 |

### Overflow Handling

```tsx
// Dialog with max height
className="max-h-[calc(100vh-4rem)] overflow-y-auto"

// Scrollable area
className="overflow-y-auto"

// Hide overflow
className="overflow-hidden"

// Truncate text
className="truncate"
className="line-clamp-1"
className="line-clamp-2"
```

### Responsive Vertical Toolbars

#### ⚠️ Common Mistakes

**MISTAKE 1: Using `flex-row flex-wrap`**

```tsx
// ❌ WRONG - Creates horizontal toolbar that wraps to rows
<div className="flex flex-row flex-wrap">
  {buttons}
</div>
```

This makes the toolbar horizontal-first, wrapping to new rows instead of columns.

**MISTAKE 2: Using `flex-col flex-wrap` for uneven distribution**

```tsx
// ❌ WRONG - Wraps unevenly (e.g., 14 buttons in first column, 1 in second)
<div className="flex flex-col flex-wrap h-full">
  {buttons}
</div>
```

Flex-wrap overflows naturally, causing uneven distribution across columns.

**MISTAKE 3: Inconsistent padding**

```tsx
// ❌ WRONG - py-6 (24px) doesn't match gap-3 (12px)
<div className="flex flex-col gap-3 py-6">
  {buttons}
</div>
```

Different values for gaps and padding create visual inconsistency.

#### ✅ Correct Implementation

Use **CSS Grid with dynamic column calculation** for even distribution:

```tsx
const [columnCount, setColumnCount] = useState(1)
const [rowsPerColumn, setRowsPerColumn] = useState(13)

useEffect(() => {
  const calculateLayout = () => {
    const BUTTON_SIZE = 56  // w-14 h-14 in pixels
    const GAP = 12          // gap-3
    const PADDING = 12      // p-3
    const TOTAL_BUTTONS = 13

    // Use window height as the stable constraint (NOT self-measurement)
    const availableHeight = window.innerHeight - (2 * PADDING)

    // Calculate how many buttons fit in one column
    const buttonsPerColumn = Math.floor(
      (availableHeight + GAP) / (BUTTON_SIZE + GAP)
    )

    if (buttonsPerColumn >= TOTAL_BUTTONS) {
      // All buttons fit in one column
      setColumnCount(1)
      setRowsPerColumn(TOTAL_BUTTONS)
      return
    }

    if (buttonsPerColumn <= 0) {
      // Fallback for very small screens
      setColumnCount(1)
      setRowsPerColumn(TOTAL_BUTTONS)
      return
    }

    // Calculate columns needed for even distribution
    const neededColumns = Math.ceil(TOTAL_BUTTONS / buttonsPerColumn)

    // Calculate rows for even distribution
    const rows = Math.ceil(TOTAL_BUTTONS / neededColumns)

    setColumnCount(neededColumns)
    setRowsPerColumn(rows)
  }

  calculateLayout()

  // Use window resize listener (NOT ResizeObserver on self)
  window.addEventListener('resize', calculateLayout)
  return () => window.removeEventListener('resize', calculateLayout)
}, [])

// In JSX:
<div
  className="h-full border-r bg-card"
  style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${columnCount}, 56px)`,
    gridTemplateRows: `repeat(${rowsPerColumn}, 56px)`,  // CRITICAL - must set both!
    gridAutoFlow: 'column',
    gap: '12px',
    padding: '12px',
    alignContent: 'center',     // Centers buttons vertically
    justifyContent: 'start',    // Aligns columns to the left
    minWidth: '80px',
    width: 'auto',
  }}
>
  {buttons}
</div>
```

**Key principles:**
- Use **CSS Grid** with `gridAutoFlow: 'column'` to fill vertically
- **CRITICAL**: Set BOTH `gridTemplateColumns` AND `gridTemplateRows` - without rows, all items go horizontal
- Calculate columns AND rows dynamically based on available height
- Use `window.innerHeight` (not self-measurement) to avoid circular references
- Use `window.addEventListener('resize')` to recalculate on window resize
- Buttons distribute evenly (12 buttons → 6 per column when 2 columns)
- Consistent spacing: same value for gap and padding (12px)
- `alignContent: 'center'` - centers the button group vertically while maintaining spacing between buttons

**Why both templates are required:**
- `gridTemplateColumns: repeat(2, 56px)` - defines 2 columns of 56px width each
- `gridTemplateRows: repeat(7, 56px)` - defines 7 rows of 56px height each
- Without `gridTemplateRows`, Grid creates only 1 implicit row and all items go horizontal
- With `gridAutoFlow: column`, items fill down the rows, then move to next column

**Distribution examples:**
- 13 buttons, tall window → 1 column, 13 rows
- 13 buttons, medium window → 2 columns, 7 rows (7 + 6 distribution)
- 13 buttons, short window → 3 columns, 5 rows (5 + 5 + 3 distribution)

---

## 6. Border Radius System

### Token Reference

Base radius: **0.625rem** (10px)

```css
:root {
  --radius: 0.625rem;
  --radius-sm: calc(var(--radius) - 4px);  /* 6px */
  --radius-md: calc(var(--radius) - 2px);  /* 8px */
  --radius-lg: var(--radius);              /* 10px */
  --radius-xl: calc(var(--radius) + 4px);  /* 14px */
}
```

### Tailwind Classes

| Class | Value | Use Case |
|-------|-------|----------|
| `rounded` | 4px | Small elements |
| `rounded-md` | 6px | Badges, small buttons |
| `rounded-lg` | 8px | Buttons, inputs |
| `rounded-xl` | 12px | Cards, toolbar buttons |
| `rounded-2xl` | 16px | Dialogs, large cards |
| `rounded-full` | 50% | Circular elements (players, avatars) |

### Component-to-Radius Mapping

```tsx
// Buttons
<button className="rounded-lg">Default Button</button>
<button className="rounded-md">Small Button</button>
<button className="rounded-xl">Toolbar Button</button>

// Cards
<div className="rounded-xl">Standard Card</div>

// Dialogs
<div className="rounded-2xl">Dialog</div>

// Inputs
<input className="rounded-lg" />

// Badges
<span className="rounded-full px-2.5 py-1">Badge</span>

// Players (circular)
<div style={{ borderRadius: '50%' }}>Player</div>

// Dropdowns
<div className="rounded-lg">Dropdown Menu</div>

// Popovers
<div className="rounded-md">Popover</div>
```

### Corner Rounding Best Practices

- **Larger elements = larger radius** (dialogs use 2xl, buttons use lg)
- **Interactive elements = rounded corners** (improves touch targets)
- **Nested elements** inherit parent radius (no need to re-apply)
- **Circular elements** use `rounded-full` (50%) not fixed radius

---

## 7. Shadows & Elevation

### Shadow Scale

| Class | Use Case |
|-------|----------|
| `shadow-sm` | Subtle depth (hovercards) |
| `shadow` | Default elevation (dropdowns) |
| `shadow-md` | Medium elevation (popovers) |
| `shadow-lg` | High elevation (dialogs, active buttons) |
| `shadow-xl` | Very high (modals) |
| `shadow-2xl` | Maximum (full-screen overlays) |

### Component Usage

```tsx
// Active toolbar button
<button className="shadow-lg">...</button>

// Dialog
<div className="shadow-2xl">...</div>

// Dropdown menu
<div className="shadow-md">...</div>

// Player (inline style for canvas)
<div style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>...</div>
```

### Z-Index Strategy

Minimal, purposeful z-index values:

| Element | Z-Index | Class |
|---------|---------|-------|
| Base layer | 0 | (default) |
| Players | 10 | `z-10` |
| Toolbar buttons | 10 | `z-10` |
| Dropdowns | 50 | `z-50` |
| Dialogs | 50 | `z-50` |
| Modal overlays | 50 | `z-50` |
| Toasts | 100 | `z-[100]` |

**Rules:**
- Keep z-index values as low as possible
- Use semantic grouping (UI elements: 10, overlays: 50, notifications: 100)
- Avoid z-index >100 unless absolutely necessary
- Document any z-index >50

---

## 8. Animation & Motion

### Standard Transitions

**Default:** `transition-all duration-200`

```tsx
// ✅ Standard transition (use this everywhere)
className="transition-all duration-200"

// Specific properties
className="transition-colors duration-200"
className="transition-transform duration-200"
className="transition-opacity duration-200"

// Easing (default is ease)
className="transition-all duration-200 ease-in-out"
```

### Keyframe Animations

Defined in `src/index.css`:

```css
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}

@keyframes slide {
  from { background-position: 0 0; }
  to { background-position: 256px 224px; }
}
```

Usage:

```tsx
// Modal entrance
<div className="animate-modal-in">...</div>

// Loading spinner
<div className="animate-spin">...</div>

// Custom animation via class
className="animate-modal-in"
```

### Group Hover Patterns

```tsx
// Parent with group class
<div className="group cursor-pointer">
  <h3>Card Title</h3>

  {/* Child responds to parent hover */}
  <MoreVertical className="opacity-0 group-hover:opacity-100 transition-opacity" />
  <span className="group-hover:scale-110 transition-transform">Badge</span>
</div>
```

### Motion Timing

| Duration | Use Case |
|----------|----------|
| `duration-150` | Micro-interactions (checkbox, toggle) |
| `duration-200` | Standard (hover, focus, color changes) |
| `duration-300` | Slow (modal entrance, complex transforms) |
| `duration-500` | Very slow (page transitions) |

### Player Movement Animation

Special case for football players (smooth but responsive):

```tsx
<div style={{
  transition: isDragging
    ? 'none'  // No transition while dragging
    : 'left 800ms ease-in-out, top 800ms ease-in-out'  // Smooth snap-back
}}>
  {/* Player content */}
</div>
```

### Reduced Motion Support

**REQUIRED:** Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion) {
  *, ::before, ::after {
    animation: none !important;
  }
}
```

This globally disables animations for users with motion sensitivity.

**Best Practice:** Always include `transition-all` - the CSS above will disable it for users who need it.

---

## 9. Interactive States

### Hover States

```tsx
// Background change
className="hover:bg-accent"

// Scale transform
className="hover:scale-105 transition-transform"

// Opacity change
className="opacity-0 hover:opacity-100 transition-opacity"

// Combined effects
className="hover:bg-accent hover:border-primary transition-all duration-200"
```

**Common patterns:**

```tsx
// Button
className="hover:bg-primary/90"

// Card
className="hover:bg-accent hover:shadow-lg"

// Icon button
className="hover:bg-accent rounded-lg transition-all"

// Link
className="hover:underline"
```

### Focus States

**REQUIRED:** All interactive elements need visible focus states

```tsx
// ✅ CORRECT - Clear focus ring
className="focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"

// Button component pattern (from button.tsx)
className="outline-none focus-visible:border-ring focus-visible:ring-ring/50
           focus-visible:ring-[3px]"

// ❌ INCORRECT - No focus state
className="outline-none"  // Don't do this alone!
```

**Best Practice:** Always pair `outline-none` with `focus-visible:ring-*`

### Active States

```tsx
// Button press
className="active:scale-95 transition-transform"

// Toggle button (selected state)
className={isActive
  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
  : 'bg-secondary text-secondary-foreground'
}
```

### Disabled States

```tsx
// ✅ ALWAYS include both properties
className="disabled:pointer-events-none disabled:opacity-50"

// From Button component
className="disabled:cursor-not-allowed disabled:opacity-50"
```

### Cursor States

**⚠️ CRITICAL:** Always add `cursor-pointer` to clickable elements

```tsx
// ✅ CORRECT - Explicit pointer cursor
<button className="cursor-pointer">Click me</button>
<div onClick={handleClick} className="cursor-pointer">Clickable div</div>

// ❌ INCORRECT - Missing cursor
<div onClick={handleClick}>Clickable div</div>
```

**All interactive elements need cursor-pointer:**
- Buttons
- Links
- Clickable divs
- Dropdown triggers
- Cards with onClick
- Custom input elements

**Exception:** Native `<button>` and `<a>` elements have pointer cursor by default, but include it anyway for consistency.

### State Priority Order

When combining states, apply in this order:

1. Base styles
2. Hover styles (`hover:*`)
3. Focus styles (`focus-visible:*`)
4. Active styles (`active:*`)
5. Disabled styles (`disabled:*`)

```tsx
className="
  bg-primary text-primary-foreground
  hover:bg-primary/90
  focus-visible:ring-[3px] focus-visible:ring-ring/50
  active:scale-95
  disabled:opacity-50 disabled:pointer-events-none
  transition-all duration-200 cursor-pointer
"
```

---

## 10. Accessibility Requirements

### Color Contrast

**Minimum ratios (WCAG AA):**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- Interactive elements: 3:1

**PlaySmith color tokens are pre-validated:**
- `text-foreground` on `bg-background` ✅ 4.5:1+
- `text-primary-foreground` on `bg-primary` ✅ 4.5:1+
- `text-destructive-foreground` on `bg-destructive` ✅ 4.5:1+

**Verify custom color combinations** using browser DevTools or [contrast checker](https://webaim.org/resources/contrastchecker/).

### Focus Visibility

**REQUIRED:** All interactive elements must have visible focus indicators

```tsx
// ✅ CORRECT - 3px ring with 50% opacity
className="focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"

// ✅ CORRECT - Border change alternative
className="focus-visible:border-primary outline-none"

// ❌ INCORRECT - Removes focus with no alternative
className="outline-none"
```

### ARIA Patterns

```tsx
// Buttons with icons only
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>

// Loading states
<button aria-busy="true" aria-label="Loading...">
  <Loader className="animate-spin" />
</button>

// Expanded states (accordions, dropdowns)
<button aria-expanded={isOpen}>
  Menu
  <ChevronDown className={isOpen ? 'rotate-180' : ''} />
</button>

// Disabled buttons (use disabled prop, not aria-disabled)
<button disabled>Cannot click</button>

// Form validation
<input aria-invalid={hasError} aria-errormessage="error-id" />
<span id="error-id" role="alert">{errorMessage}</span>

// Modals
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog Title</h2>
  {/* content */}
</div>
```

### Keyboard Navigation

**Required behaviors:**
- `Tab` / `Shift+Tab` moves focus
- `Enter` / `Space` activates buttons
- `Escape` closes dialogs/menus
- Arrow keys navigate lists/menus
- Focus trap in modals

```tsx
// Escape key handler
onKeyDown={(e) => {
  if (e.key === 'Escape') {
    onClose()
  }
}}

// Enter key on inputs
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleSubmit()
  }
}}
```

### Screen Reader Support

```tsx
// Visually hidden but screen-reader accessible
<span className="sr-only">Screen reader text</span>

// Skip to main content
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Announce dynamic changes
<div role="status" aria-live="polite">
  {statusMessage}
</div>

// Alert for errors
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Reduced Motion

Automatically handled via CSS (see section 8):

```css
@media (prefers-reduced-motion) {
  *, ::before, ::after {
    animation: none !important;
  }
}
```

No additional code needed - all transitions/animations respect this preference.

---

## 11. Pattern Library (Code Templates)

### cn() Utility Usage

The `cn()` utility (from `src/components/ui/utils.ts`) merges Tailwind classes correctly:

```tsx
import { cn } from '@/lib/utils'

// Basic usage
<div className={cn('px-4 py-2', 'rounded-lg')} />

// Conditional classes
<div className={cn(
  'px-4 py-2 rounded-lg',
  isActive && 'bg-primary text-primary-foreground',
  isDisabled && 'opacity-50 pointer-events-none'
)} />

// Override classes (later classes win)
<div className={cn('text-gray-500', isError && 'text-destructive')} />

// With props.className
function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn('bg-card rounded-xl p-4', className)}>
      {children}
    </div>
  )
}
```

**Why use cn():**
- Handles class conflicts (e.g., `text-gray-500` + `text-red-500` = only `text-red-500`)
- Merges `className` prop safely
- Removes falsy values automatically

**Implementation:**

```tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### CVA (Class Variance Authority) Pattern

For components with multiple variants (from `src/components/ui/button.tsx`):

```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center gap-2 whitespace-nowrap ' +
  'rounded-md text-sm font-medium transition-all cursor-pointer ' +
  'disabled:cursor-not-allowed disabled:opacity-50 outline-none ' +
  'focus-visible:ring-[3px] focus-visible:ring-ring/50',
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// Usage
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><X /></Button>
```

**When to use CVA:**
- Component has 2+ distinct visual variants
- Variants combine (size + color + state)
- Need type-safe variant props

**When NOT to use CVA:**
- Simple conditional (use cn() with ternary)
- One-off component (inline classes fine)

### Style Constants Pattern

Extract repeated class strings to constants (from `src/components/playbook-editor/constants/playbook.ts`):

```tsx
// Define constants
export const BUTTON_BASE =
  'p-2 hover:bg-accent rounded-lg transition-all duration-200 cursor-pointer'

export const INPUT_BASE =
  'w-full px-4 py-2.5 bg-input-background rounded-lg border-0 ' +
  'outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200'

export const MENU_ITEM_BASE =
  'w-full px-4 py-2 text-left hover:bg-accent transition-colors ' +
  'duration-200 flex items-center gap-2 cursor-pointer'

// Use constants
import { BUTTON_BASE, INPUT_BASE } from './constants'

<button className={BUTTON_BASE}>Click me</button>
<input className={INPUT_BASE} />

// Combine with additional classes
<button className={cn(BUTTON_BASE, 'bg-primary text-primary-foreground')}>
  Primary Button
</button>
```

**When to extract constants:**
- Pattern used 3+ times
- Complex class string (5+ utilities)
- Shared across multiple files

**Where to define:**
- Component-specific: `ComponentName.tsx` (top of file)
- Feature-specific: `features/feature-name/constants.ts`
- Global: `src/lib/constants.ts`

### Theme-Conditional Pattern

**⚠️ ONLY for canvas/SVG elements** that cannot use Tailwind classes:

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function FootballField() {
  const { theme } = useTheme()

  // Define theme-specific values
  const fieldBg = theme === 'dark' ? '#1f2937' : '#f2f2f2'
  const lineColor = theme === 'dark' ? '#4b5563' : '#a9a9a9'
  const lineOpacity = theme === 'dark' ? 0.6 : 0.4

  return (
    <div style={{ backgroundColor: fieldBg }}>
      <svg>
        <line
          stroke={lineColor}
          strokeWidth={1}
          opacity={lineOpacity}
        />
      </svg>
    </div>
  )
}
```

**DO NOT use for regular HTML elements** - use semantic color tokens instead:

```tsx
// ❌ INCORRECT
const bgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white'

// ✅ CORRECT
className="bg-background"
```

---

## 12. Anti-Patterns (AVOID)

### ❌ Mixed Theme Approaches

**INCORRECT:**
```tsx
// Don't mix theme ternaries with semantic tokens
<div className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
  <p className="text-foreground">Text</p>  {/* Inconsistent! */}
</div>
```

**CORRECT:**
```tsx
// Use semantic tokens exclusively
<div className="bg-background">
  <p className="text-foreground">Text</p>
</div>
```

---

### ❌ Hardcoded Colors

**INCORRECT:**
```tsx
<button className="bg-blue-500 text-white">Button</button>
<div className="border-gray-200">Card</div>
<div className="bg-white text-black">Only works in light mode!</div>
```

**CORRECT:**
```tsx
<button className="bg-primary text-primary-foreground">Button</button>
<div className="border-border">Card</div>
<div className="bg-background text-foreground">Works in both modes!</div>
```

---

### ❌ Light-Mode-Only or Dark-Mode-Only Components

**INCORRECT:**
```tsx
// This only looks good in light mode!
<div className="bg-white text-gray-900 border-gray-200">
  <p className="text-gray-600">Description</p>
</div>

// This only looks good in dark mode!
<div className="bg-gray-900 text-gray-100 border-gray-700">
  <p className="text-gray-400">Description</p>
</div>
```

**CORRECT:**
```tsx
// This works in BOTH light and dark modes
<div className="bg-card text-card-foreground border-border">
  <p className="text-muted-foreground">Description</p>
</div>
```

**Why it matters:**
- Users can toggle between light/dark mode at any time
- Components must be readable and functional in both modes
- Semantic tokens automatically adapt to the current theme

---

### ❌ Inline Styles for Theme Colors

**INCORRECT:**
```tsx
<div style={{ backgroundColor: theme === 'dark' ? '#333' : '#fff' }}>
  Content
</div>
```

**CORRECT:**
```tsx
<div className="bg-background">
  Content
</div>

// Exception for canvas/SVG only
<canvas style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f2f2f2' }} />
```

---

### ❌ Missing cursor-pointer

**INCORRECT:**
```tsx
<div onClick={handleClick}>Clickable</div>
<button>Click me</button>  {/* Technically OK, but inconsistent */}
```

**CORRECT:**
```tsx
<div onClick={handleClick} className="cursor-pointer">Clickable</div>
<button className="cursor-pointer">Click me</button>
```

---

### ❌ No Focus States

**INCORRECT:**
```tsx
<button className="outline-none">Button</button>
```

**CORRECT:**
```tsx
<button className="outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Button
</button>
```

---

### ❌ Fixed Positioning Without Responsiveness

**INCORRECT:**
```tsx
<div className="absolute left-24 top-6 w-80">
  {/* Overflows on small screens! */}
</div>
```

**CORRECT:**
```tsx
<div className="absolute left-24 top-6 w-80 max-w-[calc(100vw-7rem)]">
  {/* Respects viewport width */}
</div>
```

---

### ❌ Margin Between Siblings

**INCORRECT:**
```tsx
<div>
  <Button className="mr-2">Cancel</Button>
  <Button>Save</Button>
</div>
```

**CORRECT:**
```tsx
<div className="flex gap-2">
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>
```

---

### ❌ Transition Without Duration

**INCORRECT:**
```tsx
<div className="transition">Content</div>  {/* Uses default 150ms */}
```

**CORRECT:**
```tsx
<div className="transition-all duration-200">Content</div>
```

---

### ❌ Magic Numbers

**INCORRECT:**
```tsx
setTimeout(() => setLinkCopied(false), 2000)
```

**CORRECT:**
```tsx
const LINK_COPIED_TIMEOUT_MS = 2000
setTimeout(() => setLinkCopied(false), LINK_COPIED_TIMEOUT_MS)
```

---

### ❌ Interface Instead of Type

**INCORRECT:**
```tsx
interface ButtonProps {
  variant: 'default' | 'destructive'
}
```

**CORRECT:**
```tsx
type ButtonProps = {
  variant: 'default' | 'destructive'
}
```

---

## 13. Migration Notes

### Identifying Legacy Patterns

If you see these patterns in existing code, refactor them:

| Legacy Pattern | Refactor To |
|----------------|-------------|
| `theme === 'dark' ? 'bg-gray-800' : 'bg-white'` | `bg-background` |
| `bg-blue-500 text-white` | `bg-primary text-primary-foreground` |
| `bg-white text-black` (light-only) | `bg-background text-foreground` |
| `bg-gray-900 text-gray-100` (dark-only) | `bg-background text-foreground` |
| `border-gray-200 dark:border-gray-700` | `border-border` |
| `text-gray-500` | `text-muted-foreground` |
| `hover:bg-gray-100` | `hover:bg-accent` |
| Missing `cursor-pointer` on clickables | Add `cursor-pointer` |
| `interface Props` | `type Props` |
| Component not tested in dark mode | Test in BOTH modes |
| `onClick={fn}` without `cursor-pointer` | Add `cursor-pointer` |

### Refactoring Checklist

When updating a component:

- [ ] **⚠️ Test in BOTH light and dark modes**
- [ ] Replace theme ternaries with semantic tokens
- [ ] Replace hardcoded colors (`bg-blue-500`, `bg-white`, `text-black`) with semantic tokens
- [ ] Add `cursor-pointer` to all clickable elements
- [ ] Ensure all interactive elements have focus states
- [ ] Replace `interface` with `type`
- [ ] Extract repeated class strings to constants
- [ ] Use `cn()` for conditional classes
- [ ] Verify color contrast ratios (in both light AND dark modes)
- [ ] Test keyboard navigation
- [ ] Test with `prefers-reduced-motion` enabled

### Before/After Examples

**Before:**
```tsx
interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareDialog({ isOpen, onClose }: ShareDialogProps) {
  const { theme } = useTheme()

  return (
    <div
      className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
      onClick={onClose}
    >
      <button className="text-gray-500 hover:bg-gray-100">
        <X />
      </button>
    </div>
  )
}
```

**After:**
```tsx
type ShareDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export function ShareDialog({ isOpen, onClose }: ShareDialogProps) {
  return (
    <div
      className="bg-background"
      onClick={onClose}
    >
      <button className="text-muted-foreground hover:bg-accent cursor-pointer
                         transition-all duration-200 outline-none
                         focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <X />
      </button>
    </div>
  )
}
```

---

## 14. Button Color Guidelines

### Preferred Button Styling

**Default Recommendation:** Use `bg-action-button text-action-button-foreground` for high-level action buttons

The action-button token provides:
- **Blue color** (#3b82f6) for strong visual affordance
- Consistent with sports/team aesthetic
- High contrast in both light and dark modes
- Clear distinction from background elements
- Full theme support across light and dark modes

### Button Color Hierarchy

| Priority | Style | Use Case | Example |
|----------|-------|----------|---------|
| **Action Button** | `bg-action-button text-action-button-foreground` | Primary actions, navigation, CTAs, confirmations | "Back to Playbook", "Save", "Rename", "Create" |
| **Destructive** | `bg-destructive text-destructive-foreground` | Delete, remove, dangerous actions | "Delete", "Remove", "Cancel Subscription" |
| **Secondary** | `bg-secondary text-secondary-foreground` | Supporting actions, badges, chips | Tags, labels, info badges |
| **Ghost/Subtle** | `hover:bg-accent` with `border-border` | Tertiary actions, cancel buttons | "Cancel" in dialogs, dismiss actions |

### Examples

```tsx
// ✅ CORRECT - High-level action button (primary CTA)
<button className="px-4 py-2 rounded-lg bg-action-button text-action-button-foreground
                   hover:bg-action-button/90 transition-all duration-200 cursor-pointer
                   outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Back to Playbook
</button>

// ✅ CORRECT - Destructive action button
<button className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground
                   hover:bg-destructive/90 transition-all duration-200 cursor-pointer
                   outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Delete Play
</button>

// ✅ CORRECT - Secondary/Cancel button
<button className="px-4 py-2 border border-border rounded-lg hover:bg-accent
                   transition-all duration-200 cursor-pointer outline-none
                   focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Cancel
</button>

// ❌ INCORRECT - Don't use hardcoded colors
<button className="bg-blue-500 text-white hover:bg-blue-600">
  Submit
</button>
```

### Button Usage Guidelines

**High-level action buttons** (`bg-action-button`):
- Navigation buttons ("Back to Playbook", "Go to Dashboard")
- Primary CTAs ("Save", "Create", "Submit")
- Confirmation actions ("Rename", "Confirm")
- Any button that represents the primary action in a context

**Destructive buttons** (`bg-destructive`):
- Delete operations
- Remove/discard actions
- Irreversible operations that need visual warning

**Secondary/Ghost buttons** (`border-border hover:bg-accent`):
- Cancel actions in dialogs
- Less important secondary actions
- Actions that should be de-emphasized

**Always include:**
- Full transition and hover states
- Focus states for accessibility
- Cursor pointer
- Proper disabled states when applicable

---

## Quick Checklist for New Components

- [ ] **⚠️ CRITICAL: Test component in BOTH light and dark modes**
- [ ] Use semantic color tokens (`bg-background`, `text-foreground`, etc.)
- [ ] **⚠️ Prefer blue buttons** (`bg-blue-500` or `bg-primary`) for interactive elements
- [ ] Never use hardcoded colors for backgrounds (`bg-white`, `bg-gray-800`)
- [ ] Add `cursor-pointer` to all clickable elements
- [ ] Include focus states (`focus-visible:ring-[3px] focus-visible:ring-ring/50`)
- [ ] Add `transition-all duration-200` to interactive elements
- [ ] Use `cn()` for conditional classes
- [ ] Use `type` instead of `interface`
- [ ] Extract magic numbers to named constants
- [ ] Verify WCAG AA color contrast (in both light AND dark modes)
- [ ] Test keyboard navigation
- [ ] Use `gap-*` instead of margin for spacing
- [ ] Use appropriate border radius (`rounded-lg` for buttons, `rounded-xl` for cards)
- [ ] Add `disabled:opacity-50 disabled:pointer-events-none` to buttons

---

## Related Documentation

- [Component Catalog](./COMPONENT_CATALOG.md) - Complete UI component reference
- [SQL Guidelines](./SQLGuideline.md) - Database patterns
