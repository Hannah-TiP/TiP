import type { AnchorHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppError from '@/app/error';
import enTranslations from '@/translations/en.json';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function mockLocationReload() {
  const reload = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });
  return reload;
}

describe('AppError boundary', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the error card and wires the retry button to reset()', () => {
    const reset = vi.fn();
    const error = new Error('boom');

    render(<AppError error={error} reset={reset} />);

    expect(screen.getByText(enTranslations['error.boundary_title'])).toBeTruthy();
    expect(screen.getByText(enTranslations['error.boundary_message'])).toBeTruthy();

    fireEvent.click(screen.getByText(enTranslations['error.try_again']));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('offers a Go home link back to /', () => {
    render(<AppError error={new Error('boom')} reset={vi.fn()} />);
    const home = screen.getByText(enTranslations['error.go_home']).closest('a');
    expect(home?.getAttribute('href')).toBe('/');
  });

  it('auto-reloads once on a ChunkLoadError and sets the loop guard', () => {
    const reload = mockLocationReload();
    const error = new Error('Loading chunk 42 failed');
    error.name = 'ChunkLoadError';

    render(<AppError error={error} reset={vi.fn()} />);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('chunk-reloaded')).toBe('true');
  });

  it('does NOT reload again when the loop guard is already set (falls through to card)', () => {
    window.sessionStorage.setItem('chunk-reloaded', 'true');
    const reload = mockLocationReload();
    const error = new Error('Loading chunk 42 failed');
    error.name = 'ChunkLoadError';

    render(<AppError error={error} reset={vi.fn()} />);

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByText(enTranslations['error.boundary_title'])).toBeTruthy();
  });

  it('clears the loop guard on a successful (non-chunk) mount', () => {
    window.sessionStorage.setItem('chunk-reloaded', 'true');
    const reload = mockLocationReload();

    render(<AppError error={new Error('regular error')} reset={vi.fn()} />);

    expect(reload).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('chunk-reloaded')).toBeNull();
  });

  it('matches ChunkLoadError by message even when the name is generic', () => {
    const reload = mockLocationReload();

    render(<AppError error={new Error('Loading chunk 7 failed')} reset={vi.fn()} />);

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
