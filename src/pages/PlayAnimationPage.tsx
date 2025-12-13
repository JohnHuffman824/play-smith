import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PlayViewerModal } from '../components/animation/PlayViewerModal'
import { Loader2 } from 'lucide-react'
import './play-animation-page.css'

type PlayMetadata = {
	id: string
	name: string
}

export function PlayAnimationPage() {
	const { playbookId, playId } = useParams<{
		playbookId: string
		playId: string
	}>()
	const navigate = useNavigate()
	const [plays, setPlays] = useState<PlayMetadata[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchPlays() {
			if (!playbookId) {
				setError('No playbook ID provided')
				setLoading(false)
				return
			}

			try {
				const response = await fetch(`/api/playbooks/${playbookId}`)
				if (!response.ok) {
					throw new Error('Failed to fetch playbook')
				}

				const data = await response.json()

				// Extract play metadata from sections
				const allPlays: PlayMetadata[] = []
				if (data.sections) {
					for (const section of data.sections) {
						if (section.plays) {
							for (const play of section.plays) {
								allPlays.push({
									id: play.id.toString(),
									name: play.name,
								})
							}
						}
					}
				}

				setPlays(allPlays)
				setLoading(false)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
				setLoading(false)
			}
		}

		fetchPlays()
	}, [playbookId])

	const handleClose = () => {
		// Navigate back to playbook editor
		navigate(`/playbooks/${playbookId}`)
	}

	if (loading) {
		return (
			<div className="play-animation-page-loading">
				<div className="play-animation-page-content">
					<Loader2 className="play-animation-page-spinner animate-spin" />
					<p className="play-animation-page-loading-text">Loading animation...</p>
				</div>
			</div>
		)
	}

	if (error || !playbookId || !playId) {
		return (
			<div className="play-animation-page-error">
				<div className="play-animation-page-content">
					<p className="play-animation-page-error-message">Failed to load animation</p>
					<p className="play-animation-page-error-detail">
						{error || 'Missing playbook or play ID'}
					</p>
					<button
						onClick={handleClose}
						className="play-animation-page-button"
					>
						Back to Playbook
					</button>
				</div>
			</div>
		)
	}

	return (
		<PlayViewerModal
			isOpen={true}
			onClose={handleClose}
			playbookId={playbookId}
			initialPlayId={playId}
			plays={plays}
			canEdit={false}
		/>
	)
}
