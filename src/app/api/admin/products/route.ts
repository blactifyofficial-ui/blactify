import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, handle, price_base, price_offer, category_id, description, variants, images, show_on_home } = body;

        // 1. Insert Product
        const { error: productError } = await supabaseAdmin
            .from("products")
            .insert([{
                id,
                name,
                handle,
                price_base,
                price_offer,
                category_id,
                description,
                show_on_home
            }]);

        if (productError) throw productError;

        // 2. Handle Variants
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                const { data: vData, error: vError } = await supabaseAdmin
                    .from("product_variants")
                    .upsert([{
                        product_id: id,
                        size: variant.size,
                        stock: variant.stock
                    }], { onConflict: 'product_id, size' })
                    .select()
                    .single();

                if (vError) throw vError;

                // Sync Measurements
                if (variant.measurements) {
                    await supabaseAdmin.from("variant_measurements").delete().eq("variant_id", vData.id);

                    const measToInsert = Object.entries(variant.measurements)
                        .filter(([, value]) => value !== "")
                        .map(([typeId, value]) => ({
                            variant_id: vData.id,
                            measurement_type_id: typeId,
                            value: value
                        }));

                    if (measToInsert.length > 0) {
                        const { error: mError } = await supabaseAdmin.from("variant_measurements").insert(measToInsert);
                        if (mError) throw mError;
                    }
                }
            }
        }

        // 3. Handle Images
        if (images && images.length > 0) {
            await supabaseAdmin.from("product_images").delete().eq("product_id", id);
            const { error: imageError } = await supabaseAdmin
                .from("product_images")
                .insert(images.map((img: { url: string; position: number }) => ({ ...img, product_id: id })));
            if (imageError) throw imageError;
        }

        return NextResponse.json({ success: true });
    } catch (dbErr: unknown) {
        return NextResponse.json({ error: dbErr instanceof Error ? dbErr.message : "Failed to create product" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, handle, price_base, price_offer, category_id, description, variants, images, show_on_home } = body;

        // 1. Update Product
        const { error: productError } = await supabaseAdmin
            .from("products")
            .update({
                name,
                handle,
                price_base,
                price_offer,
                category_id,
                description,
                show_on_home
            })
            .eq("id", id);

        if (productError) throw productError;

        // 2. Handle Variants (Sync)
        if (variants) {
            // Get existing to identify deletions
            const { data: existingVariants } = await supabaseAdmin
                .from("product_variants")
                .select("id, size")
                .eq("product_id", id);

            if (existingVariants) {
                const sizesToKeep = variants.map((v: { size: string }) => v.size);
                const variantsToDelete = existingVariants.filter(ev => !sizesToKeep.includes(ev.size));
                if (variantsToDelete.length > 0) {
                    await supabaseAdmin.from("product_variants").delete().in("id", variantsToDelete.map(v => v.id));
                }
            }

            for (const variant of variants) {
                const { data: vData, error: vError } = await supabaseAdmin
                    .from("product_variants")
                    .upsert([{
                        product_id: id,
                        size: variant.size,
                        stock: variant.stock
                    }], { onConflict: 'product_id, size' })
                    .select()
                    .single();

                if (vError) throw vError;

                // Sync Measurements
                await supabaseAdmin.from("variant_measurements").delete().eq("variant_id", vData.id);

                if (variant.measurements) {
                    const measToInsert = Object.entries(variant.measurements)
                        .filter(([, value]) => value !== "")
                        .map(([typeId, value]) => ({
                            variant_id: vData.id,
                            measurement_type_id: typeId,
                            value: value
                        }));

                    if (measToInsert.length > 0) {
                        const { error: mError } = await supabaseAdmin.from("variant_measurements").insert(measToInsert);
                        if (mError) throw mError;
                    }
                }
            }
        }

        // 3. Handle Images
        if (images) {
            // Fetch existing images to identify removals for Cloudinary cleanup
            const { data: existingImages } = await supabaseAdmin
                .from("product_images")
                .select("url")
                .eq("product_id", id);

            if (existingImages && existingImages.length > 0) {
                const newUrls = images.map((img: { url: string }) => img.url);
                const urlsToDelete = existingImages
                    .filter(ei => !newUrls.includes(ei.url))
                    .map(ei => ei.url);

                if (urlsToDelete.length > 0) {
                    // Parallely delete removed images from Cloudinary
                    await Promise.allSettled(urlsToDelete.map(url => deleteFromCloudinary(url)));
                }
            }

            // Update database
            await supabaseAdmin.from("product_images").delete().eq("product_id", id);
            if (images.length > 0) {
                const { error: imageError } = await supabaseAdmin
                    .from("product_images")
                    .insert(images.map((img: { url: string; position: number }) => ({ ...img, product_id: id })));
                if (imageError) throw imageError;
            }
        }

        return NextResponse.json({ success: true });
    } catch (dbErr: unknown) {
        return NextResponse.json({ error: dbErr instanceof Error ? dbErr.message : "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        // 1. Fetch images to delete from Cloudinary
        const { data: images } = await supabaseAdmin
            .from("product_images")
            .select("url")
            .eq("product_id", id);

        if (images && images.length > 0) {
            // Parallely delete images from Cloudinary
            await Promise.allSettled(images.map(img => deleteFromCloudinary(img.url)));
        }

        // 2. Delete the product (cascades or manual deletion of variants handled by DB schema usually)
        const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (dbErr: unknown) {
        return NextResponse.json({ error: dbErr instanceof Error ? dbErr.message : "Failed to delete product" }, { status: 500 });
    }
}
