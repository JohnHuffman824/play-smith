import { BookOpen, MoreVertical, Folder, Download, Share2, Edit, Copy, Trash2, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import './playbook-card.css'

type PlaybookCardProps = {
	id: number
	name: string
	type: 'playbook' | 'folder'
	playCount?: number
	lastModified: string
	thumbnail?: string
	isStarred?: boolean
	onRename: (id: number) => void
	onDelete: (id: number) => void
	onDuplicate: (id: number) => void
	onExport?: (id: number) => void
	onShare?: (id: number) => void
	onToggleStar?: (id: number) => void
}

export function PlaybookCard({
	id,
	name,
	type,
	playCount = 0,
	lastModified,
	thumbnail,
	isStarred = false,
	onRename,
	onDelete,
	onDuplicate,
	onExport,
	onShare,
	onToggleStar,
}: PlaybookCardProps) {
	const navigate = useNavigate()

	const handleOpen = () => {
		if (type === 'playbook') {
			navigate(`/playbooks/${id}`)
		}
	}

	return (
		<div
			className="playbook-card"
			onClick={handleOpen}
		>
			{/* Thumbnail/Preview */}
			<div className="playbook-card-thumbnail">
				{thumbnail ? (
					<img src={thumbnail} alt={name} />
				) : type === 'folder' ? (
					<Folder className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
				) : (
					<div className="playbook-card-thumbnail-gradient">
						<BookOpen className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
					</div>
				)}

				{/* Action Buttons - Only show for playbooks */}
				{type === 'playbook' && (
					<>
						{/* Star Button - Always visible in top-left */}
						{onToggleStar && (
							<button
								className="playbook-card-action-button playbook-card-action-button-star"
								onClick={(e) => {
									e.stopPropagation()
									onToggleStar(id)
								}}
								title={isStarred ? "Unstar Playbook" : "Star Playbook"}
							>
								<Star
									className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-foreground'}`.trim()}
								/>
							</button>
						)}
						{onShare && (
							<button
								className="playbook-card-action-button playbook-card-action-button-share"
								onClick={(e) => {
									e.stopPropagation()
									onShare(id)
								}}
								title="Share Playbook"
							>
								<Share2 className="w-4 h-4 text-foreground" />
							</button>
						)}
						{onExport && (
							<button
								className="playbook-card-action-button playbook-card-action-button-export"
								onClick={(e) => {
									e.stopPropagation()
									onExport(id)
								}}
								title="Export Playbook"
							>
								<Download className="w-4 h-4 text-foreground" />
							</button>
						)}
					</>
				)}

				{/* More Options Button */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							className="playbook-card-action-button playbook-card-action-button-more"
							onClick={(e) => {
								e.stopPropagation()
							}}
						>
							<MoreVertical className="w-4 h-4 text-foreground" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
						<DropdownMenuItem onClick={(e) => {
							e.stopPropagation()
							handleOpen()
						}}>
							<BookOpen className="w-4 h-4" />
							Open
						</DropdownMenuItem>
						<DropdownMenuItem onClick={(e) => {
							e.stopPropagation()
							onRename(id)
						}}>
							<Edit className="w-4 h-4" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem onClick={(e) => {
							e.stopPropagation()
							onDuplicate(id)
						}}>
							<Copy className="w-4 h-4" />
							Duplicate
						</DropdownMenuItem>
						{onExport && (
							<DropdownMenuItem onClick={(e) => {
								e.stopPropagation()
								onExport(id)
							}}>
								<Download className="w-4 h-4" />
								Export
							</DropdownMenuItem>
						)}
						{onShare && (
							<DropdownMenuItem onClick={(e) => {
								e.stopPropagation()
								onShare(id)
							}}>
								<Share2 className="w-4 h-4" />
								Share
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={(e) => {
							e.stopPropagation()
							onDelete(id)
						}} variant="destructive">
							<Trash2 className="w-4 h-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Card Info */}
			<div className="playbook-card-info">
				<h3 className="playbook-card-title">{name}</h3>
				<p className="playbook-card-meta">
					{type === 'folder' ? 'Folder' : `${playCount} play${playCount !== 1 ? 's' : ''}`}
				</p>
				<p className="playbook-card-meta">
					{lastModified}
				</p>
			</div>
		</div>
	)
}
