"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import ConfigNotice from "@/components/ConfigNotice";

export default function AppLayout({ children }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (configured && !loading && !user) router.replace("/login");
  }, [configured, loading, user, router]);

  if (!configured) return <ConfigNotice />;
  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" />
      </main>
    );
  }
  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 pb-32 pt-6 md:max-w-2xl">
      {children}
      <BottomNav />
    </div>
  );
}
