import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubNav from '@/components/SubNav';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { SubNavKey } from '@/lib/header-config';

afterEach(cleanup);

function renderSubNav(activeTab: SubNavKey) {
  return render(
    <LanguageProvider initialLang="en">
      <SubNav activeTab={activeTab} />
    </LanguageProvider>,
  );
}

describe('SubNav', () => {
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollSpy = vi.fn();
    Element.prototype.scrollIntoView =
      scrollSpy as unknown as typeof Element.prototype.scrollIntoView;
  });

  it('renders all tabs and marks the active one bold', () => {
    renderSubNav('Credits');
    expect(screen.getByText('Upcoming Travels')).toBeDefined();
    expect(screen.getByText('Shared With Me')).toBeDefined();
    const credits = screen.getByText('Credits');
    expect(credits.className).toContain('font-bold');
    // a non-active tab is not bold
    expect(screen.getByText('Membership').className).not.toContain('font-bold');
  });

  it('is horizontally scrollable (overflow-x-auto) for mobile', () => {
    renderSubNav('Upcoming Travels');
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('overflow-x-auto');
  });

  it('scrolls the active tab into view on mount, centered horizontally', () => {
    renderSubNav('My Profile');
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inline: 'center', behavior: 'smooth' }),
    );
  });
});
