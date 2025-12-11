import {db} from '../connection'
import type {ConceptGroup, BaseConcept, Formation} from '../types'

type ConceptGroupWithDetails = ConceptGroup & {
	formation: Formation | null
	concepts: Array<BaseConcept & { order_index: number }>
}

type ConceptGroupUpdate = {
	name?: string
	description?: string | null
	formation_id?: number | null
}

export class ConceptGroupRepository {
	async create(data: {
		team_id: number
		playbook_id: number | null
		name: string
		description?: string
		formation_id?: number | null
		created_by: number
		concept_ids?: Array<{ concept_id: number; order_index?: number }>
	}): Promise<ConceptGroupWithDetails> {
		const [group] = await db<ConceptGroup[]>`
            INSERT INTO concept_groups (team_id, playbook_id, name, description, formation_id, created_by)
            VALUES (${data.team_id},
                    ${data.playbook_id},
                    ${data.name},
                    ${data.description ?? null},
                    ${data.formation_id ?? null},
                    ${data.created_by}) RETURNING *
		`

		if (!group) {
			throw new Error('Failed to create concept group')
		}

		if (data.concept_ids && data.concept_ids.length > 0) {
			await Promise.all(
				data.concept_ids.map((item, index) =>
					db`
                        INSERT INTO concept_group_concepts (concept_group_id, concept_id, order_index)
                        VALUES (${group.id},
                                ${item.concept_id},
                                ${item.order_index ?? index})
					`
				)
			)
		}

		return await this.findById(group.id) as unknown as Promise<ConceptGroupWithDetails>
	}

	async findById(id: number): Promise<ConceptGroupWithDetails | null> {
		const [group] = await db<ConceptGroup[]>`
            SELECT *
            FROM concept_groups
            WHERE id = ${id}
		`

		if (!group) {
			return null
		}

		const formation = group.formation_id
			? await db<Formation[]>`
                    SELECT *
                    FROM formations
                    WHERE id = ${group.formation_id}
			`.then(rows => rows[0] ?? null)
			: null

		const concepts = await db<Array<BaseConcept & { order_index: number }>>`
            SELECT bc.*, cgc.order_index
            FROM base_concepts bc
                     INNER JOIN concept_group_concepts cgc ON cgc.concept_id = bc.id
            WHERE cgc.concept_group_id = ${id}
            ORDER BY cgc.order_index
		`

		return {
			...group,
			formation,
			concepts
		}
	}

	async getTeamGroups(
		teamId: number,
		playbookId?: number | null
	): Promise<ConceptGroup[]> {
		if (playbookId) {
			return await db<ConceptGroup[]>`
                SELECT *
                FROM concept_groups
                WHERE (team_id = ${teamId} AND playbook_id IS NULL)
                   OR (team_id = ${teamId} AND playbook_id = ${playbookId})
                ORDER BY usage_count DESC, last_used_at DESC NULLS LAST
			`
		}

		return await db<ConceptGroup[]>`
            SELECT *
            FROM concept_groups
            WHERE team_id = ${teamId}
              AND playbook_id IS NULL
            ORDER BY usage_count DESC, last_used_at DESC NULLS LAST
		`
	}

	async search(
		teamId: number,
		query: string,
		playbookId?: number | null,
		limit: number = 10
	): Promise<Array<ConceptGroup & { frecency_score: number }>> {
		const searchPattern = `%${query}%`

		if (playbookId) {
			return await db<Array<ConceptGroup & { frecency_score: number }>>`
                SELECT *,
                       (usage_count::float / (EXTRACT(EPOCH FROM (NOW() - COALESCE(last_used_at, created_at))) / 86400 + 1)) as frecency_score
                FROM concept_groups
                WHERE team_id = ${teamId}
                  AND (playbook_id IS NULL OR playbook_id = ${playbookId})
                  AND name ILIKE ${searchPattern}
                ORDER BY frecency_score DESC
                    LIMIT ${limit}
			`
		}

		return await db<Array<ConceptGroup & { frecency_score: number }>>`
            SELECT *,
                   (usage_count::float / (EXTRACT(EPOCH FROM (NOW() - COALESCE(last_used_at, created_at))) / 86400 + 1)) as frecency_score
            FROM concept_groups
            WHERE team_id = ${teamId}
              AND playbook_id IS NULL
              AND name ILIKE ${searchPattern}
            ORDER BY frecency_score DESC
                LIMIT ${limit}
		`
	}

	async update(
		id: number,
		data: ConceptGroupUpdate,
		concept_ids?: Array<{ concept_id: number; order_index?: number }>
	): Promise<ConceptGroupWithDetails | null> {
		if (Object.keys(data).length === 0 && !concept_ids) {
			return this.findById(id)
		}

		if (Object.keys(data).length > 0) {
			const [group] = await db<ConceptGroup[]>`
                UPDATE concept_groups
                SET name         = COALESCE(${data.name ?? null}, name),
                    description  = COALESCE(${data.description ?? null}, description),
                    formation_id = COALESCE(${data.formation_id ?? null}, formation_id),
                    updated_at   = CURRENT_TIMESTAMP
                WHERE id = ${id} RETURNING *
			`

			if (!group) {
				return null
			}
		}

		if (concept_ids) {
			await db`DELETE
                     FROM concept_group_concepts
                     WHERE concept_group_id = ${id}`

			await Promise.all(
				concept_ids.map((item, index) =>
					db`
                        INSERT INTO concept_group_concepts (concept_group_id, concept_id, order_index)
                        VALUES (${id},
                                ${item.concept_id},
                                ${item.order_index ?? index})
					`
				)
			)
		}

		return this.findById(id)
	}

	async incrementUsage(id: number): Promise<void> {
		await db`
            UPDATE concept_groups
            SET usage_count  = usage_count + 1,
                last_used_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
		`
	}

	async delete(id: number): Promise<void> {
		await db`DELETE
                 FROM concept_groups
                 WHERE id = ${id}`
	}
}
