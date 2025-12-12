import { ReactNode } from 'react'
import { Button } from '../ui/button'
import './modal.css'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: ReactNode
	className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
	if (!isOpen) return null

	return (
		<div className="modal-overlay">
			{/* Backdrop */}
			<div
				className="modal-backdrop"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className={`modal ${className || ''}`}>
				<div className="modal-header">
					<h2 className="modal-title">{title}</h2>
					<Button
						onClick={onClose}
						variant="ghost"
						size="icon"
						className="h-auto w-auto p-1"
					>
						✕
					</Button>
				</div>
				{children}
			</div>
		</div>
	)
}
