import { supabase } from "@/lib/supabase";
import { cache } from "react";

export const getProduct = cache(async (id: string) => {
    const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), product_images(*), product_variants(*, variant_measurements(*, measurement_types(*)))")
        .or(`id.eq.${id},handle.eq.${id}`)
        .single();

    if (error) return null;
    return data;
});
