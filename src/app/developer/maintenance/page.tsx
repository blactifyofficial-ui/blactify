"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Power,
    Globe,
    Plus,
    X,
    Wrench,
    CheckCircle2,
    Loader2,
    MonitorIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { getMaintenanceStatus, toggleMaintenanceMode, updateBypassIPs } from "@/app/actions/settings";
import { getClientIP } from "@/actions/get-client-ip";

interface BypassIP {
    ip: string;
    label: string;
    addedAt: string;
}

export default function MaintenancePage() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [loading, setLoading] = useState(true);

    const [publicMessage, setPublicMessage] = useState("We're performing scheduled maintenance. We'll be back shortly.");
    const [savedMessage, setSavedMessage] = useState("");

    const [bypassIPs, setBypassIPs] = useState<BypassIP[]>([]);
    const [newIP, setNewIP] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [currentClientIP, setCurrentClientIP] = useState("");

    // Fetch current maintenance status from DB
    const fetchStatus = useCallback(async () => {
        try {
            const [status, clientIp] = await Promise.all([
                getMaintenanceStatus(),
                getClientIP()
            ]);
            
            setMaintenanceMode(status.maintenance_mode);
            setCurrentClientIP(clientIp);
            
            if (status.maintenance_message) {
                setPublicMessage(status.maintenance_message);
                setSavedMessage(status.maintenance_message);
            }

            if (status.bypass_ips) {
                const formatted = (status.bypass_ips as string[]).map(ip => ({
                    ip,
                    label: ip === clientIp ? "Your IP" : "Whitelist",
                    addedAt: new Date().toISOString()
                }));
                setBypassIPs(formatted);
            }
        } catch (e) {
            console.error("Failed to fetch maintenance status:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const handleToggle = async () => {
        if (!maintenanceMode) {
            setShowConfirm(true);
        } else {
            setIsToggling(true);
            try {
                const token = await auth.currentUser?.getIdToken();
                const result = await toggleMaintenanceMode(false, publicMessage, token);
                if (result.success) {
                    setMaintenanceMode(false);
                    showSyncFeedback();
                }
            } catch (e) {
                console.error("Failed to disable maintenance:", e);
            } finally {
                setIsToggling(false);
            }
        }
    };

    const confirmEnable = async () => {
        setIsToggling(true);
        setShowConfirm(false);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await toggleMaintenanceMode(true, publicMessage, token);
            if (result.success) {
                setMaintenanceMode(true);
                setSavedMessage(publicMessage);
                showSyncFeedback();
            }
        } catch (e) {
            console.error("Failed to enable maintenance:", e);
        } finally {
            setIsToggling(false);
        }
    };

    const saveMessage = async () => {
        if (publicMessage === savedMessage) return;
        setIsToggling(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await toggleMaintenanceMode(maintenanceMode, publicMessage, token);
            if (result.success) {
                setSavedMessage(publicMessage);
                showSyncFeedback();
            }
        } catch (e) {
            console.error("Failed to save message:", e);
        } finally {
            setIsToggling(false);
        }
    };

    const showSyncFeedback = () => {
        setIsSynced(true);
        setTimeout(() => setIsSynced(false), 2500);
    };

    const addIP = async (ipToUse?: string) => {
        const ip = (typeof ipToUse === 'string' ? ipToUse : newIP).trim();
        if (!ip) return;
        
        const newIps = [...bypassIPs.map(b => b.ip), ip];
        const uniqueIps = Array.from(new Set(newIps));
        
        setIsToggling(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await updateBypassIPs(uniqueIps, token);
            if (result.success) {
                setBypassIPs(prev => [...prev.filter(b => b.ip !== ip), { 
                    ip, 
                    label: typeof ipToUse === 'string' ? "Current Device" : (newLabel.trim() || "Manual"), 
                    addedAt: new Date().toISOString() 
                }]);
                setNewIP("");
                setNewLabel("");
                showSyncFeedback();
            }
        } catch (e) {
            console.error("Failed to add IP:", e);
        } finally {
            setIsToggling(false);
        }
    };

    const removeIP = async (ip: string) => {
        const uniqueIps = bypassIPs.filter(b => b.ip !== ip).map(b => b.ip);
        
        setIsToggling(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await updateBypassIPs(uniqueIps, token);
            if (result.success) {
                setBypassIPs(bypassIPs.filter(b => b.ip !== ip));
                showSyncFeedback();
            }
        } catch (e) {
            console.error("Failed to remove IP:", e);
        } finally {
            setIsToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={24} className="text-[var(--dev-text-dim)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight" style={{ fontSize: '1.5rem', textTransform: 'none', fontFamily: 'inherit', letterSpacing: '-0.025em' }}>
                        System Maintenance
                    </h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">Control site availability and schedule planned downtime</p>
                </div>
                {/* Sync indicator */}
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-500",
                    isSynced
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : isToggling
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-[var(--dev-card)] text-[var(--dev-text-dim)] border border-[var(--dev-border)]"
                )}>
                    {isSynced ? (
                        <><CheckCircle2 size={10} /> Synced to production</>
                    ) : isToggling ? (
                        <><Loader2 size={10} className="animate-spin" /> Applying...</>
                    ) : (
                        <><div className={cn("w-1.5 h-1.5 rounded-full", maintenanceMode ? "bg-red-500 animate-pulse" : "bg-emerald-500")} /> {maintenanceMode ? "Maintenance Active" : "Production Live"}</>
                    )}
                </div>
            </div>

            {/* Main Toggle */}
            <div className={cn(
                "bg-[var(--dev-card)] border rounded-xl p-6 flex items-center justify-between transition-all duration-500",
                maintenanceMode ? "border-red-500/30" : "border-[var(--dev-border)]"
            )} style={{ boxShadow: "var(--dev-shadow)" }}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        maintenanceMode ? "bg-red-500/10" : "bg-[var(--dev-accent-bg)]"
                    )}>
                        <Power size={22} className={maintenanceMode ? "text-red-500" : "text-[var(--dev-accent)]"} />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-semibold text-[var(--dev-text)]">Maintenance Mode</h3>
                        <p className="text-[12px] text-[var(--dev-text-muted)] mt-0.5">
                            {maintenanceMode ? "⛔ Site is currently under maintenance — users see a full-screen maintenance page" : "✅ Site is live and serving traffic normally"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={isToggling}
                    className={cn(
                        "relative w-[52px] h-[28px] rounded-full transition-all duration-300 cursor-pointer",
                        maintenanceMode ? "bg-red-500" : "bg-[var(--dev-text-dimmer)]",
                        isToggling && "opacity-50 cursor-wait"
                    )}
                >
                    <div className={cn(
                        "absolute top-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-lg transition-all duration-300",
                        maintenanceMode ? "left-[26px]" : "left-[2px]"
                    )} />
                </button>
            </div>

            {/* Active maintenance banner */}
            {maintenanceMode && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Power size={14} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold text-red-500">Maintenance Mode is ACTIVE</p>
                        <p className="text-[11px] text-[var(--dev-text-muted)] mt-1 leading-relaxed">
                            All user-facing pages (/, /shop, /checkout, /product/*) are currently showing the maintenance screen.
                            <br />Admin (/admin) and Developer (/developer) routes remain accessible.
                        </p>
                    </div>
                </div>
            )}

            {/* Maintenance Message */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5" style={{ boxShadow: "var(--dev-shadow)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Globe size={16} className="text-[var(--dev-text-dim)]" />
                            <h3 className="text-[14px] font-semibold text-[var(--dev-text)]">Maintenance Message</h3>
                        </div>
                        {publicMessage !== savedMessage && (
                            <button
                                onClick={saveMessage}
                                disabled={isToggling}
                                className="text-[10px] font-semibold px-3 py-1.5 bg-[var(--dev-accent-bg)] text-[var(--dev-accent)] rounded-lg hover:opacity-80 transition-all"
                            >
                                Save Message
                            </button>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">Public Message</label>
                        <textarea
                            value={publicMessage}
                            onChange={(e) => setPublicMessage(e.target.value)}
                            rows={3}
                            className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-4 py-3 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors resize-none"
                        />
                    </div>

                    <div className="mt-4">
                        <p className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider mb-2">Preview</p>
                        <div className="bg-[var(--dev-input)] border border-[var(--dev-border)] rounded-xl p-4 text-center">
                            <Wrench size={20} className="text-amber-500 mx-auto mb-2" />
                            <p className="text-[12px] text-[var(--dev-text-secondary)] leading-relaxed">{publicMessage}</p>
                        </div>
                    </div>
                </div>

            {/* Bypass IP Whitelist */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5" style={{ boxShadow: "var(--dev-shadow)" }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Globe size={16} className="text-[var(--dev-text-dim)]" />
                        <div>
                            <h3 className="text-[14px] font-semibold text-[var(--dev-text)]">Bypass IP Whitelist</h3>
                            <p className="text-[11px] text-[var(--dev-text-muted)] mt-0.5">These IPs can access the site during maintenance</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         {currentClientIP && !bypassIPs.some(b => b.ip === currentClientIP) && (
                            <button 
                                onClick={() => addIP(currentClientIP)}
                                className="text-[10px] flex items-center gap-1.5 font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
                            >
                                <MonitorIcon size={12} /> Whitelist My IP
                            </button>
                         )}
                         <span className="text-[10px] text-[var(--dev-text-dim)] font-medium">{bypassIPs.length} whitelisted</span>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newIP}
                        onChange={(e) => setNewIP(e.target.value)}
                        placeholder="IP Address (e.g., 192.168.1.1)"
                        className="flex-1 bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors font-mono placeholder:text-[var(--dev-text-dimmer)]"
                    />
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Label (optional)"
                        className="w-[150px] bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors placeholder:text-[var(--dev-text-dimmer)]"
                    />
                    <button onClick={() => addIP()} className="flex items-center gap-2 bg-[var(--dev-text)] text-[var(--dev-bg)] px-4 py-2.5 rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all active:scale-[0.98]">
                        <Plus size={14} /> Add
                    </button>
                </div>

                <div className="space-y-2">
                    {bypassIPs.map((bp) => (
                        <div key={bp.ip} className="flex items-center gap-3 px-3 py-2 bg-[var(--dev-hover)] rounded-lg group">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[12px] text-[var(--dev-text-secondary)] font-mono flex-1">{bp.ip}</span>
                            <span className="text-[10px] text-[var(--dev-text-dim)] bg-[var(--dev-active)] px-2 py-0.5 rounded font-medium">{bp.label}</span>
                            <button onClick={() => removeIP(bp.ip)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {bypassIPs.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-[var(--dev-border)] rounded-lg">
                            <p className="text-[11px] text-[var(--dev-text-dimmer)] uppercase font-bold tracking-widest">No Whitelisted IPs</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Enable Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--dev-card)] border border-[var(--dev-border-strong)] rounded-2xl p-6 max-w-md w-full" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Power size={22} className="text-red-500" />
                        </div>
                        <h3 className="text-[16px] font-bold text-[var(--dev-text)] text-center mb-2">Enable Maintenance Mode?</h3>
                        <p className="text-[13px] text-[var(--dev-text-muted)] text-center mb-6 leading-relaxed">
                            This will <span className="font-bold text-red-500">immediately</span> replace the entire user-facing site with a maintenance screen.
                            <br /><br />
                            Admin and Developer routes will remain accessible.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 bg-[var(--dev-hover)] border border-[var(--dev-border-strong)] text-[var(--dev-text-secondary)] rounded-xl py-3 text-[13px] font-semibold hover:bg-[var(--dev-active)] transition-all">Cancel</button>
                            <button onClick={confirmEnable} disabled={isToggling} className="flex-1 bg-red-500 text-white rounded-xl py-3 text-[13px] font-semibold hover:bg-red-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                {isToggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                                Enable
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
