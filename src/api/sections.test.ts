import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { startTestServer, stopTestServer } from '../../tests/helpers/test-server'
import {
	createTestFixture,
	cleanupTestFixture,
	cleanupTestData,
	createTestUser,
	createTestTeam,
	addTeamMember,
	createTestPlaybook,
	createTestSection,
	type TestFixtures
} from '../../tests/helpers/factories'

describe('Sections API', () => {
	let fixture: TestFixtures
	let baseUrl: string

	beforeAll(async () => {
		// Start test server once
		const { url } = await startTestServer()
		baseUrl = url

		// Create shared fixture (user, team, playbook, session)
		fixture = await createTestFixture()
	})

	afterAll(async () => {
		// Clean up shared fixture
		await cleanupTestFixture(fixture)
		// Additional cleanup to prevent test pollution
		await db`DELETE FROM playbook_shares WHERE playbook_id = ${fixture.playbookId}`
		await stopTestServer()
	})

	afterEach(async () => {
		// Clean up test-specific data between tests
		await cleanupTestData(fixture.playbookId)
	})

	test('GET /api/playbooks/:playbookId/sections returns only Ideas section when no custom sections', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/sections`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.sections).toBeArray()
		expect(data.sections.length).toBe(1)
		expect(data.sections[0].name).toBe('Ideas')
		expect(data.sections[0].section_type).toBe('ideas')
	})

	test('GET /api/playbooks/:playbookId/sections returns sections ordered by display_order', async () => {
		// Ideas section already exists at display_order 0, create additional sections
		await createTestSection({ playbookId: fixture.playbookId, name: 'Section 1', displayOrder: 1 })
		await createTestSection({ playbookId: fixture.playbookId, name: 'Section 2', displayOrder: 2 })
		await createTestSection({ playbookId: fixture.playbookId, name: 'Section 3', displayOrder: 3 })

		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/sections`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.sections).toBeArray()
		expect(data.sections.length).toBe(4)
		expect(data.sections[0].name).toBe('Ideas')
		expect(data.sections[1].name).toBe('Section 1')
		expect(data.sections[2].name).toBe('Section 2')
		expect(data.sections[3].name).toBe('Section 3')
		expect(data.sections[0].display_order).toBe(0)
		expect(data.sections[1].display_order).toBe(1)
		expect(data.sections[2].display_order).toBe(2)
		expect(data.sections[3].display_order).toBe(3)
	})

	test('GET /api/playbooks/:playbookId/sections returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/sections`)

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})

	test('GET /api/playbooks/:playbookId/sections returns 403 when user lacks access', async () => {
		// Create another user and team
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')

		// Create playbook in other team
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})

		// Try to access with test user's session
		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/sections`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
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
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Playbook not found')
	})

	test('POST /api/playbooks/:playbookId/sections creates new section', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'New Section'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.section.name).toBe('New Section')
		expect(data.section.playbook_id).toBe(fixture.playbookId)
		expect(data.section.display_order).toBe(1) // Ideas section is at 0
		expect(data.section.id).toBeNumber()
	})

	test('POST /api/playbooks/:playbookId/sections auto-increments display_order', async () => {
		// Ideas section is at display_order 0, create additional sections
		await createTestSection({ playbookId: fixture.playbookId, name: 'Section 1', displayOrder: 1 })
		await createTestSection({ playbookId: fixture.playbookId, name: 'Section 2', displayOrder: 2 })

		// Create new section via API - should get next display_order
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Section 3'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.section.display_order).toBe(3)
	})

	test('POST /api/playbooks/:playbookId/sections validates required name field', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toContain('name')
	})

	test('POST /api/playbooks/:playbookId/sections returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/sections`, {
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
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')

		// Create playbook in other team
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})

		// Try to create section with test user's session
		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/sections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
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
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Original Name', displayOrder: 1 })

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Updated Name'
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.section.name).toBe('Updated Name')
		expect(data.section.display_order).toBe(1)
	})

	test('PUT /api/sections/:sectionId updates section display_order', async () => {
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Section', displayOrder: 1 })

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
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
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Original', displayOrder: 1 })

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
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
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Section', displayOrder: 1 })

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
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')

		// Create playbook and section in other team
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})
		const otherSection = await createTestSection({ playbookId: otherPlaybook.id, name: 'Other Section', displayOrder: 1 })

		// Try to update with test user's session
		const response = await fetch(`${baseUrl}/api/sections/${otherSection.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
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
				Cookie: `session_token=${fixture.sessionToken}`
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
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'To Delete', displayOrder: 1 })

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(204)

		// Verify deleted
		const [deleted] = await db`SELECT * FROM sections WHERE id = ${section.id}`
		expect(deleted).toBeUndefined()
	})

	test('DELETE /api/sections/:sectionId returns 401 when not authenticated', async () => {
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Section', displayOrder: 1 })

		const response = await fetch(`${baseUrl}/api/sections/${section.id}`, {
			method: 'DELETE'
		})

		expect(response.status).toBe(401)

		// Verify not deleted
		const [exists] = await db`SELECT * FROM sections WHERE id = ${section.id}`
		expect(exists).toBeDefined()
	})

	test('DELETE /api/sections/:sectionId returns 403 when user lacks access', async () => {
		// Create another user and team
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')

		// Create playbook and section in other team
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})
		const otherSection = await createTestSection({ playbookId: otherPlaybook.id, name: 'Protected', displayOrder: 1 })

		// Try to delete with test user's session
		const response = await fetch(`${baseUrl}/api/sections/${otherSection.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(403)

		// Verify not deleted
		const [exists] = await db`SELECT * FROM sections WHERE id = ${otherSection.id}`
		expect(exists).toBeDefined()

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
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Section not found')
	})
})
