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
    Pencil,
    Upload,
    Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Pagination } from "@/components/ui/Pagination";
import ImageCropper from "@/components/admin/ImageCropper";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { Category } from "@/types/database";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";
import { CategoryNameSchema } from "@/lib/validation";
import { auth } from "@/lib/firebase";


export default function AdminCategoriesPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { categories, totalCount, loading, refetch } = useAdminCategories({
        page,
        pageSize
    });

    const [adding, setAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newSizeFields, setNewSizeFields] = useState<string[]>([]);
    const [currentField, setCurrentField] = useState("");
    const [formError, setFormError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [productsModalOpen, setProductsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const handleShowProducts = (cat: Category) => {
        setSelectedCategory(cat);
        setProductsModalOpen(true);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCroppingImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedImageData: string) => {
        setCroppingImage(null);
        setUploadingImage(true);

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/upload", {
                method: "POST",
                body: JSON.stringify({ image: croppedImageData }),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            const data = await res.json();

            if (data.url) {
                setNewImageUrl(data.url);
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch {
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
        }
    };

    const validateName = (name: string) => {
        return CategoryNameSchema.safeParse(name).success;
    };

    const resetForm = () => {
        setNewCategoryName("");
        setNewImageUrl("");
        setNewSizeFields([]);
        setEditingId(null);
        setFormError("");
        setCurrentField("");
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setNewCategoryName(category.name);
        setNewImageUrl(category.image_url || "");
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
                image_url: newImageUrl,
                size_config: newSizeFields
            };

            const token = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/admin/categories" + (editingId ? "" : ""), {
                method: editingId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to process request");
            }

            // Categories are now logged on the server within the API route
            // removed logAction call from client to prevent spoofing

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
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`/api/admin/categories?id=${categoryToDelete}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Deletion failed");
            }

            // Categories are now logged on the server within the API route
            // removed logAction call from client to prevent spoofing

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
        <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            {croppingImage && (
                <ImageCropper
                    image={croppingImage}
                    onCrop={handleCropComplete}
                    onCancel={() => setCroppingImage(null)}
                    aspectRatio={4 / 5}
                />
            )}

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
                                    <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 mb-2 block">Category Name</span>
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
                                        <p className="mt-2 text-[10px] text-red-500 font-bold flex items-center gap-1">
                                            <AlertCircle size={12} /> {formError}
                                        </p>
                                    )}
                                </label>

                                <div className="space-y-4 pt-4 border-t border-zinc-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 block">Category Image</span>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="relative w-24 h-32 bg-zinc-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-200 overflow-hidden group">
                                            {newImageUrl ? (
                                                <>
                                                    <Image src={newImageUrl} alt="Category" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <label className="cursor-pointer p-2 hover:scale-110 transition-transform">
                                                            <Upload className="text-white" size={20} />
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploadingImage} />
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-zinc-400 hover:text-black transition-colors">
                                                    {uploadingImage ? <Loader2 className="animate-spin mb-2" size={20} /> : <ImageIcon className="mb-2 opacity-50" size={24} />}
                                                    <span className="text-[8px] font-bold uppercase tracking-wide">{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploadingImage} />
                                                </label>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-[10px] text-zinc-400 font-medium">Upload a high-quality vertical image (4:5 ratio) representing this category.</p>
                                            {newImageUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setNewImageUrl("")}
                                                    className="text-[9px] font-bold text-red-500 uppercase tracking-wide hover:text-red-600 transition-colors"
                                                >
                                                    Remove Image
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-zinc-50">
                                    <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 block">Measurement Fields</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. Waist, Length..."
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
                                            className="px-4 bg-zinc-100 text-zinc-500 rounded-xl text-[9px] font-semibold uppercase tracking-wide hover:bg-zinc-200 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                                        {newSizeFields.map((field, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-[9px] font-semibold uppercase tracking-wide shadow-lg shadow-black/10 animate-in zoom-in-50">
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
                                        className="flex-1 py-4 border border-zinc-100 text-zinc-400 rounded-2xl text-[10px] font-semibold uppercase tracking-wide hover:bg-zinc-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={adding || !newCategoryName}
                                    className="flex-[2] py-4 bg-black text-white rounded-2xl text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
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
                                <div 
                                    key={cat.id} 
                                    onClick={() => handleShowProducts(cat)}
                                    className="group bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 flex items-center justify-between cursor-pointer"
                                >
                                        <div className="flex items-center gap-5">
                                            {cat.image_url ? (
                                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                                                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-inner flex-shrink-0">
                                                    <Tag size={20} />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-500">
                                                    <p className="font-semibold text-lg text-black tracking-tight">{cat.name}</p>
                                                    <span className="bg-zinc-100 text-zinc-400 group-hover:bg-black group-hover:text-white transition-all duration-700 text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-tighter">
                                                        {cat.product_count || 0} {cat.product_count === cat.total_product_count ? "Products" : "Active"}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 mt-1">
                                                    {cat.size_config?.map((s: string) => (
                                                        <span key={s} className="text-[8px] font-bold text-zinc-400 uppercase tracking-wide border border-zinc-100 px-2 py-0.5 rounded-full">
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {(!cat.size_config || cat.size_config.length === 0) && (
                                                        <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-wide">No sizes set</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(cat);
                                                }}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                <h4 className="text-zinc-900 font-semibold uppercase tracking-wide text-sm mb-2">No Categories</h4>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wide leading-loose px-10">
                                    No categories found. Add one using the form.
                                </p>
                            </AdminCard>
                        )}
                    </div>
                </div>
            </div>

            <CategoryProductsModal
                isOpen={productsModalOpen}
                onClose={() => setProductsModalOpen(false)}
                category={selectedCategory}
            />
        </div>
    );
}

function CategoryProductsModal({ isOpen, onClose, category }: { isOpen: boolean, onClose: () => void, category: Category | null }) {
    const isClient = typeof window !== 'undefined';
    if (!isClient || !category) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-[120] flex items-center justify-center p-4 transition-all duration-500",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}>
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500"
                onClick={onClose}
            />
            <div className={cn(
                "relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden transform transition-all duration-500 flex flex-col max-h-[85vh]",
                isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
            )}>
                {/* Header */}
                <div className="px-8 py-7 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 sticky top-0 z-10 backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-semibold text-black tracking-tight leading-none mb-1">{category.name}</h2>
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                            {category.total_product_count || 0} Products in database • {category.product_count || 0} Active
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-full hover:bg-zinc-50 transition-colors shadow-sm"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30">
                    {category.products && category.products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {category.products.map((prod) => (
                                <div key={prod.id} className="bg-white p-4 rounded-3xl border border-zinc-100 flex items-center gap-4 group hover:border-black/20 transition-all duration-300 shadow-sm hover:shadow-md">
                                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-50 shadow-inner flex-shrink-0">
                                        {prod.image_url ? (
                                            <Image src={prod.image_url} alt={prod.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-xs text-black truncate">{prod.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-semibold text-black">₹{prod.price_offer || prod.price_base}</span>
                                            {prod.price_offer && prod.price_base > prod.price_offer && (
                                                <span className="text-[9px] font-bold text-zinc-400 line-through">₹{prod.price_base}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-tighter self-start",
                                        prod.is_hidden ? "bg-amber-50 text-amber-500" : (prod.out_of_stock_at ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500")
                                    )}>
                                        {prod.is_hidden ? "Scheduled" : (prod.out_of_stock_at ? "Hidden / OOS" : "Active")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-zinc-400 gap-3">
                            <Tag size={40} className="text-zinc-100" />
                            <p className="text-sm font-bold uppercase tracking-wide text-zinc-200">Empty Category</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
