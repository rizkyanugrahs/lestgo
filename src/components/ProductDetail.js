"use client";
import { Pencil, Trash2, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Sheet from "@/components/Sheet";
import SignedImage from "@/components/SignedImage";

export default function ProductDetail({ product, onClose, onEdit, onDelete }) {
  const { t } = useI18n();
  if (!product) return null;
  const rows = [
    ["prod_ingredients", product.key_ingredients],
    ["prod_benefits", product.benefits],
    ["prod_how", product.how_to_use],
    ["prod_age", product.age_range],
  ];
  return (
    <Sheet open title={product.name} onClose={onClose}>
      <div className="space-y-4">
        {product.category && <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">{product.category}</span>}
        {product.image_path && <SignedImage path={product.image_path} className="h-48 w-full rounded-2xl border border-white/10 object-cover" />}
        {rows.map(([k, v]) => (
          <div key={k}>
            <p className="text-xs uppercase tracking-wide text-zinc-400">{t(k)}</p>
            <p className={"mt-1 whitespace-pre-wrap text-sm " + (v ? "text-white" : "text-zinc-600")}>{v || t("prod_no_info")}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-200"><TriangleAlert size={14} />{t("prod_contra")}</p>
          <p className={"mt-1 whitespace-pre-wrap text-sm " + (product.contraindications ? "text-amber-100" : "text-zinc-500")}>{product.contraindications || t("prod_no_info")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(product)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-black"><Pencil size={16} />{t("prod_edit")}</button>
          <button onClick={() => onDelete(product)} aria-label={t("delete")} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 text-red-300"><Trash2 size={18} /></button>
        </div>
      </div>
    </Sheet>
  );
}
