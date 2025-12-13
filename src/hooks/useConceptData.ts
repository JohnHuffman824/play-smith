import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type {
	Formation,
	BaseConcept,
	ConceptGroup,
	PresetRoute,
	RoleTerminology
} from '../types/concept.types'
import {
	conceptKeys,
	fetchFormations,
	createFormation as apiCreateFormation,
	updateFormation as apiUpdateFormation,
	deleteFormation as apiDeleteFormation,
	fetchConcepts,
	createConcept as apiCreateConcept,
	updateConcept as apiUpdateConcept,
	deleteConcept as apiDeleteConcept,
	fetchConceptGroups,
	createConceptGroup as apiCreateConceptGroup,
	updateConceptGroup as apiUpdateConceptGroup,
	deleteConceptGroup as apiDeleteConceptGroup,
	fetchPresetRoutes,
	fetchRoles,
	updateRoles as apiUpdateRoles
} from '../api/queries/conceptQueries'

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
	updateRoleTerminology: (roles: RoleTerminology[]) => Promise<void>
	refetch: () => Promise<void>
}

/**
 * Custom hook for managing concept architecture data with React Query
 *
 * Fetches and manages all concept-related data for a team using React Query
 * for automatic caching, background refetching, and optimistic updates.
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
 * - Automatic caching with React Query (5min stale, 10min cache)
 * - Background refetching on window focus
 * - Optimistic updates for instant UI feedback
 * - Automatic cache invalidation after mutations
 * - Parallel data fetching for optimal performance
 * - Auth handling (redirects to /login on 401)
 */
export function useConceptData(
	teamId: string | undefined,
	playbookId?: string
): UseConceptDataReturn {
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// Handle unauthorized errors globally
	const handleUnauthorized = (error: Error) => {
		if (error.message === 'UNAUTHORIZED') {
			navigate('/login')
		}
	}

	// =========================================================================
	// QUERIES
	// =========================================================================

	const {
		data: formations = [],
		isLoading: formationsLoading,
		error: formationsError
	} = useQuery({
		queryKey: conceptKeys.formations(teamId || ''),
		queryFn: () => fetchFormations(teamId!),
		enabled: !!teamId,
		onError: handleUnauthorized
	})

	const {
		data: concepts = [],
		isLoading: conceptsLoading,
		error: conceptsError
	} = useQuery({
		queryKey: conceptKeys.baseConcepts(teamId || '', playbookId),
		queryFn: () => fetchConcepts(teamId!, playbookId),
		enabled: !!teamId,
		onError: handleUnauthorized
	})

	const {
		data: conceptGroups = [],
		isLoading: groupsLoading,
		error: groupsError
	} = useQuery({
		queryKey: conceptKeys.conceptGroups(teamId || '', playbookId),
		queryFn: () => fetchConceptGroups(teamId!, playbookId),
		enabled: !!teamId,
		onError: handleUnauthorized
	})

	const {
		data: presetRoutes = [],
		isLoading: routesLoading,
		error: routesError
	} = useQuery({
		queryKey: conceptKeys.presetRoutes(),
		queryFn: fetchPresetRoutes,
		onError: handleUnauthorized
	})

	const {
		data: roles = [],
		isLoading: rolesLoading,
		error: rolesError
	} = useQuery({
		queryKey: conceptKeys.roles(teamId || ''),
		queryFn: () => fetchRoles(teamId!),
		enabled: !!teamId,
		onError: handleUnauthorized
	})

	// =========================================================================
	// MUTATIONS - FORMATIONS
	// =========================================================================

	const createFormationMutation = useMutation({
		mutationFn: (data: Parameters<typeof apiCreateFormation>[1]) =>
			apiCreateFormation(teamId!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.formations(teamId!)
			})
		},
		onError: handleUnauthorized
	})

	const updateFormationMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<Formation> }) =>
			apiUpdateFormation(id, data),
		onMutate: async ({ id, data }) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({
				queryKey: conceptKeys.formations(teamId!)
			})

			// Snapshot previous value
			const previous = queryClient.getQueryData<Formation[]>(
				conceptKeys.formations(teamId!)
			)

			// Optimistically update
			queryClient.setQueryData<Formation[]>(
				conceptKeys.formations(teamId!),
				old => old?.map(f => (f.id === id ? { ...f, ...data } : f))
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			// Rollback on error
			if (context?.previous) {
				queryClient.setQueryData(
					conceptKeys.formations(teamId!),
					context.previous
				)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.formations(teamId!)
			})
		}
	})

	const deleteFormationMutation = useMutation({
		mutationFn: apiDeleteFormation,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({
				queryKey: conceptKeys.formations(teamId!)
			})

			const previous = queryClient.getQueryData<Formation[]>(
				conceptKeys.formations(teamId!)
			)

			// Optimistically remove
			queryClient.setQueryData<Formation[]>(
				conceptKeys.formations(teamId!),
				old => old?.filter(f => f.id !== id)
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					conceptKeys.formations(teamId!),
					context.previous
				)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.formations(teamId!)
			})
		}
	})

	// =========================================================================
	// MUTATIONS - CONCEPTS
	// =========================================================================

	const createConceptMutation = useMutation({
		mutationFn: (data: Parameters<typeof apiCreateConcept>[1]) =>
			apiCreateConcept(teamId!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.baseConcepts(teamId!, playbookId)
			})
		},
		onError: handleUnauthorized
	})

	const updateConceptMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<BaseConcept> }) =>
			apiUpdateConcept(id, data),
		onMutate: async ({ id, data }) => {
			await queryClient.cancelQueries({
				queryKey: conceptKeys.baseConcepts(teamId!, playbookId)
			})

			const previous = queryClient.getQueryData<BaseConcept[]>(
				conceptKeys.baseConcepts(teamId!, playbookId)
			)

			queryClient.setQueryData<BaseConcept[]>(
				conceptKeys.baseConcepts(teamId!, playbookId),
				old => old?.map(c => (c.id === id ? { ...c, ...data } : c))
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					conceptKeys.baseConcepts(teamId!, playbookId),
					context.previous
				)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.baseConcepts(teamId!, playbookId)
			})
		}
	})

	const deleteConceptMutation = useMutation({
		mutationFn: apiDeleteConcept,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({
				queryKey: conceptKeys.baseConcepts(teamId!, playbookId)
			})

			const previous = queryClient.getQueryData<BaseConcept[]>(
				conceptKeys.baseConcepts(teamId!, playbookId)
			)

			queryClient.setQueryData<BaseConcept[]>(
				conceptKeys.baseConcepts(teamId!, playbookId),
				old => old?.filter(c => c.id !== id)
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					conceptKeys.baseConcepts(teamId!, playbookId),
					context.previous
				)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.baseConcepts(teamId!, playbookId)
			})
		}
	})

	// =========================================================================
	// MUTATIONS - CONCEPT GROUPS
	// =========================================================================

	const createConceptGroupMutation = useMutation({
		mutationFn: (data: Parameters<typeof apiCreateConceptGroup>[1]) =>
			apiCreateConceptGroup(teamId!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.conceptGroups(teamId!, playbookId)
			})
		},
		onError: handleUnauthorized
	})

	const updateConceptGroupMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<ConceptGroup> }) =>
			apiUpdateConceptGroup(id, data),
		onMutate: async ({ id, data }) => {
			await queryClient.cancelQueries({
				queryKey: conceptKeys.conceptGroups(teamId!, playbookId)
			})

			const previous = queryClient.getQueryData<ConceptGroup[]>(
				conceptKeys.conceptGroups(teamId!, playbookId)
			)

			queryClient.setQueryData<ConceptGroup[]>(
				conceptKeys.conceptGroups(teamId!, playbookId),
				old => old?.map(g => (g.id === id ? { ...g, ...data } : g))
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					conceptKeys.conceptGroups(teamId!, playbookId),
					context.previous
				)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.conceptGroups(teamId!, playbookId)
			})
		}
	})

	const deleteConceptGroupMutation = useMutation({
		mutationFn: apiDeleteConceptGroup,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({
				queryKey: conceptKeys.conceptGroups(teamId!, playbookId)
			})

			const previous = queryClient.getQueryData<ConceptGroup[]>(
				conceptKeys.conceptGroups(teamId!, playbookId)
			)

			queryClient.setQueryData<ConceptGroup[]>(
				conceptKeys.conceptGroups(teamId!, playbookId),
				old => old?.filter(g => g.id !== id)
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					conceptKeys.conceptGroups(teamId!, playbookId),
					context.previous
				)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.conceptGroups(teamId!, playbookId)
			})
		}
	})

	// =========================================================================
	// MUTATIONS - ROLES
	// =========================================================================

	const updateRolesMutation = useMutation({
		mutationFn: (_roles: RoleTerminology[]) => apiUpdateRoles(teamId!, _roles),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: conceptKeys.roles(teamId!)
			})
		},
		onError: handleUnauthorized
	})

	// =========================================================================
	// AGGREGATE STATE
	// =========================================================================

	const isLoading =
		formationsLoading ||
		conceptsLoading ||
		groupsLoading ||
		routesLoading ||
		rolesLoading

	const error =
		formationsError?.message ||
		conceptsError?.message ||
		groupsError?.message ||
		routesError?.message ||
		rolesError?.message ||
		null

	// =========================================================================
	// WRAPPER FUNCTIONS (maintain API compatibility)
	// =========================================================================

	const createFormation = async (
		data: Parameters<typeof apiCreateFormation>[1]
	): Promise<Formation> => {
		return createFormationMutation.mutateAsync(data)
	}

	const updateFormation = async (
		id: number,
		data: Partial<Formation>
	): Promise<void> => {
		await updateFormationMutation.mutateAsync({ id, data })
	}

	const deleteFormation = async (id: number): Promise<void> => {
		await deleteFormationMutation.mutateAsync(id)
	}

	const createConcept = async (
		data: Parameters<typeof apiCreateConcept>[1]
	): Promise<BaseConcept> => {
		return createConceptMutation.mutateAsync(data)
	}

	const updateConcept = async (
		id: number,
		data: Partial<BaseConcept>
	): Promise<void> => {
		await updateConceptMutation.mutateAsync({ id, data })
	}

	const deleteConcept = async (id: number): Promise<void> => {
		await deleteConceptMutation.mutateAsync(id)
	}

	const createConceptGroup = async (
		data: Parameters<typeof apiCreateConceptGroup>[1]
	): Promise<ConceptGroup> => {
		return createConceptGroupMutation.mutateAsync(data)
	}

	const updateConceptGroup = async (
		id: number,
		data: Partial<ConceptGroup>
	): Promise<void> => {
		await updateConceptGroupMutation.mutateAsync({ id, data })
	}

	const deleteConceptGroup = async (id: number): Promise<void> => {
		await deleteConceptGroupMutation.mutateAsync(id)
	}

	const updateRoleTerminology = async (
		roles: RoleTerminology[]
	): Promise<void> => {
		await updateRolesMutation.mutateAsync(roles)
	}

	const refetch = async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: conceptKeys.formations(teamId!)
			}),
			queryClient.invalidateQueries({
				queryKey: conceptKeys.baseConcepts(teamId!, playbookId)
			}),
			queryClient.invalidateQueries({
				queryKey: conceptKeys.conceptGroups(teamId!, playbookId)
			}),
			queryClient.invalidateQueries({ queryKey: conceptKeys.presetRoutes() }),
			queryClient.invalidateQueries({ queryKey: conceptKeys.roles(teamId!) })
		])
	}

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
		updateRoleTerminology,
		refetch
	}
}
