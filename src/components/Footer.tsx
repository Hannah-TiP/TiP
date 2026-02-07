"use client";

import Link from "next/link";

const exploreLinks = ["Dream Hotels", "Insights", "Itinerary", "AI Chat"];
const companyLinks = ["About Us", "Careers", "Press", "Blog"];
const supportLinks = ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"];

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#214032",
        padding: "48px 100px",
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-start">
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          TiP
        </span>

        <div className="flex" style={{ gap: 80 }}>
          <FooterColumn title="Explore" items={exploreLinks} />
          <FooterColumn title="Company" items={companyLinks} />
          <FooterColumn title="Support" items={supportLinks} />
        </div>
      </div>

      {/* Info row */}
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.8,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 24,
        }}
      >
        <p style={{ margin: 0 }}>
          상호명: 주식회사 티아이피에이아이 | 대표: 홍길동 | 사업자등록번호: 123-45-67890
        </p>
        <p style={{ margin: 0 }}>
          주소: 서울특별시 강남구 테헤란로 123, 4층 | 통신판매업신고: 제2026-서울강남-00001호
        </p>
        <p style={{ margin: 0 }}>
          고객센터: support@tip-ai.com | 전화: 02-1234-5678
        </p>
      </div>

      {/* Copyright */}
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.3)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 24,
        }}
      >
        © 2026 TiP AI. Crafted for discerning travelers.
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255,255,255,0.66)",
        }}
      >
        {title}
      </span>
      {items.map((item) => (
        <Link
          key={item}
          href="#"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(255,255,255,0.4)",
            textDecoration: "none",
          }}
        >
          {item}
        </Link>
      ))}
    </div>
  );
}
