"use client";

import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onUploadImage?: (file: File) => void;
  onUploadAudio?: (file: File) => void;
  isLoading: boolean;
}

export default function ChatInput({
  onSendMessage,
  onUploadImage,
  onUploadAudio,
  isLoading,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must be less than 10MB');
        return;
      }
      onUploadImage(file);
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadAudio) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('Audio file size must be less than 20MB');
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
    <div className="border-t border-gray-100 px-[60px] py-5">
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3">
        {/* Image upload button */}
        {onUploadImage && (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading}
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={isLoading}
              className="text-gray-400 hover:text-[#1E3D2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload image"
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
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
              disabled={isLoading}
            />
            <button
              onClick={() => audioInputRef.current?.click()}
              disabled={isLoading}
              className="text-gray-400 hover:text-[#1E3D2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload audio"
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
          placeholder="Ask your concierge anything..."
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none font-inter text-sm text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className="bg-[#1E3D2F] text-white rounded-lg px-5 py-2 font-inter text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
