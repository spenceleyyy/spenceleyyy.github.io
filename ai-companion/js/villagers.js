/* villagers.js — colonists as tiny agents on the village map.
 *
 * Presentational only. Agents mirror the game's workforce: farmers stand at
 * farms, the power crew at generators, task workers at the site under
 * construction (or the mine), everyone else wanders the plaza. Arrivals walk in
 * from the landing pad. Starving colonists slow down and turn red.
 *
 * Exposes: window.Villagers
 */
(function (global) {
  'use strict';

  const PLAZA = { x0: 200, y0: 215, x1: 330, y1: 268 };
  const SPEED = { walk: 40, starving: 18 };
  const rnd = (a, b) => a + Math.random() * (b - a);

  class Villagers {
    constructor(game, layoutFn) {
      this.game = game;
      this.layout = layoutFn;     // (state, game) -> entities (incl. ghosts for tasks)
      this.agents = [];
      this._nextId = 1;
    }

    reset() { this.agents = []; this._nextId = 1; }

    _sites(ents) {
      const at = e => ({ x: e.x + e.w / 2, y: e.y + e.h + 20 });
      const mine = ents.find(e => e.id === 'mine'), pad = ents.find(e => e.id === 'pad');
      return {
        farms: ents.filter(e => e.type === 'farm' && !e.ghost).map(at),
        gens: ents.filter(e => e.type === 'generator' && !e.ghost).map(at),
        tasks: Object.fromEntries(ents.filter(e => e.ghost).map(e => [e.taskId, e.type === 'mine' ? { x: mine.x + mine.w + 10, y: mine.y + mine.h / 2 } : at(e)])),
        mine: { x: mine.x + mine.w + 10, y: mine.y + mine.h / 2 },
        pad: { x: pad.x - 12, y: pad.y + pad.h / 2 },
      };
    }

    _spawn(at) {
      const a = { id: this._nextId++, x: at.x + rnd(-4, 4), y: at.y + rnd(-4, 4), tx: 0, ty: 0, job: null, jobKey: null, state: 'idle', until: 0, phase: rnd(0, 6.28) };
      this._wander(a); this.agents.push(a); return a;
    }
    _wander(a) { a.tx = rnd(PLAZA.x0, PLAZA.x1); a.ty = rnd(PLAZA.y0, PLAZA.y1); a.state = 'walk'; a.until = 0; }
    _send(a, site, jobKey, spread = 6) { a.tx = site.x + rnd(-spread, spread); a.ty = site.y + rnd(-3, 3); a.jobKey = jobKey; a.state = 'walk'; }

    update(dt) {
      const g = this.game, s = g.s, t = s.t;
      const ents = this.layout(s, g);
      const sites = this._sites(ents);

      while (this.agents.length < s.pop) this._spawn(sites.pad);
      while (this.agents.length > s.pop && this.agents.length) {
        const idleIdx = this.agents.findIndex(a => !a.jobKey);
        this.agents.splice(idleIdx >= 0 ? idleIdx : this.agents.length - 1, 1);
      }

      // desired job slots: 'farm:i', 'gen:i', 'task:<id>:i'
      const want = [];
      for (let i = 0; i < g.staffedFarms(); i++) want.push({ key: `farm:${i}`, site: sites.farms[i % sites.farms.length] });
      for (let i = 0; i < g.staffedGens(); i++) want.push({ key: `gen:${i}`, site: sites.gens[i % sites.gens.length] });
      for (const task of g.tasks) for (let i = 0; i < task.workers; i++) want.push({ key: `task:${task.id}:${i}`, site: sites.tasks[task.id] || sites.mine });
      const wantKeys = new Set(want.map(w => w.key));
      // release agents whose job vanished
      for (const a of this.agents) if (a.jobKey && !wantKeys.has(a.jobKey)) { a.jobKey = null; this._wander(a); }
      // fill missing slots with free agents (prefer ones nearest the site)
      const taken = new Set(this.agents.map(a => a.jobKey).filter(Boolean));
      for (const w of want) {
        if (taken.has(w.key)) continue;
        const free = this.agents.filter(a => !a.jobKey).sort((p, q) => Math.hypot(p.x - w.site.x, p.y - w.site.y) - Math.hypot(q.x - w.site.x, q.y - w.site.y))[0];
        if (!free) break;
        this._send(free, w.site, w.key); taken.add(w.key);
      }

      const starving = s.food <= 0;
      for (const a of this.agents) {
        a.phase += dt * 4;
        if (a.state === 'walk') {
          const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
          const sp = starving ? SPEED.starving : SPEED.walk;
          if (d < 2) { a.x = a.tx; a.y = a.ty; a.state = a.jobKey ? 'work' : 'idle'; a.until = t + rnd(1.5, 4); }
          else { a.x += dx / d * sp * dt; a.y += dy / d * sp * dt; }
        } else if (a.state === 'idle' && t >= a.until) this._wander(a);
      }
    }

    render(groupEl) {
      if (!groupEl) return;
      const starving = this.game.s.food <= 0;
      if (groupEl.childElementCount !== this.agents.length) {
        groupEl.innerHTML = this.agents.map(a => `<g class="colonist" data-id="${a.id}"><circle class="body" r="4"/><circle class="head" cy="-5.5" r="2.6"/></g>`).join('');
      }
      const nodes = groupEl.children;
      for (let i = 0; i < this.agents.length; i++) {
        const a = this.agents[i], n = nodes[i];
        const bob = a.state === 'work' ? Math.sin(a.phase) * 1.2 : a.state === 'walk' ? Math.abs(Math.sin(a.phase * 2)) : 0;
        n.setAttribute('transform', `translate(${a.x.toFixed(1)} ${(a.y - bob).toFixed(1)})`);
        n.setAttribute('class', `colonist ${a.state}${a.jobKey && a.jobKey.startsWith('task') ? ' builder' : ''}${starving ? ' starving' : ''}`);
      }
    }

    /** Positions in map coordinates; the UI converts to screen for the snapshot. */
    positions() { return this.agents.map(a => ({ x: a.x, y: a.y, job: a.jobKey ? a.jobKey.split(':')[0] : 'idle' })); }
  }

  global.Villagers = Villagers;
})(window);
