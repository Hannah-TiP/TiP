"use client";

import { useState } from "react";

interface SubscribePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscribePopup({ isOpen, onClose }: SubscribePopupProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-6 bg-gray-light p-9 pb-8">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-dark">
            <span className="icon-lucide text-xl text-white">&#xe89c;</span>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="font-primary text-[24px] font-semibold italic text-green-dark">
              Stay Inspired
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-500">
              Get exclusive travel insights, curated hotel picks, and member-only offers delivered to your inbox.
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] text-green-dark outline-none transition-colors focus:border-green-dark"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] text-green-dark outline-none transition-colors focus:border-green-dark"
            />
            <button className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-dark text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
              Subscribe
              <span className="icon-lucide">&#xe817;</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-9 py-4">
          <p className="text-center text-[11px] text-gray-400">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-gray-500 transition-colors hover:bg-black/10"
        >
          <span className="icon-lucide text-sm">&#xe8db;</span>
        </button>
      </div>
    </div>
  );
}
