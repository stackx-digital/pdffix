import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "PDFix — Free PDF Editor Online",
  description: "Merge, split, compress and convert PDF for free. No server upload. Safe and private.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
