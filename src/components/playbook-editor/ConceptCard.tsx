import { MoreVertical, Edit, Trash2, Copy } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import './concept-card.css'

type ConceptType = 'concept' | 'formation' | 'group'

type ConceptCardProps = {
	id: number
	name: string
	type: ConceptType
	thumbnail?: string | null
	description?: string | null
	isMotion?: boolean
	isModifier?: boolean
	lastModified: string
	onEdit: (id: number, type: ConceptType) => void
	onDelete: (id: number, type: ConceptType) => void
	onDuplicate: (id: number, type: ConceptType) => void
}

const TYPE_BADGES = {
	concept: {
		label: 'Route',
		className: 'concept-card-badge-route'
	},
	formation: {
		label: 'Formation',
		className: 'concept-card-badge-formation'
	},
	group: {
		label: 'Group',
		className: 'concept-card-badge-group'
	},
} as const

export function ConceptCard({
	id, name, type, thumbnail, description, isMotion, isModifier, lastModified,
	onEdit, onDelete, onDuplicate,
}: ConceptCardProps) {
	const badge = TYPE_BADGES[type]

	return (
		<div className="concept-card group">
			{/* Thumbnail */}
			<button
				onClick={() => onEdit(id, type)}
				className="concept-card-thumbnail"
				aria-label={`Edit ${name}`}
			>
				{thumbnail ? (
					<img
						src={thumbnail}
						alt={name}
					/>
				) : (
					<span className="concept-card-thumbnail-placeholder">
						No preview
					</span>
				)}
			</button>

			{/* Badges */}
			<div className="concept-card-badges">
				{isMotion && (
					<span className="concept-card-badge concept-card-badge-motion">
						Motion
					</span>
				)}
				{isModifier && (
					<span className="concept-card-badge concept-card-badge-modifier">
						Modifier
					</span>
				)}
				<span className={`concept-card-badge ${badge.className}`}>
					{badge.label}
				</span>
			</div>

			{/* Content */}
			<div className="concept-card-content">
				<div className="concept-card-header">
					<h3 className="concept-card-title">{name}</h3>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								className="concept-card-menu-button"
								aria-label="Card actions"
							>
								<MoreVertical className="w-4 h-4" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(id, type)}>
								<Edit className="w-4 h-4" /> Edit
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onDuplicate(id, type)}>
								<Copy className="w-4 h-4" /> Duplicate
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDelete(id, type)}
								variant="destructive"
							>
								<Trash2 className="w-4 h-4" /> Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				{description && (
					<p className="concept-card-description">
						{description}
					</p>
				)}
				<div className="concept-card-footer">
					<p className="concept-card-date">{lastModified}</p>
				</div>
			</div>
		</div>
	)
}
