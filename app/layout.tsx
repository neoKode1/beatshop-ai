import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast/Toast";

export const metadata: Metadata = {
  title: "BeatShop - Professional Beat Machine",
  description: "Create professional beats with 16-pad beat machine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Orbitron font for robot-style branding */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-gray-950 text-white">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

