import { useState } from 'react'
import { Tag as TagIcon, Plus, X } from 'lucide-react'
import { TagDialog } from './TagDialog'
import { getTagClasses } from '../playbook-editor/constants/playbook'
import type { Tag } from '@/hooks/useTagsData'

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
			<div className="flex flex-wrap items-center gap-2">
				{selectedTags.map(tag => {
					const cls = getTagClasses(tag.color)
					return (
						<span key={tag.id} className={`group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${cls.bg} ${cls.text}`}>
							{tag.name}
							<button onClick={e => removeTag(tag.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-foreground cursor-pointer">
								<X className="w-3 h-3" />
							</button>
						</span>
					)
				})}
				<button onClick={() => setDialogOpen(true)}
					className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer">
					{selectedTags.length === 0 ? <><TagIcon className="w-3 h-3" />Add tags</> : <Plus className="w-3 h-3" />}
				</button>
			</div>
			<TagDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} availableTags={availableTags}
				selectedTagIds={selectedIds} onTagsChange={onTagsChange} onCreateTag={onCreateTag} />
		</div>
	)
}
