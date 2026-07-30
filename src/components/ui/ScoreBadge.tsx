import { cn, scoreToLevel } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLevel?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: "px-2 py-0.5 text-xs font-medium",
  md: "px-2.5 py-0.5 text-xs font-medium",
  lg: "px-3 py-1 text-sm font-semibold",
};

const levelColors: Record<string, string> = {
  "輕微": "bg-zinc-900/90 text-zinc-300 border border-zinc-700/80",
  "注意": "bg-slate-900/90 text-slate-300 border border-slate-700/80",
  "警告": "bg-indigo-950/90 text-indigo-300 border border-indigo-800/80",
  "嚴重": "bg-purple-950/90 text-purple-300 border border-purple-800/80",
  "極度侵略": "bg-rose-950/90 text-rose-300 border border-rose-800/80",
};

export default function ScoreBadge({ score, size = "md", showLevel = false }: ScoreBadgeProps) {
  const clamped = Math.max(0, Math.min(10, score));
  const level = scoreToLevel(clamped);
  const colors = levelColors[level] ?? "bg-[#111114] text-zinc-400 border border-zinc-800";

  return (
    <span
      className={cn(
        "inline-flex items-center tracking-tight shrink-0 font-mono",
        sizeStyles[size],
        colors,
      )}
    >
      [{clamped}/10{showLevel ? ` | ${level}` : ""}]
    </span>
  );
}






