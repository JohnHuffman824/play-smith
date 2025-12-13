# Carousel Component

Image and content carousel with navigation controls.

---

## Import

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
```

---

## Basic Usage

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

function BasicCarousel() {
  return (
    <Carousel className="w-full max-w-xs">
      <CarouselContent>
        <CarouselItem>
          <div className="p-1">
            <div className="flex aspect-square items-center justify-center p-6">
              <span className="text-4xl font-semibold">1</span>
            </div>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div className="p-1">
            <div className="flex aspect-square items-center justify-center p-6">
              <span className="text-4xl font-semibold">2</span>
            </div>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div className="p-1">
            <div className="flex aspect-square items-center justify-center p-6">
              <span className="text-4xl font-semibold">3</span>
            </div>
          </div>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

---

## Image Carousel

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

function ImageCarousel() {
  const images = [
    '/image1.jpg',
    '/image2.jpg',
    '/image3.jpg',
    '/image4.jpg',
  ]

  return (
    <Carousel className="w-full max-w-xl">
      <CarouselContent>
        {images.map((src, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <img
                src={src}
                alt={`Slide ${index + 1}`}
                className="aspect-video w-full rounded-lg object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

---

## Multiple Items Per View

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'

function MultipleItemsCarousel() {
  return (
    <Carousel className="w-full max-w-sm">
      <CarouselContent className="-ml-1">
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-2xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

---

## Product Showcase

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function ProductCarousel() {
  const products = [
    { name: 'Product 1', price: '$29.99', image: '/product1.jpg', badge: 'New' },
    { name: 'Product 2', price: '$39.99', image: '/product2.jpg', badge: 'Sale' },
    { name: 'Product 3', price: '$49.99', image: '/product3.jpg', badge: 'Hot' },
  ]

  return (
    <Carousel className="w-full max-w-5xl">
      <CarouselContent>
        {products.map((product, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="aspect-square w-full rounded-t-lg object-cover"
                    />
                    <Badge className="absolute right-2 top-2">
                      {product.badge}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-lg font-bold text-primary">
                      {product.price}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

---

## Vertical Carousel

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

function VerticalCarousel() {
  return (
    <Carousel
      opts={{
        align: 'start',
      }}
      orientation="vertical"
      className="w-full max-w-xs"
    >
      <CarouselContent className="-mt-1 h-[200px]">
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="pt-1 md:basis-1/2">
            <div className="p-1">
              <div className="flex items-center justify-center rounded-lg border p-6">
                <span className="text-3xl font-semibold">{index + 1}</span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

---

## Auto-play Carousel

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useRef } from 'react'

function AutoplayCarousel() {
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-xs"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <div className="flex aspect-square items-center justify-center p-6">
                <span className="text-4xl font-semibold">{index + 1}</span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

---

## With API State

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useState, useEffect } from 'react'

function CarouselWithApi() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <div>
      <Carousel setApi={setApi} className="w-full max-w-xs">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="flex aspect-square items-center justify-center p-6">
                <span className="text-4xl font-semibold">{index + 1}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="py-2 text-center text-sm text-muted-foreground">
        Slide {current} of {count}
      </div>
    </div>
  )
}
```

---

## Testimonials Carousel

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

function TestimonialsCarousel() {
  const testimonials = [
    {
      name: 'John Doe',
      role: 'CEO, Company',
      avatar: '/avatar1.jpg',
      quote: 'This product has transformed our workflow.',
    },
    {
      name: 'Jane Smith',
      role: 'Designer, Agency',
      avatar: '/avatar2.jpg',
      quote: 'Absolutely love the attention to detail.',
    },
    {
      name: 'Bob Johnson',
      role: 'Developer, Startup',
      avatar: '/avatar3.jpg',
      quote: 'Best tool I have used in years.',
    },
  ]

  return (
    <Carousel className="w-full max-w-2xl">
      <CarouselContent>
        {testimonials.map((testimonial, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <blockquote className="text-lg italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

---

## Configuration Options

The Carousel component uses Embla Carousel under the hood. You can pass options via the `opts` prop:

```tsx
<Carousel
  opts={{
    align: 'start',      // 'start' | 'center' | 'end'
    loop: true,          // Enable infinite loop
    skipSnaps: false,    // Allow free scrolling between snaps
    dragFree: false,     // Enable free-drag scrolling
  }}
>
  {/* ... */}
</Carousel>
```

---

## Key Props

### Carousel

| Prop | Type | Description |
|------|------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | Carousel direction (default: horizontal) |
| `opts` | `EmblaOptionsType` | Embla Carousel options |
| `plugins` | `EmblaPluginType[]` | Embla plugins (e.g., Autoplay) |
| `setApi` | `(api: CarouselApi) => void` | Get carousel API instance |

### CarouselItem

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS classes (use basis-* for sizing) |

---

## Plugins

### Autoplay

Install: `npm install embla-carousel-autoplay`

```tsx
import Autoplay from 'embla-carousel-autoplay'

<Carousel plugins={[Autoplay({ delay: 2000 })]}>
  {/* ... */}
</Carousel>
```

### Class Names

Install: `npm install embla-carousel-class-names`

```tsx
import ClassNames from 'embla-carousel-class-names'

<Carousel plugins={[ClassNames()]}>
  {/* ... */}
</Carousel>
```

---

## Accessibility

- Previous/Next buttons are keyboard accessible
- Supports swipe gestures on touch devices
- Drag to scroll on desktop
- Proper ARIA labels on navigation buttons

---

## See Also

- [Cards](./cards.md) - Card component for carousel items
- [AspectRatio](./containers.md#aspectratio) - Maintain aspect ratios
- [Badges](../data-display/badges.md) - Badge component for labels
- [Avatars](../data-display/avatars.md) - Avatar component for testimonials
