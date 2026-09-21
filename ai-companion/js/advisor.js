/* advisor.js — turns a fired trigger into an LLM call and executes the reply.
 *
 * Flow: trigger fires -> snapshot -> (rate limit, busy check) -> LM Studio ->
 * tool call -> executed against the overlay / UI / game. Keeps a short memory
 * of recent hints so the model can avoid repeating itself, and an advice log
 * for the debug panel (and, later, followed-vs-ignored analysis).
 *
 * Exposes: window.Advisor
 */
(function (global) {
  'use strict';

  const SYSTEM_PROMPT = `You are an in-game advisor watching a player run a small colony in real time. You see the same village map they do.

GAME RULES
- Goal: keep at least one colonist alive until the relief ship arrives (time.remaining_s).
- Resources drift continuously. Rates are "per 10 s". Every colonist eats 2 food and draws 1 energy per 10 s; every farm draws 1 energy; every structure costs 0.5 materials per 10 s in maintenance.
- Farms produce 8 food per 10 s ONLY while a farmer is assigned; generators produce 8 energy per 10 s ONLY while a power-crew member is assigned. Unstaffed structures produce nothing.
- Food at 0: a colonist starves every 4 s. Energy at 0: farms run at half. Materials at 0 for 10 s: a structure breaks down.
- Tasks (build farm, build generator, mining run, expand habitat) need idle villagers assigned. Base times: farm 30 s, generator 30 s, mine 20 s, expand 40 s with 1 worker; k workers divide the time by (0.5+0.5k), max 4. Workers on a task are unavailable until it finishes. Cost is paid at the start; mining pays out at the end and yields less each run.
- A colonist arrives every 20 s while there is room and food and energy are above 0. New arrivals are idle. Dust storms halve generator output for 10 s.

WHAT YOU DO
- You are called when a trigger fires (see "trigger"). Decide whether to intervene. Call ONE tool (draw_annotation may be paired with one show_hint). Never reply with prose.
- Be specific: quote the actual numbers, times and ids from the snapshot ("food empties in 25 s", "farm_3 is unstaffed", "2 idle"). Never give generic tips.
- Point at the thing that matters with draw_annotation or move_cursor using a target_id from target_ids. Use show_hint for advice that needs words; keep it under 140 characters.
- Do not repeat a hint you have already given (see recent_hints). If nothing needs attention, call do_nothing.
- The player learns best from a nudge, not a solution: name the risk and the lever, not a full plan.
- Trust the "facts" list in the snapshot: it is computed from the rules and is always correct.

OUTPUT FORMAT: respond with a tool call only. Do not write any analysis, reasoning or text before or instead of the tool call.`;

  const ADVISORY_TOOLS = [
    { type: 'function', function: { name: 'move_cursor', description: 'Glide the AI cursor to something to draw attention to it. Prefer target_id.',
      parameters: { type: 'object', properties: { target_id: { type: 'string', description: 'an id from target_ids, e.g. "resource:food", "action:farm", "staff:farmers", "map:farm_2"' } }, required: ['target_id'] } } },
    { type: 'function', function: { name: 'draw_annotation', description: 'Draw a temporary circle, arrow or highlight over a resource, task, staffing control or map entity, optionally with a short label.',
      parameters: { type: 'object', properties: { shape: { type: 'string', enum: ['circle', 'arrow', 'highlight'] }, target_id: { type: 'string', description: 'an id from target_ids' }, label: { type: 'string', description: 'max ~40 chars' } }, required: ['shape', 'target_id'] } } },
    { type: 'function', function: { name: 'show_hint', description: 'Show a short, specific advisory message (max 140 chars) that references actual numbers or ids from the state.',
      parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } } },
    { type: 'function', function: { name: 'do_nothing', description: 'Explicitly decide not to intervene.',
      parameters: { type: 'object', properties: { reason: { type: 'string' } } } } },
  ];
  const ACTION_TOOLS = [
    { type: 'function', function: { name: 'set_staff', description: 'Assign villagers to a job on behalf of the player.',
      parameters: { type: 'object', properties: { job: { type: 'string', enum: ['farmers', 'power'] }, count: { type: 'integer' } }, required: ['job', 'count'] } } },
    { type: 'function', function: { name: 'start_task', description: 'Start a task with idle villagers on behalf of the player.',
      parameters: { type: 'object', properties: { type: { type: 'string', enum: ['farm', 'gen', 'mine', 'expand'] }, workers: { type: 'integer', minimum: 1, maximum: 4 } }, required: ['type', 'workers'] } } },
  ];

  class Advisor {
    constructor({ client, game, ui, overlay, settings }) {
      this.client = client; this.game = game; this.ui = ui; this.overlay = overlay;
      // shared object: the settings panel mutates it in place
      this.settings = settings || {};
      for (const [k, v] of Object.entries({ enabled: true, allowAct: false, minIntervalS: 8, temperature: 0.3 })) if (this.settings[k] === undefined) this.settings[k] = v;
      this.recentHints = [];     // last few hint texts
      this.log = [];             // advice records
      this.calls = 0;
      this.lastCallAt = -Infinity;
      this.lastError = null;
      this.onRecord = () => {};
    }

    status() {
      const now = performance.now();
      return {
        enabled: this.settings.enabled, connected: this.client.connected, model: this.client.model, busy: this.client.busy,
        error: this.client.lastError || this.lastError, calls: this.calls,
        nextInS: Math.max(0, Math.ceil((this.settings.minIntervalS * 1000 - (now - this.lastCallAt)) / 1000)),
      };
    }

    /** Called on every trigger fire. Returns a reason string if the call was skipped. */
    async handle(entry, { force = false } = {}) {
      if (!this.settings.enabled) return 'disabled';
      if (this.client.busy) return 'busy';
      const now = performance.now();
      if (!force && now - this.lastCallAt < this.settings.minIntervalS * 1000) return 'rate-limited';
      this.lastCallAt = now; this.calls++;
      const tools = this.settings.allowAct ? [...ADVISORY_TOOLS, ...ACTION_TOOLS] : ADVISORY_TOOLS;
      const system = SYSTEM_PROMPT + (this.settings.allowAct ? '\n- You MAY also act directly with set_staff / start_task when the player is clearly stuck; say so in a hint next time.' : '');
      const user = JSON.stringify({ ...entry.snapshot, recent_hints: this.recentHints.slice(-5) });
      const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
      const rec = { at: Date.now(), trigger: entry.trigger, reason: entry.reason, request: { messages, tools: tools.map(t => t.function.name) } };
      this.ui.setThinking(true); this.overlay.setThinking(true);
      try {
        const res = await this.client.complete({ messages, tools, temperature: this.settings.temperature, noThink: this.settings.noThink !== false });
        rec.ms = res.ms; rec.response = res.raw; rec.usage = res.usage; rec.reasoningTokens = res.reasoningTokens;
        if (res.reasoningTokens) console.warn(`[advisor] model spent ${res.reasoningTokens} tokens thinking; disable thinking in LM Studio (see README)`);
        // Execute the first call; allow a second only when it is the natural annotation + hint pair.
        const calls = res.toolCalls.slice(0, 1);
        const second = res.toolCalls[1];
        if (second && this.settings.maxToolCalls !== 1 && ((calls[0].name === 'draw_annotation' && second.name === 'show_hint') || (calls[0].name === 'show_hint' && second.name === 'draw_annotation'))) calls.push(second);
        const call = calls[0];
        if (!call) {
          // model answered in prose: treat a short answer as a hint
          if (res.text && res.text.length <= 200) { rec.tool = 'show_hint'; rec.args = { text: res.text, _fallback: true }; this.execute(rec.tool, rec.args, entry); }
          else { rec.tool = 'do_nothing'; rec.args = { reason: res.reasoningTokens ? `reply was all reasoning (${res.reasoningTokens} tokens), no tool call` : res.text ? 'model wrote analysis instead of a tool call (cut off)' : 'no tool call in reply' }; this.execute('do_nothing', rec.args, entry); }
        } else {
          rec.tool = calls.map(c => c.name).join('+'); rec.args = calls.length === 1 ? call.args : calls.map(c => c.args);
          rec.result = calls.map(c => this.execute(c.name, c.args, entry)).join(' ; ');
        }
      } catch (err) {
        rec.error = err.message || String(err); this.lastError = rec.error;
        const hint = /Failed to fetch|NetworkError|Load failed/.test(rec.error)
          ? `Can't reach LM Studio at ${this.client.baseUrl}. Is the server running with CORS enabled?`
          : /timeout/.test(rec.error) ? `LM Studio took too long (${rec.error}). Check the model isn't thinking; see the AI log.` : `LM Studio error: ${rec.error}`;
        this.ui.showHint(hint, 'error');
      } finally {
        this.ui.setThinking(false); this.overlay.setThinking(false);
        this.lastCallAt = performance.now();   // the minimum gap counts from the end of a call
      }
      this.log.push(rec); if (this.log.length > 50) this.log.shift();
      this.onRecord(rec);
      return rec;
    }

    svgHasAnnotation() { return !!this.overlay.svg.querySelector('.ann:not(.fade)'); }

    /** Resolve a tool's target to a viewport rect. */
    _rect(args) {
      if (args.target_id) { const r = this.ui.targetRect(args.target_id); if (r) return r; }
      if (Number.isFinite(args.x) && Number.isFinite(args.y)) return { x: args.x, y: args.y, w: 40, h: 40 };
      return null;
    }

    execute(name, args = {}, entry) {
      const g = this.game;
      switch (name) {
        case 'move_cursor': { const r = this._rect(args); if (!r) return 'no target'; this.overlay.moveCursor(r.x + r.w * 0.3, r.y + r.h * 0.3); this.overlay.say(`Look at ${args.target_id || 'this'}.`); this.ui.showHint(`Look at ${args.target_id || 'the cursor'}.`, 'quiet'); return `cursor -> ${args.target_id || `${r.x},${r.y}`}`; }
        case 'draw_annotation': {
          const r = this._rect(args); if (!r) return 'no target';
          this.overlay.moveCursor(r.x + r.w * 0.3, r.y + r.h * 0.3);
          this.overlay.annotate({ shape: args.shape || 'circle', rect: r, label: (args.label || '').slice(0, 48) });
          // every annotation gets a callout from the cursor; a paired show_hint will overwrite it with the full text
          const callout = args.label ? args.label : `Look at ${args.target_id || 'this'}.`;
          this.overlay.say(callout);
          if (args.label) { this.recentHints.push(args.label); this.ui.showHint(`${args.label} (${args.target_id || 'see marker'})`); }
          else this.ui.showHint(callout, 'quiet');
          return `${args.shape} on ${args.target_id || `${r.x},${r.y}`}`;
        }
        case 'show_hint': {
          const text = String(args.text || '').slice(0, 160);
          if (!text) return 'empty hint';
          this.recentHints.push(text);
          this.ui.showHint(text);
          // point at whatever the trigger referenced if the cursor isn't already on something
          const ref = entry && entry.refs && entry.refs[0]; const r = ref && this.overlay.atHome ? this.ui.targetRect(ref) : null;
          if (r) this.overlay.moveCursor(r.x + r.w * 0.3, r.y + r.h * 0.3);
          this.overlay.say(text);
          return 'hint shown';
        }
        case 'do_nothing': if (!this.overlay.atHome && !this.svgHasAnnotation()) this.overlay.goHome(); this.ui.showHint(`Nothing to flag right now${args.reason ? ': ' + String(args.reason).slice(0, 100) : ''}.`, 'quiet'); return `nothing (${args.reason || ''})`;
        case 'set_staff': {
          if (!this.settings.allowAct) return 'acting disabled';
          const e = g.setStaff(args.job, args.count, 'ai'); return e ? e.text : 'no change';
        }
        case 'start_task': {
          if (!this.settings.allowAct) return 'acting disabled';
          const e = g.startTask(args.type, args.workers, 'ai'); return e ? e.text : 'could not start';
        }
        default: return `unknown tool ${name}`;
      }
    }
  }

  Advisor.SYSTEM_PROMPT = SYSTEM_PROMPT;
  Advisor.ADVISORY_TOOLS = ADVISORY_TOOLS;
  Advisor.ACTION_TOOLS = ACTION_TOOLS;
  global.Advisor = Advisor;
})(window);
