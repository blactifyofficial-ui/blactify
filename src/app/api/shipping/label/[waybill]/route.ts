import { NextResponse } from 'next/server';
import { generateLabel } from '@/actions/delhivery';
import { verifyAdminAuth } from '@/lib/auth-server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ waybill: string }> }
) {
    const authResult = await verifyAdminAuth(request);
    if (authResult.error) return authResult.error;

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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
