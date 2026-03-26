"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ClipboardList,
    Search,
    Download,
    User,
    Clock,
    Globe,
    Filter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeveloperLogs } from "@/actions/developer";
import { auth } from "@/lib/firebase";

interface AuditEntry {
    id: string;
    created_at: string;
    action_type: string;
    details: Record<string, unknown>;
    user_email: string | null;
    severity: string;
}

const ACTION_TYPES = [
    "All", "user_registration", "product_add", "product_edit", "product_delete",
    "category_add", "category_edit", "admin_login", "purchase_toggle", "report_export",
];

const ITEMS_PER_PAGE = 15;

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchLogs = useCallback(async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;
            const result = await getDeveloperLogs(token);
            if (result.success) setLogs(result.logs as AuditEntry[]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const filteredLogs = logs.filter((log) => {
        const matchesSearch = search === "" || log.action_type.toLowerCase().includes(search.toLowerCase()) || log.id.toLowerCase().includes(search.toLowerCase()) || (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
        const matchesAction = actionFilter === "All" || log.action_type === actionFilter;
        const logDate = new Date(log.created_at);
        const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");
        return matchesSearch && matchesAction && matchesDateFrom && matchesDateTo;
    });

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const exportCSV = () => {
        const headers = "ID,Timestamp,Action,User,Severity,Details";
        const rows = filteredLogs.map(l => `"${l.id}","${l.created_at}","${l.action_type}","${l.user_email || "SYSTEM"}","${l.severity}","${JSON.stringify(l.details).replace(/"/g, '""')}"`);
        const csv = [headers, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    };

    const getActionColor = (action: string) => {
        if (action.includes("delete")) return "text-red-500 bg-red-500/10";
        if (action.includes("add") || action.includes("registration")) return "text-emerald-500 bg-emerald-500/10";
        if (action.includes("edit") || action.includes("toggle")) return "text-amber-500 bg-amber-500/10";
        if (action.includes("login")) return "text-blue-500 bg-blue-500/10";
        return "text-[var(--dev-text-muted)] bg-[var(--dev-hover)]";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight" style={{ fontSize: '1.5rem', textTransform: 'none', fontFamily: 'inherit', letterSpacing: '-0.025em' }}>Audit Trail</h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">Immutable ledger of all administrative actions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all", showFilters ? "bg-[var(--dev-active)] text-[var(--dev-text)] border-[var(--dev-border-hover)]" : "bg-[var(--dev-card)] text-[var(--dev-text-muted)] border-[var(--dev-border)]")} style={{ boxShadow: "var(--dev-shadow)" }}>
                        <Filter size={14} /> Filters
                    </button>
                    <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border border-[var(--dev-border)] bg-[var(--dev-card)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text-secondary)] hover:bg-[var(--dev-hover)] transition-all" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ boxShadow: "var(--dev-shadow)" }}>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">Action Type</label>
                        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors">
                            {ACTION_TYPES.map(t => <option key={t} value={t}>{t === "All" ? "All Actions" : t.replace(/_/g, " ")}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">From Date</label>
                        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">To Date</label>
                        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors" />
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dev-text-dimmer)] group-focus-within:text-[var(--dev-text-muted)] transition-colors" size={14} />
                <input type="text" placeholder="Search by User ID, action type, or IP address..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-card)] border border-[var(--dev-border)] pl-9 pr-4 py-2.5 rounded-lg text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-border-hover)] transition-all placeholder:text-[var(--dev-text-dimmer)]" style={{ boxShadow: "var(--dev-shadow)" }} />
            </div>

            {/* Audit Table */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl overflow-hidden" style={{ boxShadow: "var(--dev-shadow)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--dev-border)]">
                                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Timestamp</th>
                                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Action</th>
                                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">User ID</th>
                                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider hidden md:table-cell">IP Address</th>
                                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider hidden lg:table-cell">Trace</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[var(--dev-border-subtle)]">
                                        <td colSpan={5} className="px-5 py-3.5"><div className="h-4 bg-[var(--dev-hover)] rounded animate-pulse" /></td>
                                    </tr>
                                ))
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center">
                                        <ClipboardList size={24} className="text-[var(--dev-text-dimmer)] mx-auto mb-3" />
                                        <p className="text-[13px] text-[var(--dev-text-dim)] font-medium">No matching audit entries</p>
                                        <p className="text-[11px] text-[var(--dev-text-dimmer)] mt-1">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => {
                                    const ipAddress = (log.details as Record<string, unknown>)?.ip_address as string || "—";
                                    return (
                                        <tr key={log.id} className="border-b border-[var(--dev-border-subtle)] hover:bg-[var(--dev-hover)] transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={11} className="text-[var(--dev-text-dimmer)] flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[12px] text-[var(--dev-text-secondary)]">{new Date(log.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                                        <p className="text-[10px] text-[var(--dev-text-dim)]">{new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn("inline-flex text-[10px] font-semibold px-2.5 py-1 rounded-md", getActionColor(log.action_type))}>{log.action_type.replace(/_/g, " ")}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <User size={11} className="text-[var(--dev-text-dimmer)]" />
                                                    <span className="text-[12px] text-[var(--dev-text-muted)]">{log.user_email || "SYSTEM"}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Globe size={11} className="text-[var(--dev-text-dimmer)]" />
                                                    <span className="text-[11px] text-[var(--dev-text-dim)] font-mono">{ipAddress}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 hidden lg:table-cell">
                                                <span className="text-[11px] text-[var(--dev-text-dimmer)] font-mono">{log.id.slice(0, 12)}...</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--dev-border)]">
                        <p className="text-[11px] text-[var(--dev-text-dim)]">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}</p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--dev-hover)] text-[var(--dev-text-dim)] disabled:opacity-30 transition-all"><ChevronLeft size={14} /></button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;
                                return (
                                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={cn("w-8 h-8 flex items-center justify-center rounded-md text-[11px] font-semibold transition-all", currentPage === pageNum ? "bg-[var(--dev-active)] text-[var(--dev-text)]" : "text-[var(--dev-text-dim)] hover:text-[var(--dev-text-secondary)]")}>{pageNum}</button>
                                );
                            })}
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--dev-hover)] text-[var(--dev-text-dim)] disabled:opacity-30 transition-all"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
