import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'
import { cn } from './utils'

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
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={onClick}
					disabled={disabled}
					className={cn(
						// Base interactive styles
						"cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
						"transition-all duration-200",
						"disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",

						// Size variants
						size === 'sm' && "p-1.5 rounded-lg",
						size === 'md' && "p-2 rounded-lg",

						// Style variants
						variant === 'default' && "border border-border hover:bg-accent",
						variant === 'ghost' && "hover:bg-accent",
						variant === 'destructive' && "hover:bg-destructive/10 hover:text-destructive",

						className
					)}
				>
					<Icon className={cn(
						size === 'sm' && "w-4 h-4",
						size === 'md' && "w-5 h-5"
					)} />
				</button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	)
}
