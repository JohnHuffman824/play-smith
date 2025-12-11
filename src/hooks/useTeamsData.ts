import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import type { Team } from '../db/types'
import { teamKeys, fetchTeams } from '../api/queries/teamQueries'

interface UseTeamsDataReturn {
	teams: Team[]
	currentTeamId: number | null
	isLoading: boolean
	error: string | null
	switchTeam: (teamId: number) => void
	refetch: () => Promise<void>
}

export function useTeamsData(): UseTeamsDataReturn {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)

	const handleUnauthorized = useCallback((error: Error) => {
		if (error.message === 'UNAUTHORIZED') {
			navigate('/login')
		}
	}, [navigate])

	const {
		data: teams = [],
		isLoading,
		error: queryError
	} = useQuery({
		queryKey: teamKeys.list(),
		queryFn: fetchTeams
	})

	// Handle unauthorized errors
	useEffect(() => {
		if (queryError) {
			handleUnauthorized(queryError as Error)
		}
	}, [queryError, handleUnauthorized])

	// Auto-select first team if none selected
	useEffect(() => {
		if (teams.length > 0 && currentTeamId === null) {
			setCurrentTeamId(teams[0].id)
		}
	}, [teams, currentTeamId])

	const switchTeam = useCallback((teamId: number) => {
		setCurrentTeamId(teamId)
	}, [])

	const refetch = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: teamKeys.list() })
	}, [queryClient])

	return {
		teams,
		currentTeamId,
		isLoading,
		error: queryError?.message || null,
		switchTeam,
		refetch
	}
}
