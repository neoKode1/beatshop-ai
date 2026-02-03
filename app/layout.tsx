import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beat Shop AI - AI-Powered Beat Machine",
  description: "Create professional beats with AI-powered 16-pad beat machine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}

