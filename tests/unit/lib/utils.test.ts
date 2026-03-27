import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utility Functions - cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional class names', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('should merge Tailwind classes using twMerge', () => {
    // twMerge should handle conflicts (last one wins for the same property)
    expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
  });

  it('should handle undefined and null values', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });

  it('should handle arrays of class names', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle objects with class names', () => {
      expect(cn({'class1': true, 'class2': false, 'class3': true})).toBe('class1 class3');
  });
});
