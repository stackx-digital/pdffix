import Link from "next/link";
import { FilePlus2, Scissors, FileArchive, FileText, Image, ScanText, PenLine, Signature, Droplets, Trash2, RotateCw, Hash, LayoutList, BookOpen, ImagePlus, Unlock, Crop, FileInput, Layers, PackageOpen, ShieldX, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FilePlus2,
  Scissors,
  FileArchive,
  FileText,
  Image,
  ScanText,
  PenLine,
  Signature,
  Droplets,
  Trash2,
  RotateCw,
  Hash,
  LayoutList,
  BookOpen,
  ImagePlus,
  Unlock,
  Crop,
  FileInput,
  Layers,
  PackageOpen,
  ShieldX,
  FileCode,
};

interface ToolCardProps {
  tool: Tool;
  isPro?: boolean;
}

export default function ToolCard({ tool, isPro = false }: ToolCardProps) {
  const Icon = ICON_MAP[tool.icon] ?? FilePlus2;
  const locked = tool.proOnly && !isPro;

  return (
    <Link
      href={locked ? "/pricing" : tool.href}
      className={cn(
        "group relative flex flex-col gap-2 p-3.5 md:p-5 rounded-2xl border bg-white transition-all duration-200",
        locked
          ? "border-gray-200 opacity-70 cursor-default"
          : "border-gray-200 hover:border-red-200 hover:shadow-lg hover:shadow-red-50 hover:-translate-y-0.5"
      )}
    >
      {tool.proOnly && (
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold tracking-wide uppercase">
          Pro
        </span>
      )}
      <div className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200",
        locked ? "bg-gray-100" : "bg-red-50 group-hover:bg-red-100"
      )}>
        <Icon className={cn("w-5 h-5", locked ? "text-gray-400" : "text-red-600")} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{tool.name}</h3>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tool.description}</p>
      </div>
    </Link>
  );
}
