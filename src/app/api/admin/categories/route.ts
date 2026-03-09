import { NextResponse } from "next/server";
export const preferredRegion = "sin1";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminAuth } from "@/lib/auth-server";
import { logAction } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;
    try {
        const { name, slug, size_config, image_url } = await request.json();

        // 1. Insert Category
        const { data: categoryData, error: insertError } = await supabaseAdmin
            .from("categories")
            .insert([{ name, slug, image_url }])
            .select()
            .single();

        if (insertError) throw insertError;
        const categoryId = categoryData.id;

        // 2. Handle Measurements
        if (size_config && size_config.length > 0) {
            // Upsert measurement types
            await supabaseAdmin.from("measurement_types").upsert(
                size_config.map((name: string) => ({ name })),
                { onConflict: 'name' }
            );

            // Get IDs for these types
            const { data: allTypes } = await supabaseAdmin
                .from("measurement_types")
                .select("id, name")
                .in("name", size_config);

            const typeMap = new Map(allTypes?.map(m => [m.name, m.id]));

            // Link to category
            const links = size_config.map((name: string) => {
                const typeId = typeMap.get(name);
                return typeId ? { category_id: categoryId, measurement_type_id: typeId } : null;
            }).filter(Boolean);

            if (links.length > 0) {
                await supabaseAdmin.from("category_measurements").insert(links);
            }
        }

        await logAction({
            action_type: "category_add",
            details: { name, slug },
            user_email: auth.email
        });

        revalidatePath("/", "layout");
        revalidatePath("/shop", "page");
        revalidatePath("/product/[id]", "page");

        return NextResponse.json(categoryData);
    } catch {
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;
    try {
        const { data: categories, error } = await supabaseAdmin
            .from("categories")
            .select(`
                *,
                category_measurements (
                    measurement_types (
                        name
                    )
                )
            `);

        if (error) throw error;

        // Define a type for the nested structure to avoid 'any'
        type CategoryMeasurement = {
            measurement_types: {
                name: string;
            };
        };

        // Flatten the structure for easier consumption
        const formattedCategories = categories.map(category => ({
            ...category,
            size_config: (category.category_measurements as CategoryMeasurement[]).map(cm => cm.measurement_types.name)
        }));

        return NextResponse.json(formattedCategories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;
    try {
        const { id, name, slug, size_config, image_url } = await request.json();

        // 1. Update Category
        const { data: categoryData, error: updateError } = await supabaseAdmin
            .from("categories")
            .update({ name, slug, image_url })
            .eq("id", id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 2. Refresh Measurements
        // First, clear existing links
        await supabaseAdmin.from("category_measurements").delete().eq("category_id", id);

        if (size_config && size_config.length > 0) {
            // Upsert types
            await supabaseAdmin.from("measurement_types").upsert(
                size_config.map((name: string) => ({ name })),
                { onConflict: 'name' }
            );

            // Get IDs
            const { data: allTypes } = await supabaseAdmin
                .from("measurement_types")
                .select("id, name")
                .in("name", size_config);

            const typeMap = new Map(allTypes?.map(m => [m.name, m.id]));

            // Insert new links
            const links = size_config.map((name: string) => {
                const typeId = typeMap.get(name);
                return typeId ? { category_id: id, measurement_type_id: typeId } : null;
            }).filter(Boolean);

            if (links.length > 0) {
                await supabaseAdmin.from("category_measurements").insert(links);
            }
        }

        await logAction({
            action_type: "category_edit",
            details: { id, name, slug },
            user_email: auth.email
        });

        revalidatePath("/", "layout");
        revalidatePath("/shop", "page");
        revalidatePath("/product/[id]", "page");

        return NextResponse.json(categoryData);
    } catch {
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}


export async function DELETE(request: Request) {
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await logAction({
            action_type: "category_delete",
            details: { id },
            user_email: auth.email
        });

        revalidatePath("/", "layout");
        revalidatePath("/shop", "page");
        revalidatePath("/product/[id]", "page");

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
