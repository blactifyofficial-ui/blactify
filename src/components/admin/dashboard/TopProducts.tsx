"use client";

import { ShoppingBag } from "lucide-react";
import { AdminCard } from "@/components/admin/AdminUI";

interface ProductSales {
    name: string;
    sales: number;
    revenue: number;
}

interface TopProductsProps {
    products: ProductSales[];
}

export function TopProducts({ products }: TopProductsProps) {
    return (
        <AdminCard
            title="Top Products"
            subtitle="Best selling items this period"
            icon={<ShoppingBag size={18} />}
        >
            <div className="space-y-4">
                {products.length > 0 ? (
                    products.map((product) => (
                        <div key={product.name} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100/50 hover:bg-white hover:shadow-lg transition-all duration-300 group/item">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-[10px] font-black group-hover/item:scale-110 transition-transform">
                                    {product.name[0]}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-black leading-tight">{product.name}</p>
                                    <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">{product.sales} Sales</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-black tracking-tight">₹{product.revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">No Data</p>
                    </div>
                )}
            </div>
        </AdminCard>
    );
}
