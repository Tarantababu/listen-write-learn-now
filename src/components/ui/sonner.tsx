
"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:bg-green-50 group-[.toast]:text-green-800 group-[.toast]:border-green-200 dark:group-[.toast]:bg-green-950/50 dark:group-[.toast]:text-green-300 dark:group-[.toast]:border-green-800/30",
          error: "group-[.toast]:bg-red-50 group-[.toast]:text-red-800 group-[.toast]:border-red-200 dark:group-[.toast]:bg-red-950/50 dark:group-[.toast]:text-red-300 dark:group-[.toast]:border-red-800/30",
          warning: "group-[.toast]:bg-amber-50 group-[.toast]:text-amber-800 group-[.toast]:border-amber-100 dark:group-[.toast]:bg-amber-950/50 dark:group-[.toast]:text-amber-300 dark:group-[.toast]:border-amber-800/30",
          info: "group-[.toast]:bg-blue-50 group-[.toast]:text-blue-800 group-[.toast]:border-blue-100 dark:group-[.toast]:bg-blue-950/50 dark:group-[.toast]:text-blue-300 dark:group-[.toast]:border-blue-800/30",
        },
        duration: 4000
      }}
      {...props}
    />
  );
};

export { Toaster };
