/* llm.js — minimal client for LM Studio's OpenAI-compatible chat completions API.
 * Non-blocking (fetch + AbortController timeout), parses tool calls, and falls
 * back to Qwen-style <tool_call>{…}</tool_call> text when the server returns
 * the call as plain content.
 * Exposes: window.LLMClient
 */
(function (global) {
  'use strict';

  class LLMClient {
    constructor({ baseUrl = 'http://localhost:1234/v1', model = '', timeoutMs = 60000 } = {}) {
      this.baseUrl = baseUrl.replace(/\/$/, '');
      this.model = model;
      this.timeoutMs = timeoutMs;
      this.busy = false;
      this.connected = false;
      this.lastError = null;
    }

    /** GET /models: checks connectivity and picks a model id if none configured. */
    async probe() {
      try {
        const res = await fetch(`${this.baseUrl}/models`, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const ids = (data.data || []).map(m => m.id);
        if (!this.model || !ids.includes(this.model)) this.model = ids.find(id => /qwen/i.test(id)) || ids[0] || this.model;
        this.connected = true; this.lastError = null;
        return { ok: true, models: ids, model: this.model };
      } catch (err) {
        this.connected = false; this.lastError = err.message || String(err);
        return { ok: false, error: this.lastError };
      }
    }

    /**
     * One chat completion with tools. Returns { toolCalls: [{name, args}], text, raw, ms, request }.
     * Throws on network/timeout errors.
     */
    async complete({ messages, tools, temperature = 0.3, maxTokens = 300, noThink = true, toolChoice = 'auto' }) {
      if (this.busy) throw new Error('client busy');
      this.busy = true;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      const request = { model: this.model, messages, tools, tool_choice: toolChoice, temperature, max_tokens: maxTokens, stream: false };
      if (noThink) {
        // Qwen 3.5 in LM Studio ignores chat_template_kwargs/enable_thinking (lmstudio-bug-tracker #1990),
        // so we prefill the assistant turn with an empty think block: the model then answers directly.
        request.chat_template_kwargs = { enable_thinking: false };
        request.messages = [...request.messages, { role: 'assistant', content: '<think>\n\n</think>\n\n' }];
      }
      const t0 = performance.now();
      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: ctrl.signal,
        });
        const ms = performance.now() - t0;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const raw = await res.json();
        this.connected = true; this.lastError = null;
        const msg = (raw.choices && raw.choices[0] && raw.choices[0].message) || {};
        const toolCalls = [];
        for (const tc of msg.tool_calls || []) {
          if (!tc.function) continue;
          let args = tc.function.arguments;
          if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = { _raw: args }; } }
          toolCalls.push({ name: tc.function.name, args: args || {} });
        }
        let text = (msg.content || '').trim();
        if (!toolCalls.length && text) {
          // Fallbacks: Qwen sometimes emits <tool_call>{…}</tool_call> inline, or a bare JSON object
          // shaped {name|tool_name, arguments|parameters|…flat args}.
          const norm = o => {
            if (!o || typeof o !== 'object') return null;
            const name = o.name || o.tool_name || o.tool || o.function;
            if (!name || typeof name !== 'string') return null;
            const { name: _n, tool_name: _t, tool: _o, function: _f, arguments: a, parameters: p, ...rest } = o;
            return { name, args: (a && typeof a === 'object') ? a : (p && typeof p === 'object') ? p : rest };
          };
          const re = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g; let m;
          while ((m = re.exec(text))) { try { const c = norm(JSON.parse(m[1])); if (c) toolCalls.push(c); } catch { /* ignore */ } }
          if (!toolCalls.length) { try { const c = norm(JSON.parse(text)); if (c) toolCalls.push(c); } catch { /* not JSON */ } }
          if (!toolCalls.length) { const j = text.match(/\{[\s\S]*\}/); if (j) { try { const c = norm(JSON.parse(j[0])); if (c) toolCalls.push(c); } catch { /* ignore */ } } }
          if (toolCalls.length) text = '';
        }
        const reasoningTokens = raw.usage && raw.usage.completion_tokens_details ? raw.usage.completion_tokens_details.reasoning_tokens : (msg.reasoning_content ? -1 : 0);
        return { toolCalls, text, raw, ms, request, usage: raw.usage || null, reasoningTokens };
      } catch (err) {
        this.lastError = err.name === 'AbortError' ? `timeout after ${this.timeoutMs}ms` : (err.message || String(err));
        if (err.name === 'TypeError') this.connected = false;
        throw new Error(this.lastError);
      } finally {
        clearTimeout(timer);
        this.busy = false;
      }
    }
  }

  global.LLMClient = LLMClient;
})(window);
