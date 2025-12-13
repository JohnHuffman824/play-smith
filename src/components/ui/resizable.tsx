"use client"

import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"
import { GripVertical } from "lucide-react"

import "./resizable.css"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={`resizable-panel-group ${className ?? ''}`.trim()}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  className,
  withHandle,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={`resizable-handle ${className ?? ''}`.trim()}
      {...props}
    >
      {withHandle && (
        <div className="resizable-handle-grip">
          <GripVertical className="resizable-handle-icon" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
