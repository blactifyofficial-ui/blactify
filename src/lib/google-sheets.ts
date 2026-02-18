import { google } from 'googleapis';

export async function appendOrderToSheet(orderData: any) {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (!spreadsheetId || !credentialsBase64) {
            console.error('Google Sheets credentials missing in environment variables.');
            return;
        }

        // Decode credentials from Base64
        const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString());

        const auth = new google.auth.GoogleAuth({
            credentials: credentialsJson,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Format the items into a string
        const itemsList = orderData.items.map((item: any) =>
            `${item.name} (${item.size || 'N/A'}) x${item.quantity}`
        ).join(', ');

        // Prepare the row data
        // Header recommendation: Order ID, Date, Name, Email, Phone, Amount, Items, Status
        const row = [
            orderData.id,
            new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            orderData.customer_details.name,
            orderData.customer_details.email,
            orderData.customer_details.phone,
            orderData.amount,
            itemsList,
            orderData.status
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:H', // Adjust range if needed
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row],
            },
        });

        console.log(`Order ${orderData.id} synced to Google Sheets successfully.`);
    } catch (error) {
        console.error('Error syncing order to Google Sheets:', error);
    }
}
