'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AIChatQuoteSentWidget } from '@/types/ai-chat';

interface Props {
  widget: AIChatQuoteSentWidget;
  disabled?: boolean;
}

function formatSentAt(sentAt: string): string {
  try {
    return new Date(sentAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return sentAt;
  }
}

export default function QuoteSent({ widget, disabled }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const handleOpen = () => router.push(`/quotes/${widget.quote_id}`);

  const headline = widget.was_resent
    ? t('chat.quote_sent.headline_updated')
    : t('chat.quote_sent.headline_new');
  const body = t('chat.quote_sent.body');
  const cta = t('chat.quote_sent.cta');

  return (
    <div className="my-2 max-w-md rounded-2xl border border-[#E8E7E5] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1E3D2F]/10 text-[#1E3D2F]">
          <svg
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
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-cormorant text-lg font-semibold text-[#1E3D2F]">{headline}</p>
          <p className="mt-1 font-inter text-[13px] leading-relaxed text-gray-600">{body}</p>
          <p className="mt-2 font-inter text-[11px] uppercase tracking-[1.5px] text-gray-400">
            {formatSentAt(widget.sent_at)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1E3D2F] px-5 py-2.5 font-inter text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cta}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}
