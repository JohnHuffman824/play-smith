import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { startTestServer, stopTestServer } from '../../tests/helpers/test-server'
import {
	createTestFixture,
	cleanupTestFixture,
	cleanupTestData,
	createTestSection,
	createTestUser,
	createTestTeam,
	addTeamMember,
	createTestPlaybook,
	type TestFixtures
} from '../../tests/helpers/factories'

describe('Plays API', () => {
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

	test('GET /api/playbooks/:playbookId/plays returns lightweight play list', async () => {
		// Create test section
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Offense' })

		// Create test plays
		await db`INSERT INTO plays (playbook_id, name, section_id, play_type, created_by, display_order)
			VALUES
				(${fixture.playbookId}, 'Play 1', ${section.id}, 'pass', ${fixture.userId}, 0),
				(${fixture.playbookId}, 'Play 2', ${section.id}, 'run', ${fixture.userId}, 1),
				(${fixture.playbookId}, 'Play 3', NULL, NULL, ${fixture.userId}, 2)`

		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/plays`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.plays).toBeArray()
		expect(data.plays.length).toBe(3)

		// Verify lightweight data (no geometry)
		const play = data.plays[0]
		expect(play).toHaveProperty('id')
		expect(play).toHaveProperty('name')
		expect(play).toHaveProperty('section_id')
		expect(play).toHaveProperty('play_type')
		expect(play).toHaveProperty('updated_at')

		// Should NOT have geometry or other heavy fields
		expect(play).not.toHaveProperty('geometry')
		expect(play).not.toHaveProperty('notes')
	})

	test('GET /api/playbooks/:playbookId/plays returns 401 without auth', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/plays`)

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})

	test('GET /api/playbooks/:playbookId/plays returns 403 for unauthorized playbook', async () => {
		// Create another user and team with their own playbook
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})

		// Try to access with test user's session
		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/plays`, {
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

	test('POST /api/playbooks/:playbookId/plays creates minimal play', async () => {
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Offense' })

		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/plays`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'New Play',
				section_id: section.id
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.play.name).toBe('New Play')
		expect(data.play.section_id).toBe(section.id)
		expect(data.play.playbook_id).toBe(fixture.playbookId)
		expect(data.play.created_by).toBe(fixture.userId)
	})

	test('POST /api/playbooks/:playbookId/plays creates play without section', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/plays`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Unsectioned Play'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.play.name).toBe('Unsectioned Play')
		expect(data.play.section_id).toBeNull()
	})

	test('POST /api/playbooks/:playbookId/plays validates required fields', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/plays`, {
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

	test('POST /api/playbooks/:playbookId/plays requires team membership', async () => {
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})

		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/plays`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Unauthorized Play'
			})
		})

		expect(response.status).toBe(403)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('PUT /api/plays/:playId updates play fields', async () => {
		const section1 = await createTestSection({ playbookId: fixture.playbookId, name: 'Section 1' })
		const section2 = await createTestSection({ playbookId: fixture.playbookId, name: 'Section 2', displayOrder: 1 })

		const [play] = await db`INSERT INTO plays (playbook_id, name, section_id, play_type, created_by, display_order)
			VALUES (${fixture.playbookId}, 'Original Name', ${section1.id}, 'pass', ${fixture.userId}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Updated Name',
				section_id: section2.id,
				play_type: 'run'
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.play.name).toBe('Updated Name')
		expect(data.play.section_id).toBe(section2.id)
		expect(data.play.play_type).toBe('run')
	})

	test('PUT /api/plays/:playId requires team membership', async () => {
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})
		const [play] = await db`INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${otherPlaybook.id}, 'Protected Play', ${otherUser.id}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
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
		await db`DELETE FROM plays WHERE id = ${play.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('POST /api/plays/:playId/duplicate duplicates play with copy suffix', async () => {
		const section = await createTestSection({ playbookId: fixture.playbookId, name: 'Offense' })

		const [originalPlay] = await db`INSERT INTO plays (playbook_id, name, section_id, play_type, created_by, display_order)
			VALUES (${fixture.playbookId}, 'Original Play', ${section.id}, 'pass', ${fixture.userId}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${originalPlay.id}/duplicate`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.play.name).toBe('Original Play (Copy)')
		expect(data.play.section_id).toBe(section.id)
		expect(data.play.play_type).toBe('pass')
		expect(data.play.playbook_id).toBe(fixture.playbookId)
		expect(data.play.id).not.toBe(originalPlay.id)
	})

	test('POST /api/plays/:playId/duplicate requires team membership', async () => {
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})
		const [play] = await db`INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${otherPlaybook.id}, 'Protected Play', ${otherUser.id}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}/duplicate`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(403)

		// Cleanup
		await db`DELETE FROM plays WHERE playbook_id = ${otherPlaybook.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('DELETE /api/plays/:playId deletes play', async () => {
		const [play] = await db`INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${fixture.playbookId}, 'To Delete', ${fixture.userId}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(204)

		// Verify deleted
		const [deleted] = await db`SELECT * FROM plays WHERE id = ${play.id}`
		expect(deleted).toBeUndefined()
	})

	test('DELETE /api/plays/:playId requires team membership', async () => {
		const otherUser = await createTestUser()
		const otherTeam = await createTestTeam()
		await addTeamMember(otherTeam.id, otherUser.id, 'owner')
		const otherPlaybook = await createTestPlaybook({
			teamId: otherTeam.id,
			name: 'Other Playbook',
			createdBy: otherUser.id
		})
		const [play] = await db`INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${otherPlaybook.id}, 'Protected Play', ${otherUser.id}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(403)

		// Verify NOT deleted
		const [exists] = await db`SELECT * FROM plays WHERE id = ${play.id}`
		expect(exists).toBeDefined()

		// Cleanup
		await db`DELETE FROM plays WHERE id = ${play.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('GET /api/plays/:playId returns custom players, drawings, and teamId', async () => {
		// Create a play with custom data
		const [play] = await db`
			INSERT INTO plays (playbook_id, name, created_by, custom_players, custom_drawings, display_order)
			VALUES (
				${fixture.playbookId},
				'Custom Play',
				${fixture.userId},
				${JSON.stringify([
					{ id: 'p1', x: 100, y: 200, label: 'WR', color: '#ff0000' }
				])},
				${JSON.stringify([
					{ id: 'd1', segments: [[{x: 100, y: 200}, {x: 150, y: 250}]], color: '#000000' }
				])},
				0
			)
			RETURNING id
		`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			headers: { Cookie: `session_token=${fixture.sessionToken}` }
		})

		expect(response.status).toBe(200)
		const data = await response.json()

		// Verify teamId is returned (via playbook join)
		expect(data.play.teamId).toBeDefined()

		// Verify custom players
		expect(data.play.players).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'p1', x: 100, y: 200, label: 'WR' })
			])
		)

		// Verify custom drawings
		expect(data.play.drawings).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'd1', color: '#000000' })
			])
		)
	})

	test('PUT /api/plays/:playId saves custom players and drawings', async () => {
		const [play] = await db`
			INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${fixture.playbookId}, 'Test Play', ${fixture.userId}, 0)
			RETURNING id
		`

		const customPlayers = [
			{ id: 'p1', x: 100, y: 200, label: 'QB', color: '#0000ff' }
		]
		const customDrawings = [
			{ id: 'd1', segments: [[{x: 100, y: 200}, {x: 150, y: 250}]], color: '#000000' }
		]

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Cookie: `session_token=${fixture.sessionToken}` },
			body: JSON.stringify({ custom_players: customPlayers, custom_drawings: customDrawings })
		})

		expect(response.status).toBe(200)

		const [saved] = await db`SELECT custom_players, custom_drawings FROM plays WHERE id = ${play.id}`
		const savedPlayers = typeof saved.custom_players === 'string'
			? JSON.parse(saved.custom_players)
			: saved.custom_players
		const savedDrawings = typeof saved.custom_drawings === 'string'
			? JSON.parse(saved.custom_drawings)
			: saved.custom_drawings
		expect(savedPlayers).toEqual(customPlayers)
		expect(savedDrawings).toEqual(customDrawings)
	})

	test('PUT /api/plays/:playId returns JSON error on database failure', async () => {
		// Use a non-existent play ID to trigger database error
		const nonExistentPlayId = 999999

		const response = await fetch(`${baseUrl}/api/plays/${nonExistentPlayId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Updated Name'
			})
		})

		// Should return JSON error, not HTML
		expect(response.status).toBe(404)
		expect(response.headers.get('content-type')).toContain('application/json')

		const data = await response.json()
		expect(data.error).toBeDefined()
		expect(data.error).toBeTypeOf('string')
	})

	test('PUT /api/plays/:playId returns JSON error on malformed JSON', async () => {
		const [play] = await db`
			INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${fixture.playbookId}, 'Test Play', ${fixture.userId}, 0)
			RETURNING id
		`

		// Send malformed JSON
		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: '{invalid json'
		})

		// Should return 500 with JSON error, not HTML
		expect(response.status).toBe(500)
		expect(response.headers.get('content-type')).toContain('application/json')

		const data = await response.json()
		expect(data.error).toBeDefined()
		expect(data.error).toBeTypeOf('string')
	})

	test('PUT then GET /api/plays/:playId persists and returns custom players', async () => {
		// Create a play
		const [play] = await db`
			INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${fixture.playbookId}, 'Test Play', ${fixture.userId}, 0)
			RETURNING id
		`

		const customPlayers = [
			{ id: 'player-1', x: 50, y: 50, label: 'QB', color: '#ff0000' },
			{ id: 'player-2', x: 100, y: 100, label: 'WR', color: '#00ff00' }
		]

		// Save players via PUT
		const putResponse = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Cookie: `session_token=${fixture.sessionToken}` },
			body: JSON.stringify({ custom_players: customPlayers })
		})

		expect(putResponse.status).toBe(200)

		// Reload via GET
		const getResponse = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			headers: { Cookie: `session_token=${fixture.sessionToken}` }
		})

		expect(getResponse.status).toBe(200)
		const data = await getResponse.json()

		// Verify players are returned
		expect(data.play.players).toBeDefined()
		expect(data.play.players.length).toBe(2)
		expect(data.play.players).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'player-1', x: 50, y: 50, label: 'QB', color: '#ff0000' }),
				expect.objectContaining({ id: 'player-2', x: 100, y: 100, label: 'WR', color: '#00ff00' })
			])
		)
	})
})
