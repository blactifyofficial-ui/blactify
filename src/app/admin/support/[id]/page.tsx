"use client";

import { useState, useEffect, use } from "react";
import { getTicketById, respondToTicket } from "@/actions/support";
import {
    ChevronLeft,
    Send,
    User,
    Mail,
    Phone,
    Package,
    Clock,
    ExternalLink,
    CheckCircle2,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [response, setResponse] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        async function fetchTicket() {
            setLoading(true);
            const result = await getTicketById(id);
            if (result.success) {
                setTicket(result.ticket);
                if (result.ticket.admin_response) {
                    setResponse(result.ticket.admin_response);
                }
            } else {
                toast.error("Failed to load ticket");
                router.push("/admin/support");
            }
            setLoading(false);
        }
        fetchTicket();
    }, [id, router]);

    const handleSendResponse = async () => {
        if (!response.trim()) {
            toast.error("Please enter a response");
            return;
        }

        setIsSending(true);
        try {
            const result = await respondToTicket(id, response, ticket.profiles?.email, ticket.order_id);
            if (result.success) {
                toast.success("Response sent successfully!");
                // Refresh ticket status
                const updated = await getTicketById(id);
                if (updated.success) setTicket(updated.ticket);
            } else {
                toast.error(result.error || "Failed to send response");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <main className="min-h-screen bg-zinc-50/50 pb-20 pt-8 font-sans">
            <div className="px-6 max-w-4xl mx-auto">
                <header className="mb-10">
                    <Link href="/admin/support" className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-6 text-xs font-bold uppercase tracking-widest">
                        <ChevronLeft size={16} />
                        Back to Tickets
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-empire text-5xl mb-2">Ticket #{id.slice(0, 8)}</h1>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                    ticket.status === 'open' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                )}>
                                    {ticket.status}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={12} />
                                    {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Ticket Content & Response Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Original Message */}
                        <section className="bg-white rounded-[40px] border border-zinc-100 p-10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-black/5" />
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Customer Message</h2>
                            <p className="text-lg font-medium leading-relaxed text-zinc-800">
                                &quot;{ticket.message}&quot;
                            </p>
                            <div className="mt-8 pt-8 border-t border-zinc-50 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                    <MessageSquare size={16} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    Category: {ticket.category.replace('_', ' ')}
                                </span>
                            </div>
                        </section>

                        {/* Response Form */}
                        <section className="bg-white rounded-[40px] border border-zinc-100 p-10">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">
                                {ticket.status === 'responded' ? 'Previous Response' : 'Draft Response'}
                            </h2>
                            <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Write your response to the customer..."
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-[24px] p-8 text-sm font-medium min-h-[300px] outline-none focus:border-black transition-all resize-none shadow-inner"
                                disabled={ticket.status === 'responded' && !response}
                            />

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSendResponse}
                                    disabled={isSending || !response.trim()}
                                    className="px-10 py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-2xl shadow-black/20 disabled:opacity-30 disabled:grayscale"
                                >
                                    {isSending ? "Sending..." : ticket.status === 'responded' ? "Update & Re-send Response" : "Send Response via Email"}
                                    <Send size={16} />
                                </button>
                            </div>

                            {ticket.responded_at && (
                                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                    <CheckCircle2 size={14} />
                                    Last responded on {format(new Date(ticket.responded_at), 'MMM dd, HH:mm')}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar: Customer & Order Info */}
                    <div className="space-y-6">
                        {/* Customer Card */}
                        <section className="bg-white rounded-[32px] border border-zinc-100 p-8">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Customer Info</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Name</p>
                                        <p className="text-xs font-bold uppercase tracking-tight text-black">{ticket.profiles?.full_name || "Guest"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <Mail size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Email</p>
                                        <p className="text-xs font-bold tracking-tight text-black truncate">{ticket.profiles?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Phone</p>
                                        <p className="text-xs font-bold uppercase tracking-tight text-black">{ticket.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Order info */}
                        {ticket.order_id && (
                            <section className="bg-white rounded-[32px] border border-zinc-100 p-8">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Linked Order</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">ID</p>
                                            <p className="text-xs font-bold uppercase tracking-tight text-black">#{ticket.order_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Status</p>
                                            <p className="text-xs font-bold uppercase tracking-tight text-black">{ticket.orders?.status}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/admin/orders/${ticket.order_id}`}
                                        className="w-full py-4 border border-zinc-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all group"
                                    >
                                        View Full Order
                                        <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </Link>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
