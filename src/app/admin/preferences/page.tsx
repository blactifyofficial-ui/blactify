"use client";

import { useEffect, useState } from "react";
import {
    Search,
    Star,
    Calendar,
    Mail,
    User,
    RefreshCw
} from "lucide-react";
import { getUserPreferences } from "../../actions/user-preferences";
import { AdminLoading, AdminPageHeader } from "@/components/admin/AdminUI";

interface UserPreference {
    id: string | number;
    user_id: string;
    product_id: string;
    product_name: string;
    email: string;
    full_name: string;
    created_at: string;
}

export default function AdminPreferencesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [preferences, setPreferences] = useState<UserPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [refetching, setRefetching] = useState(false);

    const fetchData = async () => {
        setRefetching(true);
        const result = await getUserPreferences();
        if (result.success) {
            setPreferences(result.data || []);
        }
        setLoading(false);
        setRefetching(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredPreferences = preferences.filter(pref => 
        pref.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pref.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pref.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-inter animate-in fade-in duration-700">
            <AdminPageHeader
                title="User Preferences"
                subtitle="Customers interested in out-of-stock products"
            >
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="relative group w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by product or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-white border border-zinc-100 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all text-sm font-medium placeholder:text-zinc-300 shadow-sm"
                        />
                    </div>
                    
                    <button
                        onClick={fetchData}
                        disabled={refetching}
                        className="p-3 bg-white border border-zinc-100 text-zinc-400 rounded-2xl hover:text-black hover:border-black/20 transition-all active:scale-90 disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw size={18} className={refetching ? "animate-spin" : ""} />
                    </button>
                </div>
            </AdminPageHeader>

            {loading ? (
                <AdminLoading message="Loading preferences..." />
            ) : (
                <div className="grid gap-4">
                    {filteredPreferences.length > 0 ? (
                        filteredPreferences.map((pref) => (
                            <div
                                key={pref.id}
                                className="group bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-2xl hover:border-black/5 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                            >
                                <div className="flex items-start gap-5 flex-1 relative z-10">
                                    <div className="w-16 h-16 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-inner">
                                        <Star size={24} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">
                                                ID: {String(pref.id).slice(-8)}
                                            </span>
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-600/5 rounded-full border border-amber-600/10">
                                                <span className="w-2 h-2 bg-amber-600 rounded-full" />
                                                <span className="text-[7px] font-black uppercase tracking-widest text-amber-600">Wishlist Request</span>
                                            </div>
                                        </div>
                                        <h3 className="font-black text-lg text-black tracking-tight group-hover:translate-x-1 transition-transform duration-500 flex items-center gap-2">
                                            {pref.product_name}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-5 text-zinc-400">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-80">
                                                <User size={12} strokeWidth={2.5} />
                                                {pref.full_name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-80">
                                                <Mail size={12} strokeWidth={2.5} />
                                                {pref.email}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-80 italic">
                                                <Calendar size={12} strokeWidth={2.5} />
                                                {new Date(pref.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-10 mt-6 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-zinc-50 relative z-10">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-1">PRODUCT ID</p>
                                        <p className="text-sm font-mono font-bold tracking-tighter text-black">{pref.product_id}</p>
                                    </div>
                                </div>

                                {/* Background glow effect */}
                                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-zinc-50 rounded-full blur-3xl group-hover:bg-zinc-100 transition-colors duration-700 opacity-50"></div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-32 rounded-[3.5rem] border border-zinc-100 text-center shadow-inner relative overflow-hidden">
                            <Star className="mx-auto text-zinc-100 mb-8 opacity-50" size={80} />
                            <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">No Requests</h4>
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic">No customer preferences recorded yet.</p>
                            <div className="absolute inset-0 bg-white opacity-[0.02] pointer-events-none"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
