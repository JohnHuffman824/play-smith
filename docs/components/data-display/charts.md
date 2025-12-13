# Chart Component

Themed chart wrappers for Recharts library.

---

## Import

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
```

---

## Overview

The PlaySmith chart components provide themed wrappers for [Recharts](https://recharts.org/). They automatically apply your design system's colors and styling.

---

## Basic Usage

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'

function BasicChart() {
  const data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
  ]

  const chartConfig = {
    value: {
      label: 'Revenue',
      color: 'hsl(var(--chart-1))',
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" fill="var(--color-value)" />
        <ChartTooltip content={<ChartTooltipContent />} />
      </BarChart>
    </ChartContainer>
  )
}
```

---

## Chart Colors

Use CSS variables for consistent theming:

- `--chart-1` through `--chart-5` for different data series
- Colors automatically adapt to light/dark mode

---

## See Also

- [Cards](../layout/cards.md) - Wrap charts in cards
- [Badges](./badges.md) - Badge components for chart legends
- [Recharts Documentation](https://recharts.org/) - Full chart library docs
