"use client";

import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

export default function MyPageUpcomingTravels() {
  const infoCards = [
    { icon: "✈️", title: "Flight", subtitle: "Air France AF1234", detail: "Mar 15, 10:30 AM" },
    { icon: "🏨", title: "Hotel", subtitle: "Le Bristol Paris", detail: "7 Nights, Deluxe Suite" },
    { icon: "🎯", title: "Activity", subtitle: "12 Activities Planned", detail: "Next: Eiffel Tower Tour" },
    { icon: "📋", title: "Booking", subtitle: "All Confirmed", detail: "Ref: TIP-2024-0315" },
  ];

  const timelineItems = [
    { day: "Day 1", date: "Mar 15", title: "Arrival in Paris", desc: "Check-in at Le Bristol Paris, Evening Seine River Cruise" },
    { day: "Day 2", date: "Mar 16", title: "Eiffel Tower & Louvre", desc: "Morning visit to Eiffel Tower, Afternoon at Louvre Museum" },
    { day: "Day 3", date: "Mar 17", title: "Versailles Day Trip", desc: "Full day excursion to Palace of Versailles" },
    { day: "Day 4", date: "Mar 18", title: "Montmartre & Sacré-Cœur", desc: "Explore Montmartre, Visit Sacré-Cœur Basilica" },
    { day: "Day 5", date: "Mar 19", title: "Shopping & Cuisine", desc: "Champs-Élysées shopping, Michelin-star dinner" },
  ];

  const itineraryItems = [
    { time: "10:00 AM", place: "Eiffel Tower", type: "Landmark" },
    { time: "1:00 PM", place: "Le Jules Verne", type: "Restaurant" },
    { time: "3:00 PM", place: "Louvre Museum", type: "Museum" },
    { time: "6:00 PM", place: "Seine River Cruise", type: "Activity" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Upcoming Travels" />

      {/* Hero Trip Card */}
      <section className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-[#1E3D2F] rounded-2xl overflow-hidden flex">
          <div className="w-[560px] flex-shrink-0">
            <img
              src="/images/paris-hero.jpg"
              alt="Paris, France"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-10 text-white flex flex-col justify-center">
            <p className="text-sm uppercase tracking-widest text-white/60 mb-2">Upcoming Trip</p>
            <h1 className="text-4xl font-bold mb-1">Paris, France</h1>
            <p className="text-white/70 mb-6">The City of Light awaits you</p>
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-white/50">Dates</p>
                <p className="font-semibold">Mar 15 - 22, 2024</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Duration</p>
                <p className="font-semibold">7 Nights</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Travelers</p>
                <p className="font-semibold">2 Adults</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Trip Type</p>
                <p className="font-semibold">Couple</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards Row */}
      <section className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-4 gap-5">
          {infoCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-gray-900">{card.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
              <p className="text-xs text-gray-400 mt-1">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-7xl mx-auto px-6 mt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Trip Map</h2>
        <div className="flex gap-6">
          <div className="flex-1 bg-gray-200 rounded-xl h-96 flex items-center justify-center">
            <p className="text-gray-500">Map View</p>
          </div>
          <div className="w-80 bg-white rounded-xl border border-gray-200 p-5 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Itinerary</h3>
            <div className="space-y-4">
              {itineraryItems.map((item) => (
                <div key={item.place} className="flex gap-3">
                  <div className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">{item.time}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.place}</p>
                    <p className="text-xs text-gray-500">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trip Timeline */}
      <section className="max-w-7xl mx-auto px-6 mt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Trip Timeline</h2>
        <div className="space-y-4">
          {timelineItems.map((item, i) => (
            <div key={i} className="flex gap-5 items-start">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#1E3D2F] text-white flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                {i < timelineItems.length - 1 && (
                  <div className="w-px h-10 bg-gray-300 mt-1" />
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-semibold text-[#1E3D2F] bg-green-50 px-2 py-0.5 rounded">{item.day}</span>
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trip Summary */}
      <section className="max-w-7xl mx-auto px-6 mt-10 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Trip Summary</h2>
        <div className="grid grid-cols-4 gap-5 mb-6">
          {[
            { value: "7", label: "Nights" },
            { value: "12", label: "Activities" },
            { value: "4", label: "Cities" },
            { value: "5", label: "Restaurants" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-3xl font-bold text-[#1E3D2F]">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Trip Highlights</h3>
            <p className="text-sm text-gray-500">Eiffel Tower at sunset, Michelin-star dining experience, Versailles private tour, Seine river cruise.</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Packing Reminder</h3>
            <p className="text-sm text-gray-500">Spring weather in Paris — pack layers, a light jacket, comfortable walking shoes, and a travel umbrella.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
