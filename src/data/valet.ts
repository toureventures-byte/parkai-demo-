export type ValetStatus = "parked" | "requested" | "retrieving" | "delivered" | "flagged";

export interface ValetTicket {
  id: string;
  ticket: string;
  guest: string;
  vehicle: string;
  plate: string;
  color: string;
  status: ValetStatus;
  attendant: string;
  checkIn: string;
  vip: boolean;
  spot: string;
  notes?: string;
}

export const valetTickets: ValetTicket[] = [
  { id: "1", ticket: "VLT-4821", guest: "Amara Chen", vehicle: "Range Rover Autobiography", plate: "8XYZ120", color: "Santorini Black", status: "parked", attendant: "Marco D.", checkIn: "10:12 AM", vip: true, spot: "North Garage L2-14" },
  { id: "2", ticket: "VLT-4822", guest: "James Whitfield", vehicle: "Bentley Continental GT", plate: "6RLX882", color: "Glacier White", status: "requested", attendant: "Priya S.", checkIn: "10:41 AM", vip: true, spot: "North Garage L1-02" },
  { id: "3", ticket: "VLT-4823", guest: "Lena Ostrowski", vehicle: "Tesla Model S Plaid", plate: "7EVX441", color: "Deep Blue Metallic", status: "retrieving", attendant: "Diego R.", checkIn: "10:52 AM", vip: false, spot: "West Structure L3-08" },
  { id: "4", ticket: "VLT-4824", guest: "Marcus Webb", vehicle: "Aston Martin DBX707", plate: "ASTN707", color: "Onyx Black", status: "parked", attendant: "Marco D.", checkIn: "11:03 AM", vip: true, spot: "North Garage L2-19" },
  { id: "5", ticket: "VLT-4825", guest: "Sofia Marchetti", vehicle: "Mercedes-Benz S580", plate: "4MBZ901", color: "Obsidian Black", status: "delivered", attendant: "Priya S.", checkIn: "9:48 AM", vip: false, spot: "—" },
  { id: "6", ticket: "VLT-4826", guest: "Robert Kim", vehicle: "Porsche 911 Turbo S", plate: "911TRB", color: "GT Silver", status: "flagged", attendant: "Diego R.", checkIn: "11:15 AM", vip: false, spot: "Valet Court L1-04", notes: "Guest reports minor scuff, incident #INC-118 opened" },
  { id: "7", ticket: "VLT-4827", guest: "Isabella Ford", vehicle: "Rolls-Royce Cullinan", plate: "RRC001", color: "English White", status: "parked", attendant: "Marco D.", checkIn: "11:22 AM", vip: true, spot: "North Garage L2-21" },
  { id: "8", ticket: "VLT-4828", guest: "Ethan Brooks", vehicle: "BMW i7 xDrive60", plate: "9BMWI7", color: "Frozen Pure Grey", status: "requested", attendant: "Priya S.", checkIn: "11:29 AM", vip: false, spot: "West Structure L2-11" },
  { id: "9", ticket: "VLT-4829", guest: "Grace Nakamura", vehicle: "Cadillac Escalade IQ", plate: "CDLQ22", color: "Stellar Black", status: "retrieving", attendant: "Diego R.", checkIn: "11:34 AM", vip: false, spot: "West Structure L1-03" },
  { id: "10", ticket: "VLT-4830", guest: "Nathaniel Cross", vehicle: "Lamborghini Urus S", plate: "URUS5S", color: "Verde Mantis", status: "parked", attendant: "Marco D.", checkIn: "11:40 AM", vip: true, spot: "North Garage L2-25" },
];

export const attendants = [
  { name: "Marco Delgado", role: "Lead Attendant", vehicles: 24, avgRetrieval: "4m 12s", rating: 4.9, cashVariance: 0 },
  { name: "Priya Sharma", role: "Valet Attendant", vehicles: 19, avgRetrieval: "4m 46s", rating: 4.8, cashVariance: 0 },
  { name: "Diego Ramirez", role: "Valet Attendant", vehicles: 16, avgRetrieval: "5m 03s", rating: 4.7, cashVariance: -18 },
  { name: "Casey Nguyen", role: "Valet Attendant", vehicles: 14, avgRetrieval: "4m 31s", rating: 4.9, cashVariance: 0 },
  { name: "Alex Torres", role: "Runner", vehicles: 9, avgRetrieval: "3m 58s", rating: 4.8, cashVariance: 0 },
];

export const valetIncidents = [
  { id: "INC-118", ticket: "VLT-4826", type: "Vehicle Damage Report", severity: "medium", guest: "Robert Kim", reported: "11:16 AM", status: "investigating", assignee: "Dana Whitfield" },
  { id: "INC-117", ticket: "VLT-4790", type: "Lost Ticket", severity: "low", guest: "Walk-in", reported: "Yesterday, 6:40 PM", status: "resolved", assignee: "Marco Delgado" },
  { id: "INC-116", ticket: "VLT-4771", type: "Payment Dispute", severity: "low", guest: "Priya Anand", reported: "Yesterday, 1:15 PM", status: "resolved", assignee: "Priya Sharma" },
];

export const valetReconciliation = [
  { id: "RC-2291", ticket: "VLT-4826", type: "Cash Drawer Shortage", attendant: "Diego Ramirez", amount: -18, time: "Today, 2:10 PM", status: "flagged" },
  { id: "RC-2287", ticket: "VLT-4790", type: "Comp Issued Without Approval", attendant: "Priya Sharma", amount: -35, time: "Yesterday, 5:40 PM", status: "resolved" },
  { id: "RC-2280", ticket: "VLT-4712", type: "Duplicate Ticket Scan", attendant: "Marco Delgado", amount: 0, time: "Yesterday, 12:15 PM", status: "resolved" },
  { id: "RC-2274", ticket: "VLT-4655", type: "Voided Ticket — No Manager Override", attendant: "Alex Torres", amount: -28, time: "2 days ago", status: "resolved" },
];

// Check-ins/check-outs so far today, hourly
export const valetHourly = [
  { hour: "8A", checkIns: 0, checkOuts: 0 },
  { hour: "9A", checkIns: 2, checkOuts: 1 },
  { hour: "10A", checkIns: 6, checkOuts: 2 },
  { hour: "11A", checkIns: 12, checkOuts: 5 },
  { hour: "12P", checkIns: 18, checkOuts: 10 },
  { hour: "1P", checkIns: 16, checkOuts: 14 },
  { hour: "2P", checkIns: 14, checkOuts: 15 },
  { hour: "3P", checkIns: 13, checkOuts: 14 },
];

// Gross ticket value vs. net collected, hourly — powers the reconciliation chart
export const valetRevenueReconciliation = [
  { hour: "8A", ticketed: 0, collected: 0 },
  { hour: "9A", ticketed: 56, collected: 24 },
  { hour: "10A", ticketed: 168, collected: 71 },
  { hour: "11A", ticketed: 336, collected: 141 },
  { hour: "12P", ticketed: 504, collected: 212 },
  { hour: "1P", ticketed: 448, collected: 188 },
  { hour: "2P", ticketed: 392, collected: 165 },
  { hour: "3P", ticketed: 364, collected: 153 },
];

// Real day-of-week seasonality derived from May 2025 valet ticket activity
export const valetRevenue7d = [
  { day: "Mon", revenue: 590, tickets: 51 },
  { day: "Tue", revenue: 740, tickets: 61 },
  { day: "Wed", revenue: 670, tickets: 55 },
  { day: "Thu", revenue: 965, tickets: 82 },
  { day: "Fri", revenue: 970, tickets: 79 },
  { day: "Sat", revenue: 1295, tickets: 104 },
  { day: "Sun", revenue: 850, tickets: 70 },
];

export const valetKpis = {
  vehiclesOnSite: 20,
  ticketsToday: 82,
  grossTicketValue: 2296,
  validatedRevenue: 1180,
  leakageFlagged: 151,
  revenueToday: 965,
  reconciliationRate: 93.4,
  vipGuestsToday: 9,
  openIncidents: 1,
  activeAttendants: 4,
  avgRetrievalMin: 4.3,
};
