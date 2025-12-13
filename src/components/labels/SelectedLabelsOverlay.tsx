import { X } from 'lucide-react'
import { getTagStyles } from '../playbook-editor/constants/playbook'
import type { Label } from '@/hooks/useLabelsData'
import './selected-labels-overlay.css'

interface SelectedLabelsOverlayProps {
	labels: Label[]
	onRemoveLabel: (labelId: number) => void
}

export function SelectedLabelsOverlay({ labels, onRemoveLabel }: SelectedLabelsOverlayProps) {
	if (labels.length === 0) return null

	return (
		<div className="selected-labels-overlay">
			{labels.map(label => {
				const labelStyle = getTagStyles(label.color)
				return (
					<span
						key={label.id}
						className="selected-labels-overlay__label"
						style={labelStyle}
					>
						{label.name}
						<button
							onClick={() => onRemoveLabel(label.id)}
							className="selected-labels-overlay__remove"
							aria-label={`Remove ${label.name}`}
						>
							<X className="selected-labels-overlay__remove-icon" />
						</button>
					</span>
				)
			})}
		</div>
	)
}
