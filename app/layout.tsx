import type { Metadata } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ROSE-SEIN",
  description:
    "ROSE-SEIN is a calm, privacy-first digital companion for breast cancer patients, caregivers, and the association community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${plusJakartaSans.variable} ${beVietnamPro.variable}`}>
      <body
        suppressHydrationWarning
        className="bg-surface font-body text-on-surface antialiased"
      >
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[70] rounded-full bg-surface-container-lowest px-4 py-3 font-label text-sm font-semibold text-primary shadow-ambient focus:not-sr-only"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
