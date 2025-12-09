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
