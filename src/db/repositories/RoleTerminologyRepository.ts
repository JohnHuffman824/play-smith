import { db } from '../connection'
import type { RoleTerminology } from '../types'

export class RoleTerminologyRepository {
	async getTeamRoles(teamId: number): Promise<RoleTerminology[]> {
		return await db<RoleTerminology[]>`
			SELECT * FROM role_terminology
			WHERE team_id = ${teamId}
			ORDER BY standard_role
		`
	}

	async upsert(
		teamId: number,
		standardRole: string,
		customName: string,
		positionType: 'receiver' | 'back' | 'line' | 'tight_end'
	): Promise<RoleTerminology> {
		const [role] = await db<RoleTerminology[]>`
			INSERT INTO role_terminology (
				team_id, standard_role, custom_name, position_type
			)
			VALUES (
				${teamId},
				${standardRole},
				${customName},
				${positionType}
			)
			ON CONFLICT (team_id, standard_role)
			DO UPDATE SET
				custom_name = EXCLUDED.custom_name,
				updated_at = CURRENT_TIMESTAMP
			RETURNING *
		`

		if (!role) {
			throw new Error('Failed to upsert role terminology')
		}

		return role
	}
}
