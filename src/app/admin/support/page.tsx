"use client";

import { useState, useEffect } from "react";
import { getTickets } from "@/actions/support";
import {
    Search,
    ChevronRight,
    User,
    MessageSquare,
    Package,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Ticket } from "@/types/database";

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchTickets() {
            setLoading(true);
            const result = await getTickets();
            if (result.success) {
                setTickets(result.tickets || []);
            }
            setLoading(false);
        }
        fetchTickets();
    }, []);

    const filteredTickets = tickets.filter((ticket) => {
        const matchesFilter = filter === "all" || ticket.status === filter;
        const matchesSearch =
            (ticket.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    return (
        <main className="min-h-screen bg-zinc-50/50 pb-20 pt-8 font-sans">
            <div className="px-6 max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-empire text-5xl mb-2">Support</h1>
                        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Manage customer inquiries and tickets</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all w-full md:w-64"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-black transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="responded">Responded</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-white rounded-[32px] border border-zinc-100 animate-pulse" />
                        ))}
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-40 bg-white rounded-[40px] border border-zinc-100">
                        <MessageSquare size={48} className="mx-auto text-zinc-100 mb-6" />
                        <h3 className="text-lg font-bold">No tickets found</h3>
                        <p className="text-zinc-400 text-xs">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/admin/support/${ticket.id}`}
                                className="group bg-white rounded-[32px] border border-zinc-100 p-8 hover:shadow-2xl hover:shadow-black/5 transition-all active:scale-[0.98] relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                        ticket.status === 'open' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                    )}>
                                        {ticket.status}
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                                        {format(new Date(ticket.created_at), 'MMM dd, HH:mm')}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 truncate">
                                        {(ticket.category || "").replace('_', ' ')}
                                    </h3>
                                    <p className="text-sm font-medium leading-relaxed line-clamp-3 text-zinc-600">
                                        &quot;{ticket.message}&quot;
                                    </p>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-zinc-50">
                                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-tight text-black">
                                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                            <User size={14} />
                                        </div>
                                        {ticket.profiles?.full_name || "Guest User"}
                                    </div>
                                    {ticket.order_id && (
                                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-tight text-zinc-400">
                                            <div className="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                                                <Package size={14} />
                                            </div>
                                            Order #{ticket.order_id}
                                        </div>
                                    )}
                                </div>

                                <div className="absolute right-8 bottom-8 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                    <ChevronRight size={20} className="text-black" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
