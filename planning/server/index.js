import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import twilio from "twilio";
import cron from "node-cron";
import "dotenv/config";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// ── Clients ───────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ ok: true }));

// ═════════════════════════════════════════════════════════════════════════════
// DATA API — initiatives, features, subtasks
// ═════════════════════════════════════════════════════════════════════════════

// GET full state
app.get("/api/state", async (req, res) => {
  const [{ data: initiatives }, { data: features }, { data: subtasks }] =
    await Promise.all([
      supabase.from("initiatives").select("*").order("created_at"),
      supabase.from("features").select("*").order("created_at"),
      supabase.from("subtasks").select("*").order("created_at"),
    ]);
  res.json({ initiatives: initiatives ?? [], features: features ?? [], subtasks: subtasks ?? [] });
});

// PUT full state (bulk replace — mirrors the existing import/export pattern)
app.put("/api/state", async (req, res) => {
  const { initiatives = [], features = [], subtasks = [] } = req.body;
  // Delete all then re-insert (simple for single-user app)
  await supabase.from("subtasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("features").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("initiatives").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (initiatives.length) await supabase.from("initiatives").insert(initiatives);
  if (features.length) await supabase.from("features").insert(features);
  if (subtasks.length) await supabase.from("subtasks").insert(subtasks);
  res.json({ ok: true });
});

// Individual CRUD — initiatives
app.post("/api/initiatives", async (req, res) => {
  const { data, error } = await supabase.from("initiatives").insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
app.patch("/api/initiatives/:id", async (req, res) => {
  const { data, error } = await supabase.from("initiatives").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
app.delete("/api/initiatives/:id", async (req, res) => {
  await supabase.from("subtasks").delete().in(
    "feature_id",
    (await supabase.from("features").select("id").eq("initiative_id", req.params.id)).data?.map(f => f.id) ?? []
  );
  await supabase.from("features").delete().eq("initiative_id", req.params.id);
  await supabase.from("initiatives").delete().eq("id", req.params.id);
  res.json({ ok: true });
});

// Individual CRUD — features
app.post("/api/features", async (req, res) => {
  const { data, error } = await supabase.from("features").insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
app.patch("/api/features/:id", async (req, res) => {
  const { data, error } = await supabase.from("features").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
app.delete("/api/features/:id", async (req, res) => {
  await supabase.from("subtasks").delete().eq("feature_id", req.params.id);
  await supabase.from("features").delete().eq("id", req.params.id);
  res.json({ ok: true });
});

// Individual CRUD — subtasks
app.post("/api/subtasks", async (req, res) => {
  const { data, error } = await supabase.from("subtasks").insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
app.patch("/api/subtasks/:id", async (req, res) => {
  const { data, error } = await supabase.from("subtasks").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
app.delete("/api/subtasks/:id", async (req, res) => {
  await supabase.from("subtasks").delete().eq("id", req.params.id);
  res.json({ ok: true });
});

// ═════════════════════════════════════════════════════════════════════════════
// CLAUDE CHAT API
// ═════════════════════════════════════════════════════════════════════════════

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body; // [{role, content}]

  // Pull current state to give Claude full context
  const [{ data: initiatives }, { data: features }, { data: subtasks }] =
    await Promise.all([
      supabase.from("initiatives").select("*").order("created_at"),
      supabase.from("features").select("*").order("created_at"),
      supabase.from("subtasks").select("*").order("created_at"),
    ]);

  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `You are a smart planning assistant embedded in the Northstar planning dashboard. 
You have full access to the user's current projects, tasks, and deadlines.

Today's date: ${today}

CURRENT STATE:
Initiatives (projects): ${JSON.stringify(initiatives, null, 2)}
Features (tasks within projects): ${JSON.stringify(features, null, 2)}
Subtasks (with deadlines and status): ${JSON.stringify(subtasks, null, 2)}

You can answer questions about the user's workload, suggest prioritization, summarize what's due soon, 
flag things that look overdue, or recommend what to focus on today.

If the user asks you to ADD, UPDATE, or DELETE items, respond with a JSON action block in this exact format 
(alongside your normal message):

<action>
{
  "type": "create_subtask" | "update_subtask" | "delete_subtask" | "create_feature" | "update_feature" | "create_initiative" | "update_initiative",
  "data": { ...fields }
}
</action>

For updates include the "id" field. For creates, omit the id (server generates it).
Only include an action block if the user explicitly asks you to make a change.

Be concise, direct, and helpful. You know this user is a UW-Madison researcher working on multiple 
simultaneous projects including academic papers, exoskeleton studies, and HRI research.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].text;

    // Parse any action blocks
    const actionMatch = text.match(/<action>([\s\S]*?)<\/action>/);
    let action = null;
    let cleanText = text.replace(/<action>[\s\S]*?<\/action>/g, "").trim();

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim());
        // Execute the action
        await executeAction(action);
      } catch (e) {
        console.error("Action parse error:", e);
      }
    }

    res.json({ message: cleanText, action });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Claude API error" });
  }
});

async function executeAction(action) {
  const { type, data } = action;
  const { id, ...fields } = data;

  switch (type) {
    case "create_subtask":
      await supabase.from("subtasks").insert({ id: crypto.randomUUID(), ...fields });
      break;
    case "update_subtask":
      await supabase.from("subtasks").update(fields).eq("id", id);
      break;
    case "delete_subtask":
      await supabase.from("subtasks").delete().eq("id", id);
      break;
    case "create_feature":
      await supabase.from("features").insert({ id: crypto.randomUUID(), ...fields });
      break;
    case "update_feature":
      await supabase.from("features").update(fields).eq("id", id);
      break;
    case "create_initiative":
      await supabase.from("initiatives").insert({ id: crypto.randomUUID(), ...fields });
      break;
    case "update_initiative":
      await supabase.from("initiatives").update(fields).eq("id", id);
      break;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SMS — daily summary
// ═════════════════════════════════════════════════════════════════════════════

async function sendDailySummary() {
  if (!process.env.TWILIO_PHONE_FROM || !process.env.TWILIO_PHONE_TO) return;

  const [{ data: initiatives }, { data: features }, { data: subtasks }] =
    await Promise.all([
      supabase.from("initiatives").select("*"),
      supabase.from("features").select("*"),
      supabase.from("subtasks").select("*"),
    ]);

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `You are a daily briefing assistant. Based on this project data, write a concise SMS-style 
daily summary for Rob. Max 300 characters. Focus on: what's due today or in the next 3 days, 
anything overdue, and one key priority to focus on. Be direct, no fluff.

Today: ${today}
Initiatives: ${JSON.stringify(initiatives)}
Features: ${JSON.stringify(features)}
Subtasks: ${JSON.stringify(subtasks)}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = response.content[0].text.slice(0, 1600); // Twilio limit

  await twilioClient.messages.create({
    body: `📋 Northstar daily:\n${summary}`,
    from: process.env.TWILIO_PHONE_FROM,
    to: process.env.TWILIO_PHONE_TO,
  });

  console.log("Daily summary sent:", summary);
}

// Schedule at 8am every day (server timezone)
cron.schedule("0 8 * * *", sendDailySummary);

// Manual trigger endpoint (for testing)
app.post("/api/send-summary", async (req, res) => {
  try {
    await sendDailySummary();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Northstar server running on ${PORT}`));
