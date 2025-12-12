# Sidebar, NavigationMenu & Menubar Components

Advanced navigation components for app layouts and menubars.

---

## Components in this Document

- [Sidebar](#sidebar) - Collapsible sidebar navigation
- [NavigationMenu](#navigationmenu) - Horizontal navigation with dropdowns
- [Menubar](#menubar) - Desktop-style menubar

---

## Sidebar

Collapsible sidebar navigation for application layouts.

### Import

```tsx
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
```

### Basic Usage

```tsx
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

function AppWithSidebar() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <div className="p-4">
            <h2 className="mb-4 text-lg font-semibold">Navigation</h2>
            <nav className="space-y-2">
              <a href="/" className="block rounded-md px-3 py-2 hover:bg-accent">
                Home
              </a>
              <a href="/dashboard" className="block rounded-md px-3 py-2 hover:bg-accent">
                Dashboard
              </a>
              <a href="/settings" className="block rounded-md px-3 py-2 hover:bg-accent">
                Settings
              </a>
            </nav>
          </div>
        </Sidebar>
        <main className="flex-1">
          <div className="border-b p-4">
            <SidebarTrigger />
          </div>
          <div className="p-4">
            {/* Main content */}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
```

---

## NavigationMenu

Horizontal navigation menu with dropdown submenus.

### Import

```tsx
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
```

### Basic Usage

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

function BasicNavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
              <li>
                <NavigationMenuLink asChild>
                  <a href="/products/all" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent">
                    <div className="text-sm font-medium leading-none">All Products</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Browse our full catalog
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

---

## Menubar

Desktop-style menubar with dropdown menus.

### Import

```tsx
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from '@/components/ui/menubar'
```

### Basic Usage

```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'

function BasicMenubar() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            New Window <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Share</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Print</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Cut</MenubarItem>
          <MenubarItem>Copy</MenubarItem>
          <MenubarItem>Paste</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
```

---

## See Also

- [Menus](../overlay/menus.md) - Dropdown and context menus
- [Tabs](./tabs.md) - Tab navigation
- [ScrollArea](../layout/containers.md#scrollarea) - Scrollable sidebar content
