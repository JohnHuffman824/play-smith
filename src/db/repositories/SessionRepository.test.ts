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
