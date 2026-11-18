"use client";
import { useI18n } from "@/lib/i18n";
import TodoSection from "@/components/TodoSection";
import ShiftSection from "@/components/ShiftSection";

export default function TasksPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("nav_tasks")}</h1>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t("tasks_section_shift")}</h2>
        <ShiftSection />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t("tasks_section_todo")}</h2>
        <TodoSection />
      </section>
    </div>
  );
}
