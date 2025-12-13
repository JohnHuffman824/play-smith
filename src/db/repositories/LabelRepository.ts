import { db } from '../connection'
import type { Tag, PlayTag, PlaybookTag } from '../types'

export class LabelRepository {
	async getPresetTags(): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT id, team_id, name, color, is_preset, created_by, created_at, updated_at
			FROM labels
			WHERE is_preset = true
			ORDER BY name
		`
	}

	async getTeamTags(teamId: number): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT id, team_id, name, color, is_preset, created_by, created_at, updated_at
			FROM labels
			WHERE is_preset = true OR team_id = ${teamId}
			ORDER BY is_preset DESC, name
		`
	}

	async create(data: { team_id: number; name: string; color: string; created_by: number }): Promise<Tag> {
		const [tag] = await db<Tag[]>`
			INSERT INTO labels (team_id, name, color, is_preset, created_by)
			VALUES (${data.team_id}, ${data.name}, ${data.color}, false, ${data.created_by})
			RETURNING id, team_id, name, color, is_preset, created_by, created_at, updated_at
		`
		return tag
	}

	async update(id: number, data: { name?: string; color?: string }): Promise<Tag | null> {
		const [tag] = await db<Tag[]>`
			UPDATE labels SET
				name = COALESCE(${data.name ?? null}, name),
				color = COALESCE(${data.color ?? null}, color),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ${id} AND is_preset = false
			RETURNING id, team_id, name, color, is_preset, created_by, created_at, updated_at
		`
		return tag ?? null
	}

	async delete(id: number): Promise<boolean> {
		const result = await db`DELETE FROM labels WHERE id = ${id} AND is_preset = false`
		return result.count > 0
	}

	async getPlayTags(playId: number): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT t.id, t.team_id, t.name, t.color, t.is_preset, t.created_by, t.created_at, t.updated_at
			FROM labels t
			JOIN play_labels pt ON pt.label_id = t.id
			WHERE pt.play_id = ${playId}
			ORDER BY t.name
		`
	}

	async setPlayTags(playId: number, tagIds: number[]): Promise<void> {
		await db`DELETE FROM play_labels WHERE play_id = ${playId}`
		if (tagIds.length > 0) {
			await db`
				INSERT INTO play_labels (play_id, label_id)
				SELECT ${playId}, unnest(${tagIds}::bigint[])
			`
		}
	}

	async getPlaybookTags(playbookId: number): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT t.id, t.team_id, t.name, t.color, t.is_preset, t.created_by, t.created_at, t.updated_at
			FROM labels t
			JOIN playbook_labels pbt ON pbt.label_id = t.id
			WHERE pbt.playbook_id = ${playbookId}
			ORDER BY t.name
		`
	}

	async setPlaybookTags(playbookId: number, tagIds: number[]): Promise<void> {
		await db`DELETE FROM playbook_labels WHERE playbook_id = ${playbookId}`
		if (tagIds.length > 0) {
			await db`
				INSERT INTO playbook_labels (playbook_id, label_id)
				SELECT ${playbookId}, unnest(${tagIds}::bigint[])
			`
		}
	}
}
