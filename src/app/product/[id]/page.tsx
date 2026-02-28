import { Metadata, ResolvingMetadata } from "next";
import { getProduct } from "@/lib/product-fetcher";
import ProductClientPage from "@/components/product/ProductClientPage";
import { notFound } from "next/navigation";

export const revalidate = 120;

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        return {
            title: "Product Not Found",
        };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = product.product_images?.[0]?.url || product.main_image;

    return {
        title: product.name,
        description: `Buy ${product.name} - ${product.categories?.name || "Premium fashion"}. ${product.description || "Meets Timeless Essentials."}`,
        openGraph: {
            title: `${product.name} | Blactify`,
            description: product.description || "Meets Timeless Essentials.",
            url: `https://blactify.com/product/${id}`,
            images: mainImage ? [mainImage, ...previousImages] : previousImages,
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: product.name,
            description: product.description,
            images: mainImage ? [mainImage] : [],
        },
    };
}

import { fetchReviews } from "@/lib/review-sync";
import { getStoreSettings } from "@/app/actions/settings";

export default async function Page({ params }: Props) {
    const { id } = await params;
    const [product, reviews, settings] = await Promise.all([
        getProduct(id),
        fetchReviews(id),
        getStoreSettings()
    ]);

    if (!product) {
        notFound();
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.product_images?.map((img: { url: string }) => img.url) || [product.main_image],
        "description": product.description,
        "sku": product.id,
        "offers": {
            "@type": "Offer",
            "url": `https://blactify.com/product/${id}`,
            "priceCurrency": "INR",
            "price": product.price_offer || product.price_base,
            "availability": (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": "Blactify"
            }
        },
        "brand": {
            "@type": "Brand",
            "name": "Blactify"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductClientPage
                initialProduct={product}
                initialReviews={reviews || []}
                initialSettings={settings}
            />
        </>
    );
}
