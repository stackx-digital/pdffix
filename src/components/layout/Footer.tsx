import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} PDFix. Hak cipta terpelihara.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-gray-900">Privasi</Link>
          <Link href="/terms" className="hover:text-gray-900">Terma</Link>
        </div>
      </div>
    </footer>
  );
}
