import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StickyBookingBar from '@/components/hotel/StickyBookingBar';

afterEach(() => cleanup());

describe('StickyBookingBar', () => {
  it('renders perks copy and triggers the reserve callback when clicked', () => {
    const onClick = vi.fn();
    render(
      <StickyBookingBar
        perksLabel="TiP exclusive perks"
        perksSubtitle="Breakfast included"
        ctaLabel="Reserve"
        onReserveClick={onClick}
      />,
    );

    expect(screen.getByText('TiP exclusive perks')).toBeTruthy();
    expect(screen.getByText('Breakfast included')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reserve' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
