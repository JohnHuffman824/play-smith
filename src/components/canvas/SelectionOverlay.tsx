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
			className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 flex items-center gap-2 z-40"
			style={{ top: position.y, left: position.x }}
		>
			<div className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
				{selectedCount} selected
			</div>

			<button
				onClick={onSaveAsConcept}
				className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
				title="Save selection as concept"
			>
				<Save className="w-4 h-4" />
				Save as Concept
			</button>

			<button
				onClick={onDuplicate}
				className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
				title="Duplicate selection"
			>
				<Copy className="w-4 h-4" />
			</button>

			<button
				onClick={onDelete}
				className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
				title="Delete selection"
			>
				<Trash2 className="w-4 h-4" />
			</button>
		</div>
	)
}
