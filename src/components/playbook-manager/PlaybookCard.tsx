import { BookOpen, MoreVertical, Folder, Download, Share2, Edit, Copy, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type PlaybookCardProps = {
	id: number
	name: string
	type: 'playbook' | 'folder'
	playCount?: number
	lastModified: string
	thumbnail?: string
	onRename: (id: number) => void
	onDelete: (id: number) => void
	onDuplicate: (id: number) => void
	onExport?: (id: number) => void
	onShare?: (id: number) => void
}

export function PlaybookCard({
	id,
	name,
	type,
	playCount = 0,
	lastModified,
	thumbnail,
	onRename,
	onDelete,
	onDuplicate,
	onExport,
	onShare,
}: PlaybookCardProps) {
	const navigate = useNavigate()

	const handleOpen = () => {
		if (type === 'playbook') {
			navigate(`/playbooks/${id}`)
		}
	}

	return (
		<div
			className="group relative bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
			onClick={handleOpen}
		>
			{/* Thumbnail/Preview */}
			<div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
				{thumbnail ? (
					<img src={thumbnail} alt={name} className="w-full h-full object-cover" />
				) : type === 'folder' ? (
					<Folder className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
				) : (
					<div className="w-full h-full bg-gradient-to-br from-accent to-muted flex items-center justify-center">
						<BookOpen className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
					</div>
				)}

				{/* Action Buttons - Only show for playbooks */}
				{type === 'playbook' && (
					<>
						{onShare && (
							<button
								className="absolute top-2 right-20 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
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
								className="absolute top-2 right-11 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
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
							className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10 cursor-pointer"
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
			<div className="p-4">
				<h3 className="truncate mb-1">{name}</h3>
				<p className="text-muted-foreground">
					{type === 'folder' ? 'Folder' : `${playCount} play${playCount !== 1 ? 's' : ''}`}
				</p>
				<p className="text-muted-foreground mt-1">
					{lastModified}
				</p>
			</div>
		</div>
	)
}
