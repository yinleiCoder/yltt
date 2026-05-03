"use client"

import * as React from "react"
import { useRef, useLayoutEffect, useCallback, createContext, useContext } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import gsap from "gsap"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const DialogCloseContext = createContext(null)

function Dialog({
  onOpenChange,
  ...props
}) {
  const popupRef = useRef(null)
  const overlayRef = useRef(null)
  const onCloseRef = useRef(onOpenChange)
  onCloseRef.current = onOpenChange

  const animateClose = useCallback(() => {
    if (!popupRef.current && !overlayRef.current) {
      onCloseRef.current?.(false)
      return
    }
    const tl = gsap.timeline({
      onComplete: () => onCloseRef.current?.(false),
    })
    if (popupRef.current) {
      tl.to(popupRef.current, { opacity: 0, scale: 0.92, y: 16, duration: 0.2, ease: 'power2.in' }, 0)
    }
    if (overlayRef.current) {
      tl.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0)
    }
  }, [])

  const handleOpenChange = useCallback((open) => {
    if (!open) {
      animateClose()
    } else {
      onCloseRef.current?.(true)
    }
  }, [animateClose])

  return (
    <DialogCloseContext.Provider value={{ popupRef, overlayRef, animateClose }}>
      <DialogPrimitive.Root
        data-slot="dialog"
        onOpenChange={handleOpenChange}
        {...props}
      />
    </DialogCloseContext.Provider>
  )
}

function DialogTrigger({ ...props }) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  const ctx = useContext(DialogCloseContext)
  const popupRef = useRef(null)
  const overlayRef = useRef(null)

  // Register refs for close animation
  useLayoutEffect(() => {
    if (ctx) {
      ctx.popupRef.current = popupRef.current
      ctx.overlayRef.current = overlayRef.current
    }
    return () => {
      if (ctx) {
        ctx.popupRef.current = null
        ctx.overlayRef.current = null
      }
    }
  }, [ctx])

  // Open animation
  useLayoutEffect(() => {
    if (!popupRef.current || !overlayRef.current) return
    gsap.set(overlayRef.current, { opacity: 0 })
    gsap.set(popupRef.current, { opacity: 0, scale: 0.92, y: 16 })
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    gsap.to(popupRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.06 })
  }, [])

  const handleCloseClick = () => {
    ctx?.animateClose()
  }

  return (
    <DialogPortal>
      <DialogPrimitive.Backdrop
        ref={overlayRef}
        data-slot="dialog-overlay"
        className="fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
      />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <Button
            variant="ghost"
            className="absolute top-2 right-2"
            size="icon-sm"
            onClick={handleCloseClick}
            type="button"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}>
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
