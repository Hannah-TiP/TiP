import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import krTranslations from '@/translations/kr.json';
import { apiClient } from '@/lib/api-client';
import * as aiChatUtils from '@/lib/ai-chat-utils';
import type { TripVersion } from '@/types/trip';

// ── Wire mocks the page reads on mount ───────────────────────────────────

const pushMock = vi.fn();
const replaceMock = vi.fn();
const searchParamsRef: { current: URLSearchParams } = { current: new URLSearchParams() };
const sessionRef: {
  current: { status: 'authenticated' | 'unauthenticated' | 'loading'; data: unknown };
} = { current: { status: 'authenticated', data: { user: { email: 'test@test.com' } } } };
const langRef: { current: 'en' | 'kr' } = { current: 'en' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, back: vi.fn() }),
  useSearchParams: () => searchParamsRef.current,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionRef.current,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const table =
        langRef.current === 'kr'
          ? (krTranslations as Record<string, string>)
          : (enTranslations as Record<string, string>);
      return table[key] ?? key;
    },
    lang: langRef.current,
    setLang: () => {},
  }),
}));

vi.mock('@/hooks/usePreviewMode', () => ({
  usePreviewMode: () => ({ isPreview: false }),
}));

// Heavy chat / sidebar components are out of scope — we only care about
// what the prefill effect does to the API surface.
vi.mock('@/components/ai-chat/MessageList', () => ({ default: () => <div>MessageList</div> }));
vi.mock('@/components/ai-chat/ChatInput', () => ({ default: () => <div>ChatInput</div> }));
vi.mock('@/components/ai-chat/ConversationSidebar', () => ({
  default: () => <div>Sidebar</div>,
}));
vi.mock('@/components/ai-chat/TripDetailPanel', () => ({
  default: () => <div>TripDetailPanel</div>,
}));

vi.mock('@/lib/trip-utils', () => ({
  getTripWithVersion: vi.fn().mockResolvedValue({
    trip: { id: 555, user_id: 1, status: 'draft', schema_version: 1 },
    currentVersion: null,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    listChatSessions: vi.fn(),
    createChatSessionForTrip: vi.fn(),
    sendMessage: vi.fn(),
    getChatHistory: vi.fn(),
    createTrip: vi.fn(),
  },
}));

vi.mock('@/lib/ai-chat-utils', () => ({
  createTripChatSession: vi.fn(),
}));

vi.mock('@/lib/debug-log', () => ({
  logChatResponse: vi.fn(),
}));

const createdSessionFixture = {
  id: 999,
  user_id: 1,
  trip_id: 555,
  status: 'ai' as const,
  last_message_at: null,
};

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  searchParamsRef.current = new URLSearchParams();
  langRef.current = 'en';
  sessionRef.current = { status: 'authenticated', data: { user: { email: 'test@test.com' } } };

  vi.mocked(apiClient.listChatSessions).mockReset();
  vi.mocked(apiClient.listChatSessions).mockResolvedValue([]);
  vi.mocked(apiClient.getChatHistory).mockReset();
  vi.mocked(apiClient.getChatHistory).mockResolvedValue([]);
  vi.mocked(apiClient.createChatSessionForTrip).mockReset();
  vi.mocked(apiClient.sendMessage).mockReset();
  vi.mocked(apiClient.sendMessage).mockResolvedValue({
    code: 200,
    data: {
      user_message: {
        id: 1,
        user_id: 1,
        trip_id: 555,
        role: 'user',
        message_type: 'text',
        content: '',
      },
      assistant_message: null,
      trip: null,
      trip_version: null,
      field_updated: [],
    },
  });
  vi.mocked(aiChatUtils.createTripChatSession).mockReset();
  vi.mocked(aiChatUtils.createTripChatSession).mockResolvedValue({
    trip_id: 555,
    session: createdSessionFixture,
  });
});

afterEach(() => {
  cleanup();
});

async function importPage() {
  const mod = await import('@/app/concierge/page');
  return mod.default;
}

describe('Concierge — prefill consumption', () => {
  it('creates a NEW chat session pre-filled with the SearchBar values, seeds the message, and cleans the URL', async () => {
    searchParamsRef.current = new URLSearchParams(
      'prefill=1&cityId=7&city=Paris&checkIn=2026-06-01&checkOut=2026-06-07&adults=2&children=1&tripType=Leisure&travelStyle=Romantic+Escape',
    );

    const ConciergePage = await importPage();
    render(<ConciergePage />);

    // 1) New trip created with the prefill payload.
    await waitFor(() => {
      expect(aiChatUtils.createTripChatSession).toHaveBeenCalledTimes(1);
    });
    const passedVersion = (vi.mocked(aiChatUtils.createTripChatSession).mock.calls[0][0] ??
      {}) as Partial<TripVersion>;
    expect(passedVersion.title).toBe('Paris');
    expect(passedVersion.start_date).toBe('2026-06-01');
    expect(passedVersion.end_date).toBe('2026-06-07');
    expect(passedVersion.adults).toBe(2);
    expect(passedVersion.kids).toBe(1);
    expect(passedVersion.trip_preferences).toEqual([
      {
        type: 'custom',
        key: 'destination_city_ids',
        value: '7',
        label: 'Matched destination cities',
      },
      { type: 'purpose', value: 'leisure' },
    ]);

    // 2) URL cleaned up so a refresh doesn't re-fire the prefill.
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/concierge', { scroll: false });
    });

    // 3) Seed message auto-sent into the new session.
    await waitFor(() => {
      expect(apiClient.sendMessage).toHaveBeenCalledTimes(1);
    });
    const [tripId, payload] = vi.mocked(apiClient.sendMessage).mock.calls[0];
    expect(tripId).toBe(555);
    expect(payload.content).toBeTruthy();
    expect(payload.content).toContain('Paris');
    expect(payload.content).toContain('2026-06-01');
    expect(payload.content).toContain('Romantic Escape');
  });

  it('does NOT reuse the user’s most-recent session even when one exists for the trip', async () => {
    // Even with an existing session list, the prefill flow must create
    // a brand-new session — not reuse any prior session.
    vi.mocked(apiClient.listChatSessions).mockResolvedValue([
      {
        session: {
          id: 1,
          user_id: 1,
          trip_id: 123,
          status: 'ai',
          last_message_at: new Date().toISOString(),
        },
        trip: { id: 123, user_id: 1, status: 'draft', schema_version: 1 },
      },
    ]);
    searchParamsRef.current = new URLSearchParams('prefill=1&adults=2&children=0&tripType=Leisure');

    const ConciergePage = await importPage();
    render(<ConciergePage />);

    await waitFor(() => {
      expect(aiChatUtils.createTripChatSession).toHaveBeenCalledTimes(1);
    });
    expect(apiClient.createChatSessionForTrip).not.toHaveBeenCalled();
  });

  it('seeds the message in Korean when the language context is KR', async () => {
    langRef.current = 'kr';
    // The DestinationDropdown stores the active-language city name in the
    // URL — KR users get "파리" here, the seed message echoes it back.
    searchParamsRef.current = new URLSearchParams(
      'prefill=1&cityId=7&city=%ED%8C%8C%EB%A6%AC&checkIn=2026-06-01&checkOut=2026-06-07&adults=2&children=0&tripType=Leisure',
    );

    const ConciergePage = await importPage();
    render(<ConciergePage />);

    await waitFor(() => {
      expect(apiClient.sendMessage).toHaveBeenCalledTimes(1);
    });
    const [, payload] = vi.mocked(apiClient.sendMessage).mock.calls[0];
    expect(payload.content).toContain('계획하고 싶습니다');
    expect(payload.content).toContain('파리');
    expect(payload.content).toContain('성인 2명');
  });

  it('skips the prefill flow entirely when no prefill flag is present', async () => {
    searchParamsRef.current = new URLSearchParams();
    vi.mocked(apiClient.listChatSessions).mockResolvedValue([]);

    const ConciergePage = await importPage();
    render(<ConciergePage />);

    // The empty-sessions branch calls handleNewChat → createTripChatSession
    // with default args, but it must NOT seed any message and must NOT
    // call replace() to strip the URL (the URL is already clean).
    await waitFor(() => {
      // Allow handleNewChat to complete.
      expect(aiChatUtils.createTripChatSession).toHaveBeenCalled();
    });
    expect(apiClient.sendMessage).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalledWith('/concierge', { scroll: false });
  });
});

describe('Concierge — unauth redirect preserves prefill params', () => {
  it('redirects unauthed users to /sign-in with the full prefill URL in the redirect param', async () => {
    sessionRef.current = { status: 'unauthenticated', data: null };
    searchParamsRef.current = new URLSearchParams(
      'prefill=1&cityId=7&city=Paris&checkIn=2026-06-01&checkOut=2026-06-07&adults=2&children=0&tripType=Leisure',
    );

    // window.location.pathname/search is what the redirect logic reads.
    // jsdom default is `http://localhost:3000/`. Spoof location so the
    // captured redirect mirrors the real flow.
    const search =
      '?prefill=1&cityId=7&city=Paris&checkIn=2026-06-01&checkOut=2026-06-07&adults=2&children=0&tripType=Leisure';
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/concierge', search },
    });

    const ConciergePage = await importPage();
    render(<ConciergePage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledTimes(1);
    });
    const pushedTo: string = pushMock.mock.calls[0][0];
    expect(pushedTo.startsWith('/sign-in?redirect=')).toBe(true);
    const redirectValue = decodeURIComponent(pushedTo.replace('/sign-in?redirect=', ''));
    expect(redirectValue).toBe('/concierge' + search);

    // Must not have started any trip/session creation in the unauthed branch.
    expect(aiChatUtils.createTripChatSession).not.toHaveBeenCalled();
    expect(apiClient.sendMessage).not.toHaveBeenCalled();
  });
});
