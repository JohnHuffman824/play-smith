import { db } from '../connection'
import type { Playbook } from '../types'

type PlaybookUpdate = {
	name?: string
	description?: string
}

export class PlaybookRepository {
	// Inserts a playbook and returns DB defaults in one call
	async create(data: {
		team_id: number | null
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
			SELECT id, team_id, name, description, created_by, created_at, updated_at
			FROM playbooks
			WHERE id = ${id}
		`

		return playbook ?? null
	}

	// Lists playbooks for a team ordered by latest update
	async getTeamPlaybooks(teamId: number): Promise<Playbook[]> {
		return await db<Playbook[]>`
			SELECT id, team_id, name, description, created_by, created_at, updated_at
			FROM playbooks
			WHERE team_id = ${teamId}
			ORDER BY updated_at DESC
		`
	}

	/**
	 * Fetches all personal playbooks created by a specific user.
	 * Personal playbooks have team_id = NULL and are not shared with any team.
	 * Results are ordered by most recent update first.
	 *
	 * @param userId - The ID of the user who created the playbooks
	 * @returns Array of personal playbooks belonging to the user, ordered by updated_at DESC
	 *
	 * @example
	 * const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(42)
	 * // Returns all playbooks where team_id IS NULL and created_by = 42
	 */
	async getUserPersonalPlaybooks(userId: number): Promise<Playbook[]> {
		return await db<Playbook[]>`
			SELECT id, team_id, name, description, created_by, created_at, updated_at
			FROM playbooks
			WHERE team_id IS NULL AND created_by = ${userId}
			ORDER BY updated_at DESC, id DESC
		`
	}

	// Applies provided fields to an existing playbook
	async update(id: number, data: PlaybookUpdate): Promise<Playbook | null> {
		if (Object.keys(data).length === 0) {
			return this.findById(id)
		}

		const [playbook] = await db<Playbook[]>`
			UPDATE playbooks
			SET
				name = COALESCE(${data.name ?? null}, name),
				description = COALESCE(${data.description ?? null}, description)
			WHERE id = ${id}
			RETURNING id, team_id, name, description, created_by, created_at, updated_at
		`

		return playbook ?? null
	}

	// Removes a playbook by id
	async delete(id: number): Promise<void> {
		await db`DELETE FROM playbooks WHERE id = ${id}`
	}

	// Fetches all playbooks accessible to user with play counts in single query
	async getUserPlaybooksWithCounts(
		userId: number,
		teamIds: number[]
	): Promise<Array<Playbook & { play_count: number }>> {
		return await db<Array<Playbook & { play_count: number }>>`
			SELECT
				p.id, p.team_id, p.name, p.description,
				p.created_by, p.created_at, p.updated_at,
				COALESCE(COUNT(pl.id), 0)::int as play_count
			FROM playbooks p
			LEFT JOIN plays pl ON pl.playbook_id = p.id
			WHERE p.team_id = ANY(${teamIds}) OR (p.team_id IS NULL AND p.created_by = ${userId})
			GROUP BY p.id
			ORDER BY p.updated_at DESC
		`
	}
}
