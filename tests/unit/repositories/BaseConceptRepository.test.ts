import { describe, test, expect, beforeEach } from 'bun:test'
import { BaseConceptRepository } from '../../../src/db/repositories/BaseConceptRepository'
import { db } from '../../../src/db/connection'
import type { Drawing } from '../../../src/types/drawing.types'

describe('BaseConceptRepository', () => {
	const repo = new BaseConceptRepository()
	let testTeamId: number
	let testPlaybookId: number
	let testUserId: number

	// Sample drawing data for testing
	const sampleDrawing: Drawing = {
		id: 'test-drawing-1',
		type: 'path',
		points: [
			{ x: 0, y: 0 },
			{ x: 10, y: 10 }
		],
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

		// Create test user first (needed for playbook created_by)
		const userEmail = `test-${Date.now()}-${Math.random()}@example.com`
		const [user] = await db`
			INSERT INTO users (email, name, password_hash)
			VALUES (${userEmail}, 'Test User', 'dummy_hash')
			RETURNING id
		`
		testUserId = user.id

		// Create test playbook (requires created_by)
		const [playbook] = await db`
			INSERT INTO playbooks (team_id, name, created_by)
			VALUES (${testTeamId}, 'Test Playbook', ${testUserId})
			RETURNING id
		`
		testPlaybookId = playbook.id
	})

	describe('create', () => {
		test('creates concept with absolute_role targeting', async () => {
			const conceptData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Mesh',
				description: 'Crossing routes',
				targeting_mode: 'absolute_role' as const,
				ball_position: 'center' as const,
				play_direction: 'na' as const,
				created_by: testUserId,
				assignments: [
					{
						role: 'x',
						drawing_data: sampleDrawing,
						order_index: 0
					},
					{
						role: 'y',
						drawing_data: { ...sampleDrawing, id: 'test-drawing-2' },
						order_index: 1
					}
				]
			}

			const result = await repo.create(conceptData)

			expect(result.id).toBeGreaterThan(0)
			expect(result.team_id).toBe(testTeamId)
			expect(result.playbook_id).toBeNull()
			expect(result.name).toBe('Mesh')
			expect(result.description).toBe('Crossing routes')
			expect(result.targeting_mode).toBe('absolute_role')
			expect(result.ball_position).toBe('center')
			expect(result.play_direction).toBe('na')
			expect(result.assignments).toHaveLength(2)
			expect(result.assignments[0].role).toBe('x')
			expect(result.assignments[1].role).toBe('y')
		})

		test('creates concept with relative_selector targeting', async () => {
			const conceptData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Outside Verticals',
				targeting_mode: 'relative_selector' as const,
				ball_position: 'center' as const,
				created_by: testUserId,
				assignments: [
					{
						selector_type: 'leftmost_receiver',
						drawing_data: sampleDrawing,
						order_index: 0
					},
					{
						selector_type: 'rightmost_receiver',
						drawing_data: { ...sampleDrawing, id: 'test-drawing-3' },
						order_index: 1
					}
				]
			}

			const result = await repo.create(conceptData)

			expect(result.targeting_mode).toBe('relative_selector')
			expect(result.assignments).toHaveLength(2)
			expect(result.assignments[0].selector_type).toBe('leftmost_receiver')
			expect(result.assignments[1].selector_type).toBe('rightmost_receiver')
		})

		test('creates playbook-scoped concept', async () => {
			const conceptData = {
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [
					{
						role: 'x',
						drawing_data: sampleDrawing,
						order_index: 0
					}
				]
			}

			const result = await repo.create(conceptData)

			expect(result.playbook_id).toBe(testPlaybookId)
		})

		test('stores drawing_data as JSONB', async () => {
			const conceptData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Test Drawing Storage',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [
					{
						role: 'x',
						drawing_data: sampleDrawing,
						order_index: 0
					}
				]
			}

			const result = await repo.create(conceptData)

			// Verify drawing data is stored
			const assignment = result.assignments[0]
			expect(assignment.drawing_data).toBeDefined()

			// drawing_data might be string or object depending on postgres.js JSONB handling
			const drawingData = typeof assignment.drawing_data === 'string'
				? JSON.parse(assignment.drawing_data)
				: assignment.drawing_data

			expect(drawingData.type).toBe('path')
			expect(drawingData.points).toHaveLength(2)
			expect(drawingData.style.color).toBe('#000000')
		})

		test('initializes usage tracking fields', async () => {
			const conceptData = {
				team_id: testTeamId,
				playbook_id: null,
				name: 'Usage Test',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [
					{
						role: 'x',
						drawing_data: sampleDrawing,
						order_index: 0
					}
				]
			}

			const result = await repo.create(conceptData)

			expect(result.usage_count).toBe(0)
			expect(result.last_used_at).toBeNull()
		})
	})

	describe('findById', () => {
		test('returns concept with assignments', async () => {
			const created = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Test Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [
					{
						role: 'x',
						drawing_data: sampleDrawing,
						order_index: 0
					},
					{
						role: 'y',
						drawing_data: { ...sampleDrawing, id: 'test-drawing-4' },
						order_index: 1
					}
				]
			})

			const result = await repo.findById(created.id)

			expect(result).not.toBeNull()
			expect(result!.id).toBe(created.id)
			expect(result!.name).toBe('Test Concept')
			expect(result!.assignments).toHaveLength(2)
			expect(result!.assignments[0].order_index).toBe(0)
			expect(result!.assignments[1].order_index).toBe(1)
		})

		test('returns null for non-existent concept', async () => {
			const result = await repo.findById(99999)

			expect(result).toBeNull()
		})
	})

	describe('search - frecency algorithm', () => {
		test('ranks by usage count when no recent usage', async () => {
			// Create concepts with different usage counts
			const concept1 = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Low Usage',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			const concept2 = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'High Usage',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			// Increment usage for concept2
			await repo.incrementUsage(concept2.id)
			await repo.incrementUsage(concept2.id)
			await repo.incrementUsage(concept2.id)

			const results = await repo.search(testTeamId, 'Usage')

			expect(results.length).toBeGreaterThanOrEqual(2)
			// Higher usage should rank first
			const highUsageIndex = results.findIndex(c => c.id === concept2.id)
			const lowUsageIndex = results.findIndex(c => c.id === concept1.id)
			expect(highUsageIndex).toBeLessThan(lowUsageIndex)
		})

		test('filters by query string', async () => {
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Mesh',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Y-Cross',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			const results = await repo.search(testTeamId, 'Mesh')

			expect(results.some(c => c.name === 'Mesh')).toBe(true)
			expect(results.some(c => c.name === 'Y-Cross')).toBe(false)
		})

		test('filters by team_id', async () => {
			// Create concept for testTeam
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team 1 Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			// Create another team and concept
			const [team2] = await db`
				INSERT INTO teams (name) VALUES ('Team 2')
				RETURNING id
			`

			await repo.create({
				team_id: team2.id,
				playbook_id: null,
				name: 'Team 2 Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			const results = await repo.search(testTeamId, '')

			expect(results.every(c => c.team_id === testTeamId)).toBe(true)
			expect(results.some(c => c.name === 'Team 2 Concept')).toBe(false)
		})

		test('filters by playbook_id when provided', async () => {
			// Create team-wide concept
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			// Create playbook-specific concept
			await repo.create({
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			const results = await repo.search(testTeamId, '', testPlaybookId)

			// Should include both team-wide and playbook-specific
			expect(results.some(c => c.name === 'Team Concept')).toBe(true)
			expect(results.some(c => c.name === 'Playbook Concept')).toBe(true)
		})

		test('limits results when specified', async () => {
			// Create multiple concepts
			for (let i = 0; i < 10; i++) {
				await repo.create({
					team_id: testTeamId,
					playbook_id: null,
					name: `Concept ${i}`,
					targeting_mode: 'absolute_role' as const,
					created_by: testUserId,
					assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
				})
			}

			const results = await repo.search(testTeamId, '', null, 5)

			expect(results.length).toBeLessThanOrEqual(5)
		})
	})

	describe('incrementUsage', () => {
		test('increments usage_count', async () => {
			const concept = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Usage Test',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			expect(concept.usage_count).toBe(0)

			await repo.incrementUsage(concept.id)

			const updated = await repo.findById(concept.id)
			expect(updated!.usage_count).toBe(1)
		})

		test('updates last_used_at timestamp', async () => {
			const concept = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Timestamp Test',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			expect(concept.last_used_at).toBeNull()

			await repo.incrementUsage(concept.id)

			const updated = await repo.findById(concept.id)
			expect(updated!.last_used_at).not.toBeNull()
		})

		test('increments multiple times correctly', async () => {
			const concept = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Multi Increment',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			await repo.incrementUsage(concept.id)
			await repo.incrementUsage(concept.id)
			await repo.incrementUsage(concept.id)

			const updated = await repo.findById(concept.id)
			expect(updated!.usage_count).toBe(3)
		})
	})

	describe('update', () => {
		test('updates concept name', async () => {
			const concept = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Original Name',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			await repo.update(concept.id, { name: 'Updated Name' })

			const updated = await repo.findById(concept.id)
			expect(updated!.name).toBe('Updated Name')
		})

		test('updates targeting mode', async () => {
			const concept = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Test',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			await repo.update(concept.id, { targeting_mode: 'relative_selector' })

			const updated = await repo.findById(concept.id)
			expect(updated!.targeting_mode).toBe('relative_selector')
		})

		test('updates ball position and play direction', async () => {
			const concept = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Test',
				targeting_mode: 'absolute_role' as const,
				ball_position: 'center' as const,
				play_direction: 'na' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			await repo.update(concept.id, {
				ball_position: 'left' as const,
				play_direction: 'right' as const
			})

			const updated = await repo.findById(concept.id)
			expect(updated!.ball_position).toBe('left')
			expect(updated!.play_direction).toBe('right')
		})

		test('returns null for non-existent concept', async () => {
			const result = await repo.update(99999, { name: 'Test' })

			expect(result).toBeNull()
		})
	})

	describe('delete', () => {
		test('deletes concept and cascades to assignments', async () => {
			const concept = await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'To Delete',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [
					{
						role: 'x',
						drawing_data: sampleDrawing,
						order_index: 0
					},
					{
						role: 'y',
						drawing_data: { ...sampleDrawing, id: 'test-drawing-5' },
						order_index: 1
					}
				]
			})

			await repo.delete(concept.id)

			const deleted = await repo.findById(concept.id)
			expect(deleted).toBeNull()

			// Verify assignments also deleted (cascade)
			const assignments = await db`
				SELECT * FROM concept_player_assignments
				WHERE concept_id = ${concept.id}
			`
			expect(assignments).toHaveLength(0)
		})

		test('succeeds silently for non-existent concept', async () => {
			await expect(repo.delete(99999)).resolves.toBeUndefined()
		})
	})

	describe('getTeamConcepts', () => {
		test('returns only team-wide concepts when playbookId not provided', async () => {
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			await repo.create({
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			const results = await repo.getTeamConcepts(testTeamId)

			// Should only return team-wide concepts (playbook_id IS NULL)
			expect(results.every(c => c.team_id === testTeamId)).toBe(true)
			expect(results.every(c => c.playbook_id === null)).toBe(true)
			expect(results.some(c => c.name === 'Team Concept')).toBe(true)
			expect(results.some(c => c.name === 'Playbook Concept')).toBe(false)
		})

		test('filters by playbook when provided', async () => {
			// Create team concept
			await repo.create({
				team_id: testTeamId,
				playbook_id: null,
				name: 'Team Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			// Create playbook concept
			await repo.create({
				team_id: testTeamId,
				playbook_id: testPlaybookId,
				name: 'Playbook Concept',
				targeting_mode: 'absolute_role' as const,
				created_by: testUserId,
				assignments: [{ role: 'x', drawing_data: sampleDrawing, order_index: 0 }]
			})

			const results = await repo.getTeamConcepts(testTeamId, testPlaybookId)

			// Should include both team-wide and playbook-specific
			expect(results.some(c => c.name === 'Team Concept')).toBe(true)
			expect(results.some(c => c.name === 'Playbook Concept')).toBe(true)
		})
	})
})
