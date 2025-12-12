# PlaySmith CSS Style Guide

**Purpose:** Quick reference for AI agents implementing PlaySmith UI
**Audience:** AI assistants working on the codebase

---

## 1. File Organization

**Each component gets a matching CSS file:**
```
Button.tsx → button.css     (.button, .button-action, .button-destructive)
Card.tsx   → card.css       (.card, .card-header)
Dialog.tsx → dialog.css     (.dialog)
Input.tsx  → input.css      (.input)
```

**Rules:**
- CSS filenames are lowercase
- Class names match component name exactly (`.button` for `Button.tsx`)
- Modifiers use hyphen suffix (`.button-action`, `.button-destructive`)

**Section Order Within CSS Files:**
```css
/* || Variables (if component-specific) */
/* || Base styles */
/* || Variants/Modifiers */
/* || States (:hover, :focus, :disabled) */
/* || Media queries */
```

---

## 2. CSS Syntax Conventions

### Selectors
```css
/* ✅ Simple class selectors */
.card { }

/* ❌ Overly specific - hard to reuse */
article.main div.content p.box { }
```

### Shorthands
```css
/* ✅ Use shorthand when all values are set */
margin: 1em 2em;
border: 1px solid var(--border);

/* ✅ Canonical order */
border: 1px solid red;  /* width style color */

/* ❌ Wrong order */
border: solid red 1px;
```

### Background Properties: Shorthand vs Longhand

**Critical:** LightningCSS (our bundler) may strip `background` shorthand if mixed with `background-color` longhand.

```css
/* ❌ WRONG - Bundler strips base background during minification */
.button {
  background: var(--muted);  /* Shorthand */
}
.button:hover {
  background-color: var(--accent);  /* Longhand - causes conflict! */
}

/* ✅ CORRECT - Use background-color consistently */
.button {
  background-color: var(--muted);  /* Longhand */
}
.button:hover {
  background-color: var(--accent);  /* Longhand */
}

/* ✅ ALSO CORRECT - Use background shorthand consistently */
.button {
  background: var(--muted);  /* Shorthand */
}
.button:hover {
  background: var(--accent);  /* Shorthand */
}
```

**Why this happens:**
- `background` is shorthand that resets ALL background properties (color, image, position, etc.)
- `background-color` only sets the color
- Mixing them creates a specificity conflict
- LightningCSS optimizes by removing the "redundant" base property
- Result: Base class has NO background in production build

**Preferred solution:** Use `background-color` for color-only changes, `background` shorthand only when setting multiple properties.

### Units
```css
/* ✅ Relative units for flexibility */
font-size: 1rem;
padding: 0.5em;
max-width: 80%;

/* ❌ Fixed pixels (less flexible) */
font-size: 16px;
max-width: 500px;
```

### Colors
```css
/* ✅ CSS variables (theme-aware) */
background: var(--card);

/* ✅ Named colors for common values */
color: black;
color: transparent;

/* ✅ Modern rgb() syntax (no commas) */
color: rgb(31 41 59);
color: rgb(31 41 59 / 50%);

/* ✅ 6-digit hex for clarity */
color: #aabbcc;

/* ❌ 3-digit hex (less readable) */
color: #abc;

/* ❌ Hardcoded hex for theme colors */
background: #ffffff;
```

### Pseudo-elements
```css
/* ✅ Double colon (modern) */
.element::before { }
.element::after { }

/* ❌ Single colon (legacy) */
.element:before { }
```

### Media Queries
```css
/* ✅ Modern range syntax */
@media (width >= 768px) { }
@media (600px < height < 900px) { }

/* ❌ Legacy min/max */
@media (min-width: 768px) { }

/* ✅ Mobile-first order */
.element { /* mobile styles */ }
@media (width >= 768px) { /* tablet */ }
@media (width >= 1024px) { /* desktop */ }
```

### Keyframes
```css
/* ✅ from/to for simple animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ✅ Percentages for multi-step */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

### Comments
```css
/* || Section Marker - searchable */

/* Explain WHY, not what */
.element {
  /* Fallback for browsers without grid support */
  display: flex;
  display: grid;
}
```

### Quotes & Imports
```css
/* ✅ Double quotes */
@import "components/button.css";
font-family: "Helvetica Neue", sans-serif;
content: "→";

/* ❌ url() for imports */
@import url("button.css");
```

---

## 3. Theme System

### Core Rule: Use CSS Variables
```css
/* ✅ Variables auto-switch with .dark class */
.element {
  background: var(--background);
  color: var(--foreground);
  border-color: var(--border);
}

/* ❌ Hardcoded colors */
.element {
  background: white;
  color: #1f2937;
}

/* ❌ JS theme ternaries */
style={{ background: theme === 'dark' ? '#1f2937' : '#fff' }}
```

### Color Tokens

| Token | Use |
|-------|-----|
| `--background` / `--foreground` | Page background/text |
| `--card` / `--card-foreground` | Card surfaces |
| `--popover` / `--popover-foreground` | Dialogs, dropdowns |
| `--muted` / `--muted-foreground` | Subdued elements |
| `--accent` / `--accent-foreground` | Hover states |
| `--action-button` / `--action-button-foreground` | Primary actions (blue) |
| `--destructive` / `--destructive-foreground` | Delete/danger actions |
| `--border` | All borders |
| `--input-background` | Form inputs |
| `--ring` | Focus rings |

### Dark Mode Depth Hierarchy
```
16% ─ var(--background)      Page background (darkest)
18% ─ var(--input-background) Form inputs (recessed "well")
20% ─ var(--card)            Cards (elevated)
24% ─ var(--popover)         Dialogs (floating, lightest)
```

**Exception:** Canvas/SVG elements that can't use CSS may use JS theme detection.

---

## 4. Interactive States

**Every interactive element MUST have:**

```css
.interactive {
  cursor: pointer;
  outline: none;
  transition: all 200ms;

  &:hover {
    background: var(--accent);
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 50%, transparent);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
```

---

## 5. Layout

### Spacing
```css
/* ✅ Use gap for spacing */
.container { display: flex; gap: 12px; }

/* ❌ Margins between siblings */
.item { margin-right: 12px; }
```

### Standard Values

| Property | Buttons | Cards | Dialogs | Inputs |
|----------|---------|-------|---------|--------|
| `border-radius` | 8px | 12px | 16px | 8px |
| `padding` | 8px 16px | 16px | 24px | 10px 16px |

### Z-Index Scale
| Layer | Value | Use |
|-------|-------|-----|
| Base | 10 | Field elements |
| Dialogs | 50 | Modals, popovers |
| Overlays | 70 | Context menus |

---

## 6. Typography

| Element | Size | Weight |
|---------|------|--------|
| h1 | 1.5rem (24px) | 500 |
| h2 | 1.25rem (20px) | 500 |
| h3 | 1.125rem (18px) | 500 |
| body | 1rem (16px) | 400 |
| small | 0.875rem (14px) | 400 |
| caption | 0.75rem (12px) | 400 |

**Font stack:** `'SF Compact Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Always include generic fallback** (`sans-serif`, `serif`, `monospace`).

---

## 7. Component Library

**Full component reference:** [STYLE_COMPONENTS.md](./STYLE_COMPONENTS.md)

**Before creating a new component:**
1. Check if one exists in [STYLE_COMPONENTS.md](./STYLE_COMPONENTS.md)
2. If creating a new reusable component, **add it to STYLE_COMPONENTS.md**

### Common Components

| Component | Use For | Size |
|-----------|---------|------|
| `Button` | Text buttons, forms | Various |
| `IconButton` | Icon actions with tooltip | 40x40 or 24x24 |
| `ToolbarButton` | Main toolbar with active state | 56x56 |
| `DialogCloseButton` | Dialog X button | 24x24 |

```tsx
import { Button } from '@/components/ui/button'
<Button variant="action">Save</Button>  // action | destructive | outline | ghost
```

**Tooltip requirement:** Wrap with `<TooltipProvider>` for IconButton/ToolbarButton.

---

## 8. Conditional Styling

```tsx
// Template literals
<div className={`card ${isActive ? 'card-active' : ''}`} />

// Data attributes (preferred for state)
<button data-active={isActive} className="toolbar-button" />
```

```css
.toolbar-button[data-active="true"] {
  background: var(--action-button);
}
```

---

## 9. Rules & Anti-Patterns

### NEVER Do
- `!important` - Rethink specificity instead
- Hardcoded colors (`#fff`, `white`) - Use `var(--token)`
- Theme ternaries in JS - CSS variables auto-switch
- `outline: none` without `:focus-visible` - Accessibility violation
- Overly-specific selectors - Keep simple
- CSS resets - Modern CSS doesn't need them
- Single-colon pseudo-elements (`:before`) - Use `::before`

### ALWAYS Do
- `cursor: pointer` on clickables
- `:focus-visible` on interactive elements
- `aria-label` on icon-only buttons
- Test in BOTH light and dark modes
- Match CSS filename to component (`Button.tsx` → `button.css`)

---

## 10. New Component Checklist

- [ ] Reusable component exists? Check [STYLE_COMPONENTS.md](./STYLE_COMPONENTS.md)
- [ ] If new reusable component → **add to STYLE_COMPONENTS.md**
- [ ] CSS file matches component name
- [ ] Class names match component name
- [ ] Uses CSS variables for colors
- [ ] Tested in light AND dark mode
- [ ] Has `cursor: pointer` (if clickable)
- [ ] Has `:focus-visible` state
- [ ] Has `:disabled` state
- [ ] Uses `gap` not margins
- [ ] Icon buttons have `aria-label`
- [ ] WCAG AA contrast (4.5:1)
