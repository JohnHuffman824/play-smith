import { Save, Trash2, Copy } from 'lucide-react'

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
			className="absolute bg-popover border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 z-40"
			style={{ top: position.y, left: position.x }}
		>
			<div className="px-3 py-1 text-sm font-medium text-popover-foreground border-r border-border">
				{selectedCount} selected
			</div>

			<button
				onClick={onSaveAsConcept}
				className="px-3 py-1.5 bg-action-button text-action-button-foreground hover:bg-action-button/90 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				title="Save selection as concept"
			>
				<Save className="w-4 h-4" />
				Save as Concept
			</button>

			<button
				onClick={onDuplicate}
				className="p-1.5 hover:bg-accent rounded transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				title="Duplicate selection"
			>
				<Copy className="w-4 h-4" />
			</button>

			<button
				onClick={onDelete}
				className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				title="Delete selection"
			>
				<Trash2 className="w-4 h-4" />
			</button>
		</div>
	)
}
