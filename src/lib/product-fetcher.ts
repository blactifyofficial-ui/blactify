import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

export const getProduct = unstable_cache(
    async (id: string) => {
        const { data, error } = await supabase
            .from("products")
            .select("*, categories(name), product_images(*), product_variants(*, variant_measurements(*, measurement_types(*)))")
            .or(`id.eq.${id},handle.eq.${id}`)
            .single();

        if (error) return null;
        return data;
    },
    ["product-detail"], // This is a static key array. Since `id` can vary, Next.js handles it uniquely per request if passing args, but `unstable_cache` key should ideally contain the ID.
    { revalidate: 120, tags: ["products"] }
);

