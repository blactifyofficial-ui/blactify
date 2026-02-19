"use client";

import { useEffect, useState, use, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    ChevronDown,
    Loader2,
    Plus,
    Trash2,
    Crop
} from "lucide-react";
import ImageCropper from "@/components/admin/ImageCropper";
import {
    HANDLE_REGEX,
    PRODUCT_ID_REGEX,
    CATEGORY_NAME_REGEX
} from "@/lib/validation";

interface ProductVariant {
    id?: string;
    size: string;
    stock: number;
    measurements: Record<string, string>; // { type_id: value }
}

export default function ProductFormPage({ params }: { params?: Promise<{ id: string }> }) {
    const router = useRouter();
    const productId = params ? use(params).id : null;
    const isEditing = !!productId;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Record<string, unknown>[]>([]);

    // Main Form Data
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        handle: "",
        price_base: "" as string | number,
        price_offer: "" as string | number,
        category_id: "",
        main_image: "",
        image1: "",
        image2: "",
        image3: "",
        description: "",
        variants: [] as ProductVariant[]
    });

    // Variant Input State
    const [newVariantSize, setNewVariantSize] = useState("");
    const [newVariantStock, setNewVariantStock] = useState<number | string>(10);
    const [newVariantMeasurements, setNewVariantMeasurements] = useState<Record<string, string>>({});

    // Quick add category state
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatSizeFields, setNewCatSizeFields] = useState<string[]>([]);
    const [addingCat, setAddingCat] = useState(false);

    // Validation state
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Upload & Cropping state
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const [croppingField, setCroppingField] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null); // Field name currently uploading


    const fetchCategories = useCallback(async () => {
        const { data } = await supabase
            .from("categories")
            .select(`
                *,
                category_measurements (
                    measurement_types (
                        id,
                        name
                    )
                )
            `)
            .order("name");
        setCategories(data || []);
    }, []);

    const handleQuickAddCategory = async () => {
        if (!newCatName.trim()) return;

        if (!CATEGORY_NAME_REGEX.test(newCatName.trim())) {
            toast.error("Name must be 3-50 characters (alphanumeric and ' & - , only)");
            return;
        }

        setAddingCat(true);

        const slug = newCatName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        try {
            // 1. Create Category
            const { data: categoryData, error: insertError } = await supabase
                .from("categories")
                .insert([{
                    name: newCatName.trim(),
                    slug
                    // size_config deprecated
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // 2. Handle Measurement Fields
            if (newCatSizeFields.length > 0) {
                // A. Upsert types
                const { error: measError } = await supabase
                    .from("measurement_types")
                    .upsert(
                        newCatSizeFields.map(name => ({ name })),
                        { onConflict: 'name' }
                    );
                if (measError) throw measError;

                // B. Get IDs
                const { data: allTypes } = await supabase.from("measurement_types").select("id, name").in("name", newCatSizeFields);
                const typeMap = new Map(allTypes?.map(m => [m.name, m.id]));

                // C. Link
                const links = newCatSizeFields.map(name => {
                    const typeId = typeMap.get(name);
                    if (!typeId) return null;
                    return {
                        category_id: categoryData.id,
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

            toast.success("Category added!");
            await fetchCategories();
            setFormData(prev => ({ ...prev, category_id: categoryData.id }));
            setNewCatName("");
            setNewCatSizeFields([]);
            setShowQuickAdd(false);
        } catch (err: unknown) {

            let message = "Failed to add category.";
            if (err instanceof Error) {
                if ('code' in err && err.code === '23505') {
                    message = "A category with this name already exists.";
                } else {
                    message = err.message || message;
                }
            }
            toast.error(message);
        } finally {
            setAddingCat(false);
        }
    };

    const fetchProduct = useCallback(async () => {
        try {
            // Fetch product and its variants & images
            const { data, error } = await supabase
                .from("products")
                .select(`
                    *,
                    product_variants (
                        id,
                        size,
                        stock,
                        variant_measurements (
                            measurement_type_id,
                            value
                        )
                    ),
                    product_images (
                        url,
                        position
                    )
                `)
                .eq("id", productId)
                .single();

            if (error) throw error;

            // Map variants from DB
            const loadedVariants: ProductVariant[] = data.product_variants && data.product_variants.length > 0
                ? (data.product_variants as Record<string, unknown>[]).map((v) => ({
                    id: v.id,
                    size: v.size,
                    stock: v.stock,
                    measurements: (v.variant_measurements as Record<string, unknown>[] || []).reduce((acc: Record<string, string>, m: Record<string, unknown>) => {
                        acc[String((m as Record<string, unknown>).measurement_type_id)] = String((m as Record<string, unknown>).value);
                        return acc;
                    }, {}) || {}
                }))
                : (data.size_variants || []).map((s: string) => ({ size: s, stock: 0, measurements: {} }));

            // Map images from DB
            const images = (data.product_images as Record<string, unknown>[]) || [];
            const mainImg = images.find((img) => img.position === 0);
            const img1 = images.find((img: Record<string, unknown>) => (img.position as number) === 1);
            const img2 = images.find((img: Record<string, unknown>) => (img.position as number) === 2);
            const img3 = images.find((img: Record<string, unknown>) => (img.position as number) === 3);

            setFormData({
                id: (data.id || "") as string,
                name: (data.name || "") as string,
                handle: (data.handle || "") as string,
                price_base: (data.price_base || "") as string | number,
                price_offer: (data.price_offer || "") as string | number,
                category_id: (data.category_id || "") as string,
                main_image: (mainImg?.url || "") as string,
                image1: (img1?.url || "") as string,
                image2: (img2?.url || "") as string,
                image3: (img3?.url || "") as string,
                description: (data.description || "") as string,
                variants: loadedVariants
            });
        } catch {
            toast.error("Failed to fetch product data");
        } finally {
            setLoading(false);
        }
    }, [productId]);

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

    const handleRecrop = (url: string, field: string) => {
        if (!url) return;
        setCroppingImage(url);
        setCroppingField(field);
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
        } catch {

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
        if (!formData.main_image) newErrors.main_image = "Main product image is required";

        // Handle: kebab-case
        if (formData.handle && !HANDLE_REGEX.test(formData.handle)) {
            newErrors.handle = "Handle must be kebab-case (e.g., cool-product-1)";
        }

        // Product ID: p-001 (only if not editing)
        if (!isEditing && formData.id?.trim()) {
            if (!PRODUCT_ID_REGEX.test(formData.id)) {
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
            const finalId = isEditing ? productId : formData.id;

            // Prepare images
            const images = [];
            if (formData.main_image) images.push({ url: formData.main_image, position: 0 });
            if (formData.image1) images.push({ url: formData.image1, position: 1 });
            if (formData.image2) images.push({ url: formData.image2, position: 2 });
            if (formData.image3) images.push({ url: formData.image3, position: 3 });

            const payload = {
                id: finalId,
                name: formData.name,
                handle: formData.handle || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                price_base: parseFloat(String(formData.price_base)) || 0,
                price_offer: formData.price_offer ? parseFloat(String(formData.price_offer)) : null,
                category_id: formData.category_id || null,
                description: formData.description,
                variants: formData.variants,
                images: images
            };

            const response = await fetch("/api/admin/products", {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save product");
            }

            toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");
            router.push("/admin/products");
            router.refresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save product. Please try again.");
        } finally {
            setSaving(false);
        }
    };
    const generateNextId = useCallback(async () => {
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
        } catch {
            toast.error("Failed to generate ID");
        }
    }, [errors.id]);

    useEffect(() => {
        fetchCategories();
        if (isEditing && productId) {
            fetchProduct();
        } else if (!isEditing) {
            generateNextId();
        }
    }, [isEditing, productId, fetchCategories, fetchProduct, generateNextId]);

    const addVariant = () => {
        if (!newVariantSize.trim()) return;
        // Check for duplicate size
        if (formData.variants.some(v => v.size.toLowerCase() === newVariantSize.trim().toLowerCase())) {
            toast.error("Size already exists!");
            return;
        }

        const newVariant: ProductVariant = {
            size: newVariantSize.trim(),
            stock: Number(newVariantStock) || 0,
            measurements: { ...newVariantMeasurements }
        };

        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, newVariant]
        }));

        setNewVariantSize("");
        setNewVariantStock(10); // Reset to default
        setNewVariantMeasurements({});
    };

    const removeVariant = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const updateVariantStock = (index: number, newStock: string) => {
        const stockVal = parseInt(newStock) || 0;
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === index ? { ...v, stock: stockVal } : v)
        }));
    };

    const updateVariantMeasurement = (index: number, typeId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === index ? {
                ...v,
                measurements: { ...v.measurements, [typeId]: value }
            } : v)
        }));
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
                        <h2 className="text-2xl font-bold tracking-tight text-black">{isEditing ? "Edit Product" : "New Product"}</h2>
                        <p className="text-xs text-zinc-600 font-medium italic">Enter the product details below.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-8">
                {/* 1. Category Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 flex items-center gap-2">
                        <Tag size={14} />
                        Product Category
                    </h3>
                    <label className="block">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 block italic">Category</span>
                            <button
                                type="button"
                                onClick={() => setShowQuickAdd(!showQuickAdd)}
                                className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                            >
                                {showQuickAdd ? "Cancel" : "Add New"}
                            </button>
                        </div>
                        {showQuickAdd ? (
                            <div className="space-y-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Category Name..."
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-white border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        disabled={addingCat || !newCatName.trim()}
                                        onClick={handleQuickAddCategory}
                                        className="px-4 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center justify-center min-w-[80px]"
                                    >
                                        {addingCat ? <Loader2 className="animate-spin" size={14} /> : "Save"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                <select
                                    required
                                    value={formData.category_id}
                                    onChange={(e) => {
                                        setFormData({ ...formData, category_id: e.target.value });
                                        if (errors.category_id) setErrors(prev => ({ ...prev, category_id: "" }));
                                    }}
                                    className={`w-full pl-12 pr-10 py-4 bg-zinc-50 border ${errors.category_id ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all cursor-pointer font-medium appearance-none`}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat: Record<string, unknown>) => (
                                        <option key={cat.id as string} value={cat.id as string}>{cat.name as string}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" size={16} />
                                {errors.category_id && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.category_id}</p>}
                            </div>
                        )}
                    </label>
                </div>

                {/* 2. Product Information */}
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 flex items-center gap-2">
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
                                    className={`w-full pl-12 pr-6 py-4 bg-zinc-50 border ${errors.name ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-normal placeholder:text-zinc-400`}
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
                                            className={`w-full pl-12 pr-6 py-4 bg-zinc-50 border ${errors.id ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all uppercase font-semibold placeholder:text-zinc-400`}
                                        />
                                    </div>
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
                                    className={`w-full pl-12 pr-6 py-4 bg-zinc-50 border ${errors.price_base ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-bold placeholder:text-zinc-400`}
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
                                    className="w-full pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-bold text-green-600 placeholder:text-zinc-400"
                                />
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
                                className={`w-full px-6 py-4 bg-zinc-50 border ${errors.handle ? 'border-red-400' : 'border-zinc-100'} rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-normal placeholder:text-zinc-400`}
                            />
                            {errors.handle && <p className="text-[10px] text-red-500 mt-1 font-bold italic ml-2">{errors.handle}</p>}
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block italic">Description</span>
                        <textarea
                            rows={4}
                            placeholder="Enter short description..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-normal placeholder:text-zinc-400"
                        />
                    </label>
                </div>

                {/* 3. Variants & Stock */}
                <div className={`bg-white p-8 rounded-[2rem] border ${errors.variants ? 'border-red-400' : 'border-zinc-100'} shadow-sm space-y-6`}>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 flex items-center gap-2">
                        <Tag size={14} />
                        Variants & Stock
                    </h3>

                    <div className="space-y-6">
                        {/* Variant List Table */}
                        {formData.variants.length > 0 ? (
                            <div className="border border-zinc-100 rounded-xl overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-50 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Size</th>
                                            <th className="px-4 py-3">Stock</th>
                                            {/* Dynamic Measurement Headers */}
                                            {((categories.find(c => String(c.id) === formData.category_id)?.category_measurements as Record<string, unknown>[]) || []).map((cm: Record<string, unknown>) => (
                                                <th key={(cm.measurement_types as Record<string, unknown>).id as string} className="px-4 py-3 whitespace-nowrap">
                                                    {(cm.measurement_types as Record<string, unknown>).name as string}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {formData.variants.map((variant, index) => (
                                            <tr key={index} className="group hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-4 py-3 font-bold">{variant.size}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={variant.stock}
                                                        onChange={(e) => updateVariantStock(index, e.target.value)}
                                                        className="w-20 px-3 py-1 bg-white border border-zinc-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                                    />
                                                </td>
                                                {/* Dynamic Measurement Inputs */}
                                                {((categories.find(c => String(c.id) === formData.category_id)?.category_measurements as Record<string, unknown>[]) || []).map((cm: Record<string, unknown>) => (
                                                    <td key={(cm.measurement_types as Record<string, unknown>).id as string} className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={variant.measurements[(cm.measurement_types as Record<string, unknown>).id as string] || ""}
                                                            onChange={(e) => updateVariantMeasurement(index, (cm.measurement_types as Record<string, unknown>).id as string, e.target.value)}
                                                            className="w-20 px-3 py-1 bg-white border border-zinc-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index)}
                                                        className="text-zinc-300 hover:text-red-500 transition-colors p-2"
                                                        title="Remove variant"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                <p className="text-zinc-400 text-sm italic">No variants added yet.</p>
                            </div>
                        )}

                        {/* Add New Variant */}
                        <div className="flex flex-col gap-4 bg-zinc-50 p-6 rounded-xl border border-zinc-100 shadow-sm animate-in zoom-in-95 duration-300">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="space-y-1 flex-1 min-w-[120px]">
                                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest pl-1">Size</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. XL, 32, OneSize"
                                        value={newVariantSize}
                                        onChange={(e) => setNewVariantSize(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-zinc-700 font-medium"
                                    />
                                </div>

                                <div className="space-y-1 w-full sm:w-32">
                                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest pl-1">Stock</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Qty"
                                        value={newVariantStock}
                                        onChange={(e) => setNewVariantStock(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Measurement Inputs for New Variant */}
                            {((categories.find(c => String(c.id) === formData.category_id)?.category_measurements as Record<string, unknown>[]) || []).length > 0 && (
                                <div className="pt-2">
                                    <h4 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest pl-1 mb-2">Measurements</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {((categories.find(c => String(c.id) === formData.category_id)?.category_measurements as Record<string, unknown>[]) || []).map((cm: Record<string, unknown>) => (
                                            <div key={(cm.measurement_types as Record<string, unknown>).id as string} className="space-y-1 w-full sm:w-32">
                                                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest pl-1">{(cm.measurement_types as Record<string, unknown>).name as string}</span>
                                                <input
                                                    type="text"
                                                    placeholder="Val"
                                                    value={newVariantMeasurements[(cm.measurement_types as Record<string, unknown>).id as string] || ""}
                                                    onChange={(e) => setNewVariantMeasurements({ ...newVariantMeasurements, [(cm.measurement_types as Record<string, unknown>).id as string]: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={addVariant}
                                disabled={!newVariantSize}
                                className="w-full px-6 py-4 bg-black text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/5 mt-2"
                            >
                                <Plus size={16} />
                                Add Variant
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Visual Section */}
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
                                            <Image
                                                src={formData[img.key]}
                                                alt={img.label}
                                                fill
                                                sizes="128px"
                                                className="object-cover"
                                            />
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
                                            <div className="absolute top-1 right-1 flex flex-col gap-1 z-10 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({ ...formData, [img.key]: "" });
                                                    }}
                                                    className="w-6 h-6 bg-white shadow-lg rounded-full flex items-center justify-center text-red-500"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRecrop(formData[img.key] as string, img.key);
                                                    }}
                                                    className="w-6 h-6 bg-white shadow-lg rounded-full flex items-center justify-center text-black"
                                                    title="Recrop image"
                                                >
                                                    <Crop size={12} />
                                                </button>
                                            </div>
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
