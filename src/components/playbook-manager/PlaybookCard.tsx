import { useNavigate } from 'react-router-dom'
import type { Playbook } from '../../db/types'

interface PlaybookCardProps {
	playbook: Playbook
	onRename: (id: number, newName: string) => void
	onDelete: (id: number) => void
	onDuplicate: (id: number) => void
}

export function PlaybookCard({
	playbook,
	onRename,
	onDelete,
	onDuplicate
}: PlaybookCardProps) {
	const navigate = useNavigate()

	const handleOpen = () => {
		navigate(`/playbooks/${playbook.id}`)
	}

	const handleRenameClick = () => {
		const newName = prompt('Rename playbook:', playbook.name)
		if (newName?.trim()) {
			onRename(playbook.id, newName.trim())
		}
	}

	const handleDeleteClick = () => {
		if (confirm(`Delete "${playbook.name}"?`)) {
			onDelete(playbook.id)
		}
	}

	return (
		<div
			className="p-4 bg-card rounded-lg border border-border hover:border-accent transition-colors cursor-pointer"
			onClick={handleOpen}
		>
			<div className="flex items-start justify-between mb-2">
				<h3 className="font-semibold truncate">{playbook.name}</h3>
				<button
					onClick={e => {
						e.stopPropagation()
					}}
					className="text-muted-foreground hover:text-foreground"
				>
					⋮
				</button>
			</div>

			{playbook.description && (
				<p className="text-sm text-muted-foreground mb-2 truncate">
					{playbook.description}
				</p>
			)}

			<div className="text-xs text-muted-foreground">
				Updated {new Date(playbook.updated_at).toLocaleDateString()}
			</div>

			{/* Context menu - simplified for now */}
			<div className="hidden group-hover:block">
				<button onClick={handleRenameClick}>Rename</button>
				<button onClick={() => onDuplicate(playbook.id)}>Duplicate</button>
				<button onClick={handleDeleteClick}>Delete</button>
			</div>
		</div>
	)
}
