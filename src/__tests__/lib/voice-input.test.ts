import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { voiceFileName } from '@/lib/voice-file-name';
import { formatRecordingTime, pickRecorderMimeType } from '@/components/ai-chat/useVoiceRecorder';

// SMA-896 helpers + the multipart transcribe call.

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => mockFetch.mockReset());

describe('pickRecorderMimeType', () => {
  it('prefers WebM/Opus, falls back to MP4 (Safari), else browser default', () => {
    expect(pickRecorderMimeType(() => true)).toBe('audio/webm;codecs=opus');
    expect(pickRecorderMimeType((t) => t === 'audio/mp4')).toBe('audio/mp4');
    expect(pickRecorderMimeType(() => false)).toBeUndefined();
  });
});

describe('formatRecordingTime', () => {
  it('formats m:ss', () => {
    expect(formatRecordingTime(0)).toBe('0:00');
    expect(formatRecordingTime(65)).toBe('1:05');
    expect(formatRecordingTime(120)).toBe('2:00');
  });
});

describe('voiceFileName', () => {
  it('maps recorder types to extensions', () => {
    expect(voiceFileName('audio/webm;codecs=opus')).toBe('voice.webm');
    expect(voiceFileName('audio/mp4')).toBe('voice.m4a');
    expect(voiceFileName('audio/ogg;codecs=opus')).toBe('voice.ogg');
    expect(voiceFileName('')).toBe('voice.webm');
  });
});

describe('apiClient.transcribeVoice', () => {
  it('posts multipart `audio` to the proxy with ?language= and returns the text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { text: 'hello' } }),
    });
    const blob = new Blob(['x'], { type: 'audio/mp4' });

    await expect(apiClient.transcribeVoice(7, blob, 'kr')).resolves.toBe('hello');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ai-chat/trips/7/transcribe?language=kr');
    expect(init.method).toBe('POST');
    expect(init.headers).toBeUndefined(); // browser sets the multipart boundary
    const file = (init.body as FormData).get('audio') as File;
    expect(file.name).toBe('voice.m4a');
  });

  it('throws ApiError with the localized message and status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ message: '음성을 알아듣지 못했어요.' }),
    });
    const err = await apiClient
      .transcribeVoice(7, new Blob(['x'], { type: 'audio/webm' }))
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.message).toBe('음성을 알아듣지 못했어요.');
  });
});
