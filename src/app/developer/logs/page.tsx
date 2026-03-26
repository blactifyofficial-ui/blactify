"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

interface LogEntry {
    id: string;
    created_at: string;
    action_type: string;
    details: Record<string, unknown>;
    user_email: string | null;
    severity: string;
}

const LOG_LEVELS = ["All", "Info", "Debug", "Warning", "Error"] as const;

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<(typeof LOG_LEVELS)[number]>("All");
    const [search, setSearch] = useState("");
    const [isStreaming, setIsStreaming] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (isStreaming && containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [logs, isStreaming]);

    const filteredLogs = logs.filter((log) => {
        const matchesLevel = filter === "All" || log.severity.toLowerCase() === filter.toLowerCase();
        const matchesSearch = search === "" ||
            log.action_type.toLowerCase().includes(search.toLowerCase()) ||
            log.id.toLowerCase().includes(search.toLowerCase()) ||
            (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
        return matchesLevel && matchesSearch;
    });

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight" style={{ fontSize: '1.5rem', textTransform: 'none', fontFamily: 'inherit', letterSpacing: '-0.025em' }}>
                        Live Logs
                    </h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">Real-time event stream with filtering</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsStreaming(!isStreaming)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all",
                            isStreaming
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-[var(--dev-card)] text-[var(--dev-text-muted)] border-[var(--dev-border)]"
                        )}
                    >
                        {isStreaming ? <Play size={12} /> : <Pause size={12} />}
                        {isStreaming ? "Live" : "Paused"}
                    </button>
                    <button onClick={fetchLogs} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--dev-card)] border border-[var(--dev-border)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-all" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <RefreshCcw size={14} />
                    </button>
                    <button onClick={exportLogs} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--dev-card)] border border-[var(--dev-border)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-all" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <Download size={14} />
                    </button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dev-text-dimmer)] group-focus-within:text-[var(--dev-text-muted)] transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search by action, trace ID, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[var(--dev-card)] border border-[var(--dev-border)] pl-9 pr-4 py-2.5 rounded-lg text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-border-hover)] transition-all placeholder:text-[var(--dev-text-dimmer)]"
                        style={{ boxShadow: "var(--dev-shadow)" }}
                    />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-lg" style={{ boxShadow: "var(--dev-shadow)" }}>
                    {LOG_LEVELS.map((level) => (
                        <button
                            key={level}
                            onClick={() => setFilter(level)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all",
                                filter === level
                                    ? "bg-[var(--dev-active)] text-[var(--dev-text)]"
                                    : "text-[var(--dev-text-dim)] hover:text-[var(--dev-text-muted)]"
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log Viewer */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl overflow-hidden" style={{ boxShadow: "var(--dev-shadow)" }}>
                {/* Column Headers */}
                <div className="grid grid-cols-[80px_60px_1fr_100px_1fr] gap-2 px-4 py-2.5 border-b border-[var(--dev-border)] text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">
                    <span>Time</span>
                    <span>Level</span>
                    <span>Event</span>
                    <span className="hidden md:block">Trace</span>
                    <span className="hidden lg:block">User</span>
                </div>

                <div ref={containerRef} className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="px-4 py-3 border-b border-[var(--dev-border-subtle)]">
                                <div className="h-4 bg-[var(--dev-hover)] rounded animate-pulse w-full" />
                            </div>
                        ))
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-[var(--dev-text-dim)]">
                            <Search size={20} className="mb-2" />
                            <p className="text-[12px] font-medium">No logs match your filters</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div key={log.id}>
                                <button
                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                    className="w-full grid grid-cols-[80px_60px_1fr_100px_1fr] gap-2 px-4 py-2.5 border-b border-[var(--dev-border-subtle)] hover:bg-[var(--dev-hover)] transition-colors text-left items-center font-mono"
                                >
                                    <span className="text-[11px] text-[var(--dev-text-dim)]">
                                        {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                                    </span>
                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded text-center uppercase", getLevelColor(log.severity))}>
                                        {log.severity === "warning" ? "WARN" : log.severity.slice(0, 5).toUpperCase()}
                                    </span>
                                    <span className="text-[11px] text-[var(--dev-text-secondary)] truncate">{log.action_type.replace(/_/g, " ")}</span>
                                    <span className="text-[10px] text-[var(--dev-text-dimmer)] truncate hidden md:block">{log.id.slice(0, 8)}</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[var(--dev-text-dim)] truncate hidden lg:block">{log.user_email || "—"}</span>
                                        <ChevronDown size={10} className={cn("text-[var(--dev-text-dimmer)] transition-transform", expandedLog === log.id && "rotate-180")} />
                                    </div>
                                </button>

                                {expandedLog === log.id && (
                                    <div className="px-4 py-3 bg-[var(--dev-input)] border-b border-[var(--dev-border)]">
                                        <pre className="text-[11px] text-[var(--dev-text-muted)] font-mono whitespace-pre-wrap leading-relaxed">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--dev-border)] text-[10px] text-[var(--dev-text-dim)]">
                    <span>{filteredLogs.length} / {logs.length} entries</span>
                    <div className="flex items-center gap-3">
                        {isStreaming && <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Streaming — 5s interval</span>}
                        <span className="flex items-center gap-1"><Clock size={10} /> Last refresh: {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
