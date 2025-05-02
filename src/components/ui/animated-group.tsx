
import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variants?: any;
  delay?: number;
  children: React.ReactNode;
}

export function AnimatedGroup({
  variants,
  className,
  children,
  delay,
  ...props
}: AnimatedGroupProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}
