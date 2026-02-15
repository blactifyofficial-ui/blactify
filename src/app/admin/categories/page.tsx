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
    Loader2,
    Pencil
} from "lucide-react";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSizeFields, setNewSizeFields] = useState<string[]>([]);
    const [currentField, setCurrentField] = useState("");
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        setLoading(true);
        const { data, error } = await supabase
            .from("categories")
            .select(`
                *,
                category_measurements (
                    measurement_types (
                        name
                    )
                )
            `)
            .order("name");

        if (error) {

            toast.error("Failed to load categories");
        }

        // Transform for UI if needed, or just use as is. 
        // We'll flatten the structure for easier display if the UI expects checking 'size_config'
        // But since we are modifying the valid code, let's map it to include a 'size_config' property for compatibility with existing UI rendering
        const formattedData = (data || []).map((cat: any) => ({
            ...cat,
            size_config: cat.category_measurements?.map((cm: any) => cm.measurement_types?.name).filter(Boolean) || cat.size_config || []
        }));

        setCategories(formattedData);
        setLoading(false);
    }

    const validateName = (name: string) => {
        // Allows letters, numbers, spaces, and common punctuation: ' & - ,
        const regex = /^[A-Za-z0-9\s'&,-]{3,50}$/;
        return regex.test(name);
    };

    const resetForm = () => {
        setNewCategoryName("");
        setNewSizeFields([]);
        setEditingId(null);
        setError("");
        setCurrentField("");
    };

    const handleEdit = (category: any) => {
        setEditingId(category.id);
        setNewCategoryName(category.name);
        setNewSizeFields(category.size_config || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateName(newCategoryName)) {
            setError("Name must be 3-50 characters (alphanumeric and ' & - , only)");
            return;
        }

        setAdding(true);
        const slug = newCategoryName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        try {
            let categoryId = editingId;

            if (editingId) {
                // Update existing
                const { error: updateError } = await supabase
                    .from("categories")
                    .update({ name: newCategoryName, slug })
                    .eq("id", editingId);
                if (updateError) throw updateError;
            } else {
                // Create new
                const { data: categoryData, error: insertError } = await supabase
                    .from("categories")
                    .insert([{ name: newCategoryName, slug }])
                    .select()
                    .single();
                if (insertError) throw insertError;
                categoryId = categoryData.id;
            }

            // Sync Measurement Fields
            if (categoryId) {
                // 1. Delete existing links if editing
                if (editingId) {
                    await supabase.from("category_measurements").delete().eq("category_id", categoryId);
                }

                // 2. Handle new fields
                if (newSizeFields.length > 0) {
                    const { data: measurementTypes, error: measError } = await supabase
                        .from("measurement_types")
                        .upsert(
                            newSizeFields.map(name => ({ name })),
                            { onConflict: 'name' }
                        )
                        .select();

                    if (measError) throw measError;

                    const { data: allTypes } = await supabase.from("measurement_types").select("id, name").in("name", newSizeFields);
                    const finalTypeMap = new Map(allTypes?.map(m => [m.name, m.id]));

                    const links = newSizeFields.map(name => {
                        const typeId = finalTypeMap.get(name);
                        if (!typeId) return null;
                        return {
                            category_id: categoryId,
                            measurement_type_id: typeId
                        };
                    }).filter(Boolean);

                    if (links.length > 0) {
                        const { error: linkError } = await supabase
                            .from("category_measurements")
                            .insert(links);
                        if (linkError) throw linkError;
                    }
                }
            }

            toast.success(editingId ? "Category updated successfully!" : "Category added successfully!");
            resetForm();
            fetchCategories();
        } catch (err: any) {

            let message = "Failed to save category.";
            if (err.code === '23505') {
                message = "A category with this name already exists.";
            } else {
                message = err.message || message;
            }
            toast.error(message);
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
            <div className={`bg-white p-8 rounded-[2.5rem] border ${editingId ? 'border-black' : 'border-zinc-100'} shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">{editingId ? 'Edit Category Name' : 'New Category Name'}</span>
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
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 bg-zinc-100 text-zinc-500 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all font-aesthetic"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={adding || !newCategoryName}
                                className="px-8 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/10"
                            >
                                {adding ? <Loader2 className="animate-spin" size={16} /> : (editingId ? <Check size={18} /> : <Plus size={18} />)}
                                {editingId ? 'Update' : 'Add'}
                            </button>
                        </div>
                        {error && (
                            <div className="mt-3 flex items-center gap-2 text-red-500 text-[10px] font-bold italic animate-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </label>

                    {/* Size Fields Section */}
                    <div className="space-y-4 pt-4 border-t border-zinc-50">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block italic">Measurement Fields (Optional)</span>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="e.g. Waist, Rise, Thighs"
                                    value={currentField}
                                    onChange={(e) => setCurrentField(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-zinc-50/50 border border-zinc-100 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (currentField.trim() && !newSizeFields.includes(currentField.trim())) {
                                                setNewSizeFields([...newSizeFields, currentField.trim()]);
                                                setCurrentField("");
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (currentField.trim() && !newSizeFields.includes(currentField.trim())) {
                                            setNewSizeFields([...newSizeFields, currentField.trim()]);
                                            setCurrentField("");
                                        }
                                    }}
                                    className="px-6 bg-zinc-100 text-zinc-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all font-aesthetic"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {newSizeFields.map((field, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest animate-in zoom-in-50 duration-300">
                                        {field}
                                        <button
                                            type="button"
                                            onClick={() => setNewSizeFields(newSizeFields.filter((_, i) => i !== idx))}
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {newSizeFields.length === 0 && (
                                    <p className="text-[10px] text-zinc-400 font-medium italic">No custom measurement fields defined.</p>
                                )}
                            </div>
                        </div>
                    </div>
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
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(cat)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-300 hover:text-black hover:bg-zinc-100 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
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
