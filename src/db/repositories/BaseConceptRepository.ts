import { db } from '../connection'
import type { BaseConcept, ConceptPlayerAssignment } from '../types'
import type { Drawing } from '../../types/drawing.types'

type BaseConceptWithAssignments = BaseConcept & {
	assignments: ConceptPlayerAssignment[]
}

type BaseConceptUpdate = {
	name?: string
	description?: string | null
	targeting_mode?: 'absolute_role' | 'relative_selector'
	ball_position?: 'left' | 'center' | 'right'
	play_direction?: 'left' | 'right' | 'na'
}

/**
 * Repository for managing base concept data and player assignments
 *
 * Base concepts define reusable route/assignment patterns with two targeting modes:
 * - Absolute Role: Assigns specific roles (X, Y, Z, etc.)
 * - Relative Selector: Dynamic role selection (leftmost receiver, etc.)
 *
 * Concepts are ranked by frecency (frequency + recency) for intelligent search results.
 */
export class BaseConceptRepository {
	/**
	 * Creates a new base concept with player assignments
	 *
	 * @param data - Concept data including targeting mode and assignments
	 * @param data.team_id - Team ID (null for system concepts)
	 * @param data.playbook_id - Playbook ID for scoped concepts (null for team-wide)
	 * @param data.name - Name of the concept (e.g., "Mesh", "Y-Cross")
	 * @param data.targeting_mode - Either 'absolute_role' or 'relative_selector'
	 * @param data.ball_position - Ball hash position ('left', 'center', or 'right')
	 * @param data.play_direction - Play direction ('left', 'right', or 'na')
	 * @param data.assignments - Array of player assignments with drawing data
	 * @returns The created concept with all assignments included
	 * @throws {Error} If concept creation fails or assignments cannot be inserted
	 *
	 * @example
	 * ```typescript
	 * const concept = await repo.create({
	 *   team_id: 1,
	 *   playbook_id: null,
	 *   name: "Mesh",
	 *   targeting_mode: "absolute_role",
	 *   ball_position: "center",
	 *   created_by: userId,
	 *   assignments: [
	 *     {
	 *       role: 'x',
	 *       drawing_data: { type: 'path', points: [...], style: {...} },
	 *       order_index: 0
	 *     }
	 *   ]
	 * })
	 * ```
	 */
	async create(data: {
		team_id: number | null
		playbook_id: number | null
		name: string
		description?: string
		targeting_mode: 'absolute_role' | 'relative_selector'
		ball_position?: 'left' | 'center' | 'right'
		play_direction?: 'left' | 'right' | 'na'
		created_by: number
		assignments: Array<{
			role?: string
			selector_type?: string
			selector_params?: Record<string, unknown>
			drawing_data: Drawing
			order_index?: number
		}>
	}): Promise<BaseConceptWithAssignments> {
		const [concept] = await db<BaseConcept[]>`
			INSERT INTO base_concepts (
				team_id, playbook_id, name, description,
				targeting_mode, ball_position, play_direction, created_by
			)
			VALUES (
				${data.team_id},
				${data.playbook_id},
				${data.name},
				${data.description ?? null},
				${data.targeting_mode},
				${data.ball_position ?? 'center'},
				${data.play_direction ?? 'na'},
				${data.created_by}
			)
			RETURNING *
		`

		if (!concept) {
			throw new Error('Failed to create concept')
		}

		const assignments = await Promise.all(
			data.assignments.map((assignment, index) =>
				db<ConceptPlayerAssignment[]>`
					INSERT INTO concept_player_assignments (
						concept_id, role, selector_type, selector_params,
						drawing_data, order_index
					)
					VALUES (
						${concept.id},
						${assignment.role ?? null},
						${assignment.selector_type ?? null},
						${assignment.selector_params ? JSON.stringify(assignment.selector_params) : null},
						${JSON.stringify(assignment.drawing_data)},
						${assignment.order_index ?? index}
					)
					RETURNING *
				`.then(rows => rows[0])
			)
		)

		return {
			...concept,
			assignments: assignments.filter((a): a is ConceptPlayerAssignment => a !== undefined)
		}
	}

	async findById(id: number): Promise<BaseConceptWithAssignments | null> {
		const [concept] = await db<BaseConcept[]>`
			SELECT * FROM base_concepts WHERE id = ${id}
		`

		if (!concept) {
			return null
		}

		const assignments = await db<ConceptPlayerAssignment[]>`
			SELECT * FROM concept_player_assignments
			WHERE concept_id = ${id}
			ORDER BY order_index
		`

		return {
			...concept,
			assignments
		}
	}

	async getTeamConcepts(
		teamId: number,
		playbookId?: number | null
	): Promise<BaseConcept[]> {
		if (playbookId) {
			return await db<BaseConcept[]>`
				SELECT * FROM base_concepts
				WHERE (team_id = ${teamId} AND playbook_id IS NULL)
					OR (team_id = ${teamId} AND playbook_id = ${playbookId})
				ORDER BY usage_count DESC, last_used_at DESC NULLS LAST
			`
		}

		return await db<BaseConcept[]>`
			SELECT * FROM base_concepts
			WHERE team_id = ${teamId} AND playbook_id IS NULL
			ORDER BY usage_count DESC, last_used_at DESC NULLS LAST
		`
	}

	async search(
		teamId: number,
		query: string,
		playbookId?: number | null,
		limit: number = 10
	): Promise<Array<BaseConcept & { frecency_score: number }>> {
		const searchPattern = `%${query}%`

		if (playbookId) {
			return await db<Array<BaseConcept & { frecency_score: number }>>`
				SELECT
					*,
					(usage_count::float / (EXTRACT(EPOCH FROM (NOW() - COALESCE(last_used_at, created_at))) / 86400 + 1)) as frecency_score
				FROM base_concepts
				WHERE (team_id = ${teamId} OR team_id IS NULL)
					AND (playbook_id IS NULL OR playbook_id = ${playbookId})
					AND name ILIKE ${searchPattern}
				ORDER BY frecency_score DESC
				LIMIT ${limit}
			`
		}

		return await db<Array<BaseConcept & { frecency_score: number }>>`
			SELECT
				*,
				(usage_count::float / (EXTRACT(EPOCH FROM (NOW() - COALESCE(last_used_at, created_at))) / 86400 + 1)) as frecency_score
			FROM base_concepts
			WHERE (team_id = ${teamId} OR team_id IS NULL)
				AND playbook_id IS NULL
				AND name ILIKE ${searchPattern}
			ORDER BY frecency_score DESC
			LIMIT ${limit}
		`
	}

	async update(
		id: number,
		data: BaseConceptUpdate,
		assignments?: Array<{
			role?: string
			selector_type?: string
			selector_params?: Record<string, unknown>
			drawing_data: Drawing
			order_index?: number
		}>
	): Promise<BaseConceptWithAssignments | null> {
		if (Object.keys(data).length === 0 && !assignments) {
			return this.findById(id)
		}

		if (Object.keys(data).length > 0) {
			const [concept] = await db<BaseConcept[]>`
				UPDATE base_concepts
				SET
					name = COALESCE(${data.name ?? null}, name),
					description = COALESCE(${data.description ?? null}, description),
					targeting_mode = COALESCE(${data.targeting_mode ?? null}, targeting_mode),
					ball_position = COALESCE(${data.ball_position ?? null}, ball_position),
					play_direction = COALESCE(${data.play_direction ?? null}, play_direction),
					updated_at = CURRENT_TIMESTAMP
				WHERE id = ${id}
				RETURNING *
			`

			if (!concept) {
				return null
			}
		}

		if (assignments) {
			await db`DELETE FROM concept_player_assignments WHERE concept_id = ${id}`

			await Promise.all(
				assignments.map((assignment, index) =>
					db`
						INSERT INTO concept_player_assignments (
							concept_id, role, selector_type, selector_params,
							drawing_data, order_index
						)
						VALUES (
							${id},
							${assignment.role ?? null},
							${assignment.selector_type ?? null},
							${assignment.selector_params ? JSON.stringify(assignment.selector_params) : null},
							${JSON.stringify(assignment.drawing_data)},
							${assignment.order_index ?? index}
						)
					`
				)
			)
		}

		return this.findById(id)
	}

	async incrementUsage(id: number): Promise<void> {
		await db`
			UPDATE base_concepts
			SET
				usage_count = usage_count + 1,
				last_used_at = CURRENT_TIMESTAMP
			WHERE id = ${id}
		`
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM base_concepts WHERE id = ${id}`
	}
}
