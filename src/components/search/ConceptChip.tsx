import { X } from 'lucide-react'
import type { ConceptChip as ConceptChipType } from '../../types/concept.types'
import { CHIP_STYLES } from '../../constants/concept.constants'

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
			className={`
				inline-flex items-center gap-1 px-2 py-1 rounded-md
				border text-sm font-medium transition-all
				${chipStyles[chip.type]}
				${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
				hover:shadow-sm
			`}
			draggable
		>
			<span>{chip.label}</span>
			<button
				onClick={handleRemove}
				className="hover:bg-accent rounded p-0.5 transition-colors cursor-pointer"
				aria-label={`Remove ${chip.label}`}
			>
				<X className="w-3 h-3" />
			</button>
		</div>
	)
}
