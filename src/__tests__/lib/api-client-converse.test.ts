import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

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

describe('apiClient.converse', () => {
  const mockData = {
    user_message: { id: 1, content: 'Hi', role: 'user' },
    assistant_message: { id: 2, content: 'Hello!', role: 'assistant', widgets: [] },
    trip: { id: 42 },
    trip_version: null,
    field_updated: [],
  };

  it('POSTs to /api/ai-chat/trips/{tripId}/messages', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    await apiClient.converse(42, 'Hi');

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ai-chat/trips/42/messages');
    expect(opts.method).toBe('POST');
  });

  it('sends content, message_type and widget_response in body (trip_id in URL)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    const widgetResponse = {
      widget_id: 'w1',
      widget_type: 'date_range_picker' as const,
      value: { start_date: '2026-05-01', end_date: '2026-05-08' },
    };

    await apiClient.converse(42, 'pick', 'text', widgetResponse);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      content: 'pick',
      message_type: 'text',
      widget_response: widgetResponse,
    });
  });

  it('defaults message_type to text and widget_response to null', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    await apiClient.converse(42, 'Hi');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message_type).toBe('text');
    expect(body.widget_response).toBeNull();
  });

  it('unwraps response.data', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    const result = await apiClient.converse(42, 'Hi');
    expect(result).toEqual(mockData);
  });

  it('throws when response has no data', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true, message: 'oops' }));
    await expect(apiClient.converse(42, 'Hi')).rejects.toThrow(/oops/);
  });
});
