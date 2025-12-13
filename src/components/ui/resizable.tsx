"use client"

import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"


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
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={`resizable-handle ${className ?? ''}`.trim()}
      {...props}
    />
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
