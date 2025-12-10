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
			RETURNING *
		`

		return section
	}

	// Fetches a section by id or null when missing
	async findById(id: number): Promise<Section | null> {
		const [section] = await db<Section[]>`
			SELECT * FROM sections WHERE id = ${id}
		`

		return section ?? null
	}

	// Lists sections for a playbook ordered by display_order
	async findByPlaybookId(playbookId: number): Promise<Section[]> {
		return await db<Section[]>`
			SELECT * FROM sections
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

		const [section] = await db<Section[]>`
			UPDATE sections
			SET
				name = COALESCE(${data.name ?? null}, name),
				display_order = COALESCE(${data.display_order ?? null}, display_order)
			WHERE id = ${id}
			RETURNING *
		`

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
		// First, set all sections to temporary negative values to avoid unique constraint conflicts
		for (const { id } of sectionOrders) {
			const tempOrder = -id
			await db`
				UPDATE sections
				SET display_order = ${tempOrder}
				WHERE id = ${id} AND playbook_id = ${playbookId}
			`
		}

		// Then update to the final display_order values
		for (const { id, display_order } of sectionOrders) {
			await db`
				UPDATE sections
				SET display_order = ${display_order}
				WHERE id = ${id} AND playbook_id = ${playbookId}
			`
		}
	}
}
