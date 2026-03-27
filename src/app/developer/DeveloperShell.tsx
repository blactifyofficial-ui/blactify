"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
    Terminal,
    Bell,
    ScrollText,
    Webhook,
    ClipboardList,
    LogOut,
    ShieldAlert,
    Wrench,
    Command,
    Sun,
    Moon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { DevThemeContext, useDevTheme, THEME_VARS, type DevTheme } from "./DevThemeContext";

import { DeveloperGuard } from "@/components/developer/DeveloperGuard";

const ALLOWED_EMAIL = "bro.nithin07@gmail.com";

const NAV_ITEMS = [
    { label: "Overview", href: "/developer", icon: Terminal, shortcut: "1" },
    { label: "Maintenance", href: "/developer/maintenance", icon: Wrench, shortcut: "2" },
    { label: "Notifications", href: "/developer/notifications", icon: Bell, shortcut: "3" },
    { label: "Live Logs", href: "/developer/logs", icon: ScrollText, shortcut: "4" },
    { label: "Webhooks", href: "/developer/webhooks", icon: Webhook, shortcut: "5" },
    { label: "Audit Trail", href: "/developer/audit", icon: ClipboardList, shortcut: "6" },
];

function DeveloperSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useDevTheme();

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-[280px] flex flex-col transition-transform duration-300 md:translate-x-0",
                    "bg-[var(--dev-sidebar)] border-r border-[var(--dev-border)]",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center px-5 border-b border-[var(--dev-border)]">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shadow-lg",
                            theme === "light"
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
                                : "bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-emerald-500/20"
                        )}>
                            <Command size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-[var(--dev-text)] tracking-tight">Mission Control</p>
                            <p className="text-[10px] text-[var(--dev-text-dim)] font-medium">Developer Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group",
                                    isActive ? "bg-[var(--dev-active)] text-[var(--dev-text)]" : "text-[var(--dev-text-muted)] hover:bg-[var(--dev-hover)]"
                                )}
                            >
                                <item.icon size={16} className={isActive ? "text-[var(--dev-accent)]" : "text-[var(--dev-text-dim)]"} />
                                <span className="flex-1">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-4 py-3 border-t border-[var(--dev-border)] space-y-3">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--dev-hover)] transition-all"
                    >
                        {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
                        <span className="text-[13px] flex-1 text-left">{theme === "light" ? "Light" : "Dark"}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-[var(--dev-text-dim)]">Systems Operational</span>
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-[var(--dev-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--dev-hover)] flex items-center justify-center text-[10px]">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium truncate">{user?.email}</p>
                        </div>
                        <button onClick={() => signOut()} className="p-1.5 hover:bg-[var(--dev-hover)] rounded-md">
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

function DeveloperMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const pathname = usePathname();
    const currentPage = NAV_ITEMS.find(item => item.href === pathname);

    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[var(--dev-sidebar)] border-b border-[var(--dev-border)] flex items-center px-4 gap-3">
            <button onClick={onMenuClick} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--dev-hover)] transition-colors">
                <Terminal size={16} />
            </button>
            <span className="text-[13px] font-medium">{currentPage?.label || "Overview"}</span>
        </header>
    );
}

export function DeveloperShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<DevTheme>("light");

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === "light" ? "dark" : "light";
            localStorage.setItem("dev-theme", next);
            return next;
        });
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("dev-theme") as DevTheme | null;
        if (saved === "light" || saved === "dark") setTheme(saved);
    }, []);

    const themeVars = THEME_VARS[theme];

    // Exempt login page from the guarded layout to prevent redirect loops
    // Supports both dev.blactify.com/login and blactify.com/developer/login
    if (pathname === "/login" || pathname === "/developer/login") {
        return <>{children}</>;
    }

    return (
        <DeveloperGuard>
            <DevThemeContext.Provider value={{ theme, toggleTheme }}>
                <div
                    className="min-h-screen text-[var(--dev-text)]"
                    style={{
                        backgroundColor: "var(--dev-bg)",
                        ...themeVars as React.CSSProperties,
                    }}
                >
                    <DeveloperSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <DeveloperMobileHeader onMenuClick={() => setSidebarOpen(true)} />
                    <div className="md:pl-[280px] min-h-screen flex flex-col">
                        <main className="flex-1 p-5 pt-[72px] md:pt-8 w-full max-w-[1600px] mx-auto">
                            {children}
                        </main>
                    </div>
                </div>
            </DevThemeContext.Provider>
        </DeveloperGuard>
    );
}
