import { db } from '../connection'
import type { TeamInvitation } from '../types'

export class InvitationRepository {
	// Create a new team invitation
	async create(data: {
		team_id: number
		email: string
		role: 'owner' | 'editor' | 'viewer'
		token: string
		invited_by: number
		expires_at: Date
	}): Promise<TeamInvitation> {
		const [invitation] = await db<TeamInvitation[]>`
			INSERT INTO team_invitations (team_id, email, role, token, invited_by, expires_at)
			VALUES (${data.team_id}, ${data.email}, ${data.role}, ${data.token}, ${data.invited_by}, ${data.expires_at})
			RETURNING *
		`
		return invitation
	}

	// Find valid invitation by token (not accepted, not expired)
	async findByToken(token: string): Promise<TeamInvitation | null> {
		const [invitation] = await db<TeamInvitation[]>`
			SELECT * FROM team_invitations
			WHERE token = ${token}
			AND accepted_at IS NULL
			AND expires_at > CURRENT_TIMESTAMP
		`
		return invitation ?? null
	}

	// Find all pending invitations for a team
	async findPendingByTeam(teamId: number): Promise<TeamInvitation[]> {
		return await db<TeamInvitation[]>`
			SELECT * FROM team_invitations
			WHERE team_id = ${teamId}
			AND accepted_at IS NULL
			AND expires_at > CURRENT_TIMESTAMP
			ORDER BY created_at DESC
		`
	}

	// Mark invitation as accepted
	async markAccepted(id: number): Promise<void> {
		await db`
			UPDATE team_invitations
			SET accepted_at = CURRENT_TIMESTAMP
			WHERE id = ${id}
		`
	}

	// Delete/cancel an invitation
	async delete(id: number): Promise<void> {
		await db`DELETE FROM team_invitations WHERE id = ${id}`
	}

	// Delete invitations by email for a specific team
	async deleteByEmail(teamId: number, email: string): Promise<void> {
		await db`
			DELETE FROM team_invitations
			WHERE team_id = ${teamId} AND email = ${email}
		`
	}
}
