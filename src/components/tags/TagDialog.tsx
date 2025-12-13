import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TAG_COLOR_PALETTE, getTagStyles } from '../playbook-editor/constants/playbook'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Tag } from '@/hooks/useTagsData'
import './tag-dialog.css'

interface TagDialogProps {
	isOpen: boolean
	onClose: () => void
	availableTags: Tag[]
	selectedTagIds: number[]
	onTagsChange: (_tagIds: number[]) => void
	onCreateTag?: (_name: string, _color: string) => Promise<Tag>
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
			<DialogContent className="tag-dialog">
				<DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
				<div className="tag-dialog__content">
					<div>
						<h4 className="tag-dialog__section-title">Preset Tags</h4>
						<div className="tag-dialog__tags">
							{presets.map(tag => {
								const tagStyle = getTagStyles(tag.color)
								const selected = selectedTagIds.includes(tag.id)
								return (
									<button key={tag.id} onClick={() => toggleTag(tag.id)}
										className={`tag-dialog__tag-button ${selected ? 'tag-dialog__tag-button--selected' : ''}`}
										style={tagStyle}>
										{selected && <Check className="tag-dialog__icon-sm" />}{tag.name}
									</button>
								)
							})}
						</div>
					</div>
					{custom.length > 0 && (
						<div>
							<h4 className="tag-dialog__section-title">Custom Tags</h4>
							<div className="tag-dialog__tags">
								{custom.map(tag => {
									const tagStyle = getTagStyles(tag.color)
									const selected = selectedTagIds.includes(tag.id)
									return (
										<button key={tag.id} onClick={() => toggleTag(tag.id)}
											className={`tag-dialog__tag-button ${selected ? 'tag-dialog__tag-button--selected' : ''}`}
											style={tagStyle}>
											{selected && <Check className="tag-dialog__icon-sm" />}{tag.name}
										</button>
									)
								})}
							</div>
						</div>
					)}
					{onCreateTag && (
						<div className="tag-dialog__create">
							{showCreate ? (
								<div className="tag-dialog__create-form">
									<Input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tag name..." autoFocus />
									<div className="tag-dialog__color-palette">
										{TAG_COLOR_PALETTE.map(c => (
											<button key={c.value} onClick={() => setNewColor(c.value)}
												className={`tag-dialog__color-button ${newColor === c.value ? 'tag-dialog__color-button--selected' : ''}`}
												style={{ backgroundColor: c.value }} title={c.name} aria-label={c.name} />
										))}
									</div>
									<div className="tag-dialog__form-actions">
										<Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
										<Button onClick={handleCreate} disabled={!newName.trim() || creating}>
											{creating ? 'Creating...' : 'Create'}
										</Button>
									</div>
								</div>
							) : (
								<button onClick={() => setShowCreate(true)} className="tag-dialog__create-toggle">
									<Plus className="tag-dialog__icon-md" />Create custom tag
								</button>
							)}
						</div>
					)}
				</div>
				<DialogFooter>
					<Button onClick={onClose}>Done</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
