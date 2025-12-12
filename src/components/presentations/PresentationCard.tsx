import {
	Presentation,
	MoreVertical,
	Edit,
	Copy,
	Trash2,
	Play
} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type PresentationCardProps = {
	id: number
	name: string
	slideCount: number
	lastModified: string
	onOpen: (id: number) => void
	onEdit: (id: number) => void
	onRename: (id: number) => void
	onDelete: (id: number) => void
	onDuplicate: (id: number) => void
}

export function PresentationCard({
	id,
	name,
	slideCount,
	lastModified,
	onOpen,
	onEdit,
	onRename,
	onDelete,
	onDuplicate,
}: PresentationCardProps) {
	return (
		<div
			className="group relative bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
			onClick={() => onOpen(id)}
		>
			{/* Thumbnail/Preview */}
			<div
				className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden"
			>
				<div
					className="w-full h-full bg-gradient-to-br from-purple-500/20 to-muted flex items-center justify-center"
				>
					<Presentation
						className="w-16 h-16 text-muted-foreground/40"
						strokeWidth={1.5}
					/>
				</div>

				{/* Edit Button - hover */}
				<button
					className="absolute top-2 left-2 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
					onClick={(e) => {
						e.stopPropagation()
						onEdit(id)
					}}
					title="Edit Presentation"
				>
					<Edit className="w-4 h-4 text-foreground" />
				</button>

				{/* Present Button - hover */}
				<button
					className="absolute top-2 right-11 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
					onClick={(e) => {
						e.stopPropagation()
						onOpen(id)
					}}
					title="Start Presentation"
				>
					<Play className="w-4 h-4 text-foreground" />
				</button>

				{/* More Options Button */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10 cursor-pointer"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreVertical
								className="w-4 h-4 text-foreground"
							/>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						onClick={(e) => e.stopPropagation()}
					>
						<DropdownMenuItem onClick={() => onOpen(id)}>
							<Play className="w-4 h-4" />
							Present
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onEdit(id)}>
							<Edit className="w-4 h-4" />
							Edit Slides
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onRename(id)}>
							<Edit className="w-4 h-4" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDuplicate(id)}
						>
							<Copy className="w-4 h-4" />
							Duplicate
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(id)}
							variant="destructive"
						>
							<Trash2 className="w-4 h-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Card Info */}
			<div className="p-4">
				<h3 className="truncate mb-1">{name}</h3>
				<p className="text-sm text-muted-foreground">
					{slideCount} slide{slideCount !== 1 ? 's' : ''}
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					{lastModified}
				</p>
			</div>
		</div>
	)
}
