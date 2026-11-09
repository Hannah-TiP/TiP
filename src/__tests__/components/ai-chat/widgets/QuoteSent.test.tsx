import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WidgetRenderer from '@/components/ai-chat/widgets/WidgetRenderer';
import krTranslations from '@/translations/kr.json';
import type { AIChatQuoteSentWidget } from '@/types/ai-chat';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (krTranslations as Record<string, string>)[key] ?? key,
    lang: 'kr',
    setLang: () => {},
  }),
}));

afterEach(() => {
  cleanup();
  push.mockReset();
});

const widget: AIChatQuoteSentWidget = {
  widget_id: 'quote_sent_115_1',
  widget_type: 'quote_sent',
  quote_id: 115,
  sent_at: '2026-11-07T13:43:40Z',
  was_resent: false,
};

describe('QuoteSent chat card', () => {
  // The concierge usually writes after sending a quote. That makes the card
  // no longer the last assistant message, and MessageList then passes
  // disabled=true — which used to grey out "확인 및 결제" so it did nothing.
  it('stays tappable when the chat disables older widgets', () => {
    render(<WidgetRenderer block={widget} onSubmit={vi.fn()} disabled />);
    const cta = screen.getByRole('button', { name: /확인 및 결제/ });
    expect((cta as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(cta);
    expect(push).toHaveBeenCalledWith('/quotes/115');
  });
});
