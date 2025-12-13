# Card & Separator Components

Layout components for content organization and visual separation.

---

## Components in this Document

- [Card](#card) - Content container with header, content, and footer
- [Separator](#separator) - Visual divider line

---

## Card

Flexible content container with distinct sections for headers, content, and footers.

### Import

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
```

### Basic Usage

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function BasicCard() {
  return (
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
  )
}
```

### Card without Header

```tsx
import { Card, CardContent } from '@/components/ui/card'

function SimpleCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p>Simple card with just content</p>
      </CardContent>
    </Card>
  )
}
```

### Card without Footer

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function CardNoFooter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">$45,231.89</div>
        <p className="text-xs text-muted-foreground">
          +20.1% from last month
        </p>
      </CardContent>
    </Card>
  )
}
```

### Interactive Card

```tsx
import { Card, CardContent } from '@/components/ui/card'

function InteractiveCard() {
  return (
    <Card className="cursor-pointer transition-colors hover:bg-accent">
      <CardContent className="p-6">
        <p>Click me!</p>
      </CardContent>
    </Card>
  )
}
```

### Card Grid Layout

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function CardGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
        </CardHeader>
        <CardContent>Content 1</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
        </CardHeader>
        <CardContent>Content 2</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
        </CardHeader>
        <CardContent>Content 3</CardContent>
      </Card>
    </div>
  )
}
```

### Styling

Default styles:
- Border: `border-border`
- Background: `bg-card`
- Text color: `text-card-foreground`
- Border radius: `rounded-xl`
- Shadow: `shadow-sm`

### Component Structure

| Component | Purpose |
|-----------|---------|
| `Card` | Root container |
| `CardHeader` | Top section for title and description |
| `CardTitle` | Main heading |
| `CardDescription` | Subtitle or description text |
| `CardContent` | Main content area |
| `CardFooter` | Bottom section for actions |

---

## Separator

Visual divider for separating content sections.

### Import

```tsx
import { Separator } from '@/components/ui/separator'
```

### Horizontal Separator

```tsx
import { Separator } from '@/components/ui/separator'

function HorizontalSeparator() {
  return (
    <div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Section 1</h4>
        <p className="text-sm text-muted-foreground">Content above</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Section 2</h4>
        <p className="text-sm text-muted-foreground">Content below</p>
      </div>
    </div>
  )
}
```

### Vertical Separator

```tsx
import { Separator } from '@/components/ui/separator'

function VerticalSeparator() {
  return (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>Item 1</div>
      <Separator orientation="vertical" />
      <div>Item 2</div>
      <Separator orientation="vertical" />
      <div>Item 3</div>
    </div>
  )
}
```

### In Navigation

```tsx
import { Separator } from '@/components/ui/separator'

function Navigation() {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <a href="#">Home</a>
      <Separator orientation="vertical" className="h-4" />
      <a href="#">About</a>
      <Separator orientation="vertical" className="h-4" />
      <a href="#">Contact</a>
    </nav>
  )
}
```

### Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Separator direction |
| `decorative` | `boolean` | `true` | Whether separator is decorative (affects accessibility) |

---

## Common Patterns

### Dashboard Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'

function DashboardCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">$45,231.89</div>
        <p className="text-xs text-muted-foreground">
          +20.1% from last month
        </p>
      </CardContent>
    </Card>
  )
}
```

### Form in Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function FormCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to create a new account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  )
}
```

### Card with Tabs

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

function TabbedCard() {
  return (
    <Card>
      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b px-6 pt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
        </div>
        <CardContent className="pt-6">
          <TabsContent value="overview">Overview content</TabsContent>
          <TabsContent value="analytics">Analytics content</TabsContent>
          <TabsContent value="reports">Reports content</TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
```

### Settings Sections with Separators

```tsx
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

function SettingsSections() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile information.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="public">Public Profile</Label>
          <Switch id="public" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="searchable">Searchable</Label>
          <Switch id="searchable" />
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email">Email Notifications</Label>
          <Switch id="email" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push">Push Notifications</Label>
          <Switch id="push" />
        </div>
      </div>
    </div>
  )
}
```

### List with Separators

```tsx
import { Separator } from '@/components/ui/separator'

function ItemList() {
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4']

  return (
    <div>
      {items.map((item, index) => (
        <div key={item}>
          <div className="py-4">
            <h4 className="font-medium">{item}</h4>
            <p className="text-sm text-muted-foreground">
              Description for {item}
            </p>
          </div>
          {index < items.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}
```

---

## See Also

- [Containers](./containers.md) - ScrollArea, AspectRatio, Resizable
- [Carousel](./carousel.md) - Carousel component
- [Tabs](../navigation/tabs.md) - Tab navigation within cards
- [Buttons](../foundational/buttons.md) - Action buttons for card footers
