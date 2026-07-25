import Link from "next/link";
import {
  FilePlus2, Scissors, FileArchive, FileText, Image, ScanText,
  PenLine, Signature, Droplets, Trash2, RotateCw, Hash, LayoutList,
  BookOpen, ImagePlus, Unlock, Crop, FileInput, Layers, PackageOpen,
  ShieldX, FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FilePlus2, Scissors, FileArchive, FileText, Image, ScanText,
  PenLine, Signature, Droplets, Trash2, RotateCw, Hash, LayoutList,
  BookOpen, ImagePlus, Unlock, Crop, FileInput, Layers, PackageOpen,
  ShieldX, FileCode,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; iconBg: string; iconText: string; hoverBorder: string; hoverShadow: string }> = {
  edit:     { bg: "bg-red-50",    text: "text-red-600",    iconBg: "bg-red-100",    iconText: "text-red-600",    hoverBorder: "hover:border-red-200",    hoverShadow: "hover:shadow-red-50" },
  convert:  { bg: "bg-blue-50",   text: "text-blue-600",   iconBg: "bg-blue-100",   iconText: "text-blue-600",   hoverBorder: "hover:border-blue-200",   hoverShadow: "hover:shadow-blue-50" },
  optimize: { bg: "bg-green-50",  text: "text-green-600",  iconBg: "bg-green-100",  iconText: "text-green-600",  hoverBorder: "hover:border-green-200",  hoverShadow: "hover:shadow-green-50" },
  security: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100", iconText: "text-purple-600", hoverBorder: "hover:border-purple-200", hoverShadow: "hover:shadow-purple-50" },
};

const CATEGORY_LABELS: Record<string, string> = {
  edit: "Edit", convert: "Convert", optimize: "Optimize", security: "Security",
};

interface ToolCardProps {
  tool: Tool;
  isPro?: boolean;
}

export default function ToolCard({ tool, isPro = false }: ToolCardProps) {
  const Icon = ICON_MAP[tool.icon] ?? FilePlus2;
  const locked = tool.proOnly && !isPro;
  const c = CATEGORY_COLORS[tool.category] ?? CATEGORY_COLORS.edit;

  return (
    <Link
      href={locked ? "/pricing" : tool.href}
      className={cn(
        "group relative flex flex-col gap-3 p-4 md:p-5 rounded-2xl border bg-white transition-all duration-200",
        locked
          ? "border-gray-200 opacity-60 cursor-default"
          : `border-gray-200 ${c.hoverBorder} hover:shadow-lg ${c.hoverShadow} hover:-translate-y-0.5`
      )}
    >
      {/* Pro badge */}
      {tool.proOnly && (
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold tracking-wide uppercase">
          Pro
        </span>
      )}

      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 shrink-0",
        locked ? "bg-gray-100" : `${c.iconBg} group-hover:opacity-90`
      )}>
        <Icon className={cn("w-5 h-5", locked ? "text-gray-400" : c.iconText)} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{tool.name}</h3>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{tool.description}</p>
      </div>

      {/* Category chip */}
      <span className={cn(
        "self-start text-[10px] px-2 py-0.5 rounded-full font-medium",
        locked ? "bg-gray-100 text-gray-400" : `${c.bg} ${c.text}`
      )}>
        {CATEGORY_LABELS[tool.category] ?? tool.category}
      </span>
    </Link>
  );
}
