"use client";

import type { AIMessage } from '@/types/ai-chat';

interface MessageBubbleProps {
  message: AIMessage;
  isUser: boolean;
  messageIndex?: number;
}

export default function MessageBubble({ message, isUser, messageIndex }: MessageBubbleProps) {
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-[#1E3D2F] text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[400px]">
          {message.message_type === 'text' && (
            <p className="font-inter text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          {message.message_type === 'image' && message.media_url && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.media_url}
                alt="Uploaded image"
                className="rounded-lg"
                style={{ width: '350px', height: 'auto' }}
              />
            </div>
          )}
          {message.message_type === 'audio' && message.media_url && (
            <div className="w-full">
              {/* Audio icon */}
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
              {/* Transcribed text */}
              {message.content && (
                <p className="font-inter text-sm whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
              {/* Audio player (optional, can be hidden if transcription is shown) */}
              <audio controls className="w-full mt-2">
                <source src={message.media_url} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
        {messageIndex !== undefined ? messageIndex + 1 : 'AI'}
      </div>
      <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[600px]">
        {message.message_type === 'text' && (
          <p className="font-inter text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
        )}
        {message.message_type === 'image' && message.media_url && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.media_url}
              alt="AI shared image"
              className="rounded-lg"
              style={{ width: '550px', height: 'auto' }}
            />
            {message.message_metadata?.analysis_result && (
              <div className="mt-3 font-inter text-sm text-gray-800">
                {message.message_metadata.analysis_result.description}
              </div>
            )}
          </div>
        )}
        {message.message_type === 'audio' && message.media_url && (
          <div className="w-full">
            <audio controls className="w-full">
              <source src={message.media_url} />
              Your browser does not support the audio element.
            </audio>
            {message.message_metadata?.transcription && (
              <div className="mt-3 font-inter text-sm text-gray-600 italic">
                &quot;{message.message_metadata.transcription}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
