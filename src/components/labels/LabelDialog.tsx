import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TAG_COLOR_PALETTE, getTagStyles } from '../playbook-editor/constants/playbook'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Label } from '@/hooks/useLabelsData'
import './label-dialog.css'

interface LabelDialogProps {
	isOpen: boolean
	onClose: () => void
	availableLabels: Label[]
	selectedLabelIds: number[]
	onLabelsChange: (labelIds: number[]) => void
	onCreateLabel?: (name: string, color: string) => Promise<Label>
	title?: string
}

export function LabelDialog({ isOpen, onClose, availableLabels, selectedLabelIds, onLabelsChange, onCreateLabel, title = 'Manage Labels' }: LabelDialogProps) {
	const [showCreate, setShowCreate] = useState(false)
	const [newName, setNewName] = useState('')
	const [newColor, setNewColor] = useState(TAG_COLOR_PALETTE[0].value)
	const [creating, setCreating] = useState(false)

	const toggleLabel = (id: number) => {
		onLabelsChange(selectedLabelIds.includes(id) ? selectedLabelIds.filter(i => i !== id) : [...selectedLabelIds, id])
	}

	const handleCreate = async () => {
		if (!newName.trim() || !onCreateLabel) return
		setCreating(true)
		try {
			const label = await onCreateLabel(newName.trim(), newColor)
			onLabelsChange([...selectedLabelIds, label.id])
			setNewName('')
			setShowCreate(false)
		} finally { setCreating(false) }
	}

	const presets = availableLabels.filter(l => l.is_preset)
	const custom = availableLabels.filter(l => !l.is_preset)

	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogContent className="label-dialog">
				<DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
				<div className="label-dialog__content">
					<div>
						<h4 className="label-dialog__section-title">Preset Labels</h4>
						<div className="label-dialog__labels">
							{presets.map(label => {
								const labelStyle = getTagStyles(label.color)
								const selected = selectedLabelIds.includes(label.id)
								return (
									<button key={label.id} onClick={() => toggleLabel(label.id)}
										className={`label-dialog__label-button ${selected ? 'label-dialog__label-button--selected' : ''}`}
										style={labelStyle}>
										{selected && <Check className="label-dialog__icon-sm" />}{label.name}
									</button>
								)
							})}
						</div>
					</div>
					{custom.length > 0 && (
						<div>
							<h4 className="label-dialog__section-title">Custom Labels</h4>
							<div className="label-dialog__labels">
								{custom.map(label => {
									const labelStyle = getTagStyles(label.color)
									const selected = selectedLabelIds.includes(label.id)
									return (
										<button key={label.id} onClick={() => toggleLabel(label.id)}
											className={`label-dialog__label-button ${selected ? 'label-dialog__label-button--selected' : ''}`}
											style={labelStyle}>
											{selected && <Check className="label-dialog__icon-sm" />}{label.name}
										</button>
									)
								})}
							</div>
						</div>
					)}
					{onCreateLabel && (
						<div className="label-dialog__create">
							{showCreate ? (
								<div className="label-dialog__create-form">
									<Input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Label name..." autoFocus />
									<div className="label-dialog__color-palette">
										{TAG_COLOR_PALETTE.map(c => (
											<button key={c.value} onClick={() => setNewColor(c.value)}
												className={`label-dialog__color-button ${newColor === c.value ? 'label-dialog__color-button--selected' : ''}`}
												style={{ backgroundColor: c.value }} title={c.name} aria-label={c.name} />
										))}
									</div>
									<div className="label-dialog__form-actions">
										<Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
										<Button onClick={handleCreate} disabled={!newName.trim() || creating}>
											{creating ? 'Creating...' : 'Create'}
										</Button>
									</div>
								</div>
							) : (
								<button onClick={() => setShowCreate(true)} className="label-dialog__create-toggle">
									<Plus className="label-dialog__icon-md" />Create custom label
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
