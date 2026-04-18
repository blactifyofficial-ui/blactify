import { NextResponse } from 'next/server';
import { checkPincodeServiceability } from '@/actions/delhivery';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ pincode: string }> }
) {
    try {
        const { pincode } = await params;
        if (!pincode) {
            return NextResponse.json({ error: "Pincode is required" }, { status: 400 });
        }

        const result = await checkPincodeServiceability(pincode);

        if (result.success) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json({ error: result.message }, { status: 404 });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
