import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Helper to verify admin status (optional but recommended)
async function verifyAdmin(request: Request) {
    // In a real app, you'd check a session cookie or header here. 
    // For now, since this is called from the admin dashboard which is guarded,
    // we rely on the guard, but server-side verification is best.
    return true;
}

export async function POST(request: Request) {
    try {
        const { name, slug, size_config } = await request.json();

        // 1. Insert Category
        const { data: categoryData, error: insertError } = await supabaseAdmin
            .from("categories")
            .insert([{ name, slug }])
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

        return NextResponse.json(categoryData);
    } catch (err: any) {
        console.error("Category creation error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, name, slug, size_config } = await request.json();

        // 1. Update Category
        const { data: categoryData, error: updateError } = await supabaseAdmin
            .from("categories")
            .update({ name, slug })
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

        return NextResponse.json(categoryData);
    } catch (err: any) {
        console.error("Category update error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


export async function DELETE(request: Request) {
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

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Category deletion error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
