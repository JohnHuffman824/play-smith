# Avatar & Skeleton Components

Components for displaying user images and loading placeholders.

---

## Components in this Document

- [Avatar](#avatar) - User profile image
- [Skeleton](#skeleton) - Loading placeholder

---

## Avatar

Display user profile images with fallback support.

### Import

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
```

### Basic Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function BasicAvatar() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
```

### Size Variations

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function AvatarSizes() {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatar.jpg" />
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar className="h-10 w-10">
        <AvatarImage src="/avatar.jpg" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarImage src="/avatar.jpg" />
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  )
}
```

### Avatar Group

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function AvatarGroup() {
  return (
    <div className="flex -space-x-4">
      <Avatar className="border-2 border-background">
        <AvatarImage src="/avatar1.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="/avatar2.jpg" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="/avatar3.jpg" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    </div>
  )
}
```

---

## Skeleton

Loading placeholder for content.

### Import

```tsx
import { Skeleton } from '@/components/ui/skeleton'
```

### Basic Usage

```tsx
import { Skeleton } from '@/components/ui/skeleton'

function BasicSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  )
}
```

### Card Skeleton

```tsx
import { Skeleton } from '@/components/ui/skeleton'

function CardSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
```

---

## See Also

- [Badges](./badges.md) - Badge, Alert, Progress components
- [Tables](./tables.md) - Table component
- [Cards](../layout/cards.md) - Card layouts
