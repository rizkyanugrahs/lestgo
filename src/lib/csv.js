export const PRODUCT_FIELDS = ["name", "category", "key_ingredients", "benefits", "how_to_use", "age_range", "contraindications"];
export const PRODUCT_HEADERS = ["Nama produk", "Kategori", "Kandungan utama", "Klaim manfaat", "Cara pakai", "Rentang usia", "Kontraindikasi"];

// Membaca CSV (mendukung pemisah koma atau titik koma, tanda kutip, dan baris baru di dalam kutip)
export function parseCSV(text) {
  let src = String(text || "").replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/)[0] || "";
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ""));
}

function escapeCell(v, delim) {
  const s = v == null ? "" : String(v);
  return s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(delim) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCSV(rows, delim = ";") {
  return "\uFEFF" + rows.map((r) => r.map((c) => escapeCell(c, delim)).join(delim)).join("\r\n");
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Mengubah baris CSV menjadi daftar produk. Baris pertama dianggap judul kolom.
export function rowsToProducts(rows) {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const alias = {
    name: ["nama produk", "nama", "name", "product", "product name"],
    category: ["kategori", "category"],
    key_ingredients: ["kandungan utama", "kandungan", "key ingredients", "ingredients"],
    benefits: ["klaim manfaat", "manfaat", "benefits", "benefit"],
    how_to_use: ["cara pakai", "how to use"],
    age_range: ["rentang usia", "usia", "age range", "age"],
    contraindications: ["kontraindikasi", "contraindications", "contraindication"],
  };
  const idx = {};
  PRODUCT_FIELDS.forEach((f, i) => {
    let found = header.findIndex((h) => alias[f].includes(h));
    if (found < 0 && header.length === PRODUCT_FIELDS.length) found = i;
    idx[f] = found;
  });
  return rows.slice(1).map((r) => {
    const obj = {};
    PRODUCT_FIELDS.forEach((f) => { obj[f] = idx[f] >= 0 ? String(r[idx[f]] || "").trim() : ""; });
    return obj;
  });
}
