import { db } from '../connection'
import type { Team, TeamMember } from '../types'

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
}
