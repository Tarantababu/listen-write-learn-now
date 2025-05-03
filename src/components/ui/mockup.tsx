
import * as React from "react"
import { cn } from "@/lib/utils"

interface MockupProps {
  children?: React.ReactNode
  className?: string
  type?: "browser" | "phone" | "window" | "responsive"
}

export function Mockup({
  children,
  className,
  type = "browser",
  ...props
}: MockupProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative rounded-lg border bg-background/30", className)}
      {...props}
    >
      {type === "browser" && (
        <div className="flex items-center border-b bg-muted/20 px-4 py-2">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="ml-4 h-6 flex-1 rounded-md bg-muted/30" />
        </div>
      )}
      {type === "window" && (
        <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="h-4 w-20 rounded-md bg-muted/30" />
        </div>
      )}
      {type === "phone" && (
        <div className="mx-auto my-6 h-6 w-24 rounded-full bg-muted/30" />
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

interface MockupFrameProps {
  children?: React.ReactNode
  className?: string
  size?: "small" | "medium" | "large" | "full"
}

export function MockupFrame({
  children,
  className,
  size = "medium",
  ...props
}: MockupFrameProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        size === "small" && "max-w-md md:max-w-2xl",
        size === "medium" && "max-w-lg md:max-w-3xl",
        size === "large" && "max-w-xl md:max-w-5xl",
        size === "full" && "max-w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
