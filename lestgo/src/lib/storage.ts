import { supabase } from "./supabase";

/** Kecilkan foto (maks 1350px) supaya upload cepat dan hemat kuota. */
async function compress(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1350 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadPhoto(file: File, roomId: string): Promise<string> {
  const blob = await compress(file);
  const path = `${roomId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw new Error("Upload foto gagal: " + error.message);
  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}
