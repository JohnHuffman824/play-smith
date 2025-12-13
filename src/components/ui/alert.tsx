import * as React from "react"
import "./alert.css"

type AlertVariant = "default" | "destructive"

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: AlertVariant
}) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={`alert ${className ?? ''}`.trim()}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={`alert-title ${className ?? ''}`.trim()}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={`alert-description ${className ?? ''}`.trim()}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
