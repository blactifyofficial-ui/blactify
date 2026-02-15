This document provides a comprehensive overview of the Blactify e-commerce        
project, designed to serve as a detailed instructional context for AI-powered     
development assistance.                                                           

## Project Overview                                                               
Blactify is a modern, full-stack e-commerce platform built with a focus on        
high-aesthetic, timeless essentials. It features a customer-facing storefront for 
browsing and purchasing products, and a separate admin dashboard for managing the 
store.                                                                            

### Core Technologies                                                             
*   **Framework:** [Next.js](https://nextjs.org/) (React)                         
*   **Language:** [TypeScript](https://www.typescriptlang.org/)                   
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)                         
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL)        
*   **Authentication:** [Firebase Authentication](                                
    https://firebase.google.com/docs/auth)                                            
*   **Payments:** [Razorpay](https://razorpay.com/)                               
*   **Image Hosting:** [Cloudinary](https://cloudinary.com/)                      

### Architecture                                                                  

The application is a monorepo containing both the frontend and backend logic.     

*    **Frontend:** A server-rendered React application built with Next.js.         
    *   Customer-facing pages are located in `src/app/`.                          
    *   The admin dashboard is in `src/app/admin/`.                               
    *   Reusable UI components are in `src/components/`.                          
*   **Database Schema:** The PostgreSQL schema is defined in                      
    `database_schema.sql`. It includes tables for `products`, `categories`, `orders`, 
    `profiles` (users), and more, with Row Level Security (RLS) enabled for data      
    protection.                                                                       
*   **API:** Next.js route handlers in `src/app/api/` are used for handling       
    checkout, notifications, and file uploads.                                        
*   **Authentication:** User profiles are synced from Firebase Authentication to  
    the `profiles` table in Supabase.                                                 

## Building and Running                                                           
### Prerequisites                                                                 

*   Node.js and npm (or a compatible package manager).                            
*   Environment variables for Supabase, Firebase, Razorpay, and Cloudinary. A     
    `.env.local` file should be created based on the services used in the `src/lib/`  
    directory.                                                                        

### Key Commands                                                                  

The following commands are defined in `package.json`:                             
*   **Run development server:**                                                   
     ```bash                                                                       
     npm run dev                                                                   
     ```                                                                           
     This starts the app on `http://localhost:3000`.                               
                                                                                   
*   **Create a production build:**                                                
     ```bash                                                                       
     npm run build                                                                 
     ```                                                                           
                                                                                   
*   **Start the production server:**                                              
     ```bash                                                                       
     npm run start                                                                 
     ```                                                                           
                                                                                   
*   **Run linter:**                                                               
     ```bash                                                                       
     npm run lint                                                                  
     ```                                                                           
                                                                                   
## Development Conventions                                                        
*   **Styling:** Utility-first CSS using Tailwind CSS.                            
*   **Components:** Reusable components are encouraged and should be placed in    
    the `src/components/` directory.                                                  
*   **Database:** Changes to the database schema should be reflected in the       
    `database_schema.sql` file.                                                       
*   **State Management:** The project uses `zustand` for global client-side state 
    management (e.g., shopping cart).                                                 
*   **File Naming:** Pages are created using the Next.js App Router convention (  
    `page.tsx`).                                                                      
*   **API Routes:** Backend endpoints are created as Next.js Route Handlers in    
    the `src/app/api/` directory. 