import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/types/database";
import { cn } from "@/lib/utils";

interface ProductGridProps {
    products: Product[];
    initialOffset?: number;
}

export function ProductGrid({ products, initialOffset = 0 }: ProductGridProps) {

    return (
        <div className={cn(
            "grid gap-x-4 gap-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700",
            "grid-cols-2 md:grid-cols-4 lg:grid-cols-5"
        )}>
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
