# Pagination Component

Navigate through pages of content with page numbers and controls.

---

## Import

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
```

---

## Basic Usage

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

function BasicPagination() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

---

## With Ellipsis

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

function PaginationWithEllipsis() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">5</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            6
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">7</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">20</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

---

## Controlled Pagination

```tsx
import { useState } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

function ControlledPagination() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 10

  return (
    <div className="space-y-4">
      <p>Current Page: {currentPage}</p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
```

---

## Smart Pagination with Ellipsis

```tsx
import { useState } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

function SmartPagination({ totalPages = 20 }: { totalPages?: number }) {
  const [currentPage, setCurrentPage] = useState(1)

  const renderPageNumbers = () => {
    const pages = []
    const showEllipsisThreshold = 7

    if (totalPages <= showEllipsisThreshold) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // Always show first page
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        pages.push(<PaginationItem key="ellipsis-1"><PaginationEllipsis /></PaginationItem>)
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        pages.push(<PaginationItem key="ellipsis-2"><PaginationEllipsis /></PaginationItem>)
      }

      // Always show last page
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return pages
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem>
          <PaginationNext
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

---

## With Page Info

```tsx
import { useState } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

function PaginationWithInfo() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalItems = 95
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => setCurrentPage(1)}
              isActive={currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => setCurrentPage(2)}
              isActive={currentPage === 2}
            >
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => setCurrentPage(3)}
              isActive={currentPage === 3}
            >
              3
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
```

---

## Key Props

### PaginationLink

| Prop | Type | Description |
|------|------|-------------|
| `isActive` | `boolean` | Whether this page is currently active |
| `href` | `string` | Link URL (optional if using onClick) |
| `onClick` | `() => void` | Click handler for controlled pagination |

### PaginationPrevious / PaginationNext

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | Link URL (optional if using onClick) |
| `onClick` | `() => void` | Click handler |

---

## Common Patterns

### Table Pagination

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function PaginatedTable() {
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const data = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }))

  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )
  const totalPages = Math.ceil(data.length / itemsPerPage)

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, page - 1))}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => setPage(i + 1)}
                isActive={page === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
```

---

## Accessibility

- Proper ARIA labels for previous/next buttons
- Keyboard navigation supported
- Current page is visually distinct
- Disabled states for first/last pages

---

## See Also

- [Tables](../data-display/tables.md) - Table component for paginated data
- [Tabs](./tabs.md) - Tab navigation
- [Buttons](../foundational/buttons.md) - Button components
