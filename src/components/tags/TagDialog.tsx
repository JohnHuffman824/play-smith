import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TAG_COLOR_PALETTE, getTagClasses } from '../playbook-editor/constants/playbook'
import type { Tag } from '@/hooks/useTagsData'

interface TagDialogProps {
	isOpen: boolean
	onClose: () => void
	availableTags: Tag[]
	selectedTagIds: number[]
	onTagsChange: (tagIds: number[]) => void
	onCreateTag?: (name: string, color: string) => Promise<Tag>
	title?: string
}

export function TagDialog({ isOpen, onClose, availableTags, selectedTagIds, onTagsChange, onCreateTag, title = 'Manage Tags' }: TagDialogProps) {
	const [showCreate, setShowCreate] = useState(false)
	const [newName, setNewName] = useState('')
	const [newColor, setNewColor] = useState(TAG_COLOR_PALETTE[0].value)
	const [creating, setCreating] = useState(false)

	const toggleTag = (id: number) => {
		onTagsChange(selectedTagIds.includes(id) ? selectedTagIds.filter(i => i !== id) : [...selectedTagIds, id])
	}

	const handleCreate = async () => {
		if (!newName.trim() || !onCreateTag) return
		setCreating(true)
		try {
			const tag = await onCreateTag(newName.trim(), newColor)
			onTagsChange([...selectedTagIds, tag.id])
			setNewName('')
			setShowCreate(false)
		} finally { setCreating(false) }
	}

	const presets = availableTags.filter(t => t.is_preset)
	const custom = availableTags.filter(t => !t.is_preset)

	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
				<div className="space-y-4 py-4">
					<div>
						<h4 className="text-sm font-medium mb-2">Preset Tags</h4>
						<div className="flex flex-wrap gap-2">
							{presets.map(tag => {
								const cls = getTagClasses(tag.color)
								const selected = selectedTagIds.includes(tag.id)
								return (
									<button key={tag.id} onClick={() => toggleTag(tag.id)}
										className={`flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer ${cls.bg} ${cls.text} ${selected ? 'ring-2 ring-primary' : ''}`}>
										{selected && <Check className="w-3 h-3" />}{tag.name}
									</button>
								)
							})}
						</div>
					</div>
					{custom.length > 0 && (
						<div>
							<h4 className="text-sm font-medium mb-2">Custom Tags</h4>
							<div className="flex flex-wrap gap-2">
								{custom.map(tag => {
									const cls = getTagClasses(tag.color)
									const selected = selectedTagIds.includes(tag.id)
									return (
										<button key={tag.id} onClick={() => toggleTag(tag.id)}
											className={`flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer ${cls.bg} ${cls.text} ${selected ? 'ring-2 ring-primary' : ''}`}>
											{selected && <Check className="w-3 h-3" />}{tag.name}
										</button>
									)
								})}
							</div>
						</div>
					)}
					{onCreateTag && (
						<div className="pt-2 border-t">
							{showCreate ? (
								<div className="space-y-3">
									<input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tag name..."
										className="w-full px-3 py-2 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20" autoFocus />
									<div className="flex flex-wrap gap-2">
										{TAG_COLOR_PALETTE.map(c => (
											<button key={c.value} onClick={() => setNewColor(c.value)}
												className={`w-8 h-8 rounded-full cursor-pointer ${newColor === c.value ? 'ring-2 ring-primary ring-offset-2' : ''}`}
												style={{ backgroundColor: c.value }} title={c.name} />
										))}
									</div>
									<div className="flex justify-end gap-2">
										<button onClick={() => setShowCreate(false)} className="px-3 py-1.5 border border-border hover:bg-accent rounded-lg cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">Cancel</button>
										<button onClick={handleCreate} disabled={!newName.trim() || creating}
											className="px-3 py-1.5 bg-action-button text-action-button-foreground rounded-lg disabled:opacity-50 cursor-pointer hover:bg-action-button/90 transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
											{creating ? 'Creating...' : 'Create'}
										</button>
									</div>
								</div>
							) : (
								<button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
									<Plus className="w-4 h-4" />Create custom tag
								</button>
							)}
						</div>
					)}
				</div>
				<DialogFooter>
					<button onClick={onClose} className="px-4 py-2 bg-action-button text-action-button-foreground rounded-lg cursor-pointer hover:bg-action-button/90 transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">Done</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
