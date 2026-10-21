'use client';

import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useLanguage, type TranslationKeys } from '@/contexts/LanguageContext';
import {
  CHAT_ATTACHMENT_ACCEPT,
  isImageFile,
  validateChatAttachmentFile,
} from '@/lib/chat-attachment-upload';
import { ApiError } from '@/lib/api-error';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  /**
   * SMA-647: send one image/PDF with an optional caption. Must reject on
   * upload/send failure so the composer keeps the file + text for a retry.
   */
  onSendAttachment?: (file: File, caption: string) => Promise<void>;
  onUploadAudio?: (file: File) => void;
  isLoading: boolean;
}

const VALIDATION_ERROR_KEYS: Record<'type' | 'size', TranslationKeys> = {
  type: 'chat.attachment_type_error',
  size: 'chat.attachment_size_error',
};

export default function ChatInput({
  onSendMessage,
  onSendAttachment,
  onUploadAudio,
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
  const attachInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  const busy = isLoading || isUploading;
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

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadAudio) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(t('chat.audio_size_error'));
        return;
      }
      onUploadAudio(file);
    }
    // Reset input
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
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

        {/* Audio upload button */}
        {onUploadAudio && (
          <>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="hidden"
              disabled={busy}
            />
            <button
              onClick={() => audioInputRef.current?.click()}
              disabled={busy}
              className="shrink-0 text-gray-400 hover:text-[#1E3D2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('chat.upload_audio')}
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
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </>
        )}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={file ? t('chat.attachment_caption_placeholder') : t('chat.placeholder')}
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent outline-none font-inter text-sm text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="shrink-0 bg-[#1E3D2F] text-white rounded-lg px-5 py-2 font-inter text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? t('chat.sending') : t('chat.send')}
        </button>
      </div>
    </div>
  );
}
