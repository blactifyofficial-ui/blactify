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
        measurement_types: MeasurementType;
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
    variant_measurements?: VariantMeasurement[];
}

export interface VariantMeasurement {
    id: string;
    variant_id: string;
    measurement_type_id: string;
    value: string;
    measurement_types?: MeasurementType;
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
    product_images?: {
        url: string;
        position: number;
    }[];
    product_variants?: ProductVariant[];

    // Legacy support (allow both for smoother transition)
    main_image?: string | null;
    image1?: string;
    image2?: string;
    image3?: string;
    size_variants?: string[];
    stock?: number;
    show_on_home?: boolean;
}

export interface CustomerDetails {
    name: string;
    email: string;
    phone: string;
    secondary_phone?: string;
}

export interface ShippingAddress {
    address: string;
    apartment?: string;
    city: string;
    state: string;
    pincode: string;
    district?: string;
    firstName?: string;
    lastName?: string;
}

export interface Order {
    id: string;
    payment_id?: string;
    user_id?: string;
    amount: number;
    currency: string;
    items: OrderJsonItem[]; // Standardized JSONB items
    status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'failed';
    shipping_address: ShippingAddress;
    customer_details: CustomerDetails;
    payment_details?: Record<string, unknown>;
    tracking_id?: string;
    created_at: string;
    order_items?: OrderItem[];
}

export interface OrderJsonItem {
    id: string;
    name: string;
    quantity: number;
    price?: number;
    price_base: number;
    price_offer?: number;
    size?: string;
    main_image?: string;
    imageUrl?: string; // Support for different naming in JSONB
    product_images?: { url: string; position: number }[];
    measurements?: Record<string, string>;
}

export interface Ticket {
    id: string;
    user_id: string;
    order_id?: string;
    category: string;
    phone: string;
    message: string;
    status: 'open' | 'responded' | 'closed';
    admin_response?: string;
    responded_at?: string;
    created_at: string;
    profiles?: {
        email: string;
        full_name: string;
    };
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    variant_id?: string;
    quantity: number;
    price_at_purchase: number;
    name: string;
    size?: string;
    main_image?: string;
    created_at?: string;
}
