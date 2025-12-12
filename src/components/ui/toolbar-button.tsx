import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'
import { cn } from './utils'

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
					className={cn(
						// Base
						"w-14 h-14 rounded-xl flex items-center justify-center",
						"cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
						"transition-all duration-200",
						"disabled:opacity-50 disabled:cursor-not-allowed",

						// Active/Inactive states
						isActive
							? "bg-action-button text-action-button-foreground shadow-lg"
							: "border border-border hover:bg-accent hover:text-foreground",

						className
					)}
					style={!isActive ? { color: 'var(--icon-muted)' } : undefined}
				>
					<Icon className="w-6 h-6" />
					{children}
				</button>
			</TooltipTrigger>
			<TooltipContent side="right">{tooltip}</TooltipContent>
		</Tooltip>
	)
}
