"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Trash2, UserRound, Camera, Loader2, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError, pinToCredentials } from "@/lib/supabase";
import { APP_VERSION, DEVELOPER } from "@/lib/version";
import { BUCKET, uploadBlob, removeImage } from "@/lib/storage";
import PhotoEditor from "@/components/PhotoEditor";
import SignedImage from "@/components/SignedImage";
import GlassCard from "@/components/GlassCard";
import Notice from "@/components/Notice";
import ConfirmDialog from "@/components/ConfirmDialog";

const DATA_TABLES = ["tasks", "shifts", "products", "gmv_entries", "gmv_targets", "gallery_photos", "leave_entries", "partners"];

export default function SettingsPage() {
  const { supabase, user, profile, isGuest, refreshProfile } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [payday, setPayday] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [confirm, setConfirm] = useState("");
  const [linkPin, setLinkPin] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmployeeId(profile.employee_id || "");
      setJoinDate(profile.join_date || "");
      setContractEnd(profile.contract_end || "");
      setPayday(profile.payday ? String(profile.payday) : "");
    }
  }, [profile]);

  async function saveProfile() {
    setMsg({ type: "", text: "" });
    const paydayNum = payday.trim() === "" ? null : Number(payday);
    if (paydayNum !== null && (!Number.isInteger(paydayNum) || paydayNum < 1 || paydayNum > 31)) {
      setMsg({ type: "error", text: t("payday_invalid") });
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: fullName.trim() || null,
      employee_id: employeeId.trim() || null,
      join_date: joinDate || null,
      contract_end: contractEnd || null,
      payday: paydayNum,
      language: lang,
    }, { onConflict: "user_id" });
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    await refreshProfile();
    setMsg({ type: "ok", text: t("saved") });
  }

  function pickAvatar(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (f) { setMsg({ type: "", text: "" }); setAvatarFile(f); }
  }

  async function saveAvatar(blob) {
    setAvatarFile(null);
    setAvatarBusy(true);
    try {
      const path = await uploadBlob(supabase, user.id, "avatar", blob);
      const { error } = await supabase.from("profiles").upsert({ user_id: user.id, avatar_path: path }, { onConflict: "user_id" });
      if (error) { await removeImage(supabase, path); throw error; }
      if (profile && profile.avatar_path) await removeImage(supabase, profile.avatar_path);
      await refreshProfile();
      setMsg({ type: "ok", text: t("avatar_saved") });
    } catch (err) {
      setMsg({ type: "error", text: t("photo_error") + " " + friendlyError(err) });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    if (!profile || !profile.avatar_path) return;
    setAvatarBusy(true);
    const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("user_id", user.id);
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); setAvatarBusy(false); return; }
    await removeImage(supabase, profile.avatar_path);
    await refreshProfile();
    setAvatarBusy(false);
    setMsg({ type: "ok", text: t("avatar_saved") });
  }

  async function changeLang(l) {
    setLang(l);
    if (user) await supabase.from("profiles").upsert({ user_id: user.id, language: l }, { onConflict: "user_id" });
  }

  async function linkAccount() {
    setMsg({ type: "", text: "" });
    if (!/^\d{6}$/.test(linkPin)) { setMsg({ type: "error", text: t("login_pin_short") }); return; }
    const creds = pinToCredentials(linkPin);
    const { error } = await supabase.auth.updateUser({ email: creds.email, password: creds.password });
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    setLinkPin("");
    setMsg({ type: "ok", text: t("pin_linked") });
  }

  async function logout() {
    setConfirm("");
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function deleteAll() {
    setConfirm("");
    setMsg({ type: "", text: "" });
    for (const folder of ["tasks", "products", "gallery", "avatar"]) {
      const { data: files } = await supabase.storage.from(BUCKET).list(user.id + "/" + folder, { limit: 1000 });
      if (files && files.length) await supabase.storage.from(BUCKET).remove(files.map((f) => user.id + "/" + folder + "/" + f.name));
    }
    for (const table of DATA_TABLES) {
      const { error } = await supabase.from(table).delete().eq("user_id", user.id);
      if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    }
    await supabase.from("profiles").update({ avatar_path: null, partners_seeded: false }).eq("user_id", user.id);
    await refreshProfile();
    setMsg({ type: "ok", text: t("delete_all_done") });
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label={t("back")} className="glass flex h-9 w-9 items-center justify-center rounded-full"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings_title")}</h1>
      </div>

      <Notice type={msg.type === "ok" ? "ok" : "error"}>{msg.text}</Notice>

      <GlassCard className="space-y-3">
        <p className="text-sm font-medium">{t("personal_data")}</p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
            {avatarBusy ? <Loader2 className="animate-spin text-zinc-400" /> : profile && profile.avatar_path ? <SignedImage path={profile.avatar_path} className="h-full w-full object-cover" /> : <UserRound size={28} className="text-zinc-400" />}
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200"><Camera size={14} />{t("avatar_change")}<input type="file" accept="image/*" onChange={pickAvatar} className="hidden" /></label>
            {profile && profile.avatar_path && <button onClick={removeAvatar} className="text-left text-xs text-red-300">{t("avatar_remove")}</button>}
          </div>
        </div>
        <label className="block text-xs text-zinc-400">{t("profile_name")}
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls + " mt-1"} />
        </label>
        <label className="block text-xs text-zinc-400">{t("profile_empid")}
          <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputCls + " mt-1"} />
        </label>
        <label className="block text-xs text-zinc-400">{t("profile_join")}
          <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className={inputCls + " mt-1"} />
        </label>
        <label className="block text-xs text-zinc-400">{t("contract_setting")}
          <input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className={inputCls + " mt-1"} />
        </label>
        <label className="block text-xs text-zinc-400">{t("payday_setting")}
          <input type="number" inputMode="numeric" min={1} max={31} value={payday} onChange={(e) => setPayday(e.target.value)} className={inputCls + " mt-1"} />
          <span className="mt-1 block text-[11px] text-zinc-500">{t("payday_hint")}</span>
        </label>
        <button onClick={saveProfile} className="w-full rounded-xl bg-white py-2.5 text-sm font-medium text-black">{t("save")}</button>
      </GlassCard>

      <GlassCard>
        <p className="text-sm font-medium">{t("language")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[["en", t("lang_en")], ["id", t("lang_id")]].map(([code, label]) => (
            <button key={code} onClick={() => changeLang(code)} className={"rounded-xl border py-2.5 text-sm " + (lang === code ? "border-white bg-white text-black" : "border-white/10 text-zinc-300")}>{label}</button>
          ))}
        </div>
      </GlassCard>

      {isGuest && (
        <GlassCard className="space-y-2">
          <p className="text-sm font-medium">{t("guest_banner")}</p>
          <p className="text-xs text-zinc-400">{t("guest_link_hint")}</p>
          <input inputMode="numeric" maxLength={6} value={linkPin} onChange={(e) => setLinkPin(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className={inputCls + " tracking-[0.5em]"} />
          <button onClick={linkAccount} className="w-full rounded-xl bg-white py-2.5 text-sm font-medium text-black">{t("guest_link")}</button>
        </GlassCard>
      )}

      <Link href="/profile/partners" className="glass flex items-center justify-between rounded-2xl p-4">
        <span className="flex items-center gap-3 text-sm font-medium"><Users size={18} className="text-zinc-300" />{t("partners_title")}</span>
        <ChevronRight size={18} className="text-zinc-500" />
      </Link>

      <GlassCard className="space-y-3">
        <button onClick={() => setConfirm("logout")} className="flex w-full items-center gap-3 text-sm"><LogOut size={18} className="text-zinc-300" />{t("logout")}</button>
        <div className="h-px bg-white/10" />
        <div>
          <button onClick={() => setConfirm("delete")} className="flex w-full items-center gap-3 text-sm text-red-300"><Trash2 size={18} />{t("delete_all")}</button>
          <p className="mt-1 pl-[30px] text-xs text-zinc-500">{t("delete_all_hint")}</p>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-sm font-medium">{t("about")}</p>
        <div className="mt-2 space-y-1 text-sm text-zinc-400">
          <p>LiveOps</p>
          <p>{t("version")}: <span className="text-white">{APP_VERSION}</span></p>
          <p>{t("developed_by")} {DEVELOPER}</p>
        </div>
      </GlassCard>

      {avatarFile && <PhotoEditor file={avatarFile} circle maxSide={640} onConfirm={saveAvatar} onCancel={() => setAvatarFile(null)} />}
      <ConfirmDialog open={confirm === "logout"} message={t("logout_confirm")} confirmLabel={t("logout")} onConfirm={logout} onCancel={() => setConfirm("")} />
      <ConfirmDialog open={confirm === "delete"} danger message={t("delete_all_confirm")} confirmLabel={t("delete")} onConfirm={deleteAll} onCancel={() => setConfirm("")} />
    </div>
  );
}
