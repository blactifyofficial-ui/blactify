import { google } from 'googleapis';

export async function appendOrderToSheet(orderData: {
    id: string;
    items: { name: string; size?: string; quantity: number }[];
    customer_details: { name: string; email: string; phone: string };
    shipping_address: {
        address: string;
        apartment?: string;
        city: string;
        district: string;
        state: string;
        pincode: string;
    };
    amount: number;
    status: string;
}) {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (!spreadsheetId || !credentialsBase64) {
            console.warn("⚠️ Google Sheets missing environment variables");
            return;
        }

        // Decode credentials from Base64
        let credentialsJson;
        try {
            const decoded = Buffer.from(credentialsBase64, 'base64').toString();

            // Fix possible single quote issues (Python/Shell style)
            let cleaned = decoded.trim();
            if (cleaned.includes("'type'")) {
                cleaned = cleaned.replace(/'/g, '"');
            }

            // Remove non-printable control characters that break JSON.parse (but KEEP \n \r \t)
            // eslint-disable-next-line no-control-regex
            cleaned = cleaned.replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F\u007F]/g, "");



            credentialsJson = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error("❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:", parseErr);
            return;
        }

        const auth = new google.auth.GoogleAuth({
            credentials: credentialsJson,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });


        // Format the items into a string
        const itemsList = orderData.items.map((item) =>
            `${item.name} (${item.size || 'N/A'}) x${item.quantity}`
        ).join(', ');

        // Prepare the row data
        // Header recommendation: Order ID, Date, Name, Email, Phone, Amount, Items, Status, Address, City, State, Pincode
        const fullAddress = `${orderData.shipping_address.address}${orderData.shipping_address.apartment ? `, ${orderData.shipping_address.apartment}` : ''}`;

        const row = [
            orderData.id,
            new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            orderData.customer_details.name,
            orderData.customer_details.email,
            orderData.customer_details.phone,
            orderData.amount,
            itemsList,
            orderData.status,
            fullAddress,
            orderData.shipping_address.city,
            orderData.shipping_address.state,
            orderData.shipping_address.pincode
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:L', // Expanded range to include address fields
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row],
            },
        });


    } catch (error) {
        console.error("❌ Google Sheets Sync Error:", error);
    }
}
