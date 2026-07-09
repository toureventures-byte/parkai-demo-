export interface ReportItem {
  id: string;
  name: string;
  product: "Valet" | "Self Parking" | "Monthly" | "Cross-Product";
  type: string;
  period: string;
  generated: string;
  format: "PDF" | "CSV" | "XLSX";
  status: "ready" | "generating" | "scheduled";
}

export const reports: ReportItem[] = [
  { id: "1", name: "Daily Cash Report — Jul 7, 2026", product: "Self Parking", type: "DCR", period: "Jul 7, 2026", generated: "Jul 8, 6:00 AM", format: "PDF", status: "ready" },
  { id: "2", name: "Valet Revenue Summary — Week 27", product: "Valet", type: "Revenue Summary", period: "Jun 29 – Jul 5, 2026", generated: "Jul 6, 7:00 AM", format: "XLSX", status: "ready" },
  { id: "3", name: "Validation Usage Report — June 2026", product: "Self Parking", type: "Validation Report", period: "June 2026", generated: "Jul 1, 8:00 AM", format: "PDF", status: "ready" },
  { id: "4", name: "Exception Log — Jul 1–7, 2026", product: "Self Parking", type: "Exception Log", period: "Jul 1 – 7, 2026", generated: "Jul 8, 6:00 AM", format: "CSV", status: "ready" },
  { id: "5", name: "Monthly Parking Billing Summary — June 2026", product: "Monthly", type: "Billing Summary", period: "June 2026", generated: "Jul 1, 5:00 AM", format: "XLSX", status: "ready" },
  { id: "6", name: "Valet Incident Report — June 2026", product: "Valet", type: "Incident Report", period: "June 2026", generated: "Jul 1, 6:00 AM", format: "PDF", status: "ready" },
  { id: "7", name: "Property Performance Overview — Q2 2026", product: "Cross-Product", type: "Executive Summary", period: "Apr – Jun 2026", generated: "Jul 2, 9:00 AM", format: "PDF", status: "ready" },
  { id: "8", name: "Daily Cash Report — Jul 8, 2026", product: "Self Parking", type: "DCR", period: "Jul 8, 2026", generated: "Generating…", format: "PDF", status: "generating" },
  { id: "9", name: "Monthly Cancellations & Turnover — Jul 2026", product: "Monthly", type: "Turnover Report", period: "July 2026", generated: "Scheduled for Aug 1", format: "XLSX", status: "scheduled" },
  { id: "10", name: "Attendant Performance — Week 27", product: "Valet", type: "Staff Performance", period: "Jun 29 – Jul 5, 2026", generated: "Jul 6, 7:00 AM", format: "PDF", status: "ready" },
];

export const scheduledReports = [
  { name: "Daily Cash Report", cadence: "Daily, 6:00 AM PT", recipients: "D. Whitfield, Finance Team", product: "Self Parking" },
  { name: "Valet Revenue Summary", cadence: "Weekly, Monday 7:00 AM PT", recipients: "D. Whitfield, Ownership Group", product: "Valet" },
  { name: "Monthly Billing Summary", cadence: "Monthly, 1st @ 5:00 AM PT", recipients: "Finance Team", product: "Monthly" },
  { name: "Exception Log", cadence: "Weekly, Monday 6:00 AM PT", recipients: "D. Whitfield", product: "Self Parking" },
];
