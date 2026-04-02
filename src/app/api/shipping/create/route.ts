import { NextResponse } from 'next/server';
import { createShipment } from '@/actions/delhivery';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = await createShipment(body);
        
        if (result.success) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
