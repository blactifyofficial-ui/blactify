import { describe, it, expect } from 'vitest';
import { 
  EmailSchema, 
  PhoneSchema, 
  PincodeSchema, 
  NameSchema, 
  PasswordSchema, 
  HandleSchema, 
  ProductIdSchema 
} from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('EmailSchema', () => {
    it('should validate correct email addresses', () => {
      expect(EmailSchema.safeParse('test@example.com').success).toBe(true);
      expect(EmailSchema.safeParse('user.name+tag@domain.co.in').success).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(EmailSchema.safeParse('invalid-email').success).toBe(false);
      expect(EmailSchema.safeParse('@domain.com').success).toBe(false);
      expect(EmailSchema.safeParse('test@').success).toBe(false);
    });
  });

  describe('PhoneSchema', () => {
    it('should validate correct Indian phone numbers', () => {
      expect(PhoneSchema.safeParse('9876543210').success).toBe(true);
      expect(PhoneSchema.safeParse('6123456789').success).toBe(true);
    });

    it('should reject invalid Indian phone numbers', () => {
      expect(PhoneSchema.safeParse('5876543210').success).toBe(false); // Starts with 5
      expect(PhoneSchema.safeParse('987654321').success).toBe(false);  // Too short
      expect(PhoneSchema.safeParse('98765432100').success).toBe(false); // Too long
      expect(PhoneSchema.safeParse('abcdefghij').success).toBe(false); // Not numbers
    });
  });

  describe('PincodeSchema', () => {
    it('should validate correct Indian pincodes', () => {
      expect(PincodeSchema.safeParse('560001').success).toBe(true);
      expect(PincodeSchema.safeParse('110001').success).toBe(true);
    });

    it('should reject invalid Indian pincodes', () => {
      expect(PincodeSchema.safeParse('060001').success).toBe(false); // Starts with 0
      expect(PincodeSchema.safeParse('56000').success).toBe(false);  // Too short
      expect(PincodeSchema.safeParse('5600011').success).toBe(false); // Too long
    });
  });

  describe('NameSchema', () => {
    it('should validate correct names', () => {
      expect(NameSchema.safeParse('John Doe').success).toBe(true);
      expect(NameSchema.safeParse("O'Reilly").success).toBe(true);
      expect(NameSchema.safeParse('Jean-Luc').success).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(NameSchema.safeParse('A').success).toBe(false); // Too short
      expect(NameSchema.safeParse('123 Joe').success).toBe(false); // Contains numbers
      expect(NameSchema.safeParse('John@Doe').success).toBe(false); // Contains special chars
    });
  });

  describe('PasswordSchema', () => {
    it('should validate correct passwords', () => {
      expect(PasswordSchema.safeParse('Password123').success).toBe(true);
      expect(PasswordSchema.safeParse('a1b2c3d4').success).toBe(true);
    });

    it('should reject invalid passwords', () => {
      expect(PasswordSchema.safeParse('short1').success).toBe(false); // Too short
      expect(PasswordSchema.safeParse('onlyletters').success).toBe(false); // No numbers
      expect(PasswordSchema.safeParse('12345678').success).toBe(false); // No letters
    });
  });

  describe('HandleSchema', () => {
    it('should validate correct handles', () => {
      expect(HandleSchema.safeParse('my-awesome-handle').success).toBe(true);
      expect(HandleSchema.safeParse('user123').success).toBe(true);
    });

    it('should reject invalid handles', () => {
      expect(HandleSchema.safeParse('My-Handle').success).toBe(false); // Uppercase
      expect(HandleSchema.safeParse('my_handle').success).toBe(false); // Underscore
      expect(HandleSchema.safeParse('-start-with-hyphen').success).toBe(false);
    });
  });

  describe('ProductIdSchema', () => {
    it('should validate correct product IDs', () => {
      expect(ProductIdSchema.safeParse('p-123').success).toBe(true);
      expect(ProductIdSchema.safeParse('p-001').success).toBe(true);
    });

    it('should reject invalid product IDs', () => {
      expect(ProductIdSchema.safeParse('prod-123').success).toBe(false);
      expect(ProductIdSchema.safeParse('123').success).toBe(false);
      expect(ProductIdSchema.safeParse('p-abc').success).toBe(false);
    });
  });
});
