import { cn } from "@/lib/utils";

interface ScoreDotsProps {
  score: number;
  max?: number;
}

export default function ScoreDots({ score, max = 10 }: ScoreDotsProps) {
  const clamped = Math.max(0, Math.min(max, score));
  const total = Math.ceil(max / 2);
  const filled = Math.ceil(clamped / 2);

  const getDotColor = (index: number) => {
    if (index >= filled) return "bg-zinc-800/80 border-zinc-700/50";
    if (clamped <= 2) return "bg-zinc-400 border-zinc-300";
    if (clamped <= 4) return "bg-slate-400 border-slate-300";
    if (clamped <= 6) return "bg-indigo-500 border-indigo-400";
    if (clamped <= 8) return "bg-purple-500 border-purple-400";
    return "bg-rose-500 border-rose-400";
  };

  return (
    <span
      className="inline-flex items-center gap-1 shrink-0"
      aria-label={`侵略分數 ${clamped} / ${max}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 border transition-colors duration-150",
            getDotColor(i)
          )}
        />
      ))}
    </span>
  );

}



