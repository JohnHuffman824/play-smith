import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { UserRepository } from '../db/repositories/UserRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { SectionRepository } from '../db/repositories/SectionRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'
import { startTestServer, stopTestServer } from '../../tests/helpers/test-server'

describe('Sections API', () => {
	let userRepo: UserRepository
	let teamRepo: TeamRepository
	let playbookRepo: PlaybookRepository
	let sectionRepo: SectionRepository
	let sessionRepo: SessionRepository
	let testUserId: number
	let testTeamId: number
	let testPlaybookId: number
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
		playbookRepo = new PlaybookRepository()
		sectionRepo = new SectionRepository()
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

		// Add user to team as owner
		await teamRepo.addMember({
			team_id: testTeamId,
			user_id: testUserId,
			role: 'owner'
		})

		// Create test playbook
		const playbook = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Test Playbook',
			created_by: testUserId
		})
		testPlaybookId = playbook.id

		// Create session
		const token = crypto.randomUUID()
		const session = await sessionRepo.create(testUserId, token)
		testSession = session.token
	})

	afterEach(async () => {
		// Clean up test data
		await db`DELETE FROM sections WHERE playbook_id = ${testPlaybookId}`
		await db`DELETE FROM playbooks WHERE id = ${testPlaybookId}`
		await db`DELETE FROM team_members WHERE team_id = ${testTeamId}`
		await db`DELETE FROM teams WHERE id = ${testTeamId}`
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('GET /api/playbooks/:playbookId/sections returns empty array when no sections', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/sections`, {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.sections).toBeArray()
		expect(data.sections.length).toBe(0)
	})

	test('GET /api/playbooks/:playbookId/sections returns sections ordered by display_order', async () => {
		// Create test sections
		const section1 = await sectionRepo.create(testPlaybookId, 'Section 1', 0)
		const section2 = await sectionRepo.create(testPlaybookId, 'Section 2', 1)
		const section3 = await sectionRepo.create(testPlaybookId, 'Section 3', 2)

		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/sections`, {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.sections).toBeArray()
		expect(data.sections.length).toBe(3)
		expect(data.sections[0].name).toBe('Section 1')
		expect(data.sections[1].name).toBe('Section 2')
		expect(data.sections[2].name).toBe('Section 3')
		expect(data.sections[0].display_order).toBe(0)
		expect(data.sections[1].display_order).toBe(1)
		expect(data.sections[2].display_order).toBe(2)
	})

	test('GET /api/playbooks/:playbookId/sections returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/sections`)

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})

	test('GET /api/playbooks/:playbookId/sections returns 403 when user lacks access', async () => {
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
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})

		// Try to access with test user's session
		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/sections`, {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(403)
		const data = await response.json()
		expect(data.error).toBe('Access denied')

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('GET /api/playbooks/:playbookId/sections returns 404 for non-existent playbook', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/99999/sections`, {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Playbook not found')
	})

	test('POST /api/playbooks/:playbookId/sections creates new section', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'New Section'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.section.name).toBe('New Section')
		expect(data.section.playbook_id).toBe(testPlaybookId)
		expect(data.section.display_order).toBe(0)
		expect(data.section.id).toBeNumber()
	})

	test('POST /api/playbooks/:playbookId/sections auto-increments display_order', async () => {
		// Create first section
		await sectionRepo.create(testPlaybookId, 'Section 1', 0)
		await sectionRepo.create(testPlaybookId, 'Section 2', 1)

		// Create new section via API
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'Section 3'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.section.display_order).toBe(2)
	})

	test('POST /api/playbooks/:playbookId/sections validates required name field', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toContain('name')
	})

	test('POST /api/playbooks/:playbookId/sections returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'New Section'
			})
		})

		expect(response.status).toBe(401)
	})

	test('POST /api/playbooks/:playbookId/sections returns 403 when user lacks access', async () => {
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
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})

		// Try to create section with test user's session
		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'Unauthorized Section'
			})
		})

		expect(response.status).toBe(403)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('PUT /api/sections/:sectionId updates section name', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'Original Name', 0)

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'Updated Name'
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.section.name).toBe('Updated Name')
		expect(data.section.display_order).toBe(0)
	})

	test('PUT /api/sections/:sectionId updates section display_order', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'Section', 0)

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				display_order: 5
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.section.name).toBe('Section')
		expect(data.section.display_order).toBe(5)
	})

	test('PUT /api/sections/:sectionId updates both name and display_order', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'Original', 0)

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'Updated',
				display_order: 3
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.section.name).toBe('Updated')
		expect(data.section.display_order).toBe(3)
	})

	test('PUT /api/sections/:sectionId returns 401 when not authenticated', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'Section', 0)

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'Updated'
			})
		})

		expect(response.status).toBe(401)
	})

	test('PUT /api/sections/:sectionId returns 403 when user lacks access', async () => {
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

		// Create playbook and section in other team
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})
		const otherSection = await sectionRepo.create(otherPlaybook.id, 'Other Section', 0)

		// Try to update with test user's session
		const response = await fetch(`${baseUrl}/api/sections/${otherSection.id}`, {
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
		await db`DELETE FROM sections WHERE id = ${otherSection.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('PUT /api/sections/:sectionId returns 404 for non-existent section', async () => {
		const response = await fetch(`${baseUrl}/api/sections/99999`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
			},
			body: JSON.stringify({
				name: 'Updated'
			})
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Section not found')
	})

	test('DELETE /api/sections/:sectionId deletes section', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'To Delete', 0)

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(204)

		// Verify deleted
		const deleted = await sectionRepo.findById(section.id)
		expect(deleted).toBeNull()
	})

	test('DELETE /api/sections/:sectionId returns 401 when not authenticated', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'Section', 0)

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'DELETE'
		})

		expect(response.status).toBe(401)

		// Verify not deleted
		const exists = await sectionRepo.findById(section.id)
		expect(exists).not.toBeNull()
	})

	test('DELETE /api/sections/:sectionId returns 403 when user lacks access', async () => {
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

		// Create playbook and section in other team
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})
		const otherSection = await sectionRepo.create(otherPlaybook.id, 'Protected', 0)

		// Try to delete with test user's session
		const response = await fetch(`${baseUrl}/api/sections/${otherSection.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(403)

		// Verify not deleted
		const exists = await sectionRepo.findById(otherSection.id)
		expect(exists).not.toBeNull()

		// Cleanup
		await db`DELETE FROM sections WHERE id = ${otherSection.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('DELETE /api/sections/:sectionId returns 404 for non-existent section', async () => {
		const response = await fetch(`${baseUrl}/api/sections/99999`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Section not found')
	})
})
