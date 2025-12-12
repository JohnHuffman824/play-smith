# Popover, HoverCard & Tooltip Components

Non-modal overlay components for contextual information and interactions.

---

## Components in this Document

- [Popover](#popover) - Floating content on click
- [HoverCard](#hovercard) - Rich content on hover
- [Tooltip](#tooltip) - Simple text on hover

---

## Popover

Floating content triggered by clicking an element.

### Import

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
```

### Basic Usage

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

function BasicPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Popover Title</h4>
          <p className="text-sm text-muted-foreground">
            Popover content goes here
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### With Form

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function PopoverForm() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Settings</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Alignment

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent align="start">Aligned to start</PopoverContent>
</Popover>

<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent align="center">Centered (default)</PopoverContent>
</Popover>

<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent align="end">Aligned to end</PopoverContent>
</Popover>
```

### Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment relative to trigger |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side |
| `sideOffset` | `number` | `4` | Distance from trigger |

---

## HoverCard

Rich content preview shown on hover.

### Import

```tsx
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
```

### Basic Usage

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

function BasicHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#" className="underline">@username</a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">@username</h4>
          <p className="text-sm">
            This is a bio or description of the user.
          </p>
          <div className="flex items-center pt-2">
            <span className="text-xs text-muted-foreground">
              Joined December 2021
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
```

### User Profile Card

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarDays } from 'lucide-react'

function UserHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#" className="font-medium underline">@nextjs</a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
```

---

## Tooltip

Simple text tooltip shown on hover.

### Import

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
```

### Basic Usage

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

function BasicTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tooltip text</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Icon Button with Tooltip

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Trash } from 'lucide-react'

function IconTooltips() {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add new item</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open settings</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Trash className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
```

### With Delay

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

function TooltipWithDelay() {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Hover for 300ms</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delayed tooltip</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Global TooltipProvider

Wrap your app with TooltipProvider once at the root:

```tsx
// app/layout.tsx or _app.tsx
import { TooltipProvider } from '@/components/ui/tooltip'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
```

Then use tooltips without wrapping each one:

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

function SimpleTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>Hover</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Tooltip</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

---

## Common Patterns

### Date Picker Popover

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

function DatePickerPopover() {
  const [date, setDate] = useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Color Picker Popover

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

function ColorPickerPopover() {
  const [color, setColor] = useState('#000000')

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[220px] justify-start">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: color }}
            />
            {color}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {colors.map((c) => (
            <button
              key={c}
              className="h-8 w-8 rounded border-2"
              style={{
                backgroundColor: c,
                borderColor: c === color ? '#000' : 'transparent',
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

---

## When to Use Each Component

### Use Popover when:
- User needs to interact with the content
- Displaying forms or complex UI
- Content should persist while interacting
- Click to open/close

### Use HoverCard when:
- Previewing user profiles or data
- Showing additional context on hover
- Content is read-only
- Hover to show, leave to hide

### Use Tooltip when:
- Simple text explanation
- Icon button labels
- Brief help text
- Quick information

---

## Accessibility

### Popover
- Keyboard accessible (Enter/Space to open)
- ESC key closes
- Focus management
- ARIA attributes for screen readers

### HoverCard
- Keyboard accessible (focus to show)
- Delay before showing
- Mouse leave hides content
- Focus management

### Tooltip
- Not focusable (supplementary info only)
- Never contains interactive content
- Brief delay before showing
- Keyboard users see on focus

---

## See Also

- [Dialogs](./dialogs.md) - Modal overlays
- [Sheets](./sheets.md) - Slide-out panels
- [Menus](./menus.md) - Dropdown and context menus
- [Calendar](../foundational/form-inputs.md#calendar) - Date picker component
- [Avatars](../data-display/avatars.md) - Avatar component for hover cards
