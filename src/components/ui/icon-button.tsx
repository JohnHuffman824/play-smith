import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'
import './icon-button.css'

type IconButtonProps = {
	icon: LucideIcon
	tooltip: string
	onClick?: () => void
	disabled?: boolean
	variant?: 'default' | 'ghost' | 'destructive'
	size?: 'sm' | 'md'
	className?: string
}

export function IconButton({
	icon: Icon,
	tooltip,
	onClick,
	disabled,
	variant = 'default',
	size = 'md',
	className
}: IconButtonProps) {
	const variantClass = `icon-button-${variant}`
	const sizeClass = `icon-button-${size}`

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={onClick}
					disabled={disabled}
					className={`icon-button ${variantClass} ${sizeClass} ${className || ''}`}
				>
					<Icon className="icon-button-icon" />
				</button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	)
}
