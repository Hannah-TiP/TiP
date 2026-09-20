import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

// SMA-469: every concierge-chat call carries the active site language as
// ?language= so the proxy forwards it as the backend `Language` header and the
// reply language / hotel carousel names follow the EN/KR toggle.

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('ApiClient concierge-chat language forwarding (SMA-469)', () => {
  it('sendMessage appends ?language= to the messages proxy', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.sendMessage(7, { content: 'ok' }, 'en');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai-chat/trips/7/messages?language=en',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sendMessage sends no language param when none is given (backend ladder resolves)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));
    await apiClient.sendMessage(7, { content: 'ok' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ai-chat/trips/7/messages');
  });

  it('createChatSessionForTrip appends ?language=', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { id: 1 } }));
    await apiClient.createChatSessionForTrip(7, 'kr');
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ai-chat/create-session-for-trip?language=kr');
  });

  it('getChatHistory appends ?language= alongside the paging params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));
    await apiClient.getChatHistory(7, { before: 910, limit: 100 }, 'en');
    expect(mockFetch.mock.calls[0][0]).toBe(
      '/api/ai-chat/trips/7/messages?before=910&limit=100&language=en',
    );
  });

  it('requestHumanConcierge appends ?language=', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { status: 'human' } }));
    await apiClient.requestHumanConcierge(7, 'kr');
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ai-chat/trips/7/request-human?language=kr');
  });
});
