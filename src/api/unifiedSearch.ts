import { db } from '../db/connection'
import { getSessionUser } from './middleware/auth'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { parseConceptQuery } from '../utils/smartParsing'
import { PRESET_ROUTES } from '../db/seeds/preset_routes'

const teamRepo = new TeamRepository()

export const unifiedSearchAPI = {
  search: async (req: Request) => {
    const userId = await getSessionUser(req)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const query = url.searchParams.get('q') || ''
    const stage = url.searchParams.get('stage') || 'open'
    const teamId = url.searchParams.get('teamId')
    const type = url.searchParams.get('type') // optional: motion, modifier

    if (!teamId) {
      return Response.json({ error: 'Team ID required' }, { status: 400 })
    }

    const teamIdNum = parseInt(teamId)
    if (isNaN(teamIdNum)) {
      return Response.json({ error: 'Invalid team ID' }, { status: 400 })
    }

    // Verify user has access to team
    const teams = await teamRepo.getUserTeams(userId)
    const hasAccess = teams.some(team => team.id === teamIdNum)

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const results: Record<string, any[]> = {}

    // Formation selection stage - only return formations
    if (stage === 'formation_select') {
      const formationResult = await db.query(
        `SELECT id, name, description FROM formations
         WHERE team_id = $1 AND name ILIKE $2
         ORDER BY name LIMIT 20`,
        [teamIdNum, `%${query}%`]
      )
      results.formations = formationResult.rows

      return Response.json({ results, parseResult: null })
    }

    // Open stage - return concepts, compositions, groups
    let conceptFilter = ''
    const params: any[] = [teamIdNum, `%${query}%`]

    if (type === 'motion') {
      conceptFilter = 'AND is_motion = true'
    } else if (type === 'modifier') {
      conceptFilter = 'AND is_modifier = true'
    }

    const conceptResult = await db.query(
      `SELECT id, name, targeting_mode, is_motion, is_modifier
       FROM base_concepts
       WHERE team_id = $1 AND name ILIKE $2 ${conceptFilter}
       ORDER BY name LIMIT 20`,
      params
    )
    results.concepts = conceptResult.rows

    // Get concept groups
    const groupResult = await db.query(
      `SELECT id, name FROM concept_groups
       WHERE team_id = $1 AND name ILIKE $2
       ORDER BY name LIMIT 10`,
      [teamIdNum, `%${query}%`]
    )
    results.concept_groups = groupResult.rows

    // Get available roles for smart parsing
    const roleResult = await db.query(
      `SELECT DISTINCT standard_role as role FROM role_terminology WHERE team_id = $1`,
      [teamIdNum]
    )
    const roleList = roleResult.rows.map((r: any) => r.role)

    // If no roles found in role_terminology, use default roles
    const defaultRoles = ['X', 'Y', 'Z', 'H', 'TE', 'RB', 'QB', 'FB', 'LT', 'LG', 'C', 'RG', 'RT']
    const roles = roleList.length > 0 ? roleList : defaultRoles

    // Smart parse the query
    const parseResult = parseConceptQuery(query, results.concepts, roles, PRESET_ROUTES)

    // If composition, add to results
    if (parseResult.type === 'composition') {
      results.compositions = [parseResult.composition]
    }

    return Response.json({ results, parseResult })
  }
}
