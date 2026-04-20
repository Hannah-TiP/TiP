import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MessageBubble from '@/components/ai-chat/MessageBubble';
import type { AIChatMessage } from '@/types/ai-chat';

afterEach(() => {
  cleanup();
});

function makeUserMessage(overrides: Partial<AIChatMessage> = {}): AIChatMessage {
  return {
    id: 1,
    user_id: 1,
    trip_id: 1,
    role: 'user',
    message_type: 'text',
    content: 'Hello',
    sent_at: '2026-05-01T10:00:00Z',
    schema_version: 1,
    ...overrides,
  };
}

describe('MessageBubble user messages', () => {
  it('renders text content for regular user messages', () => {
    const msg = makeUserMessage({ content: 'Plan a trip to Paris' });
    render(<MessageBubble message={msg} isUser />);

    expect(screen.getByText('Plan a trip to Paris')).toBeDefined();
  });

  it('renders widget response display instead of text for widget response messages', () => {
    const msg = makeUserMessage({
      content: '',
      widget_response: {
        widget_id: 'w-1',
        widget_type: 'option_selector',
        value: { value: 'leisure', label: 'Leisure' },
      },
    });

    render(<MessageBubble message={msg} isUser />);

    const badge = screen.getByTestId('widget-response-option-selector');
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe('Leisure');
  });

  it('renders widget response for date range picker in user bubble', () => {
    const msg = makeUserMessage({
      content: '',
      widget_response: {
        widget_id: 'w-2',
        widget_type: 'date_range_picker',
        value: { start_date: '2026-06-01', end_date: '2026-06-10' },
      },
    });

    render(<MessageBubble message={msg} isUser />);

    const el = screen.getByTestId('widget-response-date-range');
    expect(el).toBeDefined();
    expect(el.textContent).toContain('Jun');
  });

  it('renders widget response for number stepper in user bubble', () => {
    const msg = makeUserMessage({
      content: '',
      widget_response: {
        widget_id: 'w-3',
        widget_type: 'number_stepper',
        value: { adults: 2, kids: 1 },
      },
    });

    render(<MessageBubble message={msg} isUser />);

    const el = screen.getByTestId('widget-response-number-stepper');
    expect(el).toBeDefined();
    expect(el.textContent).toContain('2 Adults');
    expect(el.textContent).toContain('1 Kids');
  });

  it('does not render widget response display for messages without widget_response', () => {
    const msg = makeUserMessage({ content: 'Just text' });
    render(<MessageBubble message={msg} isUser />);

    expect(screen.getByText('Just text')).toBeDefined();
    expect(screen.queryByTestId('widget-response-option-selector')).toBeNull();
    expect(screen.queryByTestId('widget-response-date-range')).toBeNull();
  });
});
