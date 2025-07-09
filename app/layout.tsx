import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Financial Calculators Suite",
  description:
    "Dashboard for 18 calculators - Calculate your financial goals, projections and more",
};

// Define contributors in a structured format
const contributors = [
  { name: "Varun R Poojari", prn: "1032211035" },
  { name: "Shreny D Jain", prn: "1032211794" },
  { name: "Sahil Panda", prn: "1032212344" },
  { name: "Dhruv Jain", prn: "1032212358" },
];

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
          <h1>Final Year Capstone Project</h1>
          <ul className="contributors">
            {contributors.map(({ name, prn }) => (
              <li key={prn}>
                <span className="name">{name}</span>{" "}
                <span className="prn">({prn})</span>
              </li>
            ))}
          </ul>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <p>© Batch of 2025 Btech CSE-CSF. All rights reserved.</p>
          <Link href="https://wa.me/yourwhatsapplink" legacyBehavior>
            <a className="cta">Get in Touch</a>
          </Link>
        </footer>
      </body>
    </html>
  );
}
