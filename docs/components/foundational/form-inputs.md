# Form Input Components

Core form input components for collecting user data.

---

## Components in this Document

- [Input](#input) - Text input fields
- [Textarea](#textarea) - Multi-line text input
- [Checkbox](#checkbox) - Binary selection
- [RadioGroup](#radiogroup) - Single selection from options
- [Select](#select) - Dropdown selection
- [Label](#label) - Form labels
- [Calendar](#calendar) - Date picker
- [Command](#command) - Command palette/search
- [InputOTP](#inputotp) - One-time password input

---

## Input

Single-line text input field.

### Import

```tsx
import { Input } from '@/components/ui/input'
```

### Usage

```tsx
import { Input } from '@/components/ui/input'

function InputExample() {
  return (
    <>
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input disabled value="Read-only field" />
      <Input type="number" min={0} max={100} />
    </>
  )
}
```

### With Label

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LabeledInput() {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  )
}
```

### Styling

- Background: `bg-input-background`
- Border: `border-input`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring/20`
- Height: Auto (uses padding)

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `type` | `string` | HTML input type (text, email, password, etc.) |
| `placeholder` | `string` | Placeholder text |
| `disabled` | `boolean` | Disable input |
| `value` | `string` | Controlled value |
| `onChange` | `(e) => void` | Change handler |

---

## Textarea

Multi-line text input field.

### Import

```tsx
import { Textarea } from '@/components/ui/textarea'
```

### Usage

```tsx
import { Textarea } from '@/components/ui/textarea'

function TextareaExample() {
  return (
    <>
      <Textarea placeholder="Type your message here." />
      <Textarea rows={5} placeholder="Longer message area" />
      <Textarea disabled value="Read-only text" />
    </>
  )
}
```

### With Label

```tsx
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

function LabeledTextarea() {
  return (
    <div className="space-y-2">
      <Label htmlFor="message">Your Message</Label>
      <Textarea id="message" placeholder="Tell us what you think..." />
    </div>
  )
}
```

---

## Checkbox

Binary selection control.

### Import

```tsx
import { Checkbox } from '@/components/ui/checkbox'
```

### Usage

```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

function CheckboxExample() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  )
}
```

### With React Hook Form

```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { useForm } from 'react-hook-form'

function FormCheckbox() {
  const { register } = useForm()

  return (
    <Checkbox
      {...register('terms')}
      onCheckedChange={(checked) => {
        // Handle change
      }}
    />
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `checked` | `boolean \| 'indeterminate'` | Checked state |
| `onCheckedChange` | `(checked: boolean) => void` | Change handler |
| `disabled` | `boolean` | Disable checkbox |

---

## RadioGroup

Single selection from multiple options.

### Import

```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
```

### Usage

```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

function RadioExample() {
  return (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="r1" />
        <Label htmlFor="r1">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="r2" />
        <Label htmlFor="r2">Option Two</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="r3" />
        <Label htmlFor="r3">Option Three</Label>
      </div>
    </RadioGroup>
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `defaultValue` | `string` | Initial selected value |
| `value` | `string` | Controlled selected value |
| `onValueChange` | `(value: string) => void` | Change handler |
| `disabled` | `boolean` | Disable all options |

---

## Select

Dropdown selection component.

### Import

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
```

### Usage

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function SelectExample() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### With Label

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

function LabeledSelect() {
  return (
    <div className="space-y-2">
      <Label htmlFor="fruit">Favorite Fruit</Label>
      <Select>
        <SelectTrigger id="fruit">
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `defaultValue` | `string` | Initial selected value |
| `value` | `string` | Controlled selected value |
| `onValueChange` | `(value: string) => void` | Change handler |
| `disabled` | `boolean` | Disable select |

---

## Label

Form label component.

### Import

```tsx
import { Label } from '@/components/ui/label'
```

### Usage

```tsx
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function LabelExample() {
  return (
    <>
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" />
    </>
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `htmlFor` | `string` | ID of associated input |

---

## Calendar

Date picker component.

### Import

```tsx
import { Calendar } from '@/components/ui/calendar'
```

### Usage

```tsx
import { Calendar } from '@/components/ui/calendar'
import { useState } from 'react'

function CalendarExample() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  )
}
```

### Date Range Selection

```tsx
import { Calendar } from '@/components/ui/calendar'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

function DateRangeExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  return (
    <Calendar
      mode="range"
      selected={dateRange}
      onSelect={setDateRange}
      className="rounded-md border"
    />
  )
}
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `'single' \| 'multiple' \| 'range'` | Selection mode |
| `selected` | `Date \| DateRange \| Date[]` | Selected date(s) |
| `onSelect` | `(date) => void` | Selection handler |
| `disabled` | `Date \| Date[] \| function` | Disabled dates |

---

## Command

Command palette / search component.

### Import

```tsx
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
```

### Usage

```tsx
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

function CommandExample() {
  return (
    <Command>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Billing</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
```

### With Dialog

```tsx
import { useState } from 'react'
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'

function CommandDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem onSelect={() => setOpen(false)}>
              Option 1
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              Option 2
            </CommandItem>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

---

## InputOTP

One-time password input component.

### Import

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
```

### Usage

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

function OTPExample() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
```

### With Separator

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'

function OTPWithSeparator() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
```

---

## Common Patterns

### Form Field with Validation

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ValidatedField({ error }: { error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

### Search Input

```tsx
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

function SearchInput() {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search..." className="pl-8" />
    </div>
  )
}
```

---

## See Also

- [Buttons](./buttons.md) - Button component
- [Toggles](./toggles.md) - Toggle and Switch components
- [Form System](../forms/form-system.md) - Complete form integration with React Hook Form
- [Popovers](../overlay/popovers.md) - Popover for custom select UIs
