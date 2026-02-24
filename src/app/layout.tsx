import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skills Share",
  description: "Claude Code 설정 공유",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-800 border-b-4 border-blue-950">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-yellow-300 hover:text-white tracking-wide">
              skills.share
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/commands" className="px-3 py-1.5 text-sm font-bold text-white bg-blue-700 border-2 border-blue-900 hover:bg-yellow-300 hover:text-blue-900 transition-colors">
                cmd
              </Link>
              <Link href="/plugins" className="px-3 py-1.5 text-sm font-bold text-white bg-blue-700 border-2 border-blue-900 hover:bg-yellow-300 hover:text-blue-900 transition-colors">
                plugins
              </Link>
              <Link href="/mcp" className="px-3 py-1.5 text-sm font-bold text-white bg-blue-700 border-2 border-blue-900 hover:bg-yellow-300 hover:text-blue-900 transition-colors">
                mcp
              </Link>
            </div>
          </div>
        </nav>
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
