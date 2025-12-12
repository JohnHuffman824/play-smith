import { db } from '../connection'
import type { PlaybookShare, PlaybookWithCount } from '../types'

export class PlaybookShareRepository {
	/**
	 * Shares a playbook with a team
	 */
	async share(data: {
		playbook_id: number
		shared_with_team_id: number
		permission: 'view' | 'edit'
		shared_by: number
	}): Promise<PlaybookShare> {
		const [share] = await db<PlaybookShare[]>`
			INSERT INTO playbook_shares (playbook_id, shared_with_team_id, permission, shared_by)
			VALUES (
				${data.playbook_id},
				${data.shared_with_team_id},
				${data.permission},
				${data.shared_by}
			)
			ON CONFLICT (playbook_id, shared_with_team_id)
			DO UPDATE SET
				permission = EXCLUDED.permission,
				shared_by = EXCLUDED.shared_by,
				shared_at = CURRENT_TIMESTAMP
			RETURNING *
		`

		return share
	}

	/**
	 * Unshares a playbook from a team
	 */
	async unshare(playbookId: number, teamId: number): Promise<void> {
		await db`
			DELETE FROM playbook_shares
			WHERE playbook_id = ${playbookId}
			AND shared_with_team_id = ${teamId}
		`
	}

	/**
	 * Gets all playbooks shared with the given teams (for "Shared with me" section)
	 */
	async getPlaybooksSharedWithTeams(teamIds: number[]): Promise<PlaybookWithCount[]> {
		if (teamIds.length === 0) {
			return []
		}

		return await db<PlaybookWithCount[]>`
			SELECT
				p.id, p.team_id, p.name, p.description,
				p.created_by, p.created_at, p.updated_at,
				p.folder_id, p.is_starred, p.deleted_at, p.last_accessed_at,
				COALESCE(COUNT(pl.id), 0)::int as play_count
			FROM playbooks p
			INNER JOIN playbook_shares ps ON ps.playbook_id = p.id
			LEFT JOIN plays pl ON pl.playbook_id = p.id
			WHERE ps.shared_with_team_id = ANY(${teamIds})
			AND p.deleted_at IS NULL
			GROUP BY p.id
			ORDER BY ps.shared_at DESC
		`
	}

	/**
	 * Gets all shares for a specific playbook
	 */
	async getPlaybookShares(playbookId: number): Promise<PlaybookShare[]> {
		return await db<PlaybookShare[]>`
			SELECT * FROM playbook_shares
			WHERE playbook_id = ${playbookId}
			ORDER BY shared_at DESC
		`
	}

	/**
	 * Gets shares for a playbook with team details
	 */
	async getPlaybookSharesWithTeams(playbookId: number): Promise<
		Array<PlaybookShare & { team_name: string }>
	> {
		return await db<Array<PlaybookShare & { team_name: string }>>`
			SELECT
				ps.*,
				t.name as team_name
			FROM playbook_shares ps
			INNER JOIN teams t ON t.id = ps.shared_with_team_id
			WHERE ps.playbook_id = ${playbookId}
			ORDER BY ps.shared_at DESC
		`
	}
}
