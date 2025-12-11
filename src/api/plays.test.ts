import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { UserRepository } from '../db/repositories/UserRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { SectionRepository } from '../db/repositories/SectionRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'
import { startTestServer, stopTestServer } from '../../tests/helpers/test-server'

describe('Plays API', () => {
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
		const { url } = await startTestServer()
		baseUrl = url
	})

	afterAll(async () => {
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

		// Add user to team
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
		await db`DELETE FROM plays WHERE playbook_id = ${testPlaybookId}`
		await db`DELETE FROM sections WHERE playbook_id = ${testPlaybookId}`
		await db`DELETE FROM playbooks WHERE id = ${testPlaybookId}`
		await db`DELETE FROM team_members WHERE team_id = ${testTeamId}`
		await db`DELETE FROM teams WHERE id = ${testTeamId}`
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('GET /api/playbooks/:playbookId/plays returns lightweight play list', async () => {
		// Create test section
		const section = await sectionRepo.create(testPlaybookId, 'Offense', 0)

		// Create test plays
		await db`INSERT INTO plays (playbook_id, name, section_id, play_type, created_by, display_order)
			VALUES
				(${testPlaybookId}, 'Play 1', ${section.id}, 'pass', ${testUserId}, 0),
				(${testPlaybookId}, 'Play 2', ${section.id}, 'run', ${testUserId}, 1),
				(${testPlaybookId}, 'Play 3', NULL, NULL, ${testUserId}, 2)`

		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/plays`, {
			headers: {
				Cookie: `session=${testSession}`
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
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/plays`)

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})

	test('GET /api/playbooks/:playbookId/plays returns 403 for unauthorized playbook', async () => {
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
		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/plays`, {
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

	test('POST /api/playbooks/:playbookId/plays creates minimal play', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'Offense', 0)

		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/plays`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
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
		expect(data.play.playbook_id).toBe(testPlaybookId)
		expect(data.play.created_by).toBe(testUserId)
	})

	test('POST /api/playbooks/:playbookId/plays creates play without section', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/plays`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
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
		const response = await fetch(`${baseUrl}/api/playbooks/${testPlaybookId}/plays`, {
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

	test('POST /api/playbooks/:playbookId/plays requires team membership', async () => {
		const otherUser = await userRepo.create({
			email: `other-post-${Date.now()}@example.com`,
			name: 'Other',
			password_hash: 'hash'
		})
		const otherTeam = await teamRepo.create({ name: 'Other Team' })
		await teamRepo.addMember({
			team_id: otherTeam.id,
			user_id: otherUser.id,
			role: 'owner'
		})
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})

		const response = await fetch(`${baseUrl}/api/playbooks/${otherPlaybook.id}/plays`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
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
		const section1 = await sectionRepo.create(testPlaybookId, 'Section 1', 0)
		const section2 = await sectionRepo.create(testPlaybookId, 'Section 2', 1)

		const [play] = await db`INSERT INTO plays (playbook_id, name, section_id, play_type, created_by, display_order)
			VALUES (${testPlaybookId}, 'Original Name', ${section1.id}, 'pass', ${testUserId}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${testSession}`
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
		const otherUser = await userRepo.create({
			email: `other-put-${Date.now()}@example.com`,
			name: 'Other',
			password_hash: 'hash'
		})
		const otherTeam = await teamRepo.create({ name: 'Other Team' })
		await teamRepo.addMember({
			team_id: otherTeam.id,
			user_id: otherUser.id,
			role: 'owner'
		})
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})
		const [play] = await db`INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${otherPlaybook.id}, 'Protected Play', ${otherUser.id}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
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
		await db`DELETE FROM plays WHERE id = ${play.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
		await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('POST /api/plays/:playId/duplicate duplicates play with copy suffix', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'Offense', 0)

		const [originalPlay] = await db`INSERT INTO plays (playbook_id, name, section_id, play_type, created_by, display_order)
			VALUES (${testPlaybookId}, 'Original Play', ${section.id}, 'pass', ${testUserId}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${originalPlay.id}/duplicate`, {
			method: 'POST',
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.play.name).toBe('Original Play (Copy)')
		expect(data.play.section_id).toBe(section.id)
		expect(data.play.play_type).toBe('pass')
		expect(data.play.playbook_id).toBe(testPlaybookId)
		expect(data.play.id).not.toBe(originalPlay.id)
	})

	test('POST /api/plays/:playId/duplicate requires team membership', async () => {
		const otherUser = await userRepo.create({
			email: `other-dup-${Date.now()}@example.com`,
			name: 'Other',
			password_hash: 'hash'
		})
		const otherTeam = await teamRepo.create({ name: 'Other Team' })
		await teamRepo.addMember({
			team_id: otherTeam.id,
			user_id: otherUser.id,
			role: 'owner'
		})
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})
		const [play] = await db`INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${otherPlaybook.id}, 'Protected Play', ${otherUser.id}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}/duplicate`, {
			method: 'POST',
			headers: {
				Cookie: `session=${testSession}`
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
			VALUES (${testPlaybookId}, 'To Delete', ${testUserId}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(204)

		// Verify deleted
		const [deleted] = await db`SELECT * FROM plays WHERE id = ${play.id}`
		expect(deleted).toBeUndefined()
	})

	test('DELETE /api/plays/:playId requires team membership', async () => {
		const otherUser = await userRepo.create({
			email: `other-del-${Date.now()}@example.com`,
			name: 'Other',
			password_hash: 'hash'
		})
		const otherTeam = await teamRepo.create({ name: 'Other Team' })
		await teamRepo.addMember({
			team_id: otherTeam.id,
			user_id: otherUser.id,
			role: 'owner'
		})
		const otherPlaybook = await playbookRepo.create({
			team_id: otherTeam.id,
			name: 'Other Playbook',
			created_by: otherUser.id
		})
		const [play] = await db`INSERT INTO plays (playbook_id, name, created_by, display_order)
			VALUES (${otherPlaybook.id}, 'Protected Play', ${otherUser.id}, 0)
			RETURNING *`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${testSession}`
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
			INSERT INTO plays (playbook_id, name, created_by, custom_players, custom_drawings)
			VALUES (
				${testPlaybookId},
				'Custom Play',
				${testUserId},
				${JSON.stringify([
					{ id: 'p1', x: 100, y: 200, label: 'WR', color: '#ff0000' }
				])},
				${JSON.stringify([
					{ id: 'd1', segments: [[{x: 100, y: 200}, {x: 150, y: 250}]], color: '#000000' }
				])}
			)
			RETURNING id
		`

		const response = await fetch(`${baseUrl}/api/plays/${play.id}`, {
			headers: { Cookie: `session=${testSession}` }
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
			INSERT INTO plays (playbook_id, name, created_by)
			VALUES (${testPlaybookId}, 'Test Play', ${testUserId})
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
			headers: { 'Content-Type': 'application/json', Cookie: `session=${testSession}` },
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
})
