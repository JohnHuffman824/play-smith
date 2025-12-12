import { X } from 'lucide-react'
import { cn } from './utils'
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
			className={cn('dialog-close-button', className)}
		>
			<X />
		</button>
	)
}
