
import * as React from "react"
import { cn } from "@/lib/utils"

interface GlowProps {
  className?: string
  variant?: "default" | "top" | "bottom"
}

export function Glow({
  className,
  variant = "default",
  ...props
}: GlowProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "absolute inset-0 -z-10 h-full w-full",
        variant === "default" &&
          "bg-[radial-gradient(80%_60%_at_50%_50%,var(--glow-hsl)_0%,transparent_80%)] opacity-30",
        variant === "top" &&
          "bg-[radial-gradient(80%_40%_at_50%_0%,var(--glow-hsl)_0%,transparent_80%)] opacity-30",
        variant === "bottom" &&
          "bg-[radial-gradient(80%_40%_at_50%_100%,var(--glow-hsl)_0%,transparent_80%)] opacity-30",
        className
      )}
      style={{
        "--glow-hsl": "hsl(var(--primary) / 30%)",
      } as React.CSSProperties}
      {...props}
    />
  )
}
