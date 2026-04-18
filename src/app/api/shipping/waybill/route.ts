import { NextResponse } from 'next/server';
import { fetchWaybill } from '@/actions/delhivery';
import { verifyAdminAuth } from '@/lib/auth-server';

export async function GET(request: Request) {
    const authResult = await verifyAdminAuth(request);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '1');

    try {
        const result = await fetchWaybill(count);
        if (result.success) {
            return NextResponse.json(result.waybills || []);
        } else {
            return NextResponse.json({ error: result.message || "Failed to fetch waybills" }, { status: 400 });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
