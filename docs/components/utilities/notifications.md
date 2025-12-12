# Sonner (Toast Notifications)

Toast notification system using Sonner library.

---

## Import

```tsx
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
```

---

## Setup

Add the Toaster component to your root layout:

```tsx
// app/layout.tsx or _app.tsx
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

---

## Basic Usage

```tsx
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function BasicToast() {
  return (
    <Button onClick={() => toast('Event has been created')}>
      Show Toast
    </Button>
  )
}
```

---

## Toast Types

```tsx
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function ToastTypes() {
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast.success('Event created')}>
        Success
      </Button>
      <Button onClick={() => toast.error('Something went wrong')}>
        Error
      </Button>
      <Button onClick={() => toast.info('New update available')}>
        Info
      </Button>
      <Button onClick={() => toast.warning('Please review')}>
        Warning
      </Button>
    </div>
  )
}
```

---

## With Description

```tsx
import { toast } from 'sonner'

toast('Event has been created', {
  description: 'Sunday, December 03, 2023 at 9:00 AM',
})
```

---

## With Action

```tsx
import { toast } from 'sonner'

toast('Event has been created', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
})
```

---

## Loading Toast

```tsx
import { toast } from 'sonner'

// Show loading
const toastId = toast.loading('Loading...')

// Update to success
setTimeout(() => {
  toast.success('Done!', { id: toastId })
}, 2000)
```

---

## Promise Toast

```tsx
import { toast } from 'sonner'

const promise = () => new Promise((resolve) => setTimeout(resolve, 2000))

toast.promise(promise, {
  loading: 'Loading...',
  success: 'Success!',
  error: 'Error',
})
```

---

## Custom Duration

```tsx
import { toast } from 'sonner'

toast('This will stay for 10 seconds', {
  duration: 10000,
})
```

---

## Toaster Configuration

```tsx
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      {/* Your app */}
      <Toaster
        position="top-center"
        richColors
        closeButton
      />
    </>
  )
}
```

### Toaster Props

| Prop | Type | Description |
|------|------|-------------|
| `position` | `string` | Toast position |
| `richColors` | `boolean` | Use colored backgrounds |
| `closeButton` | `boolean` | Show close button |
| `duration` | `number` | Default duration (ms) |

---

## See Also

- [Buttons](../foundational/buttons.md) - Trigger buttons
- [Dialogs](../overlay/dialogs.md) - Modal notifications
- [Alerts](../data-display/badges.md#alert) - Static alert messages
- [Sonner Documentation](https://sonner.emilkowal.ski/) - Full library docs
