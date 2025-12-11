import { describe, test, expect, beforeEach } from 'bun:test'
import {
	ConceptGroupRepository
} from '../../../src/db/repositories/ConceptGroupRepository'
import {
	FormationRepository
} from '../../../src/db/repositories/FormationRepository'
import {
	BaseConceptRepository
} from '../../../src/db/repositories/BaseConceptRepository'
import { db } from '../../../src/db/connection'
import type { Drawing } from '../../../src/types/drawing.types'

describe('ConceptGroupRepository', () => {
	const repo = new ConceptGroupRepository()
	const formationRepo = new FormationRepository()
	const conceptRepo = new BaseConceptRepository()

	let testTeamId: number
	let testPlaybookId: number
	let testUserId: number
	let testFormationId: number
	let testConcept1Id: number
	let testConcept2Id: number

	const sampleDrawing: Drawing = {
		id: 'test-drawing-1',
		type: 'path',
		points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
		style: {
			color: '#000000',
			lineWidth: 2,
			lineStyle: 'solid',
			lineEnd: 'arrow'
		}
	}

	beforeEach(async () => {
		// Create test team
		const teamName = `Test Team ${Date.now()}-${Math.random()}`
		const [team] = await db`
			INSERT INTO teams (name) VALUES (${teamName})
			RETURNING id
		`
		testTeamId = team.id

		// Create test user
		const userEmail = `test-${Date.now()}-${Math.random()}@example.com`
		const [user] = await db`
			INSERT INTO users (email, name, password_hash)
			VALUES (${userEmail}, 'Test User', 'dummy_hash')
			RETURNING id
		`
		testUserId = user.id

		// Create test playbook
		const [playbook] = await db`
			INSERT INTO playbooks (team_id, name, created_by)
			VALUES (${testTeamId}, 'Test Playbook', ${testUserId})
			RETURNING id
		`
		testPlaybookId = playbook.id

		// Create test formation
		const formation = await formationRepo.create({
			team_id: testTeamId,
			name: 'Test Formation',
			created_by: testUserId,
			positions: [
				{ role: 'x', position_x: -20, position_y: 10, hash_relative: false },
				{ role: 'y', position_x: 0, position_y: 10, hash_relative: false }
			]
		})
		testFormationId = formation.id

		// Create test concepts
		const concept1 = await conceptRepo.create({
			team_id: testTeamId,
			playbook_id: null,
			name: 'Mesh',
			targeting_mode: 'absolute_role',
			created_by: testUserId,
			assignments: [
				{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }
			]
		})
		testConcept1Id = concept1.id

		const concept2 = await conceptRepo.create({
			team_id: testTeamId,
			playbook_id: null,
			name: 'Y-Cross',
			targeting_mode: 'absolute_role',
			created_by: testUserId,
			assignments: [
				{ role: 'y', drawing_data: sampleDrawing, order_index: 0 }
			]
		})
		testConcept2Id = concept2.id
	})

	describe('create', () => {
		test('creates group with formation and concepts', async () => {
			const groupData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Trips Mesh Package',
				description: 'Mesh concepts from trips formation',
				formation_id: testFormationId,
				created_by: testUserId,
				concept_ids: [
					{ concept_id: testConcept1Id, order_index: 0 },
					{ concept_id: testConcept2Id, order_index: 1 }
				]
			}

			const result = await repo.create(groupData)

			expect(result.id).toBeGreaterThan(0)
			expect(result.team_id).toBe(testTeamId)
			expect(result.name).toBe('Trips Mesh Package')
			expect(result.description).toBe('Mesh concepts from trips formation')
			expect(result.formation_id).toBe(testFormationId)
			expect(result.formation).not.toBeNull()
			expect(result.formation!.name).toBe('Test Formation')
			expect(result.concepts).toHaveLength(2)
			expect(result.concepts[0].id).toBe(testConcept1Id)
			expect(result.concepts[0].order_index).toBe(0)
			expect(result.concepts[1].id).toBe(testConcept2Id)
			expect(result.concepts[1].order_index).toBe(1)
		})

		test('creates group without formation', async () => {
			const groupData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Generic Package',
				created_by: testUserId,
				concept_ids: [
					{ concept_id: testConcept1Id, order_index: 0 }
				]
			}

			const result = await repo.create(groupData)

			expect(result.formation_id).toBeNull()
			expect(result.formation).toBeNull()
			expect(result.concepts).toHaveLength(1)
		})

		test('creates group without concepts', async () => {
			const groupData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Empty Package',
				formation_id: testFormationId,
				created_by: testUserId
			}

			const result = await repo.create(groupData)

			expect(result.formation_id).toBe(testFormationId)
			expect(result.concepts).toHaveLength(0)
		})

		test('creates playbook-scoped group', async () => {
			const groupData = {
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Package',
				created_by: testUserId,
				concept_ids: []
			}

			const result = await repo.create(groupData)

			expect(result.playbook_id).toBe(testPlaybookId)
		})

		test('creates group without description', async () => {
			const groupData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'No Description',
				created_by: testUserId,
				concept_ids: []
			}

			const result = await repo.create(groupData)

			expect(result.description).toBeNull()
		})

		test('orders concepts correctly', async () => {
			const groupData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Ordered Package',
				created_by: testUserId,
				concept_ids: [
					{ concept_id: testConcept2Id, order_index: 0 },
					{ concept_id: testConcept1Id, order_index: 1 }
				]
			}

			const result = await repo.create(groupData)

			// Should be ordered by order_index
			expect(result.concepts[0].id).toBe(testConcept2Id)
			expect(result.concepts[1].id).toBe(testConcept1Id)
		})

		test('initializes usage tracking fields', async () => {
			const groupData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Usage Test',
				created_by: testUserId,
				concept_ids: []
			}

			const result = await repo.create(groupData)

			expect(result.usage_count).toBe(0)
			expect(result.last_used_at).toBeNull()
		})
	})

	describe('findById', () => {
		test('returns group with formation and concepts', async () => {
			const created = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Test Group',
				formation_id: testFormationId,
				created_by: testUserId,
				concept_ids: [
					{ concept_id: testConcept1Id, order_index: 0 }
				]
			})

			const result = await repo.findById(created.id)

			expect(result).not.toBeNull()
			expect(result!.id).toBe(created.id)
			expect(result!.name).toBe('Test Group')
			expect(result!.formation).not.toBeNull()
			expect(result!.concepts).toHaveLength(1)
		})

		test('returns null for non-existent group', async () => {
			const result = await repo.findById(99999)

			expect(result).toBeNull()
		})
	})

	describe('getTeamGroups', () => {
		test('returns only team-wide groups when playbookId not provided', async () => {
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team Group',
				created_by: testUserId,
				concept_ids: []
			})

			await repo.create({
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Group',
				created_by: testUserId,
				concept_ids: []
			})

			const results = await repo.getTeamGroups(testTeamId)

			expect(results.every(g => g.team_id === testTeamId)).toBe(true)
			expect(results.every(g => g.playbook_id === null)).toBe(true)
			expect(results.some(g => g.name === 'Team Group')).toBe(true)
			expect(results.some(g => g.name === 'Playbook Group')).toBe(false)
		})

		test('includes both team and playbook groups when playbookId provided', async () => {
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team Group',
				created_by: testUserId,
				concept_ids: []
			})

			await repo.create({
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Group',
				created_by: testUserId,
				concept_ids: []
			})

			const results = await repo.getTeamGroups(testTeamId, testPlaybookId)

			expect(results.some(g => g.name === 'Team Group')).toBe(true)
			expect(results.some(g => g.name === 'Playbook Group')).toBe(true)
		})

		test('filters by team_id', async () => {
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team 1 Group',
				created_by: testUserId,
				concept_ids: []
			})

			// Create another team
			const [team2] = await db`
				INSERT INTO teams (name) VALUES ('Team 2')
				RETURNING id
			`

			await repo.create({
				team_id: team2.id,
				playbook_id: null,
				name: 'Team 2 Group',
				created_by: testUserId,
				concept_ids: []
			})

			const results = await repo.getTeamGroups(testTeamId)

			expect(results.every(g => g.team_id === testTeamId)).toBe(true)
			expect(results.some(g => g.name === 'Team 2 Group')).toBe(false)
		})
	})

	describe('search', () => {
		test('filters by query string', async () => {
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Mesh Package',
				created_by: testUserId,
				concept_ids: []
			})

			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Vertical Package',
				created_by: testUserId,
				concept_ids: []
			})

			const results = await repo.search(testTeamId, 'Mesh')

			expect(results.some(g => g.name === 'Mesh Package')).toBe(true)
			expect(results.some(g => g.name === 'Vertical Package')).toBe(false)
		})

		test('ranks by frecency score', async () => {
			const group1 = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Low Usage Package',
				created_by: testUserId,
				concept_ids: []
			})

			const group2 = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'High Usage Package',
				created_by: testUserId,
				concept_ids: []
			})

			// Increment usage for group2
			await repo.incrementUsage(group2.id)
			await repo.incrementUsage(group2.id)
			await repo.incrementUsage(group2.id)

			const results = await repo.search(testTeamId, 'Package')

			expect(results.length).toBeGreaterThanOrEqual(2)
			// Higher usage should rank first
			const highUsageIndex = results.findIndex(g => g.id === group2.id)
			const lowUsageIndex = results.findIndex(g => g.id === group1.id)
			expect(highUsageIndex).toBeLessThan(lowUsageIndex)
		})

		test('limits results when specified', async () => {
			for (let i = 0; i < 10; i++) {
				await repo.create({
					team_id: testTeamId,
					playbook_id: null,
					name: `Group ${i}`,
					created_by: testUserId,
					concept_ids: []
				})
			}

			const results = await repo.search(testTeamId, '', null, 5)

			expect(results.length).toBeLessThanOrEqual(5)
		})

		test('filters by playbook when provided', async () => {
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team Package',
				created_by: testUserId,
				concept_ids: []
			})

			await repo.create({
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Package',
				created_by: testUserId,
				concept_ids: []
			})

			const results = await repo.search(testTeamId, '', testPlaybookId)

			expect(results.some(g => g.name === 'Team Package')).toBe(true)
			expect(results.some(g => g.name === 'Playbook Package')).toBe(true)
		})
	})

	describe('update', () => {
		test('updates group name', async () => {
			const group = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Original Name',
				created_by: testUserId,
				concept_ids: []
			})

			await repo.update(group.id, { name: 'Updated Name' })

			const updated = await repo.findById(group.id)
			expect(updated!.name).toBe('Updated Name')
		})

		test('updates formation_id', async () => {
			const group = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Test Group',
				formation_id: null,
				created_by: testUserId,
				concept_ids: []
			})

			await repo.update(group.id, { formation_id: testFormationId })

			const updated = await repo.findById(group.id)
			expect(updated!.formation_id).toBe(testFormationId)
			expect(updated!.formation).not.toBeNull()
		})

		test('replaces concepts when provided', async () => {
			const group = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Test Group',
				created_by: testUserId,
				concept_ids: [
					{ concept_id: testConcept1Id, order_index: 0 }
				]
			})

			await repo.update(
				group.id,
				{ name: 'Updated' },
				[{ concept_id: testConcept2Id, order_index: 0 }]
			)

			const updated = await repo.findById(group.id)
			expect(updated!.concepts).toHaveLength(1)
			expect(updated!.concepts[0].id).toBe(testConcept2Id)
		})

		test('returns null for non-existent group', async () => {
			const result = await repo.update(99999, { name: 'Test' })

			expect(result).toBeNull()
		})
	})

	describe('incrementUsage', () => {
		test('increments usage_count', async () => {
			const group = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Usage Test',
				created_by: testUserId,
				concept_ids: []
			})

			expect(group.usage_count).toBe(0)

			await repo.incrementUsage(group.id)

			const updated = await repo.findById(group.id)
			expect(updated!.usage_count).toBe(1)
		})

		test('updates last_used_at timestamp', async () => {
			const group = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Timestamp Test',
				created_by: testUserId,
				concept_ids: []
			})

			expect(group.last_used_at).toBeNull()

			await repo.incrementUsage(group.id)

			const updated = await repo.findById(group.id)
			expect(updated!.last_used_at).not.toBeNull()
		})
	})

	describe('delete', () => {
		test('deletes group and cascades to concept links', async () => {
			const group = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'To Delete',
				created_by: testUserId,
				concept_ids: [
					{ concept_id: testConcept1Id, order_index: 0 },
					{ concept_id: testConcept2Id, order_index: 1 }
				]
			})

			await repo.delete(group.id)

			const deleted = await repo.findById(group.id)
			expect(deleted).toBeNull()

			// Verify concept links also deleted (cascade)
			const links = await db`
				SELECT * FROM concept_group_concepts
				WHERE concept_group_id = ${group.id}
			`
			expect(links).toHaveLength(0)
		})

		test('succeeds silently for non-existent group', async () => {
			await expect(repo.delete(99999)).resolves.toBeUndefined()
		})
	})
})
