import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://blactify.com";

    // Static routes
    const routes = [
        "",
        "/shop",
        "/support",
        "/policy/privacy",
        "/policy/shipping",
        "/policy/returns",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    // Dynamic product routes
    try {
        const { data: products } = await supabase
            .from("products")
            .select("id, handle, updated_at");

        const productRoutes = (products || []).map((product) => ({
            url: `${baseUrl}/product/${product.handle || product.id}`,
            lastModified: new Date(product.updated_at || new Date()),
            changeFrequency: "weekly" as const,
            priority: 0.6,
        }));

        return [...routes, ...productRoutes];
    } catch (error) {
        console.error("Error generating sitemap products:", error);
        return routes;
    }
}
