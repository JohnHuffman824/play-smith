import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from '../ui/button'
import { useTeamsData } from '../../hooks/useTeamsData'
import { Trash2 } from 'lucide-react'
import './share-playbook-dialog.css'

interface SharePlaybookDialogProps {
	isOpen: boolean
	onClose: () => void
	playbookId: number
	playbookName: string
	currentTeamId: number | null
}

interface PlaybookShare {
	id: number
	playbook_id: number
	shared_with_team_id: number
	permission: 'view' | 'edit'
	shared_by: number
	shared_at: string | Date
	team_name: string
}

export function SharePlaybookDialog({
	isOpen,
	onClose,
	playbookId,
	playbookName,
	currentTeamId
}: SharePlaybookDialogProps) {
	const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
	const [permission, setPermission] = useState<'view' | 'edit'>('view')
	const [shares, setShares] = useState<PlaybookShare[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isSharing, setIsSharing] = useState(false)
	const [error, setError] = useState('')
	const { teams } = useTeamsData()

	// Filter out the playbook's own team from the available teams
	const availableTeams = teams.filter(team => team.id !== currentTeamId)

	// Load shares when dialog opens
	useEffect(() => {
		if (isOpen) {
			loadShares()
			setSelectedTeamId(availableTeams[0]?.id ?? null)
			setPermission('view')
			setError('')
		}
	}, [isOpen, playbookId])

	async function loadShares() {
		setIsLoading(true)
		try {
			const response = await fetch(`/api/playbooks/${playbookId}/shares`)
			if (response.ok) {
				const data = await response.json()
				setShares(data.shares || [])
			} else {
				console.error('Failed to load shares')
			}
		} catch (err) {
			console.error('Error loading shares:', err)
		} finally {
			setIsLoading(false)
		}
	}

	async function handleShare() {
		if (!selectedTeamId) {
			setError('Please select a team')
			return
		}

		setIsSharing(true)
		setError('')

		try {
			const response = await fetch(`/api/playbooks/${playbookId}/shares`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					team_id: selectedTeamId,
					permission
				})
			})

			if (response.ok) {
				// Reload shares to show the new one
				await loadShares()
				// Reset form
				setSelectedTeamId(availableTeams[0]?.id ?? null)
				setPermission('view')
			} else {
				const data = await response.json()
				setError(data.error || 'Failed to share playbook')
			}
		} catch (err) {
			console.error('Error sharing playbook:', err)
			setError('Failed to share playbook. Please try again.')
		} finally {
			setIsSharing(false)
		}
	}

	async function handleRemoveShare(teamId: number) {
		try {
			const response = await fetch(`/api/playbooks/${playbookId}/shares/${teamId}`, {
				method: 'DELETE'
			})

			if (response.ok) {
				// Reload shares to reflect the removal
				await loadShares()
			} else {
				console.error('Failed to remove share')
			}
		} catch (err) {
			console.error('Error removing share:', err)
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`Share "${playbookName}"`}
			className="share-playbook-modal"
		>
			<div className="share-playbook-form">
				{/* Share form */}
				<div className="share-playbook-field">
					<div>
						<label htmlFor="team-select" className="share-playbook-label">
							Share with team
						</label>
						{availableTeams.length === 0 ? (
							<p className="share-playbook-empty">
								No other teams available to share with.
							</p>
						) : (
							<select
								id="team-select"
								value={selectedTeamId || ''}
								onChange={(e) => setSelectedTeamId(Number(e.target.value))}
								className="share-playbook-select"
								disabled={isSharing}
							>
								{availableTeams.map(team => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						)}
					</div>

					<div>
						<label className="share-playbook-label">
							Permission
						</label>
						<div className="share-playbook-permissions">
							<label className="share-playbook-permission-option">
								<input
									type="radio"
									name="permission"
									value="view"
									checked={permission === 'view'}
									onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
									disabled={isSharing}
								/>
								<span className="share-playbook-permission-text">
									<strong>View</strong> - Can view playbook and plays
								</span>
							</label>
							<label className="share-playbook-permission-option">
								<input
									type="radio"
									name="permission"
									value="edit"
									checked={permission === 'edit'}
									onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
									disabled={isSharing}
								/>
								<span className="share-playbook-permission-text">
									<strong>Edit</strong> - Can view and edit playbook and plays
								</span>
							</label>
						</div>
					</div>

					{error && (
						<p className="share-playbook-error">
							{error}
						</p>
					)}

					{availableTeams.length > 0 && (
						<Button
							onClick={handleShare}
							disabled={isSharing || !selectedTeamId}
							className="w-full"
						>
							{isSharing ? 'Sharing...' : 'Share Playbook'}
						</Button>
					)}
				</div>

				{/* Current shares list */}
				<div>
					<h3 className="share-playbook-shares-header">
						Shared with {shares.length} team{shares.length !== 1 ? 's' : ''}
					</h3>

					{isLoading ? (
						<p className="share-playbook-shares-loading">Loading shares...</p>
					) : shares.length === 0 ? (
						<p className="share-playbook-shares-empty">
							This playbook is not shared with any teams yet.
						</p>
					) : (
						<div className="share-playbook-shares-list">
							{shares.map(share => (
								<div
									key={share.id}
									className="share-playbook-share-item"
								>
									<div className="share-playbook-share-info">
										<p className="share-playbook-share-team">{share.team_name}</p>
										<p className="share-playbook-share-permission">
											{share.permission} access
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRemoveShare(share.shared_with_team_id)}
										style={{ color: 'var(--destructive)' }}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Close button */}
				<div className="share-playbook-footer">
					<Button onClick={onClose} variant="outline">
						Close
					</Button>
				</div>
			</div>
		</Modal>
	)
}
