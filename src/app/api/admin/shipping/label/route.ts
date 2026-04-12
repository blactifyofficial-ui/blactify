import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-server";

/**
 * API Route to download Delhivery Shipping Label as 4x6 PDF
 * GET /api/admin/shipping/label?awb={AWB}
 */
export async function GET(request: Request) {
    // 1. Verify Admin Authentication
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;

    // 2. Extract AWB from query params
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb");

    if (!awb) {
        return NextResponse.json({ error: "Missing AWB number" }, { status: 400 });
    }

    // 3. Get Delhivery Token
    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "Shipping service is not configured (Token missing)" }, { status: 500 });
    }

    try {
        const axios = (await import('axios')).default;
        
        const tryFetchLabel = async (baseUrl: string) => {
            console.log(`[Delhivery Label] Trying ${baseUrl} with wbns=${awb} and pdf_size=4R`);
            return await axios.get(`${baseUrl}/api/p/packing_slip`, {
                params: {
                    wbns: awb,
                    pdf: 'true',
                    pdf_size: '4R'
                },
                headers: {
                    'Authorization': `Token ${token}`
                },
                responseType: 'arraybuffer'
            });
        };

        let response: any;
        try {
            response = await tryFetchLabel('https://track.delhivery.com');
            const snippet = Buffer.from(response.data).toString();
            if (snippet.includes("wbns key missing") || snippet.includes("error")) {
                throw new Error("API returned error in 200 response");
            }
        } catch (e) {
            console.warn("[Delhivery Label] track.delhivery.com failed or returned error, trying express.delhivery.com...");
            response = await tryFetchLabel('https://express.delhivery.com');
        }

        const contentType = response.headers['content-type'] || '';
        let data: any = null;

        // Log response for debugging
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const fullResponseLog = `[Delhivery Debug] ${new Date().toISOString()} Status: ${response.status}, Type: ${contentType}, Headers: ${JSON.stringify(response.headers)}, Body: ${Buffer.from(response.data).toString().substring(0, 5000)}\n`;
            await fs.appendFile(path.join(process.cwd(), 'shipping_error.log'), fullResponseLog);
        } catch (e) {}

        // Define standard 4x6 points
        const THERMAL_WIDTH = 288;
        const THERMAL_HEIGHT = 432;

        const handlePdfResponse = async (buffer: Buffer): Promise<Buffer> => {
            try {
                const { PDFDocument } = await import('pdf-lib');
                const pdfDoc = await PDFDocument.load(buffer);
                const pages = pdfDoc.getPages();
                if (pages.length === 0) return buffer;

                const firstPage = pages[0];
                const { width, height } = firstPage.getSize();

                // If it's already roughly thermal size, don't touch it
                if (width < 350 && height < 500) return buffer;

                // CROP STRATEGY: Target the Top-Left of the A4 page
                // Remember: (0,0) is Bottom-Left.
                const x = 0;
                const y = height - THERMAL_HEIGHT; 

                firstPage.setMediaBox(x, y, THERMAL_WIDTH, THERMAL_HEIGHT);
                firstPage.setCropBox(x, y, THERMAL_WIDTH, THERMAL_HEIGHT);

                const pdfBytes = await pdfDoc.save();
                return Buffer.from(pdfBytes);
            } catch (cropError) {
                console.error("[Delhivery Label] Crop failed, returning original", cropError);
                return buffer;
            }
        };

        // Handle JSON response (which contains the S3 link)
        if (contentType.includes('application/json')) {
            data = JSON.parse(Buffer.from(response.data).toString());
            const downloadUrl = data.packages?.[0]?.pdf_download_link || data.pdf_download_link || data.url;

            if (downloadUrl) {
                console.log(`[Delhivery Label] Following secondary PDF link...`);
                const pdfResponse = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer'
                });
                
                const croppedBuffer = await handlePdfResponse(Buffer.from(pdfResponse.data));
                return new Response(new Uint8Array(croppedBuffer), {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=label-${awb}.pdf`,
                        'Cache-Control': 'no-store, max-age=0'
                    },
                });
            }
        }

        // Handle direct PDF response
        if (contentType.includes('application/pdf')) {
            const croppedBuffer = await handlePdfResponse(Buffer.from(response.data));
            return new Response(new Uint8Array(croppedBuffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=label-${awb}.pdf`,
                    'Cache-Control': 'no-store, max-age=0'
                },
            });
        }

        return NextResponse.json({ 
            error: "Delhivery did not return a valid label PDF", 
            details: `Response Type: ${contentType}. Content: ${Buffer.from(response.data).toString().substring(0, 200)}`
        }, { status: 502 });

    } catch (error: any) {
        console.error("[Delhivery Label Exception]", error.response?.data?.toString() || error.message);
        
        // Log to file for deep debugging if needed
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const logMsg = `[Delhivery Exception] ${new Date().toISOString()} ${error.message}\n`;
            await fs.appendFile(path.join(process.cwd(), 'shipping_error.log'), logMsg);
        } catch (e) {}

        return NextResponse.json({ 
            error: "Failed to retrieve shipping label from Delhivery", 
            details: error.response?.data ? Buffer.from(error.response.data as any).toString().substring(0, 200) : error.message 
        }, { status: 502 });
    }
}
