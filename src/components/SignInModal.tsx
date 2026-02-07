"use client";

import { useState } from "react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-6 p-8 pb-6">
          <div className="text-center">
            <h2 className="font-primary text-[22px] font-bold text-green-dark">
              Sign in to luxury travel
            </h2>
            <p className="mt-2 text-[14px] text-gray-500">
              Become a member and unlock exclusive benefits
            </p>
          </div>

          {/* Social Login */}
          <div className="flex justify-center gap-3">
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 transition-colors hover:bg-gray-50">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 transition-colors hover:bg-gray-50">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 transition-colors hover:bg-gray-50">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.09.682-.218.682-.484 0-.236-.009-.866-.014-1.699-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.086.635-1.337-2.22-.251-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.203 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.307.679.917.679 1.852 0 1.335-.012 2.415-.012 2.741 0 .269.18.579.688.481A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[12px] text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Email Input */}
          <div>
            <label className="mb-2 block text-[12px] font-medium text-gray-600">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-[14px] text-green-dark outline-none transition-colors focus:border-green-dark"
            />
          </div>

          {/* Continue Button */}
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-dark text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
            Continue
            <span className="icon-lucide">&#xe817;</span>
          </button>
        </div>

        {/* Sign Up Row */}
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-4">
          <span className="text-[14px] text-gray-500">Don&apos;t have an account?</span>
          <button className="text-[14px] font-semibold text-green-dark hover:underline">
            Sign up
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 border-t border-gray-100 bg-gray-50 py-4">
          <span className="text-[12px] text-gray-400">Secured by clerk</span>
          <span className="text-[12px] font-medium text-gold">Development mode</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
        >
          <span className="icon-lucide text-sm">&#xe8db;</span>
        </button>
      </div>
    </div>
  );
}
