"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider } from "@/store/AuthContext";
import {
    Terminal,
    Bell,
    ScrollText,
    Webhook,
    ClipboardList,
    ChevronRight,
    LogOut,
    LogIn,
    ShieldAlert,
    Wrench,
    Command,
    Sun,
    Moon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ALLOWED_EMAIL = "bro.nithin07@gmail.com";

// ── Theme Context ──────────────────────────────────────────────
type DevTheme = "light" | "dark";

interface DevThemeContextType {
    theme: DevTheme;
    toggleTheme: () => void;
}

const DevThemeContext = createContext<DevThemeContextType>({
    theme: "light",
    toggleTheme: () => {},
});

export const useDevTheme = () => useContext(DevThemeContext);

// CSS variable definitions for each theme
const THEME_VARS: Record<DevTheme, Record<string, string>> = {
    light: {
        "--dev-bg": "#F8F8FA",
        "--dev-card": "#FFFFFF",
        "--dev-card-hover": "#F4F4F5",
        "--dev-input": "#F4F4F5",
        "--dev-sidebar": "#FFFFFF",
        "--dev-terminal": "#F9FAFB",
        "--dev-border": "rgba(0, 0, 0, 0.08)",
        "--dev-border-strong": "rgba(0, 0, 0, 0.12)",
        "--dev-border-subtle": "rgba(0, 0, 0, 0.04)",
        "--dev-border-hover": "rgba(0, 0, 0, 0.16)",
        "--dev-text": "#09090B",
        "--dev-text-secondary": "#3F3F46",
        "--dev-text-muted": "#71717A",
        "--dev-text-dim": "#A1A1AA",
        "--dev-text-dimmer": "#D4D4D8",
        "--dev-hover": "rgba(0, 0, 0, 0.04)",
        "--dev-active": "rgba(0, 0, 0, 0.08)",
        "--dev-accent": "#059669",
        "--dev-accent-bg": "rgba(5, 150, 105, 0.08)",
        "--dev-shadow": "0 1px 3px rgba(0,0,0,0.08)",
    },
    dark: {
        "--dev-bg": "#0E0E10",
        "--dev-card": "#151518",
        "--dev-card-hover": "#1A1A1E",
        "--dev-input": "#0E0E10",
        "--dev-sidebar": "#0A0A0B",
        "--dev-terminal": "#0C0C0E",
        "--dev-border": "rgba(255, 255, 255, 0.06)",
        "--dev-border-strong": "rgba(255, 255, 255, 0.08)",
        "--dev-border-subtle": "rgba(255, 255, 255, 0.04)",
        "--dev-border-hover": "rgba(255, 255, 255, 0.12)",
        "--dev-text": "#FAFAFA",
        "--dev-text-secondary": "#A1A1AA",
        "--dev-text-muted": "#71717A",
        "--dev-text-dim": "#52525B",
        "--dev-text-dimmer": "#3F3F46",
        "--dev-hover": "rgba(255, 255, 255, 0.04)",
        "--dev-active": "rgba(255, 255, 255, 0.08)",
        "--dev-accent": "#34D399",
        "--dev-accent-bg": "rgba(52, 211, 153, 0.10)",
        "--dev-shadow": "none",
    },
};

// ── Navigation ─────────────────────────────────────────────────
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
    const router = useRouter();
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
                {/* Brand Header */}
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
                            <p className="text-[10px] text-[var(--dev-text-dim)] font-medium">Developer Portal v3.0</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-widest px-3 mb-3">Navigation</p>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                                    isActive
                                        ? "bg-[var(--dev-active)] text-[var(--dev-text)]"
                                        : "text-[var(--dev-text-muted)] hover:text-[var(--dev-text-secondary)] hover:bg-[var(--dev-hover)]"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[var(--dev-accent)] rounded-r-full" />
                                )}
                                <item.icon size={16} className={cn(isActive ? "text-[var(--dev-accent)]" : "text-[var(--dev-text-dim)] group-hover:text-[var(--dev-text-muted)]")} />
                                <span className="flex-1">{item.label}</span>
                                <kbd className="hidden md:inline-flex text-[9px] text-[var(--dev-text-dimmer)] bg-[var(--dev-hover)] border border-[var(--dev-border)] rounded px-1.5 py-0.5 font-mono">
                                    {item.shortcut}
                                </kbd>
                            </Link>
                        );
                    })}
                </nav>

                {/* Theme Toggle + System Status */}
                <div className="px-4 py-3 border-t border-[var(--dev-border)] space-y-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[var(--dev-text-muted)] hover:text-[var(--dev-text-secondary)] hover:bg-[var(--dev-hover)] transition-all group"
                    >
                        {theme === "light" ? (
                            <Sun size={16} className="text-amber-500 group-hover:text-amber-400 transition-colors" />
                        ) : (
                            <Moon size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                        )}
                        <span className="flex-1 text-left">{theme === "light" ? "Day Mode" : "Night Mode"}</span>
                        <div className={cn(
                            "relative w-[36px] h-[20px] rounded-full transition-all duration-300",
                            theme === "light" ? "bg-amber-400" : "bg-indigo-500"
                        )}>
                            <div className={cn(
                                "absolute top-[2px] w-[16px] h-[16px] bg-white rounded-full shadow transition-all duration-300",
                                theme === "dark" ? "left-[18px]" : "left-[2px]"
                            )} />
                        </div>
                    </button>

                    {/* System Status */}
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-[var(--dev-text-dim)] font-medium">All systems operational</span>
                    </div>
                </div>

                {/* User Section */}
                <div className="px-4 py-3 border-t border-[var(--dev-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[var(--dev-border)] relative flex-shrink-0 bg-[var(--dev-hover)]">
                            {user?.photoURL ? (
                                <Image src={user.photoURL} alt="Avatar" fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--dev-text-muted)] font-bold">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-[var(--dev-text-secondary)] font-medium truncate">{user?.email}</p>
                            <p className="text-[10px] text-[var(--dev-text-dim)] font-medium">Developer</p>
                        </div>
                        <button
                            onClick={async () => { await signOut(); router.push("/"); }}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--dev-hover)] text-[var(--dev-text-dim)] hover:text-red-400 transition-all"
                            title="Sign out"
                        >
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
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[var(--dev-sidebar)] backdrop-blur-xl border-b border-[var(--dev-border)] flex items-center px-4 gap-3">
            <button
                onClick={onMenuClick}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--dev-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-colors"
            >
                <Terminal size={16} />
            </button>
            <div className="flex items-center gap-2 text-[var(--dev-text-muted)] text-[13px]">
                <span className="text-[var(--dev-text-dim)]">dev</span>
                <ChevronRight size={12} className="text-[var(--dev-text-dimmer)]" />
                <span className="text-[var(--dev-text)] font-medium">{currentPage?.label || "Overview"}</span>
            </div>
        </header>
    );
}

function DeveloperShell({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<DevTheme>("light");

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === "light" ? "dark" : "light";
            localStorage.setItem("dev-theme", next);
            return next;
        });
    }, []);

    // Restore saved theme preference
    useEffect(() => {
        const saved = localStorage.getItem("dev-theme") as DevTheme | null;
        if (saved === "light" || saved === "dark") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(saved);
        }
    }, []);

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        const num = parseInt(e.key);
        if (num >= 1 && num <= NAV_ITEMS.length) {
            router.push(NAV_ITEMS[num - 1].href);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
        }
    }, [router]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#F8F8FA] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[11px] text-zinc-400 font-medium tracking-widest uppercase">Initializing</p>
                </div>
            </div>
        );
    }

    if (!user || user.email !== ALLOWED_EMAIL) {
        return (
            <div className="min-h-screen bg-[#F8F8FA] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-8 border border-red-100">
                    <ShieldAlert size={36} className="text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2" style={{ textTransform: 'none', fontFamily: 'inherit', letterSpacing: '-0.025em', fontSize: '1.875rem' }}>Access Restricted</h1>
                <p className="text-zinc-500 text-sm max-w-sm mb-8 leading-relaxed">
                    This portal is reserved for authorized developers. Please authenticate with a valid developer account.
                </p>
                <div className="w-full max-w-xs space-y-3">
                    {!user ? (
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                            className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98]"
                        >
                            <LogIn size={14} />
                            Sign In
                        </button>
                    ) : (
                        <button
                            onClick={async () => { await signOut(); router.push("/"); }}
                            className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-[0.98] border border-red-100"
                        >
                            <LogOut size={14} />
                            Switch Account
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-zinc-100 text-zinc-600 py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all border border-zinc-200"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    const themeVars = THEME_VARS[theme];

    return (
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

                <div className="md:pl-[280px] min-h-screen">
                    <main className="p-4 md:p-8 pt-[72px] md:pt-8 max-w-[1400px] mx-auto">
                        {children}
                    </main>
                </div>
            </div>
        </DevThemeContext.Provider>
    );
}

export default function DeveloperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <DeveloperShell>{children}</DeveloperShell>
        </AuthProvider>
    );
}
