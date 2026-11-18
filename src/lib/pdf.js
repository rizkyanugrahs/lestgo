// Membuat PDF satu halaman (ukuran A4) dari sebuah gambar JPEG, tanpa pustaka tambahan.
const enc = new TextEncoder();
const A4_W = 595.28;
const A4_H = 841.89;

function concat(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  chunks.forEach((c) => { out.set(c, off); off += c.length; });
  return out;
}

export function jpegToPdf(jpegBytes, imgW, imgH, background = [0.04, 0.04, 0.04]) {
  // gambar diskalakan agar muat di A4 dan diletakkan di tengah
  const scale = Math.min(A4_W / imgW, A4_H / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  const x = (A4_W - w) / 2;
  const y = (A4_H - h) / 2;
  const f = (n) => n.toFixed(2);

  const content =
    background.map((c) => c.toFixed(3)).join(" ") + " rg 0 0 " + f(A4_W) + " " + f(A4_H) + " re f\n" +
    "q " + f(w) + " 0 0 " + f(h) + " " + f(x) + " " + f(y) + " cm /Im0 Do Q\n";
  const contentBytes = enc.encode(content);

  const objs = [
    enc.encode("<< /Type /Catalog /Pages 2 0 R >>"),
    enc.encode("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    enc.encode("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + f(A4_W) + " " + f(A4_H) + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"),
    concat([
      enc.encode("<< /Type /XObject /Subtype /Image /Width " + imgW + " /Height " + imgH + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpegBytes.length + " >>\nstream\n"),
      jpegBytes,
      enc.encode("\nendstream"),
    ]),
    concat([enc.encode("<< /Length " + contentBytes.length + " >>\nstream\n"), contentBytes, enc.encode("endstream")]),
  ];

  const chunks = [enc.encode("%PDF-1.4\n")];
  const offsets = [];
  let pos = chunks[0].length;
  objs.forEach((body, i) => {
    offsets.push(pos);
    const head = enc.encode((i + 1) + " 0 obj\n");
    const tail = enc.encode("\nendobj\n");
    chunks.push(head, body, tail);
    pos += head.length + body.length + tail.length;
  });
  const xrefStart = pos;
  let xref = "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n";
  offsets.forEach((o) => { xref += String(o).padStart(10, "0") + " 00000 n \n"; });
  xref += "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF\n";
  chunks.push(enc.encode(xref));
  return concat(chunks);
}
