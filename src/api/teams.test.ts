import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { UserRepository } from '../db/repositories/UserRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'
import { startTestServer, stopTestServer } from '../../tests/helpers/test-server'

describe('Teams API', () => {
	let userRepo: UserRepository
	let teamRepo: TeamRepository
	let sessionRepo: SessionRepository
	let testUserId: number
	let testSession: string
	let baseUrl: string

	beforeAll(async () => {
		// Start test server
		const { url } = await startTestServer()
		baseUrl = url
	})

	afterAll(async () => {
		// Stop test server
		await stopTestServer()
	})

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
		// Capture team IDs from team_members before deletion
		const teamRecords = await db`SELECT team_id FROM team_members WHERE user_id = ${testUserId}`
		const teamIds = teamRecords.map(r => r.team_id)

		await db`DELETE FROM team_members WHERE user_id = ${testUserId}`

		if (teamIds.length > 0) {
			await db`DELETE FROM teams WHERE id = ANY(${teamIds})`
		}

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

		const response = await fetch(`${baseUrl}/api/teams`, {
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
