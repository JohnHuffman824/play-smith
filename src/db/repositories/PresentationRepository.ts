import { db } from '../connection'
import type { Presentation, PresentationSlide } from '../types'

type PresentationUpdate = {
	name?: string
	description?: string | null
}

export class PresentationRepository {
	async create(data: {
		playbook_id: number
		name: string
		description?: string | null
		created_by: number
	}): Promise<Presentation> {
		const [presentation] = await db<Presentation[]>`
			INSERT INTO presentations (playbook_id, name, description, created_by)
			VALUES (${data.playbook_id}, ${data.name}, ${data.description ?? null}, ${data.created_by})
			RETURNING *
		`
		return presentation
	}

	async findById(id: number): Promise<Presentation | null> {
		const [presentation] = await db<Presentation[]>`
			SELECT * FROM presentations WHERE id = ${id}
		`
		return presentation ?? null
	}

	async getPlaybookPresentations(playbookId: number): Promise<Array<Presentation & { slide_count: number }>> {
		return await db<Array<Presentation & { slide_count: number }>>`
			SELECT p.*, COALESCE(COUNT(ps.id), 0)::int as slide_count
			FROM presentations p
			LEFT JOIN presentation_slides ps ON ps.presentation_id = p.id
			WHERE p.playbook_id = ${playbookId}
			GROUP BY p.id
			ORDER BY p.updated_at DESC
		`
	}

	async update(id: number, data: PresentationUpdate): Promise<Presentation | null> {
		if (Object.keys(data).length === 0) {
			return this.findById(id)
		}
		const [presentation] = await db<Presentation[]>`
			UPDATE presentations
			SET
				name = COALESCE(${data.name ?? null}, name),
				description = CASE
					WHEN ${data.description !== undefined}
					THEN ${data.description ?? null}
					ELSE description
				END
			WHERE id = ${id}
			RETURNING *
		`
		return presentation ?? null
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM presentations WHERE id = ${id}`
	}

	async getSlides(presentationId: number): Promise<Array<PresentationSlide & { play_name: string | null }>> {
		return await db`
			SELECT ps.*, p.name as play_name
			FROM presentation_slides ps
			JOIN plays p ON p.id = ps.play_id
			WHERE ps.presentation_id = ${presentationId}
			ORDER BY ps.display_order ASC
		`
	}

	async addSlide(presentationId: number, playId: number): Promise<PresentationSlide> {
		const [maxOrder] = await db`
			SELECT COALESCE(MAX(display_order), -1) as max_order
			FROM presentation_slides WHERE presentation_id = ${presentationId}
		`
		const nextOrder = (maxOrder?.max_order ?? -1) + 1
		const [slide] = await db<PresentationSlide[]>`
			INSERT INTO presentation_slides (presentation_id, play_id, display_order)
			VALUES (${presentationId}, ${playId}, ${nextOrder})
			RETURNING *
		`
		return slide
	}

	async removeSlide(slideId: number): Promise<void> {
		await db`DELETE FROM presentation_slides WHERE id = ${slideId}`
	}

	async reorderSlides(presentationId: number, slideOrders: { id: number; display_order: number }[]): Promise<void> {
		await db.begin(async (sql) => {
			for (const { id, display_order } of slideOrders) {
				await sql`
					UPDATE presentation_slides
					SET display_order = ${display_order}
					WHERE id = ${id} AND presentation_id = ${presentationId}
				`
			}
		})
	}
}
