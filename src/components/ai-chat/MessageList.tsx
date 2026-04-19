'use client';

import { useEffect, useRef } from 'react';
import type { AIChatMessage, PendingMessage, WidgetResponse } from '@/types/ai-chat';
import { useLanguage } from '@/contexts/LanguageContext';
import MessageBubble from './MessageBubble';
import WidgetResponseDisplay from './WidgetResponseDisplay';

interface MessageListProps {
  messages: AIChatMessage[];
  isLoading: boolean;
  pendingMessage?: PendingMessage | null;
  onWidgetSubmit?: (response: WidgetResponse) => void;
}

export default function MessageList({
  messages,
  isLoading,
  pendingMessage,
  onWidgetSubmit,
}: MessageListProps) {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: isInitialLoad.current ? 'auto' : 'smooth',
      });
      isInitialLoad.current = false;
    }
  }, [messages, pendingMessage]);

  if (messages.length === 0 && !isLoading && !pendingMessage) {
    return (
      <div className="flex-1 overflow-y-auto px-[60px] py-[32px] flex items-center justify-center">
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
    <div className="flex-1 overflow-y-auto px-[60px] py-[32px] space-y-6">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const assistantIndex = isUser
          ? undefined
          : messages.slice(0, index).filter((m) => m.role === 'assistant').length;

        const isLastAssistant = !isUser && index === lastAssistantIndex;

        return (
          <div key={message.id || index}>
            <MessageBubble
              message={message}
              isUser={isUser}
              messageIndex={assistantIndex}
              onWidgetSubmit={!isUser ? onWidgetSubmit : undefined}
              widgetsDisabled={!isLastAssistant || isLoading}
            />
          </div>
        );
      })}

      {pendingMessage && (
        <div className="flex flex-col items-end gap-1" data-testid="pending-message">
          <div className="bg-[#1E3D2F] text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[400px]">
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
          <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
            AI
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
  );
}
