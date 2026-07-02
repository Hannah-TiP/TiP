import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import MessageList from '@/components/ai-chat/MessageList';
import type { AIChatMessage, PendingMessage } from '@/types/ai-chat';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: () => {},
  }),
}));

const scrollIntoViewMock = vi.fn();

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoViewMock;
});

beforeEach(() => {
  scrollIntoViewMock.mockClear();
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

describe('MessageList scroll behavior', () => {
  // jsdom has no layout — stub the container's scroll metrics, then fire a
  // scroll event so the component's near-bottom tracking picks them up.
  function setScrollPosition(
    container: HTMLElement,
    {
      scrollHeight,
      clientHeight,
      scrollTop,
    }: { scrollHeight: number; clientHeight: number; scrollTop: number },
  ) {
    Object.defineProperty(container, 'scrollHeight', { value: scrollHeight, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: clientHeight, configurable: true });
    Object.defineProperty(container, 'scrollTop', {
      value: scrollTop,
      configurable: true,
      writable: true,
    });
    fireEvent.scroll(container);
  }

  function scrollFarUp(container: HTMLElement) {
    // 1000 - (100 + 400) = 500 >= 100 threshold → not near bottom
    setScrollPosition(container, { scrollHeight: 1000, clientHeight: 400, scrollTop: 100 });
  }

  function defaultProps(messages: AIChatMessage[]) {
    return {
      messages,
      isLoading: false,
      pendingMessage: null,
      onWidgetSubmit: () => {},
    };
  }

  const m1 = makeMessage({ id: 1, content: 'First' });
  const m2 = makeMessage({ id: 2, content: 'Second' });

  it('scrolls to bottom instantly on initial render with messages', () => {
    render(<MessageList {...defaultProps([m1])} />);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'auto' });
    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });

  it('does not scroll but shows the button when a new message arrives while scrolled up', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1])} />);
    scrollFarUp(screen.getByTestId('message-list-container'));
    scrollIntoViewMock.mockClear();

    rerender(<MessageList {...defaultProps([m1, m2])} />);

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('scroll-to-bottom-button')).toBeDefined();
  });

  it('ignores identity-only array replacement (polling tick) while scrolled up', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1, m2])} />);
    scrollFarUp(screen.getByTestId('message-list-container'));
    scrollIntoViewMock.mockClear();

    rerender(<MessageList {...defaultProps([{ ...m1 }, { ...m2 }])} />);

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });

  it('ignores identity-only array replacement (polling tick) while near bottom', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1, m2])} />);
    scrollIntoViewMock.mockClear();

    rerender(<MessageList {...defaultProps([{ ...m1 }, { ...m2 }])} />);

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });

  it('auto-follows a new message when near bottom, without showing the button', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1])} />);
    scrollIntoViewMock.mockClear();

    rerender(<MessageList {...defaultProps([m1, m2])} />);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });

  it('clicking the button scrolls to bottom and dismisses it', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1])} />);
    scrollFarUp(screen.getByTestId('message-list-container'));
    rerender(<MessageList {...defaultProps([m1, m2])} />);
    scrollIntoViewMock.mockClear();

    fireEvent.click(screen.getByTestId('scroll-to-bottom-button'));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });

  it('scrolling back near the bottom dismisses the button', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1])} />);
    const container = screen.getByTestId('message-list-container');
    scrollFarUp(container);
    rerender(<MessageList {...defaultProps([m1, m2])} />);
    expect(screen.getByTestId('scroll-to-bottom-button')).toBeDefined();

    // 1000 - (950 + 400) < 100 → near bottom again
    setScrollPosition(container, { scrollHeight: 1000, clientHeight: 400, scrollTop: 950 });

    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });

  it('scrolls when the pending message appears even while scrolled up (own send)', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1])} />);
    scrollFarUp(screen.getByTestId('message-list-container'));
    scrollIntoViewMock.mockClear();

    const pending: PendingMessage = {
      content: 'My own message',
      widget_response: null,
      sent_at: '2026-05-01T10:01:00Z',
    };
    rerender(<MessageList {...defaultProps([m1])} pendingMessage={pending} />);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });

  it('scrolls when isLoading flips on even while scrolled up (audio own send)', () => {
    const { rerender } = render(<MessageList {...defaultProps([m1])} />);
    scrollFarUp(screen.getByTestId('message-list-container'));
    scrollIntoViewMock.mockClear();

    rerender(<MessageList {...defaultProps([m1])} isLoading={true} />);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(screen.queryByTestId('scroll-to-bottom-button')).toBeNull();
  });
});
