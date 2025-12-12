import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from '../ui/button'
import { useTeamsData } from '../../hooks/useTeamsData'
import { Trash2 } from 'lucide-react'

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
			className="max-w-2xl"
		>
			<div className="space-y-6">
				{/* Share form */}
				<div className="space-y-4">
					<div>
						<label htmlFor="team-select" className="block text-sm font-medium mb-2">
							Share with team
						</label>
						{availableTeams.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No other teams available to share with.
							</p>
						) : (
							<select
								id="team-select"
								value={selectedTeamId || ''}
								onChange={(e) => setSelectedTeamId(Number(e.target.value))}
								className="w-full px-3 py-2 border border-border rounded-lg bg-background"
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
						<label className="block text-sm font-medium mb-2">
							Permission
						</label>
						<div className="space-y-2">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="permission"
									value="view"
									checked={permission === 'view'}
									onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
									disabled={isSharing}
									className="cursor-pointer"
								/>
								<span className="text-sm">
									<strong>View</strong> - Can view playbook and plays
								</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="permission"
									value="edit"
									checked={permission === 'edit'}
									onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
									disabled={isSharing}
									className="cursor-pointer"
								/>
								<span className="text-sm">
									<strong>Edit</strong> - Can view and edit playbook and plays
								</span>
							</label>
						</div>
					</div>

					{error && (
						<p className="text-sm text-destructive">
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
					<h3 className="text-sm font-medium mb-3">
						Shared with {shares.length} team{shares.length !== 1 ? 's' : ''}
					</h3>

					{isLoading ? (
						<p className="text-sm text-muted-foreground">Loading shares...</p>
					) : shares.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							This playbook is not shared with any teams yet.
						</p>
					) : (
						<div className="space-y-2">
							{shares.map(share => (
								<div
									key={share.id}
									className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50"
								>
									<div className="flex-1">
										<p className="font-medium">{share.team_name}</p>
										<p className="text-sm text-muted-foreground capitalize">
											{share.permission} access
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRemoveShare(share.shared_with_team_id)}
										className="text-destructive hover:text-destructive hover:bg-destructive/10"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Close button */}
				<div className="flex justify-end pt-2">
					<Button onClick={onClose} variant="outline">
						Close
					</Button>
				</div>
			</div>
		</Modal>
	)
}
