"use client";

type TimeFrame = "week" | "month" | "year";

interface TimeFrameSelectorProps {
  value: TimeFrame;
  onChange: (value: TimeFrame) => void;
}

export function TimeFrameSelector({ value, onChange }: TimeFrameSelectorProps) {
  const options: TimeFrame[] = ["week", "month", "year"];

  return (
    <div className="flex items-center gap-1 p-1 bg-white/[0.05] rounded-lg">
      {options.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            value === tf
              ? "bg-[#DE2010] text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {tf === "week" ? "This Week" : tf === "month" ? "This Month" : "This Year"}
        </button>
      ))}
    </div>
  );
}
