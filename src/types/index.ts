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
    proOnly: false,
    category: "edit",
  },
  {
    id: "delete-page",
    name: "Delete Halaman PDF",
    description: "Buang halaman tertentu dari fail PDF anda.",
    icon: "Trash2",
    href: "/tools/delete-page",
    proOnly: false,
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
  {
    id: "rotate-pdf",
    name: "Putar PDF",
    description: "Putar halaman PDF ke kiri atau kanan.",
    icon: "RotateCw",
    href: "/tools/rotate-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "add-page-numbers",
    name: "Nombor Halaman",
    description: "Tambah nombor halaman pada PDF anda.",
    icon: "Hash",
    href: "/tools/add-page-numbers",
    proOnly: false,
    category: "edit",
  },
  {
    id: "organize-pdf",
    name: "Susun Halaman PDF",
    description: "Susun semula dan buang halaman dalam PDF.",
    icon: "LayoutList",
    href: "/tools/organize-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "extract-pages",
    name: "Ekstrak Halaman",
    description: "Pilih dan ekstrak halaman tertentu dari PDF.",
    icon: "BookOpen",
    href: "/tools/extract-pages",
    proOnly: false,
    category: "edit",
  },
  {
    id: "image-to-pdf",
    name: "Imej ke PDF",
    description: "Tukar imej JPG atau PNG kepada fail PDF.",
    icon: "ImagePlus",
    href: "/tools/image-to-pdf",
    proOnly: false,
    category: "convert",
  },
  {
    id: "unlock-pdf",
    name: "Buang Sekatan PDF",
    description: "Buang sekatan cetak, salin dan edit dari PDF.",
    icon: "Unlock",
    href: "/tools/unlock-pdf",
    proOnly: false,
    category: "security",
  },
  {
    id: "crop-pdf",
    name: "Potong PDF",
    description: "Potong margin halaman PDF mengikut ukuran anda.",
    icon: "Crop",
    href: "/tools/crop-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "pdf-forms",
    name: "Isi Borang PDF",
    description: "Isi medan borang interaktif dalam PDF.",
    icon: "FileInput",
    href: "/tools/pdf-forms",
    proOnly: false,
    category: "edit",
  },
  {
    id: "flatten-pdf",
    name: "Flatten PDF",
    description: "Tukar PDF interaktif kepada PDF statik.",
    icon: "Layers",
    href: "/tools/flatten-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "batch-compress",
    name: "Mampat Berganda",
    description: "Mampat banyak fail PDF sekaligus.",
    icon: "PackageOpen",
    href: "/tools/batch-compress",
    proOnly: false,
    category: "optimize",
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
