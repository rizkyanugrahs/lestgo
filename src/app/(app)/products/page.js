"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X, Plus, Settings2, Loader2, Package, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { removeImage } from "@/lib/storage";
import GlassCard from "@/components/GlassCard";
import Notice from "@/components/Notice";
import ConfirmDialog from "@/components/ConfirmDialog";
import SignedImage from "@/components/SignedImage";
import ProductForm from "@/components/ProductForm";
import ProductDetail from "@/components/ProductDetail";
import ProductManage from "@/components/ProductManage";

export default function ProductsPage() {
  const { supabase } = useAuth();
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("__all");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [detail, setDetail] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true });
    if (error) setMsg({ type: "error", text: friendlyError(error) });
    else setProducts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const unc = t("prod_uncategorized");
  const catOf = (p) => (p.category && p.category.trim()) || unc;
  const categories = useMemo(() => {
    const counts = {};
    products.forEach((p) => { const c = catOf(p); counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, unc]);

  const q = query.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (category !== "__all" && catOf(p) !== category) return false;
    if (!q) return true;
    return [p.name, p.category, p.key_ingredients, p.benefits, p.how_to_use, p.age_range, p.contraindications].some((v) => v && v.toLowerCase().includes(q));
  });

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((p) => { const c = catOf(p); (g[c] = g[c] || []).push(p); });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, unc]);

  function openAdd() { setEditing(null); setFormOpen(true); setManageOpen(false); }
  function openEdit(p) { setEditing(p); setDetail(null); setFormOpen(true); }

  async function doDelete() {
    const p = toDelete;
    setToDelete(null);
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    if (p.image_path) await removeImage(supabase, p.image_path);
    setDetail(null);
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    setMsg({ type: "ok", text: t("prod_deleted") });
  }

  const card = (p) => (
    <li key={p.id}>
      <button onClick={() => setDetail(p)} className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left active:scale-[0.99]">
        {p.image_path ? (
          <SignedImage path={p.image_path} className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"><Package size={22} className="text-zinc-500" /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{p.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{p.benefits || p.key_ingredients || t("prod_no_info")}</p>
        </div>
        {p.contraindications && <TriangleAlert size={16} className="shrink-0 text-amber-300" />}
      </button>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("nav_products")}</h1>
          <p className="text-xs text-zinc-400">{t("prod_count").replace("{n}", products.length)}</p>
        </div>
        <button onClick={() => setManageOpen(true)} className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm"><Settings2 size={16} />{t("prod_manage")}</button>
      </div>

      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
        <Search size={20} className="shrink-0 text-zinc-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("prod_search_ph")} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-500" />
        {query && <button onClick={() => setQuery("")} aria-label={t("close")}><X size={18} className="text-zinc-400" /></button>}
      </div>

      {categories.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {[["__all", t("prod_all"), products.length], ...categories.map(([c, n]) => [c, c, n])].map(([key, label, n]) => (
            <button key={key} onClick={() => setCategory(key)} className={"shrink-0 rounded-full border px-3 py-1.5 text-xs " + (category === key ? "border-white bg-white text-black" : "border-white/10 text-zinc-300")}>{label} · {n}</button>
          ))}
        </div>
      )}

      <Notice type={msg.type === "ok" ? "ok" : "error"}>{msg.text}</Notice>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" /></div>
      ) : products.length === 0 ? (
        <GlassCard className="py-10 text-center text-sm text-zinc-400">{t("prod_empty")}</GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="py-10 text-center text-sm text-zinc-400">{t("prod_no_result")}</GlassCard>
      ) : (
        <div className="space-y-5">
          {grouped.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="mb-2 px-1 text-xs uppercase tracking-wide text-zinc-400">{cat} · {list.length}</h2>
              <ul className="space-y-2">{list.map(card)}</ul>
            </section>
          ))}
        </div>
      )}

      <button onClick={openAdd} aria-label={t("prod_add")} className="fixed bottom-28 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-xl active:scale-95"><Plus size={26} /></button>

      <ProductDetail product={detail} onClose={() => setDetail(null)} onEdit={openEdit} onDelete={(p) => setToDelete(p)} />
      <ProductForm open={formOpen} product={editing} categories={categories.map(([c]) => c).filter((c) => c !== unc)} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); setMsg({ type: "ok", text: t("prod_saved") }); load(); }} />
      <ProductManage open={manageOpen} products={products} onClose={() => setManageOpen(false)} onAdd={openAdd} onImported={() => load()} />
      <ConfirmDialog open={Boolean(toDelete)} danger message={t("prod_delete_confirm")} confirmLabel={t("delete")} onConfirm={doDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
