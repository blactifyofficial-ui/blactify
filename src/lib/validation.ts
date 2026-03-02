import { z } from "zod";

/**
 * Centralized Zod schemas for input validation
 */

// Basic email validation
export const EmailSchema = z.string().email("Invalid email address");

// Indian Phone Number: 10 digits starting with 6-9
export const PhoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number");

// Indian PIN Code: 6 digits starting with 1-9
export const PincodeSchema = z.string().regex(/^[1-9][0-9]{5}$/, "Invalid PIN code");

// Name: 2-50 characters, letters, spaces, hyphens, and apostrophes
export const NameSchema = z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Name contains invalid characters");

// Password: Min 8 chars, at least one letter and one number
export const PasswordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number");

// Handle/Slug: kebab-case
export const HandleSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid handle format");

// Product ID: p-001 format
export const ProductIdSchema = z.string().regex(/^p-[0-9]+$/i, "Invalid product ID format");

// Address: 5-150 characters
export const AddressSchema = z.string()
    .min(5, "Address must be at least 5 characters")
    .max(150, "Address must be at most 150 characters");

// Generic City/District: 2-50 characters
export const CitySchema = z.string()
    .min(2, "City name must be at least 2 characters")
    .max(50, "City name must be at most 50 characters");

// Category Name: 3-50 characters
export const CategoryNameSchema = z.string()
    .min(3, "Category name must be at least 3 characters")
    .max(50, "Category name must be at most 50 characters");

// OTP: 6 characters alphanumeric
export const OtpSchema = z.string().length(6, "OTP must be exactly 6 characters");
