import { db } from '../connection'
import type { Formation, FormationPlayerPosition } from '../types'

type FormationWithPositions = Formation & {
	positions: FormationPlayerPosition[]
}

type FormationUpdate = {
	name?: string
	description?: string | null
}

export class FormationRepository {
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
