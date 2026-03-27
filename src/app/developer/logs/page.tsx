"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search,
    Download,
    Pause,
    Play,
    ChevronDown,
    RefreshCcw,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeveloperLogs } from "@/actions/developer";
import { auth } from "@/lib/firebase";
import { DevPagination } from "../components/Pagination";

interface LogEntry {
    id: string;
    created_at: string;
    action_type: string;
    details: Record<string, unknown>;
    user_email: string | null;
    severity: string;
}

const LOG_LEVELS = ["All", "Info", "Debug", "Warning", "Error"] as const;
const LOGS_PER_PAGE = 20;

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<(typeof LOG_LEVELS)[number]>("All");
    const [search, setSearch] = useState("");
    const [isStreaming, setIsStreaming] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [currentPage, setCurrentPage] = useState(1);

    const fetchLogs = useCallback(async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;
            const result = await getDeveloperLogs(token);
            if (result.success) {
                setLogs(result.logs as LogEntry[]);
                setLastRefresh(new Date());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        if (!isStreaming) return;
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [isStreaming, fetchLogs]);

    const filteredLogs = logs.filter((log) => {
        const matchesLevel = filter === "All" || log.severity.toLowerCase() === filter.toLowerCase();
        const matchesSearch = search === "" ||
            log.action_type.toLowerCase().includes(search.toLowerCase()) ||
            log.id.toLowerCase().includes(search.toLowerCase()) ||
            (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
        return matchesLevel && matchesSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

    const exportLogs = () => {
        const data = JSON.stringify(filteredLogs, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `logs-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getLevelColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "error": return "text-red-500 bg-red-500/10";
            case "warning": return "text-amber-500 bg-amber-500/10";
            case "debug": return "text-purple-500 bg-purple-500/10";
            default: return "text-blue-500 bg-blue-500/10";
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight">Live Logs</h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">Real-time event stream with professional pagination</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsStreaming(!isStreaming)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all",
                            isStreaming ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-[var(--dev-card)] text-[var(--dev-text-muted)] border-[var(--dev-border)]"
                        )}
                    >
                        {isStreaming ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                        {isStreaming ? "Live" : "Paused"}
                    </button>
                    <button onClick={fetchLogs} className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--dev-card)] border border-[var(--dev-border)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-all">
                        <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
                    </button>
                    <button onClick={exportLogs} className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--dev-card)] border border-[var(--dev-border)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-all">
                        <Download size={14} />
                    </button>
                </div>
            </div>

            {/* Search + Levels (Responsive stack) */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dev-text-dimmer)]" size={14} />
                    <input
                        type="text"
                        placeholder="Search action type, email, trace ID..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[var(--dev-card)] border border-[var(--dev-border)] pl-9 pr-4 py-2.5 rounded-lg text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)]"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-lg overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {LOG_LEVELS.map((level) => (
                        <button
                            key={level}
                            onClick={() => { setFilter(level); setCurrentPage(1); }}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all",
                                filter === level ? "bg-[var(--dev-active)] text-[var(--dev-text)]" : "text-[var(--dev-text-dim)] hover:text-[var(--dev-text-muted)]"
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log Viewer with table-like structure */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-[85px_65px_1fr_40px] px-4 py-2.5 border-b border-[var(--dev-border)] text-[10px] font-bold text-[var(--dev-text-dim)] uppercase tracking-widest">
                    <span>Timestamp</span>
                    <span>Level</span>
                    <span>Action Type</span>
                    <span className="text-right sr-only md:not-sr-only md:block">Expand</span>
                </div>

                <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
                    {loading && filteredLogs.length === 0 ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="px-4 py-3 border-b border-[var(--dev-border-subtle)]">
                                <div className="h-4 bg-[var(--dev-hover)] rounded animate-pulse w-full" />
                            </div>
                        ))
                    ) : paginatedLogs.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-[var(--dev-text-dim)]">
                            <Clock size={24} className="mb-2 opacity-20" />
                            <p className="text-[12px] font-medium">No system logs available</p>
                        </div>
                    ) : (
                        paginatedLogs.map((log) => (
                            <div key={log.id} className="group">
                                <button
                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                    className={cn(
                                        "w-full grid grid-cols-[85px_65px_1fr_40px] gap-2 px-4 py-3 border-b border-[var(--dev-border-subtle)] hover:bg-[var(--dev-hover)] transition-all text-left items-center font-mono",
                                        expandedLog === log.id && "bg-[var(--dev-hover)]"
                                    )}
                                >
                                    <span className="text-[11px] text-[var(--dev-text-dim)]">
                                        {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                                    </span>
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded text-center whitespace-nowrap", getLevelColor(log.severity))}>
                                        {log.severity.slice(0, 5).toUpperCase()}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-[var(--dev-text-secondary)] font-semibold truncate uppercase tracking-tight">{log.action_type.replace(/_/g, " ")}</p>
                                        <p className="text-[9px] text-[var(--dev-text-dimmer)] truncate md:hidden">Trace: {log.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="flex justify-end pr-1">
                                        <ChevronDown size={12} className={cn("text-[var(--dev-text-dimmer)] transition-transform duration-300", expandedLog === log.id && "rotate-180")} />
                                    </div>
                                </button>

                                {expandedLog === log.id && (
                                    <div className="px-4 py-4 bg-[var(--dev-terminal)] border-b border-[var(--dev-border)] overflow-x-auto">
                                        <div className="flex flex-col gap-4">
                                            <div className="grid grid-cols-2 gap-4 text-[10px] border-b border-[var(--dev-border-subtle)] pb-4">
                                                <div>
                                                    <p className="text-[var(--dev-text-dim)] font-bold mb-1 uppercase tracking-wider">Trace ID</p>
                                                    <p className="text-[var(--dev-text-muted)] font-mono">{log.id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[var(--dev-text-dim)] font-bold mb-1 uppercase tracking-wider">Initiator</p>
                                                    <p className="text-[var(--dev-text-muted)] font-mono">{log.user_email || "System / Automated"}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[var(--dev-text-dim)] font-bold mb-2 uppercase tracking-wider text-[10px]">Payload Details</p>
                                                <pre className="text-[11px] text-[var(--dev-text-secondary)] font-mono bg-black/5 dark:bg-black/20 p-3 rounded-lg border border-[var(--dev-border-subtle)] whitespace-pre-wrap leading-relaxed">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-0 border-t border-[var(--dev-border)]">
                    <DevPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredLogs.length}
                        itemsPerPage={LOGS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between text-[10px] text-[var(--dev-text-dim)] font-medium px-1">
                <div className="flex items-center gap-3">
                    {isStreaming && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Stream Active</span>}
                    <span>Refresh frequency: 5s</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[var(--dev-text-dimmer)]">
                    <Clock size={10} /> Sync: {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
            </div>
        </div>
    );
}
