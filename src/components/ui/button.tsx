import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "./utils"
import "./button.css"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "action"
type ButtonSize = "default" | "sm" | "lg" | "icon"

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn("button", className)}
      {...props}
    />
  )
}

export { Button }
export type { ButtonProps, ButtonVariant, ButtonSize }
