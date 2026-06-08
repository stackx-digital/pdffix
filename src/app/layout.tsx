import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "PDFix — Alat PDF Percuma Untuk Semua | Edit, Compress, Gabung PDF",
    template: "%s | PDFix",
  },
  description:
    "Alat PDF percuma online untuk semua. Edit PDF, compress PDF, gabung PDF, tukar PDF ke Word, tanda tangan PDF — terus dalam pelayar. Fail anda tidak pernah keluar dari peranti anda.",
  keywords: [
    "alat pdf percuma",
    "edit pdf online percuma",
    "compress pdf percuma",
    "gabung pdf",
    "pisah pdf",
    "pdf ke word percuma",
    "tanda tangan pdf online",
    "watermark pdf percuma",
    "alat pdf malaysia",
    "edit pdf tanpa upload",
    "pdf tools privacy",
    "cara edit pdf bahasa melayu",
    "tukar pdf ke word percuma tanpa daftar",
    "alternatif ilovepdf malaysia",
    "alat pdf selamat",
  ],
  authors: [{ name: "PDFix", url: "https://pdfix.my" }],
  creator: "PDFix",
  metadataBase: new URL("https://pdfix.my"),
  openGraph: {
    type: "website",
    locale: "ms_MY",
    url: "https://pdfix.my",
    siteName: "PDFix",
    title: "PDFix — Alat PDF Percuma Untuk Semua",
    description:
      "Edit, compress, gabung, pisah dan tukar PDF percuma. Fail anda tidak pernah keluar dari peranti anda.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PDFix — Alat PDF Percuma" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFix — Alat PDF Percuma Untuk Semua",
    description: "Edit, compress, gabung dan tukar PDF percuma. 100% dalam pelayar, selamat dan privat.",
    images: ["/og-image.png"],
  },
  icons: { icon: "/logo.svg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body className={jakarta.className}>
        {children}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "x3a17rrmji");`}
        </Script>
      </body>
    </html>
  );
}

