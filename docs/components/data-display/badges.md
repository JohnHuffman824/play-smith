# Badge, Alert & Progress Components

Components for displaying status, notifications, and progress indicators.

---

## Components in this Document

- [Badge](#badge) - Small status indicator
- [Alert](#alert) - Notification banner
- [Progress](#progress) - Progress bar

---

## Badge

Small component for displaying status, categories, or counts.

### Import

```tsx
import { Badge } from '@/components/ui/badge'
```

### Variants

```tsx
import { Badge } from '@/components/ui/badge'

function BadgeVariants() {
  return (
    <div className="flex gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  )
}
```

### Usage Examples

```tsx
import { Badge } from '@/components/ui/badge'

function BadgeExamples() {
  return (
    <div className="space-y-2">
      {/* Status badge */}
      <div>
        Status: <Badge variant="secondary">Active</Badge>
      </div>

      {/* Count badge */}
      <div>
        Notifications <Badge>3</Badge>
      </div>

      {/* Category tags */}
      <div className="flex gap-2">
        <Badge variant="outline">React</Badge>
        <Badge variant="outline">TypeScript</Badge>
        <Badge variant="outline">Tailwind</Badge>
      </div>
    </div>
  )
}
```

---

## Alert

Notification or feedback message banner.

### Import

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
```

### Variants

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Terminal } from 'lucide-react'

function AlertVariants() {
  return (
    <div className="space-y-4">
      {/* Default alert */}
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components to your app using the CLI.
        </AlertDescription>
      </Alert>

      {/* Destructive alert */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Your session has expired. Please log in again.
        </AlertDescription>
      </Alert>
    </div>
  )
}
```

---

## Progress

Display task completion or loading progress.

### Import

```tsx
import { Progress } from '@/components/ui/progress'
```

### Basic Usage

```tsx
import { Progress } from '@/components/ui/progress'

function BasicProgress() {
  return (
    <div className="space-y-4">
      <Progress value={33} />
      <Progress value={66} />
      <Progress value={100} />
    </div>
  )
}
```

### With Label

```tsx
import { Progress } from '@/components/ui/progress'
import { useState, useEffect } from 'react'

function ProgressWithLabel() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) return 0
        return old + 10
      })
    }, 500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  )
}
```

---

## See Also

- [Avatars](./avatars.md) - Avatar and Skeleton components
- [Tables](./tables.md) - Table component
- [Cards](../layout/cards.md) - Card layouts
