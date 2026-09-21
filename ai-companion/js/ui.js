/* ui.js — DOM rendering: dashboard, workforce, task cards, village map, logs, AI/debug panel.
 * The map is the shared picture: the player sees it, mapSummary() hands the
 * same entities (ids + screen positions) to the LLM snapshot.
 * Exposes: window.UI
 */
(function (global) {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sign = v => (v > 0 ? '+' : '') + (Math.round(v * 10) / 10);
  const time = ts => new Date(ts).toLocaleTimeString([], { hour12: false });
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const RES_META = { food: { label: 'Food', max: 100 }, energy: { label: 'Energy', max: 100 }, materials: { label: 'Materials', max: 80 } };
  const MAP = { w: 520, h: 340 };

  /** Fixed slot geometry so entity ids are stable. Tasks appear as ghosts in the next slot. */
  function mapLayout(s, game) {
    const ents = [];
    const slot = (type, i) => type === 'farm' ? { x: 40 + (i % 2) * 58, y: 70 + Math.floor(i / 2) * 62, w: 48, h: 48 }
      : type === 'generator' ? { x: 384 + (i % 2) * 58, y: 70 + Math.floor(i / 2) * 62, w: 48, h: 48 }
      : { x: 196 + (i % 3) * 46, y: 66 + Math.floor(i / 3) * 66, w: 40, h: 48 };
    for (let i = 0; i < Math.min(s.farms, 8); i++) ents.push({ id: `farm_${i + 1}`, type: 'farm', staffed: i < s.farmers, ...slot('farm', i) });
    for (let i = 0; i < Math.min(s.gens, 8); i++) ents.push({ id: `gen_${i + 1}`, type: 'generator', staffed: i < s.power, ...slot('generator', i) });
    const modules = Math.min(9, Math.ceil(s.popCap / 4));
    for (let i = 0; i < modules; i++) ents.push({ id: `hab_${i + 1}`, type: 'habitat', ...slot('habitat', i) });
    let nf = s.farms, ng = s.gens, nh = modules;
    for (const task of game.tasks) {
      if (task.type === 'farm' && nf < 8) ents.push({ id: `farm_${nf + 1}`, type: 'farm', ghost: true, taskId: task.id, progress: task.progress, ...slot('farm', nf++) });
      else if (task.type === 'gen' && ng < 8) ents.push({ id: `gen_${ng + 1}`, type: 'generator', ghost: true, taskId: task.id, progress: task.progress, ...slot('generator', ng++) });
      else if (task.type === 'expand' && nh < 9) ents.push({ id: `hab_${nh + 1}`, type: 'habitat', ghost: true, taskId: task.id, progress: task.progress, ...slot('habitat', nh++) });
      else if (task.type === 'mine') ents.push({ id: `mine_run_${task.id}`, type: 'mine', ghost: true, taskId: task.id, progress: task.progress, x: 40, y: 292, w: 56, h: 36 });
    }
    ents.push({ id: 'mine', type: 'mine', x: 40, y: 292, w: 56, h: 36, yield: game.mineYield(s) });
    ents.push({ id: 'pad', type: 'landing_pad', x: 424, y: 286, w: 60, h: 44 });
    return ents;
  }

  class UI {
    constructor({ game, input }) {
      this.game = game; this.input = input;
      this.onStartTask = () => {}; this.onStaff = () => {}; this.onPause = () => {}; this.onNewGame = () => {};
      this.onTriggerToggle = () => {}; this.onTriggerCooldown = () => {}; this.onTriggerFire = () => {};
      this.onAskAI = () => {}; this.onSetting = () => {};
      this.paused = false;
      this.workerChoice = { farm: 2, gen: 2, mine: 2, expand: 2 };
      this._mapSig = null; this._logSig = null;
      this.villagers = new Villagers(game, mapLayout);
      this.el = {
        seed: $('#seed-indicator'), pause: $('#pause'),
        resources: $('#resources'), colony: $('#colony'), workforce: $('#workforce'),
        clock: $('#clock'), clockBar: $('#clock-bar'),
        mapWrap: $('#map-wrap'), tasks: $('#tasks'), activeTasks: $('#active-tasks'),
        gameLog: $('#game-log'), triggerConfig: $('#trigger-config'), triggerLog: $('#trigger-log'),
        aiStatus: $('#ai-status'), aiLog: $('#ai-log'), aiStrip: $('#ai-strip'),
        monitor: $('#monitor'), gameover: $('#gameover'),
      };
      this._bind();
      this._buildTasks();
    }

    _bind() {
      this.el.tasks.addEventListener('click', e => {
        const card = e.target.closest('.task-card'); if (!card) return;
        const type = card.dataset.id;
        const step = e.target.closest('[data-step]');
        if (step) { this.workerChoice[type] = Math.max(1, Math.min(Outpost.CONFIG.maxWorkers, this.workerChoice[type] + Number(step.dataset.step))); this.renderTasks(); return; }
        if (e.target.closest('[data-start]') && card.getAttribute('aria-disabled') !== 'true') this.onStartTask(type, Math.min(this.workerChoice[type], this.game.idle()));
      });
      this.el.workforce.addEventListener('click', e => {
        const b = e.target.closest('[data-staff]'); if (!b) return;
        this.onStaff(b.dataset.staff, Number(b.dataset.delta));
      });
      this.el.pause.addEventListener('click', () => this.onPause());
      $('#new-game').addEventListener('click', () => this.onNewGame());
      $('#gameover-new').addEventListener('click', () => { this.el.gameover.hidden = true; this.onNewGame(); });
      this.el.triggerConfig.addEventListener('change', e => {
        const li = e.target.closest('li'); if (!li) return;
        if (e.target.type === 'checkbox') this.onTriggerToggle(li.dataset.id, e.target.checked);
        if (e.target.type === 'number') this.onTriggerCooldown(li.dataset.id, Number(e.target.value) * 1000);
      });
      this.el.triggerConfig.addEventListener('click', e => { const b = e.target.closest('button[data-fire]'); if (b) this.onTriggerFire(b.dataset.fire); });
      document.addEventListener('click', e => {
        const b = e.target.closest('button[data-toggle]'); if (!b) return;
        const pre = b.parentElement.querySelector('pre'); if (!pre) return;
        pre.hidden = !pre.hidden; b.textContent = pre.hidden ? b.dataset.toggle : 'hide';
      });
      const settings = $('#ai-settings');
      settings.addEventListener('change', e => {
        const el = e.target; if (!el.name) return;
        this.onSetting(el.name, el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value);
      });
      $('#ai-ask').addEventListener('click', () => { this.onAskAI(); });
    }

    _buildTasks() {
      this.el.tasks.innerHTML = Outpost.TASKS.map((d, i) => `
        <div class="task-card" data-id="${d.id}" data-track="action:${d.id}">
          <div class="name">${esc(d.name)}<span class="key">${i + 1}</span></div>
          <div class="cost"></div>
          <div class="desc">${esc(d.desc)}</div>
          <div class="assign">
            <span class="muted small">workers</span>
            <button class="step" data-step="-1" title="fewer workers">−</button><b class="n">2</b><button class="step" data-step="1" title="more workers">+</button>
            <span class="eta muted small"></span>
            <button class="btn start" data-start>Start</button>
          </div>
        </div>`).join('');
    }

    // ---------- per-frame (10 Hz) ----------

    renderFrame() {
      const g = this.game;
      this.el.seed.textContent = `seed ${g.seed}`;
      this.el.pause.textContent = this.paused ? 'Resume' : 'Pause';
      this.renderDashboard(); this.renderWorkforce(); this.renderClock(); this.renderMap(); this.renderTasks(); this.renderActiveTasks(); this.renderLog();
    }

    renderDashboard() {
      const g = this.game, s = g.s, proj = g.projections();
      this.el.resources.innerHTML = Object.entries(RES_META).map(([k, meta]) => {
        const p = proj[k], z = p.zeroInS;
        const state = (z !== null && z <= 20) || p.value <= 0 ? 'bad' : (z !== null && z <= 45) ? 'warn' : 'ok';
        return `<div class="card res" data-track="resource:${k}" data-state="${state}">
          <div class="label">${meta.label}</div><div class="value">${p.value}</div>
          <div class="rate ${p.perCycle > 0 ? 'pos' : p.perCycle < 0 ? 'neg' : ''}">${sign(p.perCycle)} / 10 s${z !== null ? ` · empty in ${z}s` : ''}</div>
          <div class="bar"><i style="width:${Math.min(100, p.value / meta.max * 100)}%"></i></div>
        </div>`;
      }).join('');
      const badges = [];
      if (g.isStorm()) badges.push('⛈ storm: generators halved');
      if (s.energy <= 0) badges.push('⚡ blackout: farms halved');
      if (s.food <= 0) badges.push('☠ starving');
      if (s.farms > s.farmers) badges.push(`${s.farms - s.farmers} farm${s.farms - s.farmers > 1 ? 's' : ''} unstaffed`);
      if (s.gens > s.power) badges.push(`${s.gens - s.power} generator${s.gens - s.power > 1 ? 's' : ''} unstaffed`);
      const nextArr = s.pop < s.popCap ? `${Math.max(0, Math.ceil(s.nextArrivalAt - s.t))}s` : 'full';
      this.el.colony.innerHTML = `
        <span class="k">Population</span><span class="v" data-track="resource:pop">${s.pop} / ${s.popCap}</span>
        <span class="k">Next arrival</span><span class="v">${nextArr}</span>
        <span class="k">Farms · Generators</span><span class="v">${s.farms} · ${s.gens}</span>
        <span class="k">Next mining run</span><span class="v">+${g.mineYield()} materials</span>
        ${badges.length ? `<div class="badges">${badges.map(b => `<span class="badge">${b}</span>`).join('')}</div>` : ''}`;
    }

    renderWorkforce() {
      const g = this.game, s = g.s, idle = g.idle(), busy = g.taskWorkers();
      const row = (job, label, n, cap) => `
        <div class="staff-row" data-track="staff:${job}">
          <span class="k">${label}</span>
          <span class="ctl"><button data-staff="${job}" data-delta="-1" ${n <= 0 ? 'disabled' : ''}>−</button><b>${n}</b><span class="muted">/ ${cap}</span><button data-staff="${job}" data-delta="1" ${n >= cap || idle <= 0 ? 'disabled' : ''}>+</button></span>
        </div>`;
      this.el.workforce.innerHTML = `
        ${row('farmers', 'Farmers', s.farmers, s.farms)}
        ${row('power', 'Power crew', s.power, s.gens)}
        <div class="staff-row"><span class="k">On tasks</span><span class="v">${busy}</span></div>
        <div class="staff-row ${idle >= 3 ? 'warn' : ''}" data-track="staff:idle"><span class="k">Idle</span><span class="v">${idle}</span></div>`;
    }

    renderClock() {
      const g = this.game, rem = g.remainingS();
      this.el.clock.textContent = g.over ? (g.over.won ? 'Relief ship arrived' : 'Colony lost') : `Relief ship in ${mmss(rem)}${this.paused ? ' · paused' : ''}`;
      this.el.clockBar.style.width = `${100 * g.s.t / Outpost.CONFIG.durationS}%`;
    }

    renderTasks() {
      const g = this.game, list = g.availableTasks(), idle = g.idle();
      this.el.tasks.querySelectorAll('.task-card').forEach((card, i) => {
        const a = list[i]; const n = Math.max(1, Math.min(this.workerChoice[a.id], Outpost.CONFIG.maxWorkers));
        card.querySelector('.cost').innerHTML = `−${esc(Outpost.fmtRes(a.cost))}${a.gain ? ` <span class="gain">→ +${esc(Outpost.fmtRes(a.gain))}</span>` : ''}`;
        card.querySelector('.n').textContent = n;
        const eff = Math.min(n, idle);
        card.querySelector('.eta').textContent = eff > 0 ? `~${g.estimateS(a.id, eff)}s with ${eff}` : 'no idle villagers';
        card.setAttribute('aria-disabled', a.ready ? 'false' : 'true');
        card.classList.toggle('unaffordable', !a.affordable);
      });
    }

    renderActiveTasks() {
      const g = this.game;
      if (!g.tasks.length) { this.el.activeTasks.innerHTML = '<span class="empty">No tasks running. Assign idle villagers to a task above.</span>'; return; }
      this.el.activeTasks.innerHTML = g.tasks.map(t => `
        <div class="task-row" data-track="task:${t.id}">
          <span class="name">${esc(g.taskDef(t.type).name)}</span>
          <span class="muted small">${t.workers} worker${t.workers === 1 ? '' : 's'} · ${g.taskEtaS(t) ?? '—'}s left</span>
          <div class="bar"><i style="width:${Math.round(t.progress * 100)}%"></i></div>
        </div>`).join('');
    }

    // ---------- map ----------

    renderMap() {
      const g = this.game, s = g.s, ents = mapLayout(s, g);
      const sig = ents.map(e => e.id + (e.ghost ? 'g' : '') + (e.staffed === false ? 'u' : '')).join(',');
      if (sig !== this._mapSig) {
        this._mapSig = sig;
        this.el.mapWrap.innerHTML = `<svg id="map" viewBox="0 0 ${MAP.w} ${MAP.h}" xmlns="http://www.w3.org/2000/svg" aria-label="Village map">
          <rect class="ground" x="0" y="0" width="${MAP.w}" height="${MAP.h}" rx="12"/>
          <text class="zone" x="64" y="52">FARMS</text><text class="zone" x="264" y="52" text-anchor="middle">HABITAT</text><text class="zone" x="456" y="52" text-anchor="end">POWER</text>
          <g id="map-static">${ents.filter(e => !e.ghost || e.type !== 'mine').map(e => this._entitySvg(e)).join('')}</g>
          <g id="map-colonists"></g>
          <rect id="map-storm" class="storm" x="0" y="0" width="${MAP.w}" height="${MAP.h}" rx="12"/>
        </svg>`;
      }
      this.villagers.render($('#map-colonists'));
      $('#map-storm').style.opacity = g.isStorm() ? 0.35 : 0;
      for (const e of ents.filter(e => e.ghost)) {
        const fill = $(`#map-static [data-track="map:${e.id}"] .progress`);
        if (fill) fill.setAttribute('width', String(Math.round(e.w * e.progress)));
      }
      const mineTask = g.tasks.find(t => t.type === 'mine');
      const mineFill = $('#map-static [data-track="map:mine"] .progress');
      if (mineFill) mineFill.setAttribute('width', String(mineTask ? Math.round(56 * mineTask.progress) : 0));
      const mineLbl = $('#map-static [data-track="map:mine"] text'); if (mineLbl) mineLbl.textContent = `mine +${g.mineYield()}`;
      const padLbl = $('#map-static [data-track="map:pad"] text'); if (padLbl) padLbl.textContent = mmss(g.remainingS());
      $('#map-static').querySelectorAll('.gen').forEach(el => el.classList.toggle('dim', g.isStorm()));
      $('#map-static').querySelectorAll('.farm').forEach(el => el.classList.toggle('dim', s.energy <= 0));
    }

    _entitySvg(e) {
      const t = `data-track="map:${e.id}"`;
      const cls = `ent ${e.ghost ? 'ghost' : ''} ${e.staffed === false ? 'unstaffed' : ''}`;
      const label = `<text x="${e.x + e.w / 2}" y="${e.y + e.h + 12}" text-anchor="middle">${e.id}${e.staffed === false ? ' ·' : ''}</text>`;
      const prog = e.ghost ? `<rect class="progress" x="${e.x}" y="${e.y + e.h - 5}" width="0" height="5" rx="2"/>` : '';
      switch (e.type) {
        case 'farm': return `<g class="${cls} farm" ${t}><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="6"/><path d="M${e.x + 8} ${e.y + 36} v-14 M${e.x + 18} ${e.y + 36} v-20 M${e.x + 28} ${e.y + 36} v-16 M${e.x + 38} ${e.y + 36} v-22"/>${prog}${label}</g>`;
        case 'generator': return `<g class="${cls} gen" ${t}><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="6"/><path d="M${e.x + 28} ${e.y + 8} l-12 18 h10 l-6 14 l16 -20 h-10 z"/>${prog}${label}</g>`;
        case 'habitat': return `<g class="${cls} hab" ${t}><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="10"/><rect x="${e.x + 10}" y="${e.y + 12}" width="20" height="12" rx="3" class="window"/>${prog}${label}</g>`;
        case 'mine': return `<g class="${cls} mine" ${t}><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="6"/><rect class="progress" x="${e.x}" y="${e.y + e.h - 5}" width="0" height="5" rx="2"/><text x="${e.x + e.w / 2}" y="${e.y - 6}" text-anchor="middle">mine</text></g>`;
        case 'landing_pad': return `<g class="${cls} pad" ${t}><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="8"/><circle cx="${e.x + e.w / 2}" cy="${e.y + e.h / 2}" r="12"/><text x="${e.x + e.w / 2}" y="${e.y - 6}" text-anchor="middle">pad</text></g>`;
        default: return '';
      }
    }

    animate(dt) {
      if (this.paused || this.game.over) return;
      this.villagers.update(dt);
      this.villagers.render($('#map-colonists'));
    }

    /** Map coords -> viewport pixels (the map scales with the layout). */
    mapToScreen(x, y) {
      const svg = $('#map'); if (!svg) return [Math.round(x), Math.round(y)];
      const r = svg.getBoundingClientRect(); const k = r.width / MAP.w;
      return [Math.round(r.left + x * k), Math.round(r.top + y * k)];
    }

    /** The same map as compact data for the LLM: ids and states, no pixel coordinates
     *  (the advisor resolves target ids to screen positions itself). */
    mapSummary() {
      const g = this.game, s = g.s, ents = mapLayout(s, g);
      const tag = e => e.ghost ? `${e.id} (building ${Math.round(e.progress * 100)}%)` : e.staffed === false ? `${e.id} (unstaffed)` : e.id;
      const positions = this.villagers.positions();
      const zones = {};
      for (const p of positions) zones[p.job] = (zones[p.job] || 0) + 1;
      return {
        layout: 'farms left, habitat + plaza centre, generators right, mine bottom-left, landing pad bottom-right',
        farms: ents.filter(e => e.type === 'farm').map(tag),
        generators: ents.filter(e => e.type === 'generator').map(tag),
        habitat_modules: ents.filter(e => e.type === 'habitat').map(tag),
        mine: { next_yield: g.mineYield(), run_in_progress: g.tasks.some(t => t.type === 'mine') },
        colonists_by_job: zones,
        effects: [g.isStorm() && 'storm_over_power', s.energy <= 0 && 'farms_dimmed_blackout', s.food <= 0 && 'colonists_starving'].filter(Boolean),
      };
    }

    // ---------- logs & panels ----------

    renderLog() {
      const items = this.game.log.slice(-14).reverse();
      const sig = items.length ? `${items[0].id}:${items.length}` : 'empty';
      if (sig === this._logSig) return;
      this._logSig = sig;
      if (!items.length) { this.el.gameLog.innerHTML = '<li class="empty">Nothing yet.</li>'; return; }
      this.el.gameLog.innerHTML = items.map(e => `<li class="${e.kind === 'event' ? e.severity : e.kind === 'staff' ? 'staff-entry' : 'action-entry'}${e.source === 'ai' ? ' by-ai' : ''}">
        <span class="t">${mmss(e.t)}</span>${e.source === 'ai' ? '<span class="ai-tag">AI</span> ' : ''}${esc(e.text)}${e.flags && e.flags.length ? `<div class="flags">${e.flags.join(', ')}</div>` : ''}
      </li>`).join('');
    }

    renderTriggerConfig(engine) {
      const rows = engine.status();
      if (this.el.triggerConfig.querySelectorAll('li').length !== rows.length) {
        this.el.triggerConfig.innerHTML = rows.map(r => `<li data-id="${r.id}" title="${esc(r.description)}">
          <input type="checkbox" ${r.enabled ? 'checked' : ''}><code>${r.id}</code><span class="st">clear</span>
          <label class="muted">cd <input type="number" min="0" step="1" value="${r.cooldownMs / 1000}">s</label>
          <button data-fire="${r.id}" title="fire manually">fire</button></li>`).join('');
      }
      this.el.triggerConfig.querySelectorAll('li').forEach((li, i) => {
        const r = rows[i], st = li.querySelector('.st');
        const state = r.cooldownLeftMs > 0 ? 'cooldown' : r.pending;
        st.className = `st ${state}`; st.textContent = state === 'cooldown' ? `cd ${Math.ceil(r.cooldownLeftMs / 1000)}s` : state; st.title = r.lastReason || '';
      });
    }

    appendTriggerLog(entry) {
      if (this.el.triggerLog.querySelector('.empty')) this.el.triggerLog.innerHTML = '';
      const li = document.createElement('li');
      li.className = entry.severity;
      li.innerHTML = `<span class="t">${time(entry.at)}</span><span class="id">${esc(entry.trigger)}</span> ${esc(entry.reason)}
        <button data-toggle="snapshot">snapshot</button><pre hidden>${esc(JSON.stringify(entry.snapshot, null, 1))}</pre>`;
      this.el.triggerLog.prepend(li);
      while (this.el.triggerLog.children.length > 30) this.el.triggerLog.lastChild.remove();
    }
    clearTriggerLog() { this.el.triggerLog.innerHTML = '<li class="empty">Nothing fired yet.</li>'; }

    /** AI panel: status line + advice log. */
    renderAIStatus(advisor) {
      const st = advisor.status();
      const btn = $('#ai-ask'); btn.disabled = st.busy || !st.enabled; btn.textContent = st.busy ? 'Asking…' : 'Ask for advice now';
      this.el.aiStatus.innerHTML = `<span class="dot ${st.connected ? 'on' : st.enabled ? 'err' : ''}"></span>
        ${st.enabled ? (st.connected ? `connected · <code>${esc(st.model || '?')}</code>` : esc(st.error || 'connecting…')) : 'disabled'}
        ${st.busy ? ' · <b class="think">thinking…</b>' : ''} · calls ${st.calls} · next allowed in ${st.nextInS}s`;
    }
    appendAILog(rec) {
      if (this.el.aiLog.querySelector('.empty')) this.el.aiLog.innerHTML = '';
      const li = document.createElement('li');
      li.className = rec.error ? 'bad' : rec.tool === 'do_nothing' ? 'neutral' : 'good';
      const what = rec.error ? `error: ${esc(rec.error)}` : `<b>${esc(rec.tool)}</b> ${esc(JSON.stringify(rec.args || {}))}`;
      const tok = rec.usage ? ` · ${rec.usage.prompt_tokens}→${rec.usage.completion_tokens} tok${rec.reasoningTokens ? ` (${rec.reasoningTokens} thinking)` : ''}` : '';
      li.innerHTML = `<span class="t">${time(rec.at)}</span><span class="id">${esc(rec.trigger)}</span> ${what} <span class="muted">${rec.ms ? Math.round(rec.ms) + 'ms' : ''}${tok}</span>
        <button data-toggle="request">request</button><pre hidden>${esc(JSON.stringify(rec.request, null, 1))}</pre>
        <button data-toggle="response">response</button><pre hidden>${esc(typeof rec.response === 'string' ? rec.response : JSON.stringify(rec.response, null, 1))}</pre>`;
      this.el.aiLog.prepend(li);
      while (this.el.aiLog.children.length > 20) this.el.aiLog.lastChild.remove();
    }
    clearAILog() { this.el.aiLog.innerHTML = '<li class="empty">No calls yet.</li>'; }
    setSettings(cfg) {
      const f = $('#ai-settings');
      for (const [k, v] of Object.entries(cfg)) { const el = f.elements[k]; if (!el) continue; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; }
    }

    /** Advice strip above the map. */
    /** kind: 'hint' (default) | 'quiet' (do_nothing) | 'error' */
    showHint(text, kind = 'hint') {
      const strip = this.el.aiStrip;
      strip.innerHTML = `<span class="ai-tag">AI</span> ${esc(text)}`;
      strip.classList.remove('quiet', 'error'); if (kind !== 'hint') strip.classList.add(kind);
      strip.classList.add('show');
      clearTimeout(this._stripT);
      this._stripT = setTimeout(() => strip.classList.remove('show'), kind === 'hint' ? 12000 : 8000);
    }
    setThinking(on) {
      const strip = this.el.aiStrip;
      strip.classList.toggle('thinking', on);
      if (on && !strip.classList.contains('show')) strip.innerHTML = '<span class="ai-tag">AI</span> <span class="muted">thinking…</span>';
      if (!on && !strip.classList.contains('show')) strip.innerHTML = '';
    }

    renderMonitor(engine) {
      const st = this.input.getState();
      const armed = engine.status().filter(r => r.pending === 'armed' && r.enabled).map(r => r.id);
      this.el.monitor.innerHTML = `
        <span>t <b>${Math.round(this.game.s.t)}s</b></span>
        <span>idle <b>${st.idle_s.toFixed(1)}s</b></span>
        <span>cursor <b>${st.cursor.x},${st.cursor.y}</b> @ <b>${st.cursor.speed_px_s}</b> px/s</span>
        <span>hover <b class="${st.hovering ? 'on' : ''}">${st.hovering || '—'}</b>${st.hovering ? ` <b>${st.hover_s.toFixed(1)}s</b>` : ''}</span>
        <span>clicks/60s <b>${st.clicks_last_60s}</b></span>
        <span>decisions <b>${this.input.decisions.length}</b></span>
        <span>armed <b>${armed.join(', ') || '—'}</b></span>`;
      this.renderTriggerConfig(engine);
    }

    showGameOver(over) {
      $('#gameover-title').textContent = over.won ? 'The colony made it' : 'The colony fell';
      $('#gameover-text').textContent = `${over.reason} Score: ${over.score}.`;
      this.el.gameover.hidden = false;
    }

    /** Screen-space centre + size of any annotatable element by id (action:, resource:, staff:, task:, map:). */
    targetRect(id) {
      const el = document.querySelector(`[data-track="${CSS.escape(id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (!r.width) return null;
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }
    /** Ids the advisor may use as target_id (positions are resolved at execution time). */
    uiTargets() {
      const ids = new Set();
      document.querySelectorAll('[data-track]').forEach(el => {
        const id = el.dataset.track;
        if (/^(action:|resource:|staff:|task:|map:)/.test(id) && el.getBoundingClientRect().width) ids.add(id);
      });
      return [...ids];
    }
  }

  UI.mapLayout = mapLayout; UI.MAP = MAP;
  global.UI = UI;
})(window);
