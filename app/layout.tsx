import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body suppressHydrationWarning className="bg-surface text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
