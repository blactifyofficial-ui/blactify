"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ChevronLeft,
    Save,
    Upload,
    X,
    Image as ImageIcon,
    Tag,
    Type,
    IndianRupee,
    Hash,
    AlignLeft,
    Link as LinkIcon,
    ChevronDown,
    Loader2,
    Sparkles
} from "lucide-react";
import ImageCropper from "@/components/admin/ImageCropper";

export default function ProductFormPage({ params }: { params?: Promise<{ id: string }> }) {
    const router = useRouter();
    const productId = params ? use(params).id : null;
    const isEditing = !!productId;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        handle: "",
        price_base: "" as string | number,
        price_offer: "" as string | number,
        category_id: "",
        stock: 100,
        main_image: "",
        image1: "",
        image2: "",
        image3: "",
        size_variants: [] as string[],
        description: ""
    });

    const [newImageUrl, setNewImageUrl] = useState("");
    const [newSize, setNewSize] = useState("");

    // Validation state
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Upload & Cropping state
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const [croppingField, setCroppingField] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null); // Field name currently uploading

    useEffect(() => {
        fetchCategories();
        if (isEditing && productId) {
            fetchProduct();
        }
    }, [isEditing, productId]);

    async function fetchCategories() {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
    }

    async function fetchProduct() {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", productId)
                .single();

            if (error) throw error;
            setFormData({
                id: data.id || "",
                name: data.name || "",
                handle: data.handle || "",
                price_base: data.price_base || "",
                price_offer: data.price_offer || "",
                category_id: data.category_id || "",
                stock: data.stock ?? 0,
                main_image: data.main_image || data.image_url || "",
                image1: data.image1 || "",
                image2: data.image2 || "",
                image3: data.image3 || "",
                size_variants: data.size_variants || [],
                description: data.description || ""
            });
        } catch (err) {
            console.error("Error fetching product:", err);
            toast.error("Failed to fetch product data");
        } finally {
            setLoading(false);
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCroppingImage(reader.result as string);
                setCroppingField(field);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedImageData: string) => {
        if (!croppingField) return;

        const field = croppingField;
        setCroppingImage(null);
        setCroppingField(null);
        setUploading(field);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: JSON.stringify({ image: croppedImageData }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();

            if (data.url) {
                setFormData(prev => ({ ...prev, [field]: data.url }));
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setUploading(null);
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name?.trim()) newErrors.name = "Product name is required";
        if (!isEditing && !formData.id?.trim()) newErrors.id = "Product ID is required";
        if (!formData.price_base) newErrors.price_base = "Base price is required";
        if (!formData.category_id) newErrors.category_id = "Please select a category";
        if (formData.stock === undefined || formData.stock === null) newErrors.stock = "Stock is required";
        if (!formData.main_image) newErrors.main_image = "Main product image is required";
        if (formData.size_variants.length === 0) newErrors.size_variants = "At least one size is required";

        // Handle: kebab-case
        const handleRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (formData.handle && !handleRegex.test(formData.handle)) {
            newErrors.handle = "Handle must be kebab-case (e.g., cool-product-1)";
        }

        // Product ID: p-001 (only if not editing)
        if (!isEditing && formData.id?.trim()) {
            const idRegex = /^p-[0-9]+$/i;
            if (!idRegex.test(formData.id)) {
                newErrors.id = "Product ID must follow 'p-001' format";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fix the validation errors.");
            return;
        }
        setSaving(true);

        try {
            const dataToSave = {
                id: formData.id,
                name: formData.name,
                handle: formData.handle || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                price_base: parseFloat(String(formData.price_base)) || 0,
                price_offer: formData.price_offer ? parseFloat(String(formData.price_offer)) : null,
                category_id: formData.category_id || null,
                stock: formData.stock,
                main_image: formData.main_image || null,
                image1: formData.image1 || null,
                image2: formData.image2 || null,
                image3: formData.image3 || null,
                size_variants: formData.size_variants,
                description: formData.description
            };

            const { error } = isEditing
                ? await supabase.from("products").update(dataToSave).eq("id", productId)
                : await supabase.from("products").insert([dataToSave]);

            if (error) throw error;

            toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");
            router.push("/admin/products");
            router.refresh();
        } catch (err: any) {
            console.error("Error saving product:", {
                message: err.message,
                details: err.details,
                hint: err.hint,
                error: err
            });
            toast.error(err.message || "Failed to save product. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const generateNextId = async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("id")
                .ilike("id", "p-%")
                .order("id", { ascending: false })
                .limit(1);

            if (error) throw error;

            let nextNumber = 1;
            if (data && data.length > 0) {
                const lastId = data[0].id;
                const match = lastId.match(/p-(\d+)/i);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }

            const newId = `p-${String(nextNumber).padStart(3, '0')}`;
            setFormData(prev => ({ ...prev, id: newId }));
            if (errors.id) setErrors(prev => ({ ...prev, id: "" }));
            toast.success(`Suggested ID: ${newId}`);
        } catch (err) {
            console.error("Error generating ID:", err);
            toast.error("Failed to generate ID");
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-inter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-full hover:bg-zinc-50 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Product" : "New Product"}</h2>
                        <p className="text-xs text-zinc-400 font-medium italic">Enter the product details below.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-8">
                {/* Visual Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                        <ImageIcon size={14} />
                        Visuals & Media
                    </h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { key: 'main_image' as const, label: 'Main' },
                                { key: 'image1' as const, label: 'Image 1' },
                                { key: 'image2' as const, label: 'Image 2' },
                                { key: 'image3' as const, label: 'Image 3' }
                            ].map((img) => (
                                <div key={img.key} className="space-y-2">
                                    <div
                                        onClick={() => document.getElementById(`file-${img.key}`)?.click()}
                                        className={`aspect-square bg-zinc-50 rounded-2xl border ${errors.main_image && img.key === 'main_image' ? 'border-red-400' : 'border-zinc-100'} overflow-hidden relative group cursor-pointer hover:border-black/10 transition-all hover:shadow-lg`}
                                    >
                                        <input
                                            type="file"
                                            id={`file-${img.key}`}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileSelect(e, img.key)}
                                        />
                                        {uploading === img.key ? (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-50/80">
                                                <Loader2 className="animate-spin text-zinc-400" size={24} />
                                            </div>
                                        ) : formData[img.key] ? (
                                            <img src={formData[img.key]} alt={img.label} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300 group-hover:text-black/40 transition-colors">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload size={20} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500">Upload</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[8px] text-white font-bold text-center uppercase">
                                            {img.label}
                                        </div>
                                        {formData[img.key] && !uploading && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, [img.key]: "" });
                                                }}
                                                className="absolute top-1 right-1 w-6 h-6 bg-white shadow-lg rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="url"
                                        placeholder={`${img.label} URL...`}
                                        value={formData[img.key]}
                                        onChange={(e) => setFormData({ ...formData, [img.key]: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-100 rounded-xl text-[10px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-zinc-500 font-normal"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Variants Section */}
                <div className={`bg-white p-8 rounded-[2rem] border ${errors.size_variants ? 'border-red-400' : 'border-zinc-100'} shadow-sm space-y-6`}>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                        <Tag size={14} />
                        Variants & Sizes
                    </h3>

                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {formData.size_variants.map((size, index) => (
                                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-lg group">
                                    <span className="text-sm font-bold text-zinc-700">{size}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newSizes = [...formData.size_variants];
                                            newSizes.splice(index, 1);
                                            setFormData({ ...formData, size_variants: newSizes });
                                        }}
                                        className="text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {formData.size_variants.length === 0 && (
                                <p className="text-xs text-zinc-300 italic">No sizes defined. Standard option will be used.</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" size={16} />
                                <select
                                    value={newSize}
                                    onChange={(e) => {
                                        setNewSize(e.target.value);
                                    }}
                                    className="w-full pl-6 pr-10 py-3 bg-zinc-50/50 border border-zinc-100 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-zinc-500 font-medium appearance-none"
                                >
                                    <option value="">Select Size...</option>
                                    {["OneSize", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "no size"].map(sz => (
                                        <option key={sz} value={sz}>{sz}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (newSize && !formData.size_variants.includes(newSize)) {
                                        setFormData({ ...formData, size_variants: [...formData.size_variants, newSize] });
                                        setNewSize("");
                                        if (errors.size_variants) setErrors(prev => ({ ...prev, size_variants: "" }));
                                    }
                                }}
                                className="px-6 bg-zinc-50 text-zinc-400 border border-zinc-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95"
                            >
                                Add size
                            </button>
                        </div>
                    </div>
                    {errors.size_variants && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.size_variants}</p>}
                </div>

                {/* Info Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                        <Type size={14} />
                        Product Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <label className="block sm:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">Product Name</span>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter product title..."
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                                    }}
                                    className={`w-full pl-12 pr-6 py-4 bg-zinc-50/50 border ${errors.name ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-normal`}
                                />
                                {errors.name && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.name}</p>}
                            </div>
                        </label>

                        {!isEditing && (
                            <label className="block">
                                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">Product ID (Unique)</span>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                        <input
                                            type="text"
                                            required
                                            placeholder="p-001, etc."
                                            value={formData.id}
                                            onChange={(e) => {
                                                setFormData({ ...formData, id: e.target.value });
                                                if (errors.id) setErrors(prev => ({ ...prev, id: "" }));
                                            }}
                                            className={`w-full pl-12 pr-6 py-4 bg-zinc-50/50 border ${errors.id ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all uppercase font-semibold`}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generateNextId}
                                        className="px-4 bg-zinc-50 text-zinc-400 border border-zinc-100 rounded-2xl hover:bg-zinc-100 transition-all active:scale-95 flex items-center gap-2 group"
                                        title="Generate next ID"
                                    >
                                        <Sparkles size={16} className="group-hover:text-black transition-colors" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Generate</span>
                                    </button>
                                </div>
                                {errors.id && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.id}</p>}
                            </label>
                        )}

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">Base Price (INR)</span>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                <input
                                    type="number"
                                    required
                                    placeholder="0"
                                    value={formData.price_base}
                                    onChange={(e) => {
                                        setFormData({ ...formData, price_base: e.target.value });
                                        if (errors.price_base) setErrors(prev => ({ ...prev, price_base: "" }));
                                    }}
                                    className={`w-full pl-12 pr-6 py-4 bg-zinc-50/50 border ${errors.price_base ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-bold`}
                                />
                                {errors.price_base && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.price_base}</p>}
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block italic">Offer Price (Optional)</span>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                <input
                                    type="number"
                                    placeholder="Optional"
                                    value={formData.price_offer}
                                    onChange={(e) => setFormData({ ...formData, price_offer: e.target.value })}
                                    className="w-full pl-12 pr-6 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-bold text-green-600"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">Category</span>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                <select
                                    required
                                    value={formData.category_id}
                                    onChange={(e) => {
                                        setFormData({ ...formData, category_id: e.target.value });
                                        if (errors.category_id) setErrors(prev => ({ ...prev, category_id: "" }));
                                    }}
                                    className={`w-full pl-12 pr-10 py-4 bg-zinc-50/50 border ${errors.category_id ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all cursor-pointer font-medium appearance-none`}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" size={16} />
                                {errors.category_id && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.category_id}</p>}
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">SEO Handle</span>
                            <input
                                type="text"
                                placeholder="my-cool-product"
                                value={formData.handle}
                                onChange={(e) => {
                                    setFormData({ ...formData, handle: e.target.value });
                                    if (errors.handle) setErrors(prev => ({ ...prev, handle: "" }));
                                }}
                                className={`w-full px-6 py-4 bg-zinc-50/50 border ${errors.handle ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-normal`}
                            />
                            {errors.handle && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.handle}</p>}
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">Stock Quantity</span>
                            <input
                                type="number"
                                required
                                value={formData.stock}
                                onChange={(e) => {
                                    setFormData({ ...formData, stock: parseInt(e.target.value) });
                                    if (errors.stock) setErrors(prev => ({ ...prev, stock: "" }));
                                }}
                                className={`w-full px-6 py-4 bg-zinc-50/50 border ${errors.stock ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-semibold`}
                            />
                            {errors.stock && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.stock}</p>}
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">Description</span>
                        <textarea
                            rows={4}
                            placeholder="Enter short description..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-normal"
                        />
                    </label>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-black text-white py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl shadow-black/10 text-base font-bold uppercase tracking-widest"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                {isEditing ? "Update Product" : "Publish Product"}
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-5 bg-white border border-zinc-100 text-zinc-500 rounded-2xl flex items-center justify-center hover:bg-zinc-50 transition-all font-bold text-base uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Cropper Modal */}
            {croppingImage && (
                <ImageCropper
                    image={croppingImage}
                    onCrop={handleCropComplete}
                    onCancel={() => {
                        setCroppingImage(null);
                        setCroppingField(null);
                    }}
                    aspectRatio={1}
                />
            )}
        </div>
    );
}
