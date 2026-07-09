export interface TransientTransaction {
  id: string;
  entryTime: string;
  exitTime: string | null;
  duration: string;
  gate: string;
  ticketNo: string;
  rateType: string;
  amount: number;
  paymentMethod: string;
  validation: string | null;
  status: "active" | "completed" | "exception";
}

export const transientTransactions: TransientTransaction[] = [
  { id: "1", entryTime: "8:14 AM", exitTime: "11:02 AM", duration: "2h 48m", gate: "Dayton Way — Entry 2", ticketNo: "SP-88214", rateType: "Hourly", amount: 24, paymentMethod: "Visa •• 4471", validation: "Gucci Two Rodeo", status: "completed" },
  { id: "2", entryTime: "9:02 AM", exitTime: null, duration: "2h 20m", gate: "Via Rodeo — Entry 1", ticketNo: "SP-88215", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: null, status: "active" },
  { id: "3", entryTime: "9:41 AM", exitTime: "12:10 PM", duration: "2h 29m", gate: "Via Rodeo — Entry 1", ticketNo: "SP-88216", rateType: "Daily Max", amount: 38, paymentMethod: "Mastercard •• 9092", validation: null, status: "completed" },
  { id: "4", entryTime: "10:05 AM", exitTime: null, duration: "1h 17m", gate: "Beverly Ct — Entry 3", ticketNo: "SP-88217", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: "Prada Beverly Hills", status: "active" },
  { id: "5", entryTime: "10:18 AM", exitTime: "10:26 AM", duration: "8m", gate: "Dayton Way — Entry 2", ticketNo: "SP-88218", rateType: "Grace Period", amount: 0, paymentMethod: "—", validation: null, status: "completed" },
  { id: "6", entryTime: "10:33 AM", exitTime: null, duration: "49m", gate: "Via Rodeo — Entry 1", ticketNo: "SP-88219", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: null, status: "exception" },
  { id: "7", entryTime: "10:47 AM", exitTime: null, duration: "35m", gate: "Beverly Ct — Entry 3", ticketNo: "SP-88220", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: "Van Cleef & Arpels", status: "active" },
  { id: "8", entryTime: "6:58 AM", exitTime: "9:40 AM", duration: "2h 42m", gate: "Dayton Way — Entry 2", ticketNo: "SP-88209", rateType: "Early Bird", amount: 18, paymentMethod: "Amex •• 1120", validation: null, status: "completed" },
];

export const exceptions = [
  { id: "EX-3301", ticketNo: "SP-88219", type: "Lost Ticket — Manual Entry", gate: "Via Rodeo — Exit 1", time: "Today, 11:20 AM", amountWaived: 12, staff: "Attendant Override — K. Munoz", status: "pending review" },
  { id: "EX-3298", ticketNo: "SP-88190", type: "Gate Arm Fault", gate: "Beverly Ct — Entry 3", time: "Today, 7:52 AM", amountWaived: 0, staff: "Auto-resolved by System", status: "resolved" },
  { id: "EX-3291", ticketNo: "SP-88144", type: "Validation Mismatch", gate: "Dayton Way — Exit 2", time: "Yesterday, 4:18 PM", amountWaived: 8, staff: "Manager Override — D. Whitfield", status: "resolved" },
  { id: "EX-3287", ticketNo: "SP-88102", type: "Duplicate Entry Scan", gate: "Via Rodeo — Entry 1", time: "Yesterday, 1:05 PM", amountWaived: 0, staff: "Auto-resolved by System", status: "resolved" },
];

export const validations = [
  { merchant: "Gucci Two Rodeo", issuedToday: 34, avgDiscount: "2 hrs free", costToday: 408 },
  { merchant: "Prada Beverly Hills", issuedToday: 21, avgDiscount: "1 hr free", costToday: 189 },
  { merchant: "Van Cleef & Arpels", issuedToday: 12, avgDiscount: "3 hrs free", costToday: 216 },
  { merchant: "Dolce & Gabbana", issuedToday: 9, avgDiscount: "2 hrs free", costToday: 108 },
  { merchant: "Two Rodeo Concierge", issuedToday: 17, avgDiscount: "Full Day", costToday: 340 },
];

export const occupancyByGarage = [
  { garage: "Via Rodeo Garage", capacity: 210, occupied: 178 },
  { garage: "Dayton Way Structure", capacity: 165, occupied: 121 },
  { garage: "Beverly Dr Valet Court", capacity: 60, occupied: 34 },
];

export const occupancyTrend = [
  { time: "6A", occ: 12 },
  { time: "8A", occ: 34 },
  { time: "10A", occ: 61 },
  { time: "12P", occ: 82 },
  { time: "2P", occ: 91 },
  { time: "4P", occ: 87 },
  { time: "6P", occ: 78 },
  { time: "8P", occ: 52 },
];

export const selfParkingRevenue7d = [
  { day: "Mon", revenue: 6210 },
  { day: "Tue", revenue: 5840 },
  { day: "Wed", revenue: 6510 },
  { day: "Thu", revenue: 7120 },
  { day: "Fri", revenue: 9430 },
  { day: "Sat", revenue: 12680 },
  { day: "Sun", revenue: 10920 },
];

export const selfParkingKpis = {
  vehiclesOnSite: 333,
  transactionsToday: 412,
  revenueToday: 6842,
  validationsToday: 93,
  occupancyPct: 79,
  openExceptions: 1,
  gatesOnline: 6,
  gatesTotal: 6,
};

export const gateSystems = [
  { name: "Via Rodeo — Entry 1", type: "Entry", status: "online", lastPing: "2s ago" },
  { name: "Via Rodeo — Exit 1", type: "Exit", status: "online", lastPing: "1s ago" },
  { name: "Dayton Way — Entry 2", type: "Entry", status: "online", lastPing: "4s ago" },
  { name: "Dayton Way — Exit 2", type: "Exit", status: "online", lastPing: "2s ago" },
  { name: "Beverly Ct — Entry 3", type: "Entry", status: "online", lastPing: "3s ago" },
  { name: "Beverly Ct — Exit 3", type: "Exit", status: "online", lastPing: "1s ago" },
];
