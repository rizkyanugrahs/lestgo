"use client";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { newId } from "@/lib/places";
import type { ChecklistItem } from "@/lib/types";

/**
 * checkable = true  -> wishlist "things to try" with a checkbox on every item.
 * checkable = false -> visit log: a clean list of text items, no checkboxes.
 */
export default function ChecklistEditor({ items, onChange, placeholder, checkable = true }: {
  items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void; placeholder: string; checkable?: boolean;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    onChange([...items, { id: newId(), text: t, completed: false }]);
    setText("");
  };

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 ring-1 ring-white/60">
          {checkable ? (
            <button type="button" onClick={() => onChange(items.map((x) => (x.id === it.id ? { ...x, completed: !x.completed } : x)))}
              aria-label="Toggle"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${it.completed ? "border-transparent bg-brand text-white" : "border-zinc-300 text-transparent"}`}>
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="h-2 w-2 shrink-0 rounded-full bg-wine-700/50" />
          )}
          <span className={`flex-1 text-sm ${checkable && it.completed ? "text-zinc-400 line-through" : ""}`}>{it.text}</span>
          <button type="button" onClick={() => onChange(items.filter((x) => x.id !== it.id))} aria-label="Remove" className="text-zinc-300"><X className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-wine-600" />
        <button type="button" onClick={add} aria-label="Add" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white"><Plus className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
