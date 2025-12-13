import { useState } from 'react'
import { Tag as TagIcon, Plus, X } from 'lucide-react'
import { LabelDialog } from './LabelDialog'
import { getTagStyles } from '../playbook-editor/constants/playbook'
import type { Label } from '@/hooks/useLabelsData'
import './label-selector.css'

interface LabelSelectorProps {
	availableLabels: Label[]
	selectedLabels: Label[]
	onLabelsChange: (labelIds: number[]) => void
	onCreateLabel?: (name: string, color: string) => Promise<Label>
}

export function LabelSelector({ availableLabels, selectedLabels, onLabelsChange, onCreateLabel }: LabelSelectorProps) {
	const [dialogOpen, setDialogOpen] = useState(false)
	const selectedIds = selectedLabels.map(l => l.id)

	const removeLabel = (id: number, e: React.MouseEvent) => {
		e.stopPropagation()
		onLabelsChange(selectedIds.filter(i => i !== id))
	}

	return (
		<div>
			<div className="label-selector">
				{selectedLabels.map(label => {
					const labelStyle = getTagStyles(label.color)
					return (
						<span key={label.id} className="label-selector__label" style={labelStyle}>
							{label.name}
							<button onClick={e => removeLabel(label.id, e)} className="label-selector__label-remove" aria-label={`Remove ${label.name}`}>
								<X className="label-selector__icon" />
							</button>
						</span>
					)
				})}
				<button onClick={() => setDialogOpen(true)} className="label-selector__add" aria-label="Add labels">
					{selectedLabels.length === 0 ? <><TagIcon className="label-selector__icon" />Add labels</> : <Plus className="label-selector__icon" />}
				</button>
			</div>
			<LabelDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} availableLabels={availableLabels}
				selectedLabelIds={selectedIds} onLabelsChange={onLabelsChange} onCreateLabel={onCreateLabel} />
		</div>
	)
}
