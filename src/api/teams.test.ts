import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { UserRepository } from '../db/repositories/UserRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'

describe('Teams API', () => {
	let userRepo: UserRepository
	let teamRepo: TeamRepository
	let sessionRepo: SessionRepository
	let testUserId: number
	let testSession: string

	beforeEach(async () => {
		userRepo = new UserRepository()
		teamRepo = new TeamRepository()
		sessionRepo = new SessionRepository()

		const user = await userRepo.create({
			email: `test-${Date.now()}@example.com`,
			name: 'Test User',
			password_hash: 'hash'
		})
		testUserId = user.id

		const token = crypto.randomUUID()
		const session = await sessionRepo.create(testUserId, token)
		testSession = session.token
	})

	afterEach(async () => {
		await db`DELETE FROM team_members WHERE user_id = ${testUserId}`
		await db`DELETE FROM teams WHERE id IN (
			SELECT team_id FROM team_members WHERE user_id = ${testUserId}
		)`
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('GET /api/teams returns user teams', async () => {
		// Create teams
		const team1 = await teamRepo.create({ name: 'Team 1' })
		const team2 = await teamRepo.create({ name: 'Team 2' })

		await teamRepo.addMember({
			team_id: team1.id,
			user_id: testUserId,
			role: 'owner'
		})
		await teamRepo.addMember({
			team_id: team2.id,
			user_id: testUserId,
			role: 'editor'
		})

		const response = await fetch('http://localhost:3000/api/teams', {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.teams).toBeArray()
		expect(data.teams.length).toBe(2)
	})
})
