// Vercel serverless function: the only place the Claude API key is used.
// The key lives in the Vercel environment variable ANTHROPIC_API_KEY and never reaches the browser.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const MAX_FACTS = 120000; // characters of context we accept from the browser

const SYSTEM_BASE =
  "You are ParkGrid, an analyst for parking operators (valet, self-park garages, monthly parking). " +
  "You only use the data provided in <data>. Never invent numbers, names or dates. " +
  "If the data doesn't answer the question, say so plainly and suggest which export would answer it. " +
  "Write for a busy operations manager: short, specific, numbers and dates first. Use US dollars. " +
  "No markdown headings or tables. Bullets only for 2+ parallel items.";

async function callClaude(system, messages, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = body?.error?.message || `Claude API error ${r.status}`;
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  return (body.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
}

function str(v, max) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  try {
    if (b.task === "summary") {
      const facts = str(b.facts, MAX_FACTS);
      const text = await callClaude(
        SYSTEM_BASE,
        [{
          role: "user",
          content: `<data>\n${facts}\n</data>\n\nWrite "3 things to look at this week" for ${str(b.property, 200)}: exactly 3 lines, each starting with "- ", each under 30 words, most money or risk first. Each line names the problem, the number, and one concrete action. No intro, no closing.`,
        }],
        400,
      );
      res.status(200).json({ text });
      return;
    }
    if (b.task === "ask") {
      const facts = str(b.facts, MAX_FACTS);
      const history = Array.isArray(b.history) ? b.history.slice(-8) : [];
      const messages = [
        ...history
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
        { role: "user", content: str(b.question, 2000) },
      ];
      if (messages[0]?.role !== "user") messages.shift();
      const text = await callClaude(
        `${SYSTEM_BASE}\nAnswer in 1-4 sentences unless a list of names is needed. Today is ${str(b.asOf, 20)}.\n<data>\n${facts}\n</data>`,
        messages,
        700,
      );
      res.status(200).json({ text });
      return;
    }
    if (b.task === "map") {
      const text = await callClaude(
        "You map spreadsheet columns from parking systems to a fixed schema. Reply with JSON only, no prose.",
        [{
          role: "user",
          content:
            `File: ${str(b.fileName, 300)}\nColumns with sample values:\n${str(b.columns, 20000)}\n\n` +
            `Possible kinds and their fields:\n${str(b.schema, 20000)}\n\n` +
            'Pick the single best kind and map each field to a column index or null. Reply exactly as {"kind":"<kind or unknown>","mapping":{"<field>":<index or null>}}.',
        }],
        800,
      );
      let parsed = { kind: "unknown", mapping: {} };
      try {
        parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      } catch {
        /* model didn't return JSON — fall back to "unknown" so the rule-based mapping stands */
      }
      res.status(200).json(parsed);
      return;
    }
    res.status(400).json({ error: "unknown_task" });
  } catch (e) {
    res.status(e.status === 401 ? 503 : 502).json({ error: e.status === 401 ? "bad_key" : "ai_error", message: String(e.message || e) });
  }
}
