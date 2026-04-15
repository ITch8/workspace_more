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
        <div className="app-shell">
          <header className="top-nav" aria-label="Top navigation">
            <Link href="/" className="top-nav__brand" aria-label="ReplyBoost homepage">
              <span className="top-nav__dot" aria-hidden="true" />
              <span>ReplyBoost</span>
            </Link>
            <nav className="top-nav__links" aria-label="Quick navigation">
              <Link href="/campaigns">Campaigns</Link>
              <Link href="/register">Register</Link>
              <Link href="/login">Login</Link>
            </nav>
          </header>
          <div className="content-grid">
            <aside className="side-nav" aria-label="Sidebar navigation">
              <div className="side-nav__group">
                <p className="side-nav__title">Overview</p>
                <ul className="side-nav__list">
                  <li>
                    <Link className="side-nav__link" href="/">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link className="side-nav__link" href="/campaigns">
                      Campaigns
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="side-nav__group">
                <p className="side-nav__title">Account</p>
                <ul className="side-nav__list">
                  <li>
                    <Link className="side-nav__link" href="/register">
                      Create account
                    </Link>
                  </li>
                  <li>
                    <Link className="side-nav__link" href="/login">
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>
            <main className="page-panel">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
