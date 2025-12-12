# Sheet & Drawer Components

Slide-out panel components for navigation, forms, and detailed content.

---

## Components in this Document

- [Sheet](#sheet) - Slide-out panel from any edge
- [Drawer](#drawer) - Bottom drawer with drag handle

---

## Sheet

Slide-out panel that overlays the main content from any screen edge.

### Import

```tsx
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
```

### Basic Usage (Right Side)

```tsx
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

function BasicSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            Sheet description goes here
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p>Sheet content</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Different Sides

```tsx
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

function SheetSides() {
  return (
    <div className="flex gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Top</Button>
        </SheetTrigger>
        <SheetContent side="top">
          <p>Content from top</p>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button>Right</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <p>Content from right (default)</p>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button>Bottom</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <p>Content from bottom</p>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button>Left</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <p>Content from left</p>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

### Controlled Sheet

```tsx
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

function ControlledSheet() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Sheet</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Controlled Sheet</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <Button onClick={() => setOpen(false)}>
              Close Sheet
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

### Form in Sheet

```tsx
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SheetForm() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Edit Profile</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" defaultValue="@johndoe" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

### Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | Side to slide from |
| `open` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | - | Open state change handler |

---

## Drawer

Bottom-aligned drawer with drag-to-dismiss functionality.

### Import

```tsx
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
```

### Basic Usage

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

function BasicDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer Title</DrawerTitle>
          <DrawerDescription>Drawer description goes here</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <p>Drawer content</p>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

### Controlled Drawer

```tsx
import { useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

function ControlledDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Controlled Drawer</DrawerTitle>
            <DrawerDescription>
              This drawer is controlled by state
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <Button onClick={() => setOpen(false)}>
              Close Drawer
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
```

### Drawer with Nested Content

```tsx
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

function DrawerWithScroll() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>View Items</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Items List</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="h-[300px] px-4">
          <div className="space-y-2">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-3">
                Item {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
```

### Key Features

- **Drag to dismiss** - Pull down to close
- **Snap points** - Define intermediate stop points
- **Mobile optimized** - Works great on touch devices
- **Smooth animations** - Spring-based physics

---

## Common Patterns

### Mobile Navigation Sheet

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

function MobileNav() {
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)]">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-lg font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
```

### Filter Sheet

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Filter } from 'lucide-react'

function FilterSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Categories</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="cat1" />
                <Label htmlFor="cat1">Category 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cat2" />
                <Label htmlFor="cat2">Category 2</Label>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Price Range</Label>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline">Reset</Button>
          <Button>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

### Shopping Cart Drawer

```tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart } from 'lucide-react'

function CartDrawer() {
  const cartItems = [
    { id: 1, name: 'Product 1', price: 29.99, quantity: 2 },
    { id: 2, name: 'Product 2', price: 39.99, quantity: 1 },
  ]

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Shopping Cart ({cartItems.length} items)</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="h-[300px] px-4">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between rounded-lg border p-4">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DrawerFooter>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Button className="w-full">Checkout</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

---

## When to Use Sheet vs Drawer

### Use Sheet when:
- Displaying forms or settings
- Desktop-first experience
- Need full-height content
- Coming from left, right, or top

### Use Drawer when:
- Mobile-first experience
- Bottom-aligned content makes sense
- Want drag-to-dismiss behavior
- Displaying lists or quick actions

---

## Accessibility

- Focus is trapped within the sheet/drawer when open
- ESC key closes the overlay
- Click/tap outside closes (configurable)
- Proper ARIA attributes for screen readers
- Focus returns to trigger element on close

---

## See Also

- [Dialogs](./dialogs.md) - Modal dialogs
- [Popovers](./popovers.md) - Non-modal overlays
- [Sidebars](../navigation/sidebars.md) - Persistent sidebar navigation
- [ScrollArea](../layout/containers.md#scrollarea) - Scrollable content
