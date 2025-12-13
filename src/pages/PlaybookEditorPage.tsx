import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PlaybookEditor from '@/components/playbook-editor/PlaybookEditor'
import type { PlaybookDetails } from '@/types/playbook'
/**
 * TODO: Presentations Integration
 * Components ready for integration:
 * - NewPresentationDialog
 * - PresentationCard
 * - PresentationEditor
 * - PresentationViewerModal
 * - usePresentationsData hook
 *
 * Integration can be added to PlaybookEditor component
 * or PlaybookManagerPage for managing presentations.
 */

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
		navigate(`/playbooks/${playbookId}/play/${playId}`)
	}
	const handleImport = () => {
	}
	const handleExport = () => {
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="page-loading">
				<div className="page-loading-spinner" />
				<div className="page-loading-text">Loading playbook...</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="page-error">
				<div className="page-error-content">
					<h1 className="page-error-title" data-variant="error">Error</h1>
					<p className="page-error-message">{error}</p>
					<button onClick={handleBack} className="page-error-button">
						Back to Playbooks
					</button>
				</div>
			</div>
		)
	}

	// Not found state
	if (!playbook) {
		return (
			<div className="page-error">
				<div className="page-error-content">
					<h1 className="page-error-title" data-variant="info">Playbook Not Found</h1>
					<p className="page-error-message">The playbook you're looking for doesn't exist.</p>
					<button onClick={handleBack} className="page-error-button">
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
