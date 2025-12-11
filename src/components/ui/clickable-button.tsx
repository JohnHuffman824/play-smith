import * as React from "react"
import { cn } from "@/lib/utils"

export interface ClickableButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode
}

const ClickableButton = React.forwardRef<HTMLButtonElement, ClickableButtonProps>(
	({ className, children, disabled, ...props }, ref) => {
		return (
			<button
				className={cn(
					"cursor-pointer",
					disabled && "cursor-not-allowed",
					className
				)}
				ref={ref}
				disabled={disabled}
				{...props}
			>
				{children}
			</button>
		)
	}
)
ClickableButton.displayName = "ClickableButton"

export { ClickableButton }
