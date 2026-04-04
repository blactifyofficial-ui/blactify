import { NextResponse } from 'next/server';
import { trackShipment } from '@/actions/delhivery';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ waybill: string }> }
) {
    try {
        const { waybill } = await params;
        if (!waybill) {
            return NextResponse.json({ error: "Waybill is required" }, { status: 400 });
        }

        const result = await trackShipment(waybill);

        if (result.success) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json({ error: result.message }, { status: 404 });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
