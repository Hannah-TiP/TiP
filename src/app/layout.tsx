import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "TiP - Luxury Travel Concierge",
  description: "Dream Hotels, Thoughtfully Curated.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://unpkg.com/lucide-static@latest/font/lucide.css"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased font-secondary">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
