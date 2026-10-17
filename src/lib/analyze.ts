import type {
  Breakdown, BreakdownRow, Cell, DailyPoint, Dataset, Finding, Kpi, MonthlyParker, PropertyReport, Severity,
} from "./types";
import {
  addDays, dayKey, daysBetween, fmtDay, fmtRange, median, money, parseTime, pct, runsOfDays, sum, toMinutes, toNumber,
  toText, toTimestamp, weekday,
} from "./values";

const DAY = 86400000;
let fid = 0;
const newId = () => `f${++fid}`;

function col(ds: Dataset, field: string): (r: Cell[]) => Cell {
  const i = ds.mapping[field];
  return i === null || i === undefined ? () => null : (r) => r[i] ?? null;
}

/* ------------------------------------------------------------------ */
/* Transactions                                                        */
/* ------------------------------------------------------------------ */

interface Tx {
  ts: number;
  day: string;
  revenue: number;
  charge: number;
  payType: string;
  lane: string;
  staff: string;
  guestType: string;
  ticketNum: number | null;
  isComp: boolean;
  isVoid: boolean;
  isLost: boolean;
  isValidated: boolean;
  durationMin: number | null;
}

function readTransactions(ds: Dataset): Tx[] {
  const g = {
    ticket: col(ds, "ticket"), entry: col(ds, "entry"), entryTime: col(ds, "entryTime"), exit: col(ds, "exit"),
    amount: col(ds, "amount"), paid: col(ds, "paid"), payType: col(ds, "payType"), lane: col(ds, "lane"),
    staff: col(ds, "staff"), status: col(ds, "status"), compReason: col(ds, "compReason"),
    validation: col(ds, "validation"), duration: col(ds, "duration"), guestType: col(ds, "guestType"),
  };
  const out: Tx[] = [];
  for (const r of ds.rows) {
    let ts = toTimestamp(g.entry(r));
    if (ts === null) continue;
    const t = parseTime(g.entryTime(r));
    if (t !== null && ts % DAY === 0) ts += t;
    const exitTs = toTimestamp(g.exit(r));
    const amount = toNumber(g.amount(r));
    const paid = toNumber(g.paid(r));
    const payType = toText(g.payType(r)).toLowerCase();
    const status = toText(g.status(r)).toLowerCase();
    const compReason = toText(g.compReason(r));
    const isVoid = /void|cancel/.test(status);
    let revenue = paid ?? amount ?? 0;
    if (isVoid) revenue = 0;
    const raw = toText(g.ticket(r));
    const digits = raw.match(/(\d+)\s*$/);
    const dur = toMinutes(g.duration(r));
    out.push({
      ts,
      day: dayKey(ts),
      revenue,
      charge: amount ?? paid ?? 0,
      payType,
      lane: toText(g.lane(r)),
      staff: toText(g.staff(r)),
      guestType: toText(g.guestType(r)),
      ticketNum: digits ? parseInt(digits[1], 10) : null,
      isComp: /comp/.test(payType) || (!!compReason && revenue === 0),
      isVoid,
      isLost: /lost/.test(payType) || /lost/.test(status),
      isValidated: !!toText(g.validation(r)) || /valid/.test(payType),
      durationMin: dur ?? (exitTs !== null && exitTs > ts ? (exitTs - ts) / 60000 : null),
    });
  }
  return out;
}

function timeOfDay(ts: number): string {
  const d = new Date(ts);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Ticket numbers that should exist (sequence is continuous) but never appear. */
function ticketGaps(txs: Tx[], what: string): Finding[] {
  const withNum = txs.filter((t) => t.ticketNum !== null).sort((a, b) => a.ticketNum! - b.ticketNum!);
  if (withNum.length < 200) return [];
  const diffs: number[] = [];
  for (let i = 1; i < withNum.length; i++) diffs.push(withNum[i].ticketNum! - withNum[i - 1].ticketNum!);
  if (diffs.filter((d) => d === 1).length / diffs.length < 0.9) return [];
  const byDay = new Map<string, { nums: number[]; from: number; to: number }>();
  for (let i = 1; i < withNum.length; i++) {
    const a = withNum[i - 1], b = withNum[i];
    const gap = b.ticketNum! - a.ticketNum!;
    if (gap < 2 || gap > 60) continue;
    const e = byDay.get(a.day) ?? { nums: [], from: a.ts, to: b.ts };
    for (let n = a.ticketNum! + 1; n < b.ticketNum!; n++) e.nums.push(n);
    e.from = Math.min(e.from, a.ts);
    e.to = Math.max(e.to, b.ts);
    byDay.set(a.day, e);
  }
  const findings: Finding[] = [];
  const total = sum([...byDay.values()].map((e) => e.nums.length));
  const bigDays = [...byDay.entries()].filter(([, e]) => e.nums.length >= 3).sort((a, b) => b[1].nums.length - a[1].nums.length);
  for (const [day, e] of bigDays.slice(0, 3)) {
    const nums = e.nums;
    const avg = sum(txs.filter((t) => t.day === day && t.revenue > 0).map((t) => t.revenue)) /
      Math.max(1, txs.filter((t) => t.day === day && t.revenue > 0).length);
    findings.push({
      id: newId(),
      severity: nums.length >= 8 ? "high" : "medium",
      category: "Missing tickets",
      title: `${nums.length} ${what} numbers missing on ${fmtDay(day, true)}`,
      detail: `Ticket numbers #${nums[0]}–#${nums[nums.length - 1]} skip ${nums.length} numbers between ${timeOfDay(e.from)} and ${timeOfDay(e.to)}. These tickets were issued but never closed out. Missing: ${nums.map((n) => "#" + n).join(", ")}.`,
      amount: Math.round(nums.length * avg),
      dates: [day],
    });
  }
  if (!bigDays.length && total >= 5) {
    findings.push({
      id: newId(), severity: "low", category: "Missing tickets",
      title: `${total} scattered ${what} numbers missing`,
      detail: `Small gaps in the ticket sequence across ${byDay.size} days. Worth a spot check.`,
    });
  }
  return findings;
}

/** Find the day where a group's event rate changed the most (two-rate likelihood split). */
function changePoint(rows: Tx[], pred: (t: Tx) => boolean): { start: string; n: number; k: number; before: number } | null {
  const days = [...new Set(rows.map((r) => r.day))].sort();
  if (days.length < 14) return null;
  const n: number[] = [], k: number[] = [];
  for (const d of days) {
    const rs = rows.filter((r) => r.day === d);
    n.push(rs.length);
    k.push(rs.filter(pred).length);
  }
  const N = sum(n), K = sum(k);
  const ll = (kk: number, nn: number) => {
    if (nn === 0) return 0;
    const p = Math.min(Math.max(kk / nn, 1e-6), 1 - 1e-6);
    return kk * Math.log(p) + (nn - kk) * Math.log(1 - p);
  };
  let best = { i: -1, gain: 0 };
  let n1 = 0, k1 = 0;
  for (let i = 1; i < days.length - 4; i++) {
    n1 += n[i - 1];
    k1 += k[i - 1];
    if (i < 5) continue;
    const gain = ll(k1, n1) + ll(K - k1, N - n1) - ll(K, N);
    if ((K - k1) / (N - n1) > (k1 / n1) * 2 && gain > best.gain) best = { i, gain };
  }
  if (best.i < 0 || best.gain < 6) return null;
  const nb = sum(n.slice(0, best.i)), kb = sum(k.slice(0, best.i));
  return { start: days[best.i], n: N - nb, k: K - kb, before: kb / Math.max(1, nb) };
}

/** One person or lane with a much higher rate of comps / voids / lost tickets than their peers. */
function rateOutliers(
  txs: Tx[], dim: "staff" | "lane", pred: (t: Tx) => boolean, what: string, category: string, valueEach: number,
): Finding[] {
  const groups = new Map<string, Tx[]>();
  for (const t of txs) {
    const key = t[dim];
    if (!key) continue;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(t);
  }
  if (groups.size < 2) return [];
  const N = txs.filter((t) => t[dim]).length;
  const K = txs.filter((t) => t[dim] && pred(t)).length;
  if (K < 10) return [];
  const dimLabel = dim === "staff" ? "staff member" : "lane";
  const peers = dim === "staff" ? "everyone else" : "other lanes";
  const out: Finding[] = [];
  for (const [name, rows] of groups) {
    const n = rows.length, k = rows.filter(pred).length;
    const otherRate = (K - k) / Math.max(1, N - n);
    const rate = k / n;
    const excess = k - n * otherRate;
    if (k < 10 || rate < otherRate * 2 || excess < 12) continue;
    const cp = changePoint(rows, pred);
    let detail: string, title: string, excessCount: number;
    if (cp) {
      const others = txs.filter((t) => t[dim] && t[dim] !== name && t.day >= cp.start);
      const oRate = others.filter(pred).length / Math.max(1, others.length);
      excessCount = cp.k - cp.n * oRate;
      title = `${name}: ${what} jumped to ${pct(cp.k / cp.n)} since ${fmtDay(cp.start)}`;
      detail = `Since ${fmtDay(cp.start, true)}, ${name} recorded ${cp.k} ${what} out of ${cp.n} tickets (${pct(cp.k / cp.n)}), vs ${pct(oRate)} for ${peers} over the same days and ${pct(cp.before)} for ${name} before that.`;
    } else {
      excessCount = excess;
      title = `${name}: ${what} rate ${(rate / Math.max(otherRate, 1e-6)).toFixed(1)}x ${peers}`;
      detail = `${name} recorded ${k} ${what} out of ${n} tickets (${pct(rate)}), vs ${pct(otherRate)} for ${peers}.`;
    }
    const amount = valueEach > 0 ? Math.round(excessCount * valueEach) : undefined;
    if (amount) detail += ` That's about ${Math.round(excessCount)} more than normal, roughly ${money(amount)} in revenue not collected.`;
    else detail += ` About ${Math.round(excessCount)} more than normal for this ${dimLabel}. Worth reviewing.`;
    out.push({ id: newId(), severity: amount && excessCount >= 30 ? "high" : "medium", category, title, detail, amount, names: [name] });
  }
  return out;
}

/** A lane that stops recording while the rest of the site runs normally. */
function laneOutages(txs: Tx[], dailyRevenue: Map<string, number>): { findings: Finding[]; days: Set<string> } {
  const lanes = [...new Set(txs.map((t) => t.lane).filter(Boolean))];
  const days = [...new Set(txs.map((t) => t.day))].sort();
  const findings: Finding[] = [];
  const outageDays = new Set<string>();
  if (lanes.length < 2 || days.length < 14) return { findings, days: outageDays };
  const cnt = new Map<string, number>();
  const rev = new Map<string, number>();
  for (const t of txs) {
    const k = t.lane + "|" + t.day;
    cnt.set(k, (cnt.get(k) ?? 0) + 1);
    rev.set(k, (rev.get(k) ?? 0) + t.revenue);
  }
  for (const lane of lanes) {
    const own = days.map((d) => cnt.get(lane + "|" + d) ?? 0);
    const others = days.map((d) => sum(lanes.filter((l) => l !== lane).map((l) => cnt.get(l + "|" + d) ?? 0)));
    const medOwn = median(own), medOthers = median(others);
    if (medOwn < 10) continue;
    const bad = days.filter((_d, i) => own[i] < medOwn * 0.15 && others[i] >= medOthers * 0.5);
    for (const run of runsOfDays(bad)) {
      run.forEach((d) => outageDays.add(d));
      const laneRev = median(days.map((d) => rev.get(lane + "|" + d) ?? 0));
      const cur = sum(run.map((d) => dailyRevenue.get(d) ?? 0));
      const prevDays = run.map((d) => addDays(d, -7));
      const prev = prevDays.every((d) => dailyRevenue.has(d)) ? sum(prevDays.map((d) => dailyRevenue.get(d)!)) : null;
      const recorded = sum(run.map((d) => cnt.get(lane + "|" + d) ?? 0));
      let detail = `${lane} recorded ${recorded === 0 ? "no" : "only " + recorded} transactions on ${fmtRange(run)} (${run.length} day${run.length > 1 ? "s" : ""}) while the other lanes ran normally. Likely a gate, reader or ticket-printer failure, so cars may have left without paying.`;
      if (prev !== null && prev > 0) {
        detail += ` Site revenue those days was ${money(cur)} vs ${money(prev)} the same days a week earlier (${((cur / prev - 1) * 100).toFixed(0)}%).`;
      }
      detail += ` ${lane} normally takes about ${money(laneRev)} a day, so roughly ${money(laneRev * run.length)} may not have been collected.`;
      findings.push({
        id: newId(), severity: "high", category: "Equipment / revenue loss",
        title: `${lane} recorded ${recorded === 0 ? "nothing" : "almost nothing"} for ${run.length} day${run.length > 1 ? "s" : ""} (${fmtRange(run)})`,
        detail, amount: Math.round(laneRev * run.length), dates: run, names: [lane],
      });
    }
  }
  return { findings, days: outageDays };
}

/** Days well below the normal level for that weekday. */
function dips(series: Map<string, number>, what: string, skip: Set<string>, threshold = 0.75): Finding[] {
  const days = [...series.keys()].sort();
  if (days.length < 21) return [];
  const low: string[] = [];
  const base = new Map<string, number>();
  const edges = new Set([days[0], days[days.length - 1]]); // exports often cut the first and last day short
  for (const d of days) {
    const same = days.filter((x) => x !== d && !edges.has(x) && weekday(x) === weekday(d)).map((x) => series.get(x)!);
    const b = median(same);
    base.set(d, b);
    if (b > 0 && series.get(d)! < b * threshold && !skip.has(d) && !edges.has(d)) low.push(d);
  }
  const deep = (d: string) => series.get(d)! < base.get(d)! * (threshold - 0.15);
  return runsOfDays(low).filter((run) => run.length >= 2 || deep(run[0])).map((run) => {
    const cur = sum(run.map((d) => series.get(d)!)), b = sum(run.map((d) => base.get(d)!));
    return {
      id: newId(), severity: (b - cur > 1000 ? "high" : "medium") as Severity, category: "Revenue dip",
      title: `${what} down ${((1 - cur / b) * 100).toFixed(0)}% on ${fmtRange(run)}`,
      detail: `${what} was ${money(cur)} on ${fmtRange(run)} vs a normal ${money(b)} for those weekdays. No equipment outage explains it, so check staffing, rates and events.`,
      amount: Math.round(b - cur), dates: run,
    };
  });
}

/** Days well above normal for that weekday (validations, comps…). */
function spikes(series: Map<string, number>, what: string, category: string): Finding[] {
  const days = [...series.keys()].sort();
  if (days.length < 21) return [];
  const hi: string[] = [];
  const base = new Map<string, number>();
  for (const d of days) {
    const b = median(days.filter((x) => x !== d && weekday(x) === weekday(d)).map((x) => series.get(x)!));
    base.set(d, b);
    if (series.get(d)! >= Math.max(b * 2, b + 10)) hi.push(d);
  }
  return runsOfDays(hi).filter((r) => r.length >= 2).map((run) => {
    const avg = sum(run.map((d) => series.get(d)!)) / run.length;
    const b = sum(run.map((d) => base.get(d)!)) / run.length;
    return {
      id: newId(), severity: "medium" as Severity, category,
      title: `${what} spiked to ${Math.round(avg)}/day on ${fmtRange(run)} (normally ~${Math.round(b)})`,
      detail: `${what} averaged ${avg.toFixed(0)} per day on ${fmtRange(run)}, about ${(avg / Math.max(b, 1)).toFixed(1)}x the usual ${b.toFixed(0)} for those weekdays. Confirm which tenant or merchant issued them and whether it was approved.`,
      dates: run,
    };
  });
}

function breakdown(txs: Tx[], dim: "lane" | "staff" | "payType" | "guestType", title: string, totalRev: number, withComps = false): Breakdown | null {
  const m = new Map<string, Tx[]>();
  for (const t of txs) {
    const k = dim === "payType" ? (t.payType ? t.payType.replace(/\b\w/g, (c) => c.toUpperCase()) : "") : t[dim];
    if (!k) continue;
    (m.get(k) ?? m.set(k, []).get(k)!).push(t);
  }
  if (m.size < 2 || m.size > 40) return null;
  const rows: BreakdownRow[] = [...m.entries()].map(([label, rs]) => {
    const comps = rs.filter((r) => r.isComp).length;
    return {
      label, transactions: rs.length, revenue: Math.round(sum(rs.map((r) => r.revenue))),
      share: totalRev ? sum(rs.map((r) => r.revenue)) / totalRev : 0,
      note: withComps ? `${pct(comps / rs.length)} comped` : undefined,
    };
  }).sort((a, b) => b.revenue - a.revenue);
  return { title, dimension: dim, rows };
}

function analyzeTransactions(ds: Dataset) {
  const txs = readTransactions(ds);
  const totalRev = sum(txs.map((t) => t.revenue));
  const paying = txs.filter((t) => t.revenue > 0);
  const avgTicket = paying.length ? totalRev / paying.length : 0;
  const daily = new Map<string, { revenue: number; transactions: number; validations: number }>();
  for (const t of txs) {
    const e = daily.get(t.day) ?? { revenue: 0, transactions: 0, validations: 0 };
    e.revenue += t.revenue;
    e.transactions++;
    if (t.isValidated) e.validations++;
    daily.set(t.day, e);
  }
  const revSeries = new Map([...daily].map(([d, v]) => [d, v.revenue]));
  const comps = txs.filter((t) => t.isComp).length;
  const voids = txs.filter((t) => t.isVoid).length;
  const lost = txs.filter((t) => t.isLost).length;
  const validated = txs.filter((t) => t.isValidated).length;
  const durs = txs.map((t) => t.durationMin).filter((x): x is number => x !== null);

  const kpis: Kpi[] = [
    { key: "revenue", label: "Revenue", value: totalRev, format: "money" },
    { key: "transactions", label: "Transactions", value: txs.length, format: "int" },
    { key: "avgTicket", label: "Average ticket", value: avgTicket, format: "money", sub: "paying tickets" },
  ];
  if (comps) kpis.push({ key: "comps", label: "Comps", value: comps / txs.length, format: "pct", sub: `${comps.toLocaleString()} tickets` });
  if (validated) kpis.push({ key: "validations", label: "Validated", value: validated / txs.length, format: "pct", sub: `${validated.toLocaleString()} tickets` });
  if (lost) kpis.push({ key: "lost", label: "Lost tickets", value: lost, format: "int" });
  if (voids) kpis.push({ key: "voids", label: "Voids", value: voids, format: "int" });
  if (durs.length > txs.length * 0.5) kpis.push({ key: "duration", label: "Avg stay", value: median(durs) / 60, format: "num", sub: "hours (median)" });

  const breakdowns = [
    breakdown(txs, "lane", "Revenue by lane", totalRev),
    breakdown(txs, "staff", "Revenue by attendant / cashier", totalRev, comps > 0),
    breakdown(txs, "payType", "Revenue by payment type", totalRev),
    breakdown(txs, "guestType", "Revenue by customer / ticket type", totalRev),
  ].filter((b): b is Breakdown => !!b);

  const outages = laneOutages(txs, revSeries);
  const findings: Finding[] = [
    ...outages.findings,
    ...ticketGaps(txs, "ticket"),
    ...rateOutliers(txs, "staff", (t) => t.isComp, "comps", "Excessive comps", avgTicket),
    ...rateOutliers(txs, "lane", (t) => t.isComp, "comps", "Excessive comps", avgTicket),
    ...rateOutliers(txs, "staff", (t) => t.isVoid, "voids", "Voided tickets", avgTicket),
    ...rateOutliers(txs, "lane", (t) => t.isLost, "lost tickets", "Lost-ticket spike", 0),
    ...rateOutliers(txs, "staff", (t) => t.isLost, "lost tickets", "Lost-ticket spike", 0),
    ...dips(revSeries, "Revenue", outages.days),
  ];
  if (validated) {
    findings.push(...spikes(new Map([...daily].map(([d, v]) => [d, v.validations])), "Validations", "Validation spike"));
  }
  const dailyPts: DailyPoint[] = [...daily].map(([date, v]) => ({ date, revenue: Math.round(v.revenue), transactions: v.transactions }));
  return { kpis, breakdowns, findings, daily: dailyPts };
}

/* ------------------------------------------------------------------ */
/* Daily summary (cash) and daily activity                             */
/* ------------------------------------------------------------------ */

function analyzeDailySummary(ds: Dataset) {
  const g = {
    date: col(ds, "date"), tx: col(ds, "transactions"), revenue: col(ds, "revenue"), exp: col(ds, "cashExpected"),
    dep: col(ds, "cashDeposited"), variance: col(ds, "variance"), staff: col(ds, "staff"),
  };
  const rows = ds.rows.map((r) => {
    const ts = toTimestamp(g.date(r));
    const exp = toNumber(g.exp(r)), dep = toNumber(g.dep(r));
    const v = toNumber(g.variance(r)) ?? (exp !== null && dep !== null ? dep - exp : null);
    return { day: ts === null ? "" : dayKey(ts), tx: toNumber(g.tx(r)), revenue: toNumber(g.revenue(r)), variance: v, staff: toText(g.staff(r)) };
  }).filter((r) => r.day);
  const findings: Finding[] = [];
  const vs = rows.filter((r) => r.variance !== null);
  const kpis: Kpi[] = [];
  if (vs.length) {
    const thresh = Math.max(20, 4 * median(vs.map((r) => Math.abs(r.variance!))));
    const flagged = vs.filter((r) => Math.abs(r.variance!) > thresh);
    const net = sum(vs.map((r) => r.variance!));
    kpis.push({ key: "cashVariance", label: "Net cash over / short", value: net, format: "money", sub: `all days; ${flagged.length} day${flagged.length === 1 ? "" : "s"} flagged` });
    const shorts = flagged.filter((r) => r.variance! < 0);
    const byStaff = new Map<string, typeof shorts>();
    for (const r of shorts) if (r.staff) (byStaff.get(r.staff) ?? byStaff.set(r.staff, []).get(r.staff)!).push(r);
    const used = new Set<string>();
    for (const [staff, rs] of byStaff) {
      if (rs.length < 3) continue;
      rs.forEach((r) => used.add(r.day));
      const total = -sum(rs.map((r) => r.variance!));
      const wds = new Set(rs.map((r) => weekday(r.day)));
      const DOWN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const pattern = wds.size === 1 ? `every ${DOWN[[...wds][0]]} ` : "";
      const staffShifts = rows.filter((r) => r.staff === staff).length;
      findings.push({
        id: newId(), severity: "high", category: "Cash variance",
        title: `${money(total)} cash short across ${rs.length} days, all closed by ${staff}`,
        detail: `The deposit came up short ${pattern}on ${rs.map((r) => `${fmtDay(r.day)} (${money(-r.variance!)})`).join(", ")}. ${staff} closed all ${rs.length}${staffShifts > rs.length ? ` (of ${staffShifts} shifts they closed)` : ""}. On other days the drawer is within ${money(thresh)}. Recommend a cash audit and dual-count at close.`,
        amount: Math.round(total), dates: rs.map((r) => r.day), names: [staff],
      });
    }
    const rest = flagged.filter((r) => !used.has(r.day));
    if (rest.length) {
      const total = sum(rest.map((r) => r.variance!));
      findings.push({
        id: newId(), severity: Math.abs(total) > 300 ? "medium" : "low", category: "Cash variance",
        title: `${rest.length} day${rest.length > 1 ? "s" : ""} with cash variance over ${money(thresh)}`,
        detail: rest.map((r) => `${fmtDay(r.day)}: ${money(r.variance!)}${r.staff ? ` (${r.staff})` : ""}`).join("; ") + ".",
        amount: Math.round(Math.abs(total)), dates: rest.map((r) => r.day),
      });
    }
  }
  const daily: DailyPoint[] = rows.map((r) => ({ date: r.day, revenue: r.revenue ?? undefined, transactions: r.tx ?? undefined }));
  return { kpis, findings, daily };
}

function analyzeActivity(ds: Dataset) {
  const g = {
    date: col(ds, "date"), me: col(ds, "monthlyEntries"), te: col(ds, "transientEntries"),
    va: col(ds, "validations"), rev: col(ds, "revenue"), occ: col(ds, "occupancy"),
  };
  const rows = ds.rows.map((r) => {
    const ts = toTimestamp(g.date(r));
    return { day: ts === null ? "" : dayKey(ts), me: toNumber(g.me(r)), te: toNumber(g.te(r)), va: toNumber(g.va(r)), rev: toNumber(g.rev(r)), occ: toNumber(g.occ(r)) };
  }).filter((r) => r.day);
  const kpis: Kpi[] = [];
  const has = (k: "me" | "te" | "va" | "rev" | "occ") => rows.some((r) => r[k] !== null);
  if (has("rev")) kpis.push({ key: "revenue", label: "Transient revenue", value: sum(rows.map((r) => r.rev ?? 0)), format: "money" });
  if (has("te")) kpis.push({ key: "transient", label: "Transient entries", value: sum(rows.map((r) => r.te ?? 0)), format: "int" });
  if (has("me")) kpis.push({ key: "monthlyEntries", label: "Monthly entries", value: sum(rows.map((r) => r.me ?? 0)), format: "int" });
  if (has("va")) kpis.push({ key: "validations", label: "Validations", value: sum(rows.map((r) => r.va ?? 0)), format: "int" });
  if (has("occ")) {
    const weekdays = rows.filter((r) => r.occ !== null && weekday(r.day) >= 1 && weekday(r.day) <= 5);
    kpis.push({ key: "occupancy", label: "Peak occupancy", value: median(weekdays.map((r) => r.occ!)) / 100, format: "pct", sub: "typical weekday" });
  }
  const findings: Finding[] = [];
  const spikeDays = new Set<string>();
  if (has("va")) {
    const sp = spikes(new Map(rows.filter((r) => r.va !== null).map((r) => [r.day, r.va!])), "Validations", "Validation spike");
    sp.forEach((f) => f.dates?.forEach((d) => spikeDays.add(d)));
    if (has("rev")) {
      for (const f of sp) {
        const ds = new Set(f.dates);
        const cur = sum(rows.filter((r) => ds.has(r.day)).map((r) => r.rev ?? 0));
        const base = sum([...ds].map((d) => median(rows.filter((r) => r.day !== d && weekday(r.day) === weekday(d) && !ds.has(r.day)).map((r) => r.rev ?? 0))));
        if (base > cur) {
          f.amount = Math.round(base - cur);
          f.detail += ` Transient revenue those days was ${money(cur)} vs a normal ${money(base)}.`;
        }
      }
    }
    findings.push(...sp);
  }
  if (has("rev")) findings.push(...dips(new Map(rows.filter((r) => r.rev !== null).map((r) => [r.day, r.rev!])), "Transient revenue", spikeDays));
  const daily: DailyPoint[] = rows.map((r) => ({
    date: r.day, revenue: r.rev ?? undefined, transactions: r.te !== null ? (r.te ?? 0) + (r.me ?? 0) : undefined,
    validations: r.va ?? undefined, occupancy: r.occ ?? undefined,
  }));
  return { kpis, findings, daily };
}

/* ------------------------------------------------------------------ */
/* Entries & exits (car counts, often by hour)                         */
/* ------------------------------------------------------------------ */

function hourOf(v: Cell): number | null {
  if (typeof v === "number") {
    if (Number.isInteger(v) && v >= 0 && v <= 23) return v;
    if (v >= 0 && v < 1) return Math.floor(v * 24 + 1e-6);
    return null;
  }
  if (v instanceof Date) return v.getUTCHours();
  const s = toText(v);
  const t = parseTime(s.split(/\s*[-–]\s*/)[0]);
  if (t !== null) return Math.floor(t / 3600000);
  const m = s.match(/^(\d{1,2})\s*([ap])\.?m?\.?$/i);
  if (m) return (+m[1] % 12) + (m[2].toLowerCase() === "p" ? 12 : 0);
  return null;
}

const hourLabel = (h: number) => `${h === 0 ? 12 : h > 12 ? h - 12 : h} ${h < 12 ? "AM" : "PM"}`;

function analyzeTraffic(ds: Dataset) {
  const g = { date: col(ds, "date"), hour: col(ds, "hour"), en: col(ds, "entries"), ex: col(ds, "exits") };
  const days = new Map<string, { en: number; ex: number; hours: Map<number, { en: number; ex: number }> }>();
  let hasEn = false, hasEx = false, hasHour = false;
  for (const r of ds.rows) {
    const ts = toTimestamp(g.date(r));
    if (ts === null) continue;
    const day = dayKey(ts);
    const en = toNumber(g.en(r)), ex = toNumber(g.ex(r));
    if (en === null && ex === null) continue;
    hasEn ||= en !== null; hasEx ||= ex !== null;
    const d = days.get(day) ?? days.set(day, { en: 0, ex: 0, hours: new Map() }).get(day)!;
    d.en += en ?? 0; d.ex += ex ?? 0;
    const h = ds.mapping.hour !== null && ds.mapping.hour !== undefined ? hourOf(g.hour(r)) : null;
    if (h !== null) {
      hasHour = true;
      const hh = d.hours.get(h) ?? d.hours.set(h, { en: 0, ex: 0 }).get(h)!;
      hh.en += en ?? 0; hh.ex += ex ?? 0;
    }
  }
  const dayList = [...days.keys()].sort();
  const kpis: Kpi[] = [];
  const findings: Finding[] = [];
  const breakdowns: Breakdown[] = [];
  if (!dayList.length) return { kpis, findings, daily: [] as DailyPoint[], breakdowns };
  const totalEn = sum(dayList.map((d) => days.get(d)!.en));
  const totalEx = sum(dayList.map((d) => days.get(d)!.ex));
  if (hasEn) {
    kpis.push({ key: "entries", label: "Entries", value: totalEn, format: "int", sub: `${dayList.length} days` });
    kpis.push({ key: "entriesPerDay", label: "Avg entries / day", value: Math.round(totalEn / dayList.length), format: "int" });
  }
  if (hasEx) kpis.push({ key: "exits", label: "Exits", value: totalEx, format: "int" });

  // Busiest hours
  if (hasHour) {
    const byHour = new Map<number, number>();
    for (const d of dayList) for (const [h, v] of days.get(d)!.hours) byHour.set(h, (byHour.get(h) ?? 0) + (hasEn ? v.en : v.ex));
    const ranked = [...byHour.entries()].sort((a, b) => b[1] - a[1]);
    if (ranked.length && ranked[0][1] > 0) {
      kpis.push({ key: "peakHour", label: "Busiest hour", value: Math.round(ranked[0][1] / dayList.length), format: "int", sub: `${hasEn ? "entries" : "exits"}/day at ${hourLabel(ranked[0][0])}` });
      const tot = sum([...byHour.values()]) || 1;
      breakdowns.push({
        title: `${hasEn ? "Entries" : "Exits"} by hour of day`, dimension: "hour", countLabel: "per day",
        rows: [...byHour.entries()].sort((a, b) => a[0] - b[0]).map(([h, v]) => ({
          label: hourLabel(h), transactions: Math.round(v / dayList.length), revenue: 0, share: v / tot,
        })),
      });
    }
  }

  const normal = new Map<string, number>(); // weekday-hour -> median cars (in + out)
  if (hasHour) for (let w = 0; w < 7; w++) for (let h = 0; h < 24; h++) {
    const vals = dayList.filter((d) => weekday(d) === w).map((d) => { const v = days.get(d)!.hours.get(h); return v ? v.en + v.ex : 0; });
    if (vals.length) normal.set(`${w}-${h}`, median(vals));
  }
  const carsAt = (d: string, h: number) => { const v = days.get(d)!.hours.get(h); return v ? v.en + v.ex : 0; };
  /** The hour after which a day stayed far below normal ("from 3 PM on"), if there is one. */
  const dropStart = (d: string): number | null => {
    if (!hasHour) return null;
    const w = weekday(d);
    for (let h = 1; h < 23; h++) {
      if (carsAt(d, h) >= (normal.get(`${w}-${h}`) ?? 0) * 0.5) continue; // the drop starts in a low hour
      let before = 0, beforeN = 0, after = 0, afterN = 0;
      for (let k = 0; k < 24; k++) {
        const n = normal.get(`${w}-${k}`) ?? 0;
        if (k < h) { before += carsAt(d, k); beforeN += n; } else { after += carsAt(d, k); afterN += n; }
      }
      if (afterN >= 100 && after < afterN * 0.4 && before >= beforeN * 0.7) return h;
    }
    return null;
  };

  // 1) Days with much less traffic than normal for that weekday
  const series = new Map(dayList.map((d) => [d, hasEn ? days.get(d)!.en : days.get(d)!.ex]));
  const what = hasEn ? "Entries" : "Exits";
  if (dayList.length >= 14) {
    const edges = new Set([dayList[0], dayList[dayList.length - 1]]);
    const base = new Map<string, number>();
    const low: string[] = [];
    for (const d of dayList) {
      const b = median(dayList.filter((x) => x !== d && !edges.has(x) && weekday(x) === weekday(d)).map((x) => series.get(x)!));
      base.set(d, b);
      if (b >= 20 && series.get(d)! < b * 0.6 && !edges.has(d)) low.push(d);
    }
    for (const run of runsOfDays(low)) {
      const cur = sum(run.map((d) => series.get(d)!)), b = sum(run.map((d) => base.get(d)!));
      const start = run.length === 1 ? dropStart(run[0]) : null;
      findings.push({
        id: newId(), severity: cur < b * 0.35 ? "high" : "medium", category: "Traffic drop",
        title: `${what} down ${((1 - cur / b) * 100).toFixed(0)}% on ${fmtRange(run)}${start !== null ? `, from ${hourLabel(start)} on` : ""}`,
        detail: `${what} were ${cur.toLocaleString()} on ${fmtRange(run)} vs a normal ${Math.round(b).toLocaleString()} for those weekdays.` +
          (start !== null
            ? ` Traffic was normal until about ${hourLabel(start)}, then stayed far below usual for the rest of the day. A sudden, lasting drop like that usually means a gate, counter or lane went down, or the garage closed early. Check the logs for that afternoon.`
            : " Check for a gate or counter problem, a closure, or an event before assuming demand fell."),
        dates: run,
      });
    }
  }

  // 2) Entries and exits that don't match
  if (hasEn && hasEx && dayList.length >= 7) {
    const gaps = dayList.map((d) => days.get(d)!.en - days.get(d)!.ex);
    const typical = median(gaps.map(Math.abs));
    const bad = dayList.filter((d, i) => {
      const gap = Math.abs(gaps[i]);
      const vol = Math.max(days.get(d)!.en, days.get(d)!.ex);
      return gap >= Math.max(40, typical * 3) && gap >= vol * 0.12;
    });
    for (const d of bad) {
      const { en, ex } = days.get(d)!;
      findings.push({
        id: newId(), severity: "medium", category: "Entry / exit mismatch",
        title: `${en.toLocaleString()} entries vs ${ex.toLocaleString()} exits on ${fmtDay(d, true)}`,
        detail: `A gap of ${Math.abs(en - ex).toLocaleString()} cars; on a normal day the gap is about ${Math.round(typical)}. ${en < ex ? "More cars left than came in: an entry gate may have been up or not counting, which can mean unpaid parking." : "More cars came in than left: an exit gate may have been up or not counting, which can mean cars leaving without paying."}`,
        dates: [d],
      });
    }
    const net = totalEn - totalEx;
    if (Math.abs(net) >= Math.max(100, Math.max(totalEn, totalEx) * 0.03)) {
      findings.push({
        id: newId(), severity: "low", category: "Entry / exit mismatch",
        title: `${Math.abs(net).toLocaleString()} more ${net > 0 ? "entries than exits" : "exits than entries"} over the period`,
        detail: `${totalEn.toLocaleString()} entries vs ${totalEx.toLocaleString()} exits from ${fmtDay(dayList[0])} to ${fmtDay(dayList[dayList.length - 1])}. Over a month these should roughly balance; a steady gap points to a lane that under-counts.`,
      });
    }
  }

  // 3) Normally busy hours that dropped to zero (equipment down)
  if (hasHour && dayList.length >= 7) {
    for (const d of dayList) {
      const dead: number[] = [];
      for (let h = 0; h < 24; h++) {
        const v = days.get(d)!.hours.get(h);
        if (!v) continue;
        if (v.en + v.ex === 0 && (normal.get(`${weekday(d)}-${h}`) ?? 0) >= 15) dead.push(h);
      }
      if (dead.length) {
        const usual = Math.round(sum(dead.map((h) => normal.get(`${weekday(d)}-${h}`)!)));
        findings.push({
          id: newId(), severity: dead.length >= 2 ? "high" : "medium", category: "Counter / gate outage",
          title: `No cars recorded ${dead.length === 1 ? `at ${hourLabel(dead[0])}` : `for ${dead.length} busy hours`} on ${fmtDay(d, true)}`,
          detail: `Zero entries and exits during ${dead.map(hourLabel).join(", ")}, when ${dead.length === 1 ? "that hour normally sees" : "those hours normally see"} about ${usual.toLocaleString()} cars in total. Check whether the gates or counters were down, and whether cars got through without a ticket.`,
          dates: [d],
        });
      }
    }
  }

  const daily: DailyPoint[] = dayList.map((d) => ({
    date: d, entries: hasEn ? days.get(d)!.en : undefined, exits: hasEx ? days.get(d)!.ex : undefined,
    transactions: hasEn ? days.get(d)!.en : days.get(d)!.ex,
  }));
  return { kpis, findings, daily, breakdowns };
}

/* ------------------------------------------------------------------ */
/* Monthly parkers                                                     */
/* ------------------------------------------------------------------ */

const LATE_GRACE = 5;

export function analyzeMonthly(roster: Dataset | undefined, payments: Dataset | undefined, asOf: string) {
  const parkers = new Map<string, MonthlyParker>();
  const keyOf = (id: string, name: string) => (id || name).toLowerCase();
  if (roster) {
    const g = Object.fromEntries(Object.keys(roster.mapping).map((k) => [k, col(roster, k)]));
    for (const r of roster.rows) {
      const id = toText(g.parkerId(r)), name = toText(g.name(r));
      if (!id && !name) continue;
      const start = toTimestamp(g.start(r)), end = toTimestamp(g.end(r));
      parkers.set(keyOf(id, name), {
        id: id || name, name: name || id, company: toText(g.company(r)) || undefined, email: toText(g.email(r)) || undefined,
        vehicle: toText(g.vehicle(r)) || undefined, plate: toText(g.plate(r)) || undefined, spaceType: toText(g.spaceType(r)) || undefined,
        rate: toNumber(g.rate(r)) ?? undefined, start: start !== null ? dayKey(start) : undefined, end: end !== null ? dayKey(end) : undefined,
        card: toText(g.card(r)) || undefined, cardStatus: toText(g.cardStatus(r)) || undefined, status: toText(g.status(r)) || "Active",
        flags: [], balance: 0, lateCount: 0, monthsBilled: 0,
      });
    }
  }
  type Inv = { period: string; due: number; dueDay: string; paidDay: string | null; paid: number };
  const invoices = new Map<string, Inv[]>();
  if (payments) {
    const g = Object.fromEntries(Object.keys(payments.mapping).map((k) => [k, col(payments, k)]));
    for (const r of payments.rows) {
      const id = toText(g.parkerId(r)), name = toText(g.name(r));
      const dueTs = toTimestamp(g.dueDate(r));
      if ((!id && !name) || dueTs === null) continue;
      const k = keyOf(id, name);
      if (!parkers.has(k)) {
        parkers.set(k, { id: id || name, name: name || id, status: "Active", flags: [], balance: 0, lateCount: 0, monthsBilled: 0 });
      }
      const paidTs = toTimestamp(g.paidDate(r));
      const due = toNumber(g.due(r)) ?? parkers.get(k)!.rate ?? 0;
      const paidAmt = toNumber(g.paid(r)) ?? (paidTs !== null ? due : 0);
      (invoices.get(k) ?? invoices.set(k, []).get(k)!).push({
        period: toText(g.period(r)) || dayKey(dueTs).slice(0, 7), due, dueDay: dayKey(dueTs),
        paidDay: paidTs !== null && paidAmt > 0 ? dayKey(paidTs) : null, paid: paidAmt,
      });
    }
  }
  let currentDue = "";
  for (const list of invoices.values()) for (const i of list) if (i.dueDay <= asOf && i.dueDay > currentDue) currentDue = i.dueDay;
  const currentPeriodLabel = (() => {
    for (const list of invoices.values()) for (const i of list) if (i.dueDay === currentDue) return i.period;
    return "";
  })();

  for (const [k, p] of parkers) {
    const inactive = /cancel|inactive|closed|terminat|suspend/i.test(p.status) || /disabl|deactiv|revoked/i.test(p.cardStatus ?? "");
    const list = (invoices.get(k) ?? []).filter((i) => i.dueDay <= asOf).sort((a, b) => a.dueDay.localeCompare(b.dueDay));
    p.monthsBilled = list.length;
    p.balance = Math.max(0, sum(list.map((i) => i.due - i.paid)));
    const isLate = (i: Inv) => i.paidDay ? daysBetween(i.dueDay, i.paidDay) > LATE_GRACE : daysBetween(i.dueDay, asOf) > LATE_GRACE;
    const last6 = list.slice(-6);
    p.lateCount = last6.filter(isLate).length;
    if (inactive) continue;
    const unpaid = list.filter((i) => !i.paidDay && i.due - i.paid > 0.5);
    const oldest = unpaid[0];
    const cardActive = !/disabl|deactiv|revoked|inactive/i.test(p.cardStatus ?? "active");
    if (oldest && daysBetween(oldest.dueDay, asOf) >= 45) {
      p.flags.push({
        code: "pastdue", label: cardActive ? "Past due, card active" : "Past due", severity: "high",
        reason: `Unpaid since ${fmtDay(oldest.dueDay)} (${unpaid.length} invoices, ${money(p.balance)} owed)${cardActive ? " and the access card still works" : ""}.`,
      });
    } else {
      const cur = list.find((i) => i.dueDay === currentDue);
      if (cur && !cur.paidDay && daysBetween(cur.dueDay, asOf) > LATE_GRACE) {
        p.flags.push({ code: "late", label: "Late this month", severity: "medium", reason: `${cur.period} invoice (${money(cur.due)}) unpaid, ${daysBetween(cur.dueDay, asOf)} days past due.` });
      }
    }
    if (p.lateCount >= 4) {
      p.flags.push({ code: "repeat", label: "Repeat late payer", severity: "medium", reason: `Late on ${p.lateCount} of the last ${last6.length} invoices.` });
    }
    const partial = list.slice(-3).find((i) => i.paid > 0 && i.paid < i.due - 0.5);
    if (partial) {
      p.flags.push({ code: "partial", label: "Partial payment", severity: "medium", reason: `Paid ${money(partial.paid)} of ${money(partial.due)} for ${partial.period}; ${money(partial.due - partial.paid)} still owed.` });
    }
    if (p.end) {
      const left = daysBetween(asOf, p.end);
      if (left >= 0 && left <= 30) {
        p.flags.push({ code: "ending", label: "Contract ending", severity: "low", reason: `Contract ends ${fmtDay(p.end)} (${left} days). Reach out about renewal.` });
      }
    }
  }

  const all = [...parkers.values()];
  const active = all.filter((p) => !/cancel|inactive|closed|terminat/i.test(p.status));
  const mrr = sum(active.map((p) => p.rate ?? 0));
  const withFlag = (code: string) => active.filter((p) => p.flags.some((f) => f.code === code));
  const names = (ps: MonthlyParker[]) => ps.map((p) => p.name);
  const findings: Finding[] = [];
  const pastdue = withFlag("pastdue");
  if (pastdue.length) {
    const owed = sum(pastdue.map((p) => p.balance));
    findings.push({
      id: newId(), severity: "high", category: "Monthly collections",
      title: `${pastdue.length} parker${pastdue.length > 1 ? "s" : ""} 45+ days past due with access still active`,
      detail: `${pastdue.map((p) => `${p.name} (${p.id}): ${p.flags.find((f) => f.code === "pastdue")!.reason}`).join(" ")} Suspend access or collect before next month.`,
      amount: Math.round(owed), names: names(pastdue),
    });
  }
  const late = withFlag("late");
  const unpaidCurrent = [...pastdue.filter((p) => (invoices.get(keyOf(p.id, p.name)) ?? []).some((i) => i.dueDay === currentDue && !i.paidDay)), ...late];
  if (unpaidCurrent.length) {
    findings.push({
      id: newId(), severity: unpaidCurrent.length >= 5 ? "high" : "medium", category: "Monthly collections",
      title: `${unpaidCurrent.length} parkers haven't paid for ${currentPeriodLabel || "this month"}`,
      detail: `Unpaid: ${unpaidCurrent.map((p) => p.name).join(", ")}. Total outstanding for the month: ${money(sum(unpaidCurrent.map((p) => p.rate ?? 0)))}.`,
      amount: Math.round(sum(unpaidCurrent.map((p) => p.rate ?? 0))), names: names(unpaidCurrent),
    });
  }
  const repeat = withFlag("repeat");
  if (repeat.length) {
    findings.push({
      id: newId(), severity: "medium", category: "Monthly collections",
      title: `${repeat.length} repeat late payer${repeat.length > 1 ? "s" : ""}`,
      detail: repeat.map((p) => `${p.name}: late ${p.lateCount} of last 6 invoices`).join("; ") + ". Consider autopay or a late fee.",
      names: names(repeat),
    });
  }
  const partial = withFlag("partial");
  if (partial.length) {
    findings.push({
      id: newId(), severity: "medium", category: "Monthly collections",
      title: `${partial.length} partial payment${partial.length > 1 ? "s" : ""} with a balance left`,
      detail: partial.map((p) => `${p.name}: ${p.flags.find((f) => f.code === "partial")!.reason}`).join(" "),
      amount: Math.round(sum(partial.map((p) => p.balance))), names: names(partial),
    });
  }
  const ending = withFlag("ending");
  if (ending.length) {
    findings.push({
      id: newId(), severity: "low", category: "Renewals",
      title: `${ending.length} monthly contract${ending.length > 1 ? "s" : ""} ending in the next 30 days`,
      detail: ending.map((p) => `${p.name} (${fmtDay(p.end!)})`).join(", ") + ". Send renewal offers now.",
      amount: Math.round(sum(ending.map((p) => p.rate ?? 0))), names: names(ending),
    });
  }
  const collected = sum([...invoices.values()].flat().filter((i) => i.dueDay === currentDue).map((i) => i.paid));
  const kpis: Kpi[] = [
    { key: "activeParkers", label: "Active monthly parkers", value: active.length, format: "int" },
    { key: "mrr", label: "Monthly recurring revenue", value: mrr, format: "money" },
  ];
  if (invoices.size) {
    kpis.push({ key: "collected", label: `Collected ${currentPeriodLabel}`.trim(), value: collected, format: "money" });
    kpis.push({ key: "outstanding", label: "Outstanding balance", value: sum(all.map((p) => p.balance)), format: "money", sub: `${all.filter((p) => p.balance > 0).length} parkers` });
  }
  return { parkers: all, activeCount: active.length, mrr, currentPeriod: currentPeriodLabel, findings, kpis };
}

/* ------------------------------------------------------------------ */
/* Put it together                                                     */
/* ------------------------------------------------------------------ */

const SEV_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** The "as of" date: today, but never more than a day past the newest data, so old exports still read sensibly. */
export function computeAsOf(datasets: Dataset[], today = new Date()): string {
  const todayKey = dayKey(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  let max = "";
  for (const ds of datasets) {
    const fields = ds.kind === "transactions" ? ["entry"] : ds.kind === "payments" ? ["dueDate", "paidDate"]
      : ds.kind === "daily_summary" || ds.kind === "daily_activity" || ds.kind === "traffic" ? ["date"] : [];
    for (const fkey of fields) {
      const i = ds.mapping[fkey];
      if (i === null || i === undefined) continue;
      for (const r of ds.rows) {
        const ts = toTimestamp(r[i]);
        if (ts === null) continue;
        const d = dayKey(ts);
        if (d <= todayKey && d > max) max = d;
      }
    }
  }
  return max ? (addDays(max, 1) < todayKey ? addDays(max, 1) : todayKey) : todayKey;
}

export function analyzeProperty(property: string, datasets: Dataset[], asOf: string): PropertyReport {
  const kpis: Kpi[] = [];
  const findings: Finding[] = [];
  const breakdowns: Breakdown[] = [];
  let daily: DailyPoint[] = [];
  const tx = datasets.filter((d) => d.kind === "transactions");
  const summary = datasets.filter((d) => d.kind === "daily_summary");
  const activity = datasets.filter((d) => d.kind === "daily_activity");
  for (const ds of tx) {
    const r = analyzeTransactions(ds);
    kpis.push(...r.kpis);
    breakdowns.push(...r.breakdowns);
    findings.push(...r.findings);
    if (!daily.length) daily = r.daily;
  }
  for (const ds of summary) {
    const r = analyzeDailySummary(ds);
    kpis.push(...r.kpis.filter((k) => !kpis.some((x) => x.key === k.key)));
    findings.push(...r.findings);
    if (!daily.length) daily = r.daily;
    if (!tx.length) {
      const rev = sum(r.daily.map((d) => d.revenue ?? 0));
      if (rev) kpis.unshift({ key: "revenue", label: "Revenue", value: rev, format: "money" });
      findings.push(...dips(new Map(r.daily.filter((d) => d.revenue !== undefined).map((d) => [d.date, d.revenue!])), "Revenue", new Set()));
    }
  }
  for (const ds of activity) {
    const r = analyzeActivity(ds);
    kpis.push(...r.kpis.filter((k) => !kpis.some((x) => x.key === k.key)));
    findings.push(...r.findings.filter((f) => !findings.some((x) => x.category === f.category && x.dates?.join() === f.dates?.join())));
    if (!daily.length) daily = r.daily;
    else {
      const byDay = new Map(r.daily.map((d) => [d.date, d]));
      daily = daily.map((d) => ({ ...d, occupancy: byDay.get(d.date)?.occupancy, validations: d.validations ?? byDay.get(d.date)?.validations }));
    }
  }
  for (const ds of datasets.filter((d) => d.kind === "traffic")) {
    const r = analyzeTraffic(ds);
    kpis.push(...r.kpis.filter((k) => !kpis.some((x) => x.key === k.key)));
    findings.push(...r.findings);
    breakdowns.push(...r.breakdowns);
    if (!daily.length) daily = r.daily;
    else {
      const byDay = new Map(r.daily.map((d) => [d.date, d]));
      daily = daily.map((d) => ({ ...d, entries: byDay.get(d.date)?.entries, exits: byDay.get(d.date)?.exits }));
    }
  }
  const roster = datasets.find((d) => d.kind === "roster");
  const payments = datasets.find((d) => d.kind === "payments");
  let monthly: PropertyReport["monthly"];
  if (roster || payments) {
    const m = analyzeMonthly(roster, payments, asOf);
    kpis.push(...m.kpis.filter((k) => !kpis.some((x) => x.key === k.key)));
    findings.push(...m.findings);
    monthly = { parkers: m.parkers, activeCount: m.activeCount, mrr: m.mrr, currentPeriod: m.currentPeriod };
  }
  daily.sort((a, b) => a.date.localeCompare(b.date));
  findings.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || (b.amount ?? 0) - (a.amount ?? 0));
  return {
    property,
    period: daily.length ? { start: daily[0].date, end: daily[daily.length - 1].date } : null,
    asOf,
    sources: [...new Set(datasets.map((d) => d.source))],
    kinds: [...new Set(datasets.map((d) => d.kind))],
    kpis, daily, breakdowns, findings, monthly,
  };
}

export function analyzeAll(datasets: Dataset[], today = new Date()): PropertyReport[] {
  const usable = datasets.filter((d) => d.kind !== "unknown");
  const asOf = computeAsOf(usable, today);
  const byProp = new Map<string, Dataset[]>();
  for (const d of usable) (byProp.get(d.property) ?? byProp.set(d.property, []).get(d.property)!).push(d);
  return [...byProp.entries()].map(([p, ds]) => analyzeProperty(p, ds, asOf));
}
