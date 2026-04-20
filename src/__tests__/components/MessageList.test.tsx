import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import MessageList from '@/components/ai-chat/MessageList';
import type { AIChatMessage, PendingMessage } from '@/types/ai-chat';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: () => {},
  }),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
});

function makeMessage(overrides: Partial<AIChatMessage> = {}): AIChatMessage {
  return {
    id: 1,
    user_id: 1,
    trip_id: 1,
    role: 'assistant',
    message_type: 'text',
    content: 'Hello, how can I help?',
    sent_at: '2026-05-01T10:00:00Z',
    ...overrides,
  };
}

describe('MessageList pending message', () => {
  it('renders pending text message at the bottom', () => {
    const pending: PendingMessage = {
      content: 'I want to go to Paris',
      widget_response: null,
      sent_at: '2026-05-01T10:01:00Z',
    };

    render(
      <MessageList
        messages={[makeMessage()]}
        isLoading={false}
        pendingMessage={pending}
        onWidgetSubmit={() => {}}
      />,
    );

    const pendingEl = screen.getByTestId('pending-message');
    expect(pendingEl).toBeDefined();
    expect(pendingEl.textContent).toContain('I want to go to Paris');
  });

  it('renders pending widget response message', () => {
    const pending: PendingMessage = {
      content: '',
      widget_response: {
        widget_id: 'w-1',
        widget_type: 'option_selector',
        value: { value: 'leisure' },
      },
      sent_at: '2026-05-01T10:01:00Z',
    };

    render(
      <MessageList
        messages={[makeMessage()]}
        isLoading={false}
        pendingMessage={pending}
        onWidgetSubmit={() => {}}
      />,
    );

    const pendingEl = screen.getByTestId('pending-message');
    expect(pendingEl).toBeDefined();
    expect(screen.getByTestId('widget-response-option-selector')).toBeDefined();
  });

  it('does not render pending message when null', () => {
    render(
      <MessageList
        messages={[makeMessage()]}
        isLoading={false}
        pendingMessage={null}
        onWidgetSubmit={() => {}}
      />,
    );

    expect(screen.queryByTestId('pending-message')).toBeNull();
  });

  it('shows typing indicator when isLoading is true', () => {
    render(
      <MessageList
        messages={[makeMessage()]}
        isLoading={true}
        pendingMessage={null}
        onWidgetSubmit={() => {}}
      />,
    );

    // Typing indicator has bouncing dots
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });

  it('shows both pending message and typing indicator together', () => {
    const pending: PendingMessage = {
      content: 'Tell me about hotels',
      widget_response: null,
      sent_at: '2026-05-01T10:01:00Z',
    };

    render(
      <MessageList
        messages={[makeMessage()]}
        isLoading={true}
        pendingMessage={pending}
        onWidgetSubmit={() => {}}
      />,
    );

    expect(screen.getByTestId('pending-message')).toBeDefined();
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });

  it('shows empty state when no messages, no pending, and not loading', () => {
    render(
      <MessageList
        messages={[]}
        isLoading={false}
        pendingMessage={null}
        onWidgetSubmit={() => {}}
      />,
    );

    expect(screen.getByText('chat.no_messages')).toBeDefined();
  });

  it('does not show empty state when pending message is present', () => {
    const pending: PendingMessage = {
      content: 'Hello',
      widget_response: null,
      sent_at: '2026-05-01T10:01:00Z',
    };

    render(
      <MessageList
        messages={[]}
        isLoading={false}
        pendingMessage={pending}
        onWidgetSubmit={() => {}}
      />,
    );

    expect(screen.queryByText('chat.no_messages')).toBeNull();
    expect(screen.getByTestId('pending-message')).toBeDefined();
  });
});
