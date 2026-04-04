import { NextResponse } from 'next/server';
import { createShipment } from '@/actions/delhivery';
import { verifyAdminAuth } from '@/lib/auth-server';

export async function POST(request: Request) {
    const authResult = await verifyAdminAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json();
        const result = await createShipment(body);
        
        if (result.success) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
