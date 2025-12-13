import { db } from '../connection'
import type { Playbook } from '../types'
import { SectionRepository } from './SectionRepository'

type PlaybookUpdate = {
	name?: string
	description?: string
	folder_id?: number | null
}

export class PlaybookRepository {
	private sectionRepo = new SectionRepository()

	// Inserts a playbook and returns DB defaults in one call
	// Auto-creates an Ideas section for the playbook
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

		// Auto-create Ideas section with display_order 0
		await this.sectionRepo.create(playbook.id, 'Ideas', 0, 'ideas')

		return playbook
	}

	// Fetches a playbook by id or null when missing (excludes deleted)
	async findById(id: number): Promise<Playbook | null> {
		const [playbook] = await db<Playbook[]>`
			SELECT id, team_id, name, description, created_by, created_at, updated_at, folder_id, is_starred, deleted_at, last_accessed_at
			FROM playbooks
			WHERE id = ${id} AND deleted_at IS NULL
		`

		return playbook ?? null
	}

	// Fetches a playbook by id including deleted ones (for trash operations)
	async findByIdIncludingDeleted(id: number): Promise<Playbook | null> {
		const [playbook] = await db<Playbook[]>`
			SELECT id, team_id, name, description, created_by, created_at, updated_at, folder_id, is_starred, deleted_at, last_accessed_at
			FROM playbooks
			WHERE id = ${id}
		`

		return playbook ?? null
	}

	// Lists playbooks for a team ordered by latest update (excludes deleted)
	async getTeamPlaybooks(teamId: number): Promise<Playbook[]> {
		return await db<Playbook[]>`
			SELECT id, team_id, name, description, created_by, created_at, updated_at, folder_id, is_starred, deleted_at, last_accessed_at
			FROM playbooks
			WHERE team_id = ${teamId} AND deleted_at IS NULL
			ORDER BY updated_at DESC
		`
	}

	/**
	 * Fetches all personal playbooks created by a specific user.
	 * Personal playbooks have team_id = NULL and are not shared with any team.
	 * Results are ordered by most recent update first. Excludes deleted playbooks.
	 *
	 * @param userId - The ID of the user who created the playbooks
	 * @returns Array of personal playbooks belonging to the user, ordered by updated_at DESC
	 *
	 * @example
	 * const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(42)
	 * // Returns all playbooks where team_id IS NULL and created_by = 42 and deleted_at IS NULL
	 */
	async getUserPersonalPlaybooks(userId: number): Promise<Playbook[]> {
		return await db<Playbook[]>`
			SELECT id, team_id, name, description, created_by, created_at, updated_at, folder_id, is_starred, deleted_at, last_accessed_at
			FROM playbooks
			WHERE team_id IS NULL AND created_by = ${userId} AND deleted_at IS NULL
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
				description = COALESCE(${data.description ?? null}, description),
				folder_id = CASE WHEN ${data.folder_id !== undefined} THEN ${data.folder_id ?? null} ELSE folder_id END
			WHERE id = ${id}
			RETURNING id, team_id, name, description, created_by, created_at, updated_at, folder_id, is_starred, deleted_at, last_accessed_at
		`

		return playbook ?? null
	}

	// Removes a playbook by id
	async delete(id: number): Promise<void> {
		await db`DELETE FROM playbooks WHERE id = ${id}`
	}

	// Toggles the starred status of a playbook
	async toggleStar(id: number): Promise<Playbook | null> {
		const [playbook] = await db<Playbook[]>`
			UPDATE playbooks
			SET is_starred = NOT COALESCE(is_starred, false)
			WHERE id = ${id}
			RETURNING *
		`
		return playbook ?? null
	}

	// Fetches all playbooks accessible to user with play counts in single query (excludes deleted)
	async getUserPlaybooksWithCounts(
		userId: number,
		teamIds: number[]
	): Promise<Array<Playbook & { play_count: number }>> {
		return await db<Array<Playbook & { play_count: number }>>`
			SELECT
				p.id, p.team_id, p.name, p.description,
				p.created_by, p.created_at, p.updated_at,
				p.folder_id, p.is_starred, p.deleted_at, p.last_accessed_at,
				COALESCE(COUNT(pl.id), 0)::int as play_count
			FROM playbooks p
			LEFT JOIN plays pl ON pl.playbook_id = p.id
			WHERE p.deleted_at IS NULL
			AND (p.team_id = ANY(${teamIds}) OR (p.team_id IS NULL AND p.created_by = ${userId}))
			GROUP BY p.id
			ORDER BY p.updated_at DESC
		`
	}

	// Updates the last_accessed_at timestamp for a playbook
	async updateLastAccessed(id: number): Promise<void> {
		await db`UPDATE playbooks SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ${id}`
	}

	// Soft delete - marks a playbook as deleted
	async softDelete(id: number): Promise<void> {
		await db`UPDATE playbooks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`
	}

	// Restore - unmarks a playbook as deleted
	async restore(id: number): Promise<Playbook | null> {
		const [playbook] = await db<Playbook[]>`
			UPDATE playbooks SET deleted_at = NULL WHERE id = ${id} RETURNING *
		`
		return playbook ?? null
	}

	// Permanent delete - physically removes a playbook
	async permanentDelete(id: number): Promise<void> {
		await db`DELETE FROM playbooks WHERE id = ${id}`
	}

	// Empty trash - permanently deletes all deleted playbooks for a user
	async emptyTrash(userId: number, teamIds: number[]): Promise<number> {
		const result = await db`
			DELETE FROM playbooks
			WHERE deleted_at IS NOT NULL
			AND (team_id = ANY(${teamIds}) OR (team_id IS NULL AND created_by = ${userId}))
		`
		return result.count
	}

	// Cleanup old trash - permanently deletes playbooks deleted more than 30 days ago
	async cleanupOldTrash(): Promise<number> {
		const result = await db`
			DELETE FROM playbooks
			WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 day'
		`
		return result.count
	}

	// Fetches all trashed playbooks accessible to user with play counts
	async getTrashedPlaybooks(
		userId: number,
		teamIds: number[]
	): Promise<Array<Playbook & { play_count: number }>> {
		return await db<Array<Playbook & { play_count: number }>>`
			SELECT
				p.id, p.team_id, p.name, p.description,
				p.created_by, p.created_at, p.updated_at,
				p.folder_id, p.is_starred, p.deleted_at, p.last_accessed_at,
				COALESCE(COUNT(pl.id), 0)::int as play_count
			FROM playbooks p
			LEFT JOIN plays pl ON pl.playbook_id = p.id
			WHERE p.deleted_at IS NOT NULL
			AND (p.team_id = ANY(${teamIds}) OR (p.team_id IS NULL AND p.created_by = ${userId}))
			GROUP BY p.id
			ORDER BY p.deleted_at DESC
		`
	}
}
