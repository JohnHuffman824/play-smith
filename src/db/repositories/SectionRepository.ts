import { db } from '../connection'
import type { Section } from '../types'

type SectionUpdate = {
	name?: string
	display_order?: number
}

export class SectionRepository {
	// Creates a section and returns DB defaults in one call
	async create(playbookId: number, name: string, displayOrder: number): Promise<Section> {
		const [section] = await db<Section[]>`
			INSERT INTO sections (playbook_id, name, display_order)
			VALUES (
				${playbookId},
				${name},
				${displayOrder}
			)
			RETURNING id, playbook_id, name, display_order, created_at, updated_at
		`

		return section
	}

	// Fetches a section by id or null when missing
	async findById(id: number): Promise<Section | null> {
		const [section] = await db<Section[]>`
			SELECT id, playbook_id, name, display_order, created_at, updated_at
			FROM sections
			WHERE id = ${id}
		`

		return section ?? null
	}

	// Lists sections for a playbook ordered by display_order
	async findByPlaybookId(playbookId: number): Promise<Section[]> {
		return await db<Section[]>`
			SELECT id, playbook_id, name, display_order, created_at, updated_at
			FROM sections
			WHERE playbook_id = ${playbookId}
			ORDER BY display_order ASC
		`
	}

	// Applies provided fields to an existing section
	async update(id: number, data: SectionUpdate): Promise<Section> {
		if (Object.keys(data).length === 0) {
			const section = await this.findById(id)
			if (!section) {
				throw new Error(`Section with id ${id} not found`)
			}
			return section
		}

		// Build dynamic UPDATE
		const updates: string[] = []
		const values: any[] = []

		if (data.name !== undefined) {
			updates.push('name')
			values.push(data.name)
		}
		if (data.display_order !== undefined) {
			updates.push('display_order')
			values.push(data.display_order)
		}

		const setClause = updates.map((col, i) => `${col} = $${i + 1}`).join(', ')
		const query = `
			UPDATE sections
			SET ${setClause}
			WHERE id = $${updates.length + 1}
			RETURNING id, playbook_id, name, display_order, created_at, updated_at
		`

		const [section] = await db.unsafe(query, [...values, id])

		if (!section) {
			throw new Error(`Section with id ${id} not found`)
		}

		return section
	}

	// Removes a section by id
	async delete(id: number): Promise<void> {
		await db`DELETE FROM sections WHERE id = ${id}`
	}

	// Batch updates display_order for multiple sections
	async reorder(playbookId: number, sectionOrders: { id: number; display_order: number }[]): Promise<void> {
		if (sectionOrders.length === 0) return

		// Use a single UPDATE with CASE to avoid N+1 queries
		const ids = sectionOrders.map(s => s.id)
		const whenClauses = sectionOrders.map((s, i) => `WHEN $${i * 2 + 1} THEN $${i * 2 + 2}`).join(' ')
		const params = sectionOrders.flatMap(s => [s.id, s.display_order])

		const query = `
			UPDATE sections
			SET display_order = CASE id
				${whenClauses}
			END
			WHERE id = ANY($${params.length + 1}::bigint[])
			AND playbook_id = $${params.length + 2}
		`

		await db.unsafe(query, [...params, ids, playbookId])
	}
}
