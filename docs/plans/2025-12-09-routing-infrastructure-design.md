# Routing Infrastructure Design

**Date:** 2025-12-09
**Status:** Approved
**Implementation Approach:** Test-Driven Development (TDD)

## Overview

This document defines the routing infrastructure for Play Smith, connecting the landing page, authentication, playbook manager, playbook editor, and play editor into a cohesive application.

## Goals

1. Create a modular, expandable routing system using React Router
2. Implement protected routes with authentication redirects
3. Support deep linking and bookmarking of any route
4. Integrate existing play editor into the routing system
5. Follow DRY, YAGNI, and modern best practices

## Architecture

The routing infrastructure consists of three layers:

### 1. Server Layer (src/index.ts)

**Responsibilities:**
- Serve main `index.html` for all non-API routes (`/*`)
- Handle API routes at `/api/*` (users, playbooks, plays, auth)
- Serve static assets directly via Bun

**Changes Required:**
- Maintain existing Bun.serve() configuration
- Ensure catch-all route serves the React app

### 2. Client Router Layer (src/router/)

**Responsibilities:**
- Manage client-side navigation with React Router
- Define route configuration
- Protect authenticated routes
- Handle deep linking with return URLs

**New Files:**
- `src/router/routes.tsx` - Route definitions
- `src/router/ProtectedRoute.tsx` - Auth-protected route wrapper

### 3. Page Components Layer (src/pages/)

**Responsibilities:**
- One page component per major route
- Own data fetching and page-level state
- Integrate with shared components

**New Files:**
- `src/pages/LandingPage.tsx` - Public marketing/info page
- `src/pages/LoginPage.tsx` - Authentication (integrates with auth work)
- `src/pages/PlaybookManagerPage.tsx` - Grid of user's playbooks
- `src/pages/PlaybookEditorPage.tsx` - Grid of plays in a playbook
- `src/pages/PlayEditorPage.tsx` - Refactored from App.tsx
- `src/pages/ErrorPage.tsx` - Error boundary display
- `src/pages/NotFoundPage.tsx` - 404 page

## URL Structure

Flat, RESTful URL structure:

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login page |
| `/playbooks` | Protected | Playbook manager (grid of playbooks) |
| `/playbooks/:playbookId` | Protected | Playbook editor (grid of plays) |
| `/playbooks/:playbookId/plays/:playId` | Protected | Play editor (canvas, toolbar, etc.) |
| `*` | Public | 404 Not Found |

## Components

### ProtectedRoute Component

**Location:** `src/router/ProtectedRoute.tsx`

**Purpose:** Wraps protected pages and enforces authentication

**Behavior:**
- Checks for valid session using `useAuth()` hook
- If authenticated: renders child component
- If not authenticated: redirects to `/login?returnUrl={currentPath}`
- Shows loading state while checking auth status

**Example:**
```tsx
<ProtectedRoute>
  <PlaybookManagerPage />
</ProtectedRoute>
```

### Route Configuration

**Location:** `src/router/routes.tsx`

**Purpose:** Centralize all route definitions

**Implementation:**
```tsx
import { createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/playbooks",
    element: <ProtectedRoute><PlaybookManagerPage /></ProtectedRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: "/playbooks/:playbookId",
    element: <ProtectedRoute><PlaybookEditorPage /></ProtectedRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: "/playbooks/:playbookId/plays/:playId",
    element: <ProtectedRoute><PlayEditorPage /></ProtectedRoute>,
    errorElement: <ErrorPage />
  },
  { path: "*", element: <NotFoundPage /> }
])
```

### App.tsx Refactor

**Changes:**
- Becomes root component that sets up routing
- Wraps `RouterProvider` with `ThemeProvider`
- `PlayProvider` moves to only wrap `PlayEditorPage`

**New Structure:**
```tsx
export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
```

### Navigation Component

**Location:** `src/components/navigation/Navigation.tsx`

**Purpose:** Shared header/nav for authenticated pages

**Features:**
- Uses React Router's `Link` and `useNavigate()`
- Shows current user info, team selector, logout
- Breadcrumbs for playbook → play navigation
- Only appears on protected routes

## Data Flow

### Authentication Flow

1. Server sends session cookie on successful login (handled by separate auth implementation)
2. Client checks session validity via `/api/auth/me` endpoint
3. `ProtectedRoute` component checks auth once per navigation
4. Simple `useAuth()` hook manages auth state - no complex library needed

### useAuth Hook

**Location:** `src/hooks/useAuth.ts`

**Purpose:** Simple auth state management

**Returns:**
```tsx
{
  user: User | null,
  loading: boolean,
  logout: () => void
}
```

**Implementation:**
- Checks session on mount via `/api/auth/me`
- Returns user data if authenticated
- Provides logout function that clears session and redirects

### Data Fetching Pattern

Each page owns its data fetching:
- `PlaybookManagerPage` fetches user's playbooks
- `PlaybookEditorPage` fetches plays for one playbook
- `PlayEditorPage` fetches/saves individual play data

**Approach:**
- Use simple `fetch()` calls in `useEffect`
- No React Query/SWR initially (add later if needed - YAGNI)
- Handle loading and error states in each component

### Context Usage

Following YAGNI principle:
- `ThemeContext`: Global (dark/light mode across all pages)
- `PlayContext`: Only wraps `PlayEditorPage` (not needed elsewhere)
- No `AuthContext` needed - `useAuth()` hook is sufficient

### Deep Linking Flow

**Scenario:** User bookmarks `/playbooks` and visits while logged out

1. User visits `/playbooks` (bookmarked URL)
2. `ProtectedRoute` checks auth → not logged in
3. Redirects to `/login?returnUrl=/playbooks`
4. User logs in successfully
5. `LoginPage` reads `returnUrl` from query params
6. Navigates to `/playbooks` instead of default route

**ProtectedRoute Implementation:**
```tsx
if (!user) {
  const returnUrl = encodeURIComponent(window.location.pathname)
  return <Navigate to={`/login?returnUrl=${returnUrl}`} />
}
```

**LoginPage Implementation:**
```tsx
// After successful login
const searchParams = new URLSearchParams(window.location.search)
const returnUrl = searchParams.get('returnUrl') || '/playbooks'
navigate(returnUrl)
```

## Error Handling

### Route-Level Error Boundaries

Use React Router's built-in error boundaries:
- Each route can specify `errorElement`
- Catches errors without crashing entire app
- Shows user-friendly error page

### ErrorPage Component

**Location:** `src/pages/ErrorPage.tsx`

**Features:**
- Different messages for 404 vs server errors
- "Go back" button using `useNavigate(-1)`
- "Return to playbooks" safe navigation link
- No error tracking service initially (add Sentry later if needed)

### API Error Handling

Each page handles its own API errors:
- **401 Unauthorized** → logout and redirect to login
- **403 Forbidden** → show "no permission" message
- **404 Not Found** → show "playbook/play not found"
- **500 Server Error** → generic error message

### Network Failures

Simple retry logic:
- Show loading state during requests
- On failure: error message with "Retry" button
- No offline mode or complex retry queues (YAGNI)

### Invalid Routes

Catch-all `*` route shows `NotFoundPage` with helpful navigation links.

## Testing Strategy

**Implementation Note:** Follow Test-Driven Development (TDD)
- Write tests first
- Watch them fail (RED)
- Implement to make them pass (GREEN)
- Refactor (REFACTOR)

### Route Testing

**File:** `src/router/routes.test.tsx`

**Tests:**
- Verify all routes render correct components
- Test protected routes redirect when not authenticated
- Test deep linking with returnUrl preservation
- Use `MemoryRouter` for isolated testing

### ProtectedRoute Tests

**File:** `src/router/ProtectedRoute.test.tsx`

**Tests:**
- Authenticated user → renders child component
- Unauthenticated user → redirects with returnUrl
- Loading state → shows loading indicator
- Test component logic without mocking auth service

### Page Component Tests

Each page gets basic render tests:
- `PlaybookManagerPage.test.tsx` - renders playbook grid
- `PlaybookEditorPage.test.tsx` - renders play grid
- `PlayEditorPage.test.tsx` - existing tests remain
- Mock API responses using Bun's test mocking

### Integration Tests

**Files:** `tests/integration/routing-flow.test.tsx`

**Critical flows:**
- Login → playbooks → playbook → play
- Bookmark protected route → login → redirect to intended page
- Use `@testing-library/react` with `MemoryRouter`

### E2E Testing

**Decision:** Skip Playwright/Cypress initially (YAGNI)
- Add only if cross-browser testing needed
- Unit + integration tests sufficient for v1

## Migration Plan

### Phase 1: Setup Infrastructure
1. Install react-router-dom
2. Create router directory structure
3. Create ProtectedRoute component
4. Create useAuth hook
5. Update App.tsx to use RouterProvider

### Phase 2: Create Page Components
1. Create placeholder page components (simple "Coming Soon" UI)
2. Set up route configuration
3. Test navigation between routes

### Phase 3: Migrate Play Editor
1. Refactor App.tsx → PlayEditorPage.tsx
2. Move PlayContext to only wrap PlayEditorPage
3. Ensure existing play editor tests still pass

### Phase 4: Build Out Pages
1. Implement LandingPage
2. Implement LoginPage (integrate with auth work)
3. Implement PlaybookManagerPage
4. Implement PlaybookEditorPage

### Phase 5: Polish
1. Add Navigation component
2. Add ErrorPage and NotFoundPage
3. Implement deep linking
4. Integration testing

## Dependencies

**New:**
- `react-router-dom` (v6+)

**No other dependencies needed** - following YAGNI principle.

## Success Criteria

- [ ] Users can navigate between all major sections
- [ ] Protected routes redirect to login when not authenticated
- [ ] Deep linking preserves intended destination
- [ ] Existing play editor functionality remains intact
- [ ] All routes have tests (TDD)
- [ ] No console errors during navigation
- [ ] Clean, modular code following DRY principles

## Future Enhancements

(Not in scope for initial implementation - add later if needed)

- Auth token refresh logic
- Offline mode support
- React Query for advanced caching
- Error tracking (Sentry/LogRocket)
- E2E testing with Playwright
- Loading skeletons for better UX
- Route-based code splitting
