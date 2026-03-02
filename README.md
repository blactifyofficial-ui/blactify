# <p align="center"><img src="public/logo-v1.png" alt="Blactify Logo" width="120" /><br>BLACTIFY</p>

<p align="center">
  <strong>Meets Timeless Essentials</strong><br>
  A premium e-commerce experience curated for the modern aesthetic.
</p>

---

## 💎 Overview

**Blactify** is a high-performance, visually stunning e-commerce platform designed for "timeless essentials." It combines a sleek, minimalist storefront with a robust administrative backbone, offering a seamless journey from discovery to delivery.

## ✨ Key Features

### 🛍️ Premium Storefront
- **Curated Experience**: A high-aesthetic interface focused on product storytelling.
- **Dynamic Discovery**: Advanced filtering (category, price, sorting) and fast search.
- **Fluid UI**: Smooth transitions and micro-animations powered by GSAP and Tailwind CSS 4.
- **Optimized Performance**: Lazy-loading images and server-side rendering for instant feel.

### 🔐 Advanced Admin Dashboard
- **Real-time Analytics**: Tracks Total Revenue, Orders, and Active User growth.
- **System Controls**: Global toggle for store purchases and revalidation mechanisms.
- **Management Center**: Full CRUD operations for products, categories, and inventory.
- **Activity Logs**: Detailed tracking of recent orders and system updates.

### 💳 Secure Ecosystem
- **Payments**: Integrated with Razorpay for iron-clad, seamless transactions.
- **Authentication**: Secure user sessions managed via Firebase Authentication.
- **Communication**: Automated transactional emails powered by Resend.

### 📱 PWA & Mobile-First
- **Fully Responsive**: Identical premium experience across mobile, tablet, and desktop.
- **PWA Ready**: Installable application capabilities for iOS and Android.

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, GSAP |
| **Backend** | Supabase (PostgreSQL), Firebase Auth |
| **Payments** | Razorpay SDK |
| **Infrastructure** | Vercel, Resend (Email), Cloudinary (Media) |
| **State** | Zustand |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase Account
- Firebase Project
- Razorpay API Keys

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/blactify.git
   cd blactify
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file based on the required keys for Supabase, Firebase, and Razorpay.

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components (Atomic design).
- `src/lib`: Database clients, utility functions, and shared logic.
- `src/hooks`: Custom React hooks for data fetching and state.
- `src/store`: Global state management with Zustand.

---

<p align="center">Built with 🖤 for Timeless Essentials.</p>
