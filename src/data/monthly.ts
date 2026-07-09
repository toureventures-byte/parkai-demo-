export interface MonthlyAccount {
  id: string;
  name: string;
  unit: string;
  plan: string;
  vehicle: string;
  plate: string;
  status: "active" | "pending" | "suspended" | "cancelled";
  billing: "current" | "past due" | "auto-pay";
  monthlyRate: number;
  since: string;
  accessCard: string;
  avatarColor: string;
}

export const monthlyAccounts: MonthlyAccount[] = [
  { id: "1", name: "Harold Whitmore", unit: "Meridian Offices — Ste 402", plan: "Reserved Executive", vehicle: "Mercedes-Benz S580", plate: "4MBZ901", status: "active", billing: "auto-pay", monthlyRate: 425, since: "Jan 2023", accessCard: "AC-10042", avatarColor: "bg-electric-500" },
  { id: "2", name: "Renée Castillo", unit: "Meridian Offices — Ste 210", plan: "Unreserved Standard", vehicle: "BMW X5", plate: "5BMWX5", status: "active", billing: "auto-pay", monthlyRate: 285, since: "Mar 2023", accessCard: "AC-10071", avatarColor: "bg-violet-500" },
  { id: "3", name: "Meridian Retail — Lumière Staff #3", unit: "Retail Staff Pool", plan: "Retail Staff", vehicle: "Honda Civic", plate: "7HCV221", status: "pending", billing: "current", monthlyRate: 165, since: "Requested Jul 5", accessCard: "Pending Issue", avatarColor: "bg-amber-500" },
  { id: "4", name: "Marcus Feldman", unit: "Meridian Offices — Ste 318", plan: "Reserved Executive", vehicle: "Audi A8", plate: "8AUDA8", status: "suspended", billing: "past due", monthlyRate: 425, since: "Aug 2022", accessCard: "AC-09981", avatarColor: "bg-rose-500" },
  { id: "5", name: "Meridian Retail — Noir Staff #1", unit: "Retail Staff Pool", plan: "Retail Staff", vehicle: "Toyota Camry", plate: "6TOYC1", status: "active", billing: "auto-pay", monthlyRate: 165, since: "Nov 2023", accessCard: "AC-10011", avatarColor: "bg-emerald-500" },
  { id: "6", name: "Isabelle Foster", unit: "Meridian Offices — Ste 501", plan: "Unreserved Standard", vehicle: "Lexus RX", plate: "3LEXRX", status: "cancelled", billing: "current", monthlyRate: 285, since: "Churned Jun 2026", accessCard: "Revoked", avatarColor: "bg-slate-500" },
  { id: "7", name: "Meridian Retail — Ferrara Staff #2", unit: "Retail Staff Pool", plan: "Retail Staff", vehicle: "Nissan Altima", plate: "2NISA1", status: "active", billing: "auto-pay", monthlyRate: 165, since: "Feb 2024", accessCard: "AC-10105", avatarColor: "bg-emerald-500" },
  { id: "8", name: "Priya Anand", unit: "Meridian Offices — Ste 115", plan: "Reserved Executive", vehicle: "Tesla Model X", plate: "1TSLX9", status: "active", billing: "auto-pay", monthlyRate: 425, since: "May 2021", accessCard: "AC-09802", avatarColor: "bg-electric-500" },
];

export const pendingApprovals = monthlyAccounts.filter((a) => a.status === "pending");

export const monthlyKpis = {
  activeAccounts: 214,
  pendingApprovals: 6,
  mrr: 68420,
  pastDue: 3,
  suspendedAccess: 4,
  cancellationsThisMonth: 5,
  avgApprovalTime: "3.2 hrs",
  occupiedSpots: 198,
  totalMonthlySpots: 230,
};

export const monthlyGrowth = [
  { month: "Feb", accounts: 189, mrr: 58200 },
  { month: "Mar", accounts: 196, mrr: 60750 },
  { month: "Apr", accounts: 201, mrr: 62480 },
  { month: "May", accounts: 205, mrr: 64100 },
  { month: "Jun", accounts: 209, mrr: 65990 },
  { month: "Jul", accounts: 214, mrr: 68420 },
];

export const billingEvents = [
  { id: "1", account: "Harold Whitmore", type: "Payment Succeeded", amount: 425, date: "Jul 1, 2026", method: "Visa •• 2210" },
  { id: "2", account: "Marcus Feldman", type: "Payment Failed", amount: 425, date: "Jul 1, 2026", method: "Mastercard •• 7743" },
  { id: "3", account: "Renée Castillo", type: "Payment Succeeded", amount: 285, date: "Jul 1, 2026", method: "Amex •• 1004" },
  { id: "4", account: "Priya Anand", type: "Payment Succeeded", amount: 425, date: "Jul 1, 2026", method: "Visa •• 8821" },
  { id: "5", account: "Isabelle Foster", type: "Subscription Cancelled", amount: 0, date: "Jun 28, 2026", method: "—" },
];

// Data for the parker-facing (Monthly User App)
export const currentUser = {
  name: "Priya Anand",
  unit: "Meridian Offices — Ste 115",
  email: "priya.anand@meridianplaza-tenant.com",
  plan: "Reserved Executive",
  status: "active" as const,
  monthlyRate: 425,
  nextBillDate: "Aug 1, 2026",
  accessCard: "AC-09802",
  memberSince: "May 2021",
  vehicle: {
    make: "Tesla",
    model: "Model X",
    year: 2025,
    color: "Pearl White",
    plate: "1TSLX9",
  },
  paymentMethod: {
    brand: "Visa",
    last4: "8821",
    expires: "09/28",
  },
  garage: "North Garage",
  assignedSpot: "Level 2, Reserved Row A-14",
};

export const accessLog = [
  { id: "1", event: "Gate Entry", gate: "North Garage — Entry 1", time: "Today, 8:42 AM" },
  { id: "2", event: "Gate Exit", gate: "North Garage — Exit 1", time: "Yesterday, 6:58 PM" },
  { id: "3", event: "Gate Entry", gate: "North Garage — Entry 1", time: "Yesterday, 8:31 AM" },
  { id: "4", event: "Gate Exit", gate: "North Garage — Exit 1", time: "Jul 6, 7:02 PM" },
  { id: "5", event: "Gate Entry", gate: "North Garage — Entry 1", time: "Jul 6, 8:38 AM" },
];

export const billingHistory = [
  { id: "1", date: "Jul 1, 2026", description: "Monthly Parking — Reserved Executive", amount: 425, status: "paid" },
  { id: "2", date: "Jun 1, 2026", description: "Monthly Parking — Reserved Executive", amount: 425, status: "paid" },
  { id: "3", date: "May 1, 2026", description: "Monthly Parking — Reserved Executive", amount: 425, status: "paid" },
  { id: "4", date: "Apr 1, 2026", description: "Monthly Parking — Reserved Executive", amount: 425, status: "paid" },
];

export const supportRequests = [
  { id: "SR-2291", subject: "Access card not reading at West Structure gate", status: "open", updated: "2 hrs ago" },
  { id: "SR-2204", subject: "Update payment method", status: "resolved", updated: "Jun 22, 2026" },
  { id: "SR-2140", subject: "Request second vehicle addition", status: "resolved", updated: "Apr 3, 2026" },
];
