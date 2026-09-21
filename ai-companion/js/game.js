/* game.js — "Outpost": a small real-time colony game built around a workforce.
 *
 * Farms and generators only produce while staffed. Tasks (build, mine, expand)
 * take time and need villagers assigned, who are unavailable meanwhile. The
 * only random event is a dust storm. Arrivals and breakdowns are deterministic.
 *
 * Exposes: window.Outpost = { Game, TASKS, CONFIG, fmtRes }
 */
(function (global) {
  'use strict';

  const CONFIG = {
    durationS: 300,     // seconds until the relief ship
    cycleS: 10,         // all "per 10 s" rates refer to this
    stormChance: 0.10,  // per cycle
    start: {
      t: 0, food: 40, energy: 30, materials: 24,
      pop: 8, popCap: 10, farms: 2, gens: 2,
      farmers: 2, power: 2,      // staffing (each ≤ structures of that kind)
      mined: 0, stormUntil: 0, starveT: 0, matZeroT: 0, nextArrivalAt: 20,
    },
    rates: {
      foodPerColonist: 2, farmYield: 8,      // one farmer feeds 4
      genYield: 8, energyPerColonist: 1, energyPerFarm: 1,   // one crew member powers ~8
      materialsPerStructure: 0.5,
      mineYield: 13, mineDepletion: 1, mineMin: 5,
      starveEveryS: 4, arrivalEveryS: 20, disrepairAfterS: 10,
    },
    maxWorkers: 4,
  };

  const TASKS = [
    { id: 'farm',   name: 'Build farm',      baseS: 30, desc: 'New farm: +8 food per 10 s when staffed, +1 energy upkeep. Price climbs after the 3rd.',
      cost: s => ({ materials: 8 + Math.max(0, s.farms - 2) * 3, energy: 4 }) },
    { id: 'gen',    name: 'Build generator', baseS: 30, desc: 'New generator: +8 energy per 10 s when staffed. Halved in storms.',
      cost: () => ({ materials: 12 }) },
    { id: 'mine',   name: 'Mining run',      baseS: 20, desc: 'Materials delivered when the run finishes. The deposit thins each run.',
      cost: () => ({ energy: 6 }) },
    { id: 'expand', name: 'Expand habitat',  baseS: 40, desc: '+4 capacity. A colonist arrives every 20 s while there is room and food and power hold.',
      cost: () => ({ materials: 15, energy: 5 }) },
  ];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r1 = v => Math.round(v * 10) / 10;
  const fmtRes = obj => Object.entries(obj).map(([k, v]) => `${v} ${k}`).join(', ');
  const speedFor = k => 0.5 + 0.5 * k;          // task speed multiplier for k workers

  class Game {
    constructor(seed) { this.reset(seed ?? Math.floor(Math.random() * 1e9)); }

    reset(seed) {
      this.seed = seed ?? this.seed;
      this.rng = mulberry32(this.seed);
      this.s = Object.assign({}, CONFIG.start);
      this.tasks = [];           // { id, type, workers, progress, startedAt }
      this.cycle = 0;
      this.over = null;
      this.log = [];             // { id, t, kind: 'action'|'staff'|'event', ... }
      this._nextId = 1;
      this.listeners = {};
    }

    on(evt, fn) { (this.listeners[evt] ||= []).push(fn); return this; }
    emit(evt, payload) { (this.listeners[evt] || []).forEach(fn => fn(payload)); }

    // ---------- derived ----------

    taskWorkers() { return this.tasks.reduce((n, t) => n + t.workers, 0); }
    idle(s = this.s) { return s.pop - s.farmers - s.power - this.taskWorkers(); }
    staffedFarms(s = this.s) { return Math.min(s.farmers, s.farms); }
    staffedGens(s = this.s) { return Math.min(s.power, s.gens); }
    mineYield(s = this.s) { const R = CONFIG.rates; return Math.max(R.mineMin, R.mineYield - s.mined * R.mineDepletion); }
    isStorm() { return this.s.t < this.s.stormUntil; }
    remainingS() { return Math.max(0, CONFIG.durationS - this.s.t); }

    /** Net change per cycle. `structural` ignores storms/blackouts. */
    ratesPerCycle(s = this.s, structural = false) {
      const R = CONFIG.rates;
      const storm = !structural && s.t < s.stormUntil ? 0.5 : 1;
      const blackout = !structural && s.energy <= 0 ? 0.5 : 1;
      return {
        food: r1(this.staffedFarms(s) * R.farmYield * blackout - s.pop * R.foodPerColonist),
        energy: r1(this.staffedGens(s) * R.genYield * storm - (s.pop * R.energyPerColonist + s.farms * R.energyPerFarm)),
        materials: r1(-(s.farms + s.gens) * R.materialsPerStructure),
      };
    }

    projections(s = this.s) {
      const rates = this.ratesPerCycle(s, true);
      const out = {};
      for (const k of ['food', 'energy', 'materials']) {
        const rate = rates[k];
        out[k] = { value: Math.round(s[k]), perCycle: rate, zeroInS: rate < 0 ? Math.max(0, Math.round(s[k] / -rate * CONFIG.cycleS)) : null };
      }
      return out;
    }

    taskDef(type) { return TASKS.find(t => t.id === type) || null; }
    taskEtaS(task) { return task.workers ? r1((1 - task.progress) * this.taskDef(task.type).baseS / speedFor(task.workers)) : null; }
    estimateS(type, workers) { return r1(this.taskDef(type).baseS / speedFor(Math.max(1, workers))); }

    availableTasks() {
      const idle = this.idle();
      return TASKS.map(d => {
        const cost = d.cost(this.s);
        const affordable = Object.entries(cost).every(([k, v]) => this.s[k] >= v);
        return { id: d.id, name: d.name, desc: d.desc, cost, gain: d.id === 'mine' ? { materials: this.mineYield() } : null,
          affordable, idle, ready: affordable && idle > 0 && !this.over, baseS: d.baseS };
      });
    }

    // ---------- player actions ----------

    /** Heuristic "questionable decision" tags for a task start, against the current state. */
    _taskFlags(type, workers) {
      const s = this.s, p = this.projections();
      const f = [];
      if (p.food.zeroInS !== null && p.food.zeroInS <= 30 && type !== 'farm') f.push('ignored_food_shortfall');
      if (p.energy.zeroInS !== null && p.energy.zeroInS <= 30 && type !== 'gen') f.push('ignored_energy_shortfall');
      if (type === 'expand' && s.pop <= s.popCap - 3) f.push('expanded_with_unused_capacity');
      if ((type === 'farm' || type === 'gen') && (s.farms > s.farmers || s.gens > s.power)) f.push('built_while_structures_unstaffed');
      if (this.idle() - workers === 0 && (s.farms > s.farmers || s.gens > s.power)) f.push('no_idle_left_with_unstaffed_structures');
      return f;
    }

    /** Start a task with `workers` idle villagers. Returns the log entry or null. */
    startTask(type, workers, source = 'player') {
      if (this.over) return null;
      const d = this.taskDef(type);
      workers = Math.floor(workers);
      if (!d || workers < 1 || workers > CONFIG.maxWorkers || workers > this.idle()) return null;
      const s = this.s, cost = d.cost(s);
      if (!Object.entries(cost).every(([k, v]) => s[k] >= v)) return null;
      const flags = this._taskFlags(type, workers);
      for (const [k, v] of Object.entries(cost)) s[k] -= v;
      const task = { id: this._nextId++, type, workers, progress: 0, startedAt: s.t };
      this.tasks.push(task);
      const entry = this._push({ kind: 'action', action: type, name: d.name, workers, cost, flags, source, severity: 'neutral',
        text: `${d.name} started with ${workers} worker${workers > 1 ? 's' : ''} (−${fmtRes(cost)}, ~${this.estimateS(type, workers)}s)` });
      this.emit('action', entry);
      return entry;
    }

    /** Set staffing for 'farmers' or 'power'. Clamped to structures and available people. */
    setStaff(job, count, source = 'player') {
      if (this.over || !['farmers', 'power'].includes(job)) return null;
      const s = this.s, cap = job === 'farmers' ? s.farms : s.gens;
      const max = Math.min(cap, s[job] + this.idle());
      count = clamp(Math.floor(count), 0, max);
      if (count === s[job]) return null;
      const p = this.projections();
      const flags = [];
      if (job === 'farmers' && count < s[job] && p.food.perCycle <= 0) flags.push('reduced_farmers_in_deficit');
      if (job === 'power' && count < s[job] && p.energy.perCycle <= 0) flags.push('reduced_power_in_deficit');
      const from = s[job];
      s[job] = count;
      const entry = this._push({ kind: 'staff', action: `staff_${job}`, job, from, to: count, flags, source, severity: 'neutral',
        text: `${job === 'farmers' ? 'Farmers' : 'Power crew'} ${from} → ${count}` });
      this.emit('action', entry);
      return entry;
    }

    _push(e) { e.id = this._nextId++; e.t = Math.round(this.s.t); this.log.push(e); if (this.log.length > 80) this.log.shift(); return e; }
    _event(type, severity, text) { const e = this._push({ kind: 'event', type, severity, text }); this.emit('event', e); return e; }

    // ---------- simulation ----------

    update(dt) {
      if (this.over || dt <= 0) return;
      const s = this.s, R = CONFIG.rates;
      s.t += dt;
      const r = this.ratesPerCycle(s, false);
      for (const k of ['food', 'energy', 'materials']) s[k] = Math.max(0, s[k] + r[k] * dt / CONFIG.cycleS);

      // tasks
      for (const task of [...this.tasks]) {
        task.progress += dt * speedFor(task.workers) / this.taskDef(task.type).baseS * (task.workers ? 1 : 0);
        if (task.progress >= 1) this._completeTask(task);
      }

      // starvation: continuous while food is at zero with unmet demand
      if (s.food <= 0 && r.food < 0 && s.pop > 0) {
        s.starveT += dt;
        if (s.starveT >= R.starveEveryS) {
          s.starveT = 0; s.pop -= 1; this._syncStaff();
          this._event('starvation', 'bad', 'Food is out: a colonist starved.');
          if (s.pop <= 0) { this._end(false, 'Colony lost: everyone starved.'); return; }
        }
      } else s.starveT = 0;

      // disrepair: materials at zero long enough breaks a structure
      if (s.materials <= 0 && r.materials < 0 && s.farms + s.gens > 1) {
        s.matZeroT += dt;
        if (s.matZeroT >= R.disrepairAfterS) {
          s.matZeroT = 0;
          const which = s.farms >= s.gens ? 'farms' : 'gens';
          s[which] -= 1; this._syncStaff();
          this._event('disrepair', 'bad', `No materials for maintenance: a ${which === 'farms' ? 'farm' : 'generator'} broke down.`);
        }
      } else s.matZeroT = 0;

      // arrivals: predictable, while there is room and the basics hold
      if (s.t >= s.nextArrivalAt) {
        if (s.pop < s.popCap && s.food > 0 && s.energy > 0) {
          s.pop += 1;
          this._event('arrival', 'good', 'A colonist arrived (+2 food, +1 energy upkeep per 10 s). They are idle.');
        }
        s.nextArrivalAt = s.t + R.arrivalEveryS;
      }

      while (Math.floor(s.t / CONFIG.cycleS) > this.cycle && !this.over) { this.cycle++; this._resolveCycle(); }
      if (!this.over && s.t >= CONFIG.durationS) this._end(true, 'The relief ship arrived.');
    }

    _completeTask(task) {
      const s = this.s;
      this.tasks = this.tasks.filter(t => t !== task);
      let text;
      switch (task.type) {
        case 'farm': s.farms += 1; text = `Farm ${s.farms} finished. It needs a farmer.`; break;
        case 'gen': s.gens += 1; text = `Generator ${s.gens} finished. It needs a crew member.`; break;
        case 'mine': { const y = this.mineYield(s); s.materials += y; s.mined += 1; text = `Mining run delivered +${y} materials.`; break; }
        case 'expand': s.popCap += 4; text = `Habitat expanded: capacity ${s.popCap}.`; break;
      }
      const e = this._push({ kind: 'event', type: 'task_done', task: task.type, severity: 'good', text });
      this.emit('event', e);
      this.emit('task_done', task);
    }

    /** After losing people or structures, keep staffing consistent. */
    _syncStaff() {
      const s = this.s;
      s.farmers = Math.min(s.farmers, s.farms);
      s.power = Math.min(s.power, s.gens);
      let over = -this.idle();
      while (over > 0) {
        if (s.farmers > 0 && s.farmers >= s.power) s.farmers--;
        else if (s.power > 0) s.power--;
        else { const t = this.tasks.find(t => t.workers > 0); if (!t) break; t.workers--; }
        over--;
      }
    }

    _resolveCycle() {
      const s = this.s;
      if (this.rng() < CONFIG.stormChance) {
        s.stormUntil = s.t + CONFIG.cycleS;
        this._event('storm', 'bad', 'Dust storm: generators at half output for 10 s.');
      }
      this.emit('cycle', this.cycle);
    }

    _end(won, reason) { this.over = { won, reason, score: this.score() }; this.emit('over', this.over); }
    score() { const s = this.s; return Math.round(s.pop * 10 + (s.food + s.energy + s.materials) / 4 + (s.farms + s.gens) * 3); }
  }

  global.Outpost = { Game, TASKS, CONFIG, fmtRes };
})(window);
