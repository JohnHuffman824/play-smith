# Container Components

Layout components for managing scrolling, aspect ratios, and resizable panels.

---

## Components in this Document

- [ScrollArea](#scrollarea) - Custom scrollable container
- [AspectRatio](#aspectratio) - Maintain aspect ratio
- [Resizable](#resizable) - Resizable panel groups

---

## ScrollArea

Custom scrollable container with styled scrollbars.

### Import

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'
```

### Basic Usage

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

function ScrollAreaExample() {
  return (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div className="space-y-4">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="text-sm">
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
```

### Horizontal Scroll

```tsx
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

function HorizontalScroll() {
  return (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-[250px] w-[250px] rounded-md bg-muted"
          >
            Item {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
```

### Both Directions

```tsx
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

function BothDirections() {
  return (
    <ScrollArea className="h-[300px] w-[300px] rounded-md border">
      <div className="p-4">
        <table>
          <tbody>
            {Array.from({ length: 50 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <td key={j} className="border px-4 py-2">
                    Cell {i},{j}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}
```

### Scrollable Sidebar

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

function SidebarNav() {
  const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`)

  return (
    <ScrollArea className="h-screen w-64 border-r">
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Navigation</h2>
        <nav className="space-y-2">
          {items.map((item) => (
            <a
              key={item}
              href="#"
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </ScrollArea>
  )
}
```

---

## AspectRatio

Maintain consistent aspect ratio for responsive images and videos.

### Import

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'
```

### Basic Usage

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'

function AspectRatioExample() {
  return (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9}>
        <img
          src="/image.jpg"
          alt="Image"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>
    </div>
  )
}
```

### Common Ratios

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'

function CommonRatios() {
  return (
    <div className="space-y-4">
      {/* 16:9 - Widescreen */}
      <AspectRatio ratio={16 / 9}>
        <img src="/widescreen.jpg" alt="16:9" className="rounded-md object-cover" />
      </AspectRatio>

      {/* 4:3 - Standard */}
      <AspectRatio ratio={4 / 3}>
        <img src="/standard.jpg" alt="4:3" className="rounded-md object-cover" />
      </AspectRatio>

      {/* 1:1 - Square */}
      <AspectRatio ratio={1}>
        <img src="/square.jpg" alt="1:1" className="rounded-md object-cover" />
      </AspectRatio>

      {/* 21:9 - Ultrawide */}
      <AspectRatio ratio={21 / 9}>
        <img src="/ultrawide.jpg" alt="21:9" className="rounded-md object-cover" />
      </AspectRatio>
    </div>
  )
}
```

### Video Player

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'

function VideoPlayer() {
  return (
    <AspectRatio ratio={16 / 9} className="bg-muted">
      <iframe
        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full rounded-md"
      />
    </AspectRatio>
  )
}
```

### Image Grid

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'

function ImageGrid() {
  const images = [
    '/image1.jpg',
    '/image2.jpg',
    '/image3.jpg',
    '/image4.jpg',
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((src, i) => (
        <AspectRatio key={i} ratio={1}>
          <img
            src={src}
            alt={`Image ${i + 1}`}
            className="h-full w-full rounded-md object-cover"
          />
        </AspectRatio>
      ))}
    </div>
  )
}
```

---

## Resizable

Resizable panel groups with draggable handles.

### Import

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
```

### Horizontal Layout

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

function HorizontalResizable() {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[200px] rounded-lg border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Panel One</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Panel Two</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Vertical Layout

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

function VerticalResizable() {
  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[400px] rounded-lg border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Top Panel</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Bottom Panel</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Three Panels

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

function ThreePanel() {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[200px] rounded-lg border">
      <ResizablePanel defaultSize={25} minSize={20}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Main Content</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={25} minSize={20}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Details</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Nested Panels

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

function NestedPanels() {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[400px] rounded-lg border">
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Editor</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Terminal</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### With Handle Indicator

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

function ResizableWithHandle() {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[200px] rounded-lg border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Left</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Right</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Key Props

#### ResizablePanelGroup

| Prop | Type | Description |
|------|------|-------------|
| `direction` | `'horizontal' \| 'vertical'` | Layout direction |
| `className` | `string` | Additional CSS classes |

#### ResizablePanel

| Prop | Type | Description |
|------|------|-------------|
| `defaultSize` | `number` | Initial size (percentage) |
| `minSize` | `number` | Minimum size (percentage) |
| `maxSize` | `number` | Maximum size (percentage) |
| `collapsible` | `boolean` | Whether panel can collapse |

#### ResizableHandle

| Prop | Type | Description |
|------|------|-------------|
| `withHandle` | `boolean` | Show drag handle indicator |

---

## Common Patterns

### Code Editor Layout

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'

function CodeEditorLayout() {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      <ResizablePanel defaultSize={20} minSize={15}>
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* File tree */}
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70}>
            {/* Code editor */}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <ScrollArea className="h-full">
              {/* Terminal */}
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={20} minSize={15}>
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* Properties panel */}
          </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Image Gallery

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ScrollArea } from '@/components/ui/scroll-area'

function ImageGallery() {
  const images = Array.from({ length: 12 }, (_, i) => `/image${i + 1}.jpg`)

  return (
    <ScrollArea className="h-[600px]">
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <AspectRatio ratio={1}>
              <img
                src={src}
                alt={`Image ${i + 1}`}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </AspectRatio>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
```

---

## See Also

- [Cards](./cards.md) - Card and Separator components
- [Carousel](./carousel.md) - Carousel component
- [Tabs](../navigation/tabs.md) - Tab navigation
- [Sidebars](../navigation/sidebars.md) - Sidebar navigation
