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
		const testEmail = `integration-test-${Date.now()}@example.com`
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
			email: `expiry-test-${Date.now()}@example.com`,
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
			email: `hash-test-${Date.now()}@example.com`,
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
