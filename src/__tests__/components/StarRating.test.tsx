import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StarRating from '@/components/reviews/StarRating';

afterEach(cleanup);

describe('StarRating', () => {
  it('renders read-only stars with an accessible value label and no buttons', () => {
    render(<StarRating value={4} />);

    expect(screen.getByLabelText('4 out of 5')).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('renders 5 interactive radios when onChange is provided', () => {
    render(<StarRating value={0} onChange={vi.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('calls onChange with the integer rating when a star is clicked', () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} label="Rating for Hotel" />);

    fireEvent.click(screen.getByLabelText('Rating for Hotel: 3 stars'));

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
