"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

// Memuat daftar partner live milik pengguna
export function usePartners() {
  const { supabase, user, profile } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error: e } = await supabase.from("partners").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (e) setError(e);
    else { setPartners(data || []); setError(null); }
    setLoading(false);
  }, [supabase, user]);

  // dimuat ulang juga saat daftar awal selesai diisi (partners_seeded berubah)
  useEffect(() => { reload(); }, [reload, profile && profile.partners_seeded]);

  const defaultPartner = partners.find((p) => p.is_default) || null;
  return { partners, loading, error, reload, defaultPartner };
}
