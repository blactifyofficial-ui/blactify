"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
    Search,
    Home,
    X,
    Save,
    Loader2,
    Plus,
    Package,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminPageHeader, AdminCard, AdminLoading } from "@/components/admin/AdminUI";
import { toast } from "sonner";

interface HomeProduct {
    id: string;
    name: string;
    home_order: number | null;
    product_images: { url: string }[];
}

export default function HomeProductsPage() {
    const [featuredProducts, setFeaturedProducts] = useState<HomeProduct[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<HomeProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchFeaturedProducts = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/home-products");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setFeaturedProducts(data);
            } else {
                toast.error("Failed to load featured products");
                setFeaturedProducts([]);
            }
        } catch {
            toast.error("Failed to load featured products");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeaturedProducts();
    }, [fetchFeaturedProducts]);

    const handleSearch = useCallback(async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select("id, name, home_order, product_images(url)")
                .ilike("name", `%${term}%`)
                .limit(5);

            if (error) throw error;
            setSearchResults((data as HomeProduct[]) || []);
        } catch {
            toast.error("Search failed");
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, handleSearch]);

    const addToHome = (product: HomeProduct) => {
        if (featuredProducts.length >= 6) {
            toast.error("Maximum 6 products allowed on home screen.");
            return;
        }
        if (featuredProducts.find(p => p.id === product.id)) {
            toast.error("Product already added.");
            return;
        }
        setFeaturedProducts([...featuredProducts, product]);
        setSearchTerm("");
        setSearchResults([]);
    };

    const removeFromHome = (id: string) => {
        setFeaturedProducts(featuredProducts.filter(p => p.id !== id));
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newList = [...featuredProducts];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        setFeaturedProducts(newList);
    };

    const moveDown = (index: number) => {
        if (index === featuredProducts.length - 1) return;
        const newList = [...featuredProducts];
        [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
        setFeaturedProducts(newList);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/home-products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productIds: featuredProducts.map(p => p.id) })
            });

            if (res.ok) {
                toast.success("Home screen products updated!");
            } else {
                const data = await res.json();
                throw new Error(data.error || "Failed to save");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLoading message="Loading home screen settings..." />;

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 font-inter animate-in fade-in duration-700">
            <AdminPageHeader
                title="Home Screen Layout"
                subtitle="Select up to 6 products to feature on your home screen and arrange their order."
            >
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Changes
                </button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Search & Select */}
                <div className="lg:col-span-1 space-y-6">
                    <AdminCard title="Add Products" icon={<Plus size={14} />} subtitle="Search for products to add">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                            />
                        </div>

                        <div className="mt-6 space-y-2">
                            {searching ? (
                                <div className="py-10 flex flex-col items-center justify-center text-zinc-300">
                                    <Loader2 className="animate-spin mb-2" size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Searching...</span>
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToHome(product)}
                                        className="w-full flex items-center gap-3 p-3 bg-white border border-zinc-100 rounded-xl hover:border-black/10 hover:shadow-lg transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 bg-zinc-50 rounded-lg relative overflow-hidden flex-shrink-0">
                                            {product.product_images?.[0]?.url ? (
                                                <Image
                                                    src={product.product_images[0].url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-black truncate">{product.name}</p>
                                            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest truncate">{product.id}</p>
                                        </div>
                                        <Plus className="text-zinc-200 group-hover:text-black transition-colors" size={16} />
                                    </button>
                                ))
                            ) : searchTerm ? (
                                <div className="py-10 text-center text-zinc-300 italic text-[10px] font-black uppercase tracking-widest">
                                    No products found
                                </div>
                            ) : (
                                <div className="py-10 text-center text-zinc-300 italic text-[10px] font-black uppercase tracking-widest">
                                    Start typing to search
                                </div>
                            )}
                        </div>
                    </AdminCard>
                </div>

                {/* Ordering List */}
                <div className="lg:col-span-2 space-y-6">
                    <AdminCard title="Home Screen List" icon={<Home size={14} />} subtitle={`${featuredProducts.length} of 6 products selected`}>
                        {featuredProducts.length > 0 ? (
                            <div className="space-y-4">
                                {featuredProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:border-black/5 transition-all duration-500 group"
                                    >
                                        <div className="text-[10px] font-black text-zinc-200 w-4 group-hover:text-black transition-colors">
                                            {index + 1}
                                        </div>
                                        <div className="w-16 h-16 bg-zinc-50 rounded-xl relative overflow-hidden flex-shrink-0">
                                            {product.product_images?.[0]?.url ? (
                                                <Image
                                                    src={product.product_images[0].url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                                    <Package size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-black truncate">{product.name}</p>
                                            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest truncate">ID: {product.id}</p>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => moveUp(index)}
                                                disabled={index === 0}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-black hover:text-white disabled:opacity-0 transition-all"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveDown(index)}
                                                disabled={index === featuredProducts.length - 1}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-black hover:text-white disabled:opacity-0 transition-all"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeFromHome(product.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all ml-2"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <Home className="mx-auto text-zinc-50 mb-6" size={60} />
                                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest italic">
                                    No products selected for home screen
                                </p>
                            </div>
                        )}
                    </AdminCard>
                </div>
            </div>
        </div>
    );
}
