# PlaySmith Component Catalog

**Audience:** AI assistants working on PlaySmith codebase
**Purpose:** Complete UI component reference with import paths, variants, and usage examples
**Last Updated:** 2025-01

---

## Quick Lookup Table

| Component | Category | Key Variants | Import Path |
|-----------|----------|--------------|-------------|
| Accordion | Utility | - | `@/components/ui/accordion` |
| Alert | Data Display | default, destructive | `@/components/ui/alert` |
| AlertDialog | Overlay | - | `@/components/ui/alert-dialog` |
| AspectRatio | Layout | - | `@/components/ui/aspect-ratio` |
| Avatar | Data Display | - | `@/components/ui/avatar` |
| Badge | Data Display | default, secondary, destructive, outline | `@/components/ui/badge` |
| Breadcrumb | Navigation | - | `@/components/ui/breadcrumb` |
| Button | Foundational | default, destructive, outline, secondary, ghost, link | `@/components/ui/button` |
| Calendar | Foundational | - | `@/components/ui/calendar` |
| Card | Layout | - | `@/components/ui/card` |
| Carousel | Layout | - | `@/components/ui/carousel` |
| Chart | Data Display | - | `@/components/ui/chart` |
| Checkbox | Foundational | - | `@/components/ui/checkbox` |
| Collapsible | Utility | - | `@/components/ui/collapsible` |
| Command | Foundational | - | `@/components/ui/command` |
| ContextMenu | Overlay | - | `@/components/ui/context-menu` |
| Dialog | Overlay | - | `@/components/ui/dialog` |
| Drawer | Overlay | - | `@/components/ui/drawer` |
| DropdownMenu | Overlay | - | `@/components/ui/dropdown-menu` |
| Form | Form | - | `@/components/ui/form` |
| HoverCard | Overlay | - | `@/components/ui/hover-card` |
| Input | Foundational | - | `@/components/ui/input` |
| InputOTP | Foundational | - | `@/components/ui/input-otp` |
| Label | Foundational | - | `@/components/ui/label` |
| Menubar | Navigation | - | `@/components/ui/menubar` |
| NavigationMenu | Navigation | - | `@/components/ui/navigation-menu` |
| Pagination | Navigation | - | `@/components/ui/pagination` |
| Popover | Overlay | - | `@/components/ui/popover` |
| Progress | Data Display | - | `@/components/ui/progress` |
| RadioGroup | Foundational | - | `@/components/ui/radio-group` |
| Resizable | Layout | - | `@/components/ui/resizable` |
| ScrollArea | Layout | - | `@/components/ui/scroll-area` |
| Select | Foundational | - | `@/components/ui/select` |
| Separator | Layout | - | `@/components/ui/separator` |
| Sheet | Overlay | - | `@/components/ui/sheet` |
| Sidebar | Navigation | - | `@/components/ui/sidebar` |
| Skeleton | Data Display | - | `@/components/ui/skeleton` |
| Slider | Foundational | - | `@/components/ui/slider` |
| Sonner | Utility | - | `@/components/ui/sonner` |
| Switch | Foundational | - | `@/components/ui/switch` |
| Table | Data Display | - | `@/components/ui/table` |
| Tabs | Navigation | - | `@/components/ui/tabs` |
| Textarea | Foundational | - | `@/components/ui/textarea` |
| Toggle | Foundational | default, outline | `@/components/ui/toggle` |
| ToggleGroup | Foundational | - | `@/components/ui/toggle-group` |
| Tooltip | Overlay | - | `@/components/ui/tooltip` |

**Total:** 46 shadcn/ui components

---

## Foundational Components

### Button

**Import:** `import { Button } from '@/components/ui/button'`

**Variants:**
- `default` - Primary button (bg-primary)
- `destructive` - Danger action (bg-destructive)
- `outline` - Bordered button
- `secondary` - Secondary action (bg-secondary)
- `ghost` - Transparent background
- `link` - Underlined text link

**Sizes:**
- `default` - h-9 px-4 py-2
- `sm` - h-8 px-3
- `lg` - h-10 px-6
- `icon` - size-9 (square button for icons)

**Usage:**
```tsx
import { Button } from '@/components/ui/button'

<Button>Default Button</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Small</Button>
<Button variant="ghost" size="icon"><X /></Button>
```

**Key Props:**
- `asChild` - Renders as child element (for Next.js Link, etc.)
- `disabled` - Disables button

---

### Input

**Import:** `import { Input } from '@/components/ui/input'`

**Usage:**
```tsx
import { Input } from '@/components/ui/input'

<Input type="email" placeholder="Email address" />
<Input type="password" />
<Input disabled value="Read-only" />
```

**Styling:**
- Automatically themed via `bg-input-background`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring/20`
- Height: auto (uses padding)

---

### Textarea

**Import:** `import { Textarea } from '@/components/ui/textarea'`

**Usage:**
```tsx
import { Textarea } from '@/components/ui/textarea'

<Textarea placeholder="Type your message here." />
<Textarea rows={5} />
```

---

### Checkbox

**Import:** `import { Checkbox } from '@/components/ui/checkbox'`

**Usage:**
```tsx
import { Checkbox } from '@/components/ui/checkbox'

<Checkbox id="terms" />
<label htmlFor="terms">Accept terms and conditions</label>

// With React Hook Form
<Checkbox
  checked={field.value}
  onCheckedChange={field.onChange}
/>
```

---

### RadioGroup

**Import:** `import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'`

**Usage:**
```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="r1" />
    <Label htmlFor="r1">Option One</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="r2" />
    <Label htmlFor="r2">Option Two</Label>
  </div>
</RadioGroup>
```

---

### Select

**Import:** `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'`

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>
```

---

### Switch

**Import:** `import { Switch } from '@/components/ui/switch'`

**Usage:**
```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

---

### Slider

**Import:** `import { Slider } from '@/components/ui/slider'`

**Usage:**
```tsx
import { Slider } from '@/components/ui/slider'

<Slider defaultValue={[50]} max={100} step={1} />
<Slider defaultValue={[33, 66]} max={100} step={1} /> {/* Range slider */}
```

---

### Label

**Import:** `import { Label } from '@/components/ui/label'`

**Usage:**
```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

---

### Calendar

**Import:** `import { Calendar } from '@/components/ui/calendar'`

**Usage:**
```tsx
import { Calendar } from '@/components/ui/calendar'
import { useState } from 'react'

function DatePicker() {
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

---

### Command

**Import:** `import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'`

**Usage:**
```tsx
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

<Command>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>Calendar</CommandItem>
      <CommandItem>Search Emoji</CommandItem>
      <CommandItem>Calculator</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

---

### Toggle

**Import:** `import { Toggle } from '@/components/ui/toggle'`

**Variants:**
- `default` - Standard toggle
- `outline` - Outlined toggle

**Sizes:**
- `default`
- `sm`
- `lg`

**Usage:**
```tsx
import { Toggle } from '@/components/ui/toggle'
import { Bold } from 'lucide-react'

<Toggle aria-label="Toggle bold">
  <Bold className="h-4 w-4" />
</Toggle>
```

---

### ToggleGroup

**Import:** `import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'`

**Usage:**
```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

<ToggleGroup type="single">
  <ToggleGroupItem value="left">Left</ToggleGroupItem>
  <ToggleGroupItem value="center">Center</ToggleGroupItem>
  <ToggleGroupItem value="right">Right</ToggleGroupItem>
</ToggleGroup>
```

---

### InputOTP

**Import:** `import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'`

**Usage:**
```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

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
```

---

## Layout Components

### Card

**Import:** `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'`

**Usage:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Styling:**
- Border: `border-border`
- Background: `bg-card`
- Radius: `rounded-xl`

---

### Separator

**Import:** `import { Separator } from '@/components/ui/separator'`

**Usage:**
```tsx
import { Separator } from '@/components/ui/separator'

<div>
  <div>Content above</div>
  <Separator />
  <div>Content below</div>
</div>

{/* Vertical separator */}
<div className="flex h-5 items-center space-x-4">
  <div>Item 1</div>
  <Separator orientation="vertical" />
  <div>Item 2</div>
</div>
```

---

### ScrollArea

**Import:** `import { ScrollArea } from '@/components/ui/scroll-area'`

**Usage:**
```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-[350px] w-[300px] rounded-md border p-4">
  {/* Long content here */}
</ScrollArea>
```

---

### Resizable

**Import:** `import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'`

**Usage:**
```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel>Panel 1</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>Panel 2</ResizablePanel>
</ResizablePanelGroup>
```

---

### AspectRatio

**Import:** `import { AspectRatio } from '@/components/ui/aspect-ratio'`

**Usage:**
```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'

<AspectRatio ratio={16 / 9}>
  <img src="image.jpg" alt="Image" className="rounded-md object-cover" />
</AspectRatio>
```

---

### Carousel

**Import:** `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'`

**Usage:**
```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

<Carousel>
  <CarouselContent>
    <CarouselItem>Item 1</CarouselItem>
    <CarouselItem>Item 2</CarouselItem>
    <CarouselItem>Item 3</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

---

## Overlay Components

### Dialog

**Import:** `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'`

**Usage:**
```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text goes here
      </DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Features:**
- Portal rendering (renders at document root)
- Focus trap (Tab key cycles within dialog)
- Escape key closes
- Click outside closes
- Backdrop overlay

---

### AlertDialog

**Import:** `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'`

**Usage:**
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Sheet

**Import:** `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'`

**Usage:**
```tsx
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

<Sheet>
  <SheetTrigger>Open Sheet</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>Sheet description</SheetDescription>
    </SheetHeader>
    <div>Sheet content</div>
  </SheetContent>
</Sheet>
```

**Sides:**
- `side="top"`
- `side="right"` (default)
- `side="bottom"`
- `side="left"`

---

### Drawer

**Import:** `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer'`

**Usage:**
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

<Drawer>
  <DrawerTrigger>Open Drawer</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Drawer Title</DrawerTitle>
      <DrawerDescription>Drawer description</DrawerDescription>
    </DrawerHeader>
    <div className="p-4">Drawer content</div>
    <DrawerFooter>
      <Button>Submit</Button>
      <DrawerClose>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

---

### Popover

**Import:** `import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'`

**Usage:**
```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <h4 className="font-medium">Popover Title</h4>
      <p className="text-sm text-muted-foreground">Popover content</p>
    </div>
  </PopoverContent>
</Popover>
```

**Features:**
- Auto-positioning (flips when near viewport edge)
- Portal rendering
- Alignment: `align="start"`, `align="center"`, `align="end"`

---

### DropdownMenu

**Import:** `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu'`

**Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Billing</DropdownMenuItem>
    <DropdownMenuItem>Team</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Alignment:**
- `align="start"` - Align to start edge
- `align="center"` - Center align
- `align="end"` - Align to end edge

**Features:**
- Portal rendering
- Auto-positioning (viewport aware)
- Keyboard navigation (arrow keys)
- Variant for destructive items: `variant="destructive"`

---

### ContextMenu

**Import:** `import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'`

**Usage:**
```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

<ContextMenu>
  <ContextMenuTrigger>
    <div className="border rounded-md p-4">Right click me</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Copy</ContextMenuItem>
    <ContextMenuItem>Paste</ContextMenuItem>
    <ContextMenuItem>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

### Tooltip

**Import:** `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'`

**Usage:**
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
```

**Note:** Wrap app with `<TooltipProvider>` at root level for best performance.

---

### HoverCard

**Import:** `import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'`

**Usage:**
```tsx
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

<HoverCard>
  <HoverCardTrigger>Hover me</HoverCardTrigger>
  <HoverCardContent>
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">@username</h4>
      <p className="text-sm">User bio goes here</p>
    </div>
  </HoverCardContent>
</HoverCard>
```

---

## Navigation Components

### Tabs

**Import:** `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'`

**Usage:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account content
  </TabsContent>
  <TabsContent value="password">
    Password content
  </TabsContent>
</Tabs>
```

---

### Breadcrumb

**Import:** `import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'`

**Usage:**
```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current Page</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

### Pagination

**Import:** `import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'`

**Usage:**
```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

### NavigationMenu

**Import:** `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from '@/components/ui/navigation-menu'`

**Usage:**
```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink>Link</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

---

### Menubar

**Import:** `import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from '@/components/ui/menubar'`

**Usage:**
```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New Tab</MenubarItem>
      <MenubarItem>New Window</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Edit</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Undo</MenubarItem>
      <MenubarItem>Redo</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

---

### Sidebar

**Import:** `import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'`

**Usage:**
```tsx
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

<SidebarProvider>
  <Sidebar>
    {/* Sidebar content */}
  </Sidebar>
  <main>
    <SidebarTrigger />
    {/* Main content */}
  </main>
</SidebarProvider>
```

---

## Data Display Components

### Badge

**Import:** `import { Badge } from '@/components/ui/badge'`

**Variants:**
- `default` - Primary badge
- `secondary` - Secondary badge
- `destructive` - Danger badge
- `outline` - Outlined badge

**Usage:**
```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

---

### Avatar

**Import:** `import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'`

**Usage:**
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

---

### Alert

**Import:** `import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'`

**Variants:**
- `default` - Standard alert
- `destructive` - Error/danger alert

**Usage:**
```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>
```

---

### Table

**Import:** `import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table'`

**Usage:**
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

<Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Progress

**Import:** `import { Progress } from '@/components/ui/progress'`

**Usage:**
```tsx
import { Progress } from '@/components/ui/progress'

<Progress value={33} />
<Progress value={66} className="w-[60%]" />
```

---

### Skeleton

**Import:** `import { Skeleton } from '@/components/ui/skeleton'`

**Usage:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>
```

---

### Chart

**Import:** `import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'`

**Usage:**
See [Recharts documentation](https://recharts.org/) for chart implementation. PlaySmith chart component provides themed wrappers for Recharts.

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
}

<ChartContainer config={chartConfig}>
  {/* Recharts components */}
</ChartContainer>
```

---

## Form Components

### Form

**Import:** `import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'`

**Usage with React Hook Form:**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  username: z.string().min(2).max(50),
})

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

**Features:**
- Full React Hook Form integration
- Zod schema validation
- Automatic error display
- Accessible form patterns

---

## Utility Components

### Accordion

**Import:** `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'`

**Usage:**
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Is it styled?</AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles that match the design system.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Types:**
- `type="single"` - Only one item open at a time
- `type="multiple"` - Multiple items can be open

---

### Collapsible

**Import:** `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'`

**Usage:**
```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

<Collapsible>
  <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
  <CollapsibleContent>
    Yes. Free to use for personal and commercial projects.
  </CollapsibleContent>
</Collapsible>
```

---

### Sonner (Toast Notifications)

**Import:** `import { toast } from 'sonner'`

**Setup:**
```tsx
// In root layout/app
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      {/* Your app content */}
      <Toaster />
    </>
  )
}
```

**Usage:**
```tsx
import { toast } from 'sonner'

// Success toast
toast.success('Event has been created')

// Error toast
toast.error('Something went wrong')

// Info toast
toast.info('New update available')

// Custom toast
toast('Event has been created', {
  description: 'Sunday, December 03, 2023 at 9:00 AM',
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
})

// Loading toast
toast.loading('Loading...')

// Promise toast
toast.promise(promise, {
  loading: 'Loading...',
  success: 'Success!',
  error: 'Error',
})
```

---

## PlaySmith Custom Components

### Modal (Shared)

**Import:** `import { Modal } from '@/components/shared/Modal'`

**Usage:**
```tsx
import { Modal } from '@/components/shared/Modal'

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Dialog Title"
>
  {/* Modal content */}
</Modal>
```

**Features:**
- Backdrop overlay
- Escape key closes
- Click outside closes
- Theme-aware styling

---

### SettingsDialog (Shared)

**Import:** `import { SettingsDialog } from '@/components/shared/SettingsDialog'`

**Usage:**
```tsx
import { SettingsDialog } from '@/components/shared/SettingsDialog'

<SettingsDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Features:**
- Theme toggle (light/dark)
- Position naming preference
- Field level preference

---

### ShareDialog (Shared)

**Import:** `import { ShareDialog } from '@/components/shared/ShareDialog'`

**Usage:**
```tsx
import { ShareDialog } from '@/components/shared/ShareDialog'

<ShareDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  playbookName="My Playbook"
  onShare={(recipients) => {
    console.log('Sharing with:', recipients)
  }}
/>
```

**Features:**
- Add recipients by email
- Role selection (viewer/collaborator)
- Copy link to clipboard
- Email list management

---

### ConceptDialog

**Import:** `import { ConceptDialog } from '@/components/concepts/ConceptDialog'`

**Usage:**
```tsx
import { ConceptDialog } from '@/components/concepts/ConceptDialog'

<ConceptDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConceptSelect={(concept) => {
    console.log('Selected concept:', concept)
  }}
/>
```

---

### PlaybookCard

**Import:** `import { PlaybookCard } from '@/components/playbook-manager/PlaybookCard'`

**Usage:**
```tsx
import { PlaybookCard } from '@/components/playbook-manager/PlaybookCard'

<PlaybookCard
  id={1}
  name="Offensive Game Plan"
  type="playbook"
  playCount={15}
  lastModified="2 days ago"
  thumbnail="/thumbnail.png"
  onRename={(id) => console.log('Rename', id)}
  onDelete={(id) => console.log('Delete', id)}
  onDuplicate={(id) => console.log('Duplicate', id)}
  onExport={(id) => console.log('Export', id)}
  onShare={(id) => console.log('Share', id)}
/>
```

---

### PlayCard

**Import:** `import { PlayCard } from '@/components/playbook-editor/PlayCard'`

**Usage:**
```tsx
import { PlayCard } from '@/components/playbook-editor/PlayCard'

<PlayCard
  id="play-1"
  name="PA Boot Right"
  formation="Shotgun"
  playType="Pass"
  defensiveFormation="Cover 2"
  tags={['Red Zone', 'Play Action']}
  lastModified="2 hours ago"
  thumbnail="/play-thumbnail.png"
  selected={false}
  onSelect={(id) => console.log('Select', id)}
  onOpen={(id) => console.log('Open', id)}
  onRename={(id) => console.log('Rename', id)}
  onDelete={(id) => console.log('Delete', id)}
  onDuplicate={(id) => console.log('Duplicate', id)}
/>
```

---

### TeamSelector

**Import:** `import { TeamSelector } from '@/components/playbook-manager/TeamSelector'`

**Usage:**
```tsx
import { TeamSelector } from '@/components/playbook-manager/TeamSelector'

<TeamSelector
  teams={[
    { id: 1, name: 'My Team', role: 'owner' },
    { id: 2, name: 'Shared Team', role: 'editor' },
  ]}
  currentTeamId={1}
  onSwitchTeam={(teamId) => console.log('Switch to', teamId)}
  onManageTeams={() => console.log('Manage teams')}
/>
```

---

## Composition Patterns

### Extending Components

Add custom props while preserving base component functionality:

```tsx
import { Button, type ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type LoadingButtonProps = ButtonProps & {
  loading?: boolean
}

function LoadingButton({ loading, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  )
}
```

---

### Combining Primitives

Build complex patterns from simple components:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function EditDialog({ isOpen, onClose, onSave }: EditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)}>
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Save</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Creating Custom Variants

Use CVA to define new variant patterns:

```tsx
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-xl border p-4 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-card border-border',
        interactive: 'bg-card border-border hover:bg-accent cursor-pointer',
        highlighted: 'bg-accent border-primary',
      },
      size: {
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type CardProps = {
  variant?: 'default' | 'interactive' | 'highlighted'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children: React.ReactNode
}

function Card({ variant, size, className, children }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, size }), className)}>
      {children}
    </div>
  )
}
```

---

## Related Documentation

- [Style Guide](./STYLE_GUIDE.md) - Comprehensive styling reference
- [SQL Guidelines](./SQLGuideline.md) - Database patterns
