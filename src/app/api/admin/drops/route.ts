import { NextResponse } from 'next/server';
import { getDrops, saveDrops, Drop, isDropLocked } from '@/lib/drops-local';
import { randomUUID } from 'crypto';

export async function GET() {
    const drops = getDrops();
    return NextResponse.json(drops);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, publishDate } = body;

        if (!name || !publishDate) {
            return NextResponse.json({ error: 'Name and publish date are required' }, { status: 400 });
        }

        const drops = getDrops();
        const newDrop: Drop = {
            id: randomUUID(),
            name,
            publishDate,
            createdAt: new Date().toISOString(),
        };

        drops.push(newDrop);
        saveDrops(drops);

        return NextResponse.json(newDrop);
    } catch {
        return NextResponse.json({ error: 'Failed to create drop' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, publishDate } = body;

        if (!id || !name || !publishDate) {
            return NextResponse.json({ error: 'ID, name and publish date are required' }, { status: 400 });
        }

        const drops = getDrops();
        const index = drops.findIndex(d => d.id === id);

        if (index === -1) {
            return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
        }

        if (isDropLocked(drops[index].publishDate)) {
            return NextResponse.json({ error: 'Cannot modify a published drop' }, { status: 403 });
        }

        drops[index] = {
            ...drops[index],
            name,
            publishDate,
        };

        saveDrops(drops);

        return NextResponse.json(drops[index]);
    } catch {
        return NextResponse.json({ error: 'Failed to update drop' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        let drops = getDrops();
        const drop = drops.find(d => d.id === id);
        
        if (drop && isDropLocked(drop.publishDate)) {
            return NextResponse.json({ error: 'Cannot delete a published drop' }, { status: 403 });
        }

        drops = drops.filter(d => d.id !== id);
        saveDrops(drops);

        // Delete all mappings for this drop
        try {
            const { getProductDropMappings, saveProductDropMappings } = await import("@/lib/drops-local");
            let mappings = getProductDropMappings();
            mappings = mappings.filter(m => m.dropId !== id);
            saveProductDropMappings(mappings);
        } catch (e) {
            console.error("Failed to delete mappings on drop deletion", e);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete drop' }, { status: 500 });
    }
}
