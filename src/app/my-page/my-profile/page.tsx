"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

export default function MyProfile() {
  const activeTags = ["Luxury Hotels", "Fine Dining", "Wellness & Spa", "Art & Culture"];
  const inactiveTags = ["Beach & Resort", "Adventure", "City Beats", "Family", "Cruise"];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="My Profile" />

      <section className="max-w-4xl mx-auto px-6 mt-8 mb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Personal Information</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <input
                type="text"
                defaultValue="Hannah"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input
                type="text"
                defaultValue="Kim"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                defaultValue="hannah.kim@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                defaultValue="+82 10-1234-5678"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
              <input
                type="text"
                defaultValue="1992-05-15"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality</label>
              <input
                type="text"
                defaultValue="South Korea"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/20 focus:border-[#1E3D2F]"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Security</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Password</p>
              <p className="text-sm text-gray-400 mt-0.5">Last changed 30 days ago</p>
            </div>
            <button className="text-sm font-medium text-[#1E3D2F] hover:underline">
              Change Password
            </button>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Travel Preferences</h2>
          <div className="flex flex-wrap gap-3">
            {activeTags.map((tag) => (
              <span
                key={tag}
                className="bg-[#1E3D2F] text-white text-sm px-4 py-2 rounded-full"
              >
                {tag}
              </span>
            ))}
            {inactiveTags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-500 text-sm px-4 py-2 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-[#1E3D2F] rounded-lg hover:bg-[#163024] transition">
            Save Changes
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
