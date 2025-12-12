import { db } from '../connection'
import type { Folder } from '../types'

export class FolderRepository {
	async create(data: { user_id: number; name: string }): Promise<Folder> {
		const [folder] = await db<Folder[]>`
			INSERT INTO folders (user_id, name)
			VALUES (${data.user_id}, ${data.name})
			RETURNING *
		`
		return folder
	}

	async getUserFolders(userId: number): Promise<Folder[]> {
		return await db<Folder[]>`
			SELECT * FROM folders WHERE user_id = ${userId} ORDER BY name ASC
		`
	}

	async update(id: number, name: string): Promise<Folder | null> {
		const [folder] = await db<Folder[]>`
			UPDATE folders SET name = ${name} WHERE id = ${id} RETURNING *
		`
		return folder ?? null
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM folders WHERE id = ${id}`
	}
}
