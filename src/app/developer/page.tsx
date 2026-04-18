"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Hash,
    AlertTriangle,
    CheckCircle2,
    Activity,
    ChevronRight,
    Clock,
    Shield,
    Wifi,
    Server,
    Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeveloperLogs, getDeveloperStats, getSystemHealth } from "@/actions/developer";
import { auth } from "@/lib/firebase";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
} from 'chart.js';
import { Line } from "react-chartjs-2";
import { useDevTheme } from "./DevThemeContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface LogEntry {
    id: string;
    created_at: string;
    action_type: string;
    details: Record<string, unknown>;
    user_email: string | null;
    severity: string;
}



export default function DeveloperOverview() {
    const { theme } = useDevTheme();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        totalEvents: { value: number; growth: string };
        errors: { value: number; growth: string };
        warnings: { value: number; growth: string };
        successfulEvents: { value: number; uptime: string };
    } | null>(null);
    const [services, setServices] = useState<{ name: string; status: string; latency: string }[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            const [logsRes, statsRes, healthRes] = await Promise.all([
                getDeveloperLogs(token),
                getDeveloperStats(token),
                getSystemHealth()
            ]);

            if (logsRes.success) setLogs(logsRes.logs as LogEntry[]);
            if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
            if (healthRes.success) setServices(healthRes.services);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const totalEvents = stats?.totalEvents?.value || logs.length;
    const errors = stats?.errors?.value || logs.filter(l => l.severity === "error").length;
    const warnings = stats?.warnings?.value || logs.filter(l => l.severity === "warning").length;
    const successful = stats?.successfulEvents?.value || (totalEvents - errors - warnings);

    // Chart data — activity over time
    const getHourlyData = () => {
        const hours = Array.from({ length: 24 }, (_, i) => {
            const d = new Date();
            d.setHours(d.getHours() - 23 + i, 0, 0, 0);
            return d;
        });

        const counts = hours.map(hour => {
            const nextHour = new Date(hour.getTime() + 3600000);
            return logs.filter(l => {
                const t = new Date(l.created_at);
                return t >= hour && t < nextHour;
            }).length;
        });

        return {
            labels: hours.map(h => h.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })),
            datasets: [{
                data: counts,
                borderColor: theme === "light" ? "#059669" : "#34D399",
                backgroundColor: theme === "light" ? "rgba(5, 150, 105, 0.06)" : "rgba(52, 211, 153, 0.08)",
                fill: true,
                tension: 0.4,
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: theme === "light" ? "#059669" : "#34D399",
            }],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: theme === "light" ? "#FFF" : "#151518", titleColor: theme === "light" ? "#09090B" : "#FFF", bodyColor: theme === "light" ? "#71717A" : "#A1A1AA", borderColor: theme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.06)", borderWidth: 1, padding: 10, titleFont: { size: 11 }, bodyFont: { size: 10 } } },
        scales: {
            x: { grid: { display: false }, ticks: { color: theme === "light" ? "#A1A1AA" : "#3F3F46", font: { size: 9 }, maxTicksLimit: 8 }, border: { display: false } },
            y: { grid: { color: theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)" }, ticks: { display: false }, border: { display: false } },
        },
    };

    const STATS = [
        { label: "Total Events", value: totalEvents, icon: Hash, change: stats?.totalEvents?.growth || "—", color: theme === "light" ? "text-blue-600 bg-blue-50" : "text-blue-400 bg-blue-400/10" },
        { label: "Errors", value: errors, icon: AlertTriangle, change: stats?.errors?.growth || "—", color: theme === "light" ? "text-red-600 bg-red-50" : "text-red-400 bg-red-400/10" },
        { label: "Warnings", value: warnings, icon: AlertTriangle, change: stats?.warnings?.growth || "—", color: theme === "light" ? "text-amber-600 bg-amber-50" : "text-amber-400 bg-amber-400/10" },
        { label: "Successful", value: successful, icon: CheckCircle2, change: stats?.successfulEvents?.uptime || "100% uptime", color: theme === "light" ? "text-emerald-600 bg-emerald-50" : "text-emerald-400 bg-emerald-400/10" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight" style={{ fontSize: '1.5rem', textTransform: 'none', fontFamily: 'inherit', letterSpacing: '-0.025em' }}>
                        Overview
                    </h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">System health and activity at a glance</p>
                </div>
                <div className="flex items-center gap-2 text-[var(--dev-text-dim)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium">Live · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATS.map((stat) => (
                    <div key={stat.label} className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-4 hover:border-[var(--dev-border-hover)] transition-all" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.color)}>
                                <stat.icon size={16} />
                            </div>
                            <span className="text-[10px] text-[var(--dev-text-dim)] font-medium">{stat.change}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dev-text)] tracking-tight">{loading ? "—" : stat.value}</p>
                        <p className="text-[11px] text-[var(--dev-text-dim)] font-medium mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Activity Chart + Service Status */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-3 bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5" style={{ boxShadow: "var(--dev-shadow)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-[14px] font-semibold text-[var(--dev-text)]">Event Activity</h3>
                            <p className="text-[11px] text-[var(--dev-text-dim)] mt-0.5">Last 24 hours</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Activity size={12} className="text-[var(--dev-accent)]" />
                            <span className="text-[11px] text-[var(--dev-text-muted)] font-medium">{totalEvents} events</span>
                        </div>
                    </div>
                    <div className="h-[200px]">
                        {!loading && <Line data={getHourlyData()} options={chartOptions} />}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5" style={{ boxShadow: "var(--dev-shadow)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[14px] font-semibold text-[var(--dev-text)]">Service Status</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--dev-accent-bg)] text-[var(--dev-accent)]">All healthy</span>
                    </div>
                    <div className="space-y-1">
                        {(services.length > 0 ? services : Array.from({ length: 4 }).map(() => null)).map((svc, idx) => (
                            <div key={svc?.name || idx} className="flex items-center gap-3 py-3 border-b border-[var(--dev-border-subtle)] last:border-0">
                                {svc ? (
                                    <>
                                        {(svc.name as string).includes("API") && <Wifi size={14} className="text-[var(--dev-text-dim)]" />}
                                        {(svc.name as string).includes("Database") && <Database size={14} className="text-[var(--dev-text-dim)]" />}
                                        {(svc.name as string).includes("Auth") && <Shield size={14} className="text-[var(--dev-text-dim)]" />}
                                        {(svc.name as string).includes("CDN") && <Server size={14} className="text-[var(--dev-text-dim)]" />}
                                        <span className="flex-1 text-[12px] text-[var(--dev-text-secondary)] font-medium">{svc.name}</span>
                                        <span className="text-[11px] text-[var(--dev-text-dim)] font-mono">{svc.latency}</span>
                                        <div className={cn("w-2 h-2 rounded-full", svc.status === "online" ? "bg-emerald-500" : "bg-red-500")} />
                                    </>
                                ) : (
                                    <div className="h-4 bg-[var(--dev-hover)] rounded animate-pulse w-full" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl overflow-hidden" style={{ boxShadow: "var(--dev-shadow)" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--dev-border)]">
                    <h3 className="text-[14px] font-semibold text-[var(--dev-text)]">Recent Activity</h3>
                    <a href="/developer/audit" className="flex items-center gap-1 text-[11px] font-semibold text-[var(--dev-accent)] hover:underline">
                        View all <ChevronRight size={12} />
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--dev-border-subtle)]">
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Event</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Severity</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider hidden md:table-cell">User</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[var(--dev-border-subtle)]">
                                        <td colSpan={4} className="px-5 py-3.5">
                                            <div className="h-4 bg-[var(--dev-hover)] rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                                : logs.slice(0, 8).map((log) => (
                                    <tr key={log.id} className="border-b border-[var(--dev-border-subtle)] hover:bg-[var(--dev-hover)] transition-colors">
                                        <td className="px-5 py-3.5 text-[12px] text-[var(--dev-text-secondary)] font-mono">{log.action_type.replace(/_/g, " ")}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                                log.severity === "error" ? "bg-red-400/10 text-red-500" : log.severity === "warning" ? "bg-amber-400/10 text-amber-500" : "bg-emerald-400/10 text-emerald-500"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", log.severity === "error" ? "bg-red-500" : log.severity === "warning" ? "bg-amber-500" : "bg-emerald-500")} />
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 hidden md:table-cell text-[12px] text-[var(--dev-text-muted)] truncate max-w-[180px]">{log.user_email || "SYSTEM"}</td>
                                        <td className="px-5 py-3.5 text-[11px] text-[var(--dev-text-dim)] whitespace-nowrap flex items-center gap-1.5">
                                            <Clock size={10} />
                                            {new Date(log.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
