import { db } from '../connection'
import type { ConceptApplication } from '../types'

export class ConceptApplicationRepository {
	async create(data: {
		play_id: number
		concept_id?: number
		concept_group_id?: number
		order_index?: number
	}): Promise<ConceptApplication> {
		const [application] = await db<ConceptApplication[]>`
			INSERT INTO concept_applications (
				play_id, concept_id, concept_group_id, order_index
			)
			VALUES (
				${data.play_id},
				${data.concept_id ?? null},
				${data.concept_group_id ?? null},
				${data.order_index ?? 0}
			)
			RETURNING *
		`

		if (!application) {
			throw new Error('Failed to create concept application')
		}

		return application
	}

	async getPlayApplications(playId: number): Promise<ConceptApplication[]> {
		return await db<ConceptApplication[]>`
			SELECT * FROM concept_applications
			WHERE play_id = ${playId}
			ORDER BY order_index
		`
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM concept_applications WHERE id = ${id}`
	}

	async reorder(
		playId: number,
		applicationIds: number[]
	): Promise<void> {
		await Promise.all(
			applicationIds.map((id, index) =>
				db`
					UPDATE concept_applications
					SET order_index = ${index}
					WHERE id = ${id} AND play_id = ${playId}
				`
			)
		)
	}
}
