import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { PlaybookRepository } from './PlaybookRepository'
import { TeamRepository } from './TeamRepository'
import { UserRepository } from './UserRepository'
import { db } from '../connection'

describe('PlaybookRepository', () => {
	const playbookRepo = new PlaybookRepository()
	const teamRepo = new TeamRepository()
	const userRepo = new UserRepository()

	let testPlaybookId: number
	let testTeamId: number
	let testUserId: number

	beforeAll(async () => {
		const user = await userRepo.create({
			email: 'playbook-test@example.com',
			name: 'Playbook Test User',
			password_hash: '$2a$10$test.hash.placeholder',
		})
		testUserId = user.id

		const team = await teamRepo.create({
			name: 'Playbook Test Team',
		})
		testTeamId = team.id
	})

	afterAll(async () => {
		// Delete in correct order to avoid foreign key constraints
		// Delete all playbooks for the user (not just testPlaybookId)
		if (testUserId) {
			await db`DELETE FROM playbooks WHERE created_by = ${testUserId}`
		}
		if (testPlaybookId) {
			await db`DELETE FROM playbooks WHERE id = ${testPlaybookId}`
		}
		// Delete sessions for the user
		if (testUserId) {
			await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		}
		if (testTeamId) {
			await db`DELETE FROM teams WHERE id = ${testTeamId}`
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`
		}
	})

	test('create playbook', async () => {
		const playbook = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Test Playbook',
			description: 'A test playbook',
			created_by: testUserId,
		})

		expect(playbook.id).toBeGreaterThan(0)
		expect(playbook.name).toBe('Test Playbook')
		expect(playbook.team_id).toBe(testTeamId)

		testPlaybookId = playbook.id
	})

	test('get team playbooks', async () => {
		const playbooks = await playbookRepo.getTeamPlaybooks(testTeamId)

		expect(playbooks.length).toBeGreaterThan(0)
		expect(playbooks[0].id).toBe(testPlaybookId)
	})

	test('update playbook', async () => {
		const updated = await playbookRepo.update(testPlaybookId, {
			name: 'Updated Playbook',
		})

		expect(updated?.name).toBe('Updated Playbook')
	})

	test('create personal playbook (team_id: null)', async () => {
		const personalPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Personal Playbook',
			description: 'A personal playbook',
			created_by: testUserId,
		})

		expect(personalPlaybook.id).toBeGreaterThan(0)
		expect(personalPlaybook.name).toBe('Personal Playbook')
		expect(personalPlaybook.team_id).toBeNull()
		expect(personalPlaybook.created_by).toBe(testUserId)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${personalPlaybook.id}`
	})

	test('fetch personal playbooks for a user', async () => {
		// Create a personal playbook
		const personalPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'My Personal Playbook',
			description: 'Personal only',
			created_by: testUserId,
		})

		const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)

		expect(personalPlaybooks.length).toBeGreaterThan(0)
		expect(personalPlaybooks.some((p) => p.id === personalPlaybook.id)).toBe(true)
		expect(personalPlaybooks.every((p) => p.team_id === null)).toBe(true)
		expect(personalPlaybooks.every((p) => p.created_by === testUserId)).toBe(true)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${personalPlaybook.id}`
	})

	test('personal playbooks are filtered by created_by', async () => {
		// Create another user
		const otherUser = await userRepo.create({
			email: 'other-user@example.com',
			name: 'Other User',
			password_hash: '$2a$10$test.hash.placeholder',
		})

		// Create personal playbooks for both users
		const userPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'User Playbook',
			created_by: testUserId,
		})

		const otherPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Other Playbook',
			created_by: otherUser.id,
		})

		// Fetch personal playbooks for testUserId
		const userPersonalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)

		// Should only contain playbooks created by testUserId
		expect(userPersonalPlaybooks.every((p) => p.created_by === testUserId)).toBe(true)
		expect(userPersonalPlaybooks.some((p) => p.id === userPlaybook.id)).toBe(true)
		expect(userPersonalPlaybooks.some((p) => p.id === otherPlaybook.id)).toBe(false)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${userPlaybook.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('personal playbooks are ordered by most recent first', async () => {
		// Create multiple personal playbooks with delays to ensure different timestamps
		const playbook1 = await playbookRepo.create({
			team_id: null,
			name: 'First Playbook',
			created_by: testUserId,
		})

		// Add delay to ensure different timestamps (SQLite CURRENT_TIMESTAMP resolution)
		await new Promise((resolve) => setTimeout(resolve, 50))

		const playbook2 = await playbookRepo.create({
			team_id: null,
			name: 'Second Playbook',
			created_by: testUserId,
		})

		await new Promise((resolve) => setTimeout(resolve, 50))

		const playbook3 = await playbookRepo.create({
			team_id: null,
			name: 'Third Playbook',
			created_by: testUserId,
		})

		const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)

		// Find the indices of our test playbooks
		const index1 = personalPlaybooks.findIndex((p) => p.id === playbook1.id)
		const index2 = personalPlaybooks.findIndex((p) => p.id === playbook2.id)
		const index3 = personalPlaybooks.findIndex((p) => p.id === playbook3.id)

		// Most recent (playbook3) should come before older ones
		expect(index3).toBeLessThan(index2)
		expect(index2).toBeLessThan(index1)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook1.id}`
		await db`DELETE FROM playbooks WHERE id = ${playbook2.id}`
		await db`DELETE FROM playbooks WHERE id = ${playbook3.id}`
	})
})
