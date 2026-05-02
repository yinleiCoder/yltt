"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({
  open,
  onOpenChange,
  ...props
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback((nextOpen, event) => {
    if (!isControlled) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen, event)
  }, [isControlled, onOpenChange])

  return (
    <PopoverPrimitive.Root
      open={currentOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  )
}

function PopoverTrigger({
  className,
  ...props
}) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

function PopoverContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Backdrop className="fixed inset-0" />
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-[60]"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "origin-(--transform-origin) rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
