import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { UserRepository } from '../db/repositories/UserRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'

describe('Playbooks API', () => {
	let userRepo: UserRepository
	let teamRepo: TeamRepository
	let playbookRepo: PlaybookRepository
	let sessionRepo: SessionRepository
	let testUserId: number
	let testTeamId: number
	let testSession: string

	beforeEach(async () => {
		userRepo = new UserRepository()
		teamRepo = new TeamRepository()
		playbookRepo = new PlaybookRepository()
		sessionRepo = new SessionRepository()

		// Create test user
		const user = await userRepo.create({
			email: 'test@example.com',
			name: 'Test User',
			password_hash: 'hash'
		})
		testUserId = user.id

		// Create test team
		const team = await teamRepo.create({ name: 'Test Team' })
		testTeamId = team.id

		// Add user to team
		await teamRepo.addMember({
			team_id: testTeamId,
			user_id: testUserId,
			role: 'owner'
		})

		// Create session
		const token = crypto.randomUUID()
		const session = await sessionRepo.create(testUserId, token)
		testSession = session.token
	})

	afterEach(async () => {
		// Clean up test data
		await db`DELETE FROM playbooks WHERE team_id = ${testTeamId}`
		await db`DELETE FROM team_members WHERE team_id = ${testTeamId}`
		await db`DELETE FROM teams WHERE id = ${testTeamId}`
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('GET /api/playbooks returns user playbooks', async () => {
		// Create test playbooks
		const pb1 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Playbook 1',
			created_by: testUserId
		})
		const pb2 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Playbook 2',
			created_by: testUserId
		})

		// Make request
		const response = await fetch('http://localhost:3000/api/playbooks', {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.playbooks).toBeArray()
		expect(data.playbooks.length).toBe(2)
		expect(data.playbooks[0].name).toBe('Playbook 2') // DESC order
		expect(data.playbooks[1].name).toBe('Playbook 1')
	})
})
