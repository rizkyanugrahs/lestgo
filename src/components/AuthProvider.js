"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_PARTNERS, DEFAULT_PARTNER_NAME } from "@/lib/shifts";

let seeding = false;

async function seedPartners(supabase, uid) {
  if (seeding) return false;
  seeding = true;
  try {
    const rows = DEFAULT_PARTNERS.map((name, i) => ({ user_id: uid, name, is_default: name === DEFAULT_PARTNER_NAME, sort_order: i }));
    const { error } = await supabase.from("partners").upsert(rows, { onConflict: "user_id,name", ignoreDuplicates: true });
    if (error) return false;
    const { error: e2 } = await supabase.from("profiles").update({ partners_seeded: true }).eq("user_id", uid);
    return !e2;
  } catch (e) {
    return false;
  } finally {
    seeding = false;
  }
}

const AuthContext = createContext({ user: null, profile: null, loading: true, configured: true, isGuest: false, refreshProfile: async () => {}, supabase: null });

export function AuthProvider({ children }) {
  const { setLang } = useI18n();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const configured = isConfigured();

  const loadProfile = useCallback(async (uid) => {
    const supabase = getSupabase();
    if (!supabase || !uid) return;
    let { data } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
    if (!data) {
      await supabase.from("profiles").upsert({ user_id: uid }, { onConflict: "user_id" });
      const res = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      data = res.data;
    }
    if (data && data.partners_seeded === false) {
      const ok = await seedPartners(supabase, uid);
      if (ok) data = { ...data, partners_seeded: true };
    }
    if (data) {
      setProfile(data);
      if (data.language === "id" || data.language === "en") setLang(data.language);
    }
  }, [setLang]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setLoading(false); return; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = data.session ? data.session.user : null;
      setUser(u);
      if (u) loadProfile(u.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session ? session.user : null;
      setUser(u);
      if (u) loadProfile(u.id); else setProfile(null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => { if (user) await loadProfile(user.id); }, [user, loadProfile]);

  const value = {
    user, profile, loading, configured,
    isGuest: Boolean(user && user.is_anonymous),
    refreshProfile,
    supabase: getSupabase(),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
