import { MoreVertical, Edit, Trash2, Copy } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
		className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
	},
	formation: {
		label: 'Formation',
		className: 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
	},
	group: {
		label: 'Group',
		className: 'bg-green-500/20 text-green-600 dark:text-green-400'
	},
} as const

export function ConceptCard({
	id, name, type, thumbnail, description, isMotion, isModifier, lastModified,
	onEdit, onDelete, onDuplicate,
}: ConceptCardProps) {
	const badge = TYPE_BADGES[type]

	return (
		<div
			className="group relative bg-card border border-border
				rounded-xl overflow-hidden hover:ring-4 hover:ring-blue-500/50
				hover:border-blue-500 transition-all duration-200"
		>
			{/* Thumbnail */}
			<button
				onClick={() => onEdit(id, type)}
				className="w-full aspect-video bg-muted flex items-center
					justify-center cursor-pointer hover:bg-accent
					transition-colors duration-200"
				aria-label={`Edit ${name}`}
			>
				{thumbnail ? (
					<img
						src={thumbnail}
						alt={name}
						className="w-full h-full object-contain"
					/>
				) : (
					<span className="text-muted-foreground text-sm">
						No preview
					</span>
				)}
			</button>

			{/* Badges */}
			<div className="absolute top-2 right-2 flex gap-1">
				{isMotion && (
					<span
						className="px-2 py-0.5 rounded text-xs
							bg-orange-500/20 text-orange-600
							dark:text-orange-400"
					>
						Motion
					</span>
				)}
				{isModifier && (
					<span
						className="px-2 py-0.5 rounded text-xs
							bg-yellow-500/20 text-yellow-600
							dark:text-yellow-400"
					>
						Modifier
					</span>
				)}
				<span
					className={`px-2.5 py-1 rounded-md text-xs
						${badge.className}`}
				>
					{badge.label}
				</span>
			</div>

			{/* Content */}
			<div className="p-4">
				<div className="flex items-start justify-between gap-2 mb-2">
					<h3 className="flex-1 line-clamp-1 font-medium">{name}</h3>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								className="p-1 hover:bg-accent rounded
									transition-all duration-200 opacity-0
									group-hover:opacity-100 cursor-pointer"
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
				<p className="text-sm text-muted-foreground line-clamp-2 mb-2">
					{description}
				</p>
			)}
				<div className="pt-2 border-t border-border">
					<p className="text-sm text-muted-foreground">{lastModified}</p>
				</div>
			</div>
		</div>
	)
}
