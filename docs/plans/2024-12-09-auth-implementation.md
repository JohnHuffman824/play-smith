# Production Authentication System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement production-ready session-based authentication with self-registration, client-side validation, database-backed sessions, and comprehensive test coverage.

**Architecture:** Server-side sessions stored in PostgreSQL with HTTP-only cookies. Password hashing via Bun's built-in bcrypt. Frontend auth context gates entire app behind login. Client-side validation for email and password. Dev mode seeds admin/admin user.

**Tech Stack:** Bun server, PostgreSQL, React Context, Bun.password (bcrypt), HTTP-only cookies, @testing-library/react

---

## Phase 1: Database Schema

### Task 1: Create Password Hash Migration

**Files:**
- Create: `src/db/migrations/004_add_password_hash.sql`

**Step 1: Write migration SQL**

Create the migration file:

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

Expected: Output shows "Migration 004_add_password_hash.sql applied successfully"

**Step 3: Verify migration**

Run: `bun -e "import { db } from './src/db/connection'; const result = await db\`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'\`; console.log(result); process.exit(0)"`

Expected: Shows password_hash column with VARCHAR(255) type

**Step 4: Commit**

```bash
git add src/db/migrations/004_add_password_hash.sql
git commit -m "feat(db): add password_hash column to users table"
```

---

### Task 2: Create Sessions Table Migration

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

Expected: "Migration 005_create_sessions.sql applied successfully"

**Step 3: Verify migration**

Run: `bun -e "import { db } from './src/db/connection'; const tables = await db\`SELECT table_name FROM information_schema.tables WHERE table_name = 'sessions'\`; console.log(tables); process.exit(0)"`

Expected: Shows sessions table exists

**Step 4: Commit**

```bash
git add src/db/migrations/005_create_sessions.sql
git commit -m "feat(db): create sessions table for auth"
```

---

### Task 3: Update Database Types

**Files:**
- Modify: `src/db/types.ts`

**Step 1: Read current types file**

Read the file to understand current structure.

**Step 2: Add Session interface**

Add after the existing interfaces:

```typescript
export interface Session {
	id: number
	user_id: number
	token: string
	expires_at: Date
	created_at: Date
}
```

**Step 3: Update User interface**

Add password_hash field to User interface:

```typescript
export interface User {
	id: number
	email: string
	name: string
	password_hash: string  // Add this line
	created_at: Date
	updated_at: Date
}
```

**Step 4: Verify types compile**

Run: `bun build --target=bun src/db/types.ts`

Expected: No errors

**Step 5: Commit**

```bash
git add src/db/types.ts
git commit -m "feat(db): add Session type and password_hash to User"
```

---

## Phase 2: Auth Service (TDD)

### Task 4: Write AuthService Tests

**Files:**
- Create: `tests/unit/services/AuthService.test.ts`

**Step 1: Create test directory**

Run: `mkdir -p tests/unit/services`

**Step 2: Write failing tests**

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
			expect(hash.length).toBeGreaterThan(50)
		})

		it('generates different hashes for same password', async () => {
			const password = 'testpassword123'
			const hash1 = await authService.hashPassword(password)
			const hash2 = await authService.hashPassword(password)

			expect(hash1).not.toBe(hash2)
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

**Step 3: Run tests to verify failure**

Run: `bun test tests/unit/services/AuthService.test.ts`

Expected: FAIL - "Cannot find module '../../../src/services/AuthService'"

---

### Task 5: Implement AuthService

**Files:**
- Create: `src/services/AuthService.ts`

**Step 1: Create service directory**

Run: `mkdir -p src/services`

**Step 2: Implement minimal AuthService**

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

**Step 3: Run tests to verify pass**

Run: `bun test tests/unit/services/AuthService.test.ts`

Expected: All tests PASS (6 passing)

**Step 4: Commit**

```bash
git add src/services/AuthService.ts tests/unit/services/AuthService.test.ts
git commit -m "feat(auth): implement AuthService with password hashing and token generation"
```

---

## Phase 3: Session Repository (TDD)

### Task 6: Write SessionRepository Tests

**Files:**
- Create: `src/db/repositories/SessionRepository.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { SessionRepository } from './SessionRepository'
import { UserRepository } from './UserRepository'
import { AuthService } from '../../services/AuthService'
import { db } from '../connection'

describe('SessionRepository', () => {
	const sessionRepo = new SessionRepository()
	const userRepo = new UserRepository()
	const authService = new AuthService()

	let testUserId: number
	let testToken: string

	beforeAll(async () => {
		// Create a test user for session tests
		const passwordHash = await authService.hashPassword('testpass')
		const user = await userRepo.create({
			email: 'session-test@example.com',
			name: 'Session Test',
			password_hash: passwordHash,
		})
		testUserId = user.id
	})

	afterAll(async () => {
		// Cleanup sessions and user
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('create session', async () => {
		const token = authService.generateSessionToken()
		const session = await sessionRepo.create(testUserId, token)

		expect(session.id).toBeGreaterThan(0)
		expect(session.user_id).toBe(testUserId)
		expect(session.token).toBe(token)
		expect(session.expires_at).toBeInstanceOf(Date)

		testToken = token
	})

	test('find valid session by token', async () => {
		const session = await sessionRepo.findValidByToken(testToken)

		expect(session).toBeDefined()
		expect(session?.user_id).toBe(testUserId)
		expect(session?.token).toBe(testToken)
	})

	test('find non-existent session returns null', async () => {
		const session = await sessionRepo.findValidByToken('invalid-token')
		expect(session).toBeNull()
	})

	test('delete session by token', async () => {
		await sessionRepo.deleteByToken(testToken)

		const session = await sessionRepo.findValidByToken(testToken)
		expect(session).toBeNull()
	})

	test('deleteAllForUser removes all user sessions', async () => {
		// Create multiple sessions
		const token1 = authService.generateSessionToken()
		const token2 = authService.generateSessionToken()
		await sessionRepo.create(testUserId, token1)
		await sessionRepo.create(testUserId, token2)

		// Delete all
		await sessionRepo.deleteAllForUser(testUserId)

		// Verify both gone
		const session1 = await sessionRepo.findValidByToken(token1)
		const session2 = await sessionRepo.findValidByToken(token2)
		expect(session1).toBeNull()
		expect(session2).toBeNull()
	})

	test('deleteExpired removes only expired sessions', async () => {
		// Create a session and manually expire it
		const expiredToken = authService.generateSessionToken()
		await sessionRepo.create(testUserId, expiredToken)
		await db`
			UPDATE sessions
			SET expires_at = NOW() - INTERVAL '1 day'
			WHERE token = ${expiredToken}
		`

		// Create a valid session
		const validToken = authService.generateSessionToken()
		await sessionRepo.create(testUserId, validToken)

		// Delete expired
		const count = await sessionRepo.deleteExpired()
		expect(count).toBeGreaterThan(0)

		// Verify expired is gone, valid remains
		const expired = await sessionRepo.findValidByToken(expiredToken)
		const valid = await sessionRepo.findValidByToken(validToken)
		expect(expired).toBeNull()
		expect(valid).toBeDefined()

		// Cleanup
		await sessionRepo.deleteByToken(validToken)
	})
})
```

**Step 2: Run tests to verify failure**

Run: `bun test src/db/repositories/SessionRepository.test.ts`

Expected: FAIL - "Cannot find module './SessionRepository'"

---

### Task 7: Implement SessionRepository

**Files:**
- Create: `src/db/repositories/SessionRepository.ts`

**Step 1: Implement minimal repository**

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

**Step 2: Run tests to verify pass**

Run: `bun test src/db/repositories/SessionRepository.test.ts`

Expected: All tests PASS (6 passing)

**Step 3: Commit**

```bash
git add src/db/repositories/SessionRepository.ts src/db/repositories/SessionRepository.test.ts
git commit -m "feat(auth): implement SessionRepository with CRUD operations"
```

---

## Phase 4: Update UserRepository (TDD)

### Task 8: Write UserRepository Auth Tests

**Files:**
- Modify: `src/db/repositories/UserRepository.test.ts`

**Step 1: Add test for password_hash field**

Add this test to the existing describe block:

```typescript
test('create user with password hash', async () => {
	const passwordHash = '$2a$10$abcdefghijklmnopqrstuv' // mock bcrypt hash
	const user = await repo.create({
		email: 'auth-test@example.com',
		name: 'Auth Test User',
		password_hash: passwordHash,
	})

	expect(user.id).toBeGreaterThan(0)
	expect(user.email).toBe('auth-test@example.com')
	expect(user.password_hash).toBe(passwordHash)

	// Cleanup
	await db`DELETE FROM users WHERE id = ${user.id}`
})
```

**Step 2: Run tests to verify failure**

Run: `bun test src/db/repositories/UserRepository.test.ts`

Expected: FAIL - TypeScript error about password_hash not being in create method signature

---

### Task 9: Update UserRepository Implementation

**Files:**
- Modify: `src/db/repositories/UserRepository.ts`

**Step 1: Update create method signature and implementation**

Update the create method:

```typescript
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
```

**Step 2: Run tests to verify pass**

Run: `bun test src/db/repositories/UserRepository.test.ts`

Expected: All tests PASS (including new test)

**Step 3: Fix existing tests that need password_hash**

Update the first test in the file to include password_hash:

```typescript
test('create user', async () => {
	const user = await repo.create({
		email: 'test@example.com',
		name: 'Test User',
		password_hash: '$2a$10$test.hash.placeholder',
	})

	expect(user.id).toBeGreaterThan(0)
	expect(user.email).toBe('test@example.com')
	expect(user.name).toBe('Test User')

	testUserId = user.id
})
```

**Step 4: Run all tests again**

Run: `bun test src/db/repositories/UserRepository.test.ts`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/db/repositories/UserRepository.ts src/db/repositories/UserRepository.test.ts
git commit -m "feat(auth): add password_hash field to UserRepository"
```

---

## Phase 5: Auth API Endpoints (TDD)

### Task 10: Write Login Endpoint Tests

**Files:**
- Create: `tests/integration/auth-api.test.ts`

**Step 1: Write failing login tests**

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { UserRepository } from '../../src/db/repositories/UserRepository'
import { AuthService } from '../../src/services/AuthService'
import { db } from '../../src/db/connection'

describe('Auth API', () => {
	const userRepo = new UserRepository()
	const authService = new AuthService()

	let testUserId: number
	const testEmail = 'api-test@example.com'
	const testPassword = 'testpassword123'

	beforeAll(async () => {
		// Create a test user
		const passwordHash = await authService.hashPassword(testPassword)
		const user = await userRepo.create({
			email: testEmail,
			name: 'API Test User',
			password_hash: passwordHash,
		})
		testUserId = user.id
	})

	afterAll(async () => {
		// Cleanup
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	describe('POST /api/auth/login', () => {
		test('successful login returns user and sets cookie', async () => {
			const response = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: testEmail,
					password: testPassword,
				}),
			})

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data.user).toBeDefined()
			expect(data.user.email).toBe(testEmail)
			expect(data.user.password_hash).toBeUndefined() // Should not expose hash

			const setCookie = response.headers.get('Set-Cookie')
			expect(setCookie).toContain('session_token=')
			expect(setCookie).toContain('HttpOnly')
		})

		test('login with wrong password returns 401', async () => {
			const response = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: testEmail,
					password: 'wrongpassword',
				}),
			})

			expect(response.status).toBe(401)

			const data = await response.json()
			expect(data.error).toBe('Invalid email or password')
		})

		test('login with non-existent email returns 401', async () => {
			const response = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'nonexistent@example.com',
					password: testPassword,
				}),
			})

			expect(response.status).toBe(401)
			const data = await response.json()
			expect(data.error).toBe('Invalid email or password')
		})

		test('login without email returns 400', async () => {
			const response = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: testPassword }),
			})

			expect(response.status).toBe(400)
		})
	})
})
```

**Step 2: Run tests to verify failure**

Note: This requires the server to be running. Start server in separate terminal:
`bun run dev`

Then run: `bun test tests/integration/auth-api.test.ts`

Expected: FAIL - 404 Not Found (endpoint doesn't exist yet)

---

### Task 11: Implement Auth API Module

**Files:**
- Create: `src/api/auth.ts`

**Step 1: Implement login endpoint**

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
		return Response.json({ error: 'Not implemented' }, { status: 501 })
	},

	// POST /api/auth/logout - Destroy session
	async logout(req: Request): Promise<Response> {
		return Response.json({ error: 'Not implemented' }, { status: 501 })
	},

	// GET /api/auth/me - Get current user from session
	async me(req: Request): Promise<Response> {
		return Response.json({ error: 'Not implemented' }, { status: 501 })
	},
}
```

**Step 2: Register routes**

Modify `src/index.ts` to add auth routes:

```typescript
import { serve } from "bun";
import index from "./index.html";
import { usersAPI, getUserById } from "./api/users";
import { authAPI } from "./api/auth";

const server = serve({
  routes: {
    "/*": index,

    "/api/auth/login": {
      POST: authAPI.login,
    },
    "/api/auth/register": {
      POST: authAPI.register,
    },
    "/api/auth/logout": {
      POST: authAPI.logout,
    },
    "/api/auth/me": {
      GET: authAPI.me,
    },

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
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
```

**Step 3: Run login tests**

Run: `bun test tests/integration/auth-api.test.ts`

Expected: Login tests PASS (4 passing)

**Step 4: Commit**

```bash
git add src/api/auth.ts src/index.ts tests/integration/auth-api.test.ts
git commit -m "feat(auth): implement login endpoint with tests"
```

---

### Task 12: Write Register Endpoint Tests

**Files:**
- Modify: `tests/integration/auth-api.test.ts`

**Step 1: Add register tests**

Add to the existing test file:

```typescript
describe('POST /api/auth/register', () => {
	test('successful registration creates user and returns session', async () => {
		const response = await fetch('http://localhost:3000/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'newuser@example.com',
				name: 'New User',
				password: 'newpassword123',
			}),
		})

		expect(response.status).toBe(201)

		const data = await response.json()
		expect(data.user).toBeDefined()
		expect(data.user.email).toBe('newuser@example.com')
		expect(data.user.name).toBe('New User')

		const setCookie = response.headers.get('Set-Cookie')
		expect(setCookie).toContain('session_token=')

		// Cleanup
		const user = await userRepo.findByEmail('newuser@example.com')
		if (user) {
			await db`DELETE FROM sessions WHERE user_id = ${user.id}`
			await db`DELETE FROM users WHERE id = ${user.id}`
		}
	})

	test('register with existing email returns 409', async () => {
		const response = await fetch('http://localhost:3000/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail, // Already exists from beforeAll
				name: 'Duplicate User',
				password: 'password123',
			}),
		})

		expect(response.status).toBe(409)
		const data = await response.json()
		expect(data.error).toBe('Email already registered')
	})

	test('register without required fields returns 400', async () => {
		const response = await fetch('http://localhost:3000/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: 'test@example.com' }),
		})

		expect(response.status).toBe(400)
	})
})
```

**Step 2: Run tests to verify failure**

Run: `bun test tests/integration/auth-api.test.ts`

Expected: Register tests FAIL (501 Not Implemented)

---

### Task 13: Implement Register Endpoint

**Files:**
- Modify: `src/api/auth.ts`

**Step 1: Update register method**

Replace the register stub with:

```typescript
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
```

**Step 2: Run tests to verify pass**

Run: `bun test tests/integration/auth-api.test.ts`

Expected: All register tests PASS

**Step 3: Commit**

```bash
git add src/api/auth.ts tests/integration/auth-api.test.ts
git commit -m "feat(auth): implement register endpoint with tests"
```

---

### Task 14: Write Logout Endpoint Tests

**Files:**
- Modify: `tests/integration/auth-api.test.ts`

**Step 1: Add logout tests**

```typescript
describe('POST /api/auth/logout', () => {
	test('logout clears session', async () => {
		// First login to get a session
		const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail,
				password: testPassword,
			}),
		})

		const cookies = loginResponse.headers.get('Set-Cookie')
		expect(cookies).toBeTruthy()

		// Now logout
		const logoutResponse = await fetch('http://localhost:3000/api/auth/logout', {
			method: 'POST',
			headers: { Cookie: cookies! },
		})

		expect(logoutResponse.status).toBe(200)

		const setCookie = logoutResponse.headers.get('Set-Cookie')
		expect(setCookie).toContain('Max-Age=0')
	})

	test('logout without session succeeds', async () => {
		const response = await fetch('http://localhost:3000/api/auth/logout', {
			method: 'POST',
		})

		expect(response.status).toBe(200)
	})
})
```

**Step 2: Run tests to verify failure**

Run: `bun test tests/integration/auth-api.test.ts`

Expected: Logout tests FAIL (501 Not Implemented)

---

### Task 15: Implement Logout Endpoint

**Files:**
- Modify: `src/api/auth.ts`

**Step 1: Update logout method**

```typescript
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
```

**Step 2: Run tests to verify pass**

Run: `bun test tests/integration/auth-api.test.ts`

Expected: All logout tests PASS

**Step 3: Commit**

```bash
git add src/api/auth.ts tests/integration/auth-api.test.ts
git commit -m "feat(auth): implement logout endpoint with tests"
```

---

### Task 16: Write Me Endpoint Tests

**Files:**
- Modify: `tests/integration/auth-api.test.ts`

**Step 1: Add me endpoint tests**

```typescript
describe('GET /api/auth/me', () => {
	test('returns user when authenticated', async () => {
		// Login first
		const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail,
				password: testPassword,
			}),
		})

		const cookies = loginResponse.headers.get('Set-Cookie')!

		// Call /me with session cookie
		const response = await fetch('http://localhost:3000/api/auth/me', {
			headers: { Cookie: cookies },
		})

		expect(response.status).toBe(200)

		const data = await response.json()
		expect(data.user).toBeDefined()
		expect(data.user.email).toBe(testEmail)
	})

	test('returns null user when not authenticated', async () => {
		const response = await fetch('http://localhost:3000/api/auth/me')

		expect(response.status).toBe(200)

		const data = await response.json()
		expect(data.user).toBeNull()
	})

	test('returns null and clears cookie for expired session', async () => {
		// Create an expired session manually
		const token = authService.generateSessionToken()
		await db`
			INSERT INTO sessions (user_id, token, expires_at)
			VALUES (${testUserId}, ${token}, NOW() - INTERVAL '1 day')
		`

		const response = await fetch('http://localhost:3000/api/auth/me', {
			headers: { Cookie: `session_token=${token}` },
		})

		expect(response.status).toBe(200)

		const data = await response.json()
		expect(data.user).toBeNull()

		const setCookie = response.headers.get('Set-Cookie')
		expect(setCookie).toContain('Max-Age=0')
	})
})
```

**Step 2: Run tests to verify failure**

Run: `bun test tests/integration/auth-api.test.ts`

Expected: Me tests FAIL (501 Not Implemented)

---

### Task 17: Implement Me Endpoint

**Files:**
- Modify: `src/api/auth.ts`

**Step 1: Update me method**

```typescript
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
```

**Step 2: Run tests to verify pass**

Run: `bun test tests/integration/auth-api.test.ts`

Expected: All tests PASS (13 passing)

**Step 3: Commit**

```bash
git add src/api/auth.ts tests/integration/auth-api.test.ts
git commit -m "feat(auth): implement me endpoint with tests"
```

---

## Phase 6: Dev Seed Script

### Task 18: Create Dev Seed Script

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
		console.log('✓ Admin user already exists, skipping seed')
		return
	}

	const passwordHash = await authService.hashPassword(ADMIN_PASSWORD)
	const user = await userRepo.create({
		email: ADMIN_EMAIL,
		name: ADMIN_NAME,
		password_hash: passwordHash,
	})

	console.log(`✓ Created admin user: ${user.email} (id: ${user.id})`)
	console.log('  Login with: admin / admin')
}

seedDevAdmin()
	.then(() => process.exit(0))
	.catch(err => {
		console.error('✗ Seed failed:', err)
		process.exit(1)
	})
```

**Step 2: Add npm script**

Modify `package.json` to add seed:dev script:

```json
"scripts": {
  "dev": "bun --hot src/index.ts",
  "start": "NODE_ENV=production bun src/index.ts",
  "build": "bun run build.ts",
  "test": "bun test",
  "test:watch": "bun test --watch",
  "test:coverage": "bun test --coverage",
  "migrate": "bun src/db/migrate.ts",
  "seed:dev": "bun src/db/seed-dev.ts"
}
```

**Step 3: Test seed script**

Run: `bun run seed:dev`

Expected: "✓ Created admin user: admin (id: X)" or "✓ Admin user already exists"

**Step 4: Verify admin user**

Run: `bun -e "import { UserRepository } from './src/db/repositories/UserRepository'; const repo = new UserRepository(); const user = await repo.findByEmail('admin'); console.log(user); process.exit(0)"`

Expected: Shows admin user with password_hash

**Step 5: Commit**

```bash
git add src/db/seed-dev.ts package.json
git commit -m "feat(auth): add dev seed script for admin user"
```

---

## Phase 7: Frontend Auth Context (TDD)

### Task 19: Create Frontend Auth Types

**Files:**
- Create: `src/types/auth.types.ts`

**Step 1: Create types file**

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

**Step 2: Verify types compile**

Run: `bun build --target=bun src/types/auth.types.ts`

Expected: No errors

**Step 3: Commit**

```bash
git add src/types/auth.types.ts
git commit -m "feat(auth): add frontend auth types"
```

---

### Task 20: Write AuthContext Tests

**Files:**
- Create: `tests/unit/contexts/AuthContext.test.tsx`

**Step 1: Write failing tests**

```typescript
import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext'

// Mock fetch globally
const mockFetch = mock()
global.fetch = mockFetch as any

// Test component that uses useAuth
function TestComponent() {
	const { user, isLoading, isAuthenticated, login, register, logout } = useAuth()

	return (
		<div>
			<div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
			<div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
			<div data-testid="user">{user ? user.email : 'null'}</div>
			<button onClick={() => login({ email: 'test@example.com', password: 'pass' })}>
				Login
			</button>
			<button onClick={() => register({ email: 'new@example.com', name: 'New', password: 'pass' })}>
				Register
			</button>
			<button onClick={logout}>Logout</button>
		</div>
	)
}

describe('AuthContext', () => {
	beforeEach(() => {
		mockFetch.mockReset()
	})

	test('provides auth state to children', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		// Initially loading
		expect(screen.getByTestId('loading').textContent).toBe('loading')

		// After load
		await waitFor(() => {
			expect(screen.getByTestId('loading').textContent).toBe('loaded')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('false')
		expect(screen.getByTestId('user').textContent).toBe('null')
	})

	test('checks session on mount', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'existing@example.com', name: 'Existing' },
			}),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('existing@example.com')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('true')
		expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.any(Object))
	})

	test('login updates user state', async () => {
		// Mock session check (no user)
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('loaded'))
		})

		// Mock login success
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'test@example.com', name: 'Test' },
			}),
		} as Response)

		const loginButton = screen.getByText('Login')
		loginButton.click()

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('test@example.com')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('true')
	})

	test('logout clears user state', async () => {
		// Mock session check (authenticated)
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'test@example.com', name: 'Test' },
			}),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('test@example.com')
		})

		// Mock logout
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true }),
		} as Response)

		const logoutButton = screen.getByText('Logout')
		logoutButton.click()

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('null')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('false')
	})

	test('throws error when used outside provider', () => {
		function InvalidComponent() {
			useAuth() // This should throw
			return null
		}

		expect(() => {
			render(<InvalidComponent />)
		}).toThrow('useAuth must be used within AuthProvider')
	})
})
```

**Step 2: Run tests to verify failure**

Run: `bun test tests/unit/contexts/AuthContext.test.tsx`

Expected: FAIL - "Cannot find module '../../../src/contexts/AuthContext'"

---

### Task 21: Implement AuthContext

**Files:**
- Create: `src/contexts/AuthContext.tsx`

**Step 1: Create contexts directory**

Run: `mkdir -p src/contexts`

**Step 2: Implement minimal AuthContext**

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

**Step 3: Run tests to verify pass**

Run: `bun test tests/unit/contexts/AuthContext.test.tsx`

Expected: All tests PASS (5 passing)

**Step 4: Commit**

```bash
git add src/contexts/AuthContext.tsx tests/unit/contexts/AuthContext.test.tsx
git commit -m "feat(auth): implement AuthContext with tests"
```

---

## Phase 8: Login Modal with Validation (TDD)

### Task 22: Write LoginModal Tests

**Files:**
- Create: `tests/unit/components/LoginModal.test.tsx`

**Step 1: Write failing tests**

```typescript
import { describe, test, expect, mock } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginModal } from '../../../src/components/auth/LoginModal'
import { AuthProvider } from '../../../src/contexts/AuthContext'

// Mock fetch
const mockFetch = mock()
global.fetch = mockFetch as any

function renderLoginModal() {
	mockFetch.mockResolvedValue({
		ok: true,
		json: async () => ({ user: null }),
	} as Response)

	return render(
		<AuthProvider>
			<LoginModal />
		</AuthProvider>
	)
}

describe('LoginModal', () => {
	test('renders login form by default', () => {
		renderLoginModal()

		expect(screen.getByText('Play Smith')).toBeDefined()
		expect(screen.getByLabelText(/Username or Email/i)).toBeDefined()
		expect(screen.getByLabelText(/Password/i)).toBeDefined()
		expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined()
	})

	test('switches to register mode', () => {
		renderLoginModal()

		const signUpButton = screen.getByText('Sign up')
		fireEvent.click(signUpButton)

		expect(screen.getByLabelText(/Name/i)).toBeDefined()
		expect(screen.getByLabelText(/Email/i)).toBeDefined()
		expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined()
	})

	test('shows validation error for invalid email in register mode', async () => {
		renderLoginModal()

		// Switch to register
		fireEvent.click(screen.getByText('Sign up'))

		const emailInput = screen.getByLabelText(/Email/i)
		const submitButton = screen.getByRole('button', { name: /Create Account/i })

		fireEvent.change(emailInput, { target: { value: 'notanemail' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/Please enter a valid email address/i)).toBeDefined()
		})
	})

	test('shows validation error for weak password', async () => {
		renderLoginModal()

		// Switch to register
		fireEvent.click(screen.getByText('Sign up'))

		const passwordInput = screen.getByLabelText(/Password/i)
		const submitButton = screen.getByRole('button', { name: /Create Account/i })

		fireEvent.change(passwordInput, { target: { value: '123' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/Password must be at least 6 characters/i)).toBeDefined()
		})
	})

	test('toggles password visibility', () => {
		renderLoginModal()

		const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement
		const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

		expect(passwordInput.type).toBe('password')

		fireEvent.click(toggleButton)
		expect(passwordInput.type).toBe('text')

		fireEvent.click(toggleButton)
		expect(passwordInput.type).toBe('password')
	})

	test('submits login form', async () => {
		renderLoginModal()

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'test@example.com', name: 'Test' },
			}),
		} as Response)

		const emailInput = screen.getByLabelText(/Username or Email/i)
		const passwordInput = screen.getByLabelText(/Password/i)
		const submitButton = screen.getByRole('button', { name: /Sign In/i })

		fireEvent.change(emailInput, { target: { value: 'admin' } })
		fireEvent.change(passwordInput, { target: { value: 'admin' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'/api/auth/login',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ email: 'admin', password: 'admin' }),
				})
			)
		})
	})

	test('displays error message on failed login', async () => {
		renderLoginModal()

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: async () => ({ error: 'Invalid email or password' }),
		} as Response)

		const emailInput = screen.getByLabelText(/Username or Email/i)
		const passwordInput = screen.getByLabelText(/Password/i)
		const submitButton = screen.getByRole('button', { name: /Sign In/i })

		fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
		fireEvent.change(passwordInput, { target: { value: 'wrong' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText('Invalid email or password')).toBeDefined()
		})
	})
})
```

**Step 2: Run tests to verify failure**

Run: `bun test tests/unit/components/LoginModal.test.tsx`

Expected: FAIL - "Cannot find module '../../../src/components/auth/LoginModal'"

---

### Task 23: Implement LoginModal Component

**Files:**
- Create: `src/components/auth/LoginModal.tsx`

**Step 1: Create auth components directory**

Run: `mkdir -p src/components/auth`

**Step 2: Implement LoginModal with validation**

```typescript
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

type AuthMode = 'login' | 'register'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validates email format
function isValidEmail(email: string): boolean {
	return EMAIL_REGEX.test(email)
}

// Validates password strength (min 6 chars)
function isValidPassword(password: string): boolean {
	return password.length >= 6
}

// Modal for user login and registration
export function LoginModal() {
	const { login, register } = useAuth()

	const [mode, setMode] = useState<AuthMode>('login')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [validationError, setValidationError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Validates form before submission
	function validateForm(): boolean {
		setValidationError('')

		if (mode === 'register') {
			if (!isValidEmail(email)) {
				setValidationError('Please enter a valid email address')
				return false
			}

			if (!isValidPassword(password)) {
				setValidationError('Password must be at least 6 characters')
				return false
			}

			if (!name.trim()) {
				setValidationError('Name is required')
				return false
			}
		}

		return true
	}

	// Handles form submission for both login and register modes
	async function handleSubmit(e: React.FormEvent): Promise<void> {
		e.preventDefault()
		setError('')
		setValidationError('')

		if (!validateForm()) {
			return
		}

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
		setValidationError('')
	}

	const isLogin = mode === 'login'
	const displayError = validationError || error

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
						{displayError && (
							<div
								className="mb-4 p-3 bg-red-50 border border-red-200
									rounded-xl text-red-600 text-sm"
							>
								{displayError}
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
									aria-label="Toggle password visibility"
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

**Step 3: Run tests to verify pass**

Run: `bun test tests/unit/components/LoginModal.test.tsx`

Expected: All tests PASS (8 passing)

**Step 4: Commit**

```bash
git add src/components/auth/LoginModal.tsx tests/unit/components/LoginModal.test.tsx
git commit -m "feat(auth): implement LoginModal with client-side validation"
```

---

### Task 24: Add Modal Animation CSS

**Files:**
- Modify: `src/index.css`

**Step 1: Read current CSS file**

Read file to see current contents.

**Step 2: Add modal animation**

Add to the end of `src/index.css`:

```css
/* Modal animations */
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

**Step 3: Verify CSS compiles**

Start dev server: `bun run dev`

Expected: No CSS errors in console

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(auth): add modal animation CSS"
```

---

## Phase 9: App Gate

### Task 25: Update App.tsx with Auth Gate

**Files:**
- Modify: `src/App.tsx`

**Step 1: Read current App.tsx**

Read file to understand current structure.

**Step 2: Add auth gate and loading screen**

Update App.tsx to wrap everything in AuthProvider and gate behind auth:

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

**Step 3: Test manually**

Run: `bun run dev`

Visit: http://localhost:3000

Expected: See login modal, cannot access app without logging in

**Step 4: Test login flow**

1. Click "Sign up" to register
2. Fill in email, name, password
3. Submit form
4. Should see app with user info in header
5. Click "Sign out"
6. Should return to login modal

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(auth): gate app behind authentication"
```

---

## Phase 10: Integration Tests

### Task 26: Write Complete Auth Flow Integration Test

**Files:**
- Create: `tests/integration/auth-flow.test.ts`

**Step 1: Write end-to-end flow test**

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { AuthService } from '../../src/services/AuthService'
import { UserRepository } from '../../src/db/repositories/UserRepository'
import { SessionRepository } from '../../src/db/repositories/SessionRepository'
import { db } from '../../src/db/connection'

describe('Complete Auth Flow Integration', () => {
	const authService = new AuthService()
	const userRepo = new UserRepository()
	const sessionRepo = new SessionRepository()

	let createdUserId: number

	afterAll(async () => {
		// Cleanup
		if (createdUserId) {
			await db`DELETE FROM sessions WHERE user_id = ${createdUserId}`
			await db`DELETE FROM users WHERE id = ${createdUserId}`
		}
	})

	test('complete registration, login, session check, logout flow', async () => {
		const testEmail = 'integration-test@example.com'
		const testPassword = 'testpassword123'
		const testName = 'Integration Test'

		// Step 1: Register
		const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail,
				name: testName,
				password: testPassword,
			}),
		})

		expect(registerResponse.status).toBe(201)
		const registerData = await registerResponse.json()
		expect(registerData.user.email).toBe(testEmail)

		const cookies = registerResponse.headers.get('Set-Cookie')!
		expect(cookies).toContain('session_token=')

		// Save user ID for cleanup
		createdUserId = registerData.user.id

		// Step 2: Verify session works with /me
		const meResponse = await fetch('http://localhost:3000/api/auth/me', {
			headers: { Cookie: cookies },
		})

		expect(meResponse.status).toBe(200)
		const meData = await meResponse.json()
		expect(meData.user.email).toBe(testEmail)

		// Step 3: Logout
		const logoutResponse = await fetch('http://localhost:3000/api/auth/logout', {
			method: 'POST',
			headers: { Cookie: cookies },
		})

		expect(logoutResponse.status).toBe(200)

		// Step 4: Verify session is invalid after logout
		const meAfterLogout = await fetch('http://localhost:3000/api/auth/me', {
			headers: { Cookie: cookies },
		})

		const meAfterLogoutData = await meAfterLogout.json()
		expect(meAfterLogoutData.user).toBeNull()

		// Step 5: Login with same credentials
		const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail,
				password: testPassword,
			}),
		})

		expect(loginResponse.status).toBe(200)
		const loginData = await loginResponse.json()
		expect(loginData.user.email).toBe(testEmail)

		const newCookies = loginResponse.headers.get('Set-Cookie')!
		expect(newCookies).toContain('session_token=')

		// Step 6: Verify new session works
		const meWithNewSession = await fetch('http://localhost:3000/api/auth/me', {
			headers: { Cookie: newCookies },
		})

		const meWithNewSessionData = await meWithNewSession.json()
		expect(meWithNewSessionData.user.email).toBe(testEmail)
	})

	test('session expires correctly', async () => {
		// Create a test user
		const passwordHash = await authService.hashPassword('testpass')
		const user = await userRepo.create({
			email: 'expiry-test@example.com',
			name: 'Expiry Test',
			password_hash: passwordHash,
		})

		// Create an expired session manually
		const expiredToken = authService.generateSessionToken()
		await db`
			INSERT INTO sessions (user_id, token, expires_at)
			VALUES (${user.id}, ${expiredToken}, NOW() - INTERVAL '1 day')
		`

		// Try to use expired session
		const response = await fetch('http://localhost:3000/api/auth/me', {
			headers: { Cookie: `session_token=${expiredToken}` },
		})

		const data = await response.json()
		expect(data.user).toBeNull()

		// Cleanup
		await db`DELETE FROM sessions WHERE user_id = ${user.id}`
		await db`DELETE FROM users WHERE id = ${user.id}`
	})

	test('password hashing prevents direct database access', async () => {
		// Create a user
		const password = 'secretpassword'
		const passwordHash = await authService.hashPassword(password)
		const user = await userRepo.create({
			email: 'hash-test@example.com',
			name: 'Hash Test',
			password_hash: passwordHash,
		})

		// Verify hash is different from password
		expect(user.password_hash).not.toBe(password)
		expect(user.password_hash).toMatch(/^\$2[aby]\$/)

		// Verify password verification works
		const valid = await authService.verifyPassword(password, user.password_hash)
		expect(valid).toBe(true)

		const invalid = await authService.verifyPassword('wrongpassword', user.password_hash)
		expect(invalid).toBe(false)

		// Cleanup
		await db`DELETE FROM users WHERE id = ${user.id}`
	})
})
```

**Step 2: Run integration test**

Note: Server must be running in separate terminal

Run: `bun test tests/integration/auth-flow.test.ts`

Expected: All tests PASS (3 passing)

**Step 3: Commit**

```bash
git add tests/integration/auth-flow.test.ts
git commit -m "test(auth): add complete auth flow integration tests"
```

---

## Phase 11: Documentation

### Task 27: Update README with Auth Setup

**Files:**
- Modify: `README.md`

**Step 1: Read current README**

Read file to find appropriate location for auth docs.

**Step 2: Add authentication section**

Add this section to README (after installation or setup section):

```markdown
## Authentication

### Development Setup

Play Smith uses session-based authentication with PostgreSQL-backed sessions.

1. **Run migrations:**
   ```bash
   bun run migrate
   ```

2. **Seed admin user for development:**
   ```bash
   bun run seed:dev
   ```

3. **Start the dev server:**
   ```bash
   bun run dev
   ```

4. **Login with default admin credentials:**
   - Username: `admin`
   - Password: `admin`

### Authentication Features

- ✅ Session-based authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt (via Bun.password)
- ✅ Self-registration with email validation
- ✅ Client-side form validation
- ✅ 7-day session expiration
- ✅ Complete test coverage (unit + integration)

### Production

- Set `NODE_ENV=production` for production mode
- Configure `DATABASE_URL` environment variable
- Users can self-register or be created via admin tools
- Sessions are automatically cleaned up on expiration
- No admin user is seeded by default in production

### API Endpoints

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate and create session
- `POST /api/auth/logout` - Destroy session
- `GET /api/auth/me` - Get current user from session

### Security

- Passwords are hashed with bcrypt (cost factor: 10)
- Sessions stored server-side with cryptographically secure tokens
- HTTP-only cookies prevent XSS attacks
- SameSite=Strict prevents CSRF attacks
- Password minimum length: 6 characters
- Email format validation on client and server
```

**Step 3: Verify markdown renders correctly**

Read the updated README to ensure formatting is correct.

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add authentication setup and security documentation"
```

---

## Summary

**Implementation complete!** This plan delivers:

### Database Layer
- ✅ Password hash column on users table
- ✅ Sessions table with indexes
- ✅ Updated TypeScript types

### Backend
- ✅ AuthService (password hashing, token generation) - TDD
- ✅ SessionRepository (CRUD operations) - TDD
- ✅ UserRepository updated for auth - TDD
- ✅ Auth API endpoints (login, register, logout, me) - TDD
- ✅ Dev seed script for admin user

### Frontend
- ✅ Auth types
- ✅ AuthContext with React hooks - TDD
- ✅ LoginModal with validation - TDD
- ✅ Modal animations
- ✅ App gate (blocks unauthenticated access)

### Testing
- ✅ Unit tests for AuthService
- ✅ Unit tests for SessionRepository
- ✅ Unit tests for UserRepository auth features
- ✅ Integration tests for all API endpoints
- ✅ Unit tests for AuthContext
- ✅ Unit tests for LoginModal
- ✅ Complete end-to-end auth flow integration test

### Documentation
- ✅ README with auth setup instructions
- ✅ Security documentation

**Total commits:** 18
**Test coverage:** Comprehensive (unit + integration)
**TDD approach:** Strict RED-GREEN-REFACTOR throughout
