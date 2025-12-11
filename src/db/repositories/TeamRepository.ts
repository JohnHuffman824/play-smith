import { db } from '../connection'
import type { Team, TeamMember, TeamMemberWithUser } from '../types'

export class TeamRepository {
	// Creates a team and returns DB defaults in one request
	async create(data: { name: string }): Promise<Team> {
		const [team] = await db<Team[]>`
			INSERT INTO teams (name)
			VALUES (${data.name})
			RETURNING *
		`

		return team
	}

	// Retrieves team by id or null when missing
	async findById(id: number): Promise<Team | null> {
		const [team] = await db<Team[]>`
			SELECT * FROM teams WHERE id = ${id}
		`

		return team ?? null
	}

	// Adds a member to a team and returns the persisted record
	async addMember(data: {
		team_id: number
		user_id: number
		role: 'owner' | 'editor' | 'viewer'
	}): Promise<TeamMember> {
		const [member] = await db<TeamMember[]>`
			INSERT INTO team_members (team_id, user_id, role)
			VALUES (${data.team_id}, ${data.user_id}, ${data.role})
			RETURNING *
		`

		return member
	}

	// Lists all members for the given team
	async getMembers(teamId: number): Promise<TeamMember[]> {
		return await db<TeamMember[]>`
			SELECT * FROM team_members WHERE team_id = ${teamId}
		`
	}

	// Lists teams a user belongs to ordered by join date
	async getUserTeams(userId: number): Promise<Team[]> {
		return await db<Team[]>`
			SELECT t.*
			FROM teams t
			INNER JOIN team_members tm ON t.id = tm.team_id
			WHERE tm.user_id = ${userId}
			ORDER BY tm.joined_at DESC
		`
	}

	// Removes a member from a team
	async removeMember(teamId: number, userId: number): Promise<void> {
		await db`
			DELETE FROM team_members
			WHERE team_id = ${teamId} AND user_id = ${userId}
		`
	}

	// Update team name
	async update(id: number, data: { name: string }): Promise<Team> {
		const [team] = await db<Team[]>`
			UPDATE teams
			SET name = ${data.name}, updated_at = CURRENT_TIMESTAMP
			WHERE id = ${id}
			RETURNING *
		`
		return team
	}

	// Delete team (cascade will remove members and invitations)
	async delete(id: number): Promise<void> {
		await db`DELETE FROM teams WHERE id = ${id}`
	}

	// Get members with user details
	async getMembersWithUsers(teamId: number): Promise<TeamMemberWithUser[]> {
		return await db<TeamMemberWithUser[]>`
			SELECT
				tm.*,
				u.email as user_email,
				u.name as user_name
			FROM team_members tm
			INNER JOIN users u ON tm.user_id = u.id
			WHERE tm.team_id = ${teamId}
			ORDER BY tm.joined_at ASC
		`
	}

	// Update member role
	async updateMemberRole(
		teamId: number,
		userId: number,
		role: 'owner' | 'editor' | 'viewer'
	): Promise<void> {
		await db`
			UPDATE team_members
			SET role = ${role}
			WHERE team_id = ${teamId} AND user_id = ${userId}
		`
	}

	// Check if user is owner of team
	async isOwner(teamId: number, userId: number): Promise<boolean> {
		const [result] = await db<{ exists: boolean }[]>`
			SELECT EXISTS(
				SELECT 1 FROM team_members
				WHERE team_id = ${teamId}
				AND user_id = ${userId}
				AND role = 'owner'
			) as exists
		`
		return result?.exists ?? false
	}

	// Get user's role in team
	async getUserRole(teamId: number, userId: number): Promise<'owner' | 'editor' | 'viewer' | null> {
		const [member] = await db<{ role: 'owner' | 'editor' | 'viewer' }[]>`
			SELECT role FROM team_members
			WHERE team_id = ${teamId} AND user_id = ${userId}
		`
		return member?.role ?? null
	}

	// Get teams with user's role included
	async getUserTeamsWithRole(userId: number): Promise<(Team & { role: 'owner' | 'editor' | 'viewer' })[]> {
		return await db<(Team & { role: 'owner' | 'editor' | 'viewer' })[]>`
			SELECT t.*, tm.role
			FROM teams t
			INNER JOIN team_members tm ON t.id = tm.team_id
			WHERE tm.user_id = ${userId}
			ORDER BY tm.joined_at DESC
		`
	}
}
