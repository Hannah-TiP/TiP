"use client";

import { useEffect, useRef } from 'react';
import type { AIMessage } from '@/types/ai-chat';
import MessageBubble from './MessageBubble';
import TripCard from './TripCard';

interface MessageListProps {
  messages: AIMessage[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use instant scroll on initial load, smooth scroll for new messages
      messagesEndRef.current.scrollIntoView({
        behavior: isInitialLoad.current ? 'auto' : 'smooth'
      });
      isInitialLoad.current = false;
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-[60px] py-[32px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="font-inter text-sm">No messages yet. Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-[60px] py-[32px] space-y-6">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const assistantIndex = isUser ? undefined : messages.slice(0, index).filter(m => m.role === 'assistant').length;

        return (
          <div key={message.id || index}>
            <MessageBubble
              message={message}
              isUser={isUser}
              messageIndex={assistantIndex}
            />

            {/* Render trip cards if they exist in message metadata */}
            {!isUser && message.message_metadata?.trips && message.message_metadata.trips.length > 0 && (
              <div className="ml-11 mt-4 space-y-3">
                {message.message_metadata.trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
            AI
          </div>
          <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
