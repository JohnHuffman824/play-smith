import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Team } from '../db/types'
import { useAuth } from './AuthContext'

interface TeamContextType {
	teams: Team[]
	currentTeamId: number | null
	isLoading: boolean
	error: string | null
	fetchTeams: () => Promise<void>
	switchTeam: (teamId: number) => void
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth()
	const [teams, setTeams] = useState<Team[]>([])
	const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchTeams = async () => {
		console.log('[DEBUG] TeamContext: fetchTeams called')
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/teams')
			console.log('[DEBUG] TeamContext: API response status', response.ok, response.status)

			if (!response.ok) {
				throw new Error('Failed to fetch teams')
			}

			const data = await response.json()
			console.log('[DEBUG] TeamContext: Teams received', data.teams)
			setTeams(data.teams)

			// Set first team as current if none selected
			if (data.teams.length > 0 && !currentTeamId) {
				console.log('[DEBUG] TeamContext: Setting current team to', data.teams[0].id)
				setCurrentTeamId(data.teams[0].id)
			} else if (data.teams.length === 0) {
				console.warn('[WARN] TeamContext: No teams found for user')
			}
		} catch (err) {
			console.error('[ERROR] TeamContext: Failed to fetch teams', err)
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setIsLoading(false)
		}
	}

	const switchTeam = (teamId: number) => {
		setCurrentTeamId(teamId)
	}

	useEffect(() => {
		if (user) {
			fetchTeams()
		}
	}, [user])

	return (
		<TeamContext.Provider
			value={{
				teams,
				currentTeamId,
				isLoading,
				error,
				fetchTeams,
				switchTeam
			}}
		>
			{children}
		</TeamContext.Provider>
	)
}

export function useTeam() {
	const context = useContext(TeamContext)
	if (context === undefined) {
		throw new Error('useTeam must be used within a TeamProvider')
	}
	return context
}
