import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Financial Calculators Suite",
  description:
    "Dashboard for 18 calculators - Calculate your financial goals, projections and more",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Include Poppins font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="header">
          <h1>Website Dashboard 2.0</h1>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <p>© 2025 Your Company. All rights reserved.</p>
          <Link href="https://wa.me/yourwhatsapplink" legacyBehavior>
            <a className="cta">Get in Touch</a>
          </Link>
        </footer>
      </body>
    </html>
  );
}
