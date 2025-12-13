import { X } from 'lucide-react'
import './dialog-close-button.css'

type DialogCloseButtonProps = {
	onClose: () => void
	className?: string
}

export function DialogCloseButton({ onClose, className }: DialogCloseButtonProps) {
	return (
		<button
			onClick={onClose}
			aria-label="Close dialog"
			className={`dialog-close-button ${className ?? ''}`.trim()}
		>
			<X />
		</button>
	)
}
