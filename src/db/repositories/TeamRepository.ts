import { db } from '../connection';
import type { Team, TeamMember } from '../types';

export class TeamRepository {
	async create(data: { name: string }): Promise<Team> {
		const [team] = await db<Team[]>`
			INSERT INTO teams (name)
			VALUES (${data.name})
			RETURNING *
		`;

		return team;
	}

	async findById(id: number): Promise<Team | null> {
		const [team] = await db<Team[]>`
			SELECT * FROM teams WHERE id = ${id}
		`;

		return team || null;
	}

	async addMember(data: {
		team_id: number;
		user_id: number;
		role: 'owner' | 'editor' | 'viewer';
	}): Promise<TeamMember> {
		const [member] = await db<TeamMember[]>`
			INSERT INTO team_members (team_id, user_id, role)
			VALUES (${data.team_id}, ${data.user_id}, ${data.role})
			RETURNING *
		`;

		return member;
	}

	async getMembers(teamId: number): Promise<TeamMember[]> {
		return await db<TeamMember[]>`
			SELECT * FROM team_members WHERE team_id = ${teamId}
		`;
	}

	async getUserTeams(userId: number): Promise<Team[]> {
		return await db<Team[]>`
			SELECT t.*
			FROM teams t
			INNER JOIN team_members tm ON t.id = tm.team_id
			WHERE tm.user_id = ${userId}
			ORDER BY tm.joined_at DESC
		`;
	}

	async removeMember(teamId: number, userId: number): Promise<void> {
		await db`
			DELETE FROM team_members
			WHERE team_id = ${teamId} AND user_id = ${userId}
		`;
	}
}
