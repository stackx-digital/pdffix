import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDFFix — Free PDF Editor Online",
  description: "Merge, split, compress and convert PDF for free.",
};

// Root layout — next-intl middleware handles locale routing.
// This layout wraps the [locale] segment.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
