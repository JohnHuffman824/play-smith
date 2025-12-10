import { TeamRepository } from '../db/repositories/TeamRepository'
import { FormationRepository } from '../db/repositories/FormationRepository'
import { BaseConceptRepository } from '../db/repositories/BaseConceptRepository'
import { ConceptGroupRepository } from '../db/repositories/ConceptGroupRepository'
import { getSessionUser } from './middleware/auth'

const teamRepo = new TeamRepository()
const formationRepo = new FormationRepository()
const conceptRepo = new BaseConceptRepository()
const groupRepo = new ConceptGroupRepository()

export const unifiedSearchAPI = {
	search: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.teamId)
		if (isNaN(teamId)) {
			return Response.json({ error: 'Invalid team ID' }, { status: 400 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === teamId)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const url = new URL(req.url)
		const query = url.searchParams.get('q') ?? ''
		const limit = parseInt(url.searchParams.get('limit') ?? '10')
		const playbookId = url.searchParams.get('playbookId')
		const playbookIdNum = playbookId ? parseInt(playbookId) : null

		if (!query.trim()) {
			return Response.json({
				formations: [],
				concepts: [],
				groups: []
			})
		}

		const [formations, concepts, groups] = await Promise.all([
			formationRepo.getTeamFormations(teamId).then(all =>
				all
					.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
					.slice(0, limit)
					.map(f => ({
						type: 'formation' as const,
						id: f.id,
						name: f.name,
						frecencyScore: 0
					}))
			),
			conceptRepo
				.search(teamId, query, playbookIdNum, limit)
				.then(results =>
					results.map(c => ({
						type: 'concept' as const,
						id: c.id,
						name: c.name,
						frecencyScore: c.frecency_score
					}))
				),
			groupRepo
				.search(teamId, query, playbookIdNum, limit)
				.then(results =>
					results.map(g => ({
						type: 'concept_group' as const,
						id: g.id,
						name: g.name,
						frecencyScore: g.frecency_score
					}))
				)
		])

		return Response.json({
			formations,
			concepts,
			groups
		})
	}
}
