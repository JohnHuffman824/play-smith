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
	type TestFixtures
} from '../../tests/helpers/factories'

describe('Playbooks API', () => {
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
		await stopTestServer()
	})

	afterEach(async () => {
		// Clean up test-specific data between tests
		await cleanupTestData(fixture.playbookId)
	})

	test('GET /api/playbooks returns user playbooks', async () => {
		// Create additional test playbook (fixture already has one)
		const pb2 = await createTestPlaybook({
			teamId: fixture.teamId,
			name: 'Playbook 2',
			createdBy: fixture.userId
		})

		// Make request
		const response = await fetch(`${baseUrl}/api/playbooks`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.playbooks).toBeArray()
		expect(data.playbooks.length).toBe(2)
		expect(data.playbooks[0].name).toBe('Playbook 2') // DESC order

		// Cleanup additional playbook
		await db`DELETE FROM playbooks WHERE id = ${pb2.id}`
	})

	test('GET /api/playbooks/:id returns single playbook', async () => {
		// Use fixture playbook
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.playbook.id).toBe(fixture.playbookId)
		expect(data.playbook.name).toBeDefined()
	})

	test('GET /api/playbooks/:id returns 404 for non-existent playbook', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/99999`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Playbook not found')
	})

	test('GET /api/playbooks/:id returns 403 for unauthorized access', async () => {
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
		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}`, {
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

	test('POST /api/playbooks creates new playbook', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				team_id: fixture.teamId,
				name: 'New Playbook',
				description: 'New description'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.playbook.name).toBe('New Playbook')
		expect(data.playbook.description).toBe('New description')
		expect(data.playbook.team_id).toBe(fixture.teamId)
		expect(data.playbook.created_by).toBe(fixture.userId)
	})

	test('POST /api/playbooks validates required fields', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				team_id: fixture.teamId
				// Missing name
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toContain('name')
	})

	test('POST /api/playbooks requires team membership', async () => {
		const otherTeam = await createTestTeam()

		const response = await fetch(`${baseUrl}/api/playbooks`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
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
		const pb = await createTestPlaybook({
			teamId: fixture.teamId,
			name: 'Original Name',
			createdBy: fixture.userId
		})

		const response = await fetch(`${baseUrl}/api/playbooks/${pb.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
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

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${pb.id}`
	})

	test('PUT /api/playbooks/:id requires team membership', async () => {
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')

		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})

		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}`, {
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
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('DELETE /api/playbooks/:id deletes playbook', async () => {
		const pb = await createTestPlaybook({
			teamId: fixture.teamId,
			name: 'To Delete',
			createdBy: fixture.userId
		})

		const response = await fetch(`${baseUrl}/api/playbooks/${pb.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(204)

		// Verify deleted
		const [deleted] = await db`SELECT * FROM playbooks WHERE id = ${pb.id}`
		expect(deleted).toBeUndefined()
	})

	test('DELETE /api/playbooks/:id requires team membership', async () => {
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')

		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Protected',
			createdBy: otherUser.id
		})

		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(403)

		// Verify NOT deleted
		const [exists] = await db`SELECT * FROM playbooks WHERE id = ${otherPlaybook.id}`
		expect(exists).toBeDefined()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})
})
