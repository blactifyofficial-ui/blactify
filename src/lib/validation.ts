/**
 * Centralized regex patterns for input validation
 */

// Basic email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Indian Phone Number: 10 digits starting with 6-9
export const PHONE_REGEX = /^[6-9]\d{9}$/;

// Indian PIN Code: 6 digits starting with 1-9
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// Name: 2-50 characters, letters, spaces, hyphens, and apostrophes
export const NAME_REGEX = /^[A-Za-z\s'-]{2,50}$/;

// Password: Min 8 chars, at least one letter and one number
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

// Handle/Slug: kebab-case
export const HANDLE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Product ID: p-001 format
export const PRODUCT_ID_REGEX = /^p-[0-9]+$/i;

// Address: 5-100 characters, allows most common characters
export const ADDRESS_REGEX = /^[A-Za-z0-9\s.,'#\-\/]{5,100}$/;

// Generic City/District: 2-50 characters, letters and spaces
export const CITY_REGEX = /^[A-Za-z\s]{2,50}$/;

// Category Name: 3-50 characters (alphanumeric and ' & - ,)
export const CATEGORY_NAME_REGEX = /^[A-Za-z0-9\s'&,-]{3,50}$/;
