import { db } from '../connection'
import type { Tag, PlayTag, PlaybookTag } from '../types'

export class TagRepository {
	async getPresetTags(): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT * FROM tags WHERE is_preset = true ORDER BY name
		`
	}

	async getTeamTags(teamId: number): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT * FROM tags
			WHERE is_preset = true OR team_id = ${teamId}
			ORDER BY is_preset DESC, name
		`
	}

	async create(data: { team_id: number; name: string; color: string; created_by: number }): Promise<Tag> {
		const [tag] = await db<Tag[]>`
			INSERT INTO tags (team_id, name, color, is_preset, created_by)
			VALUES (${data.team_id}, ${data.name}, ${data.color}, false, ${data.created_by})
			RETURNING *
		`
		return tag
	}

	async update(id: number, data: { name?: string; color?: string }): Promise<Tag | null> {
		const [tag] = await db<Tag[]>`
			UPDATE tags SET
				name = COALESCE(${data.name ?? null}, name),
				color = COALESCE(${data.color ?? null}, color),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ${id} AND is_preset = false
			RETURNING *
		`
		return tag ?? null
	}

	async delete(id: number): Promise<boolean> {
		const result = await db`DELETE FROM tags WHERE id = ${id} AND is_preset = false`
		return result.count > 0
	}

	async getPlayTags(playId: number): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT t.* FROM tags t
			JOIN play_tags pt ON pt.tag_id = t.id
			WHERE pt.play_id = ${playId}
			ORDER BY t.name
		`
	}

	async setPlayTags(playId: number, tagIds: number[]): Promise<void> {
		await db`DELETE FROM play_tags WHERE play_id = ${playId}`
		if (tagIds.length > 0) {
			await db`
				INSERT INTO play_tags (play_id, tag_id)
				SELECT ${playId}, unnest(${tagIds}::bigint[])
			`
		}
	}

	async getPlaybookTags(playbookId: number): Promise<Tag[]> {
		return await db<Tag[]>`
			SELECT t.* FROM tags t
			JOIN playbook_tags pbt ON pbt.tag_id = t.id
			WHERE pbt.playbook_id = ${playbookId}
			ORDER BY t.name
		`
	}

	async setPlaybookTags(playbookId: number, tagIds: number[]): Promise<void> {
		await db`DELETE FROM playbook_tags WHERE playbook_id = ${playbookId}`
		if (tagIds.length > 0) {
			await db`
				INSERT INTO playbook_tags (playbook_id, tag_id)
				SELECT ${playbookId}, unnest(${tagIds}::bigint[])
			`
		}
	}
}
