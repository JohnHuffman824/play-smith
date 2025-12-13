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
import './presentation-card.css'

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
			className="presentation-card"
			onClick={() => onOpen(id)}
		>
			{/* Thumbnail/Preview */}
			<div className="presentation-card__thumbnail">
				<div className="presentation-card__gradient">
					<Presentation
						className="presentation-card__icon"
					/>
				</div>

				{/* Edit Button - hover */}
				<button
					className="presentation-card__button presentation-card__button--edit"
					onClick={(e) => {
						e.stopPropagation()
						onEdit(id)
					}}
					title="Edit Presentation"
					aria-label="Edit Presentation"
				>
					<Edit className="presentation-card__button-icon" />
				</button>

				{/* Present Button - hover */}
				<button
					className="presentation-card__button presentation-card__button--present"
					onClick={(e) => {
						e.stopPropagation()
						onOpen(id)
					}}
					title="Start Presentation"
					aria-label="Start Presentation"
				>
					<Play className="presentation-card__button-icon" />
				</button>

				{/* More Options Button */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							className="presentation-card__button presentation-card__button--more"
							onClick={(e) => e.stopPropagation()}
							aria-label="More options"
						>
							<MoreVertical className="presentation-card__button-icon" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						onClick={(e) => e.stopPropagation()}
					>
						<DropdownMenuItem onClick={() => onOpen(id)}>
							<Play className="presentation-card__button-icon" />
							Present
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onEdit(id)}>
							<Edit className="presentation-card__button-icon" />
							Edit Slides
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onRename(id)}>
							<Edit className="presentation-card__button-icon" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDuplicate(id)}
						>
							<Copy className="presentation-card__button-icon" />
							Duplicate
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(id)}
							variant="destructive"
						>
							<Trash2 className="presentation-card__button-icon" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Card Info */}
			<div className="presentation-card__info">
				<h3 className="presentation-card__name">{name}</h3>
				<p className="presentation-card__count">
					{slideCount} slide{slideCount !== 1 ? 's' : ''}
				</p>
				<p className="presentation-card__date">
					{lastModified}
				</p>
			</div>
		</div>
	)
}
