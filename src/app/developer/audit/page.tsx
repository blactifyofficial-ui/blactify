"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ClipboardList,
    Search,
    Download,
    Clock,
    Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeveloperLogs } from "@/actions/developer";
import { auth } from "@/lib/firebase";
import { DevPagination } from "../components/Pagination";

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
    "category_add", "category_edit", "admin_login", "purchase_toggle", "report_export", "update_bypass_ips"
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
        const matchesSearch = search === "" || 
            log.action_type.toLowerCase().includes(search.toLowerCase()) || 
            log.id.toLowerCase().includes(search.toLowerCase()) || 
            (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
        const matchesAction = actionFilter === "All" || log.action_type === actionFilter;
        const logDate = new Date(log.created_at);
        const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");
        return matchesSearch && matchesAction && matchesDateFrom && matchesDateTo;
    });

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight">Audit Trail</h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">Immutable ledger of all administrative actions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all", showFilters ? "bg-[var(--dev-active)] text-[var(--dev-text)] border-[var(--dev-border-hover)]" : "bg-[var(--dev-card)] text-[var(--dev-text-muted)] border-[var(--dev-border)]")}>
                        <Filter size={14} /> Filters
                    </button>
                    <button onClick={exportCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border border-[var(--dev-border)] bg-[var(--dev-card)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text-secondary)] hover:bg-[var(--dev-hover)] transition-all">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 shadow-sm">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">Action Type</label>
                        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)]">
                            {ACTION_TYPES.map(t => <option key={t} value={t}>{t === "All" ? "All Actions" : t.replace(/_/g, " ")}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">From Date</label>
                        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)]" />
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">To Date</label>
                        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)]" />
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dev-text-dimmer)]" size={14} />
                <input type="text" placeholder="Search by User ID, action type..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full bg-[var(--dev-card)] border border-[var(--dev-border)] pl-9 pr-4 py-2.5 rounded-lg text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-all" />
            </div>

            {/* Audit Table Container */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
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
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[var(--dev-border-subtle)]">
                                        <td colSpan={5} className="px-5 py-4"><div className="h-4 bg-[var(--dev-hover)] rounded animate-pulse" /></td>
                                    </tr>
                                ))
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center">
                                        <ClipboardList size={24} className="text-[var(--dev-text-dimmer)] mx-auto mb-3" />
                                        <p className="text-[13px] text-[var(--dev-text-dim)] font-medium">No audit entries found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => {
                                    const ipAddress = (log.details as Record<string, unknown>)?.ip_address as string || "—";
                                    return (
                                        <tr key={log.id} className="border-b border-[var(--dev-border-subtle)] hover:bg-[var(--dev-hover)] transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={11} className="text-[var(--dev-text-dimmer)] flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] text-[var(--dev-text-secondary)] whitespace-nowrap">{new Date(log.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                                                        <p className="text-[10px] text-[var(--dev-text-dim)]">{new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={cn("inline-flex text-[10px] font-semibold px-2 px-1.5 rounded", getActionColor(log.action_type))}>
                                                    {log.action_type.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-[11px] text-[var(--dev-text-muted)] truncate block max-w-[120px]">{log.user_email || "SYSTEM"}</span>
                                            </td>
                                            <td className="px-5 py-4 hidden md:table-cell">
                                                <span className="text-[11px] text-[var(--dev-text-dim)] font-mono">{ipAddress}</span>
                                            </td>
                                            <td className="px-5 py-4 hidden lg:table-cell text-right">
                                                <span className="text-[9px] text-[var(--dev-text-dimmer)] font-mono">{log.id.slice(0, 8)}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <DevPagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredLogs.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
