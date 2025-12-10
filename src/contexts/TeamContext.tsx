import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Team } from '../db/types'

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
	const [teams, setTeams] = useState<Team[]>([])
	const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchTeams = async () => {
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/teams')

			if (!response.ok) {
				throw new Error('Failed to fetch teams')
			}

			const data = await response.json()
			setTeams(data.teams)

			// Set first team as current if none selected
			if (data.teams.length > 0 && !currentTeamId) {
				setCurrentTeamId(data.teams[0].id)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setIsLoading(false)
		}
	}

	const switchTeam = (teamId: number) => {
		setCurrentTeamId(teamId)
	}

	useEffect(() => {
		fetchTeams()
	}, [])

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
