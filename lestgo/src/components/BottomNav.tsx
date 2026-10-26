"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ListChecks, Map, Images, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/lists", label: "Lists", Icon: ListChecks },
  { href: "/maps", label: "Maps", Icon: Map },
  { href: "/memories", label: "Memories", Icon: Images },
  { href: "/profile", label: "Profile", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-3xl border border-white/60 bg-white/80 p-1.5 shadow-xl shadow-violet-200/50 backdrop-blur-xl">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="relative flex flex-col items-center gap-0.5 rounded-2xl py-2">
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-2xl bg-violet-100"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <Icon className={`relative h-5 w-5 ${active ? "text-violet-600" : "text-zinc-400"}`} />
                <span className={`relative text-[10px] font-medium ${active ? "text-violet-600" : "text-zinc-400"}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
