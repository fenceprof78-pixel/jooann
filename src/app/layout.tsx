import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Display serif for names, a quiet grotesque for everything practical.
// If Google fonts are blocked, the CSS stacks fall back to Palatino and system sans.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Liana & Mateo — 28 December 2026",
  description: "You are invited to the wedding of Liana Santos and Mateo Cruz in Makati, Philippines.",
  applicationName: "Verde Invitation",
};

export const viewport: Viewport = {
  themeColor: "#0C221B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {/* Hides the gate before paint when this browser has already opened it. */}
        <Script id="opened-flag" strategy="beforeInteractive">
          {`try{if(sessionStorage.getItem("verde-opened")==="1")document.documentElement.classList.add("opened-already")}catch(e){}`}
        </Script>
        <noscript>
          <style>{`.gate{display:none !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
