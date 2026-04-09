"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Package,
    Box,
    Filter,
    Tag,
    LayoutGrid,
    LayoutList,
} from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Pagination } from "@/components/ui/Pagination";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Product, Category } from "@/types/database";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [selectedCategoryId, setSelectedCategoryId] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'hidden'>("all");
    const [selectedStockStatus, setSelectedStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>("all");
    const [categories, setCategories] = useState<Category[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const pageSize = viewMode === 'grid' ? 12 : 15;

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('*').order('name');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    const { products, totalCount, loading, refetch } = useAdminProducts({
        page,
        pageSize,
        searchTerm,
        categoryId: selectedCategoryId,
        status: selectedStatus,
        stockStatus: selectedStockStatus
    });

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const totalPages = Math.ceil(totalCount / pageSize);

    const confirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`/api/admin/products?id=${productToDelete}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Deletion failed");
            }

            toast.success("Product deleted successfully");
            refetch();
            setDeleteModalOpen(false);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Delete Failed");
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Product"
                description="This will permanently remove the product and all its variations."
                loading={isDeleting}
            />

            <AdminPageHeader
                title={`Products (${totalCount})`}
                subtitle="Manage catalog and stock"
            >
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        {/* Search - Flexible width */}
                        <div className="relative group flex-1 lg:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 pr-4 py-2.5 bg-white border border-zinc-100 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-black/5 transition-all text-xs font-medium shadow-sm"
                            />
                        </div>

                        {/* View Switcher - Visible on top row for mobile */}
                        <div className="flex items-center bg-white border border-zinc-100 p-1 rounded-2xl shadow-sm h-[42px]">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    viewMode === 'grid' ? "bg-black text-white shadow-lg" : "text-zinc-400 hover:text-black"
                                )}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    viewMode === 'list' ? "bg-black text-white shadow-lg" : "text-zinc-400 hover:text-black"
                                )}
                            >
                                <LayoutList size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar scroll-smooth">
                        {/* Category Filter */}
                        <div className="relative shrink-0">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => {
                                    setSelectedCategoryId(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-8 pr-4 py-2.5 bg-white border border-zinc-100 rounded-2xl text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none cursor-pointer shadow-sm min-w-[100px]"
                            >
                                <option value="all">Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="relative shrink-0">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value as 'all' | 'active' | 'hidden');
                                    setPage(1);
                                }}
                                className="pl-8 pr-4 py-2.5 bg-white border border-zinc-100 rounded-2xl text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none cursor-pointer shadow-sm min-w-[90px]"
                            >
                                <option value="all">Status</option>
                                <option value="active">Active</option>
                                <option value="hidden">Hidden</option>
                            </select>
                        </div>

                        {/* Stock Filter */}
                        <div className="relative shrink-0">
                            <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                            <select
                                value={selectedStockStatus}
                                onChange={(e) => {
                                    setSelectedStockStatus(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock');
                                    setPage(1);
                                }}
                                className="pl-8 pr-4 py-2.5 bg-white border border-zinc-100 rounded-2xl text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none cursor-pointer shadow-sm min-w-[90px]"
                            >
                                <option value="all">Stock</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>

                        {/* Add Button - Compact */}
                        <Link
                            href="/admin/products/new"
                            className="flex items-center justify-center gap-1.5 bg-black text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-black/10 shrink-0 ml-auto"
                        >
                            <Plus size={14} strokeWidth={3} />
                            <span>Add Product</span>
                        </Link>
                    </div>
                </div>
            </AdminPageHeader>

            {loading ? (
                <AdminLoading message="Loading products..." />
            ) : (
                <div className="space-y-6">
                    {products.length > 0 ? (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                                    {products.map((product: Product) => (
                                        <div key={product.id} className="group bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-black/5 transition-all duration-700 relative flex flex-col">
                                            <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden">
                                                {product.product_images?.[0]?.url ? (
                                                    <Image
                                                        src={product.product_images[0].url}
                                                        alt={product.name}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                                        <Package size={64} />
                                                    </div>
                                                )}

                                                {/* Overlay Actions */}
                                                <div className="absolute top-2 sm:top-5 right-2 sm:right-5 flex flex-col sm:flex-row gap-1.5 sm:gap-2 sm:lg:translate-y-2 sm:lg:opacity-0 sm:lg:group-hover:translate-y-0 sm:lg:group-hover:opacity-100 transition-all duration-500 z-20">
                                                    <Link
                                                        href={`/admin/products/edit/${product.id}`}
                                                        className="w-8 h-8 sm:w-12 sm:h-12 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-zinc-600 hover:text-black hover:scale-110 transition-all border border-zinc-100"
                                                    >
                                                        <Edit size={14} className="sm:size-[18px]" />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setProductToDelete(product.id);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="w-8 h-8 sm:w-12 sm:h-12 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:scale-110 transition-all border border-zinc-100"
                                                    >
                                                        <Trash2 size={14} className="sm:size-[18px]" />
                                                    </button>
                                                </div>

                                                <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 z-20">
                                                    <span className="bg-black/80 backdrop-blur-md text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/10 truncate max-w-[100px] block">
                                                        {product.categories?.name || "Uncat"}
                                                    </span>
                                                </div>

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            </div>

                                            <div className="p-4 sm:p-8 flex-1 flex flex-col justify-between">
                                                <div className="mb-3 sm:mb-6">
                                                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                                                        <h3 className="font-black text-xs sm:text-lg text-black tracking-tight line-clamp-1 group-hover:text-zinc-600 transition-colors uppercase">{product.name}</h3>
                                                        <div className={cn(
                                                            "w-2 h-2 sm:w-auto sm:px-2 sm:py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter shrink-0",
                                                            (product as Product & { visibility_status: string }).visibility_status === 'active' ? "bg-green-500 sm:bg-green-50 sm:text-green-500" : "bg-amber-500 sm:bg-amber-50 sm:text-amber-500"
                                                        )}>
                                                            <span className="hidden sm:inline">{(product as Product & { visibility_status: string }).visibility_status === 'active' ? "Active" : "Hidden"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[7px] sm:text-[9px] font-black text-zinc-300 uppercase tracking-widest">{product.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 sm:pt-6 border-t border-zinc-50">
                                                    <div>
                                                        <p className="text-[7px] sm:text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-0.5 sm:mb-1">PRICE</p>
                                                        <p className="text-sm sm:text-xl font-black tracking-tighter text-black">
                                                            ₹{(product.price_offer || product.price_base).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[7px] sm:text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-0.5 sm:mb-1">STOCK</p>
                                                        <p className="text-sm sm:text-xl font-black tracking-tighter text-black">
                                                            {product.stock || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 sm:gap-4">
                                    {products.map((product: Product) => (
                                        <div key={product.id} className="group bg-white p-4 sm:p-6 rounded-[2rem] border border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-xl hover:border-black/5 transition-all duration-500 gap-4 sm:gap-0">
                                            <div className="flex items-center gap-4 sm:gap-8">
                                                <div className="relative w-16 h-18 sm:w-20 sm:h-24 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0">
                                                    {product.product_images?.[0]?.url ? (
                                                        <Image
                                                            src={product.product_images[0].url}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                                            <Package size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <h3 className="font-black text-sm sm:text-lg text-black tracking-tight uppercase">{product.name}</h3>
                                                        <div className={cn(
                                                            "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter",
                                                            (product as Product & { visibility_status: string }).visibility_status === 'active' ? "bg-green-50 text-green-500" : "bg-amber-50 text-amber-500"
                                                        )}>
                                                            {(product as Product & { visibility_status: string }).visibility_status === 'active' ? "Active" : "Hidden"}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                                        <span className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.categories?.name || "Uncategorized"}</span>
                                                        <span className="hidden sm:inline text-zinc-200">•</span>
                                                        <span className="text-[8px] sm:text-[10px] font-bold text-zinc-300 uppercase tracking-widest">ID: {product.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-12">
                                                <div className="sm:text-right">
                                                    <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-1">PRICE</p>
                                                    <p className="text-md sm:text-xl font-black tracking-tighter text-black">
                                                        ₹{(product.price_offer || product.price_base).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="sm:text-right">
                                                    <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-1">STOCK</p>
                                                    <p className="text-md sm:text-xl font-black tracking-tighter text-black">
                                                        {product.stock || 0}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Link
                                                        href={`/admin/products/edit/${product.id}`}
                                                        className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-50 sm:bg-white border sm:border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-50 hover:shadow-lg transition-all"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setProductToDelete(product.id);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 sm:bg-white border sm:border-zinc-100 rounded-2xl flex items-center justify-center text-red-500 sm:text-zinc-400 hover:text-red-500 hover:bg-red-50 hover:shadow-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="col-span-full">
                            <AdminCard className="py-32 text-center">
                                <Box className="mx-auto text-zinc-50 mb-8 opacity-50" size={80} />
                                <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">No Products Found</h4>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest leading-loose px-10">
                                    No products found. Try a different search or add a new product.
                                </p>
                            </AdminCard>
                        </div>
                    )}

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
