# PDFix — Free PDF Editor Online

> Editor PDF percuma untuk Malaysia & Asia Tenggara. Free PDF editor for Malaysia & Southeast Asia.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e?logo=supabase)](https://supabase.com)

---

## Features

### PDF Tools

| Tool | Description | Plan |
|------|-------------|------|
| Edit PDF | Add text, draw, highlight, stamp, sign, notes, links | Free |
| Merge PDF | Combine multiple PDFs into one | Free |
| Split PDF | Split PDF into separate files by page range | Free |
| Compress PDF | Reduce PDF file size | Free |
| Delete Pages | Remove specific pages from a PDF | Free |
| Watermark PDF | Add text or image watermark to all pages | Free |
| E-Sign PDF | Draw signature and place on PDF | Free |
| PDF to Image | Convert each page to JPG/PNG | Free |
| PDF to Word | Convert PDF to editable Word document | Pro |
| OCR PDF | Extract text from scanned PDFs | Pro |

### PDF Editor Toolbar

Full toolbar similar to PDF.ai / Adobe Acrobat:

- **Move/Susun** — drag & drop objects to reposition
- **Add Text / Edit Text** — click to place editable text
- **Draw** — freehand drawing with custom color
- **Highlight / Text Highlight** — area and text highlighting
- **Eraser** — remove annotations
- **Line** — insert straight lines
- **Symbols** — Crossmark, Checkmark, Dot, Circle, Cross-out
- **Sign** — signature pad modal, drag to reposition
- **Stamp** — APPROVED / REJECTED / DRAFT / CONFIDENTIAL / REVIEWED / VOID
- **Image** — insert images onto PDF
- **Note** — sticky note annotations
- **Link** — add hyperlinks
- **Undo / Redo** — full history stack
- **Delete** — remove selected objects (Delete key or toolbar button)

### Multi-Language Support

| Language | URL | Direction |
|----------|-----|-----------|
| Bahasa Malaysia | `/` (default) | LTR |
| English | `/en/` | LTR |
| Chinese (Simplified) | `/zh/` | LTR |
| Arabic | `/ar/` | RTL |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| Auth & Database | Supabase (Auth + Postgres + RLS) |
| PDF Rendering | PDF.js (pdfjs-dist v6) |
| PDF Editing | pdf-lib |
| Canvas Annotations | Fabric.js v5 |
| Internationalisation | next-intl v4 |

---

## Local Setup

**Prerequisites:** Node.js 18+, Supabase account

### 1. Clone & Install

```bash
git clone https://github.com/stackx-digital/pdffix.git
cd pdffix
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database

Apply the migration from `supabase/migrations/` in your Supabase SQL editor.

Tables created: `profiles`, `subscriptions`, `usage`

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   └── [locale]/            # All pages under locale prefix
│       ├── page.tsx          # Homepage
│       ├── pricing/
│       ├── dashboard/
│       ├── auth/             # Login, register, callback
│       └── tools/            # All tool pages
├── components/
│   ├── layout/               # Navbar, Footer
│   ├── tools/                # PDF processing components (client-side)
│   └── ui/                   # ToolCard, Faq, LocaleSwitcher
├── i18n/                     # next-intl routing & config
├── lib/                      # Supabase client/server, utils
└── types/                    # TypeScript types & TOOLS registry
messages/                     # Translation files (ms, en, zh, ar)
public/
└── pdf.worker.min.mjs        # PDF.js worker (served locally)
supabase/
└── migrations/               # SQL schema migrations
```

---

## Privacy & Security

- All PDF processing runs **100% in the browser** using WebAssembly — no file uploads to any server
- Files never leave the user's device for free tools
- Supabase RLS policies ensure users can only access their own data
- Auth-protected routes enforced via Next.js middleware

---

## Pricing

| Feature | Free | Pro (RM19/month) |
|---------|------|------------------|
| Basic PDF tools | Yes | Yes |
| Max file size | 10 MB | 100 MB |
| OCR PDF | No | Yes |
| PDF to Word | No | Yes |

---

&copy; 2024 StackX Digital. All rights reserved.
