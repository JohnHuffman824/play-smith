import { X } from 'lucide-react'
import { getTagClasses } from '../playbook-editor/constants/playbook'
import type { Tag } from '@/hooks/useTagsData'

interface SelectedTagsOverlayProps {
	tags: Tag[]
	onRemoveTag: (tagId: number) => void
}

export function SelectedTagsOverlay({ tags, onRemoveTag }: SelectedTagsOverlayProps) {
	if (tags.length === 0) return null

	return (
		<div className="absolute top-4 left-4 z-10 flex flex-row-reverse flex-wrap-reverse gap-2 max-w-[50%]">
			{tags.map(tag => {
				const cls = getTagClasses(tag.color)
				return (
					<span
						key={tag.id}
						className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cls.bg} ${cls.text}`}
					>
						{tag.name}
						<button
							onClick={() => onRemoveTag(tag.id)}
							className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity cursor-pointer"
						>
							<X className="w-3 h-3" />
						</button>
					</span>
				)
			})}
		</div>
	)
}
