"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { toast } from "sonner";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    MoreHorizontal,
    Package,
    IndianRupee,
    Tag,
    Box,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";

export default function AdminProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [totalCount, setTotalCount] = useState(0);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts();
        }, 400); // Debounce search
        return () => clearTimeout(handler);
    }, [page, searchTerm]);

    async function fetchProducts() {
        setLoading(true);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from("products")
                .select(`
                    *,
                    categories!left (
                        name
                    )
                `, { count: 'exact' });

            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            const { data, error, count } = await query
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;
            setProducts(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error("Error fetching products:", err);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteClick = (id: string) => {
        setProductToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", productToDelete);

            if (error) throw error;
            toast.success("Product deleted successfully");
            setProducts(products.filter(p => p.id !== productToDelete));
            setDeleteModalOpen(false);
            setProductToDelete(null);
        } catch (err) {
            console.error("Error deleting product:", err);
            toast.error("Failed to delete product");
        } finally {
            setIsDeleting(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-8 pb-20 font-inter">
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Product"
                description="Are you sure you want to delete this product? This action cannot be undone."
                loading={isDeleting}
            />
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-80 bg-white rounded-3xl border border-zinc-100 animate-pulse" />)}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.length > 0 ? (
                            products.map((product) => (
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
                                                onClick={() => handleDeleteClick(product.id)}
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
                                <p className="text-zinc-500 font-aesthetic">No products found.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-100 rounded-2xl text-zinc-400 hover:text-black disabled:opacity-30 disabled:hover:text-zinc-400 transition-all active:scale-90"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl text-sm font-bold transition-all active:scale-90 ${page === i + 1
                                            ? "bg-black text-white shadow-lg shadow-black/10 scale-110"
                                            : "bg-white border border-zinc-100 text-zinc-400 hover:text-black"
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-100 rounded-2xl text-zinc-400 hover:text-black disabled:opacity-30 disabled:hover:text-zinc-400 transition-all active:scale-90"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
