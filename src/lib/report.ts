import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { PropertyReport } from "./types";
import { fmtKpi, fmtPeriod, SEVERITY_LABEL } from "./format";
import { autoSummary } from "./ai";
import { fmtDay, money, sum } from "./values";

const BG: [number, number, number] = [6, 29, 22];
const INK: [number, number, number] = [9, 36, 25];
const MUTED: [number, number, number] = [90, 110, 100];
const GREEN: [number, number, number] = [4, 147, 78];
const RED: [number, number, number] = [200, 50, 70];

async function logoDataUrl(): Promise<{ url: string; w: number; h: number } | null> {
  try {
    const blob = await (await fetch("/parkgrid-logo.png")).blob();
    const url = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
    const img = await createImageBitmap(blob);
    return { url, w: img.width, h: img.height };
  } catch {
    return null;
  }
}

export async function buildReport(report: PropertyReport, summaryText?: string): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = 0;

  // Header band
  doc.setFillColor(...BG);
  doc.rect(0, 0, W, 86, "F");
  const logo = await logoDataUrl();
  if (logo) doc.addImage(logo.url, "PNG", M, 26, 34 * (logo.w / logo.h), 34);
  doc.setTextColor(167, 237, 197);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Operations report", W - M, 38, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, W - M, 54, { align: "right" });

  y = 120;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(report.property, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  y += 16;
  doc.text(fmtPeriod(report.period) || `As of ${fmtDay(report.asOf)}`, M, y);
  y += 12;
  doc.text(`Source files: ${report.sources.join(", ")}`, M, y, { maxWidth: W - 2 * M });
  y += 24;

  // Summary
  doc.setFillColor(236, 250, 242);
  const lines = (summaryText || autoSummary(report)).split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).slice(0, 3);
  const wrapped = lines.map((l, i) => doc.splitTextToSize(`${i + 1}.  ${l}`, W - 2 * M - 28) as string[]);
  const boxH = 30 + sum(wrapped.map((w) => w.length * 13 + 4));
  doc.roundedRect(M, y, W - 2 * M, boxH, 4, 4, "F");
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("3 things to look at this week", M + 14, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  let ly = y + 38;
  for (const w of wrapped) {
    doc.text(w, M + 14, ly);
    ly += w.length * 13 + 4;
  }
  y += boxH + 22;

  // KPIs
  autoTable(doc, {
    startY: y,
    head: [["Key numbers", ""]],
    body: report.kpis.map((k) => [k.label + (k.sub ? ` (${k.sub})` : ""), fmtKpi(k)]),
    theme: "plain",
    margin: { left: M, right: M },
    styles: { fontSize: 9.5, cellPadding: 5, textColor: INK },
    headStyles: { fontStyle: "bold", fontSize: 11, textColor: INK },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    didParseCell: (d) => { if (d.section === "body" && d.row.index % 2 === 0) d.cell.styles.fillColor = [245, 248, 246]; },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  // Daily revenue chart
  const pts = report.daily.filter((d) => d.revenue !== undefined);
  if (pts.length >= 3) {
    if (y > 560) { doc.addPage(); y = 50; }
    const flagged = new Set(report.findings.flatMap((f) => (f.severity !== "low" ? f.dates ?? [] : [])));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Daily revenue", M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Red bars are days flagged by the audit", W - M, y, { align: "right" });
    y += 12;
    const h = 110, cw = W - 2 * M - 40, x0 = M + 40;
    const max = Math.max(...pts.map((p) => p.revenue!));
    const bw = cw / pts.length;
    doc.setDrawColor(225, 232, 228);
    for (const frac of [0, 0.5, 1]) {
      const gy = y + h - h * frac;
      doc.line(x0, gy, x0 + cw, gy);
      doc.text(money(max * frac), x0 - 4, gy + 3, { align: "right" });
    }
    pts.forEach((p, i) => {
      const bh = (p.revenue! / max) * h;
      doc.setFillColor(...(flagged.has(p.date) ? RED : GREEN));
      doc.rect(x0 + i * bw + 0.6, y + h - bh, Math.max(bw - 1.2, 0.8), bh, "F");
    });
    doc.setTextColor(...MUTED);
    doc.text(fmtDay(pts[0].date), x0, y + h + 11);
    doc.text(fmtDay(pts[pts.length - 1].date), x0 + cw, y + h + 11, { align: "right" });
    y += h + 32;
    doc.setTextColor(...INK);
  }

  // Findings
  const atStake = sum(report.findings.filter((f) => f.severity !== "low").map((f) => f.amount ?? 0));
  if (y > 640) { doc.addPage(); y = 50; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(`Audit findings: ${report.findings.length} found, ${money(atStake)} at stake`, M, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Severity", "Finding", "At stake"]],
    body: report.findings.length
      ? report.findings.map((f) => [SEVERITY_LABEL[f.severity], `${f.title}\n${f.detail}`, f.amount ? money(f.amount) : ""])
      : [["", "No problems found in this data.", ""]],
    theme: "plain",
    margin: { left: M, right: M },
    styles: { fontSize: 8.5, cellPadding: 6, textColor: INK, valign: "top" },
    headStyles: { fontStyle: "bold", fontSize: 8.5, textColor: MUTED },
    columnStyles: { 0: { cellWidth: 56, fontStyle: "bold" }, 2: { cellWidth: 60, halign: "right", fontStyle: "bold" } },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 0) {
        const v = String(d.cell.raw);
        d.cell.styles.textColor = v === "High" ? RED : v === "Medium" ? [180, 120, 0] : MUTED;
      }
      if (d.section === "body" && d.row.index % 2 === 0) d.cell.styles.fillColor = [245, 248, 246];
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Breakdowns
  for (const b of report.breakdowns) {
    autoTable(doc, {
      startY: y,
      head: [[b.title, "Transactions", "Revenue", "Share"]],
      body: b.rows.map((r) => [r.label + (r.note ? `  (${r.note})` : ""), r.transactions.toLocaleString(), money(r.revenue), `${(r.share * 100).toFixed(1)}%`]),
      theme: "plain",
      margin: { left: M, right: M },
      styles: { fontSize: 9, cellPadding: 4, textColor: INK },
      headStyles: { fontStyle: "bold", textColor: INK, fontSize: 10 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
  }

  // Flagged monthly parkers
  if (report.monthly) {
    const rank = { high: 0, medium: 1, low: 2 } as const;
    const worst = (p: (typeof report.monthly.parkers)[number]) => Math.min(...p.flags.map((f) => rank[f.severity]));
    const flagged = report.monthly.parkers.filter((p) => p.flags.length).sort((a, b) => worst(a) - worst(b) || b.balance - a.balance);
    if (flagged.length) {
      autoTable(doc, {
        startY: y,
        head: [["Flagged monthly parkers", "Flags", "Owed"]],
        body: flagged.map((p) => [`${p.name} (${p.id})`, p.flags.map((f) => `${f.label}: ${f.reason}`).join("\n"), p.balance ? money(p.balance) : ""]),
        theme: "plain",
        margin: { left: M, right: M },
        styles: { fontSize: 8.5, cellPadding: 4, textColor: INK, valign: "top" },
        headStyles: { fontStyle: "bold", textColor: INK, fontSize: 10 },
        columnStyles: { 0: { cellWidth: 140 }, 2: { cellWidth: 55, halign: "right" } },
      });
    }
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const H = doc.internal.pageSize.getHeight();
    doc.text("ParkGrid · Intelligence for every parking asset · getparkgrid.com", M, H - 20);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 20, { align: "right" });
  }
  return doc;
}

export async function downloadReport(report: PropertyReport, summaryText?: string) {
  const doc = await buildReport(report, summaryText);
  const safe = report.property.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
  doc.save(`ParkGrid-Report_${safe}_${report.asOf}.pdf`);
}
