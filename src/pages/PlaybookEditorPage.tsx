import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PlaybookEditor from '@/components/playbook-editor/PlaybookEditor'
import type { PlaybookDetails } from '@/types/playbook'

interface Team {
	id: number
	name: string
}

export function PlaybookEditorPage() {
	const { playbookId } = useParams()
	const navigate = useNavigate()

	const [playbook, setPlaybook] = useState<PlaybookDetails | null>(null)
	const [team, setTeam] = useState<Team | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Fetch playbook data on mount
	useEffect(() => {
		if (!playbookId) return

		async function fetchData() {
			try {
				setIsLoading(true)
				setError(null)

				// Fetch playbook details
				const playbookRes = await fetch(`/api/playbooks/${playbookId}`)

				// Handle authentication errors
				if (playbookRes.status === 401) {
					navigate('/login')
					return
				}

				// Handle access denied
				if (playbookRes.status === 403) {
					setError('You do not have permission to access this playbook')
					setIsLoading(false)
					return
				}

				// Handle not found
				if (playbookRes.status === 404) {
					setError('Playbook not found')
					setIsLoading(false)
					return
				}

				// Handle other errors
				if (!playbookRes.ok) {
					throw new Error('Failed to fetch playbook data')
				}

				const playbookData = await playbookRes.json()
				setPlaybook(playbookData.playbook)

				// Fetch team data if playbook has a team_id
				if (playbookData.playbook.team_id) {
					const teamRes = await fetch('/api/teams')
					if (teamRes.ok) {
						const teamData = await teamRes.json()
						const playbookTeam = teamData.teams.find((t: Team) => t.id === playbookData.playbook.team_id)
						if (playbookTeam) {
							setTeam(playbookTeam)
						}
					}
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred')
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [playbookId, navigate])

	// Navigation handlers
	const handleBack = () => navigate('/playbooks')
	const handleOpenPlay = (playId: string) => {
		// Include teamId in URL for PlayEditorPage
		const teamId = playbook?.team_id || team?.id
		if (teamId) {
			navigate(`/playbooks/${playbookId}/plays/${playId}?teamId=${teamId}`)
		} else {
			navigate(`/playbooks/${playbookId}/plays/${playId}`)
		}
	}
	const handleImport = () => {
	}
	const handleExport = () => {
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading playbook...</p>
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Back to Playbooks
					</button>
				</div>
			</div>
		)
	}

	// Not found state
	if (!playbook) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-800 mb-4">Playbook Not Found</h1>
					<p className="text-gray-600 mb-6">The playbook you're looking for doesn't exist.</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Back to Playbooks
					</button>
				</div>
			</div>
		)
	}

	return (
		<PlaybookEditor
			playbookId={playbookId}
			playbookName={playbook.name}
			teamId={playbook.team_id?.toString()}
			teamName={team?.name}
			onBack={handleBack}
			onOpenPlay={handleOpenPlay}
			onImport={handleImport}
			onExport={handleExport}
		/>
	)
}
