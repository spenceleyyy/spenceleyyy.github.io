/* overlay.js — the AI's own layer on top of the game: a distinct cursor that
 * glides to targets, temporary annotations (circle / arrow / highlight), and a
 * speech bubble. Pointer-events are off so it never blocks the player.
 * Exposes: window.Overlay
 */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  class Overlay {
    constructor() {
      this.root = document.createElement('div');
      this.root.id = 'ai-overlay';
      this.root.innerHTML = `
        <svg id="ai-annotations" xmlns="${NS}"><defs><marker id="ai-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z"/></marker></defs></svg>
        <div id="ai-cursor" class="hidden"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2 L20 12 L12 13.5 L8 21 Z"/></svg><span class="ai-cursor-tag">AI</span></div>
        <div id="ai-bubble" class="hidden"></div>`;
      document.body.appendChild(this.root);
      this.svg = this.root.querySelector('#ai-annotations');
      this.cursor = this.root.querySelector('#ai-cursor');
      this.bubble = this.root.querySelector('#ai-bubble');
      this.pos = null;
      this._bubbleT = null;
      this.homeFn = () => ({ x: window.innerWidth - 60, y: 120 });
      window.addEventListener('resize', () => { if (this.atHome) this.goHome(true); });
    }

    /** Where the cursor rests when it has nothing to point at. */
    setHome(fn) { this.homeFn = fn; }
    goHome(instant = false) {
      const h = this.homeFn();
      if (instant) { this.pos = null; this.cursor.style.transitionDuration = '0ms'; }
      this.moveCursor(h.x, h.y);
      this.atHome = true;
    }

    /** Glide the cursor to viewport coords. CSS transition does the easing. */
    moveCursor(x, y) {
      this.atHome = false;
      if (!this.pos) { this.cursor.style.transform = `translate(${x}px, ${y}px)`; this.cursor.classList.remove('hidden'); this.pos = { x, y }; return; }
      const d = Math.hypot(x - this.pos.x, y - this.pos.y);
      this.cursor.style.transitionDuration = `${Math.min(1400, Math.max(350, d * 1.2))}ms`;
      this.cursor.style.transform = `translate(${x}px, ${y}px)`;
      this.cursor.classList.remove('hidden');
      this.pos = { x, y };
      if (!this.bubble.classList.contains('hidden')) this._placeBubble();
    }
    hideCursor() { this.cursor.classList.add('hidden'); this.pos = null; }
    setThinking(on) { this.cursor.classList.toggle('thinking', on); }

    /** shape: circle | arrow | highlight. rect = {x,y,w,h} centre + size in viewport px.
     *  ttlMs null = stays until clear() (i.e. until the player acts). Only one annotation at a time. */
    annotate({ shape = 'circle', rect, label = '', ttlMs = null }) {
      this.svg.querySelectorAll('.ann').forEach(n => n.remove());
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', `ann ${shape}`);
      const { x, y, w = 40, h = 40 } = rect;
      if (shape === 'circle') {
        const c = document.createElementNS(NS, 'ellipse');
        c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('rx', Math.max(22, w / 2 + 10)); c.setAttribute('ry', Math.max(22, h / 2 + 10));
        g.appendChild(c);
      } else if (shape === 'highlight') {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', x - w / 2 - 6); r.setAttribute('y', y - h / 2 - 6); r.setAttribute('width', w + 12); r.setAttribute('height', h + 12); r.setAttribute('rx', 10);
        g.appendChild(r);
      } else {
        const from = this.pos && Math.hypot(this.pos.x - x, this.pos.y - y) > 60 ? this.pos : { x: x - 90, y: y - 70 };
        const p = document.createElementNS(NS, 'path');
        const ex = x - Math.sign(x - from.x || 1) * (w / 2 + 8), ey = y - Math.sign(y - from.y || 1) * (h / 2 + 8);
        p.setAttribute('d', `M${from.x} ${from.y} Q${(from.x + ex) / 2} ${from.y} ${ex} ${ey}`);
        p.setAttribute('marker-end', 'url(#ai-arrowhead)');
        g.appendChild(p);
      }
      if (label) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', x); t.setAttribute('y', y - h / 2 - 16); t.setAttribute('text-anchor', 'middle');
        t.textContent = label;
        const bg = document.createElementNS(NS, 'rect'); bg.setAttribute('class', 'label-bg');
        g.appendChild(bg); g.appendChild(t);
        this.svg.appendChild(g);
        const bb = t.getBBox(); bg.setAttribute('x', bb.x - 6); bg.setAttribute('y', bb.y - 3); bg.setAttribute('width', bb.width + 12); bg.setAttribute('height', bb.height + 6); bg.setAttribute('rx', 5);
      } else this.svg.appendChild(g);
      if (ttlMs) { setTimeout(() => g.classList.add('fade'), Math.max(0, ttlMs - 800)); setTimeout(() => g.remove(), ttlMs); }
      return g;
    }

    /** Speech bubble next to the cursor. ttlMs null = stays until clear(). */
    say(text, ttlMs = null) {
      this.bubble.textContent = text;
      this.bubble.classList.remove('hidden');
      this._placeBubble();
      clearTimeout(this._bubbleT);
      if (ttlMs) this._bubbleT = setTimeout(() => this.bubble.classList.add('hidden'), ttlMs);
    }
    _placeBubble() {
      const b = this.bubble;
      if (!this.pos) { b.style.left = '50%'; b.style.top = '70px'; b.style.transform = 'translateX(-50%)'; return; }
      const vw = window.innerWidth, w = Math.min(320, vw - 40);
      let x = this.pos.x + 24, y = this.pos.y + 20;
      if (x + w > vw - 10) x = this.pos.x - w - 10;
      if (y + 120 > window.innerHeight) y = this.pos.y - 110;
      b.style.transform = 'none'; b.style.left = `${Math.max(10, x)}px`; b.style.top = `${Math.max(10, y)}px`; b.style.maxWidth = `${w}px`;
    }
    /** Player acted (or new game): drop the annotation and callout, cursor drifts home. */
    clear({ home = true } = {}) {
      this.svg.querySelectorAll('.ann').forEach(n => n.classList.add('fade'));
      setTimeout(() => this.svg.querySelectorAll('.ann.fade').forEach(n => n.remove()), 800);
      this.bubble.classList.add('hidden');
      if (home) setTimeout(() => this.goHome(), 400);
    }
  }

  global.Overlay = Overlay;
})(window);
