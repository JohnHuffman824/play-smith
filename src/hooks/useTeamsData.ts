import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { teamKeys, fetchTeams, type TeamWithRole } from '../api/queries/teamQueries'
import { useTeamContext } from '../contexts/TeamContext'

interface UseTeamsDataReturn {
	teams: TeamWithRole[]
	currentTeamId: number | null
	currentTeamRole: 'owner' | 'editor' | 'viewer' | null
	isLoading: boolean
	error: string | null
	switchTeam: (_teamId: number) => void
	refetch: () => Promise<void>
}

export function useTeamsData(): UseTeamsDataReturn {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { currentTeamId, setCurrentTeamId } = useTeamContext()

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

	// Auto-select first team if none selected or if stored team doesn't exist
	useEffect(() => {
		if (teams.length > 0) {
			const storedTeamExists = teams.some(t => t.id === currentTeamId)
			if (currentTeamId === null || !storedTeamExists) {
				setCurrentTeamId(teams[0]!.id)
			}
		}
	}, [teams, currentTeamId, setCurrentTeamId])

	const switchTeam = useCallback((teamId: number) => {
		setCurrentTeamId(teamId)
	}, [setCurrentTeamId])

	const refetch = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: teamKeys.list() })
	}, [queryClient])

	const currentTeamRole = teams.find(t => t.id === currentTeamId)?.role || null

	return {
		teams,
		currentTeamId,
		currentTeamRole,
		isLoading,
		error: queryError?.message || null,
		switchTeam,
		refetch
	}
}
