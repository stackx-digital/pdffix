import Link from "next/link";
import { FilePlus2, Scissors, FileArchive, FileText, Image, ScanText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FilePlus2,
  Scissors,
  FileArchive,
  FileText,
  Image,
  ScanText,
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
        "group relative flex flex-col gap-3 p-5 rounded-xl border bg-white hover:shadow-md transition-all",
        locked ? "border-gray-200 opacity-75" : "border-gray-200 hover:border-red-200"
      )}
    >
      {tool.proOnly && (
        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
          Pro
        </span>
      )}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        locked ? "bg-gray-100" : "bg-red-50 group-hover:bg-red-100"
      )}>
        <Icon className={cn("w-5 h-5", locked ? "text-gray-400" : "text-red-600")} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{tool.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tool.description}</p>
      </div>
    </Link>
  );
}
