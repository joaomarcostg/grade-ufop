/**
 * Text lines of a PDF, read in the browser with pdf.js: the file never leaves
 * the student's computer.
 */

interface TextItemLike {
  str: string;
  transform: number[];
}

export async function pdfLines(data: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(data) });
  const pdf = await task.promise;
  try {
    const lines: string[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      lines.push(...linesFromItems(content.items.filter((i): i is TextItemLike & typeof i => "str" in i)));
    }
    return lines;
  } finally {
    await task.destroy();
  }
}

/** Groups text items into lines by their baseline, left to right, top to bottom. */
export function linesFromItems(items: TextItemLike[]): string[] {
  const rows: { y: number; parts: { x: number; text: string }[] }[] = [];
  for (const item of items) {
    const text = item.str.trim();
    if (!text) continue;
    const [, , , , x, y] = item.transform;
    const row = rows.find((r) => Math.abs(r.y - y) <= 2);
    if (row) row.parts.push({ x, text });
    else rows.push({ y, parts: [{ x, text }] });
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((r) =>
      r.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" "),
    );
}
