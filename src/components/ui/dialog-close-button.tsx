import { X } from 'lucide-react'
import { cn } from './utils'

type DialogCloseButtonProps = {
	onClose: () => void
	className?: string
}

export function DialogCloseButton({ onClose, className }: DialogCloseButtonProps) {
	return (
		<button
			onClick={onClose}
			aria-label="Close dialog"
			className={cn(
				// Size and shape
				"w-6 h-6 rounded-lg flex items-center justify-center",

				// Interactive states
				"cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
				"transition-all duration-200",

				// Colors
				"text-muted-foreground hover:text-foreground hover:bg-accent",

				className
			)}
		>
			<X className="w-4 h-4" />
		</button>
	)
}
