# Validation Examples

This document provides a summary of the regex validations implemented for input fields across the Blactify application.

## 1. Email Address
- **Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Valid Examples**: `user@example.com`, `john.doe@blactify.in`
- **Invalid Examples**: `admin`, `user@`, `@example.com`

## 2. Phone Number (India)
- **Regex**: `/^[6-9]\d{9}$/`
- **Valid Examples**: `9876543210`, `7012345678`
- **Invalid Examples**: `1234567890` (must start with 6-9), `987654321` (too short)

## 3. PIN Code (India)
- **Regex**: `/^[1-9][0-9]{5}$/`
- **Valid Examples**: `560001`, `110001`
- **Invalid Examples**: `060001` (cannot start with 0), `56001` (too short)

## 4. Name (Full Name / First Name / Last Name)
- **Regex**: `/^[A-Za-z\s'-]{2,50}$/`
- **Description**: 2-50 characters, only letters, spaces, hyphens, and apostrophes.
- **Valid Examples**: `John Doe`, `D'Souza`, `Anne-Marie`
- **Invalid Examples**: `J` (too short), `John123` (numbers not allowed)

## 5. Address
- **Regex**: `/^[A-Za-z0-9\s.,'#\-\/]{5,100}$/`
- **Description**: 5-100 characters, allows alphanumeric and basic separators.
- **Valid Examples**: `123, MG Road`, `Flat #302, Green Apartments`
- **Invalid Examples**: `ABC` (too short)

## 6. City / District
- **Regex**: `/^[A-Za-z\s]{2,50}$/`
- **Valid Examples**: `Mumbai`, `New Delhi`
- **Invalid Examples**: `M1` (numbers not allowed)

## 7. Password (Signup)
- **Regex**: `/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/`
- **Description**: Minimum 8 characters, at least one letter and one number.

## 8. Admin Fields
### SEO Handle
- **Regex**: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- **Valid Examples**: `slim-fit-denim`, `trendy-tee-2024`

### Product ID
- **Regex**: `/^p-[0-9]+$/i`
- **Valid Examples**: `p-001`, `P-456`

### Category Name
- **Regex**: `/^[A-Za-z0-9\s'&,-]{3,50}$/`
- **Valid Examples**: `Men's Wear`, `T-Shirts & Polos`
