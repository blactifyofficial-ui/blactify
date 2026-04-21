"use client";

import { useState, useEffect } from "react";
import {
    Search,
    User,
    Calendar,
    Camera,
    CheckCircle2,
    MessageCircle,
    Loader2,
    Clock,
    XCircle,
    Plus,
    X,
    PlusCircle
} from "lucide-react";
import { createManualStudioBooking, getStudioBookings, confirmStudioBooking } from "@/actions/studio";
import { StudioBookingSchema } from "@/lib/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { BaseButton } from "@/components/ui/BaseButton";

interface StudioBooking {
    id: string;
    name: string;
    phone: string;
    booking_date: string;
    start_time: string;
    duration: string;
    photo_type: string;
    query?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    created_at: string;
}

export default function AdminStudioPage() {
    const [bookings, setBookings] = useState<StudioBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);


    async function fetchBookings() {
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await getStudioBookings(token);
            if (result.success) {
                setBookings(result.bookings || []);
            }
        } catch (err) {
            toast.error("Failed to load bookings");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleConfirm = async (id: string) => {
        setConfirmingId(id);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await confirmStudioBooking(id, token);
            if (result.success && result.whatsappUrl) {
                toast.success("Booking confirmed!");
                // Refresh list
                await fetchBookings();
                // Open WhatsApp
                window.open(result.whatsappUrl, '_blank');
            } else {
                toast.error(result.error || "Confirmation failed");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setConfirmingId(null);
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        const matchesFilter = filter === "all" || booking.status === filter;
        const matchesSearch =
            (booking.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (booking.phone || "").includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    return (
        <main className="min-h-screen bg-zinc-50/50 pb-20 pt-8">
            <div className="px-6 max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="font-yapari text-4xl mb-2 tracking-tighter">Studio Bookings</h2>
                        <p className="text-zinc-400 text-[10px] font-yapari font-bold uppercase tracking-wide">Manage requested production shoots</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <BaseButton 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                        >
                            <Plus size={14} /> Add Booking
                        </BaseButton>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-white border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all w-full md:w-64"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-6 py-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wide outline-none focus:border-black transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="animate-spin text-zinc-300" size={40} />
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-40 bg-white rounded-3xl border border-zinc-100">
                        <Camera size={48} className="mx-auto text-zinc-100 mb-6" />
                        <h3 className="text-lg font-bold">No bookings found</h3>
                        <p className="text-zinc-400 text-xs">Waiting for new studio requests.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-xl hover:shadow-black/5 transition-all"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                        booking.status === 'confirmed' ? "bg-emerald-50 text-emerald-600" :
                                        booking.status === 'cancelled' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                    )}>
                                        {booking.status === 'confirmed' ? <CheckCircle2 size={24} /> : 
                                         booking.status === 'cancelled' ? <XCircle size={24} /> : <Clock size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-black uppercase tracking-tight">{booking.name}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-[11px] font-medium text-zinc-400">
                                            <span className="flex items-center gap-1.5"><MessageCircle size={12} /> {booking.phone}</span>
                                            <span className="flex items-center gap-1.5 uppercase tracking-wider"><Camera size={12} /> {booking.photo_type.replace('_', ' ')}</span>
                                        </div>
                                        {booking.query && (
                                            <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Message / Query</p>
                                                <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed italic">"{booking.query}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] block">Scheduled for</span>
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <Calendar size={14} className="text-black" />
                                            {format(new Date(booking.booking_date), 'EEEE, MMM dd yyyy')}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                            <Clock size={12} /> {booking.start_time} ({booking.duration})
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {booking.status === 'pending' ? (
                                            <BaseButton 
                                                onClick={() => handleConfirm(booking.id)}
                                                isLoading={confirmingId === booking.id}
                                                className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                Confirm & Notify
                                            </BaseButton>
                                        ) : booking.status === 'confirmed' ? (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                                                <CheckCircle2 size={14} /> Confirmed
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                                                <XCircle size={14} /> Cancelled
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Booking Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-yapari tracking-tight uppercase">New Studio Slot</h3>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mt-1">Manual booking entry</p>
                            </div>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center hover:bg-zinc-50 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form className="p-8 space-y-6 max-h-[70vh] overflow-y-auto" onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSubmitting(true);
                            const formData = new FormData(e.currentTarget);
                            const data = {
                                name: formData.get('name') as string,
                                phone: formData.get('phone') as string,
                                booking_date: formData.get('booking_date') as string,
                                start_time: formData.get('start_time') as string,
                                duration: formData.get('duration') as string,
                                photo_type: formData.get('photo_type') as 'model_shoot' | 'product_shoot' | 'other',
                                query: formData.get('query') as string,
                                status: formData.get('status') as 'pending' | 'confirmed'
                            };

                            try {
                                const token = await auth.currentUser?.getIdToken();
                                const result = await createManualStudioBooking(data, token);
                                if (result.success) {
                                    toast.success("Manual booking added successfully");
                                    setIsAddModalOpen(false);
                                    fetchBookings();
                                } else {
                                    toast.error(result.error || "Failed to add booking");
                                }
                            } catch (err) {
                                toast.error("An unexpected error occurred");
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Client Name</label>
                                    <input 
                                        name="name"
                                        required
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Phone Number</label>
                                    <input 
                                        name="phone"
                                        required
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all"
                                        placeholder="+91 99999 99999"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Booking Date</label>
                                    <input 
                                        name="booking_date"
                                        type="date"
                                        required
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Time</label>
                                        <input 
                                            name="start_time"
                                            type="time"
                                            required
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Duration</label>
                                        <select 
                                            name="duration"
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all cursor-pointer"
                                        >
                                            <option value="1hr">1 Hour</option>
                                            <option value="2hr">2 Hours</option>
                                            <option value="3hr">3 Hours</option>
                                            <option value="4hr">4 Hours</option>
                                            <option value="5hr">5 Hours</option>
                                            <option value="8hr">Full Day (8hrs)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Photo Shoot Type</label>
                                    <select 
                                        name="photo_type"
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all cursor-pointer"
                                    >
                                        <option value="model_shoot">Model Shoot</option>
                                        <option value="product_shoot">Product Shoot</option>
                                        <option value="other">Custom/Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Initial Status</label>
                                    <select 
                                        name="status"
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all cursor-pointer"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Special Notes / Requirements</label>
                                <textarea 
                                    name="query"
                                    rows={3}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-all resize-none"
                                    placeholder="Any specific details for this shoot..."
                                />
                            </div>

                            <div className="pt-4 flex items-center gap-4">
                                <BaseButton 
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-4 border-zinc-100 text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Cancel
                                </BaseButton>
                                <BaseButton 
                                    type="submit"
                                    isLoading={isSubmitting}
                                    className="flex-[2] py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Save Slot
                                </BaseButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>

    );
}
