"use client";

export default function CategoryTabs({ value, onChange, categories }: {
  value: string; onChange: (c: string) => void; categories: string[];
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
      {["All", ...categories].map((c) => (
        <button key={c} onClick={() => onChange(c)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
            value === c
              ? "border-transparent bg-brand text-white shadow-md shadow-wine-700/25"
              : "border-white/60 bg-white/60 text-zinc-600 shadow-sm backdrop-blur-md"}`}>
          {c}
        </button>
      ))}
    </div>
  );
}
