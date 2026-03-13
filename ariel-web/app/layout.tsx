import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { Syne, DM_Sans, Cormorant_Garamond, Gloria_Hallelujah } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["800"], variable: "--font-syne", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["200", "300"], variable: "--font-dm-sans", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300"], style: ["italic"], variable: "--font-cormorant", display: "swap" });
const gloriaHallelujah = Gloria_Hallelujah({ subsets: ["latin"], weight: ["400"], variable: "--font-caveat", display: "swap" });

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
      <body className={`${GeistSans.className} ${syne.variable} ${dmSans.variable} ${cormorant.variable} ${gloriaHallelujah.variable} antialiased`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
