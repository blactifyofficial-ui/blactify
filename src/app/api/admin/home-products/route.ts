import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("products")
            .select("id, name, home_order, product_images(url)")
            .not("home_order", "is", null)
            .order("home_order", { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { productIds } = await request.json(); // Array of up to 6 product IDs in order

        if (!Array.isArray(productIds) || productIds.length > 6) {
            return NextResponse.json({ error: "Invalid product list. Maximum 6 products allowed." }, { status: 400 });
        }

        // 1. Reset home_order and featured_at for all products that are currently featured
        const { error: resetError } = await supabaseAdmin
            .from("products")
            .update({
                home_order: null,
                show_on_home: false,
                featured_at: null
            })
            .or("home_order.not.is.null,show_on_home.eq.true");

        if (resetError) throw resetError;

        // 2. Update home_order, show_on_home, and featured_at for selected products
        if (productIds.length > 0) {
            const now = new Date().toISOString();
            for (let i = 0; i < productIds.length; i++) {
                const { error: updateError } = await supabaseAdmin
                    .from("products")
                    .update({
                        home_order: i + 1,
                        show_on_home: true,
                        featured_at: now
                    })
                    .eq("id", productIds[i]);

                if (updateError) throw updateError;
            }
        }

        revalidatePath("/");
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
