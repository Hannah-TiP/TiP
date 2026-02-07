"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

export default function MyChat() {
  const [activeChat, setActiveChat] = useState(0);

  const chatItems = [
    { name: "Paris Luxury Trip", date: "Today", preview: "I found some great hotel options..." },
    { name: "Tokyo Adventure", date: "Feb 28", preview: "Your itinerary is ready!" },
    { name: "Santorini Getaway", date: "Feb 25", preview: "Here are the sunset spots..." },
    { name: "Maldives Honeymoon", date: "Feb 20", preview: "The villa is confirmed!" },
  ];

  const messages: Array<{ type: string; text?: string; card?: { name: string; rating: string; price: string } }> = [
    { type: "bot", text: "Hello Hannah! I'm helping you plan your Paris Luxury Trip. What kind of experience are you looking for?" },
    { type: "user", text: "I'd love a luxury hotel near the Eiffel Tower with a great view." },
    { type: "bot", text: "Great choice! Here are my top recommendations for luxury hotels near the Eiffel Tower:" },
    { type: "bot", card: { name: "Le Bristol Paris", rating: "4.9", price: "\u20ac850/night" } },
    { type: "user", text: "That looks amazing! Can you book it for March 15-22?" },
    { type: "bot", text: "Absolutely! I've added Le Bristol Paris to your itinerary for March 15-22, 2024. Would you like me to arrange airport transfers as well?" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="My Chat" />

      <section className="max-w-7xl mx-auto px-6 mt-8 mb-16">
        <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden h-[640px]">
          {/* Chat List */}
          <div className="w-[400px] border-r border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chatItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChat(i)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${activeChat === i ? "bg-green-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.preview}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat View */}
          <div className="flex-1 flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">{chatItems[activeChat].name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.card ? (
                    <div className="bg-gray-100 rounded-xl p-4 max-w-sm">
                      <div className="bg-gray-200 rounded-lg h-32 mb-3 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Hotel Image</span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{msg.card.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="text-yellow-500">&#9733;</span>
                        <span className="text-gray-700">{msg.card.rating}</span>
                        <span className="text-gray-400">|</span>
                        <span className="font-semibold text-[#1E3D2F]">{msg.card.price}</span>
                      </div>
                      <button className="mt-3 w-full bg-[#1E3D2F] text-white text-sm py-2 rounded-lg hover:bg-[#163024] transition">
                        Book Now
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl text-sm ${msg.type === "user" ? "bg-[#1E3D2F] text-white" : "bg-gray-100 text-gray-800"}`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1E3D2F]/20"
                />
                <button className="bg-[#1E3D2F] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#163024] transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
