"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Check, Pencil, Trash2, Image as ImageIcon, Loader2, Clock, X, Undo2, Download } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { uploadImage, removeImage } from "@/lib/storage";
import { taskDue, dueStatus, formatDue, sortKeyDue, todayStr, formatDay } from "@/lib/dates";
import { drawTodoImage } from "@/lib/todoImage";
import GlassCard from "@/components/GlassCard";
import Notice from "@/components/Notice";
import Sheet from "@/components/Sheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import SignedImage from "@/components/SignedImage";

const emptyForm = { id: null, title: "", notes: "", priority: "normal", date: "", time: "", image_path: null };

function sortTasks(list) {
  return [...list].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
    const ka = sortKeyDue(a);
    const kb = sortKeyDue(b);
    if (ka !== kb) return ka < kb ? -1 : 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

export default function TodoSection() {
  const { supabase, user, profile } = useAuth();
  const { t, lang } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [lightbox, setLightbox] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (error) setMsg({ type: "error", text: friendlyError(error) });
    else setTasks(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(emptyForm); setFile(null); setPreview(""); setRemovePhoto(false); setFormError(""); setOpen(true);
  }
  function openEdit(task) {
    const due = taskDue(task);
    setForm({ id: task.id, title: task.title, notes: task.notes || "", priority: task.priority, date: due ? due.date : "", time: due && due.time ? due.time : "", image_path: task.image_path || null });
    setFile(null); setPreview(""); setRemovePhoto(false); setFormError(""); setOpen(true);
  }
  function pickFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRemovePhoto(false);
  }

  async function save() {
    if (!form.title.trim()) { setFormError(t("task_title_required")); return; }
    setSaving(true);
    setFormError("");
    try {
      let imagePath = form.image_path;
      const oldPath = form.image_path;
      if (file) imagePath = await uploadImage(supabase, user.id, "tasks", file).catch((e) => { throw new Error(t("photo_error") + " (" + (e.message || e) + ")"); });
      else if (removePhoto) imagePath = null;
      const payload = {
        title: form.title.trim(),
        notes: form.notes.trim() || null,
        priority: form.priority,
        // tanggal saja, atau tanggal + jam. Jam tanpa tanggal tidak dipakai.
        deadline_date: form.date || null,
        deadline_time: form.date && form.time ? form.time : null,
        deadline: null,
        image_path: imagePath,
      };
      let res;
      if (form.id) res = await supabase.from("tasks").update(payload).eq("id", form.id);
      else res = await supabase.from("tasks").insert(payload);
      if (res.error) throw res.error;
      if (oldPath && oldPath !== imagePath) await removeImage(supabase, oldPath);
      setOpen(false);
      setMsg({ type: "ok", text: t("task_saved") });
      await load();
    } catch (e) {
      setFormError(e && e.message && e.message.startsWith(t("photo_error")) ? e.message : friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(task) {
    const { error } = await supabase.from("tasks").update({ is_done: !task.is_done }).eq("id", task.id);
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, is_done: !x.is_done } : x)));
  }

  async function doDelete() {
    const task = toDelete;
    setToDelete(null);
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    if (task.image_path) await removeImage(supabase, task.image_path);
    setTasks((prev) => prev.filter((x) => x.id !== task.id));
    setMsg({ type: "ok", text: t("task_deleted") });
  }

  async function clearDone() {
    setConfirmClear(false);
    const done = tasks.filter((x) => x.is_done);
    if (!done.length) return;
    const { error } = await supabase.from("tasks").delete().eq("is_done", true);
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    const paths = done.map((x) => x.image_path).filter(Boolean);
    if (paths.length) await supabase.storage.from("liveops-files").remove(paths);
    setTasks((prev) => prev.filter((x) => !x.is_done));
    setMsg({ type: "ok", text: t("task_done_deleted") });
  }

  const shown = sortTasks(tasks).filter((x) => (filter === "all" ? true : filter === "done" ? x.is_done : !x.is_done));

  function downloadPng() {
    setMsg({ type: "", text: "" });
    if (!shown.length) { setMsg({ type: "error", text: t("todo_nothing_to_download") }); return; }
    try {
      const filterLabel = filter === "active" ? t("filter_active") : filter === "done" ? t("filter_done") : t("filter_all");
      const items = shown.map((x) => {
        const due = taskDue(x);
        return {
          title: x.title,
          notes: x.notes || "",
          done: x.is_done,
          urgent: x.priority === "urgent",
          priorityLabel: x.priority === "urgent" ? t("todo_urgent") : t("todo_normal"),
          dueText: due ? formatDue(due, lang) : "",
          dueState: x.is_done ? null : dueStatus(due),
        };
      });
      const canvas = drawTodoImage((w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }, {
        title: t("todo_image_title"),
        subtitle: filterLabel + " · " + formatDay(todayStr(), lang, { day: "numeric", month: "short", year: "numeric" }) + " · " + shown.length,
        name: profile && profile.full_name ? profile.full_name : "",
        items,
        footer: t("shift_image_footer"),
        emptyText: t("todo_nothing_to_download"),
      });
      canvas.toBlob((blob) => {
        if (!blob) { setMsg({ type: "error", text: t("shift_image_failed") }); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "liveops-todo-" + todayStr() + ".png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch (e) {
      setMsg({ type: "error", text: t("shift_image_failed") + " (" + (e.message || e) + ")" });
    }
  }

  const emptyText = filter === "active" ? t("task_empty_active") : filter === "done" ? t("task_empty_done") : t("task_empty_all");
  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40";
  const showCurrentPhoto = form.image_path && !removePhoto && !file;

  return (
    <div className="space-y-4">
      <Notice type={msg.type === "ok" ? "ok" : "error"}>{msg.text}</Notice>

      <div className="flex gap-2">
        <button onClick={openAdd} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black"><Plus size={16} />{t("task_add")}</button>
        <button onClick={downloadPng} disabled={loading} className="flex items-center gap-1 rounded-xl border border-white/10 px-3 text-xs text-zinc-200 disabled:opacity-40"><Download size={14} />{t("todo_download")}</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[["active", "filter_active"], ["done", "filter_done"], ["all", "filter_all"]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={"rounded-xl border py-2 text-xs " + (filter === k ? "border-white bg-white text-black" : "border-white/10 text-zinc-300")}>{t(label)}</button>
        ))}
      </div>

      {filter === "done" && shown.length > 0 && (
        <button onClick={() => setConfirmClear(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/30 py-2 text-xs text-red-300"><Trash2 size={14} />{t("task_delete_done")}</button>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" /></div>
      ) : shown.length === 0 ? (
        <GlassCard className="py-10 text-center text-sm text-zinc-400">{emptyText}</GlassCard>
      ) : (
        <ul className="space-y-3">
          {shown.map((task) => {
            const due = taskDue(task);
            const status = task.is_done ? null : dueStatus(due);
            return (
              <li key={task.id} className="glass rounded-2xl p-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(task)} aria-label={task.is_done ? t("task_restore") : "Centang"} className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border " + (task.is_done ? "border-emerald-400 bg-emerald-400/20 text-emerald-300" : "border-white/30")}>
                    {task.is_done && <Check size={14} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={"text-sm font-medium " + (task.is_done ? "text-zinc-500 line-through" : "")}>{task.title}</p>
                    {task.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">{task.notes}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] " + (task.priority === "urgent" ? "bg-red-400/15 text-red-300" : "bg-white/10 text-zinc-300")}>{task.priority === "urgent" ? t("todo_urgent") : t("todo_normal")}</span>
                      {due && (
                        <span className={"flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] " + (status === "overdue" ? "bg-red-400/15 text-red-300" : status === "today" ? "bg-amber-300/15 text-amber-200" : "bg-white/10 text-zinc-300")}>
                          <Clock size={10} />{status === "overdue" ? t("overdue") + " · " : status === "today" ? t("due_today") + " · " : ""}{formatDue(due, lang)}
                        </span>
                      )}
                    </div>
                    {task.image_path && (
                      <SignedImage path={task.image_path} alt="" className="mt-3 h-24 w-24 cursor-pointer rounded-xl border border-white/10 object-cover" onClick={() => setLightbox(task.image_path)} />
                    )}
                    {task.is_done && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => toggle(task)} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200"><Undo2 size={13} />{t("task_restore")}</button>
                        <button onClick={() => setToDelete(task)} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-red-300"><Trash2 size={13} />{t("delete")}</button>
                      </div>
                    )}
                  </div>
                  {!task.is_done && (
                    <div className="flex shrink-0 flex-col gap-1">
                      <button onClick={() => openEdit(task)} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-300"><Pencil size={14} /></button>
                      <button onClick={() => setToDelete(task)} aria-label="Hapus" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-red-300"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={open} title={form.id ? t("task_edit") : t("task_add")} onClose={() => !saving && setOpen(false)}>
        <div className="space-y-4">
          <Notice>{formError}</Notice>
          <label className="block text-xs text-zinc-400">{t("task_title_label")}
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("task_title_ph")} className={inputCls + " mt-1"} />
          </label>
          <div>
            <p className="text-xs text-zinc-400">{t("task_priority")}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {[["normal", t("todo_normal")], ["urgent", t("todo_urgent")]].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setForm({ ...form, priority: k })} className={"rounded-xl border py-2.5 text-sm " + (form.priority === k ? (k === "urgent" ? "border-red-300 bg-red-400/20 text-red-200" : "border-white bg-white text-black") : "border-white/10 text-zinc-300")}>{label}</button>
              ))}
            </div>
          </div>
          <label className="block text-xs text-zinc-400">{t("task_notes")}
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("task_notes_ph")} className={inputCls + " mt-1"} />
          </label>
          <div>
            <p className="text-xs text-zinc-400">{t("task_deadline")}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <label className="text-[11px] text-zinc-500">{t("task_date")}
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls + " mt-1"} />
              </label>
              <label className="text-[11px] text-zinc-500">{t("task_time")}
                <input type="time" value={form.time} disabled={!form.date} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls + " mt-1 disabled:opacity-40"} />
              </label>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[11px] text-zinc-500">{t("task_deadline_hint")} {t("task_time_hint")}</p>
              {(form.date || form.time) && <button type="button" onClick={() => setForm({ ...form, date: "", time: "" })} className="shrink-0 text-[11px] text-zinc-300 underline">{t("task_deadline_clear")}</button>}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("task_photo")}</p>
            {(preview || showCurrentPhoto) && (
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
              <ImageIcon size={16} />{preview || showCurrentPhoto ? t("task_photo_change") : t("task_photo_add")}
              <input type="file" accept="image/*" onChange={pickFile} className="hidden" />
            </label>
          </div>
          <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-black disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />}{saving ? t("uploading") : t("save")}
          </button>
        </div>
      </Sheet>

      <ConfirmDialog open={Boolean(toDelete)} danger message={t("task_delete_confirm")} confirmLabel={t("delete")} onConfirm={doDelete} onCancel={() => setToDelete(null)} />
      <ConfirmDialog open={confirmClear} danger message={t("task_delete_done_confirm")} confirmLabel={t("delete")} onConfirm={clearDone} onCancel={() => setConfirmClear(false)} />

      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox("")}>
          <SignedImage path={lightbox} className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
