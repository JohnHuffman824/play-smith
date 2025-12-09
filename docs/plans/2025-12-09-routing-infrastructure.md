# Routing Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build routing infrastructure to connect landing page, authentication, playbook manager, playbook editor, and play editor using React Router with protected routes and deep linking.

**Architecture:** Three-layer system - server layer (Bun.serve with catch-all), client router layer (React Router with protected routes), and page components layer (one component per route). Follow TDD, DRY, YAGNI principles.

**Tech Stack:** React Router v6, Bun, React 19, TypeScript

---

## Task 1: Install React Router Dependency

**Files:**
- Modify: `package.json`
- Create: `bun.lockb` (updated)

**Step 1: Install react-router-dom**

```bash
bun add react-router-dom
```

Expected output: Package installed successfully

**Step 2: Verify installation**

```bash
bun pm ls | grep react-router-dom
```

Expected: Shows react-router-dom version

**Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "deps: add react-router-dom for client-side routing"
```

---

## Task 2: Create useAuth Hook with Tests

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useAuth.test.ts`

**Step 1: Write the failing test**

Create `src/hooks/useAuth.test.ts`:

```typescript
import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
	beforeEach(() => {
		// Clear all mocks
		mock.restore()
	})

	test('returns loading state initially', () => {
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify({ id: 1, email: 'test@example.com' })))
		)

		const { result } = renderHook(() => useAuth())

		expect(result.current.loading).toBe(true)
		expect(result.current.user).toBe(null)
	})

	test('returns user when authenticated', async () => {
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		const { result } = renderHook(() => useAuth())

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.user).toEqual(mockUser)
	})

	test('returns null user when not authenticated', async () => {
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 401 }))
		)

		const { result } = renderHook(() => useAuth())

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.user).toBe(null)
	})

	test('logout function clears user', async () => {
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		const { result } = renderHook(() => useAuth())

		await waitFor(() => {
			expect(result.current.user).toEqual(mockUser)
		})

		// Mock logout endpoint
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 200 }))
		)

		result.current.logout()

		await waitFor(() => {
			expect(result.current.user).toBe(null)
		})
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/hooks/useAuth.test.ts
```

Expected: FAIL - "Cannot find module './useAuth'"

**Step 3: Write minimal implementation**

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react'

export interface User {
	id: number
	email: string
	name: string
}

export interface UseAuthResult {
	user: User | null
	loading: boolean
	logout: () => void
}

export function useAuth(): UseAuthResult {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		checkAuth()
	}, [])

	async function checkAuth() {
		try {
			const response = await fetch('/api/auth/me')

			if (response.ok) {
				const userData = await response.json()
				setUser(userData)
			} else {
				setUser(null)
			}
		} catch (error) {
			console.error('Auth check failed:', error)
			setUser(null)
		} finally {
			setLoading(false)
		}
	}

	async function logout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' })
			setUser(null)
		} catch (error) {
			console.error('Logout failed:', error)
		}
	}

	return { user, loading, logout }
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/hooks/useAuth.test.ts
```

Expected: PASS - All 4 tests pass

**Step 5: Commit**

```bash
git add src/hooks/useAuth.ts src/hooks/useAuth.test.ts
git commit -m "feat: add useAuth hook for authentication state"
```

---

## Task 3: Create ProtectedRoute Component with Tests

**Files:**
- Create: `src/router/ProtectedRoute.tsx`
- Create: `src/router/ProtectedRoute.test.tsx`

**Step 1: Write the failing test**

Create `src/router/ProtectedRoute.test.tsx`:

```typescript
import { describe, test, expect, mock } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

// Mock useAuth hook
mock.module('../hooks/useAuth', () => ({
	useAuth: mock(() => ({ user: null, loading: false, logout: () => {} }))
}))

describe('ProtectedRoute', () => {
	test('shows loading state while checking auth', () => {
		const { useAuth } = require('../hooks/useAuth')
		useAuth.mockReturnValue({ user: null, loading: true, logout: () => {} })

		render(
			<MemoryRouter>
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>
			</MemoryRouter>
		)

		expect(screen.getByText('Loading...')).toBeDefined()
	})

	test('renders children when user is authenticated', () => {
		const { useAuth } = require('../hooks/useAuth')
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test' }
		useAuth.mockReturnValue({ user: mockUser, loading: false, logout: () => {} })

		render(
			<MemoryRouter>
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>
			</MemoryRouter>
		)

		expect(screen.getByText('Protected Content')).toBeDefined()
	})

	test('redirects to login when user is not authenticated', () => {
		const { useAuth } = require('../hooks/useAuth')
		useAuth.mockReturnValue({ user: null, loading: false, logout: () => {} })

		render(
			<MemoryRouter initialEntries={['/playbooks']}>
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>
			</MemoryRouter>
		)

		// Component should redirect, so protected content should not be visible
		expect(() => screen.getByText('Protected Content')).toThrow()
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/router/ProtectedRoute.test.tsx
```

Expected: FAIL - "Cannot find module './ProtectedRoute'"

**Step 3: Write minimal implementation**

Create `src/router/ProtectedRoute.tsx`:

```typescript
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
	children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, loading } = useAuth()
	const location = useLocation()

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	if (!user) {
		// Redirect to login with return URL
		const returnUrl = encodeURIComponent(location.pathname + location.search)
		return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />
	}

	return <>{children}</>
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/router/ProtectedRoute.test.tsx
```

Expected: PASS - All 3 tests pass

**Step 5: Commit**

```bash
git add src/router/ProtectedRoute.tsx src/router/ProtectedRoute.test.tsx
git commit -m "feat: add ProtectedRoute component with auth redirects"
```

---

## Task 4: Create Placeholder Page Components

**Files:**
- Create: `src/pages/LandingPage.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/PlaybookManagerPage.tsx`
- Create: `src/pages/PlaybookEditorPage.tsx`
- Create: `src/pages/ErrorPage.tsx`
- Create: `src/pages/NotFoundPage.tsx`

**Step 1: Create LandingPage**

Create `src/pages/LandingPage.tsx`:

```typescript
export function LandingPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<h1 className="text-4xl font-bold mb-4">Play Smith</h1>
			<p className="text-xl text-gray-600 mb-8">
				Create and manage your football playbooks
			</p>
			<a
				href="/login"
				className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Get Started
			</a>
		</div>
	)
}
```

**Step 2: Create LoginPage**

Create `src/pages/LoginPage.tsx`:

```typescript
import { useNavigate, useSearchParams } from 'react-router-dom'

export function LoginPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()

		// TODO: Implement actual login logic when auth is ready
		// For now, just redirect to return URL or playbooks
		const returnUrl = searchParams.get('returnUrl') || '/playbooks'
		navigate(returnUrl)
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50">
			<div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
				<h1 className="text-2xl font-bold mb-6">Login</h1>
				<form onSubmit={handleLogin}>
					<div className="mb-4">
						<label className="block text-sm font-medium mb-2">Email</label>
						<input
							type="email"
							className="w-full px-3 py-2 border rounded-lg"
							placeholder="you@example.com"
						/>
					</div>
					<div className="mb-6">
						<label className="block text-sm font-medium mb-2">Password</label>
						<input
							type="password"
							className="w-full px-3 py-2 border rounded-lg"
							placeholder="••••••••"
						/>
					</div>
					<button
						type="submit"
						className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Sign In
					</button>
				</form>
				<p className="mt-4 text-sm text-gray-600">
					Auth integration coming soon
				</p>
			</div>
		</div>
	)
}
```

**Step 3: Create PlaybookManagerPage**

Create `src/pages/PlaybookManagerPage.tsx`:

```typescript
export function PlaybookManagerPage() {
	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold mb-6">My Playbooks</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div className="p-6 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
					<p className="text-gray-500">Playbook grid coming soon</p>
				</div>
			</div>
		</div>
	)
}
```

**Step 4: Create PlaybookEditorPage**

Create `src/pages/PlaybookEditorPage.tsx`:

```typescript
import { useParams } from 'react-router-dom'

export function PlaybookEditorPage() {
	const { playbookId } = useParams()

	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold mb-6">
				Playbook {playbookId}
			</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div className="p-6 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
					<p className="text-gray-500">Play grid coming soon</p>
				</div>
			</div>
		</div>
	)
}
```

**Step 5: Create ErrorPage**

Create `src/pages/ErrorPage.tsx`:

```typescript
import { useNavigate, useRouteError } from 'react-router-dom'

export function ErrorPage() {
	const error = useRouteError() as Error
	const navigate = useNavigate()

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<h1 className="text-4xl font-bold mb-4">Oops!</h1>
			<p className="text-xl text-gray-600 mb-2">Something went wrong</p>
			<p className="text-gray-500 mb-8">{error?.message || 'Unknown error'}</p>
			<div className="flex gap-4">
				<button
					onClick={() => navigate(-1)}
					className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
				>
					Go Back
				</button>
				<button
					onClick={() => navigate('/playbooks')}
					className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					Return to Playbooks
				</button>
			</div>
		</div>
	)
}
```

**Step 6: Create NotFoundPage**

Create `src/pages/NotFoundPage.tsx`:

```typescript
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
	const navigate = useNavigate()

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<h1 className="text-6xl font-bold mb-4">404</h1>
			<p className="text-2xl text-gray-600 mb-8">Page not found</p>
			<button
				onClick={() => navigate('/playbooks')}
				className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Return to Playbooks
			</button>
		</div>
	)
}
```

**Step 7: Commit**

```bash
git add src/pages/
git commit -m "feat: add placeholder page components"
```

---

## Task 5: Create Route Configuration

**Files:**
- Create: `src/router/routes.tsx`
- Create: `src/router/routes.test.tsx`

**Step 1: Write the failing test**

Create `src/router/routes.test.tsx`:

```typescript
import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from './routes'

describe('routes', () => {
	test('landing page route works', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('Play Smith')).toBeDefined()
	})

	test('login page route works', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/login']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('Login')).toBeDefined()
	})

	test('404 page route works', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/nonexistent']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('404')).toBeDefined()
		expect(screen.getByText('Page not found')).toBeDefined()
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/router/routes.test.tsx
```

Expected: FAIL - "Cannot find module './routes'"

**Step 3: Write minimal implementation**

Create `src/router/routes.tsx`:

```typescript
import { RouteObject } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { PlaybookManagerPage } from '../pages/PlaybookManagerPage'
import { PlaybookEditorPage } from '../pages/PlaybookEditorPage'
import { ErrorPage } from '../pages/ErrorPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <LandingPage />,
		errorElement: <ErrorPage />
	},
	{
		path: '/login',
		element: <LoginPage />,
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks',
		element: (
			<ProtectedRoute>
				<PlaybookManagerPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks/:playbookId',
		element: (
			<ProtectedRoute>
				<PlaybookEditorPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '*',
		element: <NotFoundPage />
	}
]
```

**Step 4: Run test to verify it passes**

```bash
bun test src/router/routes.test.tsx
```

Expected: PASS - All 3 tests pass

**Step 5: Commit**

```bash
git add src/router/routes.tsx src/router/routes.test.tsx
git commit -m "feat: add route configuration with protected routes"
```

---

## Task 6: Refactor App.tsx to Use Router

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

**Step 1: Write the failing test**

Create `src/App.test.tsx`:

```typescript
import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
	test('renders router with landing page by default', () => {
		render(<App />)

		// Should render landing page at root
		expect(screen.getByText('Play Smith')).toBeDefined()
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/App.test.tsx
```

Expected: FAIL - Still renders old play editor instead of router

**Step 3: Update App.tsx implementation**

Modify `src/App.tsx`:

```typescript
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { routes } from './router/routes'
import './index.css'

const router = createBrowserRouter(routes)

export default function App() {
	return (
		<ThemeProvider>
			<RouterProvider router={router} />
		</ThemeProvider>
	)
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/App.test.tsx
```

Expected: PASS

**Step 5: Run all tests to ensure nothing broke**

```bash
bun test
```

Expected: New tests pass, existing tests may fail (we'll fix in next task)

**Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "refactor: update App.tsx to use React Router"
```

---

## Task 7: Create PlayEditorPage from Old App.tsx

**Files:**
- Create: `src/pages/PlayEditorPage.tsx`
- Create: `src/pages/PlayEditorPage.test.tsx`
- Modify: `src/router/routes.tsx`

**Step 1: Write the failing test**

Create `src/pages/PlayEditorPage.test.tsx`:

```typescript
import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlayEditorPage } from './PlayEditorPage'

describe('PlayEditorPage', () => {
	test('renders play editor with toolbar', () => {
		render(
			<MemoryRouter>
				<PlayEditorPage />
			</MemoryRouter>
		)

		// Should render the play editor UI
		// Note: This is a basic test - existing canvas tests cover detailed functionality
		expect(screen.getByRole('main')).toBeDefined()
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/pages/PlayEditorPage.test.tsx
```

Expected: FAIL - "Cannot find module './PlayEditorPage'"

**Step 3: Create PlayEditorPage from old App content**

Create `src/pages/PlayEditorPage.tsx`:

```typescript
import { Toolbar } from '../components/toolbar/Toolbar'
import { Canvas } from '../components/canvas/Canvas'
import { PlayHeader } from '../components/plays/PlayHeader'
import { PlayCardsSection } from '../components/plays/PlayCardsSection'
import { useTheme } from '../contexts/ThemeContext'
import { PlayProvider, usePlayContext } from '../contexts/PlayContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

function PlayEditorContent() {
	const { theme } = useTheme()
	const {
		state,
		setDrawingState,
		setFormation,
		setPlay,
		setDefensiveFormation,
		addPlayCard,
		deletePlayCard,
		setHashAlignment,
		setShowPlayBar
	} = usePlayContext()

	// Set up keyboard shortcuts
	useKeyboardShortcuts({ setDrawingState })

	return (
		<main className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
			<Toolbar
				drawingState={state.drawingState}
				setDrawingState={setDrawingState}
				hashAlignment={state.hashAlignment}
				setHashAlignment={setHashAlignment}
				showPlayBar={state.showPlayBar}
				setShowPlayBar={setShowPlayBar}
			/>
			<div className='flex-1 flex flex-col'>
				<PlayHeader
					formation={state.formation}
					play={state.play}
					defensiveFormation={state.defensiveFormation}
					onFormationChange={setFormation}
					onPlayChange={setPlay}
					onDefensiveFormationChange={setDefensiveFormation}
				/>
				<Canvas
					drawingState={state.drawingState}
					hashAlignment={state.hashAlignment}
					showPlayBar={state.showPlayBar}
				/>
				<PlayCardsSection
					playCards={state.playCards}
					onAddCard={addPlayCard}
					onDeleteCard={deletePlayCard}
					showPlayBar={state.showPlayBar}
				/>
			</div>
		</main>
	)
}

export function PlayEditorPage() {
	return (
		<PlayProvider>
			<PlayEditorContent />
		</PlayProvider>
	)
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/pages/PlayEditorPage.test.tsx
```

Expected: PASS

**Step 5: Add PlayEditorPage to routes**

Modify `src/router/routes.tsx`:

```typescript
import { RouteObject } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { PlaybookManagerPage } from '../pages/PlaybookManagerPage'
import { PlaybookEditorPage } from '../pages/PlaybookEditorPage'
import { PlayEditorPage } from '../pages/PlayEditorPage'
import { ErrorPage } from '../pages/ErrorPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <LandingPage />,
		errorElement: <ErrorPage />
	},
	{
		path: '/login',
		element: <LoginPage />,
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks',
		element: (
			<ProtectedRoute>
				<PlaybookManagerPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks/:playbookId',
		element: (
			<ProtectedRoute>
				<PlaybookEditorPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks/:playbookId/plays/:playId',
		element: (
			<ProtectedRoute>
				<PlayEditorPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '*',
		element: <NotFoundPage />
	}
]
```

**Step 6: Run all tests**

```bash
bun test
```

Expected: All new routing tests pass, existing canvas/play tests still pass

**Step 7: Commit**

```bash
git add src/pages/PlayEditorPage.tsx src/pages/PlayEditorPage.test.tsx src/router/routes.tsx
git commit -m "feat: create PlayEditorPage from old App component"
```

---

## Task 8: Update Server to Serve React App for All Routes

**Files:**
- Modify: `src/index.ts`

**Step 1: Update server routes**

Modify `src/index.ts`:

```typescript
import { serve } from "bun";
import index from "./index.html";
import { usersAPI, getUserById } from "./api/users";

const server = serve({
  routes: {
    // API routes (handled first, before catch-all)
    "/api/users": usersAPI,
    "/api/users/:id": getUserById,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // Catch-all: serve React app for all non-API routes
    // This allows React Router to handle client-side routing
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
```

**Step 2: Test server**

```bash
bun run dev
```

Expected: Server starts, visit http://localhost:3000 and see landing page

**Step 3: Test navigation**

Manually test in browser:
- Navigate to `/` - should see landing page
- Navigate to `/login` - should see login page
- Navigate to `/playbooks` - should redirect to login (no auth yet)
- Navigate to `/nonexistent` - should see 404 page

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: update server to serve React app for all routes"
```

---

## Task 9: Add Navigation Integration Tests

**Files:**
- Create: `tests/integration/routing-flow.test.tsx`

**Step 1: Write integration tests**

Create `tests/integration/routing-flow.test.tsx`:

```typescript
import { describe, test, expect, mock } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../src/router/routes'

describe('Routing Flow Integration', () => {
	test('landing page -> login flow', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/']
		})

		render(<RouterProvider router={router} />)

		// Should start on landing page
		expect(screen.getByText('Play Smith')).toBeDefined()

		// Click "Get Started" link
		const getStartedLink = screen.getByText('Get Started')
		await userEvent.click(getStartedLink)

		// Should navigate to login page
		await waitFor(() => {
			expect(screen.getByText('Login')).toBeDefined()
		})
	})

	test('deep link with returnUrl works', async () => {
		// Mock unauthenticated user
		const { useAuth } = require('../../src/hooks/useAuth')
		useAuth.mockReturnValue({ user: null, loading: false, logout: () => {} })

		const router = createMemoryRouter(routes, {
			initialEntries: ['/playbooks']
		})

		render(<RouterProvider router={router} />)

		// Should redirect to login with returnUrl
		await waitFor(() => {
			expect(screen.getByText('Login')).toBeDefined()
		})

		// Check that returnUrl is in the URL
		// Note: In real app, after login, user should be redirected to /playbooks
	})

	test('404 page shows for invalid routes', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/this-does-not-exist']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('404')).toBeDefined()
		expect(screen.getByText('Page not found')).toBeDefined()
	})
})
```

**Step 2: Run integration tests**

```bash
bun test tests/integration/routing-flow.test.tsx
```

Expected: PASS - All integration tests pass

**Step 3: Commit**

```bash
git add tests/integration/routing-flow.test.tsx
git commit -m "test: add routing flow integration tests"
```

---

## Task 10: Create Navigation Component (Optional Enhancement)

**Files:**
- Create: `src/components/navigation/Navigation.tsx`
- Create: `src/components/navigation/Navigation.test.tsx`

**Note:** This task is optional for initial implementation. Can be added later when building out the playbook manager and editor pages.

**Step 1: Write the failing test**

Create `src/components/navigation/Navigation.test.tsx`:

```typescript
import { describe, test, expect, mock } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Navigation } from './Navigation'

mock.module('../../hooks/useAuth', () => ({
	useAuth: mock(() => ({
		user: { id: 1, email: 'test@example.com', name: 'Test User' },
		loading: false,
		logout: () => {}
	}))
}))

describe('Navigation', () => {
	test('renders user name', () => {
		render(
			<MemoryRouter>
				<Navigation />
			</MemoryRouter>
		)

		expect(screen.getByText('Test User')).toBeDefined()
	})

	test('renders playbooks link', () => {
		render(
			<MemoryRouter>
				<Navigation />
			</MemoryRouter>
		)

		expect(screen.getByText('Playbooks')).toBeDefined()
	})

	test('renders logout button', () => {
		render(
			<MemoryRouter>
				<Navigation />
			</MemoryRouter>
		)

		expect(screen.getByText('Logout')).toBeDefined()
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/components/navigation/Navigation.test.tsx
```

Expected: FAIL - "Cannot find module './Navigation'"

**Step 3: Write minimal implementation**

Create `src/components/navigation/Navigation.tsx`:

```typescript
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Navigation() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	if (!user) {
		return null
	}

	return (
		<nav className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-8">
						<Link to="/" className="text-xl font-bold">
							Play Smith
						</Link>
						<Link
							to="/playbooks"
							className="text-gray-700 hover:text-gray-900"
						>
							Playbooks
						</Link>
					</div>
					<div className="flex items-center space-x-4">
						<span className="text-gray-700">{user.name}</span>
						<button
							onClick={handleLogout}
							className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	)
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/components/navigation/Navigation.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/navigation/Navigation.tsx src/components/navigation/Navigation.test.tsx
git commit -m "feat: add Navigation component for authenticated pages"
```

---

## Task 11: Manual Testing and Documentation

**Step 1: Start development server**

```bash
bun run dev
```

**Step 2: Manual testing checklist**

Test the following flows manually in browser:

- [ ] Landing page loads at `/`
- [ ] Click "Get Started" navigates to `/login`
- [ ] Login page shows login form
- [ ] Navigate to `/playbooks` redirects to login (no auth yet)
- [ ] Navigate to `/playbooks/123` redirects to login
- [ ] Navigate to `/playbooks/123/plays/456` redirects to login
- [ ] Navigate to `/invalid-route` shows 404 page
- [ ] 404 page "Return to Playbooks" button works
- [ ] Browser back/forward buttons work correctly
- [ ] Page refreshes maintain current route

**Step 3: Update README with routing info**

Add to `README.md`:

```markdown
## Routing

The application uses React Router for client-side routing with the following structure:

- `/` - Landing page (public)
- `/login` - Login page (public)
- `/playbooks` - Playbook manager (protected)
- `/playbooks/:playbookId` - Playbook editor (protected)
- `/playbooks/:playbookId/plays/:playId` - Play editor (protected)

Protected routes require authentication and will redirect to `/login` with a return URL.

## Running the Application

```bash
bun run dev
```

Navigate to http://localhost:3000
```

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add routing information to README"
```

---

## Task 12: Final Verification and Cleanup

**Step 1: Run all tests**

```bash
bun test
```

Expected: All tests pass

**Step 2: Check for TypeScript errors**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Verify git status**

```bash
git status
```

Expected: Working tree clean

**Step 4: Review commit history**

```bash
git log --oneline
```

Expected: Clean, descriptive commit messages following conventional commits

**Step 5: Create final summary commit (if needed)**

If there are any final tweaks or documentation updates:

```bash
git add .
git commit -m "chore: finalize routing infrastructure implementation"
```

---

## Success Criteria Checklist

Verify all success criteria from design document:

- [ ] Users can navigate between all major sections
- [ ] Protected routes redirect to login when not authenticated
- [ ] Deep linking preserves intended destination (returnUrl works)
- [ ] Existing play editor functionality remains intact
- [ ] All routes have tests (TDD followed)
- [ ] No console errors during navigation
- [ ] Clean, modular code following DRY principles

---

## Next Steps

After routing infrastructure is complete:

1. **Integrate Authentication** - Replace mock auth in LoginPage with actual auth implementation
2. **Build Playbook Manager** - Implement PlaybookManagerPage with real data fetching
3. **Build Playbook Editor** - Implement PlaybookEditorPage with play grid
4. **Add Navigation** - Integrate Navigation component into protected pages
5. **Implement Play Persistence** - Connect PlayEditorPage to database for saving/loading plays

---

## Notes

- **TDD Followed:** Each component created with tests first (RED-GREEN-REFACTOR)
- **DRY:** Shared routing logic in ProtectedRoute, reusable page components
- **YAGNI:** No premature optimization, simple fetch instead of React Query
- **Frequent Commits:** Each task committed separately with clear messages
- **Auth Integration Point:** useAuth hook and ProtectedRoute ready for actual auth
- **Existing Tests:** Play editor tests remain unchanged, continue to pass
