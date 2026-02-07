"use client";

import Link from "next/link";

interface SubNavProps {
  activeTab: string;
}

const tabs = [
  { label: "Upcoming Travels", href: "/my-page" },
  { label: "Travel History", href: "/my-page/travel-history" },
  { label: "My Chat", href: "/my-page/my-chat" },
  { label: "Membership", href: "/my-page/membership" },
  { label: "My Profile", href: "/my-page/my-profile" },
];

export default function SubNav({ activeTab }: SubNavProps) {
  return (
    <nav
      className="flex items-center bg-white"
      style={{
        padding: "0 40px",
        borderBottom: "1px solid #E8E7E5",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex items-center"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#1E3D2F" : "#999999",
              textDecoration: "none",
              padding: "14px 20px",
              borderBottom: isActive ? "2px solid #1E3D2F" : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
