export interface ActivityItem {
  id: string;
  product: "Valet" | "Self Parking" | "Monthly" | "System";
  message: string;
  time: string;
  severity: "info" | "success" | "warning" | "critical";
}

export const activityFeed: ActivityItem[] = [
  { id: "1", product: "Valet", message: "VIP guest James Whitfield requested vehicle retrieval — Bentley Continental GT", time: "2 min ago", severity: "info" },
  { id: "2", product: "Self Parking", message: "Exception flagged at Via Rodeo Exit 1 — ticket SP-88219 pending review", time: "6 min ago", severity: "warning" },
  { id: "3", product: "Monthly", message: "New monthly application submitted — Gucci Staff #3", time: "18 min ago", severity: "info" },
  { id: "4", product: "Valet", message: "Incident INC-118 opened — minor scuff reported by Robert Kim", time: "24 min ago", severity: "critical" },
  { id: "5", product: "Monthly", message: "Payment failed for Marcus Feldman — account moved to past due", time: "41 min ago", severity: "warning" },
  { id: "6", product: "Self Parking", message: "Daily Cash Report for Jul 7 generated successfully", time: "2 hrs ago", severity: "success" },
  { id: "7", product: "Valet", message: "Shift change — Casey Nguyen clocked in for PM shift", time: "3 hrs ago", severity: "info" },
  { id: "8", product: "System", message: "ParkAI Assistant flagged an unusual wait-time spike at 12:00 PM (+38% vs. avg)", time: "3 hrs ago", severity: "warning" },
  { id: "9", product: "Monthly", message: "Access reactivated for Isabelle Foster after billing update", time: "5 hrs ago", severity: "success" },
  { id: "10", product: "Self Parking", message: "Gate Beverly Ct — Entry 3 reconnected after brief signal drop", time: "6 hrs ago", severity: "success" },
];

export const aiInsights = [
  {
    id: "1",
    title: "Wait times trending up at midday",
    description: "Average valet wait time hit 5.9 min between 12–1 PM, 38% above the 7-day average. Consider adding a runner during peak lunch hours.",
    tag: "Valet",
  },
  {
    id: "2",
    title: "Validation spend up 14% week-over-week",
    description: "Van Cleef & Arpels validations increased sharply this week. Worth confirming with the merchant whether a promotion is driving traffic.",
    tag: "Self Parking",
  },
  {
    id: "3",
    title: "3 monthly accounts at risk of churn",
    description: "Marcus Feldman and 2 others have failed payments 2+ times in the last 30 days. Recommend proactive outreach before suspension.",
    tag: "Monthly",
  },
];
