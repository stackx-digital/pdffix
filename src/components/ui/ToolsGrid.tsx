"use client";

import { useState } from "react";
import ToolCard from "./ToolCard";
import { TOOLS } from "@/types";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Semua", value: "all" },
  { label: "Edit", value: "edit" },
  { label: "Convert", value: "convert" },
  { label: "Optimize", value: "optimize" },
  { label: "Security", value: "security" },
] as const;

type TabValue = typeof TABS[number]["value"];

export default function ToolsGrid() {
  const [active, setActive] = useState<TabValue>("all");

  const filtered = active === "all" ? TOOLS : TOOLS.filter((t) => t.category === active);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        {TABS.map((tab) => {
          const count = tab.value === "all" ? TOOLS.length : TOOLS.filter((t) => t.category === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                active === tab.value
                  ? "bg-red-600 text-white shadow-md shadow-red-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                active === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} isPro={false} />
        ))}
      </div>
    </div>
  );
}
