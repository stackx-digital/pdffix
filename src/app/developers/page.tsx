import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PDFix API — Developer Reference",
  description: "REST API for PDF processing: merge, split, rotate, watermark, OCR, and more. Free tier available.",
  alternates: { canonical: "https://pdfix.my/developers" },
};

const BASE = "https://pdfix.my/api/v1/pdf";

const ENDPOINTS = [
  {
    method: "POST", path: "/merge", title: "Merge PDF",
    desc: "Combine 2 or more PDF files into one.",
    params: [{ name: "files[]", type: "File[]", req: true, desc: "Two or more PDF files" }],
    example: `curl -X POST ${BASE}/merge \\
  -H "Authorization: Bearer pfx_..." \\
  -F "files[]=@a.pdf" \\
  -F "files[]=@b.pdf" \\
  --output merged.pdf`,
  },
  {
    method: "POST", path: "/split", title: "Split PDF",
    desc: "Extract a page range from a PDF.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "from", type: "number", req: false, desc: "Start page (1-indexed, default 1)" },
      { name: "to", type: "number", req: false, desc: "End page (1-indexed, default last)" },
    ],
    example: `curl -X POST ${BASE}/split \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "from=2" -F "to=5" \\
  --output pages-2-5.pdf`,
  },
  {
    method: "POST", path: "/rotate", title: "Rotate PDF",
    desc: "Rotate pages by 90, 180, or 270 degrees.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "degrees", type: "90|180|270", req: false, desc: "Rotation angle (default 90)" },
      { name: "pages", type: "string", req: false, desc: "1-indexed page list, e.g. 1,3,5 or [1,3,5]. Default: all" },
    ],
    example: `curl -X POST ${BASE}/rotate \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "degrees=90" \\
  --output rotated.pdf`,
  },
  {
    method: "POST", path: "/delete-pages", title: "Delete Pages",
    desc: "Remove specific pages from a PDF.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "pages", type: "string", req: true, desc: "1-indexed pages to delete, e.g. 2,4 or [2,4]" },
    ],
    example: `curl -X POST ${BASE}/delete-pages \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "pages=2,4" \\
  --output output.pdf`,
  },
  {
    method: "POST", path: "/extract-pages", title: "Extract Pages",
    desc: "Keep only specific pages from a PDF.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "pages", type: "string", req: true, desc: "1-indexed pages to keep, e.g. 1,3,5" },
    ],
    example: `curl -X POST ${BASE}/extract-pages \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "pages=1,3" \\
  --output extracted.pdf`,
  },
  {
    method: "POST", path: "/watermark", title: "Watermark PDF",
    desc: "Stamp a diagonal text watermark on every page.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "text", type: "string", req: false, desc: "Watermark text (default CONFIDENTIAL)" },
      { name: "color", type: "string", req: false, desc: "Hex color, e.g. #ff0000 (default #ff0000)" },
      { name: "opacity", type: "number", req: false, desc: "0–1 opacity (default 0.15)" },
      { name: "size", type: "number", req: false, desc: "Font size in pt (default 48)" },
    ],
    example: `curl -X POST ${BASE}/watermark \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "text=DRAFT" -F "opacity=0.2" \\
  --output watermarked.pdf`,
  },
  {
    method: "POST", path: "/add-page-numbers", title: "Add Page Numbers",
    desc: "Stamp page numbers on each page.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "position", type: "string", req: false, desc: "bottom-center|bottom-right|bottom-left|top-center" },
      { name: "start", type: "number", req: false, desc: "Starting number (default 1)" },
      { name: "size", type: "number", req: false, desc: "Font size in pt (default 10)" },
    ],
    example: `curl -X POST ${BASE}/add-page-numbers \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "position=bottom-center" \\
  --output numbered.pdf`,
  },
  {
    method: "POST", path: "/pdf-to-text", title: "PDF to Text",
    desc: "Extract text content from a PDF. Returns JSON.",
    params: [{ name: "file", type: "File", req: true, desc: "Source PDF" }],
    returns: `{ "pages": [{ "page": 1, "text": "..." }], "full_text": "...", "page_count": 5 }`,
    example: `curl -X POST ${BASE}/pdf-to-text \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf"`,
  },
  {
    method: "POST", path: "/ocr-image", title: "OCR Image",
    desc: "Extract text from a JPG/PNG image — ideal for receipts, ICs, scanned documents. Returns JSON.",
    params: [
      { name: "image", type: "File", req: true, desc: "JPG or PNG image file" },
      { name: "lang", type: "string", req: false, desc: "Language: eng|msa|chi_sim|ara (default eng)" },
    ],
    returns: `{ "text": "...", "confidence": 92, "words": [{ "text": "Hello", "confidence": 98 }], "lang": "eng" }`,
    example: `curl -X POST ${BASE}/ocr-image \\
  -H "Authorization: Bearer pfx_..." \\
  -F "image=@receipt.jpg" -F "lang=eng"`,
  },
  {
    method: "POST", path: "/image-to-pdf", title: "Image to PDF",
    desc: "Convert one or more JPG/PNG images to a PDF.",
    params: [{ name: "images[]", type: "File[]", req: true, desc: "One or more JPG/PNG images" }],
    example: `curl -X POST ${BASE}/image-to-pdf \\
  -H "Authorization: Bearer pfx_..." \\
  -F "images[]=@page1.jpg" -F "images[]=@page2.png" \\
  --output output.pdf`,
  },
  {
    method: "POST", path: "/flatten", title: "Flatten PDF",
    desc: "Convert interactive form fields into static, uneditable content.",
    params: [{ name: "file", type: "File", req: true, desc: "Source PDF" }],
    example: `curl -X POST ${BASE}/flatten \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@form.pdf" --output flattened.pdf`,
  },
  {
    method: "POST", path: "/protect", title: "Protect PDF",
    desc: "Add a password to a PDF.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "password", type: "string", req: true, desc: "User password to open the PDF" },
      { name: "owner_password", type: "string", req: false, desc: "Owner/permissions password (defaults to password)" },
    ],
    example: `curl -X POST ${BASE}/protect \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "password=s3cr3t" \\
  --output protected.pdf`,
  },
  {
    method: "POST", path: "/crop", title: "Crop PDF",
    desc: "Trim margins from PDF pages (in points; 1pt ≈ 0.35mm).",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "top", type: "number", req: false, desc: "Points to cut from top (default 0)" },
      { name: "bottom", type: "number", req: false, desc: "Points to cut from bottom (default 0)" },
      { name: "left", type: "number", req: false, desc: "Points to cut from left (default 0)" },
      { name: "right", type: "number", req: false, desc: "Points to cut from right (default 0)" },
    ],
    example: `curl -X POST ${BASE}/crop \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "top=36" -F "bottom=36" \\
  --output cropped.pdf`,
  },
  {
    method: "POST", path: "/organize", title: "Organize Pages",
    desc: "Reorder pages of a PDF.",
    params: [
      { name: "file", type: "File", req: true, desc: "Source PDF" },
      { name: "order", type: "string", req: true, desc: "New page order as 1-indexed list, e.g. [3,1,2] or 3,1,2" },
    ],
    example: `curl -X POST ${BASE}/organize \\
  -H "Authorization: Bearer pfx_..." \\
  -F "file=@doc.pdf" -F "order=3,1,2" \\
  --output reordered.pdf`,
  },
];

export default async function DevelopersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gray-950 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">PDFix REST API</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Developer Reference</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Process PDFs programmatically. Merge, split, rotate, watermark, OCR images and more — via simple HTTP calls.
            </p>
            <div className="flex gap-3 mt-6">
              <Link
                href={user ? "/dashboard/api-keys" : "/auth/register"}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
              >
                {user ? "Get API Key →" : "Sign Up Free →"}
              </Link>
              <a href="#endpoints" className="px-5 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm hover:border-gray-500">
                View Endpoints
              </a>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Quick start */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Start</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { step: "1", title: "Get API Key", desc: "Sign up free and generate a key from your dashboard.", href: user ? "/dashboard/api-keys" : "/auth/register", link: user ? "Go to API Keys" : "Sign up" },
                { step: "2", title: "Send a Request", desc: "POST multipart/form-data with your PDF file(s) and key.", href: "#endpoints", link: "See endpoints" },
                { step: "3", title: "Download Result", desc: "Most endpoints return a PDF binary. Text endpoints return JSON.", href: "#endpoints", link: "See examples" },
              ].map((s) => (
                <div key={s.step} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mb-3">{s.step}</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{s.desc}</p>
                  <a href={s.href} className="text-xs text-red-600 hover:underline font-medium">{s.link} →</a>
                </div>
              ))}
            </div>

            <div className="bg-gray-950 text-gray-100 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-2 font-mono">Authentication — include in every request:</p>
              <pre className="text-sm font-mono overflow-x-auto">{`Authorization: Bearer pfx_your_key_here
# or
X-Api-Key: pfx_your_key_here`}</pre>
            </div>
          </section>

          {/* Rate limits */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Limits & Pricing</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    {["Tier", "Monthly calls", "Max file size", "Price"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr>
                    <td className="px-4 py-3 font-medium">Free</td>
                    <td className="px-4 py-3 text-gray-600">100 / month</td>
                    <td className="px-4 py-3 text-gray-600">10 MB</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">RM 0</td>
                  </tr>
                  <tr className="bg-red-50/40">
                    <td className="px-4 py-3 font-medium">Pro</td>
                    <td className="px-4 py-3 text-gray-600">Unlimited</td>
                    <td className="px-4 py-3 text-gray-600">100 MB</td>
                    <td className="px-4 py-3 text-red-600 font-semibold">RM 19 / month</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Exceeded quota returns HTTP 403. <Link href="/pricing" className="text-red-600 hover:underline">Upgrade to Pro →</Link>
            </p>
          </section>

          {/* Errors */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Error Responses</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    {["Status", "Meaning"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {[
                    ["401", "Missing or malformed API key"],
                    ["403", "Invalid key, revoked, or monthly quota exceeded"],
                    ["400", "Bad request — missing required field or invalid parameter"],
                    ["500", "Server error processing the PDF"],
                  ].map(([code, msg]) => (
                    <tr key={code}>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800">{code}</td>
                      <td className="px-4 py-3 text-gray-600">{msg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 bg-gray-950 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 font-mono">Error body format:</p>
              <pre className="text-sm font-mono text-gray-100">{`{ "error": "Description of what went wrong" }`}</pre>
            </div>
          </section>

          {/* Endpoints */}
          <section id="endpoints">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Endpoints</h2>
            <div className="space-y-8">
              {ENDPOINTS.map((ep) => (
                <div key={ep.path} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded font-mono">{ep.method}</span>
                    <code className="text-sm font-mono text-gray-800">/api/v1/pdf{ep.path}</code>
                    <span className="ml-auto text-sm font-medium text-gray-700">{ep.title}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-600 mb-4">{ep.desc}</p>

                    {ep.params.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parameters (multipart/form-data)</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-gray-400 border-b border-gray-100">
                                <th className="pb-2 pr-4 font-medium">Name</th>
                                <th className="pb-2 pr-4 font-medium">Type</th>
                                <th className="pb-2 pr-4 font-medium">Required</th>
                                <th className="pb-2 font-medium">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {ep.params.map((p) => (
                                <tr key={p.name}>
                                  <td className="py-2 pr-4 font-mono text-gray-800">{p.name}</td>
                                  <td className="py-2 pr-4 text-blue-600 font-mono">{p.type}</td>
                                  <td className="py-2 pr-4">
                                    {p.req
                                      ? <span className="text-red-500 font-semibold">Yes</span>
                                      : <span className="text-gray-400">No</span>}
                                  </td>
                                  <td className="py-2 text-gray-500">{p.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {ep.returns && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Returns (JSON)</p>
                        <pre className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto">{ep.returns}</pre>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Example (curl)</p>
                      <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">{ep.example}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-12 p-5 bg-red-50 border border-red-100 rounded-xl text-center">
            <p className="text-sm text-red-700 font-semibold mb-1">Ready to start building?</p>
            <p className="text-xs text-red-600 mb-4">Generate your free API key and make your first request in under a minute.</p>
            <Link
              href={user ? "/dashboard/api-keys" : "/auth/register"}
              className="inline-block px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
            >
              {user ? "Get API Key →" : "Sign Up Free →"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
