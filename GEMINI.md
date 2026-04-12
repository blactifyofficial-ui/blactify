# Blactify: The Premium E-commerce Ecosystem

## 1. Project Vision & Architecture
Blactify is a high-performance, minimalist luxury e-commerce platform built for "Timeless Essentials." It utilizes the **"B.E.S.T." stack**:
- **B**lactify (Custom logic)
- **E**dge (Next.js 15+ App Router)
- **S**upabase (PostgreSQL + RLS)
- **T**ailwind (CSS 4.0 engine)

### Core Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Identity & Messaging**: Firebase (Auth + Cloud Messaging)
- **Styling**: Tailwind CSS 4.0 + GSAP (Animations) + Framer Motion
- **Payments**: Razorpay
- **Media**: Cloudinary (Image CDN)
- **Emails**: Resend

## 2. Engineering Standards & Conventions

### Design System
- **Palette**: "Obsidian & Champagne Gold" (Dark Mode by default).
- **Aesthetic**: Glassmorphism and high-end micro-interactions using GSAP.
- **Mobile-First**: Fully installable PWA experience.

### Code Organization
- `src/actions`: Domain-specific Server Actions (auth, orders, profile, etc.).
- `src/app`: Next.js App Router (Client/Server components).
- `src/components`: Modular UI components (Admin, Home, Layout, Product, UI).
- `src/lib`: Core configurations, client initializations (Supabase, Firebase, Razorpay), and utility functions.
- `src/hooks`: Custom React hooks for data fetching and state management.
- `src/types`: Centralized TypeScript definitions, especially for the database.

### Security & Data
- **Row Level Security (RLS)**: Strictly enforced via Supabase.
- **Middleware**: Routes under `/admin` and `/developer` MUST be protected.
- **Validation**: Strict schema validation for all incoming data/actions.

## 3. Mandatory Workflows

### Testing & Validation
- Refer to `PRODUCTION_CHECKLIST.md` for the exhaustive testing protocol.
- **PWA/Service Worker**: `/firebase-messaging-sw.js` must remain at the root and be correctly registered.
- **Notifications**: Ensure real-time FCM toasts and unread counts are validated in both Admin and Developer shells.

### Development Lifecycle
- **Research**: Always verify existing patterns in `src/actions` or `src/lib` before implementing new logic.
- **Execution**: Maintain the minimalist, luxury aesthetic. Avoid adding unnecessary libraries; prefer Vanilla CSS or Tailwind 4.0 primitives.
- **Validation**: Build, lint, and type-check are mandatory before any feature is considered complete.

## 4. Operational Context
- **Deployment**: Vercel-optimized.
- **Monitoring**: Audit logs and Webhook logs are accessible via the `/developer` dashboard.
- **Maintenance**: Maintenance mode is controlled globally via developer settings.
