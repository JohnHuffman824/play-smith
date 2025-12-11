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
		<div className="absolute top-5 left-12 z-10 flex flex-row-reverse flex-wrap-reverse gap-2 max-w-[50%]">
			{tags.map(tag => {
				const cls = getTagClasses(tag.color)
				return (
					<span
						key={tag.id}
						className={`group relative inline-block px-2 py-0.5 rounded-full text-xs ${cls.bg} ${cls.text} opacity-70`}
					>
						{tag.name}
						<button
							onClick={() => onRemoveTag(tag.id)}
							className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-background rounded-full p-0.5 shadow-sm transition-opacity cursor-pointer"
						>
							<X className="w-2.5 h-2.5" />
						</button>
					</span>
				)
			})}
		</div>
	)
}
