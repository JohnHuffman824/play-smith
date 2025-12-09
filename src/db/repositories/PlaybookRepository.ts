import { db } from '../connection'
import type { Playbook } from '../types'

type PlaybookUpdate = {
	name?: string
	description?: string
}

export class PlaybookRepository {
	// Inserts a playbook and returns DB defaults in one call
	async create(data: {
		team_id: number
		name: string
		description?: string
		created_by: number
	}): Promise<Playbook> {
		const [playbook] = await db<Playbook[]>`
			INSERT INTO playbooks (team_id, name, description, created_by)
			VALUES (
				${data.team_id},
				${data.name},
				${data.description ?? null},
				${data.created_by}
			)
			RETURNING *
		`

		return playbook
	}

	// Fetches a playbook by id or null when missing
	async findById(id: number): Promise<Playbook | null> {
		const [playbook] = await db<Playbook[]>`
			SELECT * FROM playbooks WHERE id = ${id}
		`

		return playbook ?? null
	}

	// Lists playbooks for a team ordered by latest update
	async getTeamPlaybooks(teamId: number): Promise<Playbook[]> {
		return await db<Playbook[]>`
			SELECT * FROM playbooks
			WHERE team_id = ${teamId}
			ORDER BY updated_at DESC
		`
	}

	// Applies provided fields to an existing playbook
	async update(id: number, data: PlaybookUpdate): Promise<Playbook | null> {
		if (Object.keys(data).length == 0) {
			return this.findById(id)
		}

		const [playbook] = await db<Playbook[]>`
			UPDATE playbooks
			SET
				name = COALESCE(${data.name ?? null}, name),
				description = COALESCE(${data.description ?? null}, description)
			WHERE id = ${id}
			RETURNING *
		`

		return playbook ?? null
	}

	// Removes a playbook by id
	async delete(id: number): Promise<void> {
		await db`DELETE FROM playbooks WHERE id = ${id}`
	}
}
