"use client";

import { useAuth } from "@/store/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Terminal,
    ShieldAlert,
    Clock,
    User,
    Hash,
    Search,
    RefreshCcw,
    AlertTriangle,
    CheckCircle2,
    LogOut,
    LogIn
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ALLOWED_EMAIL = "bro.nithin07@gmail.com";

interface LogEntry {
    id: string;
    created_at: string;
    action_type: string;
    details: unknown;
    user_email: string | null;
    severity: string;
}

export default function DeveloperLogsPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.email !== ALLOWED_EMAIL) {
                // Not authorized
                return;
            }
            fetchLogs();
        }
    }, [user, authLoading]);

    async function fetchLogs() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("developer_logs")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || user.email !== ALLOWED_EMAIL) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 animate-pulse">
                    <ShieldAlert size={48} className="text-red-500" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Access Restricted</h1>
                <p className="text-zinc-500 text-sm max-w-md uppercase tracking-widest font-bold italic leading-relaxed mb-12">
                    Unauthorized access. <br /> This dashboard is for authorized developers only.
                </p>

                <div className="w-full max-w-xs space-y-3">
                    {!user ? (
                        <button
                            onClick={handleLogin}
                            className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
                        >
                            <LogIn size={14} />
                            Log In to Console
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-red-600 transition-all active:scale-95 shadow-xl"
                        >
                            <LogOut size={14} />
                            Switch Account
                        </button>
                    )}

                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-zinc-900 text-zinc-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 border border-white/5"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.action_type.toLowerCase().includes(search.toLowerCase()) ||
            (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = filter === "all" || log.severity === filter;
        return matchesSearch && matchesFilter;
    });

    // Activity Stats Calculation
    const stats = {
        total: logs.length,
        errors: logs.filter(l => l.severity === 'error' || l.severity === 'critical').length,
        warnings: logs.filter(l => l.severity === 'warning').length,
        success: logs.filter(l => l.severity === 'success').length,
    };

    // Activity Graph Data (Last 24 Hours)
    const now = new Date();
    const activityData = Array.from({ length: 24 }, (_, i) => {
        const d = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        d.setMinutes(0, 0, 0);
        return { hour: d.getHours(), count: 0, time: d };
    });

    logs.forEach(log => {
        const logDate = new Date(log.created_at);
        const diffMs = now.getTime() - logDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours >= 0 && diffHours < 24) {
            activityData[23 - diffHours].count++;
        }
    });

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-black font-sans selection:bg-[#D4AF37]/20 selection:text-black">
            {/* Minimalist Light Header */}
            <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-12 md:h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black flex items-center justify-center rounded-lg shadow-sm">
                            <Terminal size={14} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-empire tracking-tight uppercase leading-none">System_Activity</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Account</p>
                            <p className="text-[11px] font-bold text-black tracking-tight italic">{user.email}</p>
                        </div>
                        <div className="w-8 h-8 bg-zinc-50 border border-zinc-100 rounded-lg overflow-hidden ring-1 ring-zinc-50 shadow-sm relative">
                            {user.photoURL ? (
                                <Image
                                    src={user.photoURL}
                                    alt="Avatar"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-50" />
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-100 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95 group shadow-sm ml-1"
                            title="Log Out"
                        >
                            <LogOut size={14} className="opacity-40 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-6 sm:space-y-10">
                {/* Stats Summary Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Events", value: stats.total, icon: Hash, color: "text-zinc-400" },
                        { label: "Security/Errors", value: stats.errors, icon: AlertTriangle, color: "text-red-500" },
                        { label: "System Warnings", value: stats.warnings, icon: AlertTriangle, color: "text-[#D4AF37]" },
                        { label: "Successful Ops", value: stats.success, icon: CheckCircle2, color: "text-green-500" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <stat.icon size={14} className={stat.color} />
                                <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold tracking-tighter">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Activity Graph Section */}
                <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1 italic underline decoration-[#D4AF37] decoration-2 underline-offset-4">Recent_Activity</h3>
                            <p className="text-[10px] text-zinc-300 font-medium">System events across the last 24 hours</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Live_Updates</span>
                        </div>
                    </div>

                    <div className="h-[200px] w-full">
                        <Line
                            data={{
                                labels: activityData.map(d => `${d.hour}:00`),
                                datasets: [{
                                    label: 'Events',
                                    data: activityData.map(d => d.count),
                                    borderColor: '#D4AF37',
                                    backgroundColor: 'rgba(212, 175, 55, 0.05)',
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 0,
                                    pointHoverRadius: 6,
                                    pointHoverBackgroundColor: '#D4AF37',
                                    pointHoverBorderColor: '#fff',
                                    pointHoverBorderWidth: 2,
                                    borderWidth: 2,
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: '#000',
                                        titleFont: { size: 10, weight: 'bold' },
                                        bodyFont: { size: 10 },
                                        padding: 10,
                                        cornerRadius: 8,
                                        displayColors: false,
                                        callbacks: {
                                            label: (context) => `${context.parsed.y} events`
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        display: false,
                                        beginAtZero: true,
                                    },
                                    x: {
                                        grid: { display: false },
                                        border: { display: false },
                                        ticks: {
                                            color: '#A1A1AA',
                                            font: { size: 8, weight: 'bold' },
                                            maxRotation: 0,
                                            autoSkip: true,
                                            maxTicksLimit: 6
                                        }
                                    }
                                },
                                interaction: {
                                    intersect: false,
                                    mode: 'index',
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="w-full xl:max-w-lg relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-zinc-100 pl-12 pr-6 py-4 rounded-2xl text-[12px] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 transition-all font-medium placeholder:text-zinc-300 shadow-sm"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="flex p-0.5 bg-zinc-50 border border-zinc-100 rounded-xl overflow-x-auto no-scrollbar">
                            {["all", "info", "warning", "error"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                        filter === f ? "bg-white text-black shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-black"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={fetchLogs}
                            className="ml-auto sm:ml-0 w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-all active:scale-95 group shadow-sm"
                        >
                            <RefreshCcw size={14} className={cn("text-zinc-300 group-hover:text-black transition-all duration-500", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>

                {/* Logs List Section */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-zinc-50 animate-pulse rounded-2xl border border-zinc-100"></div>
                            ))}
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <div key={log.id} className="group bg-white border border-zinc-100 p-6 sm:p-8 rounded-[1.5rem] hover:border-zinc-200 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md">
                                {/* Status Indicator */}
                                <div className={cn(
                                    "absolute top-0 left-0 w-[2px] h-full transition-opacity duration-300",
                                    log.severity === 'error' ? 'bg-red-500' :
                                        log.severity === 'warning' ? 'bg-[#D4AF37]' :
                                            'bg-zinc-100'
                                )}></div>

                                <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between sm:justify-start sm:gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block italic">Action</p>
                                                <h4 className="text-sm sm:text-base font-bold text-black uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">
                                                    {log.action_type.replace(/_/g, ' ')}
                                                </h4>
                                            </div>
                                            <div className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                                                log.severity === 'error' ? 'bg-red-50 text-red-500 border-red-100' :
                                                    log.severity === 'warning' ? 'bg-[#D4AF37]/5 text-[#D4AF37] border-[#D4AF37]/10' :
                                                        'bg-zinc-50 text-zinc-400 border-zinc-100'
                                            )}>
                                                {log.severity}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-medium text-zinc-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={10} className="text-zinc-300" />
                                                <span className="italic">
                                                    {new Date(log.created_at).toLocaleString('en-IN', {
                                                        hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User size={10} className="text-zinc-300" />
                                                <span>{log.user_email || "SYSTEM"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Hash size={10} className="text-zinc-300" />
                                                <span className="font-mono tracking-widest opacity-40">{log.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:max-w-md w-full">
                                        <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 group-hover:bg-white transition-colors">
                                            <pre className="text-[10px] text-zinc-500 font-mono leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto no-scrollbar">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 text-center bg-zinc-50/30 rounded-[2rem] border border-dashed border-zinc-200">
                            <Terminal size={32} className="text-zinc-200 mx-auto mb-4" />
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Status: Idle</h3>
                            <p className="text-[8px] text-zinc-300 font-bold uppercase tracking-widest">No matching records found</p>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 opacity-30 text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                    <p>SYSTEM_STATUS: OPERATIONAL</p>
                    <p>&copy; BLACTIFY_SYSTEMS_{new Date().getFullYear()}</p>
                    <p>VERSION: 2.1.0_PRO</p>
                </div>
            </main>
        </div>
    );
}
