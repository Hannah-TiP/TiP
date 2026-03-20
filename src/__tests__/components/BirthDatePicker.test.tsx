import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BirthDatePicker from '@/components/BirthDatePicker';

afterEach(() => {
  cleanup();
});

describe('BirthDatePicker', () => {
  it('displays an ISO birthday in MM/DD/YYYY format', () => {
    render(<BirthDatePicker value="1990-05-10" onChange={() => {}} />);

    expect((screen.getByPlaceholderText('MM/DD/YYYY') as HTMLInputElement).value).toBe('05/10/1990');
  });

  it('parses typed display input back to ISO format', () => {
    const onChange = vi.fn();
    render(<BirthDatePicker value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('MM/DD/YYYY'), {
      target: { value: '05/10/1990' },
    });

    expect(onChange).toHaveBeenCalledWith('1990-05-10');
  });
});
