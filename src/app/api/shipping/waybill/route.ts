import { NextResponse } from 'next/server';
import { fetchWaybill } from '@/actions/delhivery';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '1');

    try {
        const result = await fetchWaybill(count);
        if (result.success) {
            return NextResponse.json(result.waybills || []);
        } else {
            return NextResponse.json({ error: result.message || "Failed to fetch waybills" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
