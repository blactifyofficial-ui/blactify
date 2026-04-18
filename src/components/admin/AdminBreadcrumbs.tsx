"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_NAME_MAP: Record<string, string> = {
    "admin": "Admin",
    "orders": "Orders",
    "products": "Products",
    "drops": "Drops",
    "support": "Support",
    "categories": "Categories",
    "reports": "Reports",
    "settings": "Settings",
    "new": "New",
    "edit": "Edit",
    "inventory": "Inventory",
    "logs": "Logs",
    "audit": "Audit",
    "maintenance": "Maintenance",
    "notifications": "Notifications"
};

/**
 * Higher-level mapping for specific dynamic paths or multi-segment paths
 */
const getLabel = (segment: string, isLast: boolean) => {
    // If it's a UUID/ID (usually long and has numbers/dashes)
    if (segment.length > 20 || (/[0-9]/.test(segment) && segment.includes("-"))) {
        return isLast ? "Details" : "Item";
    }

    const mapped = ROUTE_NAME_MAP[segment.toLowerCase()];
    if (mapped) return mapped;

    // Fallback: Capitalize and remove dashes
    return segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export function AdminBreadcrumbs() {
    const pathname = usePathname();
    
    // Don't show breadcrumbs on login page
    if (pathname === "/admin/login") return null;

    const segments = pathname.split("/").filter(Boolean);
    
    return (
        <nav className="flex items-center space-x-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <Link 
                href="/admin" 
                className="flex items-center gap-1.5 hover:text-black transition-colors transform hover:-translate-y-0.5"
            >
                <Home size={12} className="shrink-0" />
                <span className="hidden sm:inline">Portal</span>
            </Link>

            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const path = `/${segments.slice(0, index + 1).join("/")}`;
                const label = getLabel(segment, isLast);

                // Skip "admin" if it's the first segment and we already have "Portal/Home"
                if (index === 0 && segment.toLowerCase() === "admin") return null;

                return (
                    <div key={path} className="flex items-center space-x-2">
                        <ChevronRight size={10} className="text-zinc-300 shrink-0" />
                        {isLast ? (
                            <span className="text-black font-semibold tracking-tighter text-xs">
                                {label}
                            </span>
                        ) : (
                            <Link 
                                href={path} 
                                className="hover:text-black transition-colors hover:-translate-y-0.5 transform"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
