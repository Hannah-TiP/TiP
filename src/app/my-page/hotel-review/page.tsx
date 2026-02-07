"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

export default function HotelReview() {
  const [pendingRating, setPendingRating] = useState(0);
  const [pendingText, setPendingText] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Travel History" />

      <section className="max-w-4xl mx-auto px-6 mt-8 mb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/my-page/travel-history" className="hover:text-[#1E3D2F]">
            Travel History
          </Link>
          <span>{'>'}</span>
          <Link href="/my-page/travel-history/tokyo-japan" className="hover:text-[#1E3D2F]">
            Tokyo, Japan
          </Link>
          <span>{'>'}</span>
          <span className="text-gray-900 font-medium">Hotel Reviews</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Review Your Hotels</h1>

        {/* Reviewed Card - Aman Tokyo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Aman Tokyo</h2>
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              Reviewed
            </span>
          </div>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-xl ${star <= 5 ? "text-yellow-500" : "text-gray-300"}`}>
                &#9733;
              </span>
            ))}
            <span className="text-sm font-semibold text-gray-700 ml-2">5.0</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            An exceptional experience from start to finish. The minimalist design perfectly blends
            traditional Japanese aesthetics with modern luxury. The onsen spa was a highlight, and
            the staff went above and beyond to make our stay memorable. The rooms offer stunning
            views of the Tokyo skyline. Highly recommended for anyone seeking tranquility in the
            heart of the city.
          </p>
        </div>

        {/* Pending Review Card - Park Hyatt Tokyo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Park Hyatt Tokyo</h2>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Pending Review
            </span>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Your Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setPendingRating(star)}
                  className={`text-2xl transition ${
                    star <= pendingRating ? "text-yellow-500" : "text-gray-300"
                  } hover:text-yellow-400`}
                >
                  &#9733;
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Your Review</p>
            <textarea
              value={pendingText}
              onChange={(e) => setPendingText(e.target.value)}
              placeholder="Share your experience at Park Hyatt Tokyo..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
            />
          </div>
          <div className="flex justify-end">
            <button className="bg-[#1E3D2F] text-white text-sm px-6 py-2.5 rounded-lg hover:bg-[#163024] transition">
              Submit Review
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
