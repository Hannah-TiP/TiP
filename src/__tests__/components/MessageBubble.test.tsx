import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

describe('MessageBubble edit history', () => {
  it('renders the edited indicator for a human_assistant message with edit_history', () => {
    const msg = makeAssistantMessage({
      role: 'human_assistant',
      content: 'Check-in is at 3pm.',
      edit_history: [{ content: 'Check-in is at 2pm.', edited_at: '2026-05-01T11:00:00Z' }],
    });
    render(<MessageBubble message={msg} isUser={false} />);

    expect(screen.getByTestId('message-edited')).toBeDefined();
  });

  it('does NOT render the edited indicator when edit_history is empty or absent', () => {
    const noHistory = makeAssistantMessage({
      role: 'human_assistant',
      content: 'Check-in is at 3pm.',
    });
    const { rerender } = render(<MessageBubble message={noHistory} isUser={false} />);
    expect(screen.queryByTestId('message-edited')).toBeNull();

    const emptyHistory = makeAssistantMessage({
      role: 'human_assistant',
      content: 'Check-in is at 3pm.',
      edit_history: [],
    });
    rerender(<MessageBubble message={emptyHistory} isUser={false} />);
    expect(screen.queryByTestId('message-edited')).toBeNull();
  });

  it('expands to reveal each prior version content + timestamp with no admin identity', () => {
    const msg = makeAssistantMessage({
      role: 'human_assistant',
      content: 'Final concierge note.',
      created_by_admin_id: 7,
      edit_history: [
        { content: 'First draft note.', edited_at: '2026-05-01T10:00:00Z' },
        { content: 'Second draft note.', edited_at: '2026-05-01T11:00:00Z' },
      ],
    } as AIChatMessage);

    const { container } = render(<MessageBubble message={msg} isUser={false} />);

    // Collapsed by default.
    expect(screen.queryByTestId('edit-history')).toBeNull();

    fireEvent.click(screen.getByTestId('edit-history-toggle'));

    const history = screen.getByTestId('edit-history');
    expect(history.textContent).toContain('First draft note.');
    expect(history.textContent).toContain('Second draft note.');
    // Each entry labels its prior-version + renders a timestamp.
    expect(screen.getAllByText('Previous version')).toHaveLength(2);

    // Privacy invariant: no admin id or "admin" anywhere in the rendered tree.
    expect(container.textContent).not.toContain('7');
    expect(container.textContent?.toLowerCase()).not.toContain('admin');
  });

  it('renders the removed placeholder for a deleted message and no content/history/edited indicator', () => {
    // Backend blanks content + drops edit_history on soft-delete, keeping deleted_at.
    const msg = makeAssistantMessage({
      role: 'human_assistant',
      content: '',
      deleted_at: '2026-05-01T12:00:00Z',
    });
    render(<MessageBubble message={msg} isUser={false} />);

    expect(screen.getByTestId('message-removed-placeholder')).toBeDefined();
    expect(screen.getByText('This message was removed by the concierge team.')).toBeDefined();
    expect(screen.queryByTestId('message-edited')).toBeNull();
    expect(screen.queryByTestId('edit-history')).toBeNull();
  });

  it('ignores deleted_at even if edit_history is somehow present on a deleted message', () => {
    const msg = makeAssistantMessage({
      role: 'human_assistant',
      content: '',
      deleted_at: '2026-05-01T12:00:00Z',
      edit_history: [{ content: 'Should not show.', edited_at: '2026-05-01T11:00:00Z' }],
    });
    render(<MessageBubble message={msg} isUser={false} />);

    expect(screen.getByTestId('message-removed-placeholder')).toBeDefined();
    expect(screen.queryByTestId('message-edited')).toBeNull();
    expect(screen.queryByText('Should not show.')).toBeNull();
  });

  it('does not apply edit-history paths to user or assistant messages', () => {
    const userMsg = makeUserMessage({
      content: 'Hi',
      edit_history: [{ content: 'Hey', edited_at: '2026-05-01T10:00:00Z' }],
      deleted_at: '2026-05-01T12:00:00Z',
    } as AIChatMessage);
    const { rerender } = render(<MessageBubble message={userMsg} isUser />);
    expect(screen.queryByTestId('message-edited')).toBeNull();
    expect(screen.queryByTestId('message-removed-placeholder')).toBeNull();
    expect(screen.getByText('Hi')).toBeDefined();

    const assistantMsg = makeAssistantMessage({
      role: 'assistant',
      content: 'Regular AI reply.',
      edit_history: [{ content: 'old', edited_at: '2026-05-01T10:00:00Z' }],
    } as AIChatMessage);
    rerender(<MessageBubble message={assistantMsg} isUser={false} />);
    expect(screen.queryByTestId('message-edited')).toBeNull();
    expect(screen.getByText('Regular AI reply.')).toBeDefined();
  });
});
