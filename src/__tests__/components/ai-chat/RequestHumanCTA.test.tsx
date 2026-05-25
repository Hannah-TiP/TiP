import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RequestHumanCTA from '@/components/ai-chat/RequestHumanCTA';
import { apiClient } from '@/lib/api-client';
import enTranslations from '@/translations/en.json';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

describe('RequestHumanCTA', () => {
  it('renders when sessionStatus is "ai"', () => {
    render(<RequestHumanCTA sessionStatus="ai" tripId={1} onRequested={vi.fn()} />);
    expect(screen.getByTestId('request-human-cta')).toBeDefined();
  });

  it('does NOT render when sessionStatus is "human"', () => {
    render(<RequestHumanCTA sessionStatus="human" tripId={1} onRequested={vi.fn()} />);
    expect(screen.queryByTestId('request-human-cta')).toBeNull();
  });

  it('opens modal on click', () => {
    render(<RequestHumanCTA sessionStatus="ai" tripId={1} onRequested={vi.fn()} />);
    fireEvent.click(screen.getByTestId('request-human-cta'));
    expect(screen.getByTestId('request-human-modal')).toBeDefined();
    expect(screen.getByTestId('request-human-confirm')).toBeDefined();
    expect(screen.getByTestId('request-human-cancel')).toBeDefined();
  });

  it('fires API request on confirm and calls onRequested on success', async () => {
    const onRequested = vi.fn();
    vi.spyOn(apiClient, 'requestHumanConcierge').mockResolvedValue({
      session: {
        id: 1,
        user_id: 1,
        trip_id: 1,
        status: 'human',
      },
      assistant_message: null,
    });

    render(<RequestHumanCTA sessionStatus="ai" tripId={42} onRequested={onRequested} />);
    fireEvent.click(screen.getByTestId('request-human-cta'));
    fireEvent.click(screen.getByTestId('request-human-confirm'));

    await waitFor(() => {
      expect(apiClient.requestHumanConcierge).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(onRequested).toHaveBeenCalled();
    });
  });

  it('shows error message on API failure', async () => {
    vi.spyOn(apiClient, 'requestHumanConcierge').mockRejectedValue(new Error('Network error'));

    render(<RequestHumanCTA sessionStatus="ai" tripId={1} onRequested={vi.fn()} />);
    fireEvent.click(screen.getByTestId('request-human-cta'));
    fireEvent.click(screen.getByTestId('request-human-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('request-human-error')).toBeDefined();
    });
  });
});
