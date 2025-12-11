import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaybooksData } from '../hooks/usePlaybooksData'
import { useTeamsData } from '../hooks/useTeamsData'
import { Sidebar } from '../components/playbook-manager/Sidebar'
import { Toolbar } from '../components/playbook-manager/Toolbar'
import { PlaybookCard } from '../components/playbook-manager/PlaybookCard'
import { Modal } from '../components/playbook-manager/Modal'
import { SettingsDialog } from '../components/playbook-manager/SettingsDialog'
import { ManageTeamsDialog } from '../components/playbook-manager/ManageTeamsDialog'
import { Input } from '../components/ui/input'

export function PlaybookManagerPage() {
	const navigate = useNavigate()
	const { teams, currentTeamId, switchTeam, isLoading: teamsLoading } = useTeamsData()
	const {
		personalPlaybooks: allPersonalPlaybooks,
		teamPlaybooks: allTeamPlaybooks,
		isLoading: playbooksLoading,
		error: playbooksError,
		createPlaybook,
		updatePlaybook,
		deletePlaybook
	} = usePlaybooksData(currentTeamId)

	const isLoading = playbooksLoading || teamsLoading
	const error = playbooksError

	const [activeSection, setActiveSection] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [showNewPlaybookModal, setShowNewPlaybookModal] = useState(false)
	const [showSettingsDialog, setShowSettingsDialog] = useState(false)
	const [showManageTeamsDialog, setShowManageTeamsDialog] = useState(false)
	const [newPlaybookName, setNewPlaybookName] = useState('')

	const personalPlaybooks = useMemo(
		() => allPersonalPlaybooks.filter(pb =>
			pb.name.toLowerCase().includes(searchQuery.toLowerCase())
		),
		[allPersonalPlaybooks, searchQuery]
	)

	const teamPlaybooks = useMemo(
		() => allTeamPlaybooks.filter(pb =>
			pb.name.toLowerCase().includes(searchQuery.toLowerCase())
		),
		[allTeamPlaybooks, searchQuery]
	)

	const handleCreatePlaybook = async () => {
		if (!newPlaybookName.trim()) return

		// Use current team or default to first available team (user's "My Team")
		const teamId = currentTeamId ?? teams[0]?.id ?? null
		const newPlaybook = await createPlaybook(newPlaybookName.trim(), teamId)
		setNewPlaybookName('')
		setShowNewPlaybookModal(false)
		navigate(`/playbooks/${newPlaybook.id}`)
	}

	const handleRename = async (id: number, newName: string) => {
		await updatePlaybook(id, { name: newName })
	}

	const handleDelete = async (id: number) => {
		await deletePlaybook(id)
	}

	const handleDuplicate = async (id: number) => {
		const original = playbooks.find(pb => pb.id === id)
		if (original) {
			await createPlaybook(`${original.name} (Copy)`, original.team_id, original.description || undefined)
		}
	}

	const handleNewFolder = () => {
		// TODO: Implement folder creation
	}

	const handleImport = () => {
		// TODO: Implement import functionality
	}

	const handleExport = () => {
		// TODO: Implement export functionality
	}

	const handleSettings = () => {
		setShowSettingsDialog(true)
	}

	const handleManageTeams = () => {
		setShowManageTeamsDialog(true)
	}

	const handleShare = (id: number) => {
		// TODO: Implement share functionality
	}

	const handleExportPlaybook = (id: number) => {
		// TODO: Implement single playbook export
	}

	const handleRenamePrompt = useCallback((id: number, currentName: string) => {
		const newName = prompt('Rename playbook:', currentName)
		if (newName?.trim()) {
			handleRename(id, newName.trim())
		}
	}, [])

	const handleDeletePrompt = useCallback((id: number, name: string) => {
		if (confirm(`Delete "${name}"?`)) {
			handleDelete(id)
		}
	}, [])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-lg">Loading playbooks...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-red-500">Error: {error}</div>
			</div>
		)
	}

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar
				activeSection={activeSection}
				onSectionChange={setActiveSection}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Toolbar */}
				<Toolbar
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onNewPlaybook={() => setShowNewPlaybookModal(true)}
					onNewFolder={handleNewFolder}
					onImport={handleImport}
					onExport={handleExport}
					onSettingsClick={handleSettings}
					teams={teams}
					currentTeamId={currentTeamId}
					onSwitchTeam={switchTeam}
					onManageTeams={handleManageTeams}
				/>

				{/* Content */}
				<div className="flex-1 overflow-auto p-6">
					{/* Personal Playbooks Section */}
					{personalPlaybooks.length > 0 && (
						<div className="mb-8">
							<h2 className="text-xl font-semibold mb-4">Personal Playbooks</h2>
							<div className={viewMode === 'grid'
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
								: "flex flex-col gap-3"
							}>
								{personalPlaybooks.map(playbook => (
									<PlaybookCard
										key={playbook.id}
										id={playbook.id}
										name={playbook.name}
										type="playbook"
										playCount={playbook.play_count}
										lastModified={new Date(playbook.updated_at).toLocaleDateString()}
										onRename={() => handleRenamePrompt(playbook.id, playbook.name)}
										onDelete={() => handleDeletePrompt(playbook.id, playbook.name)}
										onDuplicate={handleDuplicate}
										onExport={handleExportPlaybook}
										onShare={handleShare}
									/>
								))}
							</div>
						</div>
					)}

					{/* Team Playbooks Section */}
					{teamPlaybooks.length > 0 && (
						<div className="mb-8">
							<h2 className="text-xl font-semibold mb-4">Team Playbooks</h2>
							<div className={viewMode === 'grid'
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
								: "flex flex-col gap-3"
							}>
								{teamPlaybooks.map(playbook => (
									<PlaybookCard
										key={playbook.id}
										id={playbook.id}
										name={playbook.name}
										type="playbook"
										playCount={playbook.play_count}
										lastModified={new Date(playbook.updated_at).toLocaleDateString()}
										onRename={() => handleRenamePrompt(playbook.id, playbook.name)}
										onDelete={() => handleDeletePrompt(playbook.id, playbook.name)}
										onDuplicate={handleDuplicate}
										onExport={handleExportPlaybook}
										onShare={handleShare}
									/>
								))}
							</div>
						</div>
					)}

					{/* Empty State */}
					{personalPlaybooks.length === 0 && teamPlaybooks.length === 0 && (
						<div className="text-center py-16">
							<p className="text-muted-foreground mb-4">No playbooks found</p>
							<button
								onClick={() => setShowNewPlaybookModal(true)}
								className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
							>
								Create Your First Playbook
							</button>
						</div>
					)}
				</div>
			</div>

			{/* New Playbook Modal */}
			<Modal
				isOpen={showNewPlaybookModal}
				onClose={() => {
					setShowNewPlaybookModal(false)
					setNewPlaybookName('')
				}}
				title="Create New Playbook"
			>
				<div className="space-y-4">
					<div>
						<label className="block mb-2">Playbook Name</label>
						<Input
							type="text"
							value={newPlaybookName}
							onChange={e => setNewPlaybookName(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									handleCreatePlaybook()
								}
							}}
							placeholder="Enter playbook name..."
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => {
								setShowNewPlaybookModal(false)
								setNewPlaybookName('')
							}}
							className="px-4 py-2 hover:bg-accent rounded-lg cursor-pointer transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleCreatePlaybook}
							disabled={!newPlaybookName.trim()}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 cursor-pointer hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
						>
							Create
						</button>
					</div>
				</div>
			</Modal>

			{/* Settings Dialog */}
			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
			/>

			{/* Manage Teams Dialog */}
			<ManageTeamsDialog
				isOpen={showManageTeamsDialog}
				onClose={() => setShowManageTeamsDialog(false)}
			/>
		</div>
	)
}
