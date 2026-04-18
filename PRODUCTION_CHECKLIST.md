# 🛡️ Blactify Studio Production Readiness Checklist
Comprehensive testing protocol for verifying all platform features before public launch.

---

## 🛍️ 1. Storefront Experience (Customer Side)

### 🏠 Navigation & Discovery
- [ ] **Home Page**: Hero banner links, featured collections, and "New Drops" sections load correctly.
- [ ] **Category Filters**: Clicking Categories (e.g., T-shirts, Hoodies) filters the `/shop` products correctly.
- [ ] **Search/Global Navigation**: All header and footer links (Privacy, Shipping, Terms) are valid.
- [ ] **Image Optimization**: All product images serve in `.webp` format and load lazily.

### 🍱 Product Interaction
- [ ] **Product Page (PDP)**: 
    - [ ] Dynamic metadata/SEO title matches the product name.
    - [ ] Image gallery scrolls correctly.
    - [ ] Size selector updates available stock (or shows "Sold Out").
    - [ ] Quantity selector bounds (minimum 1).
- [ ] **Direct Add to Cart**: Adding products from `/shop` category view without opening PDP.
- [ ] **Cart Sidebar/Page**: 
    - [ ] Subtotal updates instantly on quantity change.
    - [ ] Persistence: Products remain in cart after closing/reopening the browser.

### 💳 Checkout & Payments
- [ ] **Address Validation**: Mandatory fields (Name, Phone, Address, Pincode) show errors if empty.
- [ ] **Razorpay Integration**:
    - [ ] Payment modal launches with correct currency and amount.
    - [ ] **Success Flow**: Successful payment redirects to `/checkout/success` and triggers the Admin Push.
    - [ ] **Failure Flow**: Payment failure redirects to `/checkout/failure` with an error message.
    - [ ] **Webhook Sync**: Order status updates to "Paid" via backend webhook even if the user closes their browser before redirecting.

---

## 🏗️ 2. Administrative Dashboard (`/admin`)

### 📊 Operations
- [ ] **Order Management**:
    - [ ] List View: Real-time update when new orders come in.
    - [ ] Details: View customer details, order items, and payment info.
    - [ ] **Status Transitions**: Moving from `paid` -> `processing` -> `shipped` -> `delivered`.
- [ ] **Product Management**:
    - [ ] **New Product**: Uploading multiple images to Supabase Storage.
    - [ ] **Edit Product**: Updating name, description, variant prices, and stock.
    - [ ] **Delete/Archive**: Removing products from the active storefront.
- [ ] **Categories & Drops**: 
    - [ ] Creating new categories and linking them to specific products.
    - [ ] Setting up new "Drops" (collections).

### ⚙️ System Settings
- [ ] **Maintenance Mode**: Toggle on/off and verify the storefront displays the maintenance splash screen.
- [ ] **Admin Authentication**: Only users with the `admin` role can access `/admin`. Unauthorized login redirects correctly.

---

## 🔔 3. Notification Ecosystem (Push & UI)

### 📲 Firebase Cloud Messaging (FCM)
- [ ] **Browser Toast**: Real-time red toast appears in the admin panel on new order.
- [ ] **Notification Bell Badge**: Unread count updates immediately (red dot with bounce animation).
- [ ] **Inbox View**: 
    - [ ] New items show a pulsing red indicator.
    - [ ] **Mark as Read**: Clearing individual notifications updates unread count.
    - [ ] **Clear All**: Single-tap to acknowledge all unread notifications.
- [ ] **Background Push (iOS/Android)**:
    - [ ] Phone Locked: Verify system tray alert appears (PWA must be on Home Screen).
    - [ ] Background Tab: Verify browser-level system notification triggers.

### 📧 Automated Emails
- [ ] **Customer Receipt**: Email sent immediately after successful payment.
- [ ] **Admin Alert**: Email sent to site owners about the new sale.
- [ ] **Shipping Notification**: Email sent to customer when order status moves to "Shipped".

---

## 📱 4. PWA & Mobile Optimization

- [ ] **Installability**: "Add to Home Screen" prompt works on iOS (Safari) and Android (Chrome).
- [ ] **App Shell**: App loads with a splash screen (black background) and standalone display.
- [ ] **Responsiveness**:
    - [ ] Storefront: Mobile-first navigation (hamburger menu).
    - [ ] Admin: Orders and product lists are scrollable on smaller screens.
- [ ] **Service Worker**: `/firebase-messaging-sw.js` is active and registered at the root level.

---

## 🛠️ 5. Developer & Security Logs (`/developer`)

- [ ] **Audit Logs**: Every status change, login, and product edit is recorded in the Audit Trail.
- [ ] **Webhook Logs**: Monitor incoming Razorpay events for verification.
- [ ] **Maintenance Toggles**: Global developer control over maintenance states.
- [ ] **Data Retention**: Check that read notifications are automatically purged after 24 hours (cleanup task).

---

## 🚀 6. Performance & Health
- [ ] **Runtime Errors**: Check developer console for any "404", "500", or "CORS" errors during navigation.
- [ ] **Build Check**: `npm run build` generates a clean distribution without TypeScript/Lint errors.
- [ ] **Middleware**: Check that `/admin` and `/developer` routes are correctly protected via `middleware.ts`.

---

**Last Verified:** [Date]
**Verified By:** [Name]
