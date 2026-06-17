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
    description: "Add text, draw, highlight and insert images into a PDF.",
    icon: "PenLine",
    href: "/tools/edit-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDF files into one.",
    icon: "FilePlus2",
    href: "/tools/merge-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    description: "Split a PDF into multiple separate files.",
    icon: "Scissors",
    href: "/tools/split-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce PDF file size without losing quality.",
    icon: "FileArchive",
    href: "/tools/compress-pdf",
    proOnly: false,
    category: "optimize",
  },
  {
    id: "pdf-to-image",
    name: "PDF to Image",
    description: "Convert each PDF page to JPG or PNG image.",
    icon: "Image",
    href: "/tools/pdf-to-image",
    proOnly: false,
    category: "convert",
  },
  {
    id: "ocr",
    name: "OCR PDF",
    description: "Extract text from scanned PDF documents.",
    icon: "ScanText",
    href: "/tools/ocr",
    proOnly: false,
    category: "edit",
  },
  {
    id: "delete-page",
    name: "Delete PDF Pages",
    description: "Remove specific pages from your PDF file.",
    icon: "Trash2",
    href: "/tools/delete-page",
    proOnly: false,
    category: "edit",
  },
  {
    id: "e-sign",
    name: "E-Sign PDF",
    description: "Add a digital signature to your PDF.",
    icon: "Signature",
    href: "/tools/e-sign",
    proOnly: false,
    category: "edit",
  },
  {
    id: "watermark",
    name: "Watermark PDF",
    description: "Add a text or logo watermark to your PDF.",
    icon: "Droplets",
    href: "/tools/watermark",
    proOnly: false,
    category: "security",
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    description: "Rotate PDF pages left or right.",
    icon: "RotateCw",
    href: "/tools/rotate-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "add-page-numbers",
    name: "Page Numbers",
    description: "Add page numbers to your PDF.",
    icon: "Hash",
    href: "/tools/add-page-numbers",
    proOnly: false,
    category: "edit",
  },
  {
    id: "organize-pdf",
    name: "Organize PDF",
    description: "Reorder and remove pages in your PDF.",
    icon: "LayoutList",
    href: "/tools/organize-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "extract-pages",
    name: "Extract Pages",
    description: "Select and extract specific pages from a PDF.",
    icon: "BookOpen",
    href: "/tools/extract-pages",
    proOnly: false,
    category: "edit",
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Convert JPG or PNG images to a PDF file.",
    icon: "ImagePlus",
    href: "/tools/image-to-pdf",
    proOnly: false,
    category: "convert",
  },
  {
    id: "unlock-pdf",
    name: "Unlock PDF",
    description: "Remove print, copy and edit restrictions from a PDF.",
    icon: "Unlock",
    href: "/tools/unlock-pdf",
    proOnly: false,
    category: "security",
  },
  {
    id: "crop-pdf",
    name: "Crop PDF",
    description: "Crop PDF page margins to your desired size.",
    icon: "Crop",
    href: "/tools/crop-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "pdf-forms",
    name: "Fill PDF Forms",
    description: "Fill interactive form fields in a PDF.",
    icon: "FileInput",
    href: "/tools/pdf-forms",
    proOnly: false,
    category: "edit",
  },
  {
    id: "flatten-pdf",
    name: "Flatten PDF",
    description: "Convert an interactive PDF to a static PDF.",
    icon: "Layers",
    href: "/tools/flatten-pdf",
    proOnly: false,
    category: "edit",
  },
  {
    id: "batch-compress",
    name: "Batch Compress",
    description: "Compress multiple PDF files at once.",
    icon: "PackageOpen",
    href: "/tools/batch-compress",
    proOnly: false,
    category: "optimize",
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract all text from a PDF to a .txt file.",
    icon: "FileText",
    href: "/tools/pdf-to-text",
    proOnly: false,
    category: "convert",
  },
  {
    id: "doc-to-markdown",
    name: "DOC/PDF to Markdown",
    description: "Convert Word or PDF files to Markdown format.",
    icon: "FileCode",
    href: "/tools/doc-to-markdown",
    proOnly: false,
    category: "convert",
  },
  {
    id: "strike-ic",
    name: "Strike IC Copy",
    description: "Add a diagonal cross and purpose label to your IC photocopy to prevent misuse.",
    icon: "ShieldX",
    href: "/tools/strike-ic",
    proOnly: false,
    category: "security",
  },
];

export const FREE_LIMITS = {
  editsPerMonth: 5,
  maxFileSizeMB: 10,
};

export const PRO_LIMITS = {
  editsPerMonth: Infinity,
  maxFileSizeMB: 100,
};
