import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import en from '@/translations/en.json';
import type { AIChatSessionWithTrip } from '@/types/ai-chat';
import type { Trip } from '@/types/trip';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: { user: { email: 'test@test.com' } } }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

vi.mock('@/hooks/usePreviewMode', () => ({ usePreviewMode: () => ({ isPreview: false }) }));

vi.mock('@/components/ai-chat/MessageList', () => ({ default: () => <div>MessageList</div> }));
vi.mock('@/components/ai-chat/TripDetailPanel', () => ({ default: () => <div>Trip</div> }));
vi.mock('@/components/ai-chat/RequestHumanCTA', () => ({ default: () => null }));
// Sidebar stub: one button per session so the test can switch chats. The
// REAL ChatInput is rendered — that's what's under test.
vi.mock('@/components/ai-chat/ConversationSidebar', () => ({
  default: ({
    sessions,
    onSelectSession,
  }: {
    sessions: { session: { id: number } }[];
    onSelectSession: (id: number) => void;
  }) => (
    <div>
      {sessions.map(({ session }) => (
        <button key={session.id} type="button" onClick={() => onSelectSession(session.id)}>
          {`select-${session.id}`}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/trip-utils', () => ({
  getTripWithVersion: vi.fn().mockResolvedValue(null),
}));

function bundle(id: number, tripId: number): AIChatSessionWithTrip {
  return {
    session: { id, user_id: 1, trip_id: tripId, status: 'ai', last_message_at: null },
    trip: { id: tripId, user_id: 1, status: 'draft' } as Trip,
  };
}

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    listChatSessions: vi.fn().mockResolvedValue([bundle(1, 101), bundle(2, 202)]),
    getChatHistory: vi.fn().mockResolvedValue([]),
    createChatSessionForTrip: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('@/lib/ai-chat-utils', () => ({ createTripChatSession: vi.fn() }));
vi.mock('@/lib/debug-log', () => ({ logChatResponse: vi.fn() }));

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe('Concierge — attachment composer across chats (SMA-647)', () => {
  it('clears a picked attachment and its error when the active chat changes', async () => {
    const { default: ConciergePage } = await import('@/app/concierge/page');
    render(<ConciergePage />);

    const input = await screen.findByTestId('attachment-input');
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'Passports.pdf', { type: 'application/pdf' })] },
    });
    expect(screen.getByTestId('attachment-chip').textContent).toContain('Passports.pdf');

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'select-2' })[0]);
    });
    await waitFor(() => expect(screen.queryByTestId('attachment-chip')).toBeNull());

    // A validation error from one chat doesn't follow either.
    fireEvent.change(screen.getByTestId('attachment-input'), {
      target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] },
    });
    expect(screen.getByRole('alert').textContent).toBe(en['chat.attachment_type_error']);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'select-1' })[0]);
    });
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
