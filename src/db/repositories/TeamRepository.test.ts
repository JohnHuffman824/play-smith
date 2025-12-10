import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { TeamRepository } from './TeamRepository'
import { UserRepository } from './UserRepository'
import { db } from '../connection'

describe('TeamRepository', () => {
	const teamRepo = new TeamRepository()
	const userRepo = new UserRepository()

	let testTeamId: number
	let testUserId: number

	beforeAll(async () => {
		// Create test user
		const user = await userRepo.create({
			email: 'team-test@example.com',
			name: 'Team Test User',
			password_hash: '$2a$10$test.hash.placeholder',
		})
		testUserId = user.id
	})

	afterAll(async () => {
		// Cleanup
		if (testTeamId) {
			await db`DELETE FROM teams WHERE id = ${testTeamId}`
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`
		}
	})

	test('create team', async () => {
		const team = await teamRepo.create({
			name: 'Test Team',
		})

		expect(team.id).toBeGreaterThan(0)
		expect(team.name).toBe('Test Team')

		testTeamId = team.id
	})

	test('add member to team', async () => {
		const member = await teamRepo.addMember({
			team_id: testTeamId,
			user_id: testUserId,
			role: 'owner',
		})

		expect(member.team_id).toBe(testTeamId)
		expect(member.user_id).toBe(testUserId)
		expect(member.role).toBe('owner')
	})

	test('get team members', async () => {
		const members = await teamRepo.getMembers(testTeamId)

		expect(members.length).toBe(1)
		expect(members[0].user_id).toBe(testUserId)
		expect(members[0].role).toBe('owner')
	})

	test('get user teams', async () => {
		const teams = await teamRepo.getUserTeams(testUserId)

		expect(teams.length).toBeGreaterThan(0)
		expect(teams.some(t => t.id === testTeamId)).toBe(true)
	})
})
