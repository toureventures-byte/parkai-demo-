import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Car, ParkingSquare, Building2, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedPrompts = [
  { icon: Car, text: "Why was valet wait time high at noon today?" },
  { icon: ParkingSquare, text: "Summarize today's self-parking exceptions" },
  { icon: Building2, text: "Which monthly accounts are at risk of churn?" },
  { icon: TrendingUp, text: "Draft this week's revenue summary" },
];

const cannedResponses: Record<string, string> = {
  "Why was valet wait time high at noon today?":
    "Wait times peaked at 5.9 min between 12–1 PM, 38% above your 7-day average of 4.3 min. This coincided with 38 check-ins in one hour against only 3 attendants on shift (Marco, Priya, and Diego). Casey's shift doesn't start until 3 PM. Recommendation: shift Casey's start time to 11:30 AM on high-traffic days, or add a dedicated runner for the 12–2 PM lunch window — based on similar interventions at comparable properties, this typically cuts peak wait time by ~30%.",
  "Summarize today's self-parking exceptions":
    "There's 1 open exception today: EX-3301 at Via Rodeo Exit 1 (ticket SP-88219), a lost-ticket manual override by attendant K. Munoz, $12 waived, still pending manager review. Two other exceptions this week — a gate arm fault at Beverly Ct and a validation mismatch at Dayton Way — were both auto-resolved or manager-approved. Exception volume is down 40% week-over-week after the Beverly Ct sensor recalibration.",
  "Which monthly accounts are at risk of churn?":
    "3 accounts show churn risk signals: Marcus Feldman (2 failed payments in 30 days, now suspended, $425/mo at risk), and two retail staff accounts with lapsed access card usage over the last 14 days. I'd recommend a proactive billing outreach to Marcus before the account moves to formal collections, and a check-in with the retail staff accounts to confirm they're still employed at Two Rodeo.",
  "Draft this week's revenue summary":
    "Week 27 (Jun 29 – Jul 5) revenue across all products: Valet generated $85,890 across 1,364 tickets (avg ticket $63.00), up 9.2% week-over-week driven by strong weekend volume. Self Parking generated $58,710 across transient transactions, with validations accounting for $1,261 in offset revenue. Monthly recurring revenue held steady at $68,420 across 214 active accounts. Combined property parking revenue: $144,600 for the week, +7.4% vs. the prior week.",
};

const defaultResponse =
  "Here's what I found across your ParkAI data for Two Rodeo: operations are tracking normally today with no critical alerts outstanding. Ask me about valet performance, self-parking exceptions, monthly account health, or ask me to draft a report and I'll pull the relevant numbers together.";

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi Dana — I'm ParkAI Assistant. I can answer questions about valet, self parking, and monthly operations at Two Rodeo, or draft reports for you. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = cannedResponses[text] ?? defaultResponse;
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
      setTyping(false);
    }, 900);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        eyebrow="ParkAI Assistant"
        title="Ask anything about your parking operations"
        description="Grounded in live Valet, Self Parking, and Monthly data for Two Rodeo."
      />

      <Card className="flex flex-1 flex-col overflow-hidden" padded={false}>
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-6">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-electric-400 to-electric-700 shadow-glow">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-tr-sm bg-electric-600 text-white"
                    : "rounded-tl-sm border border-white/[0.06] bg-white/[0.03] text-slate-200"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-electric-400 to-electric-700 shadow-glow">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="grid grid-cols-1 gap-2 border-t border-white/[0.06] p-4 sm:grid-cols-2">
            {suggestedPrompts.map((p) => (
              <button
                key={p.text}
                onClick={() => send(p.text)}
                className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left text-xs text-slate-300 transition-colors hover:border-electric-500/30 hover:bg-white/[0.04]"
              >
                <p.icon className="h-4 w-4 shrink-0 text-electric-400" />
                {p.text}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-3 border-t border-white/[0.06] p-4"
        >
          <Badge tone="electric" className="hidden shrink-0 sm:flex">Live Data</Badge>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about wait times, revenue, exceptions, accounts…"
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50"
          />
          <button
            type="submit"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-electric-600 text-white shadow-glow transition-colors hover:bg-electric-500"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </Card>
    </div>
  );
}
