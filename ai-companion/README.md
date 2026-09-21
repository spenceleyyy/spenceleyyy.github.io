# Outpost — AI companion prototype

A small real-time colony game with a local-LLM advisor that watches the player and can point, annotate, and speak. Plain HTML/JS, no build step: open `index.html` directly or serve the folder. `?seed=123` reproduces a game.

```
index.html          page shell
css/style.css
js/game.js          rules + real-time sim: resources, workforce, tasks (window.Outpost) — no DOM
js/input-monitor.js input tracking (window.InputMonitor) — no game knowledge
js/triggers.js      TriggerEngine, default triggers, buildSnapshot
js/villagers.js     colonists as agents on the map, mirroring the workforce — presentational
js/ui.js            rendering: dashboard, workforce, task cards, village map, panels (window.UI)
js/overlay.js       the AI's layer: always-visible cursor with a home spot, one persistent annotation, speech bubble (window.Overlay)
js/llm.js           LM Studio / OpenAI-compatible chat client with tool-call parsing (window.LLMClient)
js/advisor.js       system prompt, tool schema, trigger -> call -> execute glue (window.Advisor)
js/main.js          wiring + loops; exposes window.Companion
```

## The game

Keep at least one colonist alive for 5 minutes. Villagers are the constrained resource.

| | Produces (per 10 s) | Needs |
|---|---|---|
| Farm | 8 food, **only while a farmer is assigned** | 1 energy, 0.5 materials |
| Generator | 8 energy, **only while a crew member is assigned** | 0.5 materials |
| Colonist | — | 2 food, 1 energy |

Food at zero starves a colonist every 4 s. Energy at zero halves the farms. Materials at zero for 10 s breaks a structure.

**Tasks** need idle villagers and take time. Base durations with one worker: build farm 30 s, build generator 30 s, mining run 20 s, expand habitat 40 s. With *k* workers the time divides by (0.5 + 0.5k), max 4 workers. Workers on a task are unavailable until it finishes; cost is paid up front; a mining run pays out at the end and yields less each time. Several tasks can run in parallel if you have the people.

A colonist arrives every 20 s while there is room and food and energy are above zero. Arrivals are idle until you assign them. The only random event is a dust storm (10% per 10 s cycle) that halves generator output for 10 s.

Balance from headless simulation (150 seeds per policy): never building loses 100%, random staffing and tasks wins ~10%, an inattentive player who reacts a third of the time wins ~97% with a smaller colony, a careful player ~99%.

## The village map

The centre of the screen is an SVG village drawn from game state: farms left, habitat modules and the plaza centre, generators right, the mine bottom-left, the landing pad with the ship countdown bottom-right. Unstaffed structures are drawn faded with a dotted outline; tasks under construction appear as dashed ghosts in the next slot with a progress bar; storms haze the map; blackouts dim the farms.

Colonists are agents that mirror the workforce: farmers stand at farms, the power crew at generators, task workers (orange) at the site or the mine, everyone else wanders the plaza. New arrivals walk in from the pad; starving colonists slow down and turn red.

Every entity has a stable id (`farm_1`, `gen_2`, `hab_3`, `mine`, `pad`) and `data-track="map:<id>"`. `UI.mapSummary()` hands the same entities to the LLM as ids with their state (unstaffed, building 40%…) plus colonists by job. No pixel coordinates go to the model; the advisor resolves a `target_id` to screen space when it executes a tool. That keeps the snapshot around 500 tokens.

## Input monitor and triggers

`InputMonitor` keeps summaries only: last-input time, cursor position and speed, hover dwell on `[data-track]` elements, recent clicks, and the last 10 player decisions (task starts and staffing changes) with heuristic flags.

Triggers are `{ id, description, enabled, cooldownMs, params, check(ctx, params) }` returning `null` or `{ reason, severity, key, refs }`. The engine evaluates every 500 ms plus on actions and events. A trigger re-arms when its condition clears; it is suppressed by its own cooldown and a 3 s global cooldown.

| Trigger | Fires when |
|---|---|
| `idle_trigger` | no input for 6 s while the game runs |
| `risk_trigger` | a resource empties within 40 s at the structural rate |
| `hover_trigger` | 3 s hovering a task card or staffing control without clicking |
| `mistake_pattern_trigger` | a flag appears ≥ 2× in the last 6 decisions |
| `setback_trigger` | starvation, breakdown or storm in the last 4 s |
| `idle_workers_trigger` | ≥ 2 villagers idle for 15 s while structures are unstaffed or a resource is falling |

Decision flags: `ignored_food_shortfall`, `ignored_energy_shortfall`, `expanded_with_unused_capacity`, `built_while_structures_unstaffed`, `no_idle_left_with_unstaffed_structures`, `reduced_farmers_in_deficit`, `reduced_power_in_deficit`.

## The advisor

The AI cursor is always on screen. It rests at the top-right corner of the village map with a slight idle bob, glides to whatever it points at, and drifts home again once the player acts. Only one annotation is shown at a time; a new one replaces it. Annotation and callout persist until the player starts a task or changes staffing — that moment is what counts as the advice being consumed, and it is the natural hook for a followed-vs-ignored metric later.

When a trigger fires, `Advisor.handle()` builds a snapshot (~500–600 tokens with the map), applies a minimum gap between calls (8 s default) and a busy check, then POSTs to `<server>/chat/completions` with the tool schema. The reply's first tool call is executed (a `draw_annotation` + `show_hint` pair is executed together):

| Tool | Effect |
|---|---|
| `move_cursor(target_id)` | the purple AI cursor glides to the target, with a "Look at …" callout |
| `draw_annotation(shape, target_id, label?)` | circle / arrow / highlight over the target plus a callout bubble at the cursor (the label, or the paired hint). Stays until the player acts |
| `show_hint(text)` | advice strip above the map plus a speech bubble at the cursor. Stays until the player acts |
| `do_nothing(reason)` | logged only |
| `set_staff(job, count)`, `start_task(type, workers)` | **only when "allow AI to act" is on**; logged as AI actions and excluded from the player's decision history |

`target_id` is any id from `target_ids` (`resource:food`, `action:farm`, `staff:farmers`, `task:<id>`) or the map (`map:farm_2`). Coordinates are viewport pixels. The system prompt (in `advisor.js`) carries the rules, the one-tool-per-call rule, the be-specific rule, and the last 5 hints so the model avoids repeating itself. Qwen-style `<tool_call>` text is parsed as a fallback; a short prose reply is shown as a hint.

The AI panel on the right shows connection status and model, toggles for enabled / allow-act, the minimum gap, server URL and model override (persisted in localStorage), an "Ask for advice now" button, and a log of every call with the raw request and response.

### Running with LM Studio

1. Start LM Studio, load Qwen 3.5 9B, start the server on port 1234 (default), and enable CORS in the server settings (the page is served from a different origin). The CLI works too: `~/.lmstudio/bin/lms server start`.
2. Open the page. The AI panel should show a green dot and the model id picked from `/v1/models`. Override the model name in the panel if it picks the wrong one.
3. Play, or press "Ask for advice now". The console shows `[trigger]` groups with the snapshot and `[advisor]` groups with the raw request and reply. The AI log shows prompt/completion tokens and how many were spent thinking.

**Thinking mode.** Qwen 3.5 reasons before answering, and with this model LM Studio ignores every API-side switch (`chat_template_kwargs.enable_thinking`, `/no_think`; see [lmstudio-bug-tracker #1990](https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/1990)). Measured here: 45–60 s per call, 1200 tokens of reasoning, no tool call. The client therefore prefills the assistant turn with an empty `<think></think>` block, which makes the model answer directly: ~6–9 s per call, ~40–110 completion tokens, proper `tool_calls`. "disable thinking" in the AI panel toggles this. If you would rather fix it server-side, add `{%- set enable_thinking = false %}` at the top of the model's prompt template in LM Studio.

**Reasoning leaking into the reply.** With the think block closed, the model occasionally writes its analysis as visible text instead of calling a tool (seen once: 1054 tokens, 60 s, timeout). Three guards: the system prompt ends with an explicit "respond with a tool call only" rule, which in testing made the model use proper `tool_calls` every time; `max_tokens` is capped at 300 so a ramble is cut off within ~10 s and shown as "nothing to flag"; and the snapshot carries a `facts` list (staffing, what idle villagers can do, what empties when, affordable tasks) so the model doesn't have to infer those from counts, which a 9B model gets wrong.

**Latency.** Prompt processing dominates (~1700 prompt tokens: the system prompt, the tool schema and the ~550-token snapshot). LM Studio caches the shared prefix, so calls take ~3 s once warm and ~15 s after a cache miss (first call, or after the system prompt changes). Keep the minimum gap at or above the typical call time. The timeout (60 s default) is in the panel. The idle trigger no longer calls the model on a quiet, fully staffed colony; "Ask for advice now" always does.

## Phase status

- Phase 1 (game, input monitor, triggers): done.
- Phase 2 (LLM client, tool schema, execution, thinking indicator): done.
- Phase 3 (overlay with animated cursor and fading annotations): done.
- Phase 4: rate limiting and the debug/AI panel are done; still missing a followed-vs-ignored metric for advice. `advisor.log` keeps every call with its snapshot and args, which is the input that metric needs.
