# Product Requirements Document (PRD): Blacktfy

**Project Name:** blactify 
**Subtitle:** Blactify Essentials
**Version:** 1.1 (Mobile-First Optimized)  
**Status:** Draft / Specification  
**Owner:** Zinan
**Developer:** NithinNT 

---

## 1. Executive Summary
Blacktfy is a premium, high-aesthetic e-commerce platform built for the modern shopper. The platform prioritizes a **Mobile-First**, minimalist design, heavily inspired by the industrial and streetwear aesthetics of **Empire** and **Studio Veyn**. 

The goal is to provide an app-like experience in the browser, featuring high-contrast visuals, seamless Razorpay integration, and instant post-purchase engagement via the WhatsApp Cloud API, Email Notifications and Delivery with delhivery.

---

## 2. Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15+ (App Router) |
| **Styling** | Tailwind CSS |
| **Database/Backend** | Supabase (PostgreSQL) |
| **Authentication** | FireBase Auth |
| **Payments** | Razorpay (Native Mobile Overlay) |
| **Notifications** | WhatsApp Cloud API (Meta) & (Email) |

---

## 3. Mobile-First Features & Requirements

### 3.1 User Storefront (Mobile Optimized)
* **App-Like Navigation:** * **Bottom Tab Bar:** Persistent navigation (Home, Search, Cart, Profile) for easy thumb access.
    * **Gesture Support:** Horizontal swiping for product image galleries.
* **Noir Aesthetic:** * Pure black background (#000000) for OLED battery efficiency and high-contrast visuals.
    * Bold, wide Sans-Serif typography for headers (Empire Style).
* **Welcome Offer:** A sleek, bottom-sheet slide-up offering a % discount for first-time visitors.
* **Mobile Checkout:** * One-tap "Buy Now" buttons.
    * Single-page checkout optimized for mobile input fields (min 16px font to prevent auto-zoom).

### 3.2 Automated Notifications
* **WhatsApp Cloud API Integration:** * Immediate order confirmation message upon successful payment.
    * Automatic PDF receipt sharing via WhatsApp.
    * Deep-link button to "Track Order" within the WhatsApp chat.
* **Email System:** Mobile-responsive HTML receipts sent via Resend.

### 3.3 Admin Dashboard (Management)
* **Mobile-Friendly Management:** Dashboard optimized for managing inventory on-the-go.
* **Sales Reports:** Real-time analytics on revenue, order volume, and top-selling items.
* **Order Tracking:** Ability to update order status (Paid → Shipped → Delivered) with one tap.

---

## 4. Database Architecture (Supabase)
* **`profiles`:** User ID, shipping address, and communication preferences.
* **`products`:** Name, description, price, discount_price, stock, and Supabase Bucket image URLs.
* **`orders`:** Razorpay ID, user reference, total price, and status (Pending/Paid/Shipped).
* **`order_items`:** Links multiple products to a single order.
* **`coupons`:** Logic for the "Welcome Offer" and promotional discounts.

---

## 5. Design & User Experience (UX)
* **Visual Direction:** Hybrid design. **Empire’s** blocky, bold headers mixed with **Studio Veyn’s** clean, jewelry-focused white-space.
* **Touch Targets:** All buttons and links designed at a minimum of 48x48px for precise mobile interaction.
* **Loading Experience:** Skeleton screens reduce perceived latency on mobile networks.

---

## 6. Project Roadmap
1.  **Phase 1 (Setup):** Initialize Next.js, Tailwind config (Noir theme), and Supabase Project.
2.  **Phase 2 (Mobile UI):** Build the Bottom Nav Bar and the high-impact Hero/Shop feed.
3.  **Phase 3 (Payments):** Integrate Razorpay with success/failure webhooks.
4.  **Phase 4 (Automation):** Connect Meta WhatsApp Cloud API to the payment webhook.
5.  **Phase 5 (Admin):** Develop the Sales & Inventory management dashboard.

---