import { NextResponse } from "next/server";
import axios from "axios";
import { PDFDocument } from "pdf-lib";
import { verifyAdminAuth } from "@/lib/auth-server";

// Matches Delhivery AWB format: 10–16 digit numeric string
const AWB_REGEX = /^\d{10,16}$/;

// Thermal label dimensions threshold (in points)
const THERMAL_MAX_WIDTH = 350;
const THERMAL_MAX_HEIGHT = 500;

const DELHIVERY_TIMEOUT_MS = 10_000;

const fetchLabel = (baseUrl: string, awb: string, token: string) =>
    axios.get(`${baseUrl}/api/p/packing_slip`, {
        params: { wbns: awb, pdf: "true", pdf_size: "4x6" },
        headers: { Authorization: `Token ${token}` },
        responseType: "arraybuffer",
        timeout: DELHIVERY_TIMEOUT_MS,
    });

const cropIfNeeded = async (buffer: Buffer): Promise<Buffer> => {
    const pdfDoc = await PDFDocument.load(buffer);

    const pageCount = pdfDoc.getPageCount();
    console.log(`[Delhivery Label] Pages in PDF: ${pageCount}`);

    // Try last page first — some Delhivery responses put the label on page 2
    const pageIndex = pageCount > 1 ? pageCount - 1 : 0;
    const page = pdfDoc.getPages()[pageIndex];

    const { width, height } = page.getSize();
    console.log(`[Delhivery Label] Page ${pageIndex} size: ${width.toFixed(1)} x ${height.toFixed(1)} pts`);

    // Already a thermal label — return as-is
    if (width < THERMAL_MAX_WIDTH && height < THERMAL_MAX_HEIGHT) {
        console.log("[Delhivery Label] Already thermal size, skipping crop");
        return buffer;
    }

    // The label content sits in the RIGHT column of the A4 sheet.
    // OFFSET_X = pageWidth - labelWidth - rightMargin
    // These values are calibrated for Delhivery's A4 packing slip layout.
    const LABEL_WIDTH = 288;
    const LABEL_HEIGHT = 432;
    const RIGHT_MARGIN = 10;

    const offsetX = width - LABEL_WIDTH - RIGHT_MARGIN;
    const offsetY = height - LABEL_HEIGHT - RIGHT_MARGIN;

    console.log(`[Delhivery Label] Cropping — offsetX: ${offsetX.toFixed(1)}, offsetY: ${offsetY.toFixed(1)}, w: ${LABEL_WIDTH}, h: ${LABEL_HEIGHT}`);

    page.setMediaBox(offsetX, offsetY, LABEL_WIDTH, LABEL_HEIGHT);
    page.setCropBox(offsetX, offsetY, LABEL_WIDTH, LABEL_HEIGHT);

    // If label was on page 2+, remove all other pages so only the label is returned
    if (pageCount > 1) {
        const labelPageBytes = await pdfDoc.save();
        const singlePageDoc = await PDFDocument.create();
        const [copiedPage] = await singlePageDoc.copyPages(
            await PDFDocument.load(labelPageBytes),
            [0]
        );
        singlePageDoc.addPage(copiedPage);
        return Buffer.from(await singlePageDoc.save());
    }

    return Buffer.from(await pdfDoc.save());
};

const buildPdfResponse = (buffer: Buffer, awb: string) =>
    new Response(new Uint8Array(buffer), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=label-${awb}.pdf`,
            "Cache-Control": "no-store",
        },
    });

export async function GET(request: Request) {
    // Verify admin auth
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;

    // Extract and validate AWB
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb");

    if (!awb) {
        return NextResponse.json({ error: "Missing AWB number" }, { status: 400 });
    }

    if (!AWB_REGEX.test(awb)) {
        return NextResponse.json(
            { error: "Invalid AWB format. Expected 10–16 digit numeric string." },
            { status: 400 }
        );
    }

    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "DELHIVERY_TOKEN missing" }, { status: 500 });
    }

    try {
        // Try primary URL, fall back to secondary — log primary failure for visibility
        let response;
        try {
            response = await fetchLabel("https://track.delhivery.com", awb, token);
        } catch (primaryError) {
            const message =
                primaryError instanceof Error ? primaryError.message : String(primaryError);
            console.warn(`[Delhivery Label] Primary endpoint failed (${message}), trying fallback…`);
            response = await fetchLabel("https://express.delhivery.com", awb, token);
        }

        const contentType = response.headers["content-type"] ?? "";
        console.log(`[Delhivery Label] Response content-type: ${contentType}`);

        // JSON response → extract S3 link and fetch PDF
        if (contentType.includes("application/json")) {
            const json = JSON.parse(Buffer.from(response.data).toString());

            const downloadUrl =
                json.packages?.[0]?.pdf_download_link ?? json.pdf_download_link;

            if (!downloadUrl) {
                console.error("[Delhivery Label] Unexpected JSON shape:", JSON.stringify(json));
                throw new Error("PDF download link missing from Delhivery response");
            }

            console.log(`[Delhivery Label] Fetching PDF from S3: ${downloadUrl}`);

            const pdfResponse = await axios.get(downloadUrl, {
                responseType: "arraybuffer",
                timeout: DELHIVERY_TIMEOUT_MS,
            });

            const cropped = await cropIfNeeded(Buffer.from(pdfResponse.data));
            return buildPdfResponse(cropped, awb);
        }

        // Direct PDF response
        if (contentType.includes("application/pdf")) {
            const cropped = await cropIfNeeded(Buffer.from(response.data));
            return buildPdfResponse(cropped, awb);
        }

        return NextResponse.json(
            { error: "Invalid response from Delhivery label API", contentType },
            { status: 502 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Delhivery Label] Error:", message);
        return NextResponse.json(
            { error: "Failed to download label", details: message },
            { status: 500 }
        );
    }
}