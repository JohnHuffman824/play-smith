import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaybooksData } from '../hooks/usePlaybooksData'
import { useTeamsData } from '../hooks/useTeamsData'
import { useFoldersData } from '../hooks/useFoldersData'
import { Sidebar } from '../components/playbook-manager/Sidebar'
import { Toolbar } from '../components/playbook-manager/Toolbar'
import { PlaybookCard } from '../components/playbook-manager/PlaybookCard'
import { Modal } from '../components/playbook-manager/Modal'
import { UnifiedSettingsDialog } from '../components/shared/UnifiedSettingsDialog'
import { ManageTeamsDialog } from '../components/playbook-manager/ManageTeamsDialog'
import { NewFolderDialog } from '../components/playbook-manager/NewFolderDialog'
import { SharePlaybookDialog } from '../components/playbook-manager/SharePlaybookDialog'
import { Input } from '../components/ui/input'
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from '../components/ui/resizable'
import { useSettings, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from '../contexts/SettingsContext'

export function PlaybookManagerPage() {
	const navigate = useNavigate()
	const { sidebarWidth, setSidebarWidth } = useSettings()

	// State declarations must come before hooks that use them
	const [activeSection, setActiveSection] = useState('all')
	const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [showNewPlaybookModal, setShowNewPlaybookModal] = useState(false)
	const [showSettingsDialog, setShowSettingsDialog] = useState(false)
	const [showManageTeamsDialog, setShowManageTeamsDialog] = useState(false)
	const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
	const [showShareDialog, setShowShareDialog] = useState(false)
	const [sharePlaybookId, setSharePlaybookId] = useState<number | null>(null)
	const [sharePlaybookName, setSharePlaybookName] = useState('')
	const [sharePlaybookTeamId, setSharePlaybookTeamId] = useState<number | null>(null)
	const [newPlaybookName, setNewPlaybookName] = useState('')

	// Now hooks that depend on state
	const { teams, currentTeamId, switchTeam, isLoading: teamsLoading } = useTeamsData()
	const {
		personalPlaybooks: allPersonalPlaybooks,
		teamPlaybooks: allTeamPlaybooks,
		isLoading: playbooksLoading,
		error: playbooksError,
		createPlaybook,
		updatePlaybook,
		deletePlaybook,
		toggleStar,
		restore,
		permanentDelete,
		emptyTrash
	} = usePlaybooksData(currentTeamId, activeSection, selectedFolderId)
	const {
		folders,
		isLoading: foldersLoading,
		error: foldersError
	} = useFoldersData()

	const isLoading = playbooksLoading || teamsLoading || foldersLoading
	const error = playbooksError || foldersError

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

	const playbooks = useMemo(
		() => [...personalPlaybooks, ...teamPlaybooks],
		[personalPlaybooks, teamPlaybooks]
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
		setShowNewFolderDialog(true)
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
		const playbook = playbooks.find(pb => pb.id === id)
		if (playbook) {
			setSharePlaybookId(id)
			setSharePlaybookName(playbook.name)
			setSharePlaybookTeamId(playbook.team_id)
			setShowShareDialog(true)
		}
	}

	const handleExportPlaybook = (id: number) => {
		// TODO: Implement single playbook export
	}

	const handleToggleStar = async (id: number) => {
		await toggleStar(id)
	}

	const handleRestore = async (id: number) => {
		await restore(id)
	}

	const handlePermanentDelete = async (id: number) => {
		await permanentDelete(id)
	}

	const handleEmptyTrash = async () => {
		if (confirm('Permanently delete all items in trash? This cannot be undone.')) {
			await emptyTrash()
		}
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

	const handleRestorePrompt = useCallback((id: number, name: string) => {
		if (confirm(`Restore "${name}"?`)) {
			handleRestore(id)
		}
	}, [])

	const handlePermanentDeletePrompt = useCallback((id: number, name: string) => {
		if (confirm(`Permanently delete "${name}"? This cannot be undone.`)) {
			handlePermanentDelete(id)
		}
	}, [])

	if (isLoading) {
		return (
			<div className="page-loading">
				<div className="page-loading-spinner" />
				<div className="page-loading-text">Loading playbooks...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="page-error">
				<div className="page-error-content">
					<h1 className="page-error-title" data-variant="error">Error</h1>
					<p className="page-error-message">{error}</p>
				</div>
			</div>
		)
	}

	// Calculate initial size as percentage (assuming 1440px viewport as baseline)
	const BASELINE_VIEWPORT = 1440
	const initialSidebarPercent = (sidebarWidth / BASELINE_VIEWPORT) * 100

	return (
		<>
		<ResizablePanelGroup
			direction="horizontal"
			className="h-screen overflow-hidden bg-background"
		>
			<ResizablePanel
				id="sidebar"
				defaultSize={initialSidebarPercent}
				minSize={(MIN_SIDEBAR_WIDTH / BASELINE_VIEWPORT) * 100}
				maxSize={(MAX_SIDEBAR_WIDTH / BASELINE_VIEWPORT) * 100}
				onResize={(size) => {
					// Convert percentage back to pixels
					const width = Math.round((size / 100) * BASELINE_VIEWPORT)
					setSidebarWidth(width)
				}}
			>
				<Sidebar
					activeSection={activeSection}
					onSectionChange={setActiveSection}
					folders={folders}
					selectedFolderId={selectedFolderId}
					onFolderSelect={setSelectedFolderId}
				/>
			</ResizablePanel>

			{/*
			  Keyboard accessible resize handle:
			  - Tab to focus the handle
			  - Arrow keys (←/→) to resize
			  - Home/End to jump to min/max
			  - Enter to toggle expand/collapse
			*/}
			<ResizableHandle
				withHandle
				className="hover:bg-sidebar-accent active:bg-sidebar-border transition-colors duration-200"
			/>

			<ResizablePanel defaultSize={100 - initialSidebarPercent} minSize={50}>
				<div className="flex flex-col h-full overflow-hidden">
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
					{/* Trash Section - Special UI */}
					{activeSection === 'trash' && (
						<>
							{playbooks.length > 0 && (
								<div className="mb-4 flex justify-between items-center">
									<p className="text-sm text-muted-foreground">
										Items in trash will be permanently deleted after 30 days
									</p>
									<button
										onClick={handleEmptyTrash}
										className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
									>
										Empty Trash
									</button>
								</div>
							)}
							{playbooks.length > 0 ? (
								<div className={viewMode === 'grid'
									? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
									: "flex flex-col gap-3"
								}>
									{playbooks.map(playbook => (
										<PlaybookCard
											key={playbook.id}
											id={playbook.id}
											name={playbook.name}
											type="playbook"
											playCount={playbook.play_count}
											lastModified={new Date(playbook.updated_at).toLocaleDateString()}
											isStarred={playbook.is_starred}
											onRename={() => handleRestorePrompt(playbook.id, playbook.name)}
											onDelete={() => handlePermanentDeletePrompt(playbook.id, playbook.name)}
											onDuplicate={handleDuplicate}
											onExport={handleExportPlaybook}
											onShare={handleShare}
											onToggleStar={handleToggleStar}
										/>
									))}
								</div>
							) : (
								<div className="text-center py-16">
									<p className="text-muted-foreground">Trash is empty.</p>
								</div>
							)}
						</>
					)}

					{/* All Other Sections */}
					{activeSection !== 'trash' && (
						<>
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
												isStarred={playbook.is_starred}
												onRename={() => handleRenamePrompt(playbook.id, playbook.name)}
												onDelete={() => handleDeletePrompt(playbook.id, playbook.name)}
												onDuplicate={handleDuplicate}
												onExport={handleExportPlaybook}
												onShare={handleShare}
												onToggleStar={handleToggleStar}
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
												isStarred={playbook.is_starred}
												onRename={() => handleRenamePrompt(playbook.id, playbook.name)}
												onDelete={() => handleDeletePrompt(playbook.id, playbook.name)}
												onDuplicate={handleDuplicate}
												onExport={handleExportPlaybook}
												onShare={handleShare}
												onToggleStar={handleToggleStar}
											/>
										))}
									</div>
								</div>
							)}

							{/* Section-Specific Empty States */}
							{personalPlaybooks.length === 0 && teamPlaybooks.length === 0 && (
								<div className="text-center py-16">
									{activeSection === 'starred' && (
										<p className="text-muted-foreground">No starred playbooks yet. Star a playbook to see it here.</p>
									)}
									{activeSection === 'recent' && (
										<p className="text-muted-foreground">No recently opened playbooks.</p>
									)}
									{activeSection === 'shared' && (
										<p className="text-muted-foreground">No playbooks have been shared with you.</p>
									)}
									{activeSection === 'folders' && selectedFolderId !== null && (
										<p className="text-muted-foreground">This folder is empty.</p>
									)}
									{activeSection === 'all' && (
										<>
											<p className="text-muted-foreground mb-4">No playbooks found</p>
											<button
												onClick={() => setShowNewPlaybookModal(true)}
												className="px-6 py-2.5 bg-action-button text-action-button-foreground rounded-lg cursor-pointer hover:bg-action-button/90 transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
											>
												Create Your First Playbook
											</button>
										</>
									)}
								</div>
							)}
						</>
					)}
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>

		{/* Modals outside the resizable panels */}
		<div>
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
							className="px-4 py-2 bg-action-button text-action-button-foreground rounded-lg disabled:opacity-50 cursor-pointer hover:bg-action-button/90 transition-all duration-200 disabled:cursor-not-allowed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
						>
							Create
						</button>
					</div>
				</div>
			</Modal>

			{/* Settings Dialog */}
			<UnifiedSettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				context="playbook-manager"
			/>

			{/* Manage Teams Dialog */}
			<ManageTeamsDialog
				isOpen={showManageTeamsDialog}
				onClose={() => setShowManageTeamsDialog(false)}
			/>

			{/* New Folder Dialog */}
			<NewFolderDialog
				isOpen={showNewFolderDialog}
				onClose={() => setShowNewFolderDialog(false)}
			/>

			{/* Share Playbook Dialog */}
			{sharePlaybookId && (
				<SharePlaybookDialog
					isOpen={showShareDialog}
					onClose={() => {
						setShowShareDialog(false)
						setSharePlaybookId(null)
						setSharePlaybookName('')
						setSharePlaybookTeamId(null)
					}}
					playbookId={sharePlaybookId}
					playbookName={sharePlaybookName}
					currentTeamId={sharePlaybookTeamId}
				/>
			)}
		</div>
		</>
	)
}
