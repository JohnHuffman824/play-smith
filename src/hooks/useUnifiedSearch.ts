import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SearchResults } from '../types/concept.types'
import { PRESET_ROLES } from '../constants/concept.constants'

interface UseUnifiedSearchReturn {
	query: string
	setQuery: (query: string) => void
	results: SearchResults | null
	isSearching: boolean
	error: string | null
	parseQuery: (query: string) => ParsedQuery | null
}

interface ParsedQuery {
	role?: string
	concept?: string
}

const DEBOUNCE_DELAY = 300

/**
 * Custom hook for unified search across formations, concepts, and concept groups
 *
 * Provides debounced search functionality with smart parsing for role + concept patterns
 * (e.g., "X Post" parses to role=X, concept=Post). Results are ranked by frecency
 * (frequency + recency) to show most relevant items first.
 *
 * @param teamId - The team ID to search within (required)
 * @param playbookId - Optional playbook ID to scope search results
 * @returns Object containing query state, search results, loading state, and parse function
 *
 * @example
 * ```typescript
 * const { query, setQuery, results, isSearching, parseQuery } = useUnifiedSearch(teamId)
 *
 * // User types "X Post"
 * setQuery("X Post")
 * // After 300ms debounce, search executes
 * // parseQuery returns: { role: 'x', concept: 'Post' }
 * ```
 *
 * Features:
 * - 300ms debounce to reduce API calls
 * - Smart parsing: "X Post" → { role: 'x', concept: 'Post' }
 * - Frecency-based ranking (usage_count / days_since_use)
 * - Categorized results (formations, concepts, groups)
 * - Automatic auth handling (redirects on 401)
 */
export function useUnifiedSearch(
	teamId: string | undefined,
	playbookId?: string
): UseUnifiedSearchReturn {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchResults | null>(null)
	const [isSearching, setIsSearching] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const debounceTimerRef = useRef<number | null>(null)

	const parseQuery = useCallback((searchQuery: string): ParsedQuery | null => {
		const trimmed = searchQuery.trim()
		if (!trimmed) return null

		// Smart parsing: "X Post" → { role: 'X', concept: 'Post' }
		const parts = trimmed.split(/\s+/)
		if (parts.length >= 2) {
			const firstPart = parts[0].toUpperCase()
			const restParts = parts.slice(1).join(' ')

			const matchedRole = PRESET_ROLES.find(
				r => r.id.toUpperCase() === firstPart || r.name.toUpperCase() === firstPart
			)

			if (matchedRole) {
				return {
					role: matchedRole.id,
					concept: restParts
				}
			}
		}

		return null
	}, [])

	const performSearch = useCallback(
		async (searchQuery: string) => {
			if (!teamId || !searchQuery.trim()) {
				setResults(null)
				return
			}

			try {
				setIsSearching(true)
				setError(null)

				const params = new URLSearchParams({
					q: searchQuery.trim(),
					limit: '20'
				})

				if (playbookId) {
					params.set('playbookId', playbookId)
				}

				const res = await fetch(`/api/teams/${teamId}/search?${params.toString()}`)

				if (res.status === 401) {
					navigate('/login')
					return
				}

				if (!res.ok) {
					throw new Error('Failed to perform search')
				}

				const data = await res.json()
				setResults(data as SearchResults)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Search failed')
				setResults(null)
			} finally {
				setIsSearching(false)
			}
		},
		[teamId, playbookId, navigate]
	)

	useEffect(() => {
		if (debounceTimerRef.current !== null) {
			clearTimeout(debounceTimerRef.current)
		}

		if (query.trim()) {
			debounceTimerRef.current = window.setTimeout(() => {
				performSearch(query)
			}, DEBOUNCE_DELAY)
		} else {
			setResults(null)
			setIsSearching(false)
		}

		return () => {
			if (debounceTimerRef.current !== null) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [query, performSearch])

	return {
		query,
		setQuery,
		results,
		isSearching,
		error,
		parseQuery
	}
}
