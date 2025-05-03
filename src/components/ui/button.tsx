
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-action-blue text-white hover:bg-action-blue/90",
        destructive:
          "bg-error-red text-white hover:bg-error-red/90",
        outline:
          "border border-action-blue bg-transparent text-action-blue hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-accent-beige text-primary-gray hover:bg-accent-beige/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-action-blue underline-offset-4 hover:underline",
        success: "bg-success-green text-white hover:bg-success-green/90",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 rounded-md px-3 py-2",
        lg: "h-11 rounded-md px-8 py-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
