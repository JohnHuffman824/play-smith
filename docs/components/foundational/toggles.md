# Toggle Components

Components for binary states and selection controls.

---

## Components in this Document

- [Toggle](#toggle) - Single toggle button
- [ToggleGroup](#togglegroup) - Group of toggle buttons
- [Switch](#switch) - On/off switch control
- [Slider](#slider) - Range input control

---

## Toggle

Single toggle button for binary states (commonly used in text editors).

### Import

```tsx
import { Toggle } from '@/components/ui/toggle'
```

### Variants

- **`default`** - Standard toggle
- **`outline`** - Outlined toggle

### Sizes

- **`default`** - Standard size
- **`sm`** - Small size
- **`lg`** - Large size

### Usage

```tsx
import { Toggle } from '@/components/ui/toggle'
import { Bold, Italic, Underline } from 'lucide-react'

function ToggleExample() {
  return (
    <>
      <Toggle aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </Toggle>

      <Toggle aria-label="Toggle underline">
        <Underline className="h-4 w-4" />
      </Toggle>
    </>
  )
}
```

### Variants

```tsx
import { Toggle } from '@/components/ui/toggle'
import { Bold } from 'lucide-react'

function ToggleVariants() {
  return (
    <>
      <Toggle variant="default">
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle variant="outline">
        <Bold className="h-4 w-4" />
      </Toggle>
    </>
  )
}
```

### Sizes

```tsx
import { Toggle } from '@/components/ui/toggle'
import { Bold } from 'lucide-react'

function ToggleSizes() {
  return (
    <>
      <Toggle size="sm">
        <Bold className="h-3 w-3" />
      </Toggle>

      <Toggle size="default">
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle size="lg">
        <Bold className="h-5 w-5" />
      </Toggle>
    </>
  )
}
```

### With Text

```tsx
import { Toggle } from '@/components/ui/toggle'
import { Bold } from 'lucide-react'

function ToggleWithText() {
  return (
    <Toggle>
      <Bold className="mr-2 h-4 w-4" />
      Bold
    </Toggle>
  )
}
```

### Controlled Toggle

```tsx
import { Toggle } from '@/components/ui/toggle'
import { Bold } from 'lucide-react'
import { useState } from 'react'

function ControlledToggle() {
  const [pressed, setPressed] = useState(false)

  return (
    <Toggle
      pressed={pressed}
      onPressedChange={setPressed}
      aria-label="Toggle bold"
    >
      <Bold className="h-4 w-4" />
    </Toggle>
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'default' \| 'outline'` | Visual style variant |
| `size` | `'default' \| 'sm' \| 'lg'` | Size of the toggle |
| `pressed` | `boolean` | Controlled pressed state |
| `onPressedChange` | `(pressed: boolean) => void` | Press change handler |
| `disabled` | `boolean` | Disable toggle |

---

## ToggleGroup

Group of related toggle buttons (single or multiple selection).

### Import

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
```

### Usage - Single Selection

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

function ToggleGroupSingle() {
  return (
    <ToggleGroup type="single" defaultValue="left">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Usage - Multiple Selection

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, Underline } from 'lucide-react'

function ToggleGroupMultiple() {
  return (
    <ToggleGroup type="multiple" defaultValue={['bold']}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### With Text Labels

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

function ToggleGroupText() {
  return (
    <ToggleGroup type="single">
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Controlled ToggleGroup

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useState } from 'react'

function ControlledToggleGroup() {
  const [value, setValue] = useState('left')

  return (
    <ToggleGroup type="single" value={value} onValueChange={setValue}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `type` | `'single' \| 'multiple'` | Selection mode |
| `value` | `string \| string[]` | Controlled value(s) |
| `defaultValue` | `string \| string[]` | Initial value(s) |
| `onValueChange` | `(value) => void` | Value change handler |
| `disabled` | `boolean` | Disable all items |

---

## Switch

On/off switch control (similar to iOS toggle).

### Import

```tsx
import { Switch } from '@/components/ui/switch'
```

### Usage

```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

function SwitchExample() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  )
}
```

### Controlled Switch

```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

function ControlledSwitch() {
  const [enabled, setEnabled] = useState(false)

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="notifications"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
      <Label htmlFor="notifications">
        Notifications {enabled ? 'enabled' : 'disabled'}
      </Label>
    </div>
  )
}
```

### Disabled Switch

```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

function DisabledSwitch() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled">Disabled Switch</Label>
    </div>
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `checked` | `boolean` | Controlled checked state |
| `onCheckedChange` | `(checked: boolean) => void` | Change handler |
| `disabled` | `boolean` | Disable switch |

---

## Slider

Range input control for selecting numeric values.

### Import

```tsx
import { Slider } from '@/components/ui/slider'
```

### Usage

```tsx
import { Slider } from '@/components/ui/slider'

function SliderExample() {
  return (
    <Slider defaultValue={[50]} max={100} step={1} />
  )
}
```

### Range Slider (Multiple Values)

```tsx
import { Slider } from '@/components/ui/slider'

function RangeSlider() {
  return (
    <Slider defaultValue={[25, 75]} max={100} step={1} />
  )
}
```

### Controlled Slider

```tsx
import { Slider } from '@/components/ui/slider'
import { useState } from 'react'

function ControlledSlider() {
  const [value, setValue] = useState([50])

  return (
    <div className="space-y-4">
      <Slider
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
      />
      <p className="text-sm text-muted-foreground">
        Value: {value[0]}
      </p>
    </div>
  )
}
```

### With Labels

```tsx
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

function SliderWithLabel() {
  const [value, setValue] = useState([50])

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Label>Volume</Label>
        <span className="text-sm text-muted-foreground">{value[0]}%</span>
      </div>
      <Slider
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
      />
    </div>
  )
}
```

### Different Step Values

```tsx
import { Slider } from '@/components/ui/slider'

function StepSlider() {
  return (
    <>
      {/* Step by 5 */}
      <Slider defaultValue={[50]} max={100} step={5} />

      {/* Step by 10 */}
      <Slider defaultValue={[50]} max={100} step={10} />

      {/* Step by 0.1 for decimals */}
      <Slider defaultValue={[5.5]} max={10} step={0.1} />
    </>
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number[]` | Controlled value(s) |
| `defaultValue` | `number[]` | Initial value(s) |
| `onValueChange` | `(value: number[]) => void` | Value change handler |
| `min` | `number` | Minimum value (default: 0) |
| `max` | `number` | Maximum value (default: 100) |
| `step` | `number` | Step increment (default: 1) |
| `disabled` | `boolean` | Disable slider |

---

## Common Patterns

### Text Editor Toolbar

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Toggle } from '@/components/ui/toggle'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

function EditorToolbar() {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <ToggleGroup type="multiple">
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6" />

      <ToggleGroup type="single">
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
```

### Settings Panel

```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

function SettingsPanel() {
  const [volume, setVolume] = useState([50])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications">Enable Notifications</Label>
        <Switch id="notifications" />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="dark-mode">Dark Mode</Label>
        <Switch id="dark-mode" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Volume</Label>
          <span className="text-sm text-muted-foreground">{volume[0]}%</span>
        </div>
        <Slider
          value={volume}
          onValueChange={setVolume}
          max={100}
          step={1}
        />
      </div>
    </div>
  )
}
```

### View Mode Selector

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Grid, List, Columns } from 'lucide-react'

function ViewModeSelector() {
  return (
    <ToggleGroup type="single" defaultValue="grid">
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="columns" aria-label="Column view">
        <Columns className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

---

## Accessibility

### Toggle
- Always provide `aria-label` for icon-only toggles
- Pressed state is announced to screen readers
- Keyboard navigation supported

### Switch
- Associate with `<Label>` using matching `id` and `htmlFor`
- Checked state is announced to screen readers
- Space key toggles the switch

### Slider
- Keyboard navigation with arrow keys
- Page Up/Page Down for larger increments
- Home/End keys jump to min/max values
- Provide labels to indicate what the slider controls

---

## See Also

- [Buttons](./buttons.md) - Button component
- [Form Inputs](./form-inputs.md) - Input, Checkbox, RadioGroup components
- [Forms](../forms/form-system.md) - Form integration with React Hook Form
