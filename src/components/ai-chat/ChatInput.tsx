'use client';

import { useCallback, useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useLanguage, type TranslationKeys } from '@/contexts/LanguageContext';
import {
  CHAT_ATTACHMENT_ACCEPT,
  isImageFile,
  validateChatAttachmentFile,
} from '@/lib/chat-attachment-upload';
import { ApiError } from '@/lib/api-error';
import {
  formatRecordingTime,
  useVoiceRecorder,
  type VoiceRecorderError,
} from '@/components/ai-chat/useVoiceRecorder';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  /**
   * SMA-647: send one image/PDF with an optional caption. Must reject on
   * upload/send failure so the composer keeps the file + text for a retry.
   */
  onSendAttachment?: (file: File, caption: string) => Promise<void>;
  /**
   * SMA-896: speech-to-text for the mic. Resolves the transcript, which is
   * put into the message box for the customer to review and send. Must
   * reject (ApiError for a localized server message) on failure.
   */
  onTranscribeVoice?: (audio: Blob) => Promise<string>;
  isLoading: boolean;
}

const VALIDATION_ERROR_KEYS: Record<'type' | 'size', TranslationKeys> = {
  type: 'chat.attachment_type_error',
  size: 'chat.attachment_size_error',
};

const VOICE_ERROR_KEYS: Record<VoiceRecorderError, TranslationKeys> = {
  unsupported: 'chat.voice_unsupported',
  permission: 'chat.voice_permission_denied',
  failed: 'chat.voice_transcribe_error',
};

export default function ChatInput({
  onSendMessage,
  onSendAttachment,
  onTranscribeVoice,
  isLoading,
}: ChatInputProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKeys | null>(null);
  // Backend-localized v2 `message` from a failed upload/finalize/send.
  const [serverError, setServerError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleRecorded = useCallback(
    async (audio: Blob) => {
      if (!onTranscribeVoice) return;
      setIsTranscribing(true);
      try {
        const text = await onTranscribeVoice(audio);
        // Append to anything already typed; the customer reviews, then sends.
        setInputValue((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));
        textInputRef.current?.focus();
      } catch (err) {
        if (err instanceof ApiError && err.status === 413) setErrorKey('chat.voice_too_long');
        else if (err instanceof ApiError && err.message) setServerError(err.message);
        else setErrorKey('chat.voice_transcribe_error');
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscribeVoice],
  );

  const handleRecorderError = useCallback((error: VoiceRecorderError) => {
    setServerError(null);
    setErrorKey(VOICE_ERROR_KEYS[error]);
  }, []);

  const recorder = useVoiceRecorder({
    onRecorded: (audio) => void handleRecorded(audio),
    onError: handleRecorderError,
  });

  // Object-URL thumbnail for an image attachment, revoked on change/unmount.
  useEffect(() => {
    if (!file || !isImageFile(file)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewFailed(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const busy = isLoading || isUploading || isTranscribing || recorder.isRecording;
  const canSend = !busy && (file !== null || inputValue.trim() !== '');

  const handleSend = async () => {
    if (!canSend) return;
    if (file && onSendAttachment) {
      setIsUploading(true);
      setErrorKey(null);
      setServerError(null);
      try {
        await onSendAttachment(file, inputValue.trim());
        setFile(null);
        setInputValue('');
      } catch (err) {
        // Keep the file + caption so the customer can retry.
        if (err instanceof ApiError) setServerError(err.message);
        else setErrorKey('chat.attachment_upload_error');
      } finally {
        setIsUploading(false);
      }
      return;
    }
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleAttachChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (attachInputRef.current) {
      attachInputRef.current.value = '';
    }
    if (!picked) return;
    setServerError(null);
    const invalid = validateChatAttachmentFile(picked);
    if (invalid) {
      setErrorKey(VALIDATION_ERROR_KEYS[invalid]);
      return;
    }
    setErrorKey(null);
    setFile(picked);
  };

  const startRecording = () => {
    setErrorKey(null);
    setServerError(null);
    void recorder.start();
  };

  return (
    <div className="border-t border-gray-100 px-4 md:px-[60px] py-5">
      {(file || errorKey || serverError) && (
        <div className="mb-2 flex flex-col gap-2">
          {file && (
            <div
              className="flex max-w-[320px] items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2"
              data-testid="attachment-chip"
            >
              {previewUrl && !previewFailed ? (
                // Object URLs can't go through next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={t('chat.attachment_preview_alt').replace('{name}', file.name)}
                  onError={() => setPreviewFailed(true)}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  data-testid="attachment-chip-thumbnail"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3D2F] text-white"
                  data-testid="attachment-chip-file-icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-inter text-sm text-gray-900">{file.name}</span>
                {isUploading && (
                  <span
                    className="block font-inter text-xs text-gray-500"
                    data-testid="attachment-uploading"
                  >
                    {t('chat.attachment_uploading')}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setErrorKey(null);
                  setServerError(null);
                }}
                disabled={isUploading}
                aria-label={t('chat.attachment_remove')}
                title={t('chat.attachment_remove')}
                className="shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {(serverError || errorKey) && (
            <p
              role="alert"
              className="font-inter text-xs text-red-600"
              data-testid="attachment-error"
            >
              {serverError ?? (errorKey && t(errorKey))}
            </p>
          )}
        </div>
      )}
      <div className="flex min-h-[44px] items-center gap-3 bg-gray-50 rounded-xl px-5 py-3">
        {/* Attachment button (SMA-647): one image or PDF per message */}
        {onSendAttachment && (
          <>
            <input
              ref={attachInputRef}
              type="file"
              accept={CHAT_ATTACHMENT_ACCEPT}
              onChange={handleAttachChange}
              className="hidden"
              disabled={busy}
              data-testid="attachment-input"
            />
            <button
              type="button"
              onClick={() => attachInputRef.current?.click()}
              disabled={busy}
              className="shrink-0 text-gray-400 hover:text-[#1E3D2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('chat.attach_file')}
              aria-label={t('chat.attach_file')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          </>
        )}

        {/* Voice input (SMA-896): record -> transcript into the message box */}
        {onTranscribeVoice && !recorder.isRecording && (
          <button
            type="button"
            onClick={startRecording}
            disabled={busy}
            className="shrink-0 text-gray-400 hover:text-[#1E3D2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('chat.voice_start')}
            aria-label={t('chat.voice_start')}
            data-testid="voice-start"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

        {recorder.isRecording ? (
          <div
            className="flex min-w-0 flex-1 items-center gap-3"
            role="status"
            data-testid="voice-recording"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500"
            />
            <span className="min-w-0 flex-1 truncate font-inter text-sm text-gray-800">
              {t('chat.voice_recording').replace(
                '{time}',
                formatRecordingTime(recorder.elapsedSeconds),
              )}
            </span>
            <button
              type="button"
              onClick={recorder.cancel}
              className="shrink-0 text-gray-400 hover:text-gray-700"
              title={t('chat.voice_cancel')}
              aria-label={t('chat.voice_cancel')}
              data-testid="voice-cancel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={recorder.stop}
              className="shrink-0 rounded-lg bg-red-500 px-4 py-2 font-inter text-sm text-white hover:opacity-90"
              data-testid="voice-stop"
            >
              {t('chat.voice_stop')}
            </button>
          </div>
        ) : (
          <>
            <input
              ref={textInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isTranscribing
                  ? t('chat.voice_transcribing')
                  : file
                    ? t('chat.attachment_caption_placeholder')
                    : t('chat.placeholder')
              }
              disabled={busy}
              className="min-w-0 flex-1 bg-transparent outline-none font-inter text-sm text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!canSend}
              className="shrink-0 bg-[#1E3D2F] text-white rounded-lg px-5 py-2 font-inter text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploading ? t('chat.sending') : t('chat.send')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
