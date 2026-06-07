import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubNav from '@/components/SubNav';

afterEach(cleanup);

describe('SubNav', () => {
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollSpy = vi.fn();
    Element.prototype.scrollIntoView =
      scrollSpy as unknown as typeof Element.prototype.scrollIntoView;
  });

  it('renders all tabs and marks the active one bold', () => {
    render(<SubNav activeTab="Credits" />);
    expect(screen.getByText('Upcoming Travels')).toBeDefined();
    const credits = screen.getByText('Credits');
    expect(credits.className).toContain('font-bold');
    // a non-active tab is not bold
    expect(screen.getByText('Membership').className).not.toContain('font-bold');
  });

  it('is horizontally scrollable (overflow-x-auto) for mobile', () => {
    render(<SubNav activeTab="Upcoming Travels" />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('overflow-x-auto');
  });

  it('scrolls the active tab into view on mount, centered horizontally', () => {
    render(<SubNav activeTab="My Profile" />);
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inline: 'center', behavior: 'smooth' }),
    );
  });
});
