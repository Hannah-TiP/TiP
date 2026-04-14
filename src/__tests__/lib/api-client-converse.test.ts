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
    session_id: 'sess-uuid-1',
    response: 'Hello!',
    trip: { id: 42 },
    ui_blocks: [],
    field_updated: [],
    user_message_id: 1,
    assistant_message_id: 2,
  };

  it('POSTs to /api/ai-chat/converse', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    await apiClient.converse('sess-uuid-1', 'Hi');

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ai-chat/converse');
    expect(opts.method).toBe('POST');
  });

  it('sends session_id, content, message_type and widget_response in body', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    const widgetResponse = {
      widget_id: 'w1',
      widget_type: 'date_range_picker' as const,
      value: { start_date: '2026-05-01', end_date: '2026-05-08' },
    };

    await apiClient.converse('sess-uuid-1', 'pick', 'text', widgetResponse);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      session_id: 'sess-uuid-1',
      content: 'pick',
      message_type: 'text',
      widget_response: widgetResponse,
    });
  });

  it('defaults message_type to text and widget_response to null', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    await apiClient.converse('sess-uuid-1', 'Hi');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message_type).toBe('text');
    expect(body.widget_response).toBeNull();
  });

  it('unwraps response.data', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));
    const result = await apiClient.converse('sess-uuid-1', 'Hi');
    expect(result).toEqual(mockData);
  });

  it('throws when response has no data', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true, message: 'oops' }));
    await expect(apiClient.converse('sess-uuid-1', 'Hi')).rejects.toThrow(/oops/);
  });
});
