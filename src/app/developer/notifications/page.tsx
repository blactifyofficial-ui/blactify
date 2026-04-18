"use client";

import { useState } from "react";
import {
    Bell,
    Mail,
    MessageCircle,
    Send,
    CheckCircle2,
    XCircle,
    Clock,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Play,
    Copy,
    Check,
    Flame,
    Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { sendTestNotification, generateStressTestOrdersAction } from "@/actions/notifications-dev";
import { getNotificationLogs, broadcastDeveloperMessage } from "@/actions/developer";
import { useEffect, useCallback } from "react";

type NotificationType = "email" | "telegram" | "push" | "broadcast";
type Environment = "sandbox" | "production";

interface DeliveryLog {
    id: string;
    type: NotificationType;
    env: Environment;
    status: "delivered" | "failed" | "pending";
    to: string;
    subject?: string;
    timestamp: string;
    latencyMs: number;
}

const TEMPLATES: Record<NotificationType, { subject: string; body: string; to: string }> = {
    email: {
        subject: "Test Order Confirmation #BLK-001",
        body: `Hi there,\n\nYour order has been confirmed! Here are the details:\n\n- Order ID: BLK-001\n- Items: Premium Black Tee x1\n- Total: ₹1,999\n\nThank you for shopping with Blactify.`,
        to: "test@blactify.com",
    },
    telegram: {
        subject: "",
        body: "🛒 *New Order Alert*\n\nOrder: #BLK-001\nItems: Premium Black Tee x1\nTotal: ₹1,999\nStatus: ✅ Confirmed\n\n[View Order](https://blactify.com/admin/orders)",
        to: "@blactify_admin",
    },
    push: {
        subject: "New Order Alert 🔔",
        body: '{"title": "New Order!", "body": "Order #BLK-001 • ₹1,999", "icon": "/icon.png", "click_action": "/admin/orders"}',
        to: "All FCM subscribed devices",
    },
    broadcast: {
        subject: "Broadcast Message",
        body: "Write a message to all administrators here...",
        to: "All Administrators",
    },
};

export default function NotificationsPage() {
    const [activeType, setActiveType] = useState<NotificationType>("email");
    const [environment, setEnvironment] = useState<Environment>("sandbox");
    const [isSending, setIsSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [subject, setSubject] = useState(TEMPLATES.email.subject);
    const [body, setBody] = useState(TEMPLATES.email.body);
    const [to, setTo] = useState(TEMPLATES.email.to);

    const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);

    const fetchLogs = useCallback(async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;
            const res = await getNotificationLogs(token);
            if (res.success) {
                setDeliveryLogs(res.logs as DeliveryLog[]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            // Loading handled implicitly by initial state or not used
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const switchType = (type: NotificationType) => {
        setActiveType(type);
        setSubject(TEMPLATES[type].subject);
        setBody(TEMPLATES[type].body);
        setTo(TEMPLATES[type].to);
    };

    const handleSend = async () => {
        setIsSending(true);
        const startTime = Date.now();

        try {
            if (activeType === "broadcast") {
                const token = await auth.currentUser?.getIdToken();
                const result = await broadcastDeveloperMessage(subject, body, token);

                if (result.success) {
                    toast.success("Broadcast sent to all admins!");
                    const successLog: DeliveryLog = {
                        id: `bc-${Date.now()}`,
                        type: "broadcast",
                        env: "production",
                        status: "delivered",
                        to: "All Admins",
                        subject: subject,
                        timestamp: new Date().toISOString(),
                        latencyMs: Date.now() - startTime,
                    };
                    setDeliveryLogs([successLog, ...deliveryLogs]);
                    fetchLogs();
                } else {
                    toast.error(`Broadcast failed: ${result.error}`);
                }
                return;
            }

            if (environment === "production") {
                const token = await auth.currentUser?.getIdToken();
                const result = await sendTestNotification(
                    activeType,
                    to,
                    subject,
                    body,
                    token
                );

                if (!result.success) {
                    toast.error(`Production send failed: ${result.error}`);
                    const failedLog: DeliveryLog = {
                        id: `dl-${Date.now()}`,
                        type: activeType,
                        env: environment,
                        status: "failed",
                        to: to,
                        subject: subject || body.slice(0, 30),
                        timestamp: new Date().toISOString(),
                        latencyMs: Date.now() - startTime,
                    };
                    setDeliveryLogs([failedLog, ...deliveryLogs]);
                } else {
                    toast.success(`${activeType.toUpperCase()} sent to production successfully!`);
                    const successLog: DeliveryLog = {
                        id: `dl-${Date.now()}`,
                        type: activeType,
                        env: environment,
                        status: "delivered",
                        to: to,
                        subject: subject || body.slice(0, 30),
                        timestamp: new Date().toISOString(),
                        latencyMs: Date.now() - startTime,
                    };
                    setDeliveryLogs([successLog, ...deliveryLogs]);
                }
            } else {
                // Sandbox Mode (Mock Delay)
                await new Promise((r) => setTimeout(r, 1200));
                const newLog: DeliveryLog = {
                    id: `dl-${Date.now()}`,
                    type: activeType,
                    env: environment,
                    status: Math.random() > 0.15 ? "delivered" : "failed",
                    to: to,
                    subject: subject || body.slice(0, 30),
                    timestamp: new Date().toISOString(),
                    latencyMs: Math.floor(Math.random() * 500) + 50,
                };
                setDeliveryLogs([newLog, ...deliveryLogs]);
                if (newLog.status === "delivered") {
                    toast.success("Sandbox test payload recorded successfully");
                } else {
                    toast.error("Sandbox test payload simulated failure");
                }
            }
            // After successful send to production, refresh real logs
            if (environment === "production") {
                fetchLogs();
            }
        } catch (err: unknown) {
            console.error("Playground error:", err);
            toast.error(err instanceof Error ? err.message : "Failed to initiate sending");
        } finally {
            setIsSending(false);
        }
    };

    const [isGeneratingStress, setIsGeneratingStress] = useState(false);

    const handleStressTest = async () => {
        if (!confirm("This will trigger 10-20 production-grade order notifications to identify delivery bottlenecks. Continue?")) return;

        setIsGeneratingStress(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await generateStressTestOrdersAction(token);
            if (res.success) {
                toast.success(`System stress test completed: ${res.count} notifications dispatched.`);
                fetchLogs();
            } else {
                toast.error(res.error || "Stress test sequence failed");
            }
        } catch {
            toast.error("An unexpected error occurred during stress testing");
        } finally {
            setIsGeneratingStress(false);
        }
    };

    const copyPayload = () => {
        const payload = activeType === "push" ? body : JSON.stringify({ to, subject, body }, null, 2);
        navigator.clipboard.writeText(payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--dev-text)] tracking-tight" style={{ fontSize: '1.5rem', textTransform: 'none', fontFamily: 'inherit', letterSpacing: '-0.025em' }}>
                        Notification Playground
                    </h1>
                    <p className="text-[13px] text-[var(--dev-text-muted)] mt-1">Send test payloads across channels</p>
                </div>
                <button
                    onClick={() => setEnvironment(environment === "sandbox" ? "production" : "sandbox")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all",
                        environment === "sandbox"
                            ? "bg-amber-400/10 text-amber-500 border-amber-400/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}
                >
                    {environment === "sandbox" ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    {environment === "sandbox" ? "Sandbox" : "Production"}
                </button>
                <button
                    onClick={handleStressTest}
                    disabled={isGeneratingStress}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 transition-all hover:bg-indigo-500/20 disabled:opacity-50"
                >
                    {isGeneratingStress ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} className="animate-pulse" />}
                    Order Stress Test (10-20)
                </button>
            </div>

            {/* Channel Selector */}
            <div className="flex items-center gap-2 p-1 bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl w-fit" style={{ boxShadow: "var(--dev-shadow)" }}>
                {([
                    { type: "email" as const, icon: Mail, label: "Email" },
                    { type: "telegram" as const, icon: MessageCircle, label: "Telegram" },
                    { type: "push" as const, icon: Flame, label: "Firebase Push" },
                    { type: "broadcast" as const, icon: Megaphone, label: "Admin Broadcast" },
                ]).map((ch) => (
                    <button
                        key={ch.type}
                        onClick={() => switchType(ch.type)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all",
                            activeType === ch.type
                                ? "bg-[var(--dev-active)] text-[var(--dev-text)]"
                                : "text-[var(--dev-text-dim)] hover:text-[var(--dev-text-muted)]"
                        )}
                    >
                        <ch.icon size={14} />
                        {ch.label}
                    </button>
                ))}
            </div>

            {/* Composer + Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                {/* Composer */}
                <div className="lg:col-span-3 bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5 space-y-4" style={{ boxShadow: "var(--dev-shadow)" }}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-[13px] font-semibold text-[var(--dev-text)]">Compose Payload</h3>
                        <button onClick={copyPayload} className="flex items-center gap-1.5 text-[11px] text-[var(--dev-text-muted)] hover:text-[var(--dev-text-secondary)] transition-colors">
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copied ? "Copied" : "Copy JSON"}
                        </button>
                    </div>

                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">Recipient</label>
                        <input type="text" value={to} onChange={(_e) => setTo(_e.target.value)} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors font-mono" />
                    </div>

                    {activeType === "email" && (
                        <div>
                            <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">Subject</label>
                            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-3 py-2.5 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors" />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider block mb-1.5">
                            {activeType === "push" ? "FCM JSON Payload" : activeType === "telegram" ? "Markdown Message" : "Body"}
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={activeType === "push" ? 6 : activeType === "telegram" ? 7 : 5}
                            className={cn(
                                "w-full bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-lg px-4 py-3 text-[12px] text-[var(--dev-text-secondary)] focus:outline-none focus:border-[var(--dev-accent)] transition-colors resize-none",
                                (activeType === "push" || activeType === "telegram") && "font-mono"
                            )}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]",
                            environment === "production"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white",
                            isSending && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                        {isSending ? "Sending..." : environment === "production" ? "Send to Production" : "Send Test"}
                    </button>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-2 bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl p-5" style={{ boxShadow: "var(--dev-shadow)" }}>
                    <h3 className="text-[13px] font-semibold text-[var(--dev-text)] mb-4">Preview</h3>

                    {activeType === "email" && (
                        <div className="bg-white rounded-xl p-5 space-y-3 border border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center"><span className="text-[10px] text-white font-bold">B</span></div>
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-900">Blactify</p>
                                    <p className="text-[10px] text-gray-400">noreply@blactify.com</p>
                                </div>
                            </div>
                            <p className="text-[13px] font-semibold text-gray-900">{subject}</p>
                            <p className="text-[12px] text-gray-600 whitespace-pre-line leading-relaxed">{body}</p>
                        </div>
                    )}

                    {activeType === "telegram" && (
                        <div className="space-y-3">
                            <div className="bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-xl overflow-hidden">
                                <div className="bg-[#2AABEE]/10 px-4 py-2.5 border-b border-[var(--dev-border)] flex items-center gap-2">
                                    <MessageCircle size={14} className="text-[#2AABEE]" />
                                    <span className="text-[12px] text-[#2AABEE] font-semibold">Telegram Bot</span>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start gap-2.5 mb-3">
                                        <div className="w-7 h-7 rounded-full bg-[#2AABEE] flex items-center justify-center flex-shrink-0">
                                            <span className="text-[9px] text-white font-bold">B</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-[#2AABEE] font-semibold mb-1">Blactify Bot</p>
                                            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[220px]">
                                                <p className="text-[11px] text-[var(--dev-text-secondary)] leading-relaxed whitespace-pre-line font-mono">{body}</p>
                                            </div>
                                            <p className="text-[9px] text-[var(--dev-text-dimmer)] mt-1">now</p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[9px] text-[var(--dev-text-dimmer)] bg-[var(--dev-hover)] px-2 py-0.5 rounded">Sending to {to}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-[var(--dev-text-dim)] text-center">Telegram bot message preview (Markdown supported)</p>
                        </div>
                    )}

                    {activeType === "push" && (
                        <div className="space-y-3">
                            <div className="bg-[var(--dev-input)] border border-[var(--dev-border-strong)] rounded-xl p-4">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Flame size={12} className="text-amber-500" />
                                    <span className="text-[10px] text-amber-500 font-semibold">Firebase Cloud Messaging</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                                        <Bell size={12} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-[var(--dev-text-muted)] mb-0.5">BLACTIFY • now</p>
                                        {(() => {
                                            try {
                                                const data = JSON.parse(body);
                                                return (
                                                    <>
                                                        <p className="text-[12px] font-semibold text-[var(--dev-text)]">{data.title}</p>
                                                        <p className="text-[11px] text-[var(--dev-text-muted)]">{data.body}</p>
                                                    </>
                                                );
                                            } catch {
                                                return <p className="text-[11px] text-[var(--dev-text-muted)]">{body}</p>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-[var(--dev-text-dim)] text-center">PWA push notification preview (via FCM)</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delivery History */}
            <div className="bg-[var(--dev-card)] border border-[var(--dev-border)] rounded-xl overflow-hidden" style={{ boxShadow: "var(--dev-shadow)" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--dev-border)]">
                    <h3 className="text-[13px] font-semibold text-[var(--dev-text)]">Delivery History</h3>
                    <span className="text-[10px] text-[var(--dev-text-dim)] font-medium">{deliveryLogs.length} deliveries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--dev-border-subtle)]">
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Channel</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider hidden md:table-cell">To</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider hidden lg:table-cell">Latency</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Env</th>
                                <th className="text-left px-5 py-3 text-[10px] font-semibold text-[var(--dev-text-dim)] uppercase tracking-wider">Time</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryLogs.map((log) => (
                                <tr key={log.id} className="border-b border-[var(--dev-border-subtle)] hover:bg-[var(--dev-hover)] transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            {log.type === "email" && <Mail size={13} className="text-[var(--dev-text-muted)]" />}
                                            {log.type === "telegram" && <MessageCircle size={13} className="text-[#2AABEE]" />}
                                            {log.type === "push" && <Flame size={13} className="text-amber-500" />}
                                            {log.type === "broadcast" && <Megaphone size={13} className="text-emerald-500" />}
                                            <span className="text-[12px] text-[var(--dev-text-secondary)] font-medium capitalize">{log.type === "push" ? "FCM Push" : log.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                            log.status === "delivered" && "bg-emerald-400/10 text-emerald-500",
                                            log.status === "failed" && "bg-red-400/10 text-red-500",
                                            log.status === "pending" && "bg-amber-400/10 text-amber-500"
                                        )}>
                                            {log.status === "delivered" && <CheckCircle2 size={10} />}
                                            {log.status === "failed" && <XCircle size={10} />}
                                            {log.status === "pending" && <Clock size={10} />}
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell">
                                        <span className="text-[11px] text-[var(--dev-text-muted)] font-mono">{log.to}</span>
                                    </td>
                                    <td className="px-5 py-3.5 hidden lg:table-cell">
                                        <span className="text-[11px] text-[var(--dev-text-dim)] font-mono">{log.latencyMs}ms</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", log.env === "sandbox" ? "bg-amber-400/10 text-amber-500" : "bg-zinc-400/10 text-zinc-500")}>{log.env}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-[11px] text-[var(--dev-text-dim)]">{new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {log.status === "failed" && (
                                            <button className="text-[10px] text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1">
                                                <Play size={10} /> Retry
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
