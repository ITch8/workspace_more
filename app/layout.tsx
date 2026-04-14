import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ReplyBoost MVP",
  description: "Sprint 1 baseline implementation"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <nav className="p-4 border-b bg-white flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/register">Register</Link>
          <Link href="/login">Login</Link>
          <Link href="/campaigns">Campaigns</Link>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
