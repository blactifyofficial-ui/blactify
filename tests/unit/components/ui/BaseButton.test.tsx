import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BaseButton } from '@/components/ui/BaseButton';

describe('BaseButton Component', () => {
  it('should render correctly with children', () => {
    render(<BaseButton>Click me</BaseButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply the correct variant class', () => {
    const { rerender } = render(<BaseButton variant="primary">Button</BaseButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-black)]');

    rerender(<BaseButton variant="secondary">Button</BaseButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-zinc-100');

    rerender(<BaseButton variant="outline">Button</BaseButton>);
    expect(screen.getByRole('button')).toHaveClass('border-zinc-200');
  });

  it('should apply the correct size class', () => {
    const { rerender } = render(<BaseButton size="sm">Button</BaseButton>);
    expect(screen.getByRole('button')).toHaveClass('px-3 py-1.5');

    rerender(<BaseButton size="lg">Button</BaseButton>);
    expect(screen.getByRole('button')).toHaveClass('px-6 py-3');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<BaseButton disabled>Button</BaseButton>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
  });

  it('should show loading spinner and be disabled when isLoading is true', () => {
    render(<BaseButton isLoading>Button</BaseButton>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<BaseButton onClick={handleClick}>Click me</BaseButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick handler when disabled', () => {
    const handleClick = vi.fn();
    render(<BaseButton onClick={handleClick} disabled>Click me</BaseButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
