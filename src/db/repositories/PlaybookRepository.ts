import { db } from '../connection';
import type { Playbook } from '../types';

export class PlaybookRepository {
	async create(data: {
		team_id: number;
		name: string;
		description?: string;
		created_by: number;
	}): Promise<Playbook> {
		const [result] = await db<any[]>`
			INSERT INTO playbooks (team_id, name, description, created_by)
			VALUES (${data.team_id}, ${data.name}, ${data.description || null}, ${data.created_by})
		`;

		const [playbook] = await db<Playbook[]>`
			SELECT * FROM playbooks WHERE id = ${result.insertId}
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
		const updates: string[] = [];
		const values: any[] = [];

		if (data.name !== undefined) {
			updates.push('name = ?');
			values.push(data.name);
		}
		if (data.description !== undefined) {
			updates.push('description = ?');
			values.push(data.description);
		}

		if (updates.length === 0) {
			return this.findById(id);
		}

		values.push(id);
		await db.unsafe(
			`UPDATE playbooks SET ${updates.join(', ')} WHERE id = ?`,
			values
		);

		return this.findById(id);
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM playbooks WHERE id = ${id}`;
	}
}
