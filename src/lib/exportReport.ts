import { jsPDF } from "jspdf";

export function downloadMarkdown(markdown: string, filename = "ecolens-report.md") {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPdf(markdown: string, filename = "ecolens-report.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const lines = markdown
    .replace(/^# /gm, "")
    .replace(/^## /gm, "\n")
    .replace(/^- /gm, "- ")
    .split("\n");

  let y = 48;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line || " ", 500);
    for (const textLine of wrapped) {
      if (y > 730) {
        doc.addPage();
        y = 48;
      }
      doc.text(textLine, 48, y);
      y += 16;
    }
  }

  doc.save(filename);
}
