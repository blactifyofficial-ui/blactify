"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Zap,
    Plus,
    Trash2,
    Check,
    AlertCircle,
    Loader2,
    Calendar,
    Pencil,
    Lock
} from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Pagination } from "@/components/ui/Pagination";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Drop } from "@/lib/drops-local";

export default function AdminDropsPage() {
    const [drops, setDrops] = useState<Drop[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [publishDate, setPublishDate] = useState("");
    const [formError, setFormError] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const dropsPerPage = 5;

    const fetchDrops = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/drops");
            const data: Drop[] = await res.json();
            // Sort by createdAt desc to show newest first
            const sortedData = data.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            setDrops(sortedData);
        } catch {
            toast.error("Failed to fetch drops");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrops();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setPublishDate("");
        setFormError("");
    };

    const handleEdit = (drop: Drop) => {
        setEditingId(drop.id);
        setName(drop.name);
        // Format for datetime-local input: YYYY-MM-DDThh:mm
        const date = new Date(drop.publishDate);
        const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm");
        setPublishDate(formattedDate);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!name.trim()) {
            setFormError("Name is required");
            return;
        }
        if (!publishDate) {
            setFormError("Publish date is required");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/drops", {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingId,
                    name,
                    publishDate: new Date(publishDate).toISOString()
                })
            });

            if (!res.ok) throw new Error("Failed to save drop");

            toast.success(editingId ? "Drop updated" : "Drop created");
            resetForm();
            fetchDrops();
        } catch {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/drops?id=${deletingId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete drop");

            toast.success("Drop deleted");
            fetchDrops();
            setDeleteModalOpen(false);
        } catch {
            toast.error("Could not delete drop");
        } finally {
            setIsDeleting(false);
        }
    };
    
    const totalPages = Math.ceil(drops.length / dropsPerPage);
    const paginatedDrops = drops.slice((currentPage - 1) * dropsPerPage, currentPage * dropsPerPage);

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Drop"
                description="This will permanently delete this drop. Products associated with it will no longer show it."
                loading={isDeleting}
            />

            <AdminPageHeader
                title="Drops"
                subtitle="Manage scheduled product releases"
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
                {/* Form Side */}
                <div className="lg:col-span-2 sticky top-[72px] lg:top-10 z-30">
                    <AdminCard title={editingId ? "Edit Drop" : "Create New Drop"}>
                        <form onSubmit={handleSubmit} noValidate className="space-y-6">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block italic">Drop Name</span>
                                    <div className="relative">
                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                        <input
                                            type="text"
                                            placeholder="e.g. Eid Drop, Winter Collection"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                if (formError) setFormError("");
                                            }}
                                            className={cn(
                                                "w-full pl-12 pr-6 py-4 bg-zinc-50 border rounded-2xl text-sm font-bold transition-all placeholder:text-zinc-300 focus:outline-none focus:ring-4 focus:ring-black/5",
                                                formError && !name ? 'border-red-500' : 'border-zinc-100 focus:border-black/10'
                                            )}
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block italic">Publish Date & Time</span>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                        <input
                                            type="datetime-local"
                                            value={publishDate}
                                            onChange={(e) => {
                                                setPublishDate(e.target.value);
                                                if (formError) setFormError("");
                                            }}
                                            className={cn(
                                                "w-full pl-12 pr-6 py-4 bg-zinc-50 border rounded-2xl text-sm font-bold transition-all placeholder:text-zinc-300 focus:outline-none focus:ring-4 focus:ring-black/5",
                                                formError && !publishDate ? 'border-red-500' : 'border-zinc-100 focus:border-black/10'
                                            )}
                                        />
                                    </div>
                                </label>

                                {formError && (
                                    <p className="text-[10px] text-red-500 font-bold italic flex items-center gap-1">
                                        <AlertCircle size={12} /> {formError}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 py-4 border border-zinc-100 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving || !name || !publishDate}
                                    className="flex-[2] py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : (editingId ? <Check size={18} /> : <Plus size={18} />)}
                                    {editingId ? 'Update Drop' : 'Create Drop'}
                                </button>
                            </div>
                        </form>
                    </AdminCard>
                </div>

                {/* List Side */}
                <div className="lg:col-span-3">
                    <div className="space-y-4">
                        {loading ? (
                            <AdminLoading message="Loading drops..." />
                        ) : drops.length > 0 ? (
                            <>
                                {paginatedDrops.map((drop) => (
                                    <div key={drop.id} className="group bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-inner flex-shrink-0">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-lg text-black tracking-tight group-hover:translate-x-1 transition-transform duration-500">{drop.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Calendar size={12} className="text-zinc-400" />
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none pt-0.5">
                                                        {format(new Date(drop.publishDate), "MMM dd, yyyy • hh:mm a")}
                                                    </span>
                                                    {drop.createdAt && (
                                                        <>
                                                            <span className="text-[10px] text-zinc-200 px-1">•</span>
                                                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-none pt-0.5 italic">
                                                                Updated {formatDistanceToNow(new Date(drop.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {new Date(drop.publishDate) < new Date() ? (
                                                <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 rounded-xl text-[9px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-100 italic">
                                                    <Lock size={12} /> Published
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(drop)}
                                                        className="w-12 h-12 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeletingId(drop.id);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="w-12 h-12 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    className="pt-6"
                                />
                            </>
                        ) : (
                            <AdminCard className="py-20 text-center">
                                <Zap className="mx-auto text-zinc-50 mb-6 opacity-50" size={64} />
                                <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">No Drops</h4>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic leading-loose px-10">
                                    No drops found. Create one using the form.
                                </p>
                            </AdminCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
