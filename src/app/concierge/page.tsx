"use client";

import TopBar from "@/components/TopBar";
import Image from "next/image";

const quickChips = ["Couple trip", "Celebration", "Family", "Just Relaxing", "Just Solo"];

const hotelCards = [
  { name: "Hôtel Plaza Athénée", price: "€1,200/night", img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=260&fit=crop" },
  { name: "Le Bristol Paris", price: "€980/night", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=260&fit=crop" },
  { name: "The Ritz Paris", price: "€1,500/night", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=260&fit=crop" },
];

const activities = [
  "Private Louvre tour",
  "Seine River dinner cruise",
  "Versailles day trip",
  "Montmartre walking tour",
  "Wine tasting in Le Marais",
];

export default function ConciergePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar activeLink="AI Chat" />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Side */}
        <div className="w-[900px] flex flex-col border-r border-gray-100">
          {/* Scrollable Messages */}
          <div className="flex-1 overflow-y-auto px-[60px] py-[32px] space-y-6">
            {/* Bot Message 1 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[600px]">
                <p className="font-inter text-sm text-gray-800">
                  Welcome to TiP Concierge! I&apos;m here to help you plan your perfect luxury trip. Where would you like to go?
                </p>
              </div>
            </div>

            {/* User Response */}
            <div className="flex justify-end">
              <div className="bg-[#1E3D2F] text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[400px]">
                <p className="font-inter text-sm">I&apos;d love to visit Paris for our anniversary!</p>
              </div>
            </div>

            {/* Bot Message 2 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[600px]">
                <p className="font-inter text-sm text-gray-800">
                  Paris — a wonderful choice for an anniversary! What kind of trip are you envisioning?
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickChips.map((chip) => (
                    <button
                      key={chip}
                      className="px-4 py-2 rounded-full border border-[#1E3D2F]/20 text-[#1E3D2F] font-inter text-xs hover:bg-[#1E3D2F] hover:text-white transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Response */}
            <div className="flex justify-end">
              <div className="bg-[#1E3D2F] text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[400px]">
                <p className="font-inter text-sm">Couple trip — something really special and romantic.</p>
              </div>
            </div>

            {/* Bot Message 3 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[600px]">
                <p className="font-inter text-sm text-gray-800">
                  How many nights are you considering, and do you have specific dates in mind?
                </p>
              </div>
            </div>

            {/* User Response */}
            <div className="flex justify-end">
              <div className="bg-[#1E3D2F] text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[400px]">
                <p className="font-inter text-sm">5 nights, around mid-March 2026.</p>
              </div>
            </div>

            {/* Bot Message 4 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                4
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[600px]">
                <p className="font-inter text-sm text-gray-800 mb-4">
                  Wonderful! Here are my top hotel recommendations for a romantic Paris anniversary:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {hotelCards.map((hotel) => (
                    <div key={hotel.name} className="rounded-xl overflow-hidden border border-gray-100">
                      <div className="relative w-full h-[100px]">
                        <Image src={hotel.img} alt={hotel.name} fill className="object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="font-inter text-xs font-semibold text-[#1E3D2F]">{hotel.name}</p>
                        <p className="font-inter text-xs text-gray-500 mt-1">{hotel.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bot Message 5 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                5
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[600px]">
                <p className="font-inter text-sm text-gray-800">
                  I&apos;ve built a preliminary itinerary for you in the sidebar. Feel free to ask me to adjust anything — dining, spa, excursions — I&apos;m here to make it perfect.
                </p>
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t border-gray-100 px-[60px] py-5">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3">
              <input
                type="text"
                placeholder="Ask your concierge anything..."
                className="flex-1 bg-transparent outline-none font-inter text-sm text-gray-800 placeholder:text-gray-400"
              />
              <button className="bg-[#1E3D2F] text-white rounded-lg px-5 py-2 font-inter text-sm hover:opacity-90 transition-opacity">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Itinerary Sidebar */}
        <div className="w-[540px] flex flex-col bg-[#FAFAF8] overflow-y-auto">
          <div className="px-8 py-8 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cormorant text-2xl font-semibold text-[#1E3D2F]">Your Itinerary</h2>
              <button className="font-inter text-xs text-[#1E3D2F] underline">Modify</button>
            </div>

            {/* Trip Details */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Destination</span>
                <span className="text-[#1E3D2F] font-medium">Paris, France</span>
              </div>
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Dates</span>
                <span className="text-[#1E3D2F] font-medium">Mar 15 – 20, 2026</span>
              </div>
              <div className="flex justify-between font-inter text-sm">
                <span className="text-gray-500">Travelers</span>
                <span className="text-[#1E3D2F] font-medium">2 Adults</span>
              </div>
            </div>

            {/* Recommended Hotels */}
            <h3 className="font-inter text-xs tracking-[2px] text-gray-400 uppercase mb-4">Recommended Hotels</h3>
            <div className="space-y-3 mb-8">
              {hotelCards.map((hotel) => (
                <div key={hotel.name} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                    <Image src={hotel.img} alt={hotel.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-inter text-sm font-semibold text-[#1E3D2F]">{hotel.name}</p>
                    <p className="font-inter text-xs text-gray-500">{hotel.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Activities */}
            <h3 className="font-inter text-xs tracking-[2px] text-gray-400 uppercase mb-4">Activities</h3>
            <div className="space-y-3 mb-8">
              {activities.map((activity) => (
                <label key={activity} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#1E3D2F] focus:ring-[#1E3D2F]" />
                  <span className="font-inter text-sm text-gray-700">{activity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 px-8 py-6">
            <div className="flex justify-between mb-5">
              <span className="font-inter text-sm text-gray-500">Estimated Cost</span>
              <span className="font-inter text-lg font-semibold text-[#1E3D2F]">€8,400</span>
            </div>
            <div className="space-y-3">
              <button className="w-full bg-[#1E3D2F] text-white rounded-lg py-3 font-inter text-sm font-medium hover:opacity-90 transition-opacity">
                Book Request with TiP
              </button>
              <button className="w-full border border-[#1E3D2F] text-[#1E3D2F] rounded-lg py-3 font-inter text-sm font-medium hover:bg-[#1E3D2F]/5 transition-colors">
                Human Agent Contact
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
