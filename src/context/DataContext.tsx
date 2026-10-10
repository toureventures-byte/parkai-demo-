import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Dataset, DatasetKind, PropertyReport } from "../lib/types";
import { readFile } from "../lib/parse";
import { detectDataset, remapAs, requiredMet, FIELDS } from "../lib/detect";
import { analyzeAll } from "../lib/analyze";
import { aiMap, aiSummary, autoSummary, AiUnavailableError } from "../lib/ai";
import { saveFile, removeFile, clearFiles, loadFiles } from "../lib/store";

export type AiStatus = "unknown" | "online" | "offline";

interface Summary {
  text: string;
  by: "ai" | "auto";
  loading: boolean;
}

interface DataState {
  datasets: Dataset[];
  reports: PropertyReport[];
  reading: string[];
  errors: { file: string; message: string }[];
  aiStatus: AiStatus;
  summaries: Record<string, Summary>;
  addFiles: (files: File[]) => Promise<void>;
  loadSample: () => Promise<void>;
  removeDataset: (id: string) => void;
  setProperty: (id: string, property: string) => void;
  setKind: (id: string, kind: DatasetKind) => void;
  setMapping: (id: string, field: string, column: number | null) => void;
  clearAll: () => void;
  ensureSummary: (property: string) => void;
  noteAi: (ok: boolean) => void;
}

const Ctx = createContext<DataState | null>(null);

export const SAMPLE_FILES = [
  "1_Bayfront-Grand-Hotel_Valet-Tickets_Aug10-Oct8.csv",
  "2_Harbor-Street-Self-Park_PARCS-Export_Aug10-Oct8.xlsx",
  "3_Midtown-Plaza-Garage_Monthly-Roster-and-Payments.xlsx",
  "4_Midtown-Plaza-Garage_Daily-Activity-Report_Aug10-Oct8.pdf",
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [reading, setReading] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ file: string; message: string }[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatus>("unknown");
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const aiStatusRef = useRef<AiStatus>("unknown");

  const noteAi = useCallback((ok: boolean) => {
    aiStatusRef.current = ok ? "online" : "offline";
    setAiStatus(aiStatusRef.current);
  }, []);

  const reports = useMemo(() => analyzeAll(datasets), [datasets]);

  /** Ask the AI to map a file the rules couldn't fully understand. */
  const aiImprove = useCallback(async (ds: Dataset): Promise<Dataset> => {
    const needsHelp = ds.kind === "unknown" || ds.confidence < 0.85;
    if (!needsHelp || aiStatusRef.current === "offline") return ds;
    try {
      const res = await aiMap(ds);
      noteAi(true);
      const kind = (res.kind in FIELDS ? res.kind : "unknown") as DatasetKind;
      if (kind === "unknown") return ds;
      const mapping: Record<string, number | null> = {};
      for (const fdef of FIELDS[kind as keyof typeof FIELDS]) {
        const v = res.mapping?.[fdef.key];
        mapping[fdef.key] = typeof v === "number" && v >= 0 && v < ds.headers.length ? v : null;
      }
      if (!requiredMet(kind, mapping)) return ds;
      return { ...ds, kind, mapping, mappedBy: "ai", confidence: 0.9 };
    } catch (e) {
      if (e instanceof AiUnavailableError && e.reason !== "error") noteAi(false);
      return ds;
    }
  }, [noteAi]);

  const ingest = useCallback(async (files: File[], persist = true) => {
    setReading((r) => [...r, ...files.map((f) => f.name)]);
    await Promise.all(files.map(async (file) => {
      try {
        const tables = await readFile(file);
        if (!tables.length) throw new Error("No table found in this file.");
        const detected = await Promise.all(tables.map((t) => aiImprove(detectDataset(t))));
        setDatasets((prev) => [...prev.filter((d) => d.source !== file.name), ...detected]);
        if (persist) void saveFile(file);
        setErrors((e) => e.filter((x) => x.file !== file.name));
      } catch (e) {
        setErrors((errs) => [...errs.filter((x) => x.file !== file.name), { file: file.name, message: e instanceof Error ? e.message : String(e) }]);
      } finally {
        setReading((r) => r.filter((n) => n !== file.name));
      }
    }));
  }, [aiImprove]);

  // Restore files saved in this browser after a page refresh.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    void loadFiles().then((files) => { if (files.length) void ingest(files, false); });
  }, [ingest]);

  const loadSample = useCallback(async () => {
    const files = await Promise.all(SAMPLE_FILES.map(async (name) => {
      const blob = await (await fetch(`/sample/${name}`)).blob();
      return new File([blob], name, { type: blob.type });
    }));
    await ingest(files);
  }, [ingest]);

  const update = (id: string, fn: (d: Dataset) => Dataset) => setDatasets((ds) => ds.map((d) => (d.id === id ? fn(d) : d)));

  const requested = useRef(new Set<string>());
  const ensureSummary = useCallback((property: string) => {
    const report = reports.find((r) => r.property === property);
    if (!report) return;
    const key = `${property}|${report.findings.map((f) => f.title).join("|")}`;
    if (requested.current.has(key)) return;
    requested.current.add(key);
    const willAsk = aiStatusRef.current !== "offline";
    setSummaries((s) => ({ ...s, [key]: { text: autoSummary(report), by: "auto", loading: willAsk } }));
    if (!willAsk) return;
    aiSummary(report)
      .then((text) => {
        noteAi(true);
        setSummaries((cur) => ({ ...cur, [key]: { text, by: "ai", loading: false } }));
      })
      .catch((e) => {
        if (e instanceof AiUnavailableError && e.reason !== "error") noteAi(false);
        setSummaries((cur) => ({ ...cur, [key]: { ...cur[key], loading: false } }));
      });
  }, [reports, noteAi]);

  const summariesByProperty = useMemo(() => {
    const out: Record<string, Summary> = {};
    for (const r of reports) {
      const key = `${r.property}|${r.findings.map((f) => f.title).join("|")}`;
      if (summaries[key]) out[r.property] = summaries[key];
    }
    return out;
  }, [reports, summaries]);

  const value: DataState = {
    datasets, reports, reading, errors, aiStatus, summaries: summariesByProperty,
    addFiles: (files) => ingest(files),
    loadSample,
    removeDataset: (id) => setDatasets((ds) => {
      const gone = ds.find((d) => d.id === id);
      const rest = ds.filter((d) => d.id !== id);
      if (gone && !rest.some((d) => d.source === gone.source)) void removeFile(gone.source);
      return rest;
    }),
    setProperty: (id, property) => update(id, (d) => ({ ...d, property })),
    setKind: (id, kind) => update(id, (d) => remapAs(d, kind)),
    setMapping: (id, field, column) => update(id, (d) => ({ ...d, mapping: { ...d.mapping, [field]: column }, mappedBy: "user" })),
    clearAll: () => { setDatasets([]); setErrors([]); setSummaries({}); requested.current.clear(); void clearFiles(); },
    ensureSummary,
    noteAi,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData must be used within DataProvider");
  return c;
}
