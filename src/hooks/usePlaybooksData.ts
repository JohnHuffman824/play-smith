import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useMemo, useCallback, useEffect } from 'react'
import type { Playbook } from '../db/types'
import {
	playbookKeys,
	fetchPlaybooks,
	createPlaybook as apiCreatePlaybook,
	updatePlaybook as apiUpdatePlaybook,
	deletePlaybook as apiDeletePlaybook,
	togglePlaybookStar as apiTogglePlaybookStar,
	restorePlaybook as apiRestorePlaybook,
	permanentDeletePlaybook as apiPermanentDeletePlaybook,
	emptyTrash as apiEmptyTrash,
	type PlaybookWithCount
} from '../api/queries/playbookQueries'

interface UsePlaybooksDataReturn {
	playbooks: PlaybookWithCount[]
	personalPlaybooks: PlaybookWithCount[]
	teamPlaybooks: PlaybookWithCount[]
	isLoading: boolean
	error: string | null
	createPlaybook: (name: string, teamId: number | null, description?: string) => Promise<Playbook>
	updatePlaybook: (id: number, updates: { name?: string; description?: string }) => Promise<void>
	deletePlaybook: (id: number) => Promise<void>
	toggleStar: (id: number) => Promise<void>
	restore: (id: number) => Promise<void>
	permanentDelete: (id: number) => Promise<void>
	emptyTrash: () => Promise<number>
	refetch: () => Promise<void>
}

export function usePlaybooksData(
	currentTeamId: number | null = null,
	section: string = 'all',
	folderId: number | null = null
): UsePlaybooksDataReturn {
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const handleUnauthorized = useCallback((error: Error) => {
		if (error.message === 'UNAUTHORIZED') {
			navigate('/login')
		}
	}, [navigate])

	// QUERY
	const {
		data: playbooks = [],
		isLoading,
		error: queryError
	} = useQuery({
		queryKey: playbookKeys.list(),
		queryFn: fetchPlaybooks
	})

	// Handle unauthorized errors
	useEffect(() => {
		if (queryError) {
			handleUnauthorized(queryError as Error)
		}
	}, [queryError, handleUnauthorized])

	// Filter playbooks based on section
	const filteredPlaybooks = useMemo(() => {
		let result = playbooks

		// Apply section filtering
		switch (section) {
			case 'starred':
				result = result.filter(pb => pb.is_starred)
				break
			case 'recent':
				result = result
					.filter(pb => pb.last_accessed_at !== null)
					.sort((a, b) => {
						const dateA = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0
						const dateB = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0
						return dateB - dateA
					})
					.slice(0, 20)
				break
			case 'folders':
				if (folderId !== null) {
					result = result.filter(pb => pb.folder_id === folderId)
				}
				break
			case 'trash':
				result = result.filter(pb => pb.deleted_at !== null)
				break
			case 'shared':
				// Shared playbooks will be fetched separately via API
				// For now, filter to empty since we need dedicated API endpoint
				result = []
				break
			case 'all':
			default:
				// All non-deleted playbooks
				result = result
				break
		}

		return result
	}, [playbooks, section, folderId])

	// Derived state - split into personal and team playbooks
	const { personalPlaybooks, teamPlaybooks } = useMemo(() => ({
		personalPlaybooks: filteredPlaybooks.filter(pb => pb.team_id === null),
		teamPlaybooks: currentTeamId
			? filteredPlaybooks.filter(pb => pb.team_id === currentTeamId)
			: filteredPlaybooks.filter(pb => pb.team_id !== null)
	}), [filteredPlaybooks, currentTeamId])

	// CREATE MUTATION
	const createMutation = useMutation({
		mutationFn: (data: { name: string; team_id: number | null; description?: string }) =>
			apiCreatePlaybook(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
		},
		onError: handleUnauthorized
	})

	// UPDATE MUTATION with optimistic update
	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
			apiUpdatePlaybook(id, data),
		onMutate: async ({ id, data }) => {
			await queryClient.cancelQueries({ queryKey: playbookKeys.list() })
			const previous = queryClient.getQueryData<PlaybookWithCount[]>(playbookKeys.list())

			queryClient.setQueryData<PlaybookWithCount[]>(
				playbookKeys.list(),
				old => old?.map(pb => pb.id === id ? { ...pb, ...data, updated_at: new Date() } : pb)
			)

			return { previous }
		},
		onError: (err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(playbookKeys.list(), context.previous)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
		}
	})

	// DELETE MUTATION with optimistic update
	const deleteMutation = useMutation({
		mutationFn: apiDeletePlaybook,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({ queryKey: playbookKeys.list() })
			const previous = queryClient.getQueryData<PlaybookWithCount[]>(playbookKeys.list())

			queryClient.setQueryData<PlaybookWithCount[]>(
				playbookKeys.list(),
				old => old?.filter(pb => pb.id !== id)
			)

			return { previous }
		},
		onError: (err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(playbookKeys.list(), context.previous)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
		}
	})

	// TOGGLE STAR MUTATION with optimistic update
	const toggleStarMutation = useMutation({
		mutationFn: apiTogglePlaybookStar,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({ queryKey: playbookKeys.list() })
			const previous = queryClient.getQueryData<PlaybookWithCount[]>(playbookKeys.list())

			queryClient.setQueryData<PlaybookWithCount[]>(
				playbookKeys.list(),
				old => old?.map(pb => pb.id === id ? { ...pb, is_starred: !pb.is_starred } : pb)
			)

			return { previous }
		},
		onError: (err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(playbookKeys.list(), context.previous)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
		}
	})

	// RESTORE MUTATION with optimistic update
	const restoreMutation = useMutation({
		mutationFn: apiRestorePlaybook,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({ queryKey: playbookKeys.list() })
			const previous = queryClient.getQueryData<PlaybookWithCount[]>(playbookKeys.list())

			queryClient.setQueryData<PlaybookWithCount[]>(
				playbookKeys.list(),
				old => old?.map(pb => pb.id === id ? { ...pb, deleted_at: null } : pb)
			)

			return { previous }
		},
		onError: (err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(playbookKeys.list(), context.previous)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
		}
	})

	// PERMANENT DELETE MUTATION with optimistic update
	const permanentDeleteMutation = useMutation({
		mutationFn: apiPermanentDeletePlaybook,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({ queryKey: playbookKeys.list() })
			const previous = queryClient.getQueryData<PlaybookWithCount[]>(playbookKeys.list())

			queryClient.setQueryData<PlaybookWithCount[]>(
				playbookKeys.list(),
				old => old?.filter(pb => pb.id !== id)
			)

			return { previous }
		},
		onError: (err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(playbookKeys.list(), context.previous)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
		}
	})

	// EMPTY TRASH MUTATION
	const emptyTrashMutation = useMutation({
		mutationFn: apiEmptyTrash,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
		},
		onError: handleUnauthorized
	})

	// WRAPPER FUNCTIONS (maintain API compatibility)
	const createPlaybook = async (
		name: string,
		teamId: number | null,
		description?: string
	): Promise<Playbook> => {
		return createMutation.mutateAsync({ name, team_id: teamId, description })
	}

	const updatePlaybook = async (
		id: number,
		updates: { name?: string; description?: string }
	): Promise<void> => {
		await updateMutation.mutateAsync({ id, data: updates })
	}

	const deletePlaybook = async (id: number): Promise<void> => {
		await deleteMutation.mutateAsync(id)
	}

	const toggleStar = async (id: number): Promise<void> => {
		await toggleStarMutation.mutateAsync(id)
	}

	const restore = async (id: number): Promise<void> => {
		await restoreMutation.mutateAsync(id)
	}

	const permanentDelete = async (id: number): Promise<void> => {
		await permanentDeleteMutation.mutateAsync(id)
	}

	const emptyTrash = async (): Promise<number> => {
		return emptyTrashMutation.mutateAsync()
	}

	const refetch = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: playbookKeys.list() })
	}, [queryClient])

	return {
		playbooks: filteredPlaybooks,
		personalPlaybooks,
		teamPlaybooks,
		isLoading,
		error: queryError?.message || null,
		createPlaybook,
		updatePlaybook,
		deletePlaybook,
		toggleStar,
		restore,
		permanentDelete,
		emptyTrash,
		refetch
	}
}
