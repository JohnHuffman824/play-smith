---
name: login-gate
overview: Add modal login gate with admin dev auth and minimal mocked backend/session handling before app renders.
todos:
  - id: db-migrations
    content: Create migrations 004 (password_hash) and 005 (sessions table)
    status: pending
  - id: db-types
    content: Update types.ts with Session interface and password_hash field
    status: pending
  - id: auth-service
    content: Create AuthService with password hashing and token generation
    status: pending
  - id: session-repo
    content: Create SessionRepository for session CRUD
    status: pending
  - id: user-repo-update
    content: Update UserRepository.create to accept password_hash
    status: pending
  - id: auth-api
    content: Create auth API endpoints (login, register, logout, me)
    status: pending
  - id: register-routes
    content: Register auth routes in index.ts
    status: pending
  - id: seed-script
    content: Create seed-dev.ts script and npm script
    status: pending
  - id: auth-types
    content: Create frontend auth types
    status: pending
  - id: auth-context
    content: Create AuthContext and useAuth hook
    status: pending
  - id: login-modal
    content: Create LoginModal component with CSS animations
    status: pending
  - id: modal-css
    content: Add modal animation CSS to index.css
    status: pending
  - id: app-gate
    content: Update App.tsx with AuthProvider and auth gate
    status: pending
  - id: docs
    content: Update README with auth setup docs
    status: pending
  - id: tests
    content: Add unit tests for AuthService and AuthContext
    status: pending
---

# Production Authentication System Implementation Plan

> **For LLM:** REQUIRED RULE: Use rules/executing-plans to implement this plan task-by-task.

**Goal:** Implement production-ready session-based authentication with self-registration, database-backed sessions, and dev admin seeding.

**Architecture:** Server-side sessions stored in PostgreSQL with HTTP-only cookies. Password hashing via Bun's built-in bcrypt. Frontend auth context gates the entire app behind login. Dev mode seeds an admin/admin user for testing.

**Tech Stack:** Bun server, PostgreSQL, React Context, bcrypt (Bun built-in), HTTP-only cookies

---

## Database Schema

### Task 1: Add Password Hash to Users Table

**Files:**

- Create: `src/db/migrations/004_add_password_hash.sql`

**Step 1: Write migration SQL**

```sql
-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- For existing users, set a placeholder that will never match bcrypt output
UPDATE users SET password_hash = 'NEEDS_RESET' WHERE password_hash IS NULL;

-- Make column required for future inserts
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
```

**Step 2: Run migration**

Run: `bun run migrate`

Expected: Migration 004 applied successfully

---

### Task 2: Create Sessions Table

**Files:**

- Create: `src/db/migrations/005_create_sessions.sql`

**Step 1: Write migration SQL**

```sql
-- Sessions table for server-side session storage
CREATE TABLE sessions (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL,
	token VARCHAR(64) NOT NULL UNIQUE,
	expires_at TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**Step 2: Run migration**

Run: `bun run migrate`

Expected: Migration 005 applied successfully

---

### Task 3: Add Session Type

**Files:**

- Modify: `src/db/types.ts`

**Step 1: Add Session interface**

Add after Play interface:

```typescript
export interface Session {
	id: number
	user_id: number
	token: string
	expires_at: Date
	created_at: Date
}
```

**Step 2: Update User interface**

Add password_hash field:

```typescript
export interface User {
	id: number
	email: string
	name: string
	password_hash: string
	created_at: Date
	updated_at: Date
}
```

---

## Auth Service Layer

### Task 4: Create Auth Service

**Files:**

- Create: `src/services/AuthService.ts`
- Test: `tests/unit/services/AuthService.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'
import { AuthService } from '../../../src/services/AuthService'

describe('AuthService', () => {
	let authService: AuthService

	beforeEach(() => {
		authService = new AuthService()
	})

	describe('hashPassword', () => {
		it('returns a bcrypt hash different from input', async () => {
			const password = 'testpassword123'
			const hash = await authService.hashPassword(password)

			expect(hash).not.toBe(password)
			expect(hash).toMatch(/^\$2[aby]\$/)
		})
	})

	describe('verifyPassword', () => {
		it('returns true for matching password', async () => {
			const password = 'testpassword123'
			const hash = await authService.hashPassword(password)

			const result = await authService.verifyPassword(password, hash)

			expect(result).toBe(true)
		})

		it('returns false for non-matching password', async () => {
			const hash = await authService.hashPassword('correct')

			const result = await authService.verifyPassword('wrong', hash)

			expect(result).toBe(false)
		})
	})

	describe('generateSessionToken', () => {
		it('generates 64-character hex token', () => {
			const token = authService.generateSessionToken()

			expect(token).toHaveLength(64)
			expect(token).toMatch(/^[a-f0-9]+$/)
		})

		it('generates unique tokens', () => {
			const token1 = authService.generateSessionToken()
			const token2 = authService.generateSessionToken()

			expect(token1).not.toBe(token2)
		})
	})
})
```

**Step 2: Run tests to verify failure**

Run: `bun test tests/unit/services/AuthService.test.ts`

Expected: FAIL - module not found

**Step 3: Implement AuthService**

```typescript
// Handles password hashing and session token generation
export class AuthService {
	private static readonly SALT_ROUNDS = 10
	private static readonly TOKEN_BYTES = 32

	// Hashes a plaintext password using bcrypt
	async hashPassword(password: string): Promise<string> {
		return await Bun.password.hash(password, {
			algorithm: 'bcrypt',
			cost: AuthService.SALT_ROUNDS,
		})
	}

	// Verifies a plaintext password against a bcrypt hash
	async verifyPassword(
		password: string,
		hash: string
	): Promise<boolean> {
		return await Bun.password.verify(password, hash)
	}

	// Generates a cryptographically secure session token
	generateSessionToken(): string {
		const bytes = crypto.getRandomValues(
			new Uint8Array(AuthService.TOKEN_BYTES)
		)
		return Array.from(bytes)
			.map(b => b.toString(16).padStart(2, '0'))
			.join('')
	}
}
```

**Step 4: Run tests to verify pass**

Run: `bun test tests/unit/services/AuthService.test.ts`

Expected: PASS

---

### Task 5: Create Session Repository

**Files:**

- Create: `src/db/repositories/SessionRepository.ts`
- Test: `tests/unit/repositories/SessionRepository.test.ts`

**Step 1: Write SessionRepository**

```typescript
import { db } from '../connection'
import type { Session } from '../types'

const SESSION_CREATE_FAILED = 'Failed to create session'
const SESSION_DURATION_DAYS = 7

export class SessionRepository {
	// Creates a new session with 7-day expiration
	async create(userId: number, token: string): Promise<Session> {
		const expiresAt = new Date()
		expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

		const [session] = await db<Session[]>`
			INSERT INTO sessions (user_id, token, expires_at)
			VALUES (${userId}, ${token}, ${expiresAt})
			RETURNING *
		`

		if (!session) {
			throw new Error(SESSION_CREATE_FAILED)
		}
		return session
	}

	// Finds a valid (non-expired) session by token
	async findValidByToken(token: string): Promise<Session | null> {
		const [session] = await db<Session[]>`
			SELECT * FROM sessions 
			WHERE token = ${token} 
			AND expires_at > CURRENT_TIMESTAMP
		`

		return session ?? null
	}

	// Deletes a session by token (logout)
	async deleteByToken(token: string): Promise<void> {
		await db`DELETE FROM sessions WHERE token = ${token}`
	}

	// Deletes all sessions for a user (force logout everywhere)
	async deleteAllForUser(userId: number): Promise<void> {
		await db`DELETE FROM sessions WHERE user_id = ${userId}`
	}

	// Cleans up expired sessions (run periodically)
	async deleteExpired(): Promise<number> {
		const result = await db`
			DELETE FROM sessions 
			WHERE expires_at < CURRENT_TIMESTAMP
		`
		return result.count
	}
}
```

---

### Task 6: Update UserRepository for Auth

**Files:**

- Modify: `src/db/repositories/UserRepository.ts`

**Step 1: Update create method to accept password_hash**

```typescript
import { db } from '../connection'
import type { User } from '../types'

const USER_CREATE_FAILED = 'Failed to create user'

export class UserRepository {
	// Persists a user with password hash and returns DB defaults
	async create(data: {
		email: string
		name: string
		password_hash: string
	}): Promise<User> {
		const [user] = await db<User[]>`
			INSERT INTO users (email, name, password_hash)
			VALUES (${data.email}, ${data.name}, ${data.password_hash})
			RETURNING *
		`

		if (!user) {
			throw new Error(USER_CREATE_FAILED)
		}
		return user
	}

	// Retrieves a user by primary key or null when missing
	async findById(id: number): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE id = ${id}
		`

		return user ?? null
	}

	// Retrieves a user by unique email or null when missing
	async findByEmail(email: string): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE email = ${email}
		`

		return user ?? null
	}

	// Lists users newest first
	async list(): Promise<User[]> {
		return await db<User[]>`
			SELECT * FROM users ORDER BY created_at DESC
		`
	}
}
```

---

## API Endpoints

### Task 7: Create Auth API

**Files:**

- Create: `src/api/auth.ts`

**Step 1: Implement auth endpoints**

```typescript
import { UserRepository } from '../db/repositories/UserRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'
import { AuthService } from '../services/AuthService'

const userRepo = new UserRepository()
const sessionRepo = new SessionRepository()
const authService = new AuthService()

const SESSION_COOKIE_NAME = 'session_token'
const INVALID_CREDENTIALS = 'Invalid email or password'
const EMAIL_EXISTS = 'Email already registered'

// Parses session token from cookie header
function getSessionToken(req: Request): string | null {
	const cookies = req.headers.get('cookie') ?? ''
	const match = cookies.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))
	return match?.[1] ?? null
}

// Creates HTTP-only session cookie
function createSessionCookie(token: string, maxAge: number): string {
	return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; ` +
		`Max-Age=${maxAge}; SameSite=Strict`
}

// Creates cookie that expires the session
function createExpiredCookie(): string {
	return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`
}

export const authAPI = {
	// POST /api/auth/login - Authenticate user and create session
	async login(req: Request): Promise<Response> {
		const body = await req.json()
		const { email, password } = body

		if (!email || !password) {
			return Response.json(
				{ error: 'Email and password are required' },
				{ status: 400 }
			)
		}

		const user = await userRepo.findByEmail(email)
		if (!user) {
			return Response.json(
				{ error: INVALID_CREDENTIALS },
				{ status: 401 }
			)
		}

		const valid = await authService.verifyPassword(
			password,
			user.password_hash
		)
		if (!valid) {
			return Response.json(
				{ error: INVALID_CREDENTIALS },
				{ status: 401 }
			)
		}

		const token = authService.generateSessionToken()
		await sessionRepo.create(user.id, token)

		const sevenDaysInSeconds = 7 * 24 * 60 * 60

		return Response.json(
			{ user: { id: user.id, email: user.email, name: user.name } },
			{
				status: 200,
				headers: {
					'Set-Cookie': createSessionCookie(token, sevenDaysInSeconds),
				},
			}
		)
	},

	// POST /api/auth/register - Create new user account
	async register(req: Request): Promise<Response> {
		const body = await req.json()
		const { email, name, password } = body

		if (!email || !name || !password) {
			return Response.json(
				{ error: 'Email, name, and password are required' },
				{ status: 400 }
			)
		}

		const existing = await userRepo.findByEmail(email)
		if (existing) {
			return Response.json(
				{ error: EMAIL_EXISTS },
				{ status: 409 }
			)
		}

		const passwordHash = await authService.hashPassword(password)
		const user = await userRepo.create({
			email,
			name,
			password_hash: passwordHash,
		})

		const token = authService.generateSessionToken()
		await sessionRepo.create(user.id, token)

		const sevenDaysInSeconds = 7 * 24 * 60 * 60

		return Response.json(
			{ user: { id: user.id, email: user.email, name: user.name } },
			{
				status: 201,
				headers: {
					'Set-Cookie': createSessionCookie(token, sevenDaysInSeconds),
				},
			}
		)
	},

	// POST /api/auth/logout - Destroy session
	async logout(req: Request): Promise<Response> {
		const token = getSessionToken(req)
		if (token) {
			await sessionRepo.deleteByToken(token)
		}

		return Response.json(
			{ success: true },
			{
				status: 200,
				headers: { 'Set-Cookie': createExpiredCookie() },
			}
		)
	},

	// GET /api/auth/me - Get current user from session
	async me(req: Request): Promise<Response> {
		const token = getSessionToken(req)
		if (!token) {
			return Response.json({ user: null }, { status: 200 })
		}

		const session = await sessionRepo.findValidByToken(token)
		if (!session) {
			return Response.json(
				{ user: null },
				{
					status: 200,
					headers: { 'Set-Cookie': createExpiredCookie() },
				}
			)
		}

		const user = await userRepo.findById(session.user_id)
		if (!user) {
			return Response.json({ user: null }, { status: 200 })
		}

		return Response.json({
			user: { id: user.id, email: user.email, name: user.name },
		})
	},
}
```

---

### Task 8: Register Auth Routes

**Files:**

- Modify: `src/index.ts`

**Step 1: Add auth routes**

```typescript
import { serve } from 'bun'
import index from './index.html'
import { usersAPI, getUserById } from './api/users'
import { authAPI } from './api/auth'

const server = serve({
	routes: {
		'/*': index,

		'/api/auth/login': {
			POST: authAPI.login,
		},
		'/api/auth/register': {
			POST: authAPI.register,
		},
		'/api/auth/logout': {
			POST: authAPI.logout,
		},
		'/api/auth/me': {
			GET: authAPI.me,
		},

		'/api/users': usersAPI,
		'/api/users/:id': getUserById,

		'/api/hello': {
			async GET(req) {
				return Response.json({
					message: 'Hello, world!',
					method: 'GET',
				})
			},
			async PUT(req) {
				return Response.json({
					message: 'Hello, world!',
					method: 'PUT',
				})
			},
		},

		'/api/hello/:name': async req => {
			const name = req.params.name
			return Response.json({
				message: `Hello, ${name}!`,
			})
		},
	},

	development: process.env.NODE_ENV !== 'production' && {
		hmr: true,
		console: true,
	},
})

console.log(`Server running at ${server.url}`)
```

---

## Dev Admin Seeding

### Task 9: Create Dev Seed Script

**Files:**

- Create: `src/db/seed-dev.ts`

**Step 1: Write seed script**

```typescript
import { UserRepository } from './repositories/UserRepository'
import { AuthService } from '../services/AuthService'

const ADMIN_EMAIL = 'admin'
const ADMIN_NAME = 'Admin User'
const ADMIN_PASSWORD = 'admin'

// Seeds the dev database with an admin user for testing
async function seedDevAdmin(): Promise<void> {
	const userRepo = new UserRepository()
	const authService = new AuthService()

	const existing = await userRepo.findByEmail(ADMIN_EMAIL)
	if (existing) {
		console.log('Admin user already exists, skipping seed')
		return
	}

	const passwordHash = await authService.hashPassword(ADMIN_PASSWORD)
	const user = await userRepo.create({
		email: ADMIN_EMAIL,
		name: ADMIN_NAME,
		password_hash: passwordHash,
	})

	console.log(`Created admin user: ${user.email} (id: ${user.id})`)
	console.log('Login with: admin / admin')
}

seedDevAdmin()
	.then(() => process.exit(0))
	.catch(err => {
		console.error('Seed failed:', err)
		process.exit(1)
	})
```

**Step 2: Add npm script**

In `package.json` scripts:

```json
"seed:dev": "bun src/db/seed-dev.ts"
```

---

## Frontend Auth Context

### Task 10: Create Auth Types

**Files:**

- Create: `src/types/auth.types.ts`

**Step 1: Define auth types**

```typescript
export interface AuthUser {
	id: number
	email: string
	name: string
}

export interface AuthState {
	user: AuthUser | null
	isLoading: boolean
	isAuthenticated: boolean
}

export interface LoginCredentials {
	email: string
	password: string
}

export interface RegisterData {
	email: string
	name: string
	password: string
}
```

---

### Task 11: Create Auth Context

**Files:**

- Create: `src/contexts/AuthContext.tsx`
- Test: `tests/unit/contexts/AuthContext.test.tsx`

**Step 1: Implement AuthContext**

```typescript
import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react'
import type { ReactNode } from 'react'
import type {
	AuthUser,
	AuthState,
	LoginCredentials,
	RegisterData,
} from '../types/auth.types'

interface AuthContextValue extends AuthState {
	login: (credentials: LoginCredentials) => Promise<void>
	register: (data: RegisterData) => Promise<void>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
	children: ReactNode
}

// Provides authentication state and actions to the app
export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const isAuthenticated = user !== null

	// Check for existing session on mount
	useEffect(() => {
		checkSession()
	}, [])

	// Validates existing session cookie with server
	async function checkSession(): Promise<void> {
		try {
			const response = await fetch('/api/auth/me', {
				credentials: 'include',
			})
			const data = await response.json()
			setUser(data.user)
		} catch {
			setUser(null)
		} finally {
			setIsLoading(false)
		}
	}

	// Authenticates user with email and password
	const login = useCallback(
		async (credentials: LoginCredentials): Promise<void> => {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(credentials),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error ?? 'Login failed')
			}

			const data = await response.json()
			setUser(data.user)
		},
		[]
	)

	// Creates new user account and logs in
	const register = useCallback(
		async (data: RegisterData): Promise<void> => {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const resData = await response.json()
				throw new Error(resData.error ?? 'Registration failed')
			}

			const resData = await response.json()
			setUser(resData.user)
		},
		[]
	)

	// Ends user session and clears state
	const logout = useCallback(async (): Promise<void> => {
		await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include',
		})
		setUser(null)
	}, [])

	const value: AuthContextValue = {
		user,
		isLoading,
		isAuthenticated,
		login,
		register,
		logout,
	}

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

// Hook to access auth context - throws if used outside provider
export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}
```

---

## Login Modal Component

### Task 12: Create Login Modal

**Files:**

- Create: `src/components/auth/LoginModal.tsx`

**Step 1: Implement cleaned-up modal with CSS transitions**

```typescript
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, X, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

type AuthMode = 'login' | 'register'

// Modal for user login and registration
export function LoginModal() {
	const { login, register } = useAuth()

	const [mode, setMode] = useState<AuthMode>('login')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Handles form submission for both login and register modes
	async function handleSubmit(e: React.FormEvent): Promise<void> {
		e.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			if (mode === 'login') {
				await login({ email, password })
			} else {
				await register({ email, name, password })
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Switches between login and register modes
	function switchMode(): void {
		setMode(mode === 'login' ? 'register' : 'login')
		setError('')
	}

	const isLogin = mode === 'login'

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="bg-white rounded-3xl shadow-2xl max-w-md w-full 
						overflow-hidden animate-modal-in"
				>
					{/* Header */}
					<div
						className="relative bg-gradient-to-br from-blue-50 
							to-blue-100 p-8 pb-12"
					>
						<div className="flex items-center gap-3 mb-3">
							<div
								className="w-12 h-12 rounded-2xl bg-gradient-to-br 
									from-blue-600 to-blue-400 flex items-center 
									justify-center shadow-lg"
							>
								<span className="text-white text-xl font-bold">
									PS
								</span>
							</div>
							<h2 className="text-2xl text-gray-800 font-semibold">
								Play Smith
							</h2>
						</div>

						<p className="text-gray-600 text-sm">
							{isLogin
								? 'Sign in to access your playbooks'
								: 'Create an account to get started'}
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="p-8 pt-6">
						{error && (
							<div
								className="mb-4 p-3 bg-red-50 border border-red-200 
									rounded-xl text-red-600 text-sm"
							>
								{error}
							</div>
						)}

						{/* Name Input (register only) */}
						{!isLogin && (
							<div className="mb-4">
								<label
									htmlFor="name"
									className="block text-sm text-gray-700 mb-2 
										font-medium"
								>
									Name
								</label>
								<div className="relative">
									<User
										className="absolute left-4 top-1/2 
											-translate-y-1/2 w-5 h-5 text-gray-400"
									/>
									<input
										id="name"
										type="text"
										value={name}
										onChange={e => setName(e.target.value)}
										placeholder="Your name"
										className="w-full pl-12 pr-4 py-3.5 bg-gray-50 
											border border-gray-200 rounded-2xl 
											focus:outline-none focus:ring-2 
											focus:ring-blue-500 focus:border-transparent 
											transition-all"
										required={!isLogin}
									/>
								</div>
							</div>
						)}

						{/* Email Input */}
						<div className="mb-4">
							<label
								htmlFor="email"
								className="block text-sm text-gray-700 mb-2 font-medium"
							>
								{isLogin ? 'Username or Email' : 'Email'}
							</label>
							<div className="relative">
								<Mail
									className="absolute left-4 top-1/2 -translate-y-1/2 
										w-5 h-5 text-gray-400"
								/>
								<input
									id="email"
									type="text"
									value={email}
									onChange={e => setEmail(e.target.value)}
									placeholder={isLogin ? 'admin' : 'coach@example.com'}
									className="w-full pl-12 pr-4 py-3.5 bg-gray-50 
										border border-gray-200 rounded-2xl focus:outline-none 
										focus:ring-2 focus:ring-blue-500 
										focus:border-transparent transition-all"
									required
								/>
							</div>
						</div>

						{/* Password Input */}
						<div className="mb-6">
							<label
								htmlFor="password"
								className="block text-sm text-gray-700 mb-2 font-medium"
							>
								Password
							</label>
							<div className="relative">
								<Lock
									className="absolute left-4 top-1/2 -translate-y-1/2 
										w-5 h-5 text-gray-400"
								/>
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={e => setPassword(e.target.value)}
									placeholder="Enter your password"
									className="w-full pl-12 pr-12 py-3.5 bg-gray-50 
										border border-gray-200 rounded-2xl focus:outline-none 
										focus:ring-2 focus:ring-blue-500 
										focus:border-transparent transition-all"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2 
										text-gray-400 hover:text-gray-600 transition-colors"
								>
									{showPassword
										? <EyeOff className="w-5 h-5" />
										: <Eye className="w-5 h-5" />
									}
								</button>
							</div>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 
								text-white rounded-2xl font-semibold transition-all 
								hover:shadow-lg disabled:opacity-50 
								disabled:cursor-not-allowed mb-4"
						>
							{isSubmitting
								? 'Please wait...'
								: isLogin ? 'Sign In' : 'Create Account'
							}
						</button>

						{/* Divider */}
						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-200" />
							</div>
							<div className="relative flex justify-center">
								<span className="px-4 bg-white text-sm text-gray-500">
									or
								</span>
							</div>
						</div>

						{/* Switch Mode Link */}
						<p className="text-center text-sm text-gray-600">
							{isLogin
								? "Don't have an account? "
								: 'Already have an account? '
							}
							<button
								type="button"
								onClick={switchMode}
								className="text-blue-600 hover:text-blue-700 
									font-semibold transition-colors"
							>
								{isLogin ? 'Sign up' : 'Sign in'}
							</button>
						</p>
					</form>
				</div>
			</div>
		</>
	)
}
```

---

### Task 13: Add Modal Animation CSS

**Files:**

- Modify: `src/index.css`

**Step 1: Add modal animation keyframes**

Add to end of file:

```css
@keyframes modal-in {
	from {
		opacity: 0;
		transform: scale(0.95) translateY(20px);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.animate-modal-in {
	animation: modal-in 0.3s ease-out;
}
```

---

## App Gate and Logout

### Task 14: Gate App Behind Auth

**Files:**

- Modify: `src/App.tsx`

**Step 1: Wrap app with AuthProvider and gate rendering**

```typescript
import { Toolbar } from './components/toolbar/Toolbar'
import { Canvas } from './components/canvas/Canvas'
import { PlayHeader } from './components/plays/PlayHeader'
import { PlayCardsSection } from './components/plays/PlayCardsSection'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { PlayProvider, usePlayContext } from './contexts/PlayContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginModal } from './components/auth/LoginModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './index.css'

// Loading spinner shown while checking auth session
function LoadingScreen() {
	return (
		<div className="flex h-screen items-center justify-center bg-gray-50">
			<div className="text-gray-500">Loading...</div>
		</div>
	)
}

function AppContent() {
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
		setShowPlayBar,
	} = usePlayContext()
	const { logout, user } = useAuth()

	useKeyboardShortcuts({ setDrawingState })

	return (
		<div
			className={`flex h-screen ${
				theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
			}`}
		>
			<Toolbar
				drawingState={state.drawingState}
				setDrawingState={setDrawingState}
				hashAlignment={state.hashAlignment}
				setHashAlignment={setHashAlignment}
				showPlayBar={state.showPlayBar}
				setShowPlayBar={setShowPlayBar}
			/>
			<div className="flex-1 flex flex-col">
				{/* User info and logout */}
				<div
					className="flex justify-end items-center px-4 py-2 
						border-b border-gray-200"
				>
					<span className="text-sm text-gray-600 mr-3">
						{user?.name ?? user?.email}
					</span>
					<button
						onClick={logout}
						className="text-sm text-blue-600 hover:text-blue-700 
							font-medium"
					>
						Sign out
					</button>
				</div>
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
		</div>
	)
}

// Gates app content behind authentication
function AuthGate() {
	const { isLoading, isAuthenticated } = useAuth()

	if (isLoading) {
		return <LoadingScreen />
	}

	if (!isAuthenticated) {
		return <LoginModal />
	}

	return (
		<PlayProvider>
			<AppContent />
		</PlayProvider>
	)
}

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<AuthGate />
			</AuthProvider>
		</ThemeProvider>
	)
}
```

---

## Environment Configuration

### Task 15: Document Environment Differences

**Files:**

- Modify: `README.md`

**Step 1: Add auth setup documentation**

Add section:

```markdown
## Authentication

### Development Setup

1. Run migrations: `bun run migrate`
2. Seed admin user: `bun run seed:dev`
3. Login with: `admin` / `admin`

### Production

- Uses same PostgreSQL-backed session auth
- No admin user seeded by default
- Users self-register or are created via admin tools
- Sessions stored in `sessions` table with 7-day expiration

### Environment Variables

- `NODE_ENV` - Set to `production` for production mode
- `DATABASE_URL` - PostgreSQL connection string
```

---

## Summary

**Database changes:**

- Migration 004: Add `password_hash` column to users
- Migration 005: Create `sessions` table

**Backend:**

- `AuthService` - Password hashing and token generation
- `SessionRepository` - Session CRUD operations
- `auth.ts` API - Login, register, logout, session check endpoints

**Frontend:**

- `AuthContext` - Global auth state and actions
- `LoginModal` - Login/register UI with CSS animations
- `App.tsx` - Auth gate blocks app until authenticated

**Dev workflow:**

- `bun run seed:dev` creates admin/admin user
- Same auth flow as production, just with known credentials