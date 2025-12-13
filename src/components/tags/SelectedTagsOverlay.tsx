import { X } from 'lucide-react'
import { getTagStyles } from '../playbook-editor/constants/playbook'
import type { Tag } from '@/hooks/useTagsData'
import './selected-tags-overlay.css'

interface SelectedTagsOverlayProps {
	tags: Tag[]
	onRemoveTag: (_tagId: number) => void
}

export function SelectedTagsOverlay({ tags, onRemoveTag }: SelectedTagsOverlayProps) {
	if (tags.length === 0) return null

	return (
		<div className="selected-tags-overlay">
			{tags.map(tag => {
				const tagStyle = getTagStyles(tag.color)
				return (
					<span
						key={tag.id}
						className="selected-tags-overlay__tag"
						style={tagStyle}
					>
						{tag.name}
						<button
							onClick={() => onRemoveTag(tag.id)}
							className="selected-tags-overlay__remove"
							aria-label={`Remove ${tag.name}`}
						>
							<X className="selected-tags-overlay__remove-icon" />
						</button>
					</span>
				)
			})}
		</div>
	)
}
