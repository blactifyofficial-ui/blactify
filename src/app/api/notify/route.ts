import { NextResponse } from "next/server";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";


async function sendWhatsApp(order: any) {
    if (!SELLER_CONFIG.whatsappAccessToken || !SELLER_CONFIG.whatsappPhoneNumberId) {
        console.error("WhatsApp credentials missing");
        return { error: "WhatsApp credentials missing" };
    }

    const itemsList = order.items
        .map((item: any) => `- ${item.name} (x${item.quantity})`)
        .join("\n");

    const message = `Hello Blactify Seller!\n\nNew Order Placed: *#${order.id}*\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${order.amount}\n\n*Customer Info:*\nName: ${order.customer_details.name}\nPhone: ${order.customer_details.phone}${order.customer_details.secondary_phone ? `\nAlt Phone: ${order.customer_details.secondary_phone}` : ''}\n\n*Shipping Address:*\n${order.shipping_address.address}\n${order.shipping_address.apartment ? `${order.shipping_address.apartment}\n` : ''}${order.shipping_address.city}, ${order.shipping_address.district ? `${order.shipping_address.district}\n` : ''}${order.shipping_address.state} - ${order.shipping_address.pincode}\n\nPlease process this order. Thank you!`;

    const url = `https://graph.facebook.com/v21.0/${SELLER_CONFIG.whatsappPhoneNumberId}/messages`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SELLER_CONFIG.whatsappAccessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: SELLER_CONFIG.whatsappNumber,
            type: "text",
            text: { body: message },
        }),
    });

    return response.json();
}

export async function POST(req: Request) {
    try {
        const { order } = await req.json();
        console.log("🔔 Notification Request Received for Order:", order.id);

        // Send Email and WhatsApp in parallel
        const [emailResult, whatsappResult] = await Promise.allSettled([
            (async () => {
                if (!SELLER_CONFIG.resendApiKey) {
                    console.warn("⚠️ Resend API Key is missing. Skipping email.");
                    return { error: "Resend API key missing" };
                }
                const resend = new Resend(SELLER_CONFIG.resendApiKey);
                console.log("📨 Sending Email to:", SELLER_CONFIG.email);
                const result = await resend.emails.send({
                    from: "Blactify <onboarding@resend.dev>",
                    to: [SELLER_CONFIG.email],
                    subject: `New Order Received: #${order.id}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                            <h1 style="color: #000;">New Order Placed</h1>
                            <p>Order ID: <strong>#${order.id}</strong></p>
                            <hr />
                            <h3>Items:</h3>
                            <ul>
                                ${order.items.map((item: { name: string; quantity: number; price: number }) => `<li>${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}</li>`).join("")}
                            </ul>
                            <p><strong>Total Amount: ₹${order.amount}</strong></p>
                            <hr />
                            <h3>Customer Details:</h3>
                            <p>Name: ${order.customer_details.name}</p>
                            <p>Phone: ${order.customer_details.phone}</p>
                            ${order.customer_details.secondary_phone ? `<p>Alt Phone: ${order.customer_details.secondary_phone}</p>` : ''}
                            <hr />
                            <h3>Shipping Address:</h3>
                            <p>
                                ${order.shipping_address.address}<br />
                                ${order.shipping_address.apartment ? `${order.shipping_address.apartment}<br />` : ''}
                                ${order.shipping_address.district ? `${order.shipping_address.district}, ` : ''}${order.shipping_address.city}<br />
                                ${order.shipping_address.state} - ${order.shipping_address.pincode}
                            </p>
                        </div>
                    `,
                });
                console.log("📨 Email Result:", JSON.stringify(result, null, 2));
                return result;
            })(),
            (async () => {
                console.log("📲 Attempting WhatsApp Notification...");
                const result = await sendWhatsApp(order);
                console.log("📲 WhatsApp Result:", JSON.stringify(result, null, 2));
                return result;
            })()
        ]);

        return NextResponse.json({
            success: true,
            email: emailResult.status === "fulfilled" ? emailResult.value : { error: emailResult.reason },
            whatsapp: whatsappResult.status === "fulfilled" ? whatsappResult.value : { error: whatsappResult.reason }
        });
    } catch (error) {
        console.error("🔴 Fatal Error in Notify Route:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
