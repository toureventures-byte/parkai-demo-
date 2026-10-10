import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, UploadCloud, AlertTriangle } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useData } from "../context/DataContext";
import { aiAsk, offlineAnswer, AiUnavailableError } from "../lib/ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  offline?: boolean;
}

export default function AIAssistant() {
  const { reports, aiStatus, noteAi } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const suggestions = useMemo(() => {
    const kinds = new Set(reports.flatMap((r) => r.kinds));
    const s = ["What should I look at first across my properties?"];
    if (kinds.has("daily_summary")) s.push("Is any cash missing?");
    if (kinds.has("transactions")) s.push("Why did revenue drop, and on which days?", "Which attendant gives the most comps?");
    if (kinds.has("payments")) s.push("Who hasn't paid this month?");
    if (kinds.has("daily_activity")) s.push("Anything unusual in the daily activity report?");
    return s.slice(0, 6);
  }, [reports]);

  async function send(text: string) {
    if (!text.trim() || typing) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    const history = messages.filter((m) => !m.offline).map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    let reply: Message;
    try {
      const answer = await aiAsk(text.trim(), history, reports);
      noteAi(true);
      reply = { id: crypto.randomUUID(), role: "assistant", content: answer };
    } catch (e) {
      if (e instanceof AiUnavailableError && e.reason !== "error") noteAi(false);
      const note = e instanceof AiUnavailableError && e.reason === "error" ? "The AI service had a hiccup, so here's what the audit says:\n\n" : "";
      reply = { id: crypto.randomUUID(), role: "assistant", content: note + offlineAnswer(text, reports), offline: true };
    }
    setMessages((m) => [...m, reply]);
    setTyping(false);
  }

  if (!reports.length) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-electric-400" />
        <h1 className="mt-4 text-xl font-semibold text-white">Ask ParkGrid needs data to answer from</h1>
        <p className="mt-2 text-sm text-slate-400">Upload your exports first. Then ask anything about revenue, cash, comps, tickets or monthly parkers.</p>
        <Link to="/app/data" className="mt-6 inline-flex items-center gap-2 rounded bg-electric-200 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-electric-100">
          <UploadCloud className="h-4 w-4" /> Upload data
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        eyebrow="Ask ParkGrid"
        title="Ask anything about your parking operations"
        description={`Answers come from your uploaded data: ${reports.map((r) => r.property).join(", ")}.`}
      />

      {aiStatus === "offline" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" /> ParkGrid AI isn't connected yet. Answers are matched from the audit findings instead.
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden" padded={false}>
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-500/15">
                <Sparkles className="h-4 w-4 text-electric-300" />
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-200">
                I've read {reports.length === 1 ? "this property's" : `all ${reports.length} properties'`} data. Ask me what changed, what's missing, or who owes what.
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-500/15">
                  <Sparkles className="h-4 w-4 text-electric-300" />
                </div>
              )}
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-tr-sm bg-electric-200 text-ink"
                    : "rounded-tl-sm border border-white/[0.06] bg-white/[0.03] text-slate-200"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-500/15">
                <Sparkles className="h-4 w-4 text-electric-300" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
              </div>
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="grid grid-cols-1 gap-2 border-t border-white/[0.06] p-4 sm:grid-cols-2">
            {suggestions.map((p) => (
              <button
                key={p}
                onClick={() => void send(p)}
                className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left text-xs text-slate-300 transition-colors hover:border-electric-500/30 hover:bg-white/[0.04]"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-electric-400" />
                {p}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-3 border-t border-white/[0.06] p-4"
        >
          <Badge tone={aiStatus === "offline" ? "warning" : "electric"} className="hidden shrink-0 sm:flex">
            {aiStatus === "offline" ? "Audit only" : "Your data"}
          </Badge>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about revenue, cash, comps, tickets, late payments…"
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50"
          />
          <button
            type="submit"
            disabled={typing}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-electric-200 text-ink shadow-glow transition-colors hover:bg-electric-100 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </Card>
    </div>
  );
}
