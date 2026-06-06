# PDFFix

PDFFix is a freemium PDF editor SaaS for Malaysia and SEA.

## Stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase Auth and Postgres
- pdf-lib and PDF.js for browser-first PDF work
- Billplz and Stripe payment routes
- Resend email helper
- CloudConvert conversion endpoint
- Tesseract.js OCR endpoint

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill Supabase, payment, Resend and CloudConvert keys as needed.
3. Run migrations in `supabase/migrations`.
4. Install dependencies with `npm install`.
5. Start with `npm run dev`.

Browser-first tools do not upload files to a server. Backend conversion routes are only used for formats that require CloudConvert or OCR processing.
