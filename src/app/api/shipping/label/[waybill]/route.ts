import { NextResponse } from 'next/server';
import { generateLabel } from '@/actions/delhivery';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ waybill: string }> }
) {
    try {
        const { waybill } = await params;
        if (!waybill) {
            return NextResponse.json({ error: "Waybill is required" }, { status: 400 });
        }

        const result = await generateLabel(waybill);

        if (result.success) {
            return NextResponse.json(result.packages);
        } else {
            return NextResponse.json({ error: result.message }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
