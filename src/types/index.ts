export type Plan = "free" | "pro";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  proOnly: boolean;
  category: "convert" | "edit" | "optimize" | "security";
}

export const TOOLS: Tool[] = [
  {
    id: "edit-pdf",
    name: "Edit PDF",
    description: "Tambah teks, lukis, highlight dan sisip imej dalam PDF.",
    icon: "PenLine",
    href: "/tools/edit-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "merge-pdf",
    name: "Gabung PDF",
    description: "Cantumkan beberapa fail PDF menjadi satu.",
    icon: "FilePlus2",
    href: "/tools/merge-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "split-pdf",
    name: "Pisah PDF",
    description: "Bahagikan PDF kepada beberapa fail berasingan.",
    icon: "Scissors",
    href: "/tools/split-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "compress-pdf",
    name: "Mampat PDF",
    description: "Kurangkan saiz fail PDF tanpa hilang kualiti.",
    icon: "FileArchive",
    href: "/tools/compress-pdf",
    proOnly: false,
    category: "optimize",
  },
  {
    id: "pdf-to-word",
    name: "PDF ke Word",
    description: "Tukar PDF kepada dokumen Word yang boleh diedit.",
    icon: "FileText",
    href: "/tools/pdf-to-word",
    proOnly: true,
    category: "convert",
  },
  {
    id: "pdf-to-image",
    name: "PDF ke Imej",
    description: "Tukar setiap halaman PDF kepada imej JPG atau PNG.",
    icon: "Image",
    href: "/tools/pdf-to-image",
    proOnly: false,
    category: "convert",
  },
  {
    id: "ocr",
    name: "OCR PDF",
    description: "Ekstrak teks daripada PDF yang diimbas.",
    icon: "ScanText",
    href: "/tools/ocr",
    proOnly: true,
    category: "edit",
  },
  {
    id: "e-sign",
    name: "E-Sign PDF",
    description: "Tambah tandatangan digital pada PDF anda.",
    icon: "Signature",
    href: "/tools/e-sign",
    proOnly: false,
    category: "edit",
  },
  {
    id: "watermark",
    name: "Watermark PDF",
    description: "Tambah watermark teks atau logo pada PDF.",
    icon: "Droplets",
    href: "/tools/watermark",
    proOnly: false,
    category: "security",
  },
];

export const FREE_LIMITS = {
  filesPerDay: 3,
  maxFileSizeMB: 10,
};

export const PRO_LIMITS = {
  filesPerDay: Infinity,
  maxFileSizeMB: 100,
};
