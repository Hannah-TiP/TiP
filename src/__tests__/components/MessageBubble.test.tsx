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
        value: { value: 'leisure' },
      },
    });

    render(<MessageBubble message={msg} isUser />);

    const badge = screen.getByTestId('widget-response-option-selector');
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe('leisure');
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
        value: { values: { adults: 2, kids: 1 } },
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

function makeAssistantMessage(overrides: Partial<AIChatMessage> = {}): AIChatMessage {
  return {
    id: 99,
    user_id: 1,
    trip_id: 1,
    role: 'assistant',
    message_type: 'text',
    content: 'Of course!',
    sent_at: '2026-05-01T11:00:00Z',
    ...overrides,
  };
}

describe('MessageBubble human-concierge messages', () => {
  it('renders the Concierge Team badge for role=human_assistant', () => {
    const msg = makeAssistantMessage({
      role: 'human_assistant',
      content: 'Hi, your check-in is at 3pm.',
    });
    render(<MessageBubble message={msg} isUser={false} />);

    expect(screen.getByTestId('concierge-team-badge')).toBeDefined();
    expect(screen.getByTestId('message-human-concierge')).toBeDefined();
    expect(screen.getByText('Hi, your check-in is at 3pm.')).toBeDefined();
  });

  it('does NOT render the Concierge Team badge for role=assistant', () => {
    const msg = makeAssistantMessage({ role: 'assistant', content: 'Hello!' });
    render(<MessageBubble message={msg} isUser={false} />);

    expect(screen.queryByTestId('concierge-team-badge')).toBeNull();
    expect(screen.queryByTestId('message-human-concierge')).toBeNull();
    expect(screen.getByText('Hello!')).toBeDefined();
  });

  it('does not expose any admin identity for human_assistant messages', () => {
    // Even when created_by_admin_id is set on the wire, the customer FE must
    // render only the generic Concierge Team affordance -- never an admin
    // name, email, or numeric id.
    const msg = makeAssistantMessage({
      role: 'human_assistant',
      content: 'Welcome aboard!',
      created_by_admin_id: 7,
    } as AIChatMessage);

    const { container } = render(<MessageBubble message={msg} isUser={false} />);

    expect(container.textContent).not.toContain('7');
    expect(container.textContent?.toLowerCase()).not.toContain('admin');
    expect(screen.getByText('Concierge Team')).toBeDefined();
  });
});
