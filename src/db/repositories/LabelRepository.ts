import { db } from '../connection'
import type { Label } from '../types'

export class LabelRepository {
	async getPresetLabels(): Promise<Label[]> {
		return await db<Label[]>`
			SELECT id, team_id, name, color, is_preset, created_by, created_at, updated_at
			FROM labels
			WHERE is_preset = true
			ORDER BY name
		`
	}

	async getTeamLabels(teamId: number): Promise<Label[]> {
		return await db<Label[]>`
			SELECT id, team_id, name, color, is_preset, created_by, created_at, updated_at
			FROM labels
			WHERE is_preset = true OR team_id = ${teamId}
			ORDER BY is_preset DESC, name
		`
	}

	async create(data: { team_id: number; name: string; color: string; created_by: number }): Promise<Label> {
		const [label] = await db<Label[]>`
			INSERT INTO labels (team_id, name, color, is_preset, created_by)
			VALUES (${data.team_id}, ${data.name}, ${data.color}, false, ${data.created_by})
			RETURNING id, team_id, name, color, is_preset, created_by, created_at, updated_at
		`
		return label
	}

	async update(id: number, data: { name?: string; color?: string }): Promise<Label | null> {
		const [label] = await db<Label[]>`
			UPDATE labels SET
				name = COALESCE(${data.name ?? null}, name),
				color = COALESCE(${data.color ?? null}, color),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ${id} AND is_preset = false
			RETURNING id, team_id, name, color, is_preset, created_by, created_at, updated_at
		`
		return label ?? null
	}

	async delete(id: number): Promise<boolean> {
		const result = await db`DELETE FROM labels WHERE id = ${id} AND is_preset = false`
		return result.count > 0
	}

	async getPlayLabels(playId: number): Promise<Label[]> {
		return await db<Label[]>`
			SELECT l.id, l.team_id, l.name, l.color, l.is_preset, l.created_by, l.created_at, l.updated_at
			FROM labels l
			JOIN play_labels pl ON pl.label_id = l.id
			WHERE pl.play_id = ${playId}
			ORDER BY l.name
		`
	}

	async setPlayLabels(playId: number, labelIds: number[]): Promise<void> {
		await db`DELETE FROM play_labels WHERE play_id = ${playId}`
		if (labelIds.length > 0) {
			await db`
				INSERT INTO play_labels (play_id, label_id)
				SELECT ${playId}, unnest(${labelIds}::bigint[])
			`
		}
	}

	async getPlaybookLabels(playbookId: number): Promise<Label[]> {
		return await db<Label[]>`
			SELECT l.id, l.team_id, l.name, l.color, l.is_preset, l.created_by, l.created_at, l.updated_at
			FROM labels l
			JOIN playbook_labels pbl ON pbl.label_id = l.id
			WHERE pbl.playbook_id = ${playbookId}
			ORDER BY l.name
		`
	}

	async setPlaybookLabels(playbookId: number, labelIds: number[]): Promise<void> {
		await db`DELETE FROM playbook_labels WHERE playbook_id = ${playbookId}`
		if (labelIds.length > 0) {
			await db`
				INSERT INTO playbook_labels (playbook_id, label_id)
				SELECT ${playbookId}, unnest(${labelIds}::bigint[])
			`
		}
	}
}
