import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { UserRepository } from './UserRepository'
import { db } from '../connection'

describe('UserRepository', () => {
	const repo = new UserRepository()
	let testUserId: number
	const testEmail = `test-${Date.now()}@example.com`

	afterAll(async () => {
		// Cleanup
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`
		}
	})

	test('create user', async () => {
		const user = await repo.create({
			email: testEmail,
			name: 'Test User',
			password_hash: '$2a$10$test.hash.placeholder',
		})

		expect(user.id).toBeGreaterThan(0)
		expect(user.email).toBe(testEmail)
		expect(user.name).toBe('Test User')

		testUserId = user.id
	})

	test('find user by id', async () => {
		const user = await repo.findById(testUserId)

		expect(user).toBeDefined()
		expect(user?.email).toBe(testEmail)
	})

	test('find user by email', async () => {
		const user = await repo.findByEmail(testEmail)

		expect(user).toBeDefined()
		expect(user?.id).toBe(testUserId)
	})

	test('find non-existent user returns null', async () => {
		const user = await repo.findById(999999)
		expect(user).toBeNull()
	})
})
