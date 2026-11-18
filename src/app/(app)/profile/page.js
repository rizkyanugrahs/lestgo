"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, ChevronRight, CalendarDays, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { tenureParts, remainingParts, formatParts, formatDays } from "@/lib/dates";
import { APP_VERSION } from "@/lib/version";
import { deductsBalance } from "@/lib/shifts";
import GlassCard from "@/components/GlassCard";
import SignedImage from "@/components/SignedImage";
import GallerySection from "@/components/GallerySection";

export default function ProfilePage() {
  const { supabase, profile, isGuest } = useAuth();
  const { t, lang } = useI18n();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("leave_entries").select("kind,days,leave_type").then(({ data, error }) => {
      if (error || !data) return;
      setBalance(data.reduce((sum, r) => sum + (r.kind === "topup" ? Number(r.days || 0) : deductsBalance(r) ? -Number(r.days || 0) : 0), 0));
    });
  }, [supabase]);

  const labels = { years: t("tenure_years"), months: t("tenure_months"), days: t("tenure_days") };
  const tenure = tenureParts(profile && profile.join_date);
  const contract = remainingParts(profile && profile.contract_end);
  const name = profile && profile.full_name ? profile.full_name : isGuest ? "Guest" : "LiveOps";

  let contractText = t("set_in_settings");
  if (contract) {
    if (contract.expired) contractText = t("contract_expired");
    else if (contract.today) contractText = t("contract_today");
    else contractText = formatParts(contract, labels);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t("profile_title")}</h1>

      <GlassCard className="flex items-center gap-4">
        <Link href="/profile/settings" aria-label={t("avatar_change")} className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
          {profile && profile.avatar_path ? <SignedImage path={profile.avatar_path} className="h-full w-full object-cover" /> : <UserRound size={28} className="text-zinc-400" />}
        </Link>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{name}</p>
          <p className="text-sm text-zinc-400">{t("profile_empid")}: {profile && profile.employee_id ? profile.employee_id : "-"}</p>
        </div>
      </GlassCard>

      <Link href="/profile/leave" className="glass flex items-center justify-between rounded-2xl p-4">
        <span className="flex items-center gap-3">
          <CalendarDays size={20} className="text-zinc-300" />
          <span>
            <span className="block text-sm font-medium">{t("leave_title")}</span>
            <span className="block text-xs text-zinc-400">{t("leave_card_hint")}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className={"text-lg font-semibold " + (balance !== null && balance < 0 ? "text-red-300" : "")}>{balance === null ? "-" : formatDays(balance, lang) + " " + t("leave_unit")}</span>
          <ChevronRight size={18} className="text-zinc-500" />
        </span>
      </Link>

      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">{t("profile_tenure")}</p>
          <p className={"text-right text-sm font-semibold " + (tenure ? "" : "font-normal text-zinc-500")}>{tenure ? formatParts(tenure, labels) : t("set_in_settings")}</p>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">{t("contract_label")}</p>
          <p className={"text-right text-sm font-semibold " + (!contract ? "font-normal text-zinc-500" : contract.expired ? "text-red-300" : "")}>{contractText}</p>
        </div>
      </GlassCard>

      <GallerySection />

      <Link href="/profile/settings" className="glass flex items-center justify-between rounded-2xl p-4">
        <span className="flex items-center gap-3 text-sm font-medium"><Settings size={20} className="text-zinc-300" />{t("settings")}</span>
        <ChevronRight size={18} className="text-zinc-500" />
      </Link>

      <p className="pt-2 text-center text-xs text-zinc-500">LiveOps {APP_VERSION}</p>
    </div>
  );
}
