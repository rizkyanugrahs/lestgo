"use client";
import { useI18n } from "@/lib/i18n";
import GlassCard from "@/components/GlassCard";

export default function ConfigNotice() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard className="max-w-sm text-center">
        <h1 className="text-lg font-semibold">{t("config_title")}</h1>
        <p className="mt-2 text-sm text-zinc-400">{t("config_body")}</p>
      </GlassCard>
    </main>
  );
}
