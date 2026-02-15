# Hosting Blactify on Vercel

This guide provides step-by-step instructions for deploying Blactify to Vercel.

## 1. Prerequisites
- A GitHub repository with the latest code.
- A Vercel account connected to your GitHub.
- Access to your Supabase, Firebase, and Razorpay dashboards.

## 2. Deployment Steps

### Connect Repository
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **"New Project"**.
2. Import your GitHub repository.

### Environment Variables
You MUST add the following environment variables in the Vercel project settings (**Settings > Environment Variables**):

| Key | Description |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client API Key |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key |
| `RESEND_API_KEY` | API Key for email notifications |

## 3. Post-Deployment Checklist
- [ ] **Firebase Auth**: Add your Vercel domain to the "Authorized Domains" list in Firebase Console.
- [ ] **Supabase RLS**: Ensure Row Level Security is enabled on all tables.
