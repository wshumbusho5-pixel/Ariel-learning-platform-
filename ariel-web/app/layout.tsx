import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ariel - Revolutionary Revision Platform",
  description: "Learn with pure, positive reinforcement. No distractors, just correct answers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
