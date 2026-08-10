'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AIChatMessage, PendingMessage, AIChatWidgetResponse } from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';
import MessageBubble from './MessageBubble';
import WidgetResponseDisplay from './WidgetResponseDisplay';

interface MessageListProps {
  messages: AIChatMessage[];
  isLoading: boolean;
  pendingMessage?: PendingMessage | null;
  onWidgetSubmit?: (response: AIChatWidgetResponse) => void;
  /** True while older history may exist (SMA-288) — shows the load-older control. */
  hasOlderMessages?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
}

const NEAR_BOTTOM_THRESHOLD_PX = 100;

export default function MessageList({
  messages,
  isLoading,
  pendingMessage,
  onWidgetSubmit,
  hasOlderMessages = false,
  isLoadingOlder = false,
  onLoadOlder,
}: MessageListProps) {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  // Tracked in a ref (not state) so scrolling doesn't re-render the list per
  // frame — only button visibility is state.
  const isNearBottomRef = useRef(true);
  // Auto-scroll keys on LAST-message-id change only (SMA-288): human-mode
  // polling replaces the array with identical content every second, and
  // "load older messages" grows the list at the TOP — neither should scroll.
  const lastSeenIdRef = useRef<number | null>(null);
  const prevPendingRef = useRef(false);
  const prevLoadingRef = useRef(false);
  // Scroll-preservation snapshot taken when the load-older control is
  // clicked; consumed by a layout effect once the prepended page lands
  // (detected by the first message id changing).
  const pendingPrependRef = useRef<{ scrollHeight: number; firstId: number | null } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    isNearBottomRef.current = true;
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - (el.scrollTop + el.clientHeight) < NEAR_BOTTOM_THRESHOLD_PX;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setShowScrollButton(false);
    }
  }, []);

  const handleLoadOlder = useCallback(() => {
    const el = containerRef.current;
    pendingPrependRef.current = {
      scrollHeight: el?.scrollHeight ?? 0,
      firstId: messages.length > 0 ? messages[0].id : null,
    };
    onLoadOlder?.();
  }, [messages, onLoadOlder]);

  // Preserve the viewport on prepend: once the first message id changes, the
  // page landed above the fold — shift scrollTop by the height delta so the
  // message the user was reading stays put.
  useLayoutEffect(() => {
    const pending = pendingPrependRef.current;
    if (!pending) return;
    const firstId = messages.length > 0 ? messages[0].id : null;
    if (firstId === pending.firstId) return;
    const el = containerRef.current;
    if (el) {
      el.scrollTop += el.scrollHeight - pending.scrollHeight;
    }
    pendingPrependRef.current = null;
  }, [messages]);

  useEffect(() => {
    const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;
    // Length-only growth is a prepend (load-older) — never auto-scroll on it.
    const hasNewContent = lastId !== lastSeenIdRef.current;
    lastSeenIdRef.current = lastId;

    // Own-send signals: the pending bubble appearing (text/widget sends) or
    // isLoading flipping on (also covers the audio path, which appends the
    // user message only after the POST resolves).
    const pendingAppeared = Boolean(pendingMessage) && !prevPendingRef.current;
    prevPendingRef.current = Boolean(pendingMessage);
    const loadingStarted = isLoading && !prevLoadingRef.current;
    prevLoadingRef.current = isLoading;
    const isOwnSend = pendingAppeared || loadingStarted;

    // Identity-only array replacement (e.g. a human-mode polling tick with no
    // new message) — neither scroll nor show the button.
    if (!hasNewContent && !isOwnSend) return;

    if (isInitialLoad.current) {
      scrollToBottom('auto'); // eslint-disable-line react-hooks/set-state-in-effect
      isInitialLoad.current = false;
      return;
    }

    if (isOwnSend || isNearBottomRef.current) {
      scrollToBottom('smooth');
    } else {
      setShowScrollButton(true);
    }
  }, [messages, pendingMessage, isLoading, scrollToBottom]);

  if (messages.length === 0 && !isLoading && !pendingMessage) {
    return (
      <div className="flex-1 overflow-y-auto px-4 md:px-[60px] py-[32px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="font-inter text-sm">{t('chat.no_messages')}</p>
        </div>
      </div>
    );
  }

  // Find the last assistant message — only its widgets should remain interactive
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'user') {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        data-testid="message-list-container"
        className="h-full overflow-y-auto px-4 md:px-[60px] py-[32px] space-y-6"
      >
        {hasOlderMessages && onLoadOlder && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={isLoadingOlder}
              data-testid="load-older-button"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 font-inter text-xs text-gray-600 hover:border-[#1E3D2F] hover:text-[#1E3D2F] transition-colors disabled:opacity-50"
            >
              {isLoadingOlder ? t('chat.loading_older_messages') : t('chat.load_older_messages')}
            </button>
          </div>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isLastAssistant = !isUser && index === lastAssistantIndex;

          return (
            <div key={message.id || index}>
              <MessageBubble
                message={message}
                isUser={isUser}
                onWidgetSubmit={!isUser ? onWidgetSubmit : undefined}
                widgetsDisabled={!isLastAssistant || isLoading}
              />
            </div>
          );
        })}

        {pendingMessage && (
          <div className="flex flex-col items-end gap-1" data-testid="pending-message">
            <div className="bg-[#1E3D2F] text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[280px] md:max-w-[400px] break-words">
              {pendingMessage.widget_response ? (
                <WidgetResponseDisplay response={pendingMessage.widget_response} />
              ) : pendingMessage.content ? (
                <p className="font-inter text-sm whitespace-pre-wrap">{pendingMessage.content}</p>
              ) : null}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 px-3 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0 whitespace-nowrap">
              {t('chat.concierge_avatar')}
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          aria-label={t('chat.scroll_to_bottom')}
          data-testid="scroll-to-bottom-button"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#1E3D2F] px-4 py-2 text-white shadow-lg hover:bg-[#2a523f] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
          <span className="font-inter text-xs">{t('chat.scroll_to_bottom')}</span>
        </button>
      )}
    </div>
  );
}
