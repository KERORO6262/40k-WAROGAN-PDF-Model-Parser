const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

export const readPdfText = async (file, onProgress = () => {}) => {
  const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

  const data = await file.arrayBuffer();
  const isFileProtocol = window.location.protocol === "file:";
  const pdf = await pdfjsLib.getDocument({ data, disableWorker: isFileProtocol }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress({ pageNumber, pageCount: pdf.numPages });
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push({ pageNumber, text: itemsToText(content.items) });
  }

  return {
    pages,
    fullText: pages.map((page) => `--- PAGE ${page.pageNumber} ---\n${page.text}`).join("\n\n")
  };
};

const itemsToText = (items) => {
  const sorted = [...items].sort((a, b) => {
    const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
    return Math.abs(yDiff) > 4 ? yDiff : a.transform[4] - b.transform[4];
  });

  const rows = [];
  let current = [];
  let currentY = null;

  sorted.forEach((item) => {
    const text = item.str.trim();
    if (!text) return;
    const y = Math.round(item.transform[5]);
    if (currentY === null || Math.abs(y - currentY) <= 4) {
      current.push(text);
      currentY = currentY ?? y;
      return;
    }
    rows.push(current.join(" "));
    current = [text];
    currentY = y;
  });

  if (current.length) rows.push(current.join(" "));
  return rows.join("\n");
};
