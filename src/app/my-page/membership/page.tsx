"use client";

import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

export default function Membership() {
  const tiers = [
    {
      name: "Silver",
      price: "Free",
      highlight: false,
      goldBg: false,
      benefits: [
        "Basic trip planning",
        "Email support",
        "Access to travel guides",
        "Community forum access",
      ],
    },
    {
      name: "Gold",
      price: "$29/month",
      highlight: true,
      goldBg: false,
      benefits: [
        "Priority trip planning",
        "24/7 chat support",
        "Exclusive hotel deals",
        "Personalized itineraries",
        "Airport lounge access",
      ],
    },
    {
      name: "Platinum",
      price: "$79/month",
      highlight: false,
      goldBg: true,
      benefits: [
        "Dedicated travel concierge",
        "VIP support hotline",
        "Best rate guarantee",
        "Complimentary upgrades",
        "Private transfers",
        "Exclusive event access",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Membership" />

      <section className="max-w-7xl mx-auto px-6 mt-8 mb-16">
        {/* Welcome Greeting */}
        <h1 className="font-[Cormorant_Garamond] text-[34px] italic text-gray-900 mb-8">
          Welcome back, Hannah &#10024;
        </h1>

        {/* Membership Card */}
        <div className="rounded-2xl overflow-hidden flex mb-12">
          <div className="bg-[#1E3D2F] text-white p-10 flex-1">
            <p className="text-sm uppercase tracking-widest text-white/60 mb-2">Current Plan</p>
            <h2 className="text-3xl font-bold mb-6">Gold Member</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-white/60">Trips Planned</p>
              </div>
              <div>
                <p className="text-2xl font-bold">3,450</p>
                <p className="text-sm text-white/60">Points Earned</p>
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-white/60">Countries Visited</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 p-10 w-96">
            <p className="text-sm uppercase tracking-widest text-amber-700 mb-2">Next Tier</p>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Platinum Benefits</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-amber-500">&#10003;</span> Dedicated travel concierge
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500">&#10003;</span> Complimentary room upgrades
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500">&#10003;</span> Exclusive event invitations
              </li>
            </ul>
            <button className="mt-5 bg-[#1E3D2F] text-white text-sm px-6 py-2.5 rounded-lg hover:bg-[#163024] transition">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Membership Tiers */}
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Membership Tiers</h2>
        <div className="grid grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-6 border ${
                tier.goldBg
                  ? "bg-amber-50 border-amber-200"
                  : tier.highlight
                  ? "bg-white border-[#1E3D2F] border-2 ring-1 ring-[#1E3D2F]/10"
                  : "bg-white border-gray-200"
              }`}
            >
              {tier.highlight && (
                <span className="text-xs font-semibold text-white bg-[#1E3D2F] px-3 py-1 rounded-full mb-4 inline-block">
                  Current Plan
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
              <p className="text-2xl font-bold text-[#1E3D2F] mt-2 mb-5">{tier.price}</p>
              <ul className="space-y-3">
                {tier.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600">&#10003;</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
