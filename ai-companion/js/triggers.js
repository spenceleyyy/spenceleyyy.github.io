/* triggers.js — trigger engine + default trigger set + state snapshot builder.
 *
 * A trigger is { id, description, enabled, cooldownMs, params, check(ctx, params) }.
 * check() returns null (no fire) or { reason, severity, key, refs }.
 *   - key: identity of the situation. A trigger will not re-fire while its
 *     condition stays true with the same key; when check() returns null the
 *     trigger re-arms, so a resource that dips a second time fires again.
 *   - refs: ids of UI/map targets relevant to the fire (for later annotation)
 *
 * Exposes: window.TriggerEngine, window.defaultTriggers, window.buildSnapshot
 */
(function (global) {
  'use strict';

  class TriggerEngine {
    constructor({ intervalMs = 500, globalCooldownMs = 0, onFire = () => {}, context = {} } = {}) {
      this.intervalMs = intervalMs;
      this.globalCooldownMs = globalCooldownMs;
      this.onFire = onFire;
      this.context = context;          // { game, input, buildSnapshot }
      this.triggers = [];
      this.state = {};                 // id -> { lastFiredAt, lastKey, fireCount, lastResult }
      this.lastFireAt = -Infinity;
      this.log = [];                   // recent fires (newest last)
      this._timer = null;
      this.paused = false;
    }

    register(def) {
      const t = Object.assign({ enabled: true, cooldownMs: 10000, params: {} }, def);
      this.triggers.push(t);
      this.state[t.id] = this._fresh();
      return this;
    }
    _fresh() { return { lastFiredAt: -Infinity, lastKey: null, fireCount: 0, lastResult: null }; }
    reset() { for (const id of Object.keys(this.state)) this.state[id] = this._fresh(); this.lastFireAt = -Infinity; this.log = []; }

    get(id) { return this.triggers.find(t => t.id === id); }
    setEnabled(id, on) { const t = this.get(id); if (t) t.enabled = !!on; }
    configure(id, patch) { const t = this.get(id); if (t) Object.assign(t, patch); }

    start() { if (!this._timer) this._timer = setInterval(() => this.evaluate(), this.intervalMs); return this; }
    stop() { clearInterval(this._timer); this._timer = null; }

    /** Evaluate all triggers now. `event` is an optional hint ('action', 'event', 'tick'). */
    evaluate(event = 'tick') {
      if (this.paused) return [];
      const now = performance.now();
      const ctx = Object.assign({ now, event }, this.context, { engine: this });
      const fired = [];
      for (const t of this.triggers) {
        if (!t.enabled) continue;
        const st = this.state[t.id];
        let result = null;
        try { result = t.check(ctx, t.params); } catch (err) { console.warn(`[trigger:${t.id}] check threw`, err); continue; }
        st.lastResult = result;
        if (!result) { st.lastKey = null; continue; }                  // condition cleared: re-arm
        if (result.key && result.key === st.lastKey) continue;         // same situation, already fired
        if (now - st.lastFiredAt < t.cooldownMs) continue;             // per-trigger cooldown
        if (now - this.lastFireAt < this.globalCooldownMs) continue;   // global cooldown
        this._fire(t, result, ctx);
        fired.push(t.id);
      }
      return fired;
    }

    /** Fire a trigger by hand (debug panel). Bypasses cooldowns/keys. */
    fireManually(id, reason = 'manual') {
      const t = this.get(id);
      if (!t) return null;
      const ctx = Object.assign({ now: performance.now(), event: 'manual' }, this.context, { engine: this });
      return this._fire(t, { reason, severity: 'info', key: `manual:${Date.now()}`, refs: [], manual: true }, ctx);
    }

    _fire(t, result, ctx) {
      const st = this.state[t.id];
      st.lastFiredAt = ctx.now; st.lastKey = result.key || null; st.fireCount++;
      this.lastFireAt = ctx.now;
      const snapshot = this.context.buildSnapshot
        ? this.context.buildSnapshot({ id: t.id, reason: result.reason, severity: result.severity, refs: result.refs || [] })
        : null;
      const entry = { trigger: t.id, reason: result.reason, severity: result.severity || 'info', refs: result.refs || [], manual: !!result.manual, at: Date.now(), snapshot };
      this.log.push(entry);
      if (this.log.length > 50) this.log.shift();
      this.onFire(entry);
      return entry;
    }

    /** Per-trigger status for the debug UI. */
    status(now = performance.now()) {
      return this.triggers.map(t => {
        const st = this.state[t.id];
        return {
          id: t.id, enabled: t.enabled, description: t.description,
          cooldownMs: t.cooldownMs,
          cooldownLeftMs: Math.max(0, Math.round(t.cooldownMs - (now - st.lastFiredAt))),
          fireCount: st.fireCount,
          pending: !st.lastResult ? 'clear' : (st.lastResult.key === st.lastKey ? 'suppressed' : 'armed'),
          lastReason: st.lastResult ? st.lastResult.reason : null,
        };
      });
    }
  }

  // ---------- default trigger set (real-time, workforce game) ----------

  const running = ctx => !ctx.game.over && !ctx.paused();
  const unstaffed = g => (g.s.farms - g.s.farmers) + (g.s.gens - g.s.power);

  const defaultTriggers = [
    {
      id: 'idle_trigger',
      description: 'No input for N seconds while the game is running.',
      cooldownMs: 20000,
      params: { idleMs: 6000, onlyIfNotable: true },
      check(ctx, p) {
        if (!running(ctx)) return null;
        const idle = ctx.input.idleMs(ctx.now);
        if (idle < p.idleMs) return null;
        const g = ctx.game, proj = g.projections();
        const falling = Object.entries(proj).filter(([, v]) => v.zeroInS !== null && v.zeroInS <= 90).sort((a, b) => a[1].zeroInS - b[1].zeroInS)[0];
        // a healthy, quiet colony is not worth a model call: require something notable
        if (p.onlyIfNotable && !falling && unstaffed(g) === 0 && g.idle() < 2) return null;
        return {
          reason: `no input for ${Math.round(idle / 1000)}s at t=${Math.round(ctx.game.s.t)}s` + (falling ? `; ${falling[0]} empties in ${falling[1].zeroInS}s` : ''),
          severity: 'low', key: `idle:${Math.round(ctx.input.lastInputAt)}`,
          refs: falling ? [`resource:${falling[0]}`] : [],
        };
      },
    },
    {
      id: 'risk_trigger',
      description: 'A resource empties within N seconds at the current structural rate.',
      cooldownMs: 10000,
      params: { withinS: 40 },
      check(ctx, p) {
        if (!running(ctx)) return null;
        const proj = ctx.game.projections();
        const hits = Object.entries(proj).filter(([, v]) => v.zeroInS !== null && v.zeroInS <= p.withinS).sort((a, b) => a[1].zeroInS - b[1].zeroInS);
        if (!hits.length) return null;
        const [res, v] = hits[0];
        return { reason: `${res} empties in ${v.zeroInS}s (${v.value} at ${v.perCycle}/10s)`, severity: v.zeroInS <= 15 ? 'high' : 'medium', key: `risk:${res}`, refs: [`resource:${res}`] };
      },
    },
    {
      id: 'hover_trigger',
      description: 'Player hovers over a task or staffing control for N seconds without clicking.',
      cooldownMs: 12000,
      params: { dwellMs: 3000, prefixes: ['action:', 'staff:'] },
      check(ctx, p) {
        if (!running(ctx)) return null;
        const h = ctx.input.hover;
        if (!h || h.clicked || !p.prefixes.some(pre => h.id.startsWith(pre))) return null;
        const dwell = ctx.input.hoverDwellMs(ctx.now);
        if (dwell < p.dwellMs) return null;
        return { reason: `hovering "${h.id}" for ${Math.round(dwell / 1000)}s without clicking`, severity: 'low', key: `hover:${h.id}:${Math.round(h.since)}`, refs: [h.id] };
      },
    },
    {
      id: 'mistake_pattern_trigger',
      description: 'The same questionable-decision flag appears repeatedly in recent decisions.',
      cooldownMs: 15000,
      params: { window: 6, repeats: 2 },
      check(ctx, p) {
        const recent = ctx.input.decisions.slice(-p.window);
        if (!recent.length) return null;
        const counts = {};
        for (const d of recent) for (const f of d.flags) counts[f] = (counts[f] || 0) + 1;
        const worst = Object.entries(counts).filter(([, n]) => n >= p.repeats).sort((a, b) => b[1] - a[1])[0];
        if (!worst) return null;
        const last = recent[recent.length - 1];
        if (!last.flags.includes(worst[0])) return null;
        return { reason: `"${worst[0]}" ${worst[1]}× in the last ${recent.length} decisions (latest: ${last.action} at t=${last.turn}s)`, severity: 'medium', key: `mistake:${worst[0]}:${last.at}`, refs: [`action:${last.action.replace('staff_', '')}`] };
      },
    },
    {
      id: 'setback_trigger',
      description: 'A damaging event (starvation, breakdown, storm) just happened.',
      cooldownMs: 10000,
      params: { withinS: 4 },
      check(ctx, p) {
        const g = ctx.game;
        const e = [...g.log].reverse().find(x => x.kind === 'event' && x.severity === 'bad');
        if (!e || g.s.t - e.t > p.withinS) return null;
        const ref = { starvation: 'resource:food', disrepair: 'resource:materials', storm: 'resource:energy' }[e.type];
        return { reason: `${e.type} at t=${e.t}s: ${e.text}`, severity: 'medium', key: `setback:${e.id}`, refs: ref ? [ref] : [] };
      },
    },
    {
      id: 'idle_workers_trigger',
      description: 'Villagers have sat idle for N seconds while structures are unstaffed or a resource is falling.',
      cooldownMs: 25000,
      params: { minIdle: 2, forS: 15 },
      check(ctx, p) {
        const g = ctx.game;
        if (!running(ctx)) { this._since = null; return null; }
        const idle = g.idle();
        const proj = g.projections();
        const need = unstaffed(g) > 0 || Object.values(proj).some(v => v.zeroInS !== null && v.zeroInS <= 60);
        if (idle < p.minIdle || !need) { this._since = null; return null; }
        if (this._since === null || this._since === undefined) this._since = g.s.t;
        if (g.s.t - this._since < p.forS) return null;
        return {
          reason: `${idle} villagers idle for ${Math.round(g.s.t - this._since)}s while ${unstaffed(g) > 0 ? `${unstaffed(g)} structure(s) unstaffed` : 'a resource is running out'}`,
          severity: 'medium', key: `idlework:${Math.round(this._since)}`, refs: ['staff:idle'],
        };
      },
    },
  ];

  // ---------- snapshot builder ----------

  /**
   * Compact JSON for the LLM. Trends and summaries, never raw logs. `map` is the
   * same village the player sees, as entities with ids and screen coordinates.
   */
  function buildSnapshot({ game, input, trigger, map, uiTargets }) {
    const s = game.s, proj = game.projections();
    const tasks = game.availableTasks().map(a => {
      const o = { id: a.id, cost: a.cost, base_s: a.baseS };
      if (a.gain) o.gain = a.gain;
      if (!a.affordable) o.affordable = false;
      return o;
    });
    const warnings = [];
    if (game.isStorm()) warnings.push('storm: generators at half output');
    if (s.energy <= 0) warnings.push('blackout: farms at half output');
    if (s.food <= 0) warnings.push('starving: a colonist dies every 4s');
    if (s.farms > s.farmers) warnings.push(`${s.farms - s.farmers} farm(s) unstaffed`);
    if (s.gens > s.power) warnings.push(`${s.gens - s.power} generator(s) unstaffed`);
    // Plain-language facts computed from the rules, so a small model doesn't have to infer them from counts.
    const idle = game.idle(), unstaffedFarms = s.farms - s.farmers, unstaffedGens = s.gens - s.power;
    const facts = [];
    if (unstaffedFarms === 0 && unstaffedGens === 0) facts.push(`all ${s.farms} farms and ${s.gens} generators are staffed; the ${idle} idle villagers can only be used for tasks (farm, gen, mine, expand)`);
    else facts.push(`${unstaffedFarms} farm(s) and ${unstaffedGens} generator(s) are unstaffed; staffing them is free and immediate (staff:farmers / staff:power)`);
    if (idle === 0) facts.push('no idle villagers: nothing new can be started until a task finishes or staff is pulled');
    for (const k of ['food', 'energy', 'materials']) if (proj[k].zeroInS !== null) facts.push(`${k} is falling ${proj[k].perCycle}/10s and empties in ${proj[k].zeroInS}s`); else facts.push(`${k} is ${proj[k].perCycle >= 0 ? 'stable or rising' : 'falling'}`);
    if (s.pop >= s.popCap) facts.push('habitat is full: no more arrivals until it is expanded');
    else if (s.food > 0 && s.energy > 0) facts.push(`next colonist arrives in ${Math.max(0, Math.round(s.nextArrivalAt - s.t))}s and will add 2 food + 1 energy upkeep`);
    const affordable = tasks.filter(t => t.affordable !== false).map(t => t.id);
    facts.push(affordable.length ? `affordable tasks now: ${affordable.join(', ')}` : 'no task is affordable right now');
    if (game.tasks.length) facts.push(`running: ${game.tasks.map(t => `${t.type} (${t.workers} workers, ${game.taskEtaS(t)}s left)`).join(', ')}`);
    const inp = input.getState();
    const recent = game.log.filter(e => e.kind !== 'event').slice(-5);
    const events = game.log.filter(e => e.kind === 'event').slice(-4);
    return {
      trigger,
      time: { elapsed_s: Math.round(s.t), remaining_s: Math.round(game.remainingS()) },
      resources: {
        food: { value: proj.food.value, per_10s: proj.food.perCycle, empty_in_s: proj.food.zeroInS },
        energy: { value: proj.energy.value, per_10s: proj.energy.perCycle, empty_in_s: proj.energy.zeroInS },
        materials: { value: proj.materials.value, per_10s: proj.materials.perCycle, empty_in_s: proj.materials.zeroInS },
      },
      colony: { pop: s.pop, pop_cap: s.popCap, next_arrival_s: s.pop < s.popCap ? Math.max(0, Math.round(s.nextArrivalAt - s.t)) : null },
      workforce: { farmers: s.farmers, farms: s.farms, power_crew: s.power, generators: s.gens, on_tasks: game.taskWorkers(), idle: game.idle() },
      running_tasks: game.tasks.map(t => ({ type: t.type, workers: t.workers, eta_s: game.taskEtaS(t) })),
      warnings,
      facts,
      available_tasks: tasks,
      player: { idle_s: inp.idle_s, hovering: inp.hovering, hover_s: inp.hover_s, recent_hovers: inp.recent_hovers },
      recent_decisions: recent.map(a => ({ t: a.t, by: a.source === 'ai' ? 'ai' : 'player', what: a.text, flags: a.flags && a.flags.length ? a.flags : undefined })),
      recent_events: events.map(e => ({ t: e.t, type: e.type, text: e.text })),
      map: map ? map() : undefined,
      target_ids: uiTargets ? uiTargets() : undefined,
    };
  }

  global.TriggerEngine = TriggerEngine;
  global.defaultTriggers = defaultTriggers;
  global.buildSnapshot = buildSnapshot;
})(window);
