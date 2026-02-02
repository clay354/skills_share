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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-neutral-200">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-mono text-sm text-neutral-900 hover:text-black">
              skills.share
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/commands" className="text-neutral-600 hover:text-black">
                cmd
              </Link>
              <Link href="/plugins" className="text-neutral-600 hover:text-black">
                plugins
              </Link>
              <Link href="/mcp" className="text-neutral-600 hover:text-black">
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
