export const BUCKET = "liveops-files";

// Mengecilkan foto supaya hemat kuota dan cepat dimuat
export function compressImage(file, maxSize = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxSize / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error("Gagal memproses foto"));
      }, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("File bukan foto yang valid")); };
    img.src = url;
  });
}

export async function uploadImage(supabase, userId, folder, file) {
  const blob = await compressImage(file);
  const path = userId + "/" + folder + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}

export async function removeImage(supabase, path) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

// Mengunggah foto yang sudah jadi (misalnya hasil edit) tanpa diproses ulang
export async function uploadBlob(supabase, userId, folder, blob) {
  const path = userId + "/" + folder + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}
