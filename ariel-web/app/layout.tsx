import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { Plus_Jakarta_Sans, Syne, DM_Sans, Cormorant_Garamond, Kalam } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });
const syne = Syne({ subsets: ["latin"], weight: ["800"], variable: "--font-syne", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["200", "300"], variable: "--font-dm-sans", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "500", "700"], style: ["italic"], variable: "--font-cormorant", display: "swap" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  title: "Ariel — Learn smarter",
  description: "Flashcards, reels, and spaced repetition — built for focused learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} ${syne.variable} ${dmSans.variable} ${cormorant.variable} ${kalam.variable} antialiased`} style={{ fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
