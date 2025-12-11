import { ReactNode } from 'react'
import { Button } from '../ui/button'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">{title}</h2>
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
