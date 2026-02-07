"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <main className="flex min-h-screen flex-col bg-gray-light">
      {/* Nav Bar */}
      <nav className="flex h-[70px] items-center justify-between border-b border-gray-border bg-white px-10">
        <div className="flex items-center gap-9">
          <Link href="/" className="font-primary text-[28px] font-bold text-green-dark">
            TiP
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/dream-hotels" className="text-[11px] font-medium tracking-[2px] text-green-dark/50 hover:text-green-dark">
              DREAM HOTELS
            </Link>
            <Link href="/more-dreams" className="text-[11px] font-medium tracking-[2px] text-green-dark/50 hover:text-green-dark">
              MORE DREAMS
            </Link>
            <Link href="/insights" className="text-[11px] font-medium tracking-[2px] text-green-dark/50 hover:text-green-dark">
              INSIGHTS
            </Link>
          </div>
        </div>
        <Link href="/my-page" className="text-[11px] font-medium tracking-[2px] text-green-dark/50 hover:text-green-dark">
          MY PAGE
        </Link>
      </nav>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-10">
        <h1 className="font-primary text-[48px] italic text-green-dark">
          Sign in to start planning
        </h1>
        <p className="mt-4 max-w-lg text-center text-[16px] leading-relaxed text-gray-text">
          Your concierge chat is linked to your account so we can save
          conversations and itineraries.
        </p>

        {/* Sign In Card */}
        <div className="mt-8 w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="flex flex-col gap-6 p-8">
            <div className="text-center">
              <h2 className="text-[18px] font-semibold text-green-dark">Welcome back</h2>
              <p className="mt-1 text-[14px] text-gray-text">Sign in to continue</p>
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
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[12px] text-gray-400">or continue with email</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Email Input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-[14px] text-green-dark outline-none transition-colors focus:border-green-dark"
            />

            {/* Continue Button */}
            <button
              onClick={() => router.push("/my-page")}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-dark text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Continue
            </button>
          </div>

          {/* Sign Up Row */}
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-4">
            <span className="text-[14px] text-gray-500">Don&apos;t have an account?</span>
            <button className="text-[14px] font-semibold text-green-dark hover:underline">
              Sign up
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
