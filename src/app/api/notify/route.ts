import { NextResponse } from "next/server";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";



export async function POST(req: Request) {
    try {
        const { order } = await req.json();
        console.log("🔔 Notification Request Received for Order:", order.id);

        // Send Email Notification
        if (!SELLER_CONFIG.resendApiKey) {
            console.warn("⚠️ Resend API Key is missing. Skipping email.");
            return NextResponse.json({ success: false, error: "Resend API key missing" });
        }

        const resend = new Resend(SELLER_CONFIG.resendApiKey);
        console.log("📨 Sending Email to:", SELLER_CONFIG.email);

        const result = await resend.emails.send({
            from: "Blactify <onboarding@resend.dev>",
            to: [SELLER_CONFIG.email],
            subject: `New Order Received: #${order.id}`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eeeeee; border-radius: 12px; overflow: hidden; color: #333333;">
                    <div style="background-color: #000000; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: 0.2em; font-size: 24px; font-weight: 800;">
                            BLACTIFY
                        </h1>
                    </div>
                    
                    <div style="padding: 40px;">
                        <div style="margin-bottom: 30px;">
                            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #111111; text-transform: uppercase; letter-spacing: 0.05em;">New Order Received</h2>
                            <p style="margin: 0; color: #666666; font-size: 14px;">Order ID: <span style="font-family: monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">#${order.id}</span></p>
                        </div>

                        <div style="border-top: 1px solid #eeeeee; padding-top: 30px; margin-bottom: 30px;">
                            <h3 style="margin: 0 0 20px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #999999;">Order Summary</h3>
                            
                            <table style="width: 100%; border-collapse: collapse;">
                                ${order.items.map((item: any) => {
                const price = item.price_offer || item.price_base || 0;
                const itemTotal = price * item.quantity;
                const imageUrl = item.product_images?.[0]?.url || item.main_image || "https://blactify.com/placeholder.jpg";

                return `
                                        <tr>
                                            <td style="padding-bottom: 20px; width: 80px;">
                                                <div style="width: 70px; height: 90px; background-color: #f9f9f9; border-radius: 6px; overflow: hidden; border: 1px solid #f0f0f0;">
                                                    <img src="${imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                                                </div>
                                            </td>
                                            <td style="padding: 0 15px 20px 15px; vertical-align: middle;">
                                                <div style="font-weight: 700; color: #111111; font-size: 14px; text-transform: uppercase; margin-bottom: 4px;">${item.name}</div>
                                                <div style="font-size: 12px; color: #888888;">
                                                    ${item.size ? `Size: ${item.size.toUpperCase()} &nbsp;•&nbsp; ` : ""}
                                                    Qty: ${item.quantity}
                                                </div>
                                            </td>
                                            <td style="padding-bottom: 20px; text-align: right; vertical-align: middle; font-weight: 700; color: #111111; font-size: 14px;">
                                                ₹${itemTotal.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    `;
            }).join("")}
                            </table>

                            <div style="border-top: 1px dotted #eeeeee; padding-top: 15px; margin-top: 10px;">
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="font-size: 18px; font-weight: 800; color: #111111; text-transform: uppercase; letter-spacing: 0.05em;">Total Amount</td>
                                        <td style="text-align: right; font-size: 22px; font-weight: 900; color: #000000;">₹${Number(order.amount).toLocaleString('en-IN')}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <div style="display: table; width: 100%; border-top: 1px solid #eeeeee; padding-top: 30px;">
                            <div style="display: table-cell; width: 50%; padding-right: 20px; vertical-align: top;">
                                <h3 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #999999;">Shipping Address</h3>
                                <div style="font-size: 13px; color: #444444; line-height: 1.6;">
                                    <strong style="color: #111111;">${order.customer_details.name}</strong><br />
                                    ${order.shipping_address.address}<br />
                                    ${order.shipping_address.apartment ? `${order.shipping_address.apartment}<br />` : ""}
                                    ${order.shipping_address.city}, ${order.shipping_address.district}<br />
                                    ${order.shipping_address.state} - ${order.shipping_address.pincode}
                                </div>
                            </div>
                            <div style="display: table-cell; width: 50%; vertical-align: top;">
                                <h3 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #999999;">Contact Details</h3>
                                <div style="font-size: 13px; color: #444444; line-height: 1.6;">
                                    ${order.customer_details.email}<br />
                                    ${order.customer_details.phone}<br />
                                    ${order.customer_details.secondary_phone ? `Alt: ${order.customer_details.secondary_phone}` : ""}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="background-color: #fcfcfc; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0; font-size: 12px; color: #aaaaaa; letter-spacing: 0.05em;">
                            &copy; ${new Date().getFullYear()} BLACTIFY. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        console.log("📨 Email Result:", JSON.stringify(result, null, 2));

        return NextResponse.json({
            success: true,
            email: result
        });
    } catch (error) {
        console.error("🔴 Fatal Error in Notify Route:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
