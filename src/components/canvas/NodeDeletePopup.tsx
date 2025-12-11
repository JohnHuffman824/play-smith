import { Trash2 } from 'lucide-react'

interface NodeDeletePopupProps {
	position: { x: number; y: number }
	onDelete: () => void
	onClose: () => void
}

export function NodeDeletePopup({ position, onDelete, onClose }: NodeDeletePopupProps) {
	return (
		<div
			className="absolute z-50 transform -translate-x-1/2"
			style={{
				left: position.x,
				top: position.y - 40, // Position above the node
			}}
		>
			<button
				onClick={(e) => {
					e.stopPropagation()
					onDelete()
				}}
				onContextMenu={(e) => e.preventDefault()}
				className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 transition-colors"
				title="Delete node"
			>
				<Trash2 size={18} className="text-red-500" />
			</button>
		</div>
	)
}
