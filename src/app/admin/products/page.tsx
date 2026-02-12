"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    MoreHorizontal,
    Package,
    IndianRupee,
    Tag,
    Box
} from "lucide-react";

export default function AdminProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from("products")
                .select(`
                    *,
                    categories!left (
                        name
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Failed to delete product");
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20 font-inter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-zinc-500 text-sm font-medium italic">Manage your inventory and store listings.</p>
                </div>

                <Link
                    href="/admin/products/new"
                    className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-black/10"
                >
                    <Plus size={18} />
                    Add New Product
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-4 bg-white border border-zinc-100 rounded-2xl w-full focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-normal shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-white rounded-3xl border border-zinc-100 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <div key={product.id} className="group bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-xl transition-all relative">
                                <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                                    {product.main_image ? (
                                        <img
                                            src={product.main_image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                            <Package size={64} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                        <Link
                                            href={`/admin/products/edit/${product.id}`}
                                            className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-zinc-600 hover:text-black hover:scale-110 transition-all"
                                        >
                                            <Edit size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:scale-110 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-900 shadow-sm">
                                            {product.categories?.name || "General"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-4 border-t border-zinc-50 pt-4">
                                        <div className="flex items-center gap-1 text-black font-bold text-xl">
                                            <span>₹{product.price_offer || product.price_base}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Stock</p>
                                            <p className={`text-xs font-medium ${product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                                {product.stock} Units
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white p-20 rounded-3xl border border-zinc-100 text-center">
                            <Box className="mx-auto text-zinc-100 mb-4" size={64} />
                            <p className="text-zinc-500 font-aesthetic">No products found. Start by adding one!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
