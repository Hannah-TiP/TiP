'use client';

import type { AIChatMessage, AIChatWidgetResponse } from '@/types/ai-chat';
import WidgetRenderer from './widgets/WidgetRenderer';
import WidgetResponseDisplay from './WidgetResponseDisplay';

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

function formatTimestamp(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return TIME_FORMAT.format(date);
}

/** Render simple markdown: **bold** and *italic* */
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

interface MessageBubbleProps {
  message: AIChatMessage;
  isUser: boolean;
  onWidgetSubmit?: (response: AIChatWidgetResponse) => void;
  widgetsDisabled?: boolean;
}

export default function MessageBubble({
  message,
  isUser,
  onWidgetSubmit,
  widgetsDisabled,
}: MessageBubbleProps) {
  const timestamp = formatTimestamp(message.sent_at ?? message.created_at);
  const widgets = message.widgets ?? [];

  const widgetResponse = message.widget_response ?? null;
  const hasWidgetResponse = isUser && widgetResponse !== null;
  const hasTextContent = !!message.content;

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="bg-[#1E3D2F] text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[400px]">
          {hasWidgetResponse ? (
            <WidgetResponseDisplay response={widgetResponse} />
          ) : message.message_type === 'text' && hasTextContent ? (
            <p className="font-inter text-sm whitespace-pre-wrap">{message.content}</p>
          ) : null}
          {message.message_type === 'audio' && message.media_url && (
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
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
                <span className="font-inter text-xs font-medium">Audio message</span>
              </div>
              {message.content && (
                <p className="font-inter text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <audio controls className="w-full mt-2">
                <source src={message.media_url} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
        {timestamp && (
          <span
            className="font-inter text-[10px] text-gray-400 mr-1"
            data-testid="message-timestamp"
          >
            {timestamp}
          </span>
        )}
      </div>
    );
  }

  // Assistant and human assistant messages
  // human_assistant rows are admin takeover replies. Customers must NOT see
  // any individual admin identity -- render a generic "Concierge Team"
  // affordance (gold avatar + small badge) so the source feels like the
  // same brand voice as the AI.
  const isHumanConcierge = message.role === 'human_assistant';
  // AI assistant uses a pill-shaped "Concierge" badge inline; the human
  // takeover variant keeps the legacy circular "CT" + label-above pattern.
  const avatarClasses = isHumanConcierge
    ? 'w-8 h-8 rounded-full bg-[#C4956A] text-white flex items-center justify-center text-[10px] font-bold shrink-0'
    : 'h-8 px-3 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0 whitespace-nowrap';
  const avatarLabel = isHumanConcierge ? 'CT' : 'Concierge';

  return (
    <div
      className="flex gap-3"
      data-testid={isHumanConcierge ? 'message-human-concierge' : undefined}
    >
      <div className={avatarClasses} title={isHumanConcierge ? 'Concierge Team' : 'AI Concierge'}>
        {avatarLabel}
      </div>
      <div className="flex-1 max-w-[600px]">
        {isHumanConcierge && (
          <div
            className="font-inter text-[10px] uppercase tracking-wider text-[#C4956A] font-semibold mb-1 ml-1"
            data-testid="concierge-team-badge"
          >
            Concierge Team
          </div>
        )}
        <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4">
          {message.message_type === 'text' && (
            <p className="font-inter text-sm text-gray-800 whitespace-pre-wrap">
              {renderMarkdown(message.content ?? '')}
            </p>
          )}
          {message.message_type === 'audio' && message.media_url && (
            <div className="w-full">
              <audio controls className="w-full">
                <source src={message.media_url} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
        {widgets.length > 0 && onWidgetSubmit && (
          <div className="mt-2 space-y-2">
            {widgets.map((widget) => (
              <WidgetRenderer
                key={widget.widget_id}
                block={widget}
                onSubmit={onWidgetSubmit}
                disabled={widgetsDisabled}
              />
            ))}
          </div>
        )}
        {timestamp && (
          <span
            className="font-inter text-[10px] text-gray-400 mt-1 ml-1 inline-block"
            data-testid="message-timestamp"
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
