import { NextResponse } from "next/server";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";



export async function POST(req: Request) {
    try {
        const { order } = await req.json();
        const orderId = order.id || "N/A";
        console.log("🔔 Notification Request Received for Order:", orderId);

        if (!SELLER_CONFIG.resendApiKey) {
            console.warn("⚠️ Resend API Key is missing. Skipping email notifications.");
            return NextResponse.json({ success: false, error: "Resend API key missing" });
        }

        console.log("🔑 API Key Check (First 7 chars):", SELLER_CONFIG.resendApiKey.substring(0, 7) + "...");
        console.log("📧 From Email:", SELLER_CONFIG.fromEmail);

        const resend = new Resend(SELLER_CONFIG.resendApiKey);

        // Calculate details for email
        const subtotal = order.items.reduce((acc: number, item: any) => {
            const price = item.price_offer || item.price_base || 0;
            return acc + price * item.quantity;
        }, 0);

        const calculatedShipping = subtotal < 2999 ? 59 : 0;
        const expectedTotal = subtotal + calculatedShipping;
        const discount = expectedTotal - Number(order.amount);
        const shippingDisplay = calculatedShipping;

        // Shared Email Template Function
        const getEmailHtml = (isSeller: boolean) => `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eeeeee; border-radius: 12px; overflow: hidden; color: #333333;">
                <div style="background-color: #000000; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: 0.2em; font-size: 24px; font-weight: 800;">
                        BLACTIFY
                    </h1>
                </div>
                
                <div style="padding: 40px;">
                    <div style="margin-bottom: 30px;">
                        <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #111111; text-transform: uppercase; letter-spacing: 0.05em;">
                            ${isSeller ? "New Order Received" : "Order Confirmed"}
                        </h2>
                        <p style="margin: 0; color: #666666; font-size: 14px;">
                            ${isSeller ? `You have received a new order #${orderId}` : `Thank you for your purchase! Your order #${orderId} is being processed.`}
                        </p>
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
                                    <td style="font-size: 13px; font-weight: 600; color: #888888; text-transform: uppercase;">Subtotal</td>
                                    <td style="text-align: right; font-size: 14px; font-weight: 600; color: #333333;">₹${subtotal.toLocaleString('en-IN')}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 13px; font-weight: 600; color: #888888; text-transform: uppercase;">Shipping</td>
                                    <td style="text-align: right; font-size: 14px; font-weight: 600; color: #333333;">${shippingDisplay === 0 ? "Free" : `₹${shippingDisplay.toLocaleString('en-IN')}`}</td>
                                </tr>
                                ${discount > 1 ? `
                                <tr>
                                    <td style="font-size: 13px; font-weight: 600; color: #10b981; text-transform: uppercase;">Discount</td>
                                    <td style="text-align: right; font-size: 14px; font-weight: 600; color: #10b981;">-₹${Math.round(discount).toLocaleString('en-IN')}</td>
                                </tr>
                                ` : ""}
                                <tr>
                                    <td style="padding-top: 10px; font-size: 16px; font-weight: 800; color: #111111; text-transform: uppercase;">Total Amount</td>
                                    <td style="padding-top: 10px; text-align: right; font-size: 20px; font-weight: 900; color: #000000;">₹${Number(order.amount).toLocaleString('en-IN')}</td>
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
                    <p style="margin: 0 0 10px 0; font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">
                        Keep it blactify
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #aaaaaa; letter-spacing: 0.05em;">
                        &copy; ${new Date().getFullYear()} BLACTIFY. All rights reserved.
                    </p>
                </div>
            </div>
        `;

        const results = [];

        // 1. Send Email to Seller
        console.log("📨 Sending Notification Email to Seller:", SELLER_CONFIG.email);
        try {
            const sellerResult = await resend.emails.send({
                from: SELLER_CONFIG.fromEmail,
                to: [SELLER_CONFIG.email],
                subject: `New Order Received: #${orderId}`,
                html: getEmailHtml(true),
            });
            console.log("✅ Seller Notification Result:", JSON.stringify(sellerResult, null, 2));
            results.push({ type: 'seller', ...sellerResult });
        } catch (sellerError) {
            console.error("❌ Failed to send seller notification:", sellerError);
            const errorObj = sellerError as any;
            results.push({
                type: 'seller',
                error: errorObj.message || "Unknown error",
                details: errorObj.response?.data || errorObj
            });
        }

        // 2. Send Email to Customer
        console.log("📨 Sending Order Confirmation to Customer:", order.customer_details.email);
        try {
            const customerResult = await resend.emails.send({
                from: SELLER_CONFIG.fromEmail,
                to: [order.customer_details.email],
                subject: `Order Confirmed: #${orderId}`,
                html: getEmailHtml(false),
            });
            console.log("✅ Customer Confirmation Result:", JSON.stringify(customerResult, null, 2));
            results.push({ type: 'customer', ...customerResult });
        } catch (customerError) {
            // This is expected to fail if domain is not verified and customer is not the account owner
            console.warn("⚠️ Failed to send customer confirmation (likely Resend domain restriction):", customerError);
            const errorObj = customerError as any;
            results.push({
                type: 'customer',
                error: errorObj.message || "Unknown error",
                details: errorObj.response?.data || errorObj
            });
        }

        return NextResponse.json({
            success: true,
            results
        });
    } catch (error) {
        console.error("🔴 Fatal Error in Notify Route:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

