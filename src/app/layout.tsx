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
    default: "PDFix — Free PDF Tools for Everyone | Edit, Compress, Merge PDF",
    template: "%s | PDFix",
  },
  description:
    "Free online PDF tools for everyone. Edit PDF, compress PDF, merge PDF, convert PDF to Word, sign PDF — directly in your browser. Your files never leave your device.",
  keywords: [
    "free pdf tools",
    "edit pdf online free",
    "compress pdf free",
    "merge pdf",
    "split pdf",
    "pdf to word free",
    "sign pdf online",
    "watermark pdf free",
    "pdf tools",
    "edit pdf without upload",
    "pdf tools privacy",
    "free pdf editor",
    "pdf converter online",
    "ilovepdf alternative",
    "secure pdf tools",
  ],
  authors: [{ name: "PDFix", url: "https://pdfix.my" }],
  creator: "PDFix",
  metadataBase: new URL("https://pdfix.my"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pdfix.my",
    siteName: "PDFix",
    title: "PDFix — Free PDF Tools for Everyone",
    description:
      "Edit, compress, merge, split and convert PDF for free. Your files never leave your device.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PDFix — Free PDF Tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFix — Free PDF Tools for Everyone",
    description: "Edit, compress, merge and convert PDF for free. 100% in-browser, secure and private.",
    images: ["/og-image.png"],
  },
  icons: { icon: "/logo.svg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
