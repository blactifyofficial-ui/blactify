"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    Tag,
    Plus,
    Trash2,
    X,
    Check,
    AlertCircle,
    Loader2
} from "lucide-react";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        setLoading(true);
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
        setLoading(false);
    }

    const validateName = (name: string) => {
        const regex = /^[A-Za-z\s]{3,30}$/;
        return regex.test(name);
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateName(newCategoryName)) {
            setError("Name must be 3-30 characters (letters and spaces only)");
            return;
        }

        setAdding(true);
        const id = newCategoryName.toLowerCase().replace(/\s+/g, "-");

        try {
            const { error: insertError } = await supabase
                .from("categories")
                .insert([{ id, name: newCategoryName }]);

            if (insertError) throw insertError;

            toast.success("Category added successfully!");
            setNewCategoryName("");
            fetchCategories();
        } catch (err: any) {
            console.error("Error adding category:", err);
            toast.error(err.message || "Failed to add category. Likely a duplicate name.");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? Products in this category might show errors if the category is deleted.")) return;

        try {
            const { error: deleteError } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);

            if (deleteError) throw deleteError;
            toast.success("Category deleted successfully!");
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) {
            console.error("Error deleting category:", err);
            toast.error("Failed to delete category.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 font-inter">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                <p className="text-zinc-500 text-sm font-medium italic">Organize your products into logical groups.</p>
            </div>

            {/* Add Category Form */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleAddCategory} noValidate className="space-y-4">
                    <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">New Category Name</span>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="e.g. Footwear, Accessories"
                                    value={newCategoryName}
                                    onChange={(e) => {
                                        setNewCategoryName(e.target.value);
                                        if (error) setError("");
                                    }}
                                    className={`w-full pl-12 pr-6 py-4 bg-zinc-50/50 border ${error ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium`}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={adding || !newCategoryName}
                                className="px-8 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/10"
                            >
                                {adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={18} />}
                                Add
                            </button>
                        </div>
                        {error && (
                            <div className="mt-3 flex items-center gap-2 text-red-500 text-[10px] font-bold italic animate-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </label>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="p-8 border-b border-zinc-50 bg-zinc-50/30">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Existing Categories ({categories.length})</h3>
                </div>

                <div className="divide-y divide-zinc-50">
                    {loading ? (
                        <div className="p-20 flex items-center justify-center">
                            <Loader2 className="animate-spin text-zinc-200" size={32} />
                        </div>
                    ) : categories.length > 0 ? (
                        categories.map((cat) => (
                            <div key={cat.id} className="p-6 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-black group-hover:border-black/10 transition-all">
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{cat.name}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">{cat.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center">
                            <Tag className="mx-auto text-zinc-100 mb-4" size={48} />
                            <p className="text-zinc-400 font-medium italic">No categories yet. Create your first one above.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
