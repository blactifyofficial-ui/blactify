"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Package,
    Box,
    ChevronRight,
} from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Pagination } from "@/components/ui/Pagination";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminProductsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 12;

    const { products, totalCount, loading, refetch } = useAdminProducts({
        page,
        pageSize,
        searchTerm
    });

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const totalPages = Math.ceil(totalCount / pageSize);

    const confirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/products?id=${productToDelete}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Deletion failed");
            }

            toast.success("Product deleted successfully");
            refetch();
            setDeleteModalOpen(false);
        } catch (err: any) {
            toast.error("Could not delete product.");
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <div className="space-y-10 pb-20 font-inter animate-in fade-in duration-700">
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Product"
                description="This will permanently remove the product and all its variations."
                loading={isDeleting}
            />

            <AdminPageHeader
                title="Products"
                subtitle="Manage your store catalog and stock"
            >
                <div className="relative group flex-1 md:flex-none">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-zinc-100 rounded-2xl w-full sm:w-80 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all text-sm font-medium shadow-sm"
                    />
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-black/10 shrink-0"
                >
                    <Plus size={16} strokeWidth={3} />
                    Add Product
                </Link>
            </AdminPageHeader>

            {loading ? (
                <AdminLoading message="Loading products..." />
            ) : (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <div key={product.id} className="group bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-black/5 transition-all duration-700 relative flex flex-col">
                                    <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden">
                                        {(product as any).main_image ? (
                                            <Image
                                                src={(product as any).main_image}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                                <Package size={64} />
                                            </div>
                                        )}

                                        {/* Overlay Actions */}
                                        <div className="absolute top-5 right-5 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
                                            <Link
                                                href={`/admin/products/edit/${product.id}`}
                                                className="w-12 h-12 bg-white/90 backdrop-blur shadow-2xl rounded-full flex items-center justify-center text-zinc-600 hover:text-black hover:scale-110 transition-all border border-zinc-100"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setProductToDelete(product.id);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="w-12 h-12 bg-white/90 backdrop-blur shadow-2xl rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:scale-110 transition-all border border-zinc-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="absolute bottom-5 left-5 z-20">
                                            <span className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/10">
                                                {(product as any).categories?.name || "Uncategorized"}
                                            </span>
                                        </div>

                                        {/* Subtle overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col justify-between">
                                        <div className="mb-6">
                                            <h3 className="font-black text-lg text-black tracking-tight line-clamp-1 group-hover:text-zinc-600 transition-colors">{product.name}</h3>
                                            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mt-1 italic">ID: {product.id.slice(0, 8)}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                                            <div>
                                                <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-1">PRICE</p>
                                                <p className="text-xl font-black tracking-tighter text-black">
                                                    ₹{(product.price_offer || product.price_base).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-1">STOCK</p>
                                                <p className={cn(
                                                    "text-xs font-black uppercase tracking-widest",
                                                    (product as any).stock < 10 ? 'text-red-500 animate-pulse' : 'text-zinc-900'
                                                )}>
                                                    {(product as any).stock} UNITS
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full">
                                <AdminCard className="py-32 text-center">
                                    <Box className="mx-auto text-zinc-50 mb-8 opacity-50" size={80} />
                                    <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">No Products Found</h4>
                                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic leading-loose px-10">
                                        No products found. Try a different search or add a new product.
                                    </p>
                                </AdminCard>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="pt-12 border-t border-zinc-50">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
