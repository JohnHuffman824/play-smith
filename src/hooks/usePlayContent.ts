/**
 * Hook for fetching full play content (players, drawings) for animation.
 */

import { useState, useEffect, useCallback } from 'react'
import type { Drawing } from '../types/drawing.types'

type Player = {
	id: string
	x: number
	y: number
	label: string
	color: string
}

export type PlayContent = {
	id: string
	name: string
	players: Player[]
	drawings: Drawing[]
}

type UsePlayContentOptions = {
	playId: string | null
	enabled?: boolean
}

type UsePlayContentReturn = {
	playContent: PlayContent | null
	isLoading: boolean
	error: string | null
	refetch: () => Promise<void>
}

/**
 * Fetches full play content from the API including players and drawings.
 * Used by PlayViewerModal to get data for animation.
 */
export function usePlayContent({
	playId,
	enabled = true,
}: UsePlayContentOptions): UsePlayContentReturn {
	const [playContent, setPlayContent] = useState<PlayContent | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchPlayContent = useCallback(async () => {
		if (!playId || !enabled) {
			setPlayContent(null)
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/plays/${playId}`)

			if (response.status === 401) {
				setError('Unauthorized')
				return
			}

			if (response.status === 403) {
				setError('Access denied')
				return
			}

			if (response.status === 404) {
				setError('Play not found')
				return
			}

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to fetch play')
			}

			const data = await response.json()
			setPlayContent(data.play)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsLoading(false)
		}
	}, [playId, enabled])

	useEffect(() => {
		fetchPlayContent()
	}, [fetchPlayContent])

	return {
		playContent,
		isLoading,
		error,
		refetch: fetchPlayContent,
	}
}

/**
 * Fetches multiple plays content for slideshow mode.
 */
export function useMultiplePlayContent(
	playIds: string[],
	enabled: boolean = true
): {
	playsContent: Map<string, PlayContent>
	isLoading: boolean
	errors: Map<string, string>
} {
	const [playsContent, setPlaysContent] = useState<Map<string, PlayContent>>(
		new Map()
	)
	const [isLoading, setIsLoading] = useState(false)
	const [errors, setErrors] = useState<Map<string, string>>(new Map())

	// Extract to variable to avoid complex expression in dependency array
	const playIdsKey = playIds.join(',')

	useEffect(() => {
		if (!enabled || playIds.length === 0) {
			setPlaysContent(new Map())
			return
		}

		setIsLoading(true)
		const newContent = new Map<string, PlayContent>()
		const newErrors = new Map<string, string>()

		Promise.all(
			playIds.map(async (playId) => {
				try {
					const response = await fetch(`/api/plays/${playId}`)
					if (response.ok) {
						const data = await response.json()
						newContent.set(playId, data.play)
					} else {
						newErrors.set(playId, 'Failed to fetch')
					}
				} catch (err) {
					newErrors.set(
						playId,
						err instanceof Error ? err.message : 'Error'
					)
				}
			})
		).then(() => {
			setPlaysContent(newContent)
			setErrors(newErrors)
			setIsLoading(false)
		})
	}, [playIdsKey, enabled, playIds])

	return { playsContent, isLoading, errors }
}
