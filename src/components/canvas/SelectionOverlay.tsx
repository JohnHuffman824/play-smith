import { Save, Trash2, Copy } from 'lucide-react'
import './selection-overlay.css'

interface SelectionOverlayProps {
	selectedCount: number
	onSaveAsConcept: () => void
	onDelete: () => void
	onDuplicate: () => void
	position?: { x: number; y: number }
}

export function SelectionOverlay({
	selectedCount,
	onSaveAsConcept,
	onDelete,
	onDuplicate,
	position = { x: 20, y: 20 }
}: SelectionOverlayProps) {
	if (selectedCount < 2) return null

	return (
		<div
			className="selection-overlay"
			style={{ top: position.y, left: position.x }}
		>
			<div className="selection-overlay-count">
				{selectedCount} selected
			</div>

			<button
				onClick={onSaveAsConcept}
				className="selection-overlay-button-save"
				title="Save selection as concept"
			>
				<Save className="selection-overlay-icon" />
				Save as Concept
			</button>

			<button
				onClick={onDuplicate}
				className="selection-overlay-button-icon"
				title="Duplicate selection"
			>
				<Copy className="selection-overlay-icon" />
			</button>

			<button
				onClick={onDelete}
				className="selection-overlay-button-delete"
				title="Delete selection"
			>
				<Trash2 className="selection-overlay-icon" />
			</button>
		</div>
	)
}
