import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { AuthService } from '../../src/services/AuthService'
import { db } from '../../src/db/connection'
import { startTestServer, stopTestServer } from '../helpers/test-server'
import { createTestUser } from '../helpers/factories'

// Save the original fetch before any tests run
const ORIGINAL_FETCH = fetch

describe('Auth API', () => {
	const authService = new AuthService()

	let testUserId: number
	const testEmail = 'api-test@example.com'
	const testPassword = 'testpassword123'
	let baseUrl: string

	beforeAll(async () => {
		// Ensure we have real fetch
		global.fetch = ORIGINAL_FETCH

		// Start test server
		const { url } = await startTestServer()
		baseUrl = url

		// Create a test user using factory
		const passwordHash = await authService.hashPassword(testPassword)
		const user = await createTestUser({
			email: testEmail,
			name: 'API Test User',
			password_hash: passwordHash,
		})
		testUserId = user.id
	})

	beforeEach(() => {
		// Restore real fetch in case other tests mocked it
		global.fetch = ORIGINAL_FETCH
	})

	afterEach(() => {
		// Restore real fetch after each test
		global.fetch = ORIGINAL_FETCH
	})

	afterAll(async () => {
		// Cleanup
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`

		// Stop test server
		await stopTestServer()
	})

	describe('POST /api/auth/login', () => {
		test('successful login returns user and sets cookie', async () => {
			const response = await fetch(`${baseUrl}/api/auth/login`, {
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
			const response = await fetch(`${baseUrl}/api/auth/login`, {
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
			const response = await fetch(`${baseUrl}/api/auth/login`, {
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
			const response = await fetch(`${baseUrl}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: testPassword }),
			})

			expect(response.status).toBe(400)
		})
	})

	describe('POST /api/auth/register', () => {
		test('successful registration creates user and returns session', async () => {
			const response = await fetch(`${baseUrl}/api/auth/register`, {
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
			const [user] = await db`SELECT id FROM users WHERE email = 'newuser@example.com'`
			if (user) {
				await db`DELETE FROM sessions WHERE user_id = ${user.id}`
				await db`DELETE FROM users WHERE id = ${user.id}`
			}
		})

		test('register with existing email returns 409', async () => {
			const response = await fetch(`${baseUrl}/api/auth/register`, {
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
			const response = await fetch(`${baseUrl}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@example.com' }),
			})

			expect(response.status).toBe(400)
		})
	})

	describe('POST /api/auth/logout', () => {
		test('logout clears session', async () => {
			// First login to get a session
			const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
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
			const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
				method: 'POST',
				headers: { Cookie: cookies! },
			})

			expect(logoutResponse.status).toBe(200)

			const setCookie = logoutResponse.headers.get('Set-Cookie')
			expect(setCookie).toContain('Max-Age=0')
		})

		test('logout without session succeeds', async () => {
			const response = await fetch(`${baseUrl}/api/auth/logout`, {
				method: 'POST',
			})

			expect(response.status).toBe(200)
		})
	})

	describe('GET /api/auth/me', () => {
		test('returns user when authenticated', async () => {
			// Login first
			const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: testEmail,
					password: testPassword,
				}),
			})

			const cookies = loginResponse.headers.get('Set-Cookie')!

			// Call /me with session cookie
			const response = await fetch(`${baseUrl}/api/auth/me`, {
				headers: { Cookie: cookies },
			})

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data.user).toBeDefined()
			expect(data.user.email).toBe(testEmail)
		})

		test('returns null user when not authenticated', async () => {
			const response = await fetch(`${baseUrl}/api/auth/me`)

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

			const response = await fetch(`${baseUrl}/api/auth/me`, {
				headers: { Cookie: `session_token=${token}` },
			})

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data.user).toBeNull()

			const setCookie = response.headers.get('Set-Cookie')
			expect(setCookie).toContain('Max-Age=0')
		})
	})
})
