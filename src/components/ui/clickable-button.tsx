import * as React from "react"
import { cn } from "@/lib/utils"
import "./clickable-button.css"

export interface ClickableButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode
}

const ClickableButton = React.forwardRef<HTMLButtonElement, ClickableButtonProps>(
	({ className, children, disabled, ...props }, ref) => {
		return (
			<button
				className={cn(
					"clickable-button",
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
