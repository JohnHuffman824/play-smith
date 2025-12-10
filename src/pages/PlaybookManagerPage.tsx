import { useState, useMemo } from 'react'
import { usePlaybook } from '../contexts/PlaybookContext'
import { useTeam } from '../contexts/TeamContext'
import { Sidebar } from '../components/playbook-manager/Sidebar'
import { PlaybookCard } from '../components/playbook-manager/PlaybookCard'
import { Modal } from '../components/playbook-manager/Modal'

export function PlaybookManagerPage() {
	const { playbooks, isLoading, error, createPlaybook, updatePlaybook, deletePlaybook } = usePlaybook()
	const { currentTeamId } = useTeam()

	const [activeSection, setActiveSection] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [showNewPlaybookModal, setShowNewPlaybookModal] = useState(false)
	const [newPlaybookName, setNewPlaybookName] = useState('')

	const filteredPlaybooks = useMemo(() => {
		return playbooks.filter(pb =>
			pb.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [playbooks, searchQuery])

	const handleCreatePlaybook = async () => {
		if (newPlaybookName.trim() && currentTeamId) {
			await createPlaybook(newPlaybookName, currentTeamId)
			setNewPlaybookName('')
			setShowNewPlaybookModal(false)
		}
	}

	const handleRename = async (id: number, newName: string) => {
		await updatePlaybook(id, { name: newName })
	}

	const handleDelete = async (id: number) => {
		await deletePlaybook(id)
	}

	const handleDuplicate = async (id: number) => {
		const original = playbooks.find(pb => pb.id === id)
		if (original && currentTeamId) {
			await createPlaybook(
				`${original.name} (Copy)`,
				currentTeamId,
				original.description || undefined
			)
		}
	}

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
				<div className="border-b border-border p-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">My Playbooks</h1>
						<button
							onClick={() => setShowNewPlaybookModal(true)}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
						>
							New Playbook
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{filteredPlaybooks.map(playbook => (
							<PlaybookCard
								key={playbook.id}
								playbook={playbook}
								onRename={handleRename}
								onDelete={handleDelete}
								onDuplicate={handleDuplicate}
							/>
						))}
					</div>

					{filteredPlaybooks.length === 0 && (
						<div className="text-center py-16">
							<p className="text-muted-foreground mb-4">No playbooks found</p>
							<button
								onClick={() => setShowNewPlaybookModal(true)}
								className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg"
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
						<input
							type="text"
							value={newPlaybookName}
							onChange={e => setNewPlaybookName(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									handleCreatePlaybook()
								}
							}}
							placeholder="Enter playbook name..."
							className="w-full px-4 py-2.5 bg-input rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => {
								setShowNewPlaybookModal(false)
								setNewPlaybookName('')
							}}
							className="px-4 py-2 hover:bg-accent rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleCreatePlaybook}
							disabled={!newPlaybookName.trim()}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
						>
							Create
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
