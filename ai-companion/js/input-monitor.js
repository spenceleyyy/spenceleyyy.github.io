/* input-monitor.js — tracks player input without ever streaming it anywhere.
 *
 * Tracks: idle time, cursor position/velocity, hover dwell on [data-track]
 * elements, clicks on tracked elements, and a ring buffer of recent decisions.
 * Everything is summarised on demand via getState(); raw events are not stored.
 *
 * Exposes: window.InputMonitor
 */
(function (global) {
  'use strict';

  class InputMonitor {
    constructor({ root = document, trackSelector = '[data-track]', decisionHistory = 10, hoverHistory = 8 } = {}) {
      this.root = root;
      this.trackSelector = trackSelector;
      this.limits = { decisions: decisionHistory, hovers: hoverHistory };

      const now = performance.now();
      this.lastInputAt = now;
      this.lastInputType = 'none';
      this.cursor = { x: 0, y: 0, speed: 0, lastMoveAt: now };
      this.hover = null;                // { id, el, since }
      this.hovers = [];                 // recent finished hovers { id, dwellMs, clicked }
      this.clicks = [];                 // recent clicks { id, x, y, t }
      this.decisions = [];              // recent decisions (see recordDecision)
      this.counters = { moves: 0, clicks: 0, keys: 0 };

      this._bound = {
        move: e => this._onMove(e),
        down: e => this._onDown(e),
        key: e => this._touch('key', e),
        over: e => this._onOver(e),
        out: e => this._onOut(e),
        touch: e => this._onTouch(e),
      };
    }

    attach() {
      document.addEventListener('mousemove', this._bound.move, { passive: true });
      document.addEventListener('mousedown', this._bound.down, { passive: true });
      document.addEventListener('keydown', this._bound.key, { passive: true });
      document.addEventListener('touchstart', this._bound.touch, { passive: true });
      this.root.addEventListener('mouseover', this._bound.over, { passive: true });
      this.root.addEventListener('mouseout', this._bound.out, { passive: true });
      return this;
    }

    detach() {
      document.removeEventListener('mousemove', this._bound.move);
      document.removeEventListener('mousedown', this._bound.down);
      document.removeEventListener('keydown', this._bound.key);
      document.removeEventListener('touchstart', this._bound.touch);
      this.root.removeEventListener('mouseover', this._bound.over);
      this.root.removeEventListener('mouseout', this._bound.out);
    }

    // ---------- event handlers ----------

    _touch(type) {
      this.lastInputAt = performance.now();
      this.lastInputType = type;
      if (type === 'key') this.counters.keys++;
    }

    _onMove(e) {
      const now = performance.now();
      const dt = now - this.cursor.lastMoveAt;
      if (dt > 0) {
        const dist = Math.hypot(e.clientX - this.cursor.x, e.clientY - this.cursor.y);
        const inst = (dist / dt) * 1000; // px/s
        // EMA smoothing; reset if the gap was long (avoids a huge spike after idle)
        this.cursor.speed = dt > 250 ? 0 : this.cursor.speed * 0.6 + inst * 0.4;
      }
      this.cursor.x = e.clientX; this.cursor.y = e.clientY; this.cursor.lastMoveAt = now;
      this.counters.moves++;
      this._touch('move');
    }

    _onDown(e) {
      const el = e.target.closest ? e.target.closest(this.trackSelector) : null;
      const id = el ? el.dataset.track : null;
      this.clicks.push({ id, x: e.clientX, y: e.clientY, t: Date.now() });
      if (this.clicks.length > 20) this.clicks.shift();
      if (this.hover && this.hover.id === id) this.hover.clicked = true;
      this.counters.clicks++;
      this._touch('click');
    }

    _onTouch(e) {
      const t = e.touches && e.touches[0];
      if (t) { this.cursor.x = t.clientX; this.cursor.y = t.clientY; }
      this._touch('touch');
    }

    _onOver(e) {
      const el = e.target.closest ? e.target.closest(this.trackSelector) : null;
      const id = el ? el.dataset.track : null;
      if (this.hover && this.hover.id === id) return;
      this._endHover();
      if (id) this.hover = { id, el, since: performance.now(), clicked: false };
    }

    _onOut(e) {
      if (!this.hover) return;
      const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(this.trackSelector) : null;
      if (!to || to !== this.hover.el) this._endHover();
    }

    _endHover() {
      if (!this.hover) return;
      const dwellMs = performance.now() - this.hover.since;
      if (dwellMs >= 300) {
        this.hovers.push({ id: this.hover.id, dwellMs: Math.round(dwellMs), clicked: this.hover.clicked, endedAt: Date.now() });
        if (this.hovers.length > this.limits.hovers) this.hovers.shift();
      }
      this.hover = null;
    }

    // ---------- decisions ----------

    /** Called by the game layer whenever the player commits a turn. */
    recordDecision({ turn, action, flags = [], outcome = '', at = Date.now() }) {
      this.decisions.push({ turn, action, flags, outcome, at });
      if (this.decisions.length > this.limits.decisions) this.decisions.shift();
    }

    // ---------- queries ----------

    idleMs(now = performance.now()) { return now - this.lastInputAt; }

    hoverDwellMs(now = performance.now()) { return this.hover ? now - this.hover.since : 0; }

    /** Compact summary suitable for a state snapshot. */
    getState(now = performance.now()) {
      const speed = now - this.cursor.lastMoveAt > 250 ? 0 : Math.round(this.cursor.speed);
      return {
        idle_s: Math.round(this.idleMs(now) / 100) / 10,
        last_input: this.lastInputType,
        cursor: { x: Math.round(this.cursor.x), y: Math.round(this.cursor.y), speed_px_s: speed },
        hovering: this.hover ? this.hover.id : null,
        hover_s: Math.round(this.hoverDwellMs(now) / 100) / 10,
        recent_hovers: this.hovers.slice(-5).map(h => ({ id: h.id, s: Math.round(h.dwellMs / 100) / 10, clicked: h.clicked })),
        clicks_last_60s: this.clicks.filter(c => Date.now() - c.t < 60000).length,
      };
    }
  }

  global.InputMonitor = InputMonitor;
})(window);
