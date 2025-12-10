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
			email: `test-${Date.now()}@example.com`,
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

	test('GET /api/playbooks/:id returns single playbook', async () => {
		const pb = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Test Playbook',
			description: 'Test description',
			created_by: testUserId
		})

		const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.playbook.id).toBe(pb.id)
		expect(data.playbook.name).toBe('Test Playbook')
		expect(data.playbook.description).toBe('Test description')
	})

	test('GET /api/playbooks/:id returns 404 for non-existent playbook', async () => {
		const response = await fetch('http://localhost:3000/api/playbooks/99999', {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Playbook not found')
	})

	test('GET /api/playbooks/:id returns 403 for unauthorized access', async () => {
		// Create another user and team
		const otherUser = await userRepo.create({
			email: `other-${Date.now()}@example.com`,
			name: 'Other User',
			password_hash: 'hash'
		})
		const otherTeam = await teamRepo.create({ name: 'Other Team' })
		await teamRepo.addMember({
			team_id: otherTeam.id,
			user_id: otherUser.id,
			role: 'owner'
		})

		// Create playbook in other team
		const pb = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})

		// Try to access with test user's session
		const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(403)
		const data = await response.json()
		expect(data.error).toBe('Access denied')

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${pb.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('POST /api/playbooks creates new playbook', async () => {
		const response = await fetch('http://localhost:3000/api/playbooks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				team_id: testTeamId,
				name: 'New Playbook',
				description: 'New description'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.playbook.name).toBe('New Playbook')
		expect(data.playbook.description).toBe('New description')
		expect(data.playbook.team_id).toBe(testTeamId)
		expect(data.playbook.created_by).toBe(testUserId)
	})

	test('POST /api/playbooks validates required fields', async () => {
		const response = await fetch('http://localhost:3000/api/playbooks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				team_id: testTeamId
				// Missing name
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toContain('name')
	})

	test('POST /api/playbooks requires team membership', async () => {
		const otherTeam = await teamRepo.create({ name: 'Other Team' })

		const response = await fetch('http://localhost:3000/api/playbooks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				team_id: otherTeam.id,
				name: 'Unauthorized Playbook'
			})
		})

		expect(response.status).toBe(403)
		const data = await response.json()
		expect(data.error).toBe('Not a member of this team')

		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
	})

	test('PUT /api/playbooks/:id updates playbook', async () => {
		const pb = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Original Name',
			created_by: testUserId
		})

		const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'Updated Name',
				description: 'Updated description'
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.playbook.name).toBe('Updated Name')
		expect(data.playbook.description).toBe('Updated description')
	})

	test('PUT /api/playbooks/:id requires team membership', async () => {
		const otherUser = await userRepo.create({
			email: `other-update-${Date.now()}@example.com`,
			name: 'Other',
			password_hash: 'hash'
		})
		const otherTeam = await teamRepo.create({ name: 'Other Team' })
		await teamRepo.addMember({
			team_id: otherTeam.id,
			user_id: otherUser.id,
			role: 'owner'
		})

		const pb = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})

		const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'Hacked Name'
			})
		})

		expect(response.status).toBe(403)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${pb.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('DELETE /api/playbooks/:id deletes playbook', async () => {
		const pb = await playbookRepo.create({
			team_id: testTeamId,
			name: 'To Delete',
			created_by: testUserId
		})

		const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(204)

		// Verify deleted
		const deleted = await playbookRepo.findById(pb.id)
		expect(deleted).toBeNull()
	})

	test('DELETE /api/playbooks/:id requires team membership', async () => {
		const otherUser = await userRepo.create({
			email: `other-delete-${Date.now()}@example.com`,
			name: 'Other',
			password_hash: 'hash'
		})
		const otherTeam = await teamRepo.create({ name: 'Other Team' })
		await teamRepo.addMember({
			team_id: otherTeam.id,
			user_id: otherUser.id,
			role: 'owner'
		})

		const pb = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Protected',
			created_by: otherUser.id
		})

		const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(403)

		// Verify NOT deleted
		const exists = await playbookRepo.findById(pb.id)
		expect(exists).not.toBeNull()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${pb.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})
})
