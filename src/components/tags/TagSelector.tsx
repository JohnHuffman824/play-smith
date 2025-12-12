import { useState } from 'react'
import { Tag as TagIcon, Plus, X } from 'lucide-react'
import { TagDialog } from './TagDialog'
import { getTagClasses } from '../playbook-editor/constants/playbook'
import type { Tag } from '@/hooks/useTagsData'
import './tag-selector.css'

interface TagSelectorProps {
	availableTags: Tag[]
	selectedTags: Tag[]
	onTagsChange: (tagIds: number[]) => void
	onCreateTag?: (name: string, color: string) => Promise<Tag>
}

export function TagSelector({ availableTags, selectedTags, onTagsChange, onCreateTag }: TagSelectorProps) {
	const [dialogOpen, setDialogOpen] = useState(false)
	const selectedIds = selectedTags.map(t => t.id)

	const removeTag = (id: number, e: React.MouseEvent) => {
		e.stopPropagation()
		onTagsChange(selectedIds.filter(i => i !== id))
	}

	return (
		<div>
			<div className="tag-selector">
				{selectedTags.map(tag => {
					const cls = getTagClasses(tag.color)
					return (
						<span key={tag.id} className={`tag-selector__tag ${cls.bg} ${cls.text}`}>
							{tag.name}
							<button onClick={e => removeTag(tag.id, e)} className="tag-selector__tag-remove" aria-label={`Remove ${tag.name}`}>
								<X className="w-3 h-3" />
							</button>
						</span>
					)
				})}
				<button onClick={() => setDialogOpen(true)} className="tag-selector__add" aria-label="Add tags">
					{selectedTags.length === 0 ? <><TagIcon className="w-3 h-3" />Add tags</> : <Plus className="w-3 h-3" />}
				</button>
			</div>
			<TagDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} availableTags={availableTags}
				selectedTagIds={selectedIds} onTagsChange={onTagsChange} onCreateTag={onCreateTag} />
		</div>
	)
}
