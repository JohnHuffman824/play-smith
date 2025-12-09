import { db } from '../connection';
import type { Playbook } from '../types';

export class PlaybookRepository {
	async create(data: {
		team_id: number;
		name: string;
		description?: string;
		created_by: number;
	}): Promise<Playbook> {
		const [playbook] = await db<Playbook[]>`
			INSERT INTO playbooks (team_id, name, description, created_by)
			VALUES (${data.team_id}, ${data.name}, ${data.description || null}, ${data.created_by})
			RETURNING *
		`;

		return playbook;
	}

	async findById(id: number): Promise<Playbook | null> {
		const [playbook] = await db<Playbook[]>`
			SELECT * FROM playbooks WHERE id = ${id}
		`;

		return playbook || null;
	}

	async getTeamPlaybooks(teamId: number): Promise<Playbook[]> {
		return await db<Playbook[]>`
			SELECT * FROM playbooks
			WHERE team_id = ${teamId}
			ORDER BY updated_at DESC
		`;
	}

	async update(
		id: number,
		data: Partial<{ name: string; description: string }>
	): Promise<Playbook | null> {
		if (Object.keys(data).length === 0) {
			return this.findById(id);
		}

		// Handle updates based on which fields are provided
		if (data.name !== undefined && data.description !== undefined) {
			const [playbook] = await db<Playbook[]>`
				UPDATE playbooks
				SET name = ${data.name}, description = ${data.description}
				WHERE id = ${id}
				RETURNING *
			`;
			return playbook || null;
		} else if (data.name !== undefined) {
			const [playbook] = await db<Playbook[]>`
				UPDATE playbooks
				SET name = ${data.name}
				WHERE id = ${id}
				RETURNING *
			`;
			return playbook || null;
		} else if (data.description !== undefined) {
			const [playbook] = await db<Playbook[]>`
				UPDATE playbooks
				SET description = ${data.description}
				WHERE id = ${id}
				RETURNING *
			`;
			return playbook || null;
		}

		return this.findById(id);
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM playbooks WHERE id = ${id}`;
	}
}
