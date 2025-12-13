# Button Component

The Button component is the primary interactive element for triggering actions throughout the application.

---

## Import

```tsx
import { Button } from '@/components/ui/button'
```

---

## Variants

The Button component supports 6 visual variants:

- **`default`** - Primary button with solid background (bg-primary)
- **`destructive`** - Danger/delete actions with red background (bg-destructive)
- **`outline`** - Bordered button with transparent background
- **`secondary`** - Secondary actions with muted background (bg-secondary)
- **`ghost`** - Transparent background, visible only on hover
- **`link`** - Styled as an underlined text link

---

## Sizes

- **`default`** - Standard size: h-9 px-4 py-2
- **`sm`** - Small size: h-8 px-3
- **`lg`** - Large size: h-10 px-6
- **`icon`** - Square button: size-9 (perfect for icon-only buttons)

---

## Usage Examples

### Basic Buttons

```tsx
import { Button } from '@/components/ui/button'

function BasicExample() {
  return (
    <>
      <Button>Default Button</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="secondary">Secondary Action</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="link">Link Button</Button>
    </>
  )
}
```

### Size Variations

```tsx
import { Button } from '@/components/ui/button'

function SizeExample() {
  return (
    <>
      <Button size="sm">Small Button</Button>
      <Button size="default">Default Button</Button>
      <Button size="lg">Large Button</Button>
    </>
  )
}
```

### Icon Buttons

```tsx
import { Button } from '@/components/ui/button'
import { X, Settings, Plus } from 'lucide-react'

function IconButtonExample() {
  return (
    <>
      {/* Icon-only button */}
      <Button variant="ghost" size="icon">
        <X className="h-4 w-4" />
      </Button>

      {/* Button with icon and text */}
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>

      {/* Icon on the right */}
      <Button variant="outline">
        Settings
        <Settings className="ml-2 h-4 w-4" />
      </Button>
    </>
  )
}
```

### As Child (Composition)

Use `asChild` to render the button as another element (e.g., Next.js Link):

```tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function AsChildExample() {
  return (
    <Button asChild>
      <Link href="/dashboard">Go to Dashboard</Link>
    </Button>
  )
}
```

### Disabled State

```tsx
import { Button } from '@/components/ui/button'

function DisabledExample() {
  return (
    <>
      <Button disabled>Disabled Button</Button>
      <Button disabled variant="outline">Disabled Outline</Button>
    </>
  )
}
```

### Loading State

Create a loading button by combining with an icon:

```tsx
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

function LoadingExample() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Button disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Loading...' : 'Submit'}
    </Button>
  )
}
```

---

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Size of the button |
| `asChild` | `boolean` | `false` | Renders as child element instead of button |
| `disabled` | `boolean` | `false` | Disables the button |
| `onClick` | `() => void` | - | Click handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `className` | `string` | - | Additional CSS classes |

All standard HTML button attributes are also supported.

---

## Styling

The Button component uses plain CSS with CSS variables for theming. Base styles are defined in `/src/components/ui/button.css`.

### CSS Variables Used

- `--primary` - Default variant background
- `--primary-foreground` - Default variant text color
- `--destructive` - Destructive variant background
- `--destructive-foreground` - Destructive variant text color
- `--secondary` - Secondary variant background
- `--secondary-foreground` - Secondary variant text color
- `--border` - Outline variant border
- `--accent` - Ghost variant hover background
- `--accent-foreground` - Link variant text color

---

## Accessibility

- Uses semantic `<button>` element by default
- Supports `disabled` state with proper `aria-disabled` attribute
- Focus visible ring on keyboard navigation
- Proper contrast ratios for all variants
- When using `asChild` with links, ensure proper semantic HTML

### Best Practices

1. **Always provide accessible labels**
   - For icon-only buttons, use `aria-label`
   ```tsx
   <Button variant="ghost" size="icon" aria-label="Close dialog">
     <X className="h-4 w-4" />
   </Button>
   ```

2. **Use appropriate variants**
   - `destructive` for delete/remove actions
   - `outline` or `secondary` for cancel/dismiss actions
   - `ghost` for subtle actions in toolbars
   - `link` for navigation that looks like text

3. **Button type attribute**
   - Use `type="submit"` in forms
   - Use `type="button"` (default) for actions
   - Use `type="reset"` to clear forms

---

## Common Patterns

### Form Actions

```tsx
import { Button } from '@/components/ui/button'

function FormActions() {
  return (
    <div className="flex gap-2">
      <Button type="submit">Save Changes</Button>
      <Button type="button" variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
    </div>
  )
}
```

### Confirmation Dialog

```tsx
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogFooter } from '@/components/ui/alert-dialog'

function ConfirmDelete() {
  return (
    <AlertDialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </AlertDialogFooter>
  )
}
```

### Toolbar Actions

```tsx
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline } from 'lucide-react'

function Toolbar() {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

---

## See Also

- [Form Inputs](./form-inputs.md) - Input components for forms
- [Toggles](./toggles.md) - Toggle and Switch components
- [Dialogs](../overlay/dialogs.md) - Modal dialogs with button actions
- [Forms](../forms/form-system.md) - Complete form system with validation
