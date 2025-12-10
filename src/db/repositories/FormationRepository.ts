import { db } from '../connection'
import type { Formation, FormationPlayerPosition } from '../types'

type FormationWithPositions = Formation & {
	positions: FormationPlayerPosition[]
}

type FormationUpdate = {
	name?: string
	description?: string | null
}

/**
 * Repository for managing formation data and player positions
 *
 * Formations define predefined player alignments with specific roles and coordinates.
 * Each formation includes multiple player positions with optional hash-relative positioning.
 */
export class FormationRepository {
	/**
	 * Creates a new formation with player positions
	 *
	 * @param data - Formation data including team_id, name, and positions array
	 * @param data.team_id - Team ID this formation belongs to
	 * @param data.name - Name of the formation (e.g., "Trips Right", "I-Formation")
	 * @param data.description - Optional description of the formation
	 * @param data.created_by - User ID who created the formation
	 * @param data.positions - Array of player positions with role and coordinates
	 * @returns The created formation with all positions included
	 * @throws {Error} If formation creation fails or positions cannot be inserted
	 *
	 * @example
	 * ```typescript
	 * const formation = await repo.create({
	 *   team_id: 1,
	 *   name: "Trips Right",
	 *   created_by: userId,
	 *   positions: [
	 *     { role: 'x', position_x: -20, position_y: 10, hash_relative: false },
	 *     { role: 'y', position_x: 0, position_y: 10, hash_relative: false }
	 *   ]
	 * })
	 * ```
	 */
	async create(data: {
		team_id: number
		name: string
		description?: string
		created_by: number
		positions: Array<{
			role: string
			position_x: number
			position_y: number
			hash_relative?: boolean
		}>
	}): Promise<FormationWithPositions> {
		const [formation] = await db<Formation[]>`
			INSERT INTO formations (team_id, name, description, created_by)
			VALUES (
				${data.team_id},
				${data.name},
				${data.description ?? null},
				${data.created_by}
			)
			RETURNING *
		`

		if (!formation) {
			throw new Error('Failed to create formation')
		}

		const positions = await Promise.all(
			data.positions.map(pos =>
				db<FormationPlayerPosition[]>`
					INSERT INTO formation_player_positions (
						formation_id, role, position_x, position_y, hash_relative
					)
					VALUES (
						${formation.id},
						${pos.role},
						${pos.position_x},
						${pos.position_y},
						${pos.hash_relative ?? false}
					)
					RETURNING *
				`.then(rows => rows[0])
			)
		)

		return {
			...formation,
			positions: positions.filter((p): p is FormationPlayerPosition => p !== undefined)
		}
	}

	async findById(id: number): Promise<FormationWithPositions | null> {
		const [formation] = await db<Formation[]>`
			SELECT * FROM formations WHERE id = ${id}
		`

		if (!formation) {
			return null
		}

		const positions = await db<FormationPlayerPosition[]>`
			SELECT * FROM formation_player_positions
			WHERE formation_id = ${id}
			ORDER BY role
		`

		return {
			...formation,
			positions
		}
	}

	async getTeamFormations(teamId: number): Promise<Formation[]> {
		return await db<Formation[]>`
			SELECT * FROM formations
			WHERE team_id = ${teamId}
			ORDER BY updated_at DESC
		`
	}

	async update(
		id: number,
		data: FormationUpdate,
		positions?: Array<{
			role: string
			position_x: number
			position_y: number
			hash_relative?: boolean
		}>
	): Promise<FormationWithPositions | null> {
		if (Object.keys(data).length === 0 && !positions) {
			return this.findById(id)
		}

		if (Object.keys(data).length > 0) {
			const [formation] = await db<Formation[]>`
				UPDATE formations
				SET
					name = COALESCE(${data.name ?? null}, name),
					description = COALESCE(${data.description ?? null}, description),
					updated_at = CURRENT_TIMESTAMP
				WHERE id = ${id}
				RETURNING *
			`

			if (!formation) {
				return null
			}
		}

		if (positions) {
			await db`DELETE FROM formation_player_positions WHERE formation_id = ${id}`

			await Promise.all(
				positions.map(pos =>
					db`
						INSERT INTO formation_player_positions (
							formation_id, role, position_x, position_y, hash_relative
						)
						VALUES (
							${id},
							${pos.role},
							${pos.position_x},
							${pos.position_y},
							${pos.hash_relative ?? false}
						)
					`
				)
			)
		}

		return this.findById(id)
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM formations WHERE id = ${id}`
	}
}
