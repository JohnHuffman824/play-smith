import { db } from '../connection'
import type { PresetRoute } from '../types'

export class PresetRouteRepository {
	async getAll(teamId?: number): Promise<PresetRoute[]> {
		if (teamId) {
			return await db<PresetRoute[]>`
				SELECT id, team_id, name, route_number, drawing_template, created_by, created_at, updated_at
				FROM preset_routes
				WHERE team_id IS NULL OR team_id = ${teamId}
				ORDER BY route_number NULLS LAST, name
			`
		}

		return await db<PresetRoute[]>`
			SELECT id, team_id, name, route_number, drawing_template, created_by, created_at, updated_at
			FROM preset_routes
			WHERE team_id IS NULL
			ORDER BY route_number NULLS LAST, name
		`
	}

	async create(data: {
		team_id: number
		name: string
		route_number?: number
		drawing_template: unknown
		created_by: number
	}): Promise<PresetRoute> {
		const [route] = await db<PresetRoute[]>`
			INSERT INTO preset_routes (
				team_id, name, route_number, drawing_template, created_by
			)
			VALUES (
				${data.team_id},
				${data.name},
				${data.route_number ?? null},
				${JSON.stringify(data.drawing_template)},
				${data.created_by}
			)
			RETURNING id, team_id, name, route_number, drawing_template, created_by, created_at, updated_at
		`

		if (!route) {
			throw new Error('Failed to create preset route')
		}

		return route
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM preset_routes WHERE id = ${id}`
	}
}
