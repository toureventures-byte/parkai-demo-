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
  { id: "1", entryTime: "8:14 AM", exitTime: "11:02 AM", duration: "2h 48m", gate: "West Structure — Entry 2", ticketNo: "SP-88214", rateType: "Hourly", amount: 24, paymentMethod: "Visa •• 4471", validation: "Lumière Boutique", status: "completed" },
  { id: "2", entryTime: "9:02 AM", exitTime: null, duration: "2h 20m", gate: "North Garage — Entry 1", ticketNo: "SP-88215", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: null, status: "active" },
  { id: "3", entryTime: "9:41 AM", exitTime: "12:10 PM", duration: "2h 29m", gate: "North Garage — Entry 1", ticketNo: "SP-88216", rateType: "Daily Max", amount: 38, paymentMethod: "Mastercard •• 9092", validation: null, status: "completed" },
  { id: "4", entryTime: "10:05 AM", exitTime: null, duration: "1h 17m", gate: "Valet Court — Entry 3", ticketNo: "SP-88217", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: "Noir Atelier", status: "active" },
  { id: "5", entryTime: "10:18 AM", exitTime: "10:26 AM", duration: "8m", gate: "West Structure — Entry 2", ticketNo: "SP-88218", rateType: "Grace Period", amount: 0, paymentMethod: "—", validation: null, status: "completed" },
  { id: "6", entryTime: "10:33 AM", exitTime: null, duration: "49m", gate: "North Garage — Entry 1", ticketNo: "SP-88219", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: null, status: "exception" },
  { id: "7", entryTime: "10:47 AM", exitTime: null, duration: "35m", gate: "Valet Court — Entry 3", ticketNo: "SP-88220", rateType: "Hourly", amount: 0, paymentMethod: "—", validation: "Ferrara Jewelers", status: "active" },
  { id: "8", entryTime: "6:58 AM", exitTime: "9:40 AM", duration: "2h 42m", gate: "West Structure — Entry 2", ticketNo: "SP-88209", rateType: "Early Bird", amount: 18, paymentMethod: "Amex •• 1120", validation: null, status: "completed" },
];

export const exceptions = [
  { id: "EX-3301", ticketNo: "SP-88219", type: "Lost Ticket — Manual Entry", gate: "North Garage — Exit 1", time: "Today, 11:20 AM", amountWaived: 12, staff: "Attendant Override — K. Munoz", status: "pending review" },
  { id: "EX-3298", ticketNo: "SP-88190", type: "Gate Arm Fault", gate: "Valet Court — Entry 3", time: "Today, 7:52 AM", amountWaived: 0, staff: "Auto-resolved by System", status: "resolved" },
  { id: "EX-3291", ticketNo: "SP-88144", type: "Validation Mismatch", gate: "West Structure — Exit 2", time: "Yesterday, 4:18 PM", amountWaived: 8, staff: "Manager Override — D. Whitfield", status: "resolved" },
  { id: "EX-3287", ticketNo: "SP-88102", type: "Duplicate Entry Scan", gate: "North Garage — Entry 1", time: "Yesterday, 1:05 PM", amountWaived: 0, staff: "Auto-resolved by System", status: "resolved" },
];

export const validations = [
  { merchant: "Lumière Boutique", issuedToday: 34, avgDiscount: "2 hrs free", costToday: 408 },
  { merchant: "Noir Atelier", issuedToday: 21, avgDiscount: "1 hr free", costToday: 189 },
  { merchant: "Ferrara Jewelers", issuedToday: 12, avgDiscount: "3 hrs free", costToday: 216 },
  { merchant: "Solstice Fashion House", issuedToday: 9, avgDiscount: "2 hrs free", costToday: 108 },
  { merchant: "Meridian Concierge", issuedToday: 17, avgDiscount: "Full Day", costToday: 340 },
];

export const occupancyByGarage = [
  { garage: "North Garage", capacity: 210, occupied: 178 },
  { garage: "West Structure", capacity: 165, occupied: 121 },
  { garage: "Valet Court", capacity: 60, occupied: 34 },
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

// Real day-of-week seasonality derived from May 2025 transient ticket activity
export const selfParkingRevenue7d = [
  { day: "Mon", revenue: 705 },
  { day: "Tue", revenue: 875 },
  { day: "Wed", revenue: 780 },
  { day: "Thu", revenue: 1180 },
  { day: "Fri", revenue: 1165 },
  { day: "Sat", revenue: 1305 },
  { day: "Sun", revenue: 875 },
];

export const selfParkingKpis = {
  vehiclesOnSite: 333,
  transactionsToday: 405,
  revenueToday: 1180,
  validationsToday: 93,
  occupancyPct: 79,
  openExceptions: 1,
  gatesOnline: 6,
  gatesTotal: 6,
};

export const gateSystems = [
  { name: "North Garage — Entry 1", type: "Entry", status: "online", lastPing: "2s ago" },
  { name: "North Garage — Exit 1", type: "Exit", status: "online", lastPing: "1s ago" },
  { name: "West Structure — Entry 2", type: "Entry", status: "online", lastPing: "4s ago" },
  { name: "West Structure — Exit 2", type: "Exit", status: "online", lastPing: "2s ago" },
  { name: "Valet Court — Entry 3", type: "Entry", status: "online", lastPing: "3s ago" },
  { name: "Valet Court — Exit 3", type: "Exit", status: "online", lastPing: "1s ago" },
];
