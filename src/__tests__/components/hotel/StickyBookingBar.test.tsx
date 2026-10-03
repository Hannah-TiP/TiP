import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import StickyBookingBar from '@/components/hotel/StickyBookingBar';

afterEach(() => cleanup());

describe('StickyBookingBar', () => {
  it('renders the perks copy only — no Submit Request button (SMA-578)', () => {
    render(
      <StickyBookingBar perksLabel="TiP exclusive perks" perksSubtitle="Breakfast included" />,
    );

    expect(screen.getByText('TiP exclusive perks')).toBeTruthy();
    expect(screen.getByText('Breakfast included')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
