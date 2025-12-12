import { Plus } from 'lucide-react'
import './node-add-popup.css'

type NodeAddPopupProps = {
	position: { x: number; y: number }
	onAdd: () => void
	onClose: () => void
}

export function NodeAddPopup({ position, onAdd, onClose }: NodeAddPopupProps) {
	return (
		<div
			className="node-add-popup"
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
				className="node-add-button"
				title="Add node"
			>
				<Plus size={18} className="node-add-icon" />
			</button>
		</div>
	)
}
