import { X } from 'lucide-react'
import { TagSelector } from './TagSelector'
import type { Tag } from '@/hooks/useTagsData'

interface TagOverlayProps {
	isOpen: boolean
	onClose: () => void
	availableTags: Tag[]
	selectedTags: Tag[]
	onTagsChange: (tagIds: number[]) => void
	onCreateTag?: (name: string, color: string) => Promise<Tag>
}

export function TagOverlay({
	isOpen,
	onClose,
	availableTags,
	selectedTags,
	onTagsChange,
	onCreateTag
}: TagOverlayProps) {
	if (!isOpen) return null

	return (
		<div
			className="absolute top-4 right-4 z-10 bg-card border border-border rounded-lg shadow-lg p-4 min-w-[300px]"
			data-tag-overlay
		>
			<div className="flex items-center justify-between mb-3">
				<h3 className="font-semibold text-sm">Tags</h3>
				<button
					onClick={onClose}
					className="p-1 hover:bg-accent rounded transition-colors"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
			<TagSelector
				availableTags={availableTags}
				selectedTags={selectedTags}
				onTagsChange={onTagsChange}
				onCreateTag={onCreateTag}
			/>
		</div>
	)
}
