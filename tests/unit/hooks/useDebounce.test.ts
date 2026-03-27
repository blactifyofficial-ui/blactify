import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
  vi.useFakeTimers();

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should update value after delay reached', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 }
    });

    rerender({ value: 'updated', delay: 500 });
    
    // Check it DID NOT change immediately
    expect(result.current).toBe('initial');

    // Fast-forward 500ms
    act(() => {
        vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should clear old timer when value changes again before delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'v1', delay: 1000 }
    });

    rerender({ value: 'v2', delay: 1000 });
    
    act(() => {
        vi.advanceTimersByTime(500);
    });
    
    rerender({ value: 'v3', delay: 1000 });

    act(() => {
        vi.advanceTimersByTime(500); // 1000ms after first change, 500ms after second change
    });
    
    // Should still be v1 if second change reset the timer
    expect(result.current).toBe('v1');

    act(() => {
        vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('v3');
  });
});
