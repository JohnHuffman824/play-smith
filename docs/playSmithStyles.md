# PlaySmith Styling Guide

## Design Philosophy

PlaySmith follows an **Apple-inspired design aesthetic** with emphasis on:
- Clean, minimal interfaces with generous whitespace
- Smooth, purposeful animations and transitions
- Rounded corners and soft shadows for depth
- High-contrast, accessible color pairings
- Thoughtful interactive states and feedback
- Professional sports coaching aesthetic combined with modern UI

---

## Typography

### Primary Font Family

The entire application uses **SF Compact Rounded** as the primary typeface, matching Apple's design language:

```css
font-family: 'SF Compact Rounded', -apple-system, 
             BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

This is applied globally in `index.css`:

```css
* {
  font-family: 'SF Compact Rounded', -apple-system, 
               BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Font Smoothing

Apple-style font rendering is achieved with antialiasing:

```css
html, body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Font Weights

Two font weights are used consistently:

```css
:root {
  --font-weight-medium: 500;  /* Headers, labels, buttons */
  --font-weight-normal: 400;  /* Body text, inputs */
}
```

### Typography Scale

The application uses semantic heading and text styles:

```css
h1 {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

h2 {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

button, label {
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

p, input {
  font-size: var(--text-base);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
}
```

**Example in Player Component:**

```tsx
<div style={{
  color: 'white',
  fontWeight: 'bold',
  fontSize: '16px',
  fontFamily: 'SF Compact Rounded, system-ui, sans-serif',
}}>
  {label}
</div>
```

---

## Color System

### CSS Custom Properties

PlaySmith uses a sophisticated color system built on **CSS custom properties** with **OKLCH color space** for perceptually uniform colors:

```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);  /* Near black */
  --primary: #030213;  /* Deep blue-black */
  --primary-foreground: oklch(1 0 0);  /* Pure white */
  --destructive: #d4183d;  /* Red */
  --destructive-foreground: #ffffff;
  
  /* Neutrals */
  --muted: #ececf0;  /* Light gray */
  --muted-foreground: #717182;  /* Mid gray */
  --accent: #e9ebef;  /* Subtle gray */
  
  /* Borders & Inputs */
  --border: rgba(0, 0, 0, 0.1);
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
}
```

### Dark Mode Colors

Dark mode uses adjusted OKLCH values for consistency:

```css
.dark {
  --background: oklch(0.145 0 0);  /* Deep charcoal */
  --foreground: oklch(0.985 0 0);  /* Off-white */
  --primary: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --border: oklch(0.269 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
}
```

### Field Colors (Theme-Aware)

The football field uses theme-specific colors:

```tsx
// In FootballField.tsx
const fieldBg = theme === 'dark' ? '#1f2937' : '#f2f2f2';
const lineColor = theme === 'dark' ? '#4b5563' : '#a9a9a9';
const losLineColor = theme === 'dark' ? '#6b7280' : '#8a8a8a';
const lineOpacity = theme === 'dark' ? 0.6 : 0.4;
```

### Interactive State Colors

**Toolbar Button States:**

```tsx
// Active tool
'bg-blue-500 text-white shadow-lg scale-105'

// Neutral (light mode)
'bg-gray-100 text-gray-700 hover:bg-gray-200'

// Neutral (dark mode)
'bg-gray-700 text-gray-300 hover:bg-gray-600'

// Toggle button (light mode)
'bg-gray-50 text-gray-600 hover:bg-gray-100'

// Success button
'bg-green-50 text-green-600 hover:bg-green-100'  // Light
'bg-green-900 text-green-400 hover:bg-green-800' // Dark

// Destructive button
'bg-red-50 text-red-500 hover:bg-red-100'  // Light
'bg-red-900 text-red-400 hover:bg-red-800' // Dark
```

### Color Palette Reference

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#ffffff` | `oklch(0.145 0 0)` |
| Text | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| Field | `#f2f2f2` | `#1f2937` |
| Primary | `#030213` | `oklch(0.985 0 0)` |
| Border | `rgba(0,0,0,0.1)` | `oklch(0.269 0 0)` |
| Active Tool | `#3b82f6` (blue-500) | `#3b82f6` |

---

## Input Field Styling

### Convention: Always Use CSS Variables

All input fields MUST use CSS variables for theme-aware styling:

```tsx
// CORRECT - Uses CSS variables
className="bg-input-background text-foreground placeholder:text-muted-foreground border-input"

// INCORRECT - Hardcoded colors
className="bg-gray-50 text-gray-900"

// INCORRECT - JavaScript conditional
className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}
```

### Preferred: Use the shared Input component

```tsx
import { Input } from '@/components/ui/input'

<Input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter text..."
/>
```

### CSS Variables for Inputs

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--input-background` | `#f3f3f5` | `#374151` | Input background |
| `--input` | `transparent` | `oklch(0.269 0 0)` | Border color |
| `--foreground` | Near black | Off-white | Text color |
| `--muted-foreground` | `#717182` | `oklch(0.708 0 0)` | Placeholder text |

### Input Styling Classes

```css
/* Standard input styling */
.input-field {
  @apply bg-input-background text-foreground
         placeholder:text-muted-foreground
         border border-input rounded-md
         focus:ring-2 focus:ring-ring/20;
}
```

### Dark Mode Input Appearance

In dark mode, inputs should have:
- **Background:** Dark gray (`#374151` / gray-700) - NOT pure white
- **Text:** Light/white (`text-foreground`) - readable against dark background
- **Placeholder:** Muted gray (`text-muted-foreground`)
- **Border:** Subtle (`border-input`)

This reduces eye strain and maintains consistency with the Apple-inspired dark theme.

---

## Border Radius System

PlaySmith uses generous rounded corners throughout:

```css
:root {
  --radius: 0.625rem;  /* 10px base */
  --radius-sm: calc(var(--radius) - 4px);  /* 6px */
  --radius-md: calc(var(--radius) - 2px);  /* 8px */
  --radius-lg: var(--radius);  /* 10px */
  --radius-xl: calc(var(--radius) + 4px);  /* 14px */
}
```

### Component Usage

```tsx
// Toolbar buttons
className='w-14 h-14 rounded-xl'  // 12px radius

// Dialogs
className='rounded-2xl'  // 16px radius

// Dialog items
className='rounded-xl'  // 12px radius

// Players
borderRadius: '50%'  // Perfect circles

// Badges
className='rounded-lg'  // 8px radius
```

---

## Spacing & Layout

### Consistent Gaps

```tsx
// Toolbar vertical spacing
style={{ gap: '12px' }}

// Dialog content
className='space-y-2'  // 8px between items

// Button padding
className='px-4 py-2'  // 16px horizontal, 8px vertical
```

### Container Sizing

```tsx
// Toolbar
className='w-20 h-full'  // 80px fixed width, full height

// Toolbar buttons
className='w-14 h-14'  // 56px square

// Dialogs
className='w-80'  // 320px fixed width
```

---

## Shadows & Elevation

PlaySmith uses subtle shadows for depth:

```tsx
// Toolbar buttons (active)
className='shadow-lg'

// Dialogs
className='shadow-2xl'

// Players
boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
```

### Hover Glow Effects with `overflow-hidden`

When adding glow/shadow effects to elements that have `overflow-hidden` (commonly used with `rounded-xl` to clip internal content), use Tailwind's `ring` utilities instead of `shadow`:

```tsx
// INCORRECT - shadow gets clipped by overflow-hidden
className='overflow-hidden rounded-xl hover:shadow-lg hover:shadow-blue-500/50'

// CORRECT - ring renders outside the element and isn't clipped
className='overflow-hidden rounded-xl hover:ring-4 hover:ring-blue-500/50'
```

**Why:** CSS `box-shadow` renders inside the element's overflow boundary and gets clipped by `overflow-hidden`. Tailwind's `ring` utilities also use `box-shadow` under the hood, but they're applied as an outline-style effect that renders **outside** the element boundary, so they aren't affected by overflow clipping.

**Example - PlayCard hover glow:**

```tsx
const cardClass = `group relative bg-card border border-border
  rounded-xl overflow-hidden hover:ring-4 hover:ring-blue-500/50
  hover:border-blue-500
  transition-all duration-200`
```

---

## Transitions & Animations

### Smooth State Changes

All interactive elements use smooth transitions:

```tsx
// Standard transition
className='transition-all'

// Player movement (when not dragging)
transition: 'left 800ms ease-in-out, 
            top 800ms ease-in-out, 
            width 800ms ease-in-out, 
            height 800ms ease-in-out'

// Badge scale on hover
className='group-hover:scale-110 transition-transform'
```

### Keyframe Animations

```css
@keyframes slide {
  from { background-position: 0 0; }
  to { background-position: 256px 224px; }
}

@keyframes spin {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}
```

### Motion Preferences

Respects user's reduced motion preferences:

```css
@media (prefers-reduced-motion) {
  *, ::before, ::after {
    animation: none !important;
  }
}
```

---

## Component Patterns

### Toolbar Button Pattern

Consistent button structure for all toolbar tools:

```tsx
const baseButtonClass = [
  'w-14 h-14 rounded-xl flex items-center justify-center',
  'transition-all cursor-pointer',
].join(' ')

function toolButtonClass(isActive: boolean) {
  const activeClass = 'bg-blue-500 text-white shadow-lg scale-105'
  const variant = isActive
    ? activeClass
    : theme === 'dark'
      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  return `${baseButtonClass} ${variant}`
}
```

### Dialog Pattern

All dialogs follow this structure:

```tsx
const containerClass = [
  'absolute left-24 top-6 w-80 rounded-2xl shadow-2xl',
  'border p-4 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto',
].join(' ')

const containerTheme = theme === 'dark'
  ? 'bg-gray-800 border-gray-700'
  : 'bg-white border-gray-200'
```

**Header with sticky positioning:**

```tsx
const headerBaseClass = 
  'flex items-center justify-between mb-4 sticky top-0 pb-2 border-b'
```

**Close button:**

```tsx
const closeBaseClass = 
  'w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer'

const closeButtonClass = theme === 'dark'
  ? 'hover:bg-gray-700 text-gray-400'
  : 'hover:bg-gray-100 text-gray-500'
```

### Item/Card Pattern

Lists and cards use this pattern:

```tsx
const itemBaseClass = 
  'w-full p-3 rounded-xl border transition-all text-left group cursor-pointer'

const itemClass = theme === 'dark'
  ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-blue-500'
  : 'bg-gray-50 hover:bg-blue-50 border-gray-100 hover:border-blue-200'
```

### Badge Pattern

Number badges in dialogs:

```tsx
const numberBadgeClass = [
  'w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center',
  'justify-center flex-shrink-0 group-hover:scale-110 transition-transform',
].join(' ')
```

---

## Interactive States

### Cursor Styles

PlaySmith uses custom cursors for different tools:

```tsx
// Dragging players
cursor: isDragging ? 'grabbing' : 'grab'

// Erase tool with trash icon
cursor: 'url(\'data:image/svg+xml;utf8,<svg>...</svg>\') 12 12, pointer'

// Hide cursor for custom rendering
cursor: 'none'
```

### Hover States

```tsx
// Players - show delete option
onMouseEnter={() => {
  setIsHovered(true)
  if (onHoverChange) onHoverChange(true)
}}
```

### Status Indicators

```tsx
// Active tool indicator
const statusDotClass = [
  'absolute -right-1 -top-1 w-3 h-3 bg-green-500',
  'rounded-full border-2 border-white',
].join(' ')

// Color palette swatch
const paletteSwatchClass = [
  'absolute -right-1 -bottom-1 w-4 h-4 rounded-full',
  'border-2 shadow-sm',
].join(' ')
```

---

## Theme Implementation

### Theme Context

Theme is managed via React Context:

```tsx
import { useTheme } from '../../contexts/ThemeContext'

function Component() {
  const { theme } = useTheme()
  
  return (
    <div className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
      {/* Content */}
    </div>
  )
}
```

### Theme Variants Pattern

Common pattern for theme-aware class names:

```tsx
const containerTheme = theme === 'dark'
  ? 'bg-gray-800 border-gray-700'
  : 'bg-white border-gray-200'

const textClass = theme === 'dark' 
  ? 'text-gray-100' 
  : 'text-gray-900'
```

### App-Level Theme Application

```tsx
<div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
  {/* App content */}
</div>
```

---

## Tailwind Integration

### Custom Theme Extension

Tailwind is configured to use CSS variables:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... */
}
```

### Base Layer Styles

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  
  html, body {
    @apply bg-background text-foreground m-0 p-0 w-full h-full overflow-hidden;
  }
  
  #root {
    @apply w-full h-full;
  }
}
```

---

## Button Variants (UI Components)

The `Button` component uses class-variance-authority for systematic variants:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
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
  },
)
```

---

## Player Component Styling

Players are rendered as circular elements with specific styling:

```tsx
<div style={{
  position: 'absolute',
  width: `${radiusInPixels * 2}px`,
  height: `${radiusInPixels * 2}px`,
  transform: 'translate(-50%, -50%)',
  zIndex: 10,
  transition: isDragging ? 'none' : 'left 800ms ease-in-out, top 800ms ease-in-out',
}}>
  <div style={{
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: fillColor,
    border: '2px solid white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
  }}>
    {label}
  </div>
</div>
```

---

## Field Styling

The football field has specific rendering requirements:

```tsx
<div style={{
  width: '100%',
  height: '100%',
  backgroundColor: theme === 'dark' ? '#1f2937' : '#f2f2f2',
  position: 'absolute',
  top: 0,
  left: 0,
}}>
  <svg /* Field markings */>
    <line 
      stroke={theme === 'dark' ? '#4b5563' : '#a9a9a9'}
      strokeWidth={1}
      opacity={theme === 'dark' ? 0.6 : 0.4}
    />
  </svg>
</div>
```

**Line of scrimmage gets emphasized:**

```tsx
stroke={isLineOfScrimmage ? losLineColor : lineColor}
strokeWidth={isLineOfScrimmage ? 1.5 : 1}
opacity={isLineOfScrimmage ? losOpacity : 0.7}
```

---

## Best Practices

### 1. Use Class Composition
Build complex class strings from semantic base classes:

```tsx
const baseClass = 'w-14 h-14 rounded-xl flex items-center justify-center'
const activeClass = 'bg-blue-500 text-white shadow-lg'
const className = `${baseClass} ${isActive ? activeClass : neutralClass}`
```

### 2. Theme-Aware Styling
Always consider both light and dark modes:

```tsx
const variant = theme === 'dark' 
  ? 'bg-gray-800 text-gray-100'
  : 'bg-white text-gray-900'
```

### 3. Consistent Spacing
Use Tailwind spacing scale (4px increments):
- `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- `p-3` (12px), `p-4` (16px), `p-6` (24px)

### 4. Smooth Transitions
Always include `transition-all` or specific transition properties:

```tsx
className='transition-all hover:bg-gray-100'
```

### 5. Accessibility
- Use sufficient color contrast
- Provide hover/focus states
- Respect `prefers-reduced-motion`
- Include `aria` attributes where appropriate

### 6. Z-Index Strategy
Use minimal, purposeful z-index values:
- Players: `z-10`
- Dialogs: `z-50`
- Overlays: Higher as needed

---

## Common Utility Patterns

### Flex Centering
```tsx
className='flex items-center justify-center'
```

### Absolute Positioning
```tsx
className='absolute left-24 top-6'
```

### Overflow Handling
```tsx
className='max-h-[calc(100vh-4rem)] overflow-y-auto'
```

### Group Hover Effects
```tsx
className='group cursor-pointer'
// Child element:
className='group-hover:scale-110 transition-transform'
```

### Sticky Headers
```tsx
className='sticky top-0 pb-2 border-b'
```

---

## Icon System

PlaySmith uses **Lucide React** for icons with consistent sizing:

```tsx
import { MousePointer, Pencil, Trash2, Settings } from 'lucide-react'

<MousePointer size={22} />
<Settings size={22} />
```

Custom SVG icons follow the same size convention:

```tsx
<svg width='22' height='22' viewBox='0 0 24 24'>
  {/* Icon paths */}
</svg>
```

---

## Summary

PlaySmith's styling system prioritizes:
1. **Consistency** - Reusable patterns across all components
2. **Apple Aesthetic** - SF Compact Rounded, rounded corners, smooth animations
3. **Theme Support** - Comprehensive light/dark mode
4. **Modern Stack** - Tailwind CSS + CSS variables
5. **Performance** - GPU-accelerated transitions, optimized rendering
6. **Accessibility** - High contrast, reduced motion support
7. **Professional** - Sports coaching tool with polished UI

The design language balances professional coaching functionality with the refined, approachable aesthetic users expect from Apple-quality applications.
