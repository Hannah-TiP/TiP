"use client";

import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

export default function TravelHistory() {
  const trips = [
    {
      image: "/images/tokyo.jpg",
      city: "Tokyo, Japan",
      dates: "Oct 8 - 15, 2023",
      nights: "7 Nights",
      hotels: ["Aman Tokyo", "Park Hyatt"],
      rating: 4.8,
      cost: "¥452,000",
      slug: "tokyo-japan",
    },
    {
      image: "/images/santorini.jpg",
      city: "Santorini, Greece",
      dates: "Jun 10 - 17, 2025",
      nights: "6 Nights",
      hotels: ["Canaves Oia Suites"],
      rating: 4.7,
      cost: "€85,291,000",
      slug: "santorini-greece",
    },
    {
      image: "/images/maldives.jpg",
      city: "Maldives",
      dates: "Feb 1 - 8, 2023",
      nights: "8 Nights",
      hotels: ["Soneva Fushi", "Cheval Blanc"],
      rating: 4.9,
      cost: "₩12,500,000",
      slug: "maldives",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Travel History" />

      <section className="max-w-7xl mx-auto px-6 mt-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Past Journeys</h1>
            <p className="text-gray-500 mt-1">3 trips completed</p>
          </div>
        </div>

        <div className="space-y-5">
          {trips.map((trip) => (
            <div
              key={trip.city}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex"
            >
              <div className="w-64 flex-shrink-0">
                <img
                  src={trip.image}
                  alt={trip.city}
                  className="w-full h-full object-cover rounded-l-xl"
                />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{trip.city}</h2>
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      Completed
                    </span>
                  </div>
                  <div className="flex gap-6 mt-3 text-sm text-gray-500">
                    <span>{trip.dates}</span>
                    <span>{trip.nights}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {trip.hotels.join(", ")}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-semibold text-gray-900">{trip.rating}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{trip.cost}</span>
                  </div>
                  <Link
                    href={`/my-page/travel-history/${trip.slug}`}
                    className="text-sm font-medium text-[#1E3D2F] hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
