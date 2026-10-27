"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ListChecks, Images, User, Plus } from "lucide-react";

const left = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/lists", label: "Lists", Icon: ListChecks },
];
const right = [
  { href: "/memories", label: "Memories", Icon: Images },
  { href: "/profile", label: "Profile", Icon: User },
];

export default function BottomNav({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();

  const tab = ({ href, label, Icon }: (typeof left)[number]) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <li key={href} className="flex-1">
        <Link href={href} className="relative flex flex-col items-center gap-0.5 rounded-full py-2">
          {active && (
            <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-wine-700/10"
              transition={{ type: "spring", stiffness: 400, damping: 32 }} />
          )}
          <Icon className={`relative h-5 w-5 ${active ? "text-wine-700" : "text-zinc-400"}`} />
          <span className={`relative text-[10px] font-medium ${active ? "text-wine-700" : "text-zinc-400"}`}>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border border-white/40 bg-white/60 p-1.5 shadow-xl shadow-wine-900/10 backdrop-blur-xl">
        {left.map(tab)}
        <li className="flex flex-1 justify-center">
          <button onClick={onAdd} aria-label="Tambah tempat yang dikunjungi"
            className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-brand text-white shadow-lg shadow-wine-700/40 ring-4 ring-white/60 transition active:scale-90">
            <Plus className="h-7 w-7" />
          </button>
        </li>
        {right.map(tab)}
      </ul>
    </nav>
  );
}
