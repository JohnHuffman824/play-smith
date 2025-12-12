import { Plus } from 'lucide-react'

type NodeAddPopupProps = {
	position: { x: number; y: number }
	onAdd: () => void
	onClose: () => void
}

export function NodeAddPopup({ position, onAdd, onClose }: NodeAddPopupProps) {
	return (
		<div
			className="absolute z-50 transform -translate-x-1/2"
			style={{
				left: position.x,
				top: position.y - 40,
			}}
		>
			<button
				onClick={(e) => {
					e.stopPropagation()
					onAdd()
				}}
				onContextMenu={(e) => e.preventDefault()}
				className="p-2 bg-white rounded-lg shadow-lg border
					border-gray-200 hover:bg-green-50
					hover:border-green-300 transition-colors"
				title="Add node"
			>
				<Plus size={18} className="text-green-500" />
			</button>
		</div>
	)
}
