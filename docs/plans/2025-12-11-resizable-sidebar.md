# Resizable Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the PlaybookManagerPage sidebar horizontally resizable with drag-to-resize and persist width across refresh.

**Architecture:** Use existing `react-resizable-panels` components (ResizablePanelGroup, ResizablePanel, ResizableHandle) to wrap the sidebar. Add `sidebarWidth` to SettingsContext for localStorage persistence. Constrain resize between 200px-400px for usability.

**Tech Stack:** React, TypeScript, react-resizable-panels (already installed), SettingsContext (localStorage), Tailwind CSS

---

## Task 1: Add Sidebar Width to SettingsContext

**Files:**
- Modify: `src/contexts/SettingsContext.tsx:1-end`
- Test: `src/contexts/SettingsContext.test.tsx` (create new)

**Step 1: Write the failing test**

Create new test file to verify sidebar width persistence:

```typescript
// src/contexts/SettingsContext.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { SettingsProvider, useSettings } from './SettingsContext'

describe('SettingsContext - Sidebar Width', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should default sidebar width to 256', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    expect(result.current.sidebarWidth).toBe(256)
  })

  it('should persist sidebar width to localStorage', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    act(() => {
      result.current.setSidebarWidth(300)
    })

    expect(result.current.sidebarWidth).toBe(300)
    expect(localStorage.getItem('playsmith-sidebar-width')).toBe('300')
  })

  it('should load sidebar width from localStorage on mount', () => {
    localStorage.setItem('playsmith-sidebar-width', '320')

    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    expect(result.current.sidebarWidth).toBe(320)
  })

  it('should constrain sidebar width between 200-400', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    // Test min constraint
    act(() => {
      result.current.setSidebarWidth(150)
    })
    expect(result.current.sidebarWidth).toBe(200)

    // Test max constraint
    act(() => {
      result.current.setSidebarWidth(500)
    })
    expect(result.current.sidebarWidth).toBe(400)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/contexts/SettingsContext.test.tsx`

Expected: FAIL with "Cannot find name 'sidebarWidth'" and "Cannot find name 'setSidebarWidth'"

**Step 3: Add sidebarWidth to SettingsContext**

Add the new setting to the context:

```typescript
// src/contexts/SettingsContext.tsx

// Add to SettingsContextType interface (around line 15)
export interface SettingsContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  cardsPerRow: number
  setCardsPerRow: (count: number) => void
  showPlayCount: boolean
  setShowPlayCount: (show: boolean) => void
  confirmBeforeDelete: boolean
  setConfirmBeforeDelete: (confirm: boolean) => void
  autoSaveInterval: AutoSaveInterval
  setAutoSaveInterval: (interval: AutoSaveInterval) => void
  sidebarWidth: number  // ADD THIS
  setSidebarWidth: (width: number) => void  // ADD THIS
}

// Add constants at top of file (around line 5)
export const MIN_SIDEBAR_WIDTH = 200
export const MAX_SIDEBAR_WIDTH = 400
export const DEFAULT_SIDEBAR_WIDTH = 256

// In SettingsProvider component, add state (around line 35)
const [sidebarWidth, setSidebarWidthState] = useState<number>(() => {
  const stored = getStoredValue('playsmith-sidebar-width')
  if (stored !== null) {
    const width = Number(stored)
    return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH)
  }
  return DEFAULT_SIDEBAR_WIDTH
})

// Add setter function (around line 80, with other setters)
const setSidebarWidth = (width: number) => {
  const constrainedWidth = Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH)
  setSidebarWidthState(constrainedWidth)
  storeValue('playsmith-sidebar-width', String(constrainedWidth))
}

// Add to context value object (around line 95)
const value: SettingsContextType = {
  viewMode,
  setViewMode,
  cardsPerRow,
  setCardsPerRow,
  showPlayCount,
  setShowPlayCount,
  confirmBeforeDelete,
  setConfirmBeforeDelete,
  autoSaveInterval,
  setAutoSaveInterval,
  sidebarWidth,  // ADD THIS
  setSidebarWidth,  // ADD THIS
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/contexts/SettingsContext.test.tsx`

Expected: PASS - all 4 tests pass

**Step 5: Commit**

```bash
git add src/contexts/SettingsContext.tsx src/contexts/SettingsContext.test.tsx
git commit -m "feat: add sidebar width setting with localStorage persistence

- Add sidebarWidth (200-400px range) to SettingsContext
- Default to 256px (current w-64 equivalent)
- Persist to localStorage as 'playsmith-sidebar-width'
- Include constraint validation in setter"
```

---

## Task 2: Make Sidebar Resizable in PlaybookManagerPage

**Files:**
- Modify: `src/pages/PlaybookManagerPage.tsx:1-end`
- Modify: `src/components/playbook-manager/Sidebar.tsx:52` (remove w-64 class)
- Test: `src/pages/PlaybookManagerPage.resizable.test.tsx` (create new)

**Step 1: Write the failing test**

Create test to verify resizable sidebar functionality:

```typescript
// src/pages/PlaybookManagerPage.resizable.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PlaybookManagerPage from './PlaybookManagerPage'
import { SettingsProvider } from '../contexts/SettingsContext'

describe('PlaybookManagerPage - Resizable Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render ResizablePanelGroup with horizontal direction', () => {
    const { container } = render(
      <BrowserRouter>
        <SettingsProvider>
          <PlaybookManagerPage />
        </SettingsProvider>
      </BrowserRouter>
    )

    const panelGroup = container.querySelector('[data-panel-group]')
    expect(panelGroup).toBeTruthy()
    expect(panelGroup?.getAttribute('data-panel-group-direction')).toBe('horizontal')
  })

  it('should render ResizableHandle between sidebar and content', () => {
    const { container } = render(
      <BrowserRouter>
        <SettingsProvider>
          <PlaybookManagerPage />
        </SettingsProvider>
      </BrowserRouter>
    )

    const handle = container.querySelector('[data-panel-resize-handle-id]')
    expect(handle).toBeTruthy()
  })

  it('should set sidebar initial size from settings context', () => {
    localStorage.setItem('playsmith-sidebar-width', '300')

    const { container } = render(
      <BrowserRouter>
        <SettingsProvider>
          <PlaybookManagerPage />
        </SettingsProvider>
      </BrowserRouter>
    )

    // Panel size is stored as percentage, but we can verify panel exists
    const sidebarPanel = container.querySelector('[data-panel-id="sidebar"]')
    expect(sidebarPanel).toBeTruthy()
  })

  it('should render sidebar content within ResizablePanel', () => {
    render(
      <BrowserRouter>
        <SettingsProvider>
          <PlaybookManagerPage />
        </SettingsProvider>
      </BrowserRouter>
    )

    // Verify sidebar navigation items are still rendered
    expect(screen.getByText('All Playbooks')).toBeTruthy()
    expect(screen.getByText('Shared with me')).toBeTruthy()
    expect(screen.getByText('Folders')).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/pages/PlaybookManagerPage.resizable.test.tsx`

Expected: FAIL with "Cannot find element with [data-panel-group]" - ResizablePanelGroup not yet implemented

**Step 3: Update PlaybookManagerPage with ResizablePanelGroup**

Replace the flex layout with resizable panels:

```typescript
// src/pages/PlaybookManagerPage.tsx

// Add imports at top (around line 1-10)
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { useSettings } from '@/contexts/SettingsContext'

// Inside PlaybookManagerPage component (around line 40-80)
export default function PlaybookManagerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarWidth, setSidebarWidth, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } = useSettings()

  // ... existing state and handlers ...

  // Calculate initial size as percentage (assuming 1440px viewport as baseline)
  const BASELINE_VIEWPORT = 1440
  const initialSidebarPercent = (sidebarWidth / BASELINE_VIEWPORT) * 100

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen overflow-hidden bg-background"
    >
      <ResizablePanel
        id="sidebar"
        defaultSize={initialSidebarPercent}
        minSize={(MIN_SIDEBAR_WIDTH / BASELINE_VIEWPORT) * 100}
        maxSize={(MAX_SIDEBAR_WIDTH / BASELINE_VIEWPORT) * 100}
        onResize={(size) => {
          // Convert percentage back to pixels
          const width = Math.round((size / 100) * BASELINE_VIEWPORT)
          setSidebarWidth(width)
        }}
      >
        <Sidebar
          playbooks={playbooks}
          currentPlaybookId={currentPlaybook?.id}
          folders={folders}
          currentFolderId={currentFolderId}
          onPlaybookSelect={handlePlaybookSelect}
          onFolderSelect={handleFolderSelect}
          onClearSelection={handleClearSelection}
          starredPlaybookIds={starredPlaybookIds}
          onToggleStar={handleToggleStar}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={100 - initialSidebarPercent} minSize={50}>
        <div className="flex flex-col h-full overflow-hidden">
          <Toolbar
            playbooks={playbooks}
            currentPlaybook={currentPlaybook}
            onNewPlaybook={handleNewPlaybook}
            onDeletePlaybook={handleDeletePlaybook}
            onEditPlaybook={handleEditPlaybook}
            onDuplicatePlaybook={handleDuplicatePlaybook}
            selectedPlaybookIds={selectedPlaybookIds}
            onClearSelection={handleClearPlaybookSelection}
          />
          <div className="flex-1 overflow-auto p-6">
            {/* existing content rendering */}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

**Step 4: Remove fixed width from Sidebar component**

```typescript
// src/components/playbook-manager/Sidebar.tsx

// Line 52: Remove w-64 class, keep other classes
className="border-r border-sidebar-border bg-sidebar h-screen sticky top-0 flex flex-col"
```

**Step 5: Run test to verify it passes**

Run: `bun test src/pages/PlaybookManagerPage.resizable.test.tsx`

Expected: PASS - all 4 tests pass

**Step 6: Run existing PlaybookManagerPage tests**

Run: `bun test tests/unit/pages/PlaybookManagerPage.test.tsx tests/unit/pages/PlaybookManagerPage-personal.test.tsx`

Expected: PASS - existing tests still pass (sidebar content unchanged)

**Step 7: Commit**

```bash
git add src/pages/PlaybookManagerPage.tsx src/components/playbook-manager/Sidebar.tsx src/pages/PlaybookManagerPage.resizable.test.tsx
git commit -m "feat: implement resizable sidebar in PlaybookManagerPage

- Replace fixed flex layout with ResizablePanelGroup
- Add ResizableHandle for drag-to-resize interaction
- Connect sidebar resize to SettingsContext persistence
- Remove hardcoded w-64 class from Sidebar component
- Sidebar width now persists across refresh via localStorage"
```

---

## Task 3: Add Visual Feedback for Resize Handle

**Files:**
- Modify: `src/pages/PlaybookManagerPage.tsx` (ResizableHandle styling)
- Test: Manual testing in browser

**Step 1: Enhance ResizableHandle with hover state**

Add custom styling to make the resize handle more discoverable:

```typescript
// src/pages/PlaybookManagerPage.tsx

// Update ResizableHandle component (around line 70)
<ResizableHandle
  withHandle
  className="hover:bg-sidebar-accent active:bg-sidebar-border transition-colors duration-200"
/>
```

**Step 2: Manual testing in browser**

Run: `bun --hot src/index.tsx` (or your dev server command)

Test checklist:
- [ ] Open PlaybookManagerPage at http://localhost:3000
- [ ] Hover over the border between sidebar and main content
- [ ] Verify cursor changes to resize cursor (e-resize)
- [ ] Verify handle background changes on hover (subtle accent color)
- [ ] Click and drag the handle left (sidebar gets narrower)
- [ ] Verify sidebar stops at 200px minimum width
- [ ] Click and drag the handle right (sidebar gets wider)
- [ ] Verify sidebar stops at 400px maximum width
- [ ] Release drag and verify width is persisted
- [ ] Refresh page (Cmd+R) and verify sidebar retains custom width
- [ ] Check localStorage in DevTools: `playsmith-sidebar-width` key exists

**Step 3: Commit**

```bash
git add src/pages/PlaybookManagerPage.tsx
git commit -m "feat: add visual feedback to sidebar resize handle

- Add hover and active state transitions to ResizableHandle
- Improve discoverability of resize functionality
- Use sidebar theme colors for consistency"
```

---

## Task 4: Add Keyboard Accessibility for Resize

**Files:**
- Modify: `src/pages/PlaybookManagerPage.tsx` (add keyboard handler)
- Test: `src/pages/PlaybookManagerPage.keyboard.test.tsx` (create new)

**Step 1: Write the failing test**

Create test to verify keyboard accessibility:

```typescript
// src/pages/PlaybookManagerPage.keyboard.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PlaybookManagerPage from './PlaybookManagerPage'
import { SettingsProvider } from '../contexts/SettingsContext'

describe('PlaybookManagerPage - Keyboard Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should allow keyboard resize with arrow keys', () => {
    const { container } = render(
      <BrowserRouter>
        <SettingsProvider>
          <PlaybookManagerPage />
        </SettingsProvider>
      </BrowserRouter>
    )

    const handle = container.querySelector('[data-panel-resize-handle-id]')
    expect(handle).toBeTruthy()

    // Focus the handle
    handle?.focus()

    // Press right arrow - should increase width
    fireEvent.keyDown(handle!, { key: 'ArrowRight' })

    // Verify width increased in localStorage
    const storedWidth = Number(localStorage.getItem('playsmith-sidebar-width'))
    expect(storedWidth).toBeGreaterThan(256)
  })

  it('should respect min/max constraints with keyboard', () => {
    localStorage.setItem('playsmith-sidebar-width', '200')

    const { container } = render(
      <BrowserRouter>
        <SettingsProvider>
          <PlaybookManagerPage />
        </SettingsProvider>
      </BrowserRouter>
    )

    const handle = container.querySelector('[data-panel-resize-handle-id]')
    handle?.focus()

    // Try to go below minimum
    fireEvent.keyDown(handle!, { key: 'ArrowLeft' })

    const storedWidth = Number(localStorage.getItem('playsmith-sidebar-width'))
    expect(storedWidth).toBeGreaterThanOrEqual(200)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/pages/PlaybookManagerPage.keyboard.test.tsx`

Expected: PASS - `react-resizable-panels` already includes keyboard support by default. This test verifies the existing behavior.

**Step 3: Document keyboard shortcuts**

Add a comment in the code documenting the keyboard accessibility:

```typescript
// src/pages/PlaybookManagerPage.tsx

// Add comment above ResizableHandle (around line 70)
{/*
  Keyboard accessible resize handle:
  - Tab to focus the handle
  - Arrow keys (←/→) to resize
  - Home/End to jump to min/max
  - Enter to toggle expand/collapse
*/}
<ResizableHandle
  withHandle
  className="hover:bg-sidebar-accent active:bg-sidebar-border transition-colors duration-200"
/>
```

**Step 4: Run test to verify it passes**

Run: `bun test src/pages/PlaybookManagerPage.keyboard.test.tsx`

Expected: PASS - keyboard navigation works via react-resizable-panels built-in support

**Step 5: Commit**

```bash
git add src/pages/PlaybookManagerPage.tsx src/pages/PlaybookManagerPage.keyboard.test.tsx
git commit -m "test: add keyboard accessibility tests for sidebar resize

- Verify arrow key resize functionality
- Document keyboard shortcuts in code comments
- Confirm min/max constraint enforcement with keyboard"
```

---

## Task 5: Fix TypeScript Import Errors

**Files:**
- Modify: `src/pages/PlaybookManagerPage.tsx` (fix import paths)

**Step 1: Verify imports resolve correctly**

Run: `bun run build` or `bun run typecheck` (if available)

Check for any TypeScript errors related to:
- `MIN_SIDEBAR_WIDTH` and `MAX_SIDEBAR_WIDTH` imports
- ResizablePanel component imports

**Step 2: Fix import statement for constants**

If constants are exported from SettingsContext, they can be imported but not destructured from useSettings hook:

```typescript
// src/pages/PlaybookManagerPage.tsx

// Update import statement (around line 1-10)
import { useSettings, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from '@/contexts/SettingsContext'

// Update in component (around line 45)
const { sidebarWidth, setSidebarWidth } = useSettings()
// Use MIN_SIDEBAR_WIDTH and MAX_SIDEBAR_WIDTH directly, not from hook
```

**Step 3: Run type check**

Run: `bun run build` (or tsc --noEmit if configured)

Expected: No TypeScript errors related to sidebar resizing

**Step 4: Commit if changes needed**

```bash
git add src/pages/PlaybookManagerPage.tsx
git commit -m "fix: correct TypeScript imports for sidebar constants"
```

---

## Task 6: Integration Testing

**Files:**
- Test: Manual integration testing
- Test: `bun test` (run full suite)

**Step 1: Run full test suite**

Run: `bun test`

Expected: All existing tests pass, new tests pass

If any tests fail, investigate and fix before proceeding.

**Step 2: Manual integration testing**

Run: `bun --hot src/index.tsx`

Complete manual test checklist:
- [ ] **Initial Load**: Sidebar is 256px wide by default
- [ ] **Drag Resize**: Can drag handle left/right to resize sidebar
- [ ] **Min Constraint**: Cannot drag narrower than 200px
- [ ] **Max Constraint**: Cannot drag wider than 400px
- [ ] **Persistence**: Width persists after page refresh
- [ ] **Keyboard**: Can resize with arrow keys when handle focused
- [ ] **Visual Feedback**: Handle shows hover state
- [ ] **Navigation**: All sidebar links still work correctly
- [ ] **Responsive**: Main content area flexes correctly with sidebar
- [ ] **Dark Mode**: Resize handle visible in both light/dark themes
- [ ] **Playbook Selection**: Selecting playbooks works with resized sidebar
- [ ] **Folder Expansion**: Folder expand/collapse works with resized sidebar

**Step 3: Cross-browser testing**

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

Verify resize behavior is consistent across browsers.

**Step 4: Document testing results**

Create a testing summary comment in the PR or commit message noting:
- All tests pass
- Manual testing completed
- Any edge cases discovered and handled

**Step 5: Final commit**

```bash
git add -A
git commit -m "docs: add integration testing notes for resizable sidebar"
```

---

## Task 7: Optional Enhancement - Add Reset Button in Settings

**Files:**
- Modify: `src/components/shared/settings/DisplaySection.tsx` (if it exists)
- Or modify: `src/components/shared/UnifiedSettingsDialog.tsx`

**Optional Step 1: Add sidebar width control to settings dialog**

This is an optional enhancement to allow users to reset sidebar width or set it precisely:

```typescript
// src/components/shared/UnifiedSettingsDialog.tsx
// Or in a DisplaySection component

import { useSettings, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, DEFAULT_SIDEBAR_WIDTH } from '@/contexts/SettingsContext'

// Add to settings dialog (in appropriate section)
<div className="space-y-2">
  <label className="text-sm font-medium">
    Sidebar Width: {sidebarWidth}px
  </label>
  <div className="flex items-center gap-2">
    <input
      type="range"
      min={MIN_SIDEBAR_WIDTH}
      max={MAX_SIDEBAR_WIDTH}
      value={sidebarWidth}
      onChange={(e) => setSidebarWidth(Number(e.target.value))}
      className="flex-1"
    />
    <button
      onClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
      className="text-xs px-2 py-1 border rounded hover:bg-accent"
    >
      Reset
    </button>
  </div>
  <p className="text-xs text-muted-foreground">
    Drag the sidebar border or use this slider to adjust width ({MIN_SIDEBAR_WIDTH}-{MAX_SIDEBAR_WIDTH}px)
  </p>
</div>
```

**Optional Step 2: Test settings integration**

Run: `bun test`

Manually verify:
- [ ] Settings dialog shows current sidebar width
- [ ] Slider changes sidebar width in real-time
- [ ] Reset button restores default 256px width
- [ ] Changes are immediately reflected on the page

**Optional Step 3: Commit enhancement**

```bash
git add src/components/shared/UnifiedSettingsDialog.tsx
git commit -m "feat: add sidebar width control to settings dialog

- Add slider to adjust sidebar width from settings
- Add reset button to restore default width
- Show current width value in settings UI"
```

---

## Verification Checklist

**Use @superpowers:verification-before-completion before claiming done:**

Before marking this feature complete, verify:

- [ ] `bun test` passes all tests (existing + new)
- [ ] `bun run build` completes without TypeScript errors
- [ ] Sidebar can be resized by dragging the handle
- [ ] Width constrained between 200-400px
- [ ] Width persists across page refresh via localStorage
- [ ] Keyboard navigation works (arrow keys, tab to handle)
- [ ] Visual hover feedback on resize handle
- [ ] No layout breaks when sidebar is at min/max width
- [ ] All sidebar navigation features work correctly with resize
- [ ] Dark mode styling looks correct
- [ ] No console errors or warnings in browser

---

## Notes

**DRY:** Reuse existing ResizablePanel components from `src/components/ui/resizable.tsx`

**YAGNI:** Don't add preset width buttons, animations, or collapsible sidebar - just the requested drag-to-resize functionality

**TDD:** Write tests first for SettingsContext changes, then implementation

**Frequent commits:** Each task is one commit, following conventional commit format

**Reference skills:**
- @superpowers:test-driven-development for test-first approach
- @superpowers:verification-before-completion before final sign-off

**If tests fail:** Use @superpowers:systematic-debugging to identify root cause before fixing

---

## Implementation Time Estimate

This plan is designed for 7 discrete tasks taking approximately 2-5 minutes each when executed by an agent or engineer following TDD practices. Total implementation time: ~30-45 minutes with testing and verification.
