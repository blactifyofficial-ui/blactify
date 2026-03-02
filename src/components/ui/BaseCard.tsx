import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    glass?: boolean;
}

export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
    ({ className, hoverable = true, glass = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-3xl border border-zinc-100 bg-white p-4 transition-all duration-500",
                    hoverable && "hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1",
                    glass && "bg-white/40 backdrop-blur-xl border-white/30",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

BaseCard.displayName = "BaseCard";
