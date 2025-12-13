import * as React from "react"
import "./clickable-button.css"

export interface ClickableButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode
}

const ClickableButton = React.forwardRef<HTMLButtonElement, ClickableButtonProps>(
	({ className, children, disabled, ...props }, ref) => {
		return (
			<button
				className={`clickable-button ${className ?? ''}`.trim()}
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
