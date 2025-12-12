import {
	useQuery,
	useMutation,
	useQueryClient
} from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import {
	presentationKeys,
	fetchPresentations,
	fetchPresentation,
	createPresentation as apiCreate,
	updatePresentation as apiUpdate,
	deletePresentation as apiDelete,
	addSlide as apiAddSlide,
	removeSlide as apiRemoveSlide,
	reorderSlides as apiReorder,
} from '../api/queries/presentationQueries'

export function usePresentationsData(playbookId: number | null) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const handleUnauthorized = useCallback((error: Error) => {
		if (error.message === 'UNAUTHORIZED') {
			navigate('/login')
		}
	}, [navigate])

	const {
		data: presentations = [],
		isLoading,
		error
	} = useQuery({
		queryKey: presentationKeys.list(playbookId ?? 0),
		queryFn: () => fetchPresentations(playbookId!),
		enabled: playbookId !== null
	})

	useEffect(() => {
		if (error) {
			handleUnauthorized(error as Error)
		}
	}, [error, handleUnauthorized])

	const createMutation = useMutation({
		mutationFn: (data: {
			name: string
			description?: string
		}) => apiCreate(playbookId!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: presentationKeys.list(playbookId!)
			})
		},
		onError: handleUnauthorized
	})

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			data
		}: {
			id: number
			data: { name?: string; description?: string }
		}) => apiUpdate(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: presentationKeys.list(playbookId!)
			})
		},
		onError: handleUnauthorized
	})

	const deleteMutation = useMutation({
		mutationFn: apiDelete,
		onMutate: async (id) => {
			await queryClient.cancelQueries({
				queryKey: presentationKeys.list(playbookId!)
			})
			const previous = queryClient.getQueryData(
				presentationKeys.list(playbookId!)
			)
			queryClient.setQueryData(
				presentationKeys.list(playbookId!),
				(old: any[]) => old?.filter(p => p.id !== id)
			)
			return { previous }
		},
		onError: (err, _, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					presentationKeys.list(playbookId!),
					context.previous
				)
			}
			handleUnauthorized(err as Error)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: presentationKeys.list(playbookId!)
			})
		}
	})

	return {
		presentations,
		isLoading,
		error: error?.message ?? null,
		createPresentation: (name: string, description?: string) =>
			createMutation.mutateAsync({ name, description }),
		updatePresentation: (
			id: number,
			updates: { name?: string; description?: string }
		) => updateMutation.mutateAsync({ id, data: updates }),
		deletePresentation: (id: number) =>
			deleteMutation.mutateAsync(id)
	}
}

export function usePresentationDetail(
	presentationId: number | null
) {
	const queryClient = useQueryClient()

	const { data, isLoading, error } = useQuery({
		queryKey: presentationKeys.detail(presentationId ?? 0),
		queryFn: () => fetchPresentation(presentationId!),
		enabled: presentationId !== null
	})

	const addSlideMutation = useMutation({
		mutationFn: (playId: number) =>
			apiAddSlide(presentationId!, playId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: presentationKeys.detail(presentationId!)
			})
		}
	})

	const removeSlideMutation = useMutation({
		mutationFn: (slideId: number) =>
			apiRemoveSlide(presentationId!, slideId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: presentationKeys.detail(presentationId!)
			})
		}
	})

	const reorderMutation = useMutation({
		mutationFn: (
			orders: { id: number; display_order: number }[]
		) => apiReorder(presentationId!, orders),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: presentationKeys.detail(presentationId!)
			})
		}
	})

	return {
		presentation: data?.presentation ?? null,
		slides: data?.slides ?? [],
		isLoading,
		error: error?.message ?? null,
		addSlide: (playId: number) =>
			addSlideMutation.mutateAsync(playId),
		removeSlide: (slideId: number) =>
			removeSlideMutation.mutateAsync(slideId),
		reorderSlides: (
			orders: { id: number; display_order: number }[]
		) => reorderMutation.mutateAsync(orders)
	}
}
