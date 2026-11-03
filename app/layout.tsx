import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Visites · rapport de visite de risque" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}
