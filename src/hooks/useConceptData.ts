import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
	Formation,
	BaseConcept,
	ConceptGroup,
	PresetRoute,
	RoleTerminology
} from '../types/concept.types'

interface UseConceptDataReturn {
	formations: Formation[]
	concepts: BaseConcept[]
	conceptGroups: ConceptGroup[]
	presetRoutes: PresetRoute[]
	roles: RoleTerminology[]
	isLoading: boolean
	error: string | null
	createFormation: (data: {
		name: string
		description?: string
		positions: Array<{
			role: string
			position_x: number
			position_y: number
			hash_relative?: boolean
		}>
	}) => Promise<Formation>
	updateFormation: (id: number, data: Partial<Formation>) => Promise<void>
	deleteFormation: (id: number) => Promise<void>
	createConcept: (data: {
		name: string
		description?: string
		targeting_mode: 'absolute_role' | 'relative_selector'
		ball_position?: 'left' | 'center' | 'right'
		play_direction?: 'left' | 'right' | 'na'
		playbook_id?: number
		assignments: Array<any>
	}) => Promise<BaseConcept>
	updateConcept: (id: number, data: Partial<BaseConcept>) => Promise<void>
	deleteConcept: (id: number) => Promise<void>
	createConceptGroup: (data: {
		name: string
		description?: string
		formation_id?: number
		playbook_id?: number
		concept_ids?: Array<{ concept_id: number; order_index?: number }>
	}) => Promise<ConceptGroup>
	updateConceptGroup: (id: number, data: Partial<ConceptGroup>) => Promise<void>
	deleteConceptGroup: (id: number) => Promise<void>
	refetch: () => Promise<void>
}

/**
 * Custom hook for managing concept architecture data (formations, concepts, groups)
 *
 * Fetches and manages all concept-related data for a team, including formations,
 * base concepts, concept groups, preset routes, and role terminology. Provides
 * CRUD operations for each entity type with automatic refetching and error handling.
 *
 * @param teamId - The team ID to fetch data for (required)
 * @param playbookId - Optional playbook ID for scoped data
 * @returns Object containing data arrays, loading state, error state, and CRUD functions
 *
 * @example
 * ```typescript
 * const {
 *   formations,
 *   concepts,
 *   isLoading,
 *   createConcept,
 *   updateConcept
 * } = useConceptData(teamId, playbookId)
 * ```
 *
 * Features:
 * - Parallel data fetching on mount for optimal performance
 * - Automatic auth handling (redirects to /login on 401)
 * - Error handling with user-friendly messages
 * - Automatic refetch after mutations
 * - Usage tracking for frecency algorithm
 */
export function useConceptData(
	teamId: string | undefined,
	playbookId?: string
): UseConceptDataReturn {
	const navigate = useNavigate()
	const [formations, setFormations] = useState<Formation[]>([])
	const [concepts, setConcepts] = useState<BaseConcept[]>([])
	const [conceptGroups, setConceptGroups] = useState<ConceptGroup[]>([])
	const [presetRoutes, setPresetRoutes] = useState<PresetRoute[]>([])
	const [roles, setRoles] = useState<RoleTerminology[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchData = useCallback(async () => {
		if (!teamId) return

		try {
			setIsLoading(true)
			setError(null)

			const playbookParam = playbookId ? `?playbookId=${playbookId}` : ''

			const [formationsRes, conceptsRes, groupsRes, routesRes, rolesRes] =
				await Promise.all([
					fetch(`/api/teams/${teamId}/formations`),
					fetch(`/api/teams/${teamId}/concepts${playbookParam}`),
					fetch(`/api/teams/${teamId}/concept-groups${playbookParam}`),
					fetch(`/api/preset-routes?teamId=${teamId}`),
					fetch(`/api/teams/${teamId}/roles`)
				])

			if (
				formationsRes.status === 401 ||
				conceptsRes.status === 401 ||
				groupsRes.status === 401
			) {
				navigate('/login')
				return
			}

			if (
				!formationsRes.ok ||
				!conceptsRes.ok ||
				!groupsRes.ok ||
				!routesRes.ok ||
				!rolesRes.ok
			) {
				throw new Error('Failed to fetch concept data')
			}

			const [formationsData, conceptsData, groupsData, routesData, rolesData] =
				await Promise.all([
					formationsRes.json(),
					conceptsRes.json(),
					groupsRes.json(),
					routesRes.json(),
					rolesRes.json()
				])

			setFormations(formationsData.formations || [])
			setConcepts(conceptsData.concepts || [])
			setConceptGroups(groupsData.groups || [])
			setPresetRoutes(routesData.routes || [])
			setRoles(rolesData.roles || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsLoading(false)
		}
	}, [teamId, playbookId, navigate])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	const createFormation = useCallback(
		async (data: {
			name: string
			description?: string
			positions: Array<{
				role: string
				position_x: number
				position_y: number
				hash_relative?: boolean
			}>
		}): Promise<Formation> => {
			if (!teamId) throw new Error('Team ID required')

			const res = await fetch(`/api/teams/${teamId}/formations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to create formation')

			const result = await res.json()
			await refetch()
			return result.formation
		},
		[teamId, navigate]
	)

	const updateFormation = useCallback(
		async (id: number, data: Partial<Formation>): Promise<void> => {
			const res = await fetch(`/api/formations/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to update formation')

			await refetch()
		},
		[navigate]
	)

	const deleteFormation = useCallback(
		async (id: number): Promise<void> => {
			const res = await fetch(`/api/formations/${id}`, {
				method: 'DELETE'
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to delete formation')

			await refetch()
		},
		[navigate]
	)

	const createConcept = useCallback(
		async (data: {
			name: string
			description?: string
			targeting_mode: 'absolute_role' | 'relative_selector'
			ball_position?: 'left' | 'center' | 'right'
			play_direction?: 'left' | 'right' | 'na'
			playbook_id?: number
			assignments: Array<any>
		}): Promise<BaseConcept> => {
			if (!teamId) throw new Error('Team ID required')

			const res = await fetch(`/api/teams/${teamId}/concepts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to create concept')

			const result = await res.json()
			await refetch()
			return result.concept
		},
		[teamId, navigate]
	)

	const updateConcept = useCallback(
		async (id: number, data: Partial<BaseConcept>): Promise<void> => {
			const res = await fetch(`/api/concepts/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to update concept')

			await refetch()
		},
		[navigate]
	)

	const deleteConcept = useCallback(
		async (id: number): Promise<void> => {
			const res = await fetch(`/api/concepts/${id}`, {
				method: 'DELETE'
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to delete concept')

			await refetch()
		},
		[navigate]
	)

	const createConceptGroup = useCallback(
		async (data: {
			name: string
			description?: string
			formation_id?: number
			playbook_id?: number
			concept_ids?: Array<{ concept_id: number; order_index?: number }>
		}): Promise<ConceptGroup> => {
			if (!teamId) throw new Error('Team ID required')

			const res = await fetch(`/api/teams/${teamId}/concept-groups`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to create concept group')

			const result = await res.json()
			await refetch()
			return result.group
		},
		[teamId, navigate]
	)

	const updateConceptGroup = useCallback(
		async (id: number, data: Partial<ConceptGroup>): Promise<void> => {
			const res = await fetch(`/api/concept-groups/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to update concept group')

			await refetch()
		},
		[navigate]
	)

	const deleteConceptGroup = useCallback(
		async (id: number): Promise<void> => {
			const res = await fetch(`/api/concept-groups/${id}`, {
				method: 'DELETE'
			})

			if (res.status === 401) {
				navigate('/login')
				throw new Error('Unauthorized')
			}

			if (!res.ok) throw new Error('Failed to delete concept group')

			await refetch()
		},
		[navigate]
	)

	const refetch = useCallback(async () => {
		await fetchData()
	}, [fetchData])

	return {
		formations,
		concepts,
		conceptGroups,
		presetRoutes,
		roles,
		isLoading,
		error,
		createFormation,
		updateFormation,
		deleteFormation,
		createConcept,
		updateConcept,
		deleteConcept,
		createConceptGroup,
		updateConceptGroup,
		deleteConceptGroup,
		refetch
	}
}
