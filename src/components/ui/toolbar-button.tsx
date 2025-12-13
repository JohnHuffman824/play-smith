import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'
import './toolbar-button.css'

type ToolbarButtonProps = {
	icon: LucideIcon
	tooltip: string
	isActive?: boolean
	onClick?: () => void
	disabled?: boolean
	className?: string
	children?: ReactNode // For overlays like status dots or color swatches
}

export function ToolbarButton({
	icon: Icon,
	tooltip,
	isActive = false,
	onClick,
	disabled,
	className,
	children
}: ToolbarButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={onClick}
					disabled={disabled}
					data-active={isActive}
					className={`toolbar-button ${className ?? ''}`.trim()}
					style={!isActive ? { color: 'var(--icon-muted)' } : undefined}
				>
					<Icon />
					{children}
				</button>
			</TooltipTrigger>
			<TooltipContent side="right">{tooltip}</TooltipContent>
		</Tooltip>
	)
}
