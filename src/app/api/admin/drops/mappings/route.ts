import { NextResponse } from 'next/server';
import { getProductDropMappings, saveProductDropMappings } from '@/lib/drops-local';

export async function GET() {
    const mappings = getProductDropMappings();
    return NextResponse.json(mappings);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, dropId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        let mappings = getProductDropMappings();
        // Remove existing mapping for this product
        mappings = mappings.filter(m => m.productId !== productId);
        
        if (dropId) {
            mappings.push({ productId, dropId });
        }
        
        saveProductDropMappings(mappings);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to update mapping' }, { status: 500 });
    }
}
