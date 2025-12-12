import { X } from 'lucide-react'
import { getTagClasses } from '../playbook-editor/constants/playbook'
import type { Tag } from '@/hooks/useTagsData'
import './selected-tags-overlay.css'

interface SelectedTagsOverlayProps {
	tags: Tag[]
	onRemoveTag: (tagId: number) => void
}

export function SelectedTagsOverlay({ tags, onRemoveTag }: SelectedTagsOverlayProps) {
	if (tags.length === 0) return null

	return (
		<div className="selected-tags-overlay">
			{tags.map(tag => {
				const cls = getTagClasses(tag.color)
				return (
					<span
						key={tag.id}
						className={`selected-tags-overlay__tag ${cls.bg} ${cls.text}`}
					>
						{tag.name}
						<button
							onClick={() => onRemoveTag(tag.id)}
							className="selected-tags-overlay__remove"
							aria-label={`Remove ${tag.name}`}
						>
							<X className="w-2.5 h-2.5" />
						</button>
					</span>
				)
			})}
		</div>
	)
}
