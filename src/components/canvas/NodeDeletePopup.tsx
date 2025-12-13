import { Trash2 } from 'lucide-react'
import './node-delete-popup.css'

interface NodeDeletePopupProps {
	position: { x: number; y: number }
	onDelete: () => void
	onClose: () => void
}

export function NodeDeletePopup({ position, onDelete }: NodeDeletePopupProps) {
	return (
		<div
			className="node-delete-popup"
			style={{
				left: position.x,
				top: position.y - 40,
			}}
		>
			<button
				onClick={(e) => {
					e.stopPropagation()
					onDelete()
				}}
				onContextMenu={(e) => e.preventDefault()}
				className="node-delete-button"
				title="Delete node"
			>
				<Trash2 size={18} className="node-delete-icon" />
			</button>
		</div>
	)
}
