'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * SMA-896: in-browser voice recording for the concierge mic.
 *
 * Records one clip with MediaRecorder (Chrome/Firefox: WebM/Opus, Safari:
 * MP4/AAC) at a speech bitrate. 2 minutes at 32 kbps is ~0.5 MB, which keeps
 * the upload well under nginx's default 1 MB request cap.
 */
export const VOICE_MAX_SECONDS = 120;
export const VOICE_BITS_PER_SECOND = 32_000;

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/webm',
];

export type VoiceRecorderError = 'unsupported' | 'permission' | 'failed';

export function isVoiceRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/** First container this browser can record, or undefined for its default. */
export function pickRecorderMimeType(
  isTypeSupported: (type: string) => boolean = (type) => MediaRecorder.isTypeSupported(type),
): string | undefined {
  return MIME_CANDIDATES.find((type) => isTypeSupported(type));
}

interface Options {
  onRecorded: (audio: Blob) => void;
  onError: (error: VoiceRecorderError) => void;
}

export function useVoiceRecorder({ onRecorded, onError }: Options) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const callbacks = useRef({ onRecorded, onError });

  useEffect(() => {
    callbacks.current = { onRecorded, onError };
  }, [onRecorded, onError]);

  const releaseStream = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    if (!isVoiceRecordingSupported()) {
      callbacks.current.onError('unsupported');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      callbacks.current.onError(
        name === 'NotAllowedError' || name === 'SecurityError' ? 'permission' : 'failed',
      );
      return;
    }

    let recorder: MediaRecorder;
    try {
      const mimeType = pickRecorderMimeType();
      recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: VOICE_BITS_PER_SECOND,
      });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      callbacks.current.onError('failed');
      return;
    }

    const chunks: Blob[] = [];
    cancelledRef.current = false;
    streamRef.current = stream;
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      releaseStream();
      recorderRef.current = null;
      setIsRecording(false);
      setElapsedSeconds(0);
      if (cancelledRef.current) return;
      const audio = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || '' });
      if (audio.size === 0) {
        callbacks.current.onError('failed');
        return;
      }
      callbacks.current.onRecorded(audio);
    };

    recorder.start();
    setIsRecording(true);
    setElapsedSeconds(0);
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(seconds);
      if (seconds >= VOICE_MAX_SECONDS) stop();
    }, 250);
  }, [releaseStream, stop]);

  // Never leave the mic open after the composer unmounts.
  useEffect(
    () => () => {
      cancelledRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      releaseStream();
    },
    [releaseStream],
  );

  return { isRecording, elapsedSeconds, start, stop, cancel };
}

/** "m:ss" for the recording timer. */
export function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
