"use client";
import { useEffect, useState } from "react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { uploadImage, removeImage } from "@/lib/storage";
import Sheet from "@/components/Sheet";
import Notice from "@/components/Notice";
import SignedImage from "@/components/SignedImage";

const empty = { id: null, name: "", category: "", key_ingredients: "", benefits: "", how_to_use: "", age_range: "", contraindications: "", image_path: null };
const DEFAULT_CATEGORIES = ["Serum", "Sunscreen", "Moisturizer", "Cleanser", "Toner", "Mask"];

export default function ProductForm({ open, product, categories, onClose, onSaved }) {
  const { supabase, user } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(product ? { ...empty, ...product, category: product.category || "" } : empty);
    setFile(null); setPreview(""); setRemovePhoto(false); setError("");
  }, [open, product]);

  function pickFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setRemovePhoto(false);
  }

  async function save() {
    if (!form.name.trim()) { setError(t("prod_name_required")); return; }
    setSaving(true); setError("");
    try {
      const oldPath = form.image_path;
      let imagePath = form.image_path;
      if (file) {
        imagePath = await uploadImage(supabase, user.id, "products", file).catch((e) => { throw new Error(t("photo_error") + " (" + (e.message || e) + ")"); });
      } else if (removePhoto) imagePath = null;
      const clean = (v) => (v && v.trim() ? v.trim() : null);
      const payload = {
        name: form.name.trim(),
        category: clean(form.category),
        key_ingredients: clean(form.key_ingredients),
        benefits: clean(form.benefits),
        how_to_use: clean(form.how_to_use),
        age_range: clean(form.age_range),
        contraindications: clean(form.contraindications),
        image_path: imagePath,
      };
      const res = form.id ? await supabase.from("products").update(payload).eq("id", form.id) : await supabase.from("products").insert(payload);
      if (res.error) throw res.error;
      if (oldPath && oldPath !== imagePath) await removeImage(supabase, oldPath);
      onSaved();
    } catch (e) {
      setError(e && e.message && e.message.startsWith(t("photo_error")) ? e.message : friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40";
  const showCurrent = form.image_path && !removePhoto && !file;
  const allCats = Array.from(new Set([...(categories || []), ...DEFAULT_CATEGORIES]));
  const field = (key, label, rows, hint) => (
    <label className="block text-xs text-zinc-400">{label}
      <textarea rows={rows} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls + " mt-1"} />
      {hint && <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span>}
    </label>
  );

  return (
    <Sheet open={open} title={form.id ? t("prod_edit") : t("prod_add")} onClose={() => !saving && onClose()}>
      <div className="space-y-4">
        <Notice>{error}</Notice>
        <label className="block text-xs text-zinc-400">{t("prod_name")}
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls + " mt-1"} />
        </label>
        <label className="block text-xs text-zinc-400">{t("prod_category")}
          <input list="liveops-cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t("prod_category_ph")} className={inputCls + " mt-1"} />
          <datalist id="liveops-cats">{allCats.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        {field("key_ingredients", t("prod_ingredients"), 2)}
        {field("benefits", t("prod_benefits"), 3)}
        {field("how_to_use", t("prod_how"), 2)}
        <label className="block text-xs text-zinc-400">{t("prod_age")}
          <input value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })} className={inputCls + " mt-1"} />
        </label>
        {field("contraindications", t("prod_contra"), 3, t("prod_contra_hint"))}
        <div>
          <p className="text-xs text-zinc-400">{t("task_photo")}</p>
          {(preview || showCurrent) && (
            <div className="relative mt-2 inline-block">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-28 w-28 rounded-xl border border-white/10 object-cover" />
              ) : (
                <SignedImage path={form.image_path} className="h-28 w-28 rounded-xl border border-white/10 object-cover" />
              )}
              <button type="button" onClick={() => { setFile(null); setPreview(""); setRemovePhoto(true); }} aria-label={t("task_photo_remove")} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"><X size={12} /></button>
            </div>
          )}
          <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm text-zinc-300">
            <ImageIcon size={16} />{preview || showCurrent ? t("task_photo_change") : t("task_photo_add")}
            <input type="file" accept="image/*" onChange={pickFile} className="hidden" />
          </label>
        </div>
        <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-black disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />}{saving ? t("uploading") : t("save")}
        </button>
      </div>
    </Sheet>
  );
}
