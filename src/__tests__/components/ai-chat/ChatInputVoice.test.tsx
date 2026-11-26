import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import en from '@/translations/en.json';
import ChatInput from '@/components/ai-chat/ChatInput';
import { ApiError } from '@/lib/api-error';

// SMA-896: mic -> MediaRecorder -> onTranscribeVoice -> transcript in the box.

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => {
    const catalog = en as Record<string, string>;
    return { lang: 'en', setLang: () => {}, t: (key: string) => catalog[key] ?? key };
  },
}));

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = (type: string) => type === 'audio/webm;codecs=opus';
  state: 'inactive' | 'recording' = 'inactive';
  mimeType: string;
  options: MediaRecorderOptions | undefined;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.options = options;
    this.mimeType = options?.mimeType ?? '';
    FakeMediaRecorder.instances.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['voice-bytes'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

const trackStop = vi.fn();
const getUserMedia = vi.fn();

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  trackStop.mockReset();
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: trackStop }] });
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const mic = () => screen.getByRole('button', { name: en['chat.voice_start'] });
const textbox = () => screen.getByRole('textbox') as HTMLInputElement;

async function record() {
  await act(async () => {
    fireEvent.click(mic());
  });
}

describe('ChatInput voice input (SMA-896)', () => {
  it('hides the mic without a transcribe handler', () => {
    render(<ChatInput onSendMessage={vi.fn()} isLoading={false} />);
    expect(screen.queryByRole('button', { name: en['chat.voice_start'] })).toBeNull();
  });

  it('records at a speech bitrate, then puts the transcript in the box without sending', async () => {
    const onSendMessage = vi.fn();
    const onTranscribeVoice = vi.fn().mockResolvedValue('파리 리츠에 3박 묵고 싶어요');
    render(
      <ChatInput
        onSendMessage={onSendMessage}
        onTranscribeVoice={onTranscribeVoice}
        isLoading={false}
      />,
    );

    await record();

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(FakeMediaRecorder.instances[0].options).toEqual({
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 32_000,
    });
    expect(screen.getByTestId('voice-recording').textContent).toContain('Recording… 0:00');

    await act(async () => {
      fireEvent.click(screen.getByTestId('voice-stop'));
    });

    const blob = onTranscribeVoice.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('audio/webm;codecs=opus');
    expect(trackStop).toHaveBeenCalled(); // mic released
    expect(textbox().value).toBe('파리 리츠에 3박 묵고 싶어요');
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('appends the transcript to text already typed', async () => {
    render(
      <ChatInput
        onSendMessage={vi.fn()}
        onTranscribeVoice={vi.fn().mockResolvedValue('two adults')}
        isLoading={false}
      />,
    );
    fireEvent.change(textbox(), { target: { value: 'Rome in May,  ' } });
    await record();
    await act(async () => {
      fireEvent.click(screen.getByTestId('voice-stop'));
    });
    expect(textbox().value).toBe('Rome in May, two adults');
  });

  it('cancel discards the recording', async () => {
    const onTranscribeVoice = vi.fn();
    render(
      <ChatInput onSendMessage={vi.fn()} onTranscribeVoice={onTranscribeVoice} isLoading={false} />,
    );
    await record();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: en['chat.voice_cancel'] }));
    });
    expect(onTranscribeVoice).not.toHaveBeenCalled();
    expect(trackStop).toHaveBeenCalled();
    expect(screen.queryByTestId('voice-recording')).toBeNull();
  });

  it('auto-stops at 2 minutes', async () => {
    vi.useFakeTimers();
    const onTranscribeVoice = vi.fn().mockResolvedValue('ok');
    render(
      <ChatInput onSendMessage={vi.fn()} onTranscribeVoice={onTranscribeVoice} isLoading={false} />,
    );
    await record();
    await act(async () => {
      vi.advanceTimersByTime(119_000);
    });
    expect(onTranscribeVoice).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1_500);
    });
    expect(onTranscribeVoice).toHaveBeenCalledTimes(1);
  });

  it('shows a localized message when mic permission is denied', async () => {
    getUserMedia.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    render(<ChatInput onSendMessage={vi.fn()} onTranscribeVoice={vi.fn()} isLoading={false} />);
    await record();
    expect(screen.getByRole('alert').textContent).toBe(en['chat.voice_permission_denied']);
  });

  it('shows the unsupported message when the browser cannot record', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    render(<ChatInput onSendMessage={vi.fn()} onTranscribeVoice={vi.fn()} isLoading={false} />);
    await record();
    expect(screen.getByRole('alert').textContent).toBe(en['chat.voice_unsupported']);
  });

  it('surfaces the server message, and a too-long message on 413', async () => {
    const onTranscribeVoice = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('음성을 알아듣지 못했어요.', 422))
      .mockRejectedValueOnce(new ApiError('', 413));
    render(
      <ChatInput onSendMessage={vi.fn()} onTranscribeVoice={onTranscribeVoice} isLoading={false} />,
    );

    await record();
    await act(async () => {
      fireEvent.click(screen.getByTestId('voice-stop'));
    });
    expect(screen.getByRole('alert').textContent).toBe('음성을 알아듣지 못했어요.');

    await record();
    await act(async () => {
      fireEvent.click(screen.getByTestId('voice-stop'));
    });
    expect(screen.getByRole('alert').textContent).toBe(en['chat.voice_too_long']);
  });
});
