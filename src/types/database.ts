export interface MeasurementType {
    id: string;
    name: string;
    created_at?: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    size_config?: string[]; // Deprecated, keep for type compatibility during migration if needed
    category_measurements?: {
        measurement_type: MeasurementType;
    }[];
    created_at?: string;
}

export interface ProductImage {
    id: string;
    product_id: string;
    url: string;
    alt_text?: string;
    position: number;
    created_at?: string;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    size: string;
    stock: number;
    price_override?: number;
    sku?: string;
    created_at?: string;
}

export interface Product {
    id: string;
    name: string;
    handle: string;
    description?: string;
    price_base: number;
    price_offer?: number;
    category_id?: string;
    created_at?: string;
    categories?: {
        name: string;
    };
    category?: string; // Fallback
    tag?: string;

    // Normalized relationships
    product_images?: ProductImage[];
    product_variants?: ProductVariant[];

    // Legacy support (allow both for smoother transition)
    main_image?: string;
    image1?: string;
    image2?: string;
    image3?: string;
    size_variants?: string[];
    stock?: number;
}

export interface Order {
    id: string;
    payment_id?: string;
    user_id?: string;
    amount: number;
    currency: string;
    items: any[]; // Legacy JSONB
    status: string;
    shipping_address: any;
    customer_details: any;
    created_at?: string;
    order_items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    variant_id?: string;
    quantity: number;
    price_at_purchase: number;
    created_at?: string;
}
