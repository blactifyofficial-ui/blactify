import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/types/database";

interface ProductGridProps {
    products: Product[];
    initialOffset?: number;
}

export function ProductGrid({ products, initialOffset = 0 }: ProductGridProps) {
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {products.map((product, index) => (
                <ProductCard
                    key={`${product.id}-${initialOffset + index}`}
                    product={product}
                    priority={initialOffset === 0 && index < 4}
                />
            ))}
        </div>
    );
}
