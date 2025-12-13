import { X } from 'lucide-react'
import type { ConceptChip as ConceptChipType } from '../../types/concept.types'
import { CHIP_STYLES } from '../../constants/concept.constants'
import './concept-chip.css'

interface ConceptChipProps {
	chip: ConceptChipType
	onRemove: (chipId: string) => void
	isDragging?: boolean
}

export function ConceptChip({ chip, onRemove, isDragging }: ConceptChipProps) {
	const chipStyles = CHIP_STYLES

	function handleRemove(e: React.MouseEvent) {
		e.stopPropagation()
		onRemove(chip.id)
	}

	return (
		<div
			className={`concept-chip ${chipStyles[chip.type]} ${isDragging ? 'concept-chip--dragging' : ''}`}
			draggable
		>
			<span>{chip.label}</span>
			<button
				onClick={handleRemove}
				className="concept-chip__remove"
				aria-label={`Remove ${chip.label}`}
			>
				<X className="concept-chip__remove-icon" />
			</button>
		</div>
	)
}
