"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Tag,
    Plus,
    Trash2,
    X,
    Check,
    AlertCircle,
    Loader2,
    Pencil
} from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Pagination } from "@/components/ui/Pagination";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { Category } from "@/types/database";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";

export default function AdminCategoriesPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { categories, totalCount, loading, refetch } = useAdminCategories({
        page,
        pageSize
    });

    const [adding, setAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSizeFields, setNewSizeFields] = useState<string[]>([]);
    const [currentField, setCurrentField] = useState("");
    const [formError, setFormError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const totalPages = Math.ceil(totalCount / pageSize);

    const validateName = (name: string) => {
        const regex = /^[A-Za-z0-9\s'&,-]{3,50}$/;
        return regex.test(name);
    };

    const resetForm = () => {
        setNewCategoryName("");
        setNewSizeFields([]);
        setEditingId(null);
        setFormError("");
        setCurrentField("");
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setNewCategoryName(category.name);
        setNewSizeFields(category.size_config || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!validateName(newCategoryName)) {
            setFormError("Name must be 3-50 characters (letters, numbers, and ' & - , only)");
            return;
        }

        setAdding(true);
        const slug = newCategoryName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        try {
            const payload = {
                id: editingId,
                name: newCategoryName,
                slug,
                size_config: newSizeFields
            };

            const response = await fetch("/api/admin/categories" + (editingId ? "" : ""), {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to process request");
            }

            toast.success(editingId ? "Category updated" : "New category created", {
                description: `Category saved: ${newCategoryName}`,
            });
            resetForm();
            refetch();
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            let message = error.message || "Failed to save category.";
            if (error.message?.includes('23505') || error.message?.includes('unique constraint')) {
                message = "This category already exists.";
            }
            toast.error(message);
        } finally {
            setAdding(false);
        }
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/categories?id=${categoryToDelete}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Deletion failed");
            }

            toast.success("Category deleted");
            refetch();
            setDeleteModalOpen(false);
        } catch {
            toast.error("Could not delete category.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 font-inter animate-in fade-in duration-700">
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Category"
                description="This will permanently delete the category."
                loading={isDeleting}
            />

            <AdminPageHeader
                title="Categories"
                subtitle="Organize your products into categories"
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
                {/* Form Side - Sticky on both Mobile and Desktop */}
                <div className="lg:col-span-2 sticky top-[72px] lg:top-10 z-30">
                    <AdminCard title={editingId ? "Edit Category" : "Add Category"}>
                        <form onSubmit={handleSubmit} noValidate className="space-y-6">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block italic">Category Name</span>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                        <input
                                            type="text"
                                            placeholder="e.g. Outerwear, Denim"
                                            value={newCategoryName}
                                            onChange={(e) => {
                                                setNewCategoryName(e.target.value);
                                                if (formError) setFormError("");
                                            }}
                                            className={cn(
                                                "w-full pl-12 pr-6 py-4 bg-zinc-50 border rounded-2xl text-sm font-bold transition-all placeholder:text-zinc-300 focus:outline-none focus:ring-4 focus:ring-black/5",
                                                formError ? 'border-red-500' : 'border-zinc-100 focus:border-black/10'
                                            )}
                                        />
                                    </div>
                                    {formError && (
                                        <p className="mt-2 text-[10px] text-red-500 font-bold italic flex items-center gap-1">
                                            <AlertCircle size={12} /> {formError}
                                        </p>
                                    )}
                                </label>

                                <div className="space-y-4 pt-4 border-t border-zinc-50">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 block italic">Size Options</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add size (e.g. S, M, L)..."
                                            value={currentField}
                                            onChange={(e) => setCurrentField(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (currentField.trim() && !newSizeFields.includes(currentField.trim())) {
                                                        setNewSizeFields([...newSizeFields, currentField.trim()]);
                                                        setCurrentField("");
                                                    }
                                                }
                                            }}
                                            className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (currentField.trim() && !newSizeFields.includes(currentField.trim())) {
                                                    setNewSizeFields([...newSizeFields, currentField.trim()]);
                                                    setCurrentField("");
                                                }
                                            }}
                                            className="px-4 bg-zinc-100 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                                        {newSizeFields.map((field, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-black/10 animate-in zoom-in-50">
                                                {field}
                                                <button
                                                    type="button"
                                                    onClick={() => setNewSizeFields(newSizeFields.filter((_, i) => i !== idx))}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 py-4 border border-zinc-100 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all font-aesthetic"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={adding || !newCategoryName}
                                    className="flex-[2] py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                                >
                                    {adding ? <Loader2 className="animate-spin" size={16} /> : (editingId ? <Check size={18} /> : <Plus size={18} />)}
                                    {editingId ? 'Update Category' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </AdminCard>
                </div>

                {/* List Side */}
                <div className="lg:col-span-3">
                    <div className="space-y-4">
                        {loading ? (
                            <AdminLoading message="Loading categories..." />
                        ) : categories.length > 0 ? (
                            <>
                                {categories.map((cat) => (
                                    <div key={cat.id} className="group bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-inner">
                                                <Tag size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-lg text-black tracking-tight group-hover:translate-x-1 transition-transform duration-500">{cat.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    {cat.size_config?.map((s: string) => (
                                                        <span key={s} className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest border border-zinc-100 px-2 py-0.5 rounded-full">
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {(!cat.size_config || cat.size_config.length === 0) && (
                                                        <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest italic">No sizes set</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCategoryToDelete(cat.id);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {totalPages > 1 && (
                                    <div className="pt-6">
                                        <Pagination
                                            currentPage={page}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <AdminCard className="py-20 text-center">
                                <Tag className="mx-auto text-zinc-50 mb-6 opacity-50" size={64} />
                                <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">No Categories</h4>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic leading-loose px-10">
                                    No categories found. Add one using the form.
                                </p>
                            </AdminCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
