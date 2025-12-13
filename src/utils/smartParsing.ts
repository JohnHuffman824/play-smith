import type { ComposedConcept } from '../types/concept.types'
import type { PresetRoute } from '../db/seeds/preset_routes'

export type SmartParseResult =
  | { type: 'exact_match'; concept: { id: number; name: string } }
  | { type: 'composition'; composition: ComposedConcept }
  | { type: 'needs_role'; template_name: string; availableRoles: string[] }
  | { type: 'no_match'; suggestion: 'create_new' }

interface SavedConcept {
  id: number
  name: string
  targeting_mode: string
}

export function parseConceptQuery(
  query: string,
  savedConcepts: SavedConcept[],
  roles: string[],
  presetRoutes: PresetRoute[]
): SmartParseResult {
  const normalizedQuery = query.trim().toLowerCase()

  // Step 1: Check for exact match in saved concepts
  const exactMatch = savedConcepts.find(
    c => c.name.toLowerCase() === normalizedQuery
  )
  if (exactMatch) {
    return { type: 'exact_match', concept: exactMatch }
  }

  // Step 2: Try to parse as "Role Template" composition
  const words = query.trim().split(/\s+/)
  if (words.length >= 2) {
    const firstWord = words[0]
    if (!firstWord) return { type: 'suggestion', suggestion: 'create_new' }

    const potentialRole = firstWord.toUpperCase()
    const potentialTemplate = words.slice(1).join(' ')

    const roleMatch = roles.find(r => r.toUpperCase() === potentialRole)
    const templateMatch = presetRoutes.find(
      r => r.name.toLowerCase() === potentialTemplate.toLowerCase()
    )

    if (roleMatch && templateMatch) {
      return {
        type: 'composition',
        composition: {
          role: roleMatch,
          template_name: templateMatch.name,
          drawing_data: templateMatch.drawing_data,
          is_saved: false
        }
      }
    }
  }

  // Step 3: Check if query is a standalone preset route name
  const standaloneRoute = presetRoutes.find(
    r => r.name.toLowerCase() === normalizedQuery
  )
  if (standaloneRoute) {
    return {
      type: 'needs_role',
      template_name: standaloneRoute.name,
      availableRoles: roles
    }
  }

  // Step 4: No match found
  return { type: 'no_match', suggestion: 'create_new' }
}
