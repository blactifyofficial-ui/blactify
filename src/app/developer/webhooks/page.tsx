"use client";

import { useState } from "react";
import {
    Webhook,
    Plus,
    Pencil,
    Trash2,
    RefreshCcw,
    Clock,
    Copy,
    Check,
    Play,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getWebhookDeliveries } from "@/actions/developer";
import { auth } from "@/lib/firebase";
import { useEffect, useCallback } from "react";

interface WebhookEndpoint {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    createdAt: string;
    secret: string;
}

interface DeliveryRecord {
    id: string;
    webhookId: string;
    event: string;
    statusCode: number;
    responseTime: number;
    timestamp: string;
    payload: Record<string, unknown>;
    success: boolean;
}

const AVAILABLE_EVENTS = [
    "order.created", "order.updated", "order.completed", "order.cancelled",
    "product.created", "product.updated",
    "user.registered", "payment.success", "payment.failed",
];

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([
        { id: "razorpay-system", url: "https://blactify.com/api/webhooks/razorpay", events: ["payment.captured", "order.paid"], active: true, createdAt: "2024-03-25T10:00:00Z", secret: "whsec_live_*******" },
    ]);

    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;
            const res = await getWebhookDeliveries(token);
            if (res.success) {
                setDeliveries(res.deliveries as DeliveryRecord[]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
    const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
    const [newUrl, setNewUrl] = useState("");
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
    const [resending, setResending] = useState<string | null>(null);

    const openAddModal = () => { setEditingWebhook(null); setNewUrl(""); setSelectedEvents([]); setShowAddModal(true); };
    const openEditModal = (wh: WebhookEndpoint) => { setEditingWebhook(wh); setNewUrl(wh.url); setSelectedEvents(wh.events); setShowAddModal(true); };

    const saveWebhook = () => {
        if (!newUrl.trim()) return;
        if (editingWebhook) {
            setWebhooks(webhooks.map(w => w.id === editingWebhook.id ? { ...w, url: newUrl, events: selectedEvents } : w));
        } else {
            setWebhooks([...webhooks, { id: `wh-${Date.now()}`, url: newUrl, events: selectedEvents, active: true, createdAt: new Date().toISOString(), secret: `whsec_${Math.random().toString(36).slice(2, 12)}...` }]);
        }
        setShowAddModal(false);
    };

    const deleteWebhook = (id: string) => { setWebhooks(webhooks.filter(w => w.id !== id)); setShowDeleteModal(null); };
    const toggleWebhook = (id: string) => { setWebhooks(webhooks.map(w => w.id === id ? { ...w, active: !w.active } : w)); };

    const copySecret = (id: string, secret: string) => { navigator.clipboard.writeText(secret); setCopiedSecret(id); setTimeout(() => setCopiedSecret(null), 2000); };

    const handleResend = async (deliveryId: string) => {
        setResending(deliveryId);
        await new Promise(r => setTimeout(r, 1500));
        setDeliveries(deliveries.map(d => d.id === deliveryId ? { ...d, statusCode: 200, success: true, responseTime: 95, timestamp: new Date().toISOString() } : d));
        setResending(null);
    };

    const getStatusColor = (code: number) => {
        if (code >= 200 && code < 300) return { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
        if (code >= 400 && code < 500) return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
        return { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight" style={{ fontSize: '1.5rem', textTransform: 'none', fontFamily: 'inherit', letterSpacing: '-0.025em' }}>Webhooks</h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">Manage endpoints and monitor delivery health</p>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-2 bg-[var(--dev-text)] text-[var(--dev-bg)] px-4 py-2.5 rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all active:scale-[0.98]">
                    <Plus size={14} /> Add Endpoint
                </button>
            </div>

            {/* Webhook Endpoints */}
            <div className="space-y-3">
                {webhooks.map((wh) => (
                    <div key={wh.id} className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5 hover:border-[var(--dev-border-hover)] transition-all" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <Webhook size={16} className={wh.active ? "text-emerald-500" : "text-[var(--dev-text-dimmer)]"} />
                                    <span className="text-[13px] text-[var(--dev-text-secondary)] font-mono truncate">{wh.url}</span>
                                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", wh.active ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--dev-hover)] text-[var(--dev-text-muted)]")}>
                                        {wh.active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {wh.events.map(evt => (
                                        <span key={evt} className="text-[10px] text-[var(--dev-text-muted)] bg-[var(--dev-hover)] border border-[var(--dev-border)] px-2 py-0.5 rounded font-mono">{evt}</span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-[var(--dev-text-dim)]">
                                    <span className="flex items-center gap-1"><Clock size={10} /> Created {new Date(wh.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                    <button onClick={() => copySecret(wh.id, wh.secret)} className="flex items-center gap-1 hover:text-[var(--dev-text-muted)] transition-colors">
                                        {copiedSecret === wh.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                        {copiedSecret === wh.id ? "Copied!" : "Secret"}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => toggleWebhook(wh.id)} className={cn("relative w-[40px] h-[22px] rounded-full transition-all duration-300", wh.active ? "bg-emerald-500" : "bg-[var(--dev-text-dimmer)]")}>
                                    <div className={cn("absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-all duration-300", wh.active ? "left-[20px]" : "left-[2px]")} />
                                </button>
                                <button onClick={() => openEditModal(wh)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--dev-hover)] text-[var(--dev-text-dim)] hover:text-[var(--dev-text-secondary)] transition-all"><Pencil size={13} /></button>
                                <button onClick={() => setShowDeleteModal(wh.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--dev-text-dim)] hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery History */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl overflow-hidden" style={{ boxShadow: "var(--dev-shadow)" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--dev-border)]">
                    <h3 className="text-[13px] font-semibold text-[var(--dev-text)]">Delivery History</h3>
                    <span className="text-[10px] text-[var(--dev-text-dim)] font-medium">{deliveries.length} attempts</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--dev-border-subtle)]">
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Event</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider hidden md:table-cell">Response</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider hidden lg:table-cell">Endpoint</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Time</th>
                                <th className="px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                         <tbody>
                            {loading && deliveries.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[var(--dev-border-subtle)]">
                                        <td colSpan={6} className="px-5 py-4">
                                            <div className="h-4 bg-[var(--dev-hover)] rounded animate-pulse w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : deliveries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-[var(--dev-text-dim)] text-[12px]">
                                        No recent delivery history found in logs
                                    </td>
                                </tr>
                            ) : (
                                deliveries.map((d) => {
                                    const statusColor = getStatusColor(d.statusCode);
                                    const webhook = webhooks.find(w => w.id === d.webhookId);
                                    return (
                                        <tr key={d.id} className="border-b border-[var(--dev-border-subtle)] hover:bg-[var(--dev-hover)] transition-colors">
                                            <td className="px-5 py-3.5"><span className="text-[12px] text-[var(--dev-text-secondary)] font-mono">{d.event}</span></td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border font-mono", statusColor.text, statusColor.bg, statusColor.border)}>{d.statusCode}</span>
                                            </td>
                                            <td className="px-5 py-3.5 hidden md:table-cell"><span className="text-[11px] text-[var(--dev-text-dim)] font-mono">{d.responseTime}ms</span></td>
                                            <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-[11px] text-[var(--dev-text-dim)] font-mono truncate max-w-[200px] block">{webhook?.url?.replace(/^https?:\/\//, '') || "—"}</span></td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-[11px] text-[var(--dev-text-dim)]">
                                                    {new Date(d.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button onClick={() => handleResend(d.id)} disabled={resending === d.id} className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all inline-flex items-center gap-1.5", resending === d.id ? "bg-[var(--dev-hover)] text-[var(--dev-text-dim)] cursor-not-allowed" : "bg-[var(--dev-active)] text-[var(--dev-text-secondary)] hover:bg-[var(--dev-border-hover)] hover:text-[var(--dev-text)]")}>
                                                    {resending === d.id ? <RefreshCcw size={10} className="animate-spin" /> : <Play size={10} />}
                                                    Re-send
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--dev-card)] border border-[var(--dev-border-strong)] rounded-2xl p-6 max-w-lg w-full" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[16px] font-bold text-[var(--dev-text)]">{editingWebhook ? "Edit Endpoint" : "Add Endpoint"}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-[var(--dev-text-dim)] hover:text-[var(--dev-text-muted)] transition-colors"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">Endpoint URL</label>
                                <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://your-server.com/webhooks" className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors font-mono placeholder:text-[var(--dev-text-dimmer)]" />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-2">Events to Subscribe</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {AVAILABLE_EVENTS.map((evt) => (
                                        <button key={evt} onClick={() => setSelectedEvents(selectedEvents.includes(evt) ? selectedEvents.filter(e => e !== evt) : [...selectedEvents, evt])} className={cn("text-left px-3 py-2 rounded-lg text-[11px] font-mono border transition-all", selectedEvents.includes(evt) ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-[var(--dev-input)] border-[var(--dev-border)] text-[var(--dev-text-muted)] hover:border-[var(--dev-border-hover)]")}>
                                            {evt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 bg-[var(--dev-hover)] border border-[var(--dev-border-strong)] text-[var(--dev-text-secondary)] rounded-xl py-3 text-[13px] font-semibold hover:bg-[var(--dev-active)] transition-all">Cancel</button>
                            <button onClick={saveWebhook} className="flex-1 bg-[var(--dev-text)] text-[var(--dev-bg)] rounded-xl py-3 text-[13px] font-semibold hover:opacity-90 transition-all active:scale-[0.98]">{editingWebhook ? "Save Changes" : "Create Endpoint"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--dev-card)] border border-[var(--dev-border-strong)] rounded-2xl p-6 max-w-md w-full" style={{ boxShadow: "var(--dev-shadow)" }}>
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500" /></div>
                        <h3 className="text-[16px] font-bold text-[var(--dev-text)] text-center mb-2">Delete Webhook?</h3>
                        <p className="text-[13px] text-[var(--dev-text-muted)] text-center mb-6 leading-relaxed">This will permanently remove this endpoint. This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(null)} className="flex-1 bg-[var(--dev-hover)] border border-[var(--dev-border-strong)] text-[var(--dev-text-secondary)] rounded-xl py-3 text-[13px] font-semibold hover:bg-[var(--dev-active)] transition-all">Cancel</button>
                            <button onClick={() => deleteWebhook(showDeleteModal)} className="flex-1 bg-red-500 text-white rounded-xl py-3 text-[13px] font-semibold hover:bg-red-600 transition-all active:scale-[0.98]">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
