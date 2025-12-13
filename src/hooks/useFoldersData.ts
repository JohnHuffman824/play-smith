import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import type { Folder } from '../db/types'
import {
	folderKeys,
	fetchFolders,
	createFolder as apiCreateFolder,
	updateFolder as apiUpdateFolder,
	deleteFolder as apiDeleteFolder,
} from '../api/queries/folderQueries'

interface UseFoldersDataReturn {
	folders: Folder[]
	isLoading: boolean
	error: string | null
	createFolder: (name: string) => Promise<Folder>
	updateFolder: (id: number, name: string) => Promise<void>
	deleteFolder: (id: number) => Promise<void>
	refetch: () => Promise<void>
}

export function useFoldersData(): UseFoldersDataReturn {
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const handleUnauthorized = useCallback((error: Error) => {
		if (error.message === 'UNAUTHORIZED') {
			navigate('/login')
		}
	}, [navigate])

	// QUERY
	const {
		data: folders = [],
		isLoading,
		error: queryError
	} = useQuery({
		queryKey: folderKeys.list(),
		queryFn: fetchFolders
	})

	// Handle unauthorized errors
	useEffect(() => {
		if (queryError) {
			handleUnauthorized(queryError as Error)
		}
	}, [queryError, handleUnauthorized])

	// CREATE MUTATION
	const createMutation = useMutation({
		mutationFn: (data: { name: string }) =>
			apiCreateFolder(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.list() })
		},
		onError: handleUnauthorized
	})

	// UPDATE MUTATION with optimistic update
	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
			apiUpdateFolder(id, data),
		onMutate: async ({ id, data }) => {
			await queryClient.cancelQueries({ queryKey: folderKeys.list() })
			const previous = queryClient.getQueryData<Folder[]>(folderKeys.list())

			queryClient.setQueryData<Folder[]>(
				folderKeys.list(),
				old => old?.map(folder => folder.id === id ? { ...folder, name: data.name } : folder)
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(folderKeys.list(), context.previous)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.list() })
		}
	})

	// DELETE MUTATION with optimistic update
	const deleteMutation = useMutation({
		mutationFn: apiDeleteFolder,
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({ queryKey: folderKeys.list() })
			const previous = queryClient.getQueryData<Folder[]>(folderKeys.list())

			queryClient.setQueryData<Folder[]>(
				folderKeys.list(),
				old => old?.filter(folder => folder.id !== id)
			)

			return { previous }
		},
		onError: (err, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(folderKeys.list(), context.previous)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.list() })
		}
	})

	// WRAPPER FUNCTIONS (maintain API compatibility)
	const createFolder = async (name: string): Promise<Folder> => {
		return createMutation.mutateAsync({ name })
	}

	const updateFolder = async (id: number, name: string): Promise<void> => {
		await updateMutation.mutateAsync({ id, data: { name } })
	}

	const deleteFolder = async (id: number): Promise<void> => {
		await deleteMutation.mutateAsync(id)
	}

	const refetch = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: folderKeys.list() })
	}, [queryClient])

	return {
		folders,
		isLoading,
		error: queryError?.message || null,
		createFolder,
		updateFolder,
		deleteFolder,
		refetch
	}
}
