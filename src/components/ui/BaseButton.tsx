"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "glass";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

export const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-[var(--color-black)] text-white hover:bg-black/90",
            secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
            outline: "border border-zinc-200 bg-transparent hover:bg-zinc-50",
            ghost: "hover:bg-zinc-100 text-zinc-700",
            glass: "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base",
            icon: "p-2",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

BaseButton.displayName = "BaseButton";
