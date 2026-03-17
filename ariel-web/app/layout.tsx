import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { Syne, DM_Sans, Cormorant_Garamond, Kalam } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["800"], variable: "--font-syne", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["200", "300"], variable: "--font-dm-sans", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "500", "700"], style: ["italic"], variable: "--font-cormorant", display: "swap" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  title: "Ariel — Learn smarter",
  description: "Flashcards, reels, and spaced repetition — built for focused learning.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Identity Services — loaded async, no React provider needed */}
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className={`${GeistSans.className} ${syne.variable} ${dmSans.variable} ${cormorant.variable} ${kalam.variable} antialiased`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
