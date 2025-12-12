import * as React from "react"

import './textarea.css'
import { cn } from "./utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn('textarea', className)}
      {...props}
    />
  )
}

export { Textarea }
