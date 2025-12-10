import { describe, test, expect, beforeEach } from 'bun:test'
import { FormationRepository } from '../../../src/db/repositories/FormationRepository'
import { db } from '../../../src/db/connection'

describe('FormationRepository', () => {
	const repo = new FormationRepository()
	let testTeamId: number
	let testUserId: number

	beforeEach(async () => {
		// Create test team
		const [team] = await db`
			INSERT INTO teams (name) VALUES ('Test Team')
			RETURNING id
		`
		testTeamId = team.id

		// Create test user (password_hash required)
		const [user] = await db`
			INSERT INTO users (email, name, password_hash)
			VALUES ('test@example.com', 'Test User', 'dummy_hash_for_testing')
			RETURNING id
		`
		testUserId = user.id
	})

	describe('create', () => {
		test('creates formation with positions', async () => {
			const formationData = {
				team_id: testTeamId,
				name: 'Trips Right',
				description: 'Three receivers to the right',
				created_by: testUserId,
				positions: [
					{ role: 'x', position_x: -20, position_y: 10, hash_relative: false },
					{ role: 'y', position_x: 0, position_y: 10, hash_relative: false },
					{ role: 'z', position_x: 10, position_y: 5, hash_relative: false }
				]
			}

			const result = await repo.create(formationData)

			// Verify formation created
			expect(result.id).toBeGreaterThan(0)
			expect(result.team_id).toBe(testTeamId)
			expect(result.name).toBe('Trips Right')
			expect(result.description).toBe('Three receivers to the right')

			// Verify positions created
			expect(result.positions).toHaveLength(3)
			expect(result.positions[0].role).toBe('x')
			expect(result.positions[0].position_x).toBe(-20)
			expect(result.positions[0].position_y).toBe(10)
			expect(result.positions[0].hash_relative).toBe(false)
		})

		test('creates formation without description', async () => {
			const formationData = {
				team_id: testTeamId,
				name: 'I-Formation',
				created_by: testUserId,
				positions: [
					{ role: 'rb', position_x: 0, position_y: -5, hash_relative: false }
				]
			}

			const result = await repo.create(formationData)

			expect(result.name).toBe('I-Formation')
			expect(result.description).toBeNull()
			expect(result.positions).toHaveLength(1)
		})

		test('creates positions with hash_relative flag', async () => {
			const formationData = {
				team_id: testTeamId,
				name: 'Spread',
				created_by: testUserId,
				positions: [
					{ role: 'x', position_x: -20, position_y: 10, hash_relative: true }
				]
			}

			const result = await repo.create(formationData)

			expect(result.positions[0].hash_relative).toBe(true)
		})

		test('throws error when formation creation fails', async () => {
			const invalidData = {
				team_id: 99999, // Non-existent team
				name: 'Invalid',
				created_by: testUserId,
				positions: []
			}

			await expect(repo.create(invalidData)).rejects.toThrow()
		})
	})

	describe('findById', () => {
		test('returns formation with positions', async () => {
			// Create formation first
			const created = await repo.create({
				team_id: testTeamId,
				name: 'Test Formation',
				created_by: testUserId,
				positions: [
					{ role: 'x', position_x: -20, position_y: 10, hash_relative: false },
					{ role: 'y', position_x: 0, position_y: 10, hash_relative: false }
				]
			})

			const result = await repo.findById(created.id)

			expect(result).not.toBeNull()
			expect(result!.id).toBe(created.id)
			expect(result!.name).toBe('Test Formation')
			expect(result!.positions).toHaveLength(2)
		})

		test('returns null for non-existent formation', async () => {
			const result = await repo.findById(99999)

			expect(result).toBeNull()
		})

		test('returns null for invalid ID', async () => {
			const result = await repo.findById(-1)

			expect(result).toBeNull()
		})
	})

	describe('getTeamFormations', () => {
		test('returns all formations for a team', async () => {
			// Create multiple formations
			await repo.create({
				team_id: testTeamId,
				name: 'Formation 1',
				created_by: testUserId,
				positions: [{ role: 'x', position_x: 0, position_y: 0, hash_relative: false }]
			})

			await repo.create({
				team_id: testTeamId,
				name: 'Formation 2',
				created_by: testUserId,
				positions: [{ role: 'y', position_x: 0, position_y: 0, hash_relative: false }]
			})

			const results = await repo.getTeamFormations(testTeamId)

			expect(results.length).toBeGreaterThanOrEqual(2)
			expect(results.every(f => f.team_id === testTeamId)).toBe(true)
			// Should be ordered by created_at DESC
			expect(results[0].name).toBe('Formation 2')
			expect(results[1].name).toBe('Formation 1')
		})

		test('returns empty array for team with no formations', async () => {
			// Create another team with no formations
			const [newTeam] = await db`
				INSERT INTO teams (name) VALUES ('Empty Team')
				RETURNING id
			`

			const results = await repo.getTeamFormations(newTeam.id)

			expect(results).toEqual([])
		})

		test('filters by team_id correctly', async () => {
			// Create formation for testTeam
			await repo.create({
				team_id: testTeamId,
				name: 'Team 1 Formation',
				created_by: testUserId,
				positions: [{ role: 'x', position_x: 0, position_y: 0, hash_relative: false }]
			})

			// Create another team and formation
			const [team2] = await db`
				INSERT INTO teams (name) VALUES ('Team 2')
				RETURNING id
			`

			await repo.create({
				team_id: team2.id,
				name: 'Team 2 Formation',
				created_by: testUserId,
				positions: [{ role: 'x', position_x: 0, position_y: 0, hash_relative: false }]
			})

			const results = await repo.getTeamFormations(testTeamId)

			expect(results.every(f => f.team_id === testTeamId)).toBe(true)
			expect(results.some(f => f.name === 'Team 2 Formation')).toBe(false)
		})
	})

	describe('update', () => {
		test('updates formation name', async () => {
			const created = await repo.create({
				team_id: testTeamId,
				name: 'Original Name',
				created_by: testUserId,
				positions: [{ role: 'x', position_x: 0, position_y: 0, hash_relative: false }]
			})

			await repo.update(created.id, { name: 'Updated Name' })

			const updated = await repo.findById(created.id)
			expect(updated!.name).toBe('Updated Name')
		})

		test('updates formation description', async () => {
			const created = await repo.create({
				team_id: testTeamId,
				name: 'Test',
				created_by: testUserId,
				positions: [{ role: 'x', position_x: 0, position_y: 0, hash_relative: false }]
			})

			await repo.update(created.id, { description: 'New description' })

			const updated = await repo.findById(created.id)
			expect(updated!.description).toBe('New description')
		})

		test('replaces positions when provided', async () => {
			const created = await repo.create({
				team_id: testTeamId,
				name: 'Test',
				created_by: testUserId,
				positions: [
					{ role: 'x', position_x: -20, position_y: 10, hash_relative: false },
					{ role: 'y', position_x: 0, position_y: 10, hash_relative: false }
				]
			})

			await repo.update(created.id, {
				name: 'Updated',
				positions: [
					{ role: 'z', position_x: 10, position_y: 5, hash_relative: true }
				]
			})

			const updated = await repo.findById(created.id)
			expect(updated!.positions).toHaveLength(1)
			expect(updated!.positions[0].role).toBe('z')
			expect(updated!.positions[0].position_x).toBe(10)
			expect(updated!.positions[0].hash_relative).toBe(true)
		})

		test('throws error for invalid formation ID', async () => {
			await expect(
				repo.update(99999, { name: 'Test' })
			).rejects.toThrow()
		})
	})

	describe('delete', () => {
		test('deletes formation and cascades to positions', async () => {
			const created = await repo.create({
				team_id: testTeamId,
				name: 'To Delete',
				created_by: testUserId,
				positions: [
					{ role: 'x', position_x: -20, position_y: 10, hash_relative: false },
					{ role: 'y', position_x: 0, position_y: 10, hash_relative: false }
				]
			})

			await repo.delete(created.id)

			const deleted = await repo.findById(created.id)
			expect(deleted).toBeNull()

			// Verify positions also deleted
			const positions = await db`
				SELECT * FROM formation_player_positions
				WHERE formation_id = ${created.id}
			`
			expect(positions).toHaveLength(0)
		})

		test('throws error for non-existent formation', async () => {
			await expect(repo.delete(99999)).rejects.toThrow()
		})

		test('throws error for invalid ID', async () => {
			await expect(repo.delete(-1)).rejects.toThrow()
		})
	})
})
