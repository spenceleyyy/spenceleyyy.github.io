/* main.js — wires game + input monitor + triggers + UI + villagers + advisor, and runs the loop.
 * Everything is reachable from the devtools console via window.Companion.
 */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const seed = params.has('seed') ? Number(params.get('seed')) : undefined;

  // ----- settings (persisted) -----
  const SETTINGS_KEY = 'outpost.ai.settings';
  const settings = Object.assign({ enabled: true, allowAct: false, minIntervalS: 8, timeoutS: 60, noThink: true, baseUrl: 'http://localhost:1234/v1', model: '' },
    (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; } })());
  const saveSettings = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ } };

  const game = new Outpost.Game(seed);
  const input = new InputMonitor({ root: document.getElementById('app') }).attach();
  const ui = new UI({ game, input });
  const overlay = new Overlay();
  const client = new LLMClient({ baseUrl: settings.baseUrl, model: settings.model, timeoutMs: settings.timeoutS * 1000 });
  const advisor = new Advisor({ client, game, ui, overlay, settings });
  let paused = false;

  const engine = new TriggerEngine({
    intervalMs: 500,
    globalCooldownMs: 3000,
    context: {
      game, input, paused: () => paused,
      buildSnapshot: trigger => buildSnapshot({ game, input, trigger, map: () => ui.mapSummary(), uiTargets: () => ui.uiTargets() }),
    },
    onFire: entry => {
      const json = JSON.stringify(entry.snapshot);
      console.groupCollapsed(`%c[trigger] ${entry.trigger}%c ${entry.reason}  %c(~${Math.round(json.length / 4)} tokens)`, 'color:#c084fc;font-weight:bold', 'color:inherit', 'color:#8b95a7');
      console.log(entry.snapshot); console.log(json); console.groupEnd();
      ui.appendTriggerLog(entry);
      // manual fires (debug panel, "ask now") bypass the rate limit
      advisor.handle(entry, { force: entry.manual }).then(r => { if (typeof r === 'string') console.log(`%c[advisor] skipped: ${r}`, 'color:#8b95a7'); });
    },
  });
  defaultTriggers.forEach(t => engine.register(t));

  advisor.onRecord = rec => {
    console.groupCollapsed(`%c[advisor] ${rec.error ? 'ERROR ' + rec.error : rec.tool + ' ' + JSON.stringify(rec.args)}%c ${rec.ms ? Math.round(rec.ms) + 'ms' : ''}`, 'color:#7cf2c4;font-weight:bold', 'color:#8b95a7');
    console.log('request', rec.request); console.log('response', rec.response); console.groupEnd();
    ui.appendAILog(rec);
  };

  // ----- game -> monitor/triggers -----
  game.on('action', e => {
    if (e.source !== 'ai') {
      input.recordDecision({ turn: e.t, action: e.action, flags: e.flags, outcome: '', at: Date.now() });
      overlay.clear();   // the player acted: advice is consumed, marker and callout go, cursor drifts home
    }
    engine.evaluate('action');
  });
  game.on('event', () => engine.evaluate('event'));
  game.on('over', over => ui.showGameOver(over));

  // ----- UI -> game -----
  ui.onStartTask = (type, workers) => game.startTask(type, workers);
  ui.onStaff = (job, delta) => game.setStaff(job, game.s[job] + delta);
  ui.onPause = () => { paused = !paused; ui.paused = paused; };
  ui.onNewGame = () => {
    game.reset(Math.floor(Math.random() * 1e9));
    input.decisions = []; input.hovers = [];
    engine.reset(); ui.clearTriggerLog(); ui.clearAILog();
    ui._mapSig = null; ui._logSig = null; ui.villagers.reset();
    advisor.recentHints = []; overlay.clear();
    paused = false; ui.paused = false;
    console.log(`%c[game] new game, seed ${game.seed}`, 'color:#5aa9ff');
  };
  ui.onTriggerToggle = (id, on) => engine.setEnabled(id, on);
  ui.onTriggerCooldown = (id, ms) => engine.configure(id, { cooldownMs: ms });
  ui.onTriggerFire = id => engine.fireManually(id);
  ui.onAskAI = () => engine.fireManually('idle_trigger', 'player asked for advice');
  ui.onSetting = (name, value) => {
    settings[name] = value; saveSettings();
    if (name === 'baseUrl') { client.baseUrl = value.replace(/\/$/, ''); client.probe(); }
    if (name === 'model') { client.model = value; }
    if (name === 'timeoutS') { client.timeoutMs = value * 1000; }
    if (name === 'enabled' && value) client.probe();
  };
  ui.setSettings(settings);

  // keyboard: 1-4 start task with the card's worker count, F/P +/- staff, Space pause
  document.addEventListener('keydown', e => {
    if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
    const idx = '1234'.indexOf(e.key);
    if (idx >= 0) { const t = Outpost.TASKS[idx].id; game.startTask(t, Math.min(ui.workerChoice[t], game.idle())); e.preventDefault(); }
    else if (e.key === ' ') { ui.onPause(); e.preventDefault(); }
    else if (e.key === 'f') game.setStaff('farmers', game.s.farmers + 1);
    else if (e.key === 'F') game.setStaff('farmers', game.s.farmers - 1);
    else if (e.key === 'p') game.setStaff('power', game.s.power + 1);
    else if (e.key === 'P') game.setStaff('power', game.s.power - 1);
  });

  // ----- loops -----
  let last = performance.now();
  function tick() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!paused && !document.hidden) game.update(dt);
    ui.renderFrame();
  }
  let lastAnim = performance.now();
  (function anim(now) { const dt = Math.min(0.1, (now - lastAnim) / 1000); lastAnim = now; ui.animate(dt); requestAnimationFrame(anim); })(performance.now());

  ui.clearTriggerLog(); ui.clearAILog();
  ui.renderFrame();
  // the AI cursor is always on screen; it rests at the top-right corner of the village map
  overlay.setHome(() => { const m = document.getElementById('map'); const r = m ? m.getBoundingClientRect() : { right: window.innerWidth - 60, top: 100 }; return { x: r.right - 48, y: r.top + 28 }; });
  overlay.goHome(true);
  engine.start();
  setInterval(tick, 50);
  setInterval(() => { ui.renderMonitor(engine); ui.renderAIStatus(advisor); }, 200);
  if (settings.enabled) client.probe().then(r => console.log('%c[llm] ' + (r.ok ? `connected, model ${r.model}` : `not reachable: ${r.error}`), 'color:#7cf2c4'));

  window.Companion = { game, input, engine, ui, overlay, client, advisor, settings, buildSnapshot, Outpost, get paused() { return paused; }, set paused(v) { paused = v; ui.paused = v; } };
  console.log(`%c[game] Outpost ready, seed ${game.seed}. Inspect via window.Companion.`, 'color:#5aa9ff');
})();
