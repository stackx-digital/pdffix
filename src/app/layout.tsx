import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDFFix — Editor PDF Percuma Online",
  description:
    "Gabung, pisah, mampat dan tukar PDF secara percuma. Tiada upload ke server. Selamat dan peribadi.",
  keywords: ["pdf editor", "gabung pdf", "compress pdf", "pdf malaysia"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
