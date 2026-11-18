"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Package, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { href: "/", key: "nav_home", Icon: Home },
  { href: "/tasks", key: "nav_tasks", Icon: ListChecks },
  { href: "/products", key: "nav_products", Icon: Package },
  { href: "/profile", key: "nav_profile", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="glass flex items-center justify-between rounded-full px-3 py-2">
        {items.map(({ href, key, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={"flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] transition " + (active ? "bg-white text-black" : "text-zinc-400")}>
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
