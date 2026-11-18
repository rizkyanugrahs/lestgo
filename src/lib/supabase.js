import { createClient } from "@supabase/supabase-js";

// Merapikan alamat Supabase yang salah tempel (spasi, tanpa https, ada /rest/v1, garis miring di akhir)
export function cleanSupabaseUrl(raw) {
  let url = (raw || "").trim().replace(/^["']|["']$/g, "");
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  url = url.replace(/\/rest\/v1\/?.*$/i, "").replace(/\/+$/, "");
  return url;
}

export function cleanKey(raw) {
  return (raw || "").trim().replace(/^["']|["']$/g, "");
}

let client = null;

export function isConfigured() {
  return Boolean(cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) && cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

export function getSupabase() {
  if (client) return client;
  if (!isConfigured()) return null;
  client = createClient(
    cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
  return client;
}

// Mengubah PIN 6 digit menjadi email dan kata sandi yang valid untuk Supabase
export function pinToCredentials(pin) {
  return { email: "owner@liveops.app", password: "liveops-pin-" + pin };
}

export function friendlyError(error) {
  if (!error) return "";
  const msg = error.message || String(error);
  let friendly = "Terjadi kendala. Coba lagi sebentar ya.";
  if (/invalid login credentials/i.test(msg)) friendly = "PIN tidak cocok, atau PIN belum dibuat. Coba lagi atau pilih 'Buat PIN baru'.";
  else if (/already registered|already been registered/i.test(msg)) friendly = "PIN sudah pernah dibuat. Silakan pilih 'Masuk' lalu ketik PIN kamu.";
  else if (/anonymous/i.test(msg)) friendly = "Mode Guest belum diaktifkan di Supabase. Aktifkan 'Allow anonymous sign-ins' di pengaturan Authentication.";
  else if (/email.*confirm|confirm.*email/i.test(msg)) friendly = "Supabase masih meminta konfirmasi email. Matikan 'Confirm email' di pengaturan Authentication.";
  else if (/relation .* does not exist|schema cache|could not find/i.test(msg)) friendly = "Database belum lengkap. Jalankan file SQL setup terbaru di Supabase.";
  else if (/duplicate key|unique constraint/i.test(msg)) friendly = "Data untuk tanggal itu sudah ada. Edit data yang lama saja ya.";
  else if (/bucket not found/i.test(msg)) friendly = "Tempat penyimpanan foto belum dibuat. Jalankan file SQL setup terbaru di Supabase.";
  else if (/failed to fetch|network/i.test(msg)) friendly = "Tidak bisa terhubung. Periksa internet atau alamat Supabase di Vercel.";
  return friendly + " (Detail: " + msg + ")";
}
