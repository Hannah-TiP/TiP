'use client';

import Image from 'next/image';
import type { ChatAttachment } from '@/types/ai-chat';
import { resolveS3Url } from '@/types/common';
import { formatFileSize } from '@/lib/format-file-size';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageAttachmentProps {
  attachment: ChatAttachment;
}

export function isImageAttachment(attachment: ChatAttachment): boolean {
  return attachment.content_type.startsWith('image/');
}

/**
 * A concierge-sent chat attachment: images render as an inline thumbnail,
 * everything else (PDF) as a file chip. Both open the full file in a new tab.
 */
export default function MessageAttachment({ attachment }: MessageAttachmentProps) {
  const { t } = useLanguage();
  const url = resolveS3Url(attachment.file);
  if (!url) return null;

  if (isImageAttachment(attachment)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('chat.attachment_open_image').replace('{name}', attachment.file_name)}
        className="block w-full max-w-[280px] overflow-hidden rounded-2xl rounded-tl-sm border border-gray-100 bg-gray-50"
        data-testid="message-attachment-image"
      >
        <Image
          src={url}
          alt={attachment.file_name}
          width={280}
          height={280}
          sizes="280px"
          loading="lazy"
          className="block h-auto max-h-[360px] w-full object-cover"
        />
      </a>
    );
  }

  const size = formatFileSize(attachment.size_bytes);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('chat.attachment_open_file').replace('{name}', attachment.file_name)}
      className="flex w-full max-w-[320px] items-center gap-3 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
      data-testid="message-attachment-file"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3D2F] text-white"
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-inter text-sm font-medium text-gray-900">
          {attachment.file_name}
        </span>
        <span className="block font-inter text-xs text-gray-500" data-testid="attachment-meta">
          {t('chat.attachment_pdf')}
          {size && ` · ${size}`}
        </span>
      </span>
    </a>
  );
}
