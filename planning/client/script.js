
// ── Backend URL — change this to your Railway URL after deploying ─────────────
const API_URL = window.NORTHSTAR_API_URL || "http://localhost:3001";

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(API_URL + path);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(API_URL + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}
async function apiPatch(path, body) {
  const res = await fetch(API_URL + path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}
async function apiDelete(path) {
  const res = await fetch(API_URL + path, { method: "DELETE" });
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(API_URL + path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

// Load state from API (falls back to localStorage if offline)
async function loadStateFromAPI() {
  try {
    const data = await apiGet("/api/state");
    if (data.initiatives) {
      state.initiatives = data.initiatives;
      state.features = data.features;
      state.subtasks = data.subtasks;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); // cache locally
      renderAll();
    }
  } catch {
    console.log("Offline — using local cache");
  }
}

// Push full state to API
async function syncToAPI() {
  try {
    await apiPut("/api/state", {
      initiatives: state.initiatives,
      features: state.features,
      subtasks: state.subtasks,
    });
  } catch {
    console.log("Sync failed — saved locally");
  }
}

const STORAGE_KEY = "northstar_dashboard_data_v4";
const DAY_PX = 28;
const DEFAULT_DATA = {"initiatives": [{"id": "9525a698-0054-4814-9584-ca2d3094097b", "name": "EOC", "owner": "Rob", "startDate": "2026-04-21", "endDate": "2026-07-31", "status": "", "notes": ""}, {"id": "1877f6a2-ca1b-4d42-aeda-79fcf95681f1", "name": "Qualifying Exam", "owner": "Rob", "startDate": "2026-04-21", "endDate": "2026-05-07", "status": "", "notes": ""}, {"id": "7f8cde08-e05b-42c5-9712-37b3d83254d3", "name": "Amazon", "owner": "Rob", "startDate": "2026-04-21", "endDate": "2026-06-30", "status": "Collab", "notes": "Ongoing Work"}, {"id": "3be0e18f-f70b-4bfe-9259-aa5607b0c4d7", "name": "pHRI Full paper", "owner": "Rob", "startDate": "2026-06-30", "endDate": "2026-12-31", "status": "Paper", "notes": ""}, {"id": "dc4f0e37-2a00-4e21-8c6c-4d66f86684dc", "name": "WDM", "owner": "Rob", "startDate": "2026-04-21", "endDate": "2026-04-30", "status": "", "notes": ""}], "features": [{"id": "ae62abd8-a7ee-4ddb-a35f-9c716bfef0a1", "initiativeId": "9525a698-0054-4814-9584-ca2d3094097b", "name": "Data Analysis", "priority": "90", "progress": "", "type": "Analysis", "milestone": "", "startDate": "2026-04-21", "endDate": "2026-05-08"}, {"id": "1a318882-a167-45aa-ad4c-e1a004a5a0bf", "initiativeId": "9525a698-0054-4814-9584-ca2d3094097b", "name": "Paper Writing", "priority": "80", "progress": "", "type": "Writing", "milestone": "", "startDate": "2026-04-21", "endDate": "2026-06-02"}, {"id": "b4546ad6-3320-41ec-a7cf-087898276bce", "initiativeId": "1877f6a2-ca1b-4d42-aeda-79fcf95681f1", "name": "Revise Presetation", "priority": "50", "progress": "", "type": "Revision", "milestone": "", "startDate": "2026-04-28", "endDate": "2026-04-30"}, {"id": "66ae316b-f35b-40ba-810e-f572913ed895", "initiativeId": "7f8cde08-e05b-42c5-9712-37b3d83254d3", "name": "Revise Presentation", "priority": "100", "progress": "", "type": "", "milestone": "", "startDate": "2026-04-21", "endDate": "2026-04-22"}, {"id": "323b8a2e-aaf2-4b06-9c3b-4e756089202b", "initiativeId": "7f8cde08-e05b-42c5-9712-37b3d83254d3", "name": "Meet With Them", "priority": "100", "progress": "", "type": "", "milestone": "", "startDate": "2026-04-21", "endDate": "2026-04-30"}, {"id": "10700a82-bd9d-4dc8-8fd8-1c29a97debe5", "initiativeId": "dc4f0e37-2a00-4e21-8c6c-4d66f86684dc", "name": "Send Updates After Meeting", "priority": "100", "progress": "", "type": "", "milestone": "", "startDate": "2026-04-21", "endDate": "2026-04-21"}, {"id": "c9117220-e14b-4e11-b9be-d138059f2aa2", "initiativeId": "dc4f0e37-2a00-4e21-8c6c-4d66f86684dc", "name": "Determine Demo Directions", "priority": "100", "progress": "", "type": "", "milestone": "", "startDate": "2026-04-21", "endDate": "2026-04-22"}, {"id": "67918102-c1d7-4dd3-9bb8-b722c16e4776", "initiativeId": "dc4f0e37-2a00-4e21-8c6c-4d66f86684dc", "name": "Oversee VR/AR Dev", "priority": "", "progress": "", "type": "", "milestone": "", "startDate": "2026-04-21", "endDate": "2026-04-30"}, {"id": "d602931f-d0c3-4383-8070-c94edc2dcabc", "initiativeId": "dc4f0e37-2a00-4e21-8c6c-4d66f86684dc", "name": "Determine What Else is Needed", "priority": "", "progress": "", "type": "", "milestone": "", "startDate": "2026-04-30", "endDate": "2026-05-13"}], "subtasks": [{"id": "64b40ef9-a47f-4364-8542-9a745f5502f9", "featureId": "ae62abd8-a7ee-4ddb-a35f-9c716bfef0a1", "name": "Audio Analysis", "owner": "Aakash", "deadline": "2026-04-30", "status": "In progress", "notes": ""}, {"id": "4912649c-e95f-4f44-b45b-0fb3174985ba", "featureId": "ae62abd8-a7ee-4ddb-a35f-9c716bfef0a1", "name": "Video Analysis", "owner": "Rob", "deadline": "2026-05-08", "status": "In progress", "notes": ""}, {"id": "95b46234-b22b-4222-bcff-e4381be413f9", "featureId": "1a318882-a167-45aa-ad4c-e1a004a5a0bf", "name": "Introduction", "owner": "Rob", "deadline": "2026-05-12", "status": "Not started", "notes": ""}, {"id": "019ba9ea-cf85-400a-b1c2-1db26e6fc692", "featureId": "1a318882-a167-45aa-ad4c-e1a004a5a0bf", "name": "Methods", "owner": "Rob", "deadline": "2026-05-14", "status": "Not started", "notes": ""}, {"id": "4e21d783-6340-413f-86d5-03df3f6f9fc7", "featureId": "1a318882-a167-45aa-ad4c-e1a004a5a0bf", "name": "Results", "owner": "Rob", "deadline": "2026-05-16", "status": "Not started", "notes": ""}, {"id": "a28985a2-c0b6-47e2-927a-76259c6e3a84", "featureId": "1a318882-a167-45aa-ad4c-e1a004a5a0bf", "name": "Discussion", "owner": "Rob", "deadline": "2026-05-26", "status": "Not started", "notes": ""}, {"id": "535e839b-2b67-411e-9ff7-9a63a8ca3752", "featureId": "b4546ad6-3320-41ec-a7cf-087898276bce", "name": "Send Presentation to Comittee!", "owner": "Rob", "deadline": "2026-04-30", "status": "Not started", "notes": ""}], "expandedInitiatives": ["9525a698-0054-4814-9584-ca2d3094097b", "1877f6a2-ca1b-4d42-aeda-79fcf95681f1"], "expandedFeatures": [], "panelOrder": ["roadmap", "features", "subtasks", "deadlines", "donut"]};

const defaultState = {
  initiatives: DEFAULT_DATA.initiatives,
  features: DEFAULT_DATA.features,
  subtasks: DEFAULT_DATA.subtasks,
  expandedInitiatives: DEFAULT_DATA.expandedInitiatives,
  expandedFeatures: DEFAULT_DATA.expandedFeatures,
  panelOrder: DEFAULT_DATA.panelOrder
};

let state = loadState();
let dragEnabled = false;
let timelineBoundsCache = null;
let currentDrag = null;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);
    const parsed = JSON.parse(raw);
    return {
      initiatives: Array.isArray(parsed.initiatives) ? parsed.initiatives : clone(defaultState.initiatives),
      features: Array.isArray(parsed.features) ? parsed.features : clone(defaultState.features),
      subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks : clone(defaultState.subtasks),
      expandedInitiatives: Array.isArray(parsed.expandedInitiatives) ? parsed.expandedInitiatives : clone(defaultState.expandedInitiatives),
      expandedFeatures: Array.isArray(parsed.expandedFeatures) ? parsed.expandedFeatures : clone(defaultState.expandedFeatures),
      panelOrder: Array.isArray(parsed.panelOrder) && parsed.panelOrder.length ? parsed.panelOrder : clone(defaultState.panelOrder)
    };
  } catch {
    return clone(defaultState);
  }
}

function saveState(showMessage = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  syncToAPI();
  if (showMessage) alert("Saved.");
}

function sanitize(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {month: "short", day: "numeric"});
}

function daysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / ms);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getFeatureWindow(feature) {
  return { startDate: feature.startDate, endDate: feature.endDate };
}

function getInitiativeColor(initiativeId) {
  const palette = [
    {fill:"#ECCAC6", border:"#D0AFAB", dot:"#B8786F"},  // rose
    {fill:"#C9D8DE", border:"#A8C2CB", dot:"#5A8A9A"},  // sky
    {fill:"#C2E5CD", border:"#9DCFAE", dot:"#4E9A68"},  // mint
    {fill:"#F7EAB3", border:"#E8D485", dot:"#B89A2A"},  // yellow
    {fill:"#E8D5E8", border:"#C9A8C9", dot:"#8A5A8A"},  // lavender
    {fill:"#D0E8E5", border:"#A8CFC9", dot:"#3D8A82"},  // teal
    {fill:"#F2DCC5", border:"#D9B895", dot:"#A06B35"},  // peach
  ];
  const initiatives = state.initiatives;
  const idx = Math.max(0, initiatives.findIndex(i => i.id === initiativeId));
  return palette[idx % palette.length];
}

function getFeatureColor(feature) {
  return getInitiativeColor(feature.initiativeId);
}

function getTimelineBounds() {
  const starts = [];
  const ends = [];
  state.initiatives.forEach(i => {
    if (i.startDate) starts.push(new Date(i.startDate + "T00:00:00"));
    if (i.endDate) ends.push(new Date(i.endDate + "T00:00:00"));
  });
  state.features.forEach(f => {
    if (f.startDate) starts.push(new Date(f.startDate + "T00:00:00"));
    if (f.endDate) ends.push(new Date(f.endDate + "T00:00:00"));
  });
  state.subtasks.forEach(s => {
    if (s.deadline) {
      const d = new Date(s.deadline + "T00:00:00");
      starts.push(d); ends.push(d);
    }
  });
  if (!starts.length || !ends.length) return null;
  const min = new Date(Math.min(...starts));
  const max = new Date(Math.max(...ends));
  min.setDate(min.getDate() - 2);
  max.setDate(max.getDate() + 2);
  return { min, max, totalDays: Math.max(1, daysBetween(min.toISOString().slice(0,10), max.toISOString().slice(0,10)) + 1) };
}

function buildPanelGrid() {
  const grid = document.getElementById("panelGrid");
  grid.innerHTML = "";
  state.panelOrder.forEach(panelName => {
    const tpl = document.getElementById(`panel-template-${panelName}`);
    if (!tpl) return;
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.draggable = dragEnabled;
    attachPanelMovement(node);
    attachDragHandlers(node);
    grid.appendChild(node);
  });
}

function attachPanelMovement(node) {
  const name = node.dataset.panel;
  node.querySelectorAll(".move-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.dir === "up" ? -1 : 1;
      const idx = state.panelOrder.indexOf(name);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= state.panelOrder.length) return;
      [state.panelOrder[idx], state.panelOrder[next]] = [state.panelOrder[next], state.panelOrder[idx]];
      saveState();
      renderAll();
    });
  });
}

function attachDragHandlers(node) {
  const name = node.dataset.panel;
  node.addEventListener("dragstart", e => {
    if (!dragEnabled) return;
    node.classList.add("dragging");
    e.dataTransfer.setData("text/plain", name);
  });
  node.addEventListener("dragend", () => node.classList.remove("dragging"));
  node.addEventListener("dragover", e => {
    if (!dragEnabled) return;
    e.preventDefault();
    node.classList.add("drop-target");
  });
  node.addEventListener("dragleave", () => node.classList.remove("drop-target"));
  node.addEventListener("drop", e => {
    if (!dragEnabled) return;
    e.preventDefault();
    node.classList.remove("drop-target");
    const dragged = e.dataTransfer.getData("text/plain");
    if (!dragged || dragged === name) return;
    const from = state.panelOrder.indexOf(dragged);
    const to = state.panelOrder.indexOf(name);
    const item = state.panelOrder.splice(from, 1)[0];
    state.panelOrder.splice(to, 0, item);
    saveState();
    renderAll();
  });
}

function renderTimelineHeader(bounds) {
  const header = document.getElementById("timelineHeader");
  header.innerHTML = "";
  if (!bounds) {
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement("div");
      cell.className = "roadmap-head";
      header.appendChild(cell);
    }
    return;
  }
  const current = new Date(bounds.min);
  while (current <= bounds.max) {
    const cell = document.createElement("div");
    cell.className = "roadmap-head";
    cell.textContent = current.toLocaleDateString(undefined, {month: "short", day: "numeric"});
    header.appendChild(cell);
    current.setDate(current.getDate() + 1);
  }
}

function buildTimelineRows() {
  const rows = [];
  state.initiatives.forEach(initiative => {
    rows.push({ type: "initiative", item: initiative, indent: 0 });
    if (state.expandedInitiatives.includes(initiative.id)) {
      const initiativeFeatures = state.features.filter(f => f.initiativeId === initiative.id);
      initiativeFeatures.forEach(feature => {
        rows.push({ type: "feature", item: feature, indent: 1 });
        if (state.expandedFeatures.includes(feature.id)) {
          const featureSubtasks = state.subtasks.filter(s => s.featureId === feature.id);
          featureSubtasks.forEach(subtask => rows.push({ type: "subtask", item: subtask, indent: 2 }));
        }
      });
    }
  });
  return rows;
}

function renderTimelineRowLabel(row, hasChildren, isExpanded) {
  const item = row.item;
  const typeLabel = row.type.charAt(0).toUpperCase() + row.type.slice(1);
  const name = item.name || "Untitled";
  const color = row.type === "initiative"
    ? getInitiativeColor(item.id).dot
    : row.type === "feature"
      ? getFeatureColor(item).dot
      : getFeatureColor(state.features.find(f => f.id === item.featureId) || {initiativeId: state.initiatives[0]?.id}).dot;

  return `
    <div class="name-wrap indent-${row.indent}">
      ${hasChildren ? `<button class="expand-btn ${isExpanded ? 'open' : ''}" data-expand-type="${row.type}" data-expand-id="${item.id}"><span class="chev">▶</span></button>` : `<span style="width:22px;display:inline-block;"></span>`}
      <span class="item-dot" style="background:${color}"></span>
      <span class="name-text">${sanitize(name)}</span>
      <span class="type-pill">${sanitize(typeLabel)}</span>
    </div>
  `;
}

function makeTimelineBar(type, item, leftPx, widthPx, fill, border, label) {
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.left = `${leftPx}px`;
  bar.style.width = `${Math.max(14, widthPx)}px`;
  bar.style.background = fill;
  bar.style.borderColor = border;
  bar.dataset.dragType = type;
  bar.dataset.id = item.id;

  const text = document.createElement("div");
  text.className = "bar-label";
  text.textContent = label || "";
  bar.appendChild(text);

  const leftHandle = document.createElement("div");
  leftHandle.className = "bar-handle left";
  leftHandle.dataset.handle = "left";
  const rightHandle = document.createElement("div");
  rightHandle.className = "bar-handle right";
  rightHandle.dataset.handle = "right";
  bar.appendChild(leftHandle);
  bar.appendChild(rightHandle);

  bar.addEventListener("pointerdown", startTimelineDrag);
  return bar;
}

function startTimelineDrag(e) {
  const bar = e.currentTarget;
  const handle = e.target.dataset.handle || "move";
  currentDrag = {
    el: bar,
    type: bar.dataset.dragType,
    id: bar.dataset.id,
    handle,
    startX: e.clientX
  };
  bar.setPointerCapture(e.pointerId);

  if (currentDrag.type === "initiative") {
    currentDrag.item = state.initiatives.find(i => i.id === currentDrag.id);
  } else {
    currentDrag.item = state.features.find(f => f.id === currentDrag.id);
  }
  currentDrag.origStart = currentDrag.item.startDate;
  currentDrag.origEnd = currentDrag.item.endDate;

  bar.addEventListener("pointermove", onTimelineDrag);
  bar.addEventListener("pointerup", endTimelineDrag);
  bar.addEventListener("pointercancel", endTimelineDrag);
}

function onTimelineDrag(e) {
  if (!currentDrag) return;
  const diffDays = Math.round((e.clientX - currentDrag.startX) / DAY_PX);
  let start = currentDrag.origStart;
  let end = currentDrag.origEnd;

  if (currentDrag.handle === "move") {
    start = addDays(currentDrag.origStart, diffDays);
    end = addDays(currentDrag.origEnd, diffDays);
  } else if (currentDrag.handle === "left") {
    start = addDays(currentDrag.origStart, diffDays);
    if (start > end) start = end;
  } else if (currentDrag.handle === "right") {
    end = addDays(currentDrag.origEnd, diffDays);
    if (end < start) end = start;
  }

  currentDrag.item.startDate = start;
  currentDrag.item.endDate = end;
  renderAll();
}

function endTimelineDrag(e) {
  if (!currentDrag) return;
  currentDrag.el.removeEventListener("pointermove", onTimelineDrag);
  currentDrag.el.removeEventListener("pointerup", endTimelineDrag);
  currentDrag.el.removeEventListener("pointercancel", endTimelineDrag);
  saveState();
  currentDrag = null;
}

function renderRoadmap() {
  const body = document.getElementById("roadmapRows");
  if (!body) return;
  body.innerHTML = "";

  const bounds = getTimelineBounds();
  timelineBoundsCache = bounds;
  renderTimelineHeader(bounds);

  if (!state.initiatives.length || !bounds) {
    for (let i = 0; i < 8; i++) {
      const row = document.createElement("div");
      row.className = "roadmap-row";
      row.innerHTML = `<div class="release-cell">${i === 0 ? '<span style="color:#2a6fdb;">Default data loaded</span>' : ''}</div><div class="timeline-grid">${'<div class="day-cell"></div>'.repeat(20)}</div>`;
      body.appendChild(row);
    }
    return;
  }

  const minDate = bounds.min.toISOString().slice(0,10);
  const rows = buildTimelineRows();

  rows.forEach(row => {
    const el = document.createElement("div");
    el.className = "roadmap-row";

    const label = document.createElement("div");
    label.className = "release-cell";

    let hasChildren = false;
    let isExpanded = false;
    if (row.type === "initiative") {
      hasChildren = state.features.some(f => f.initiativeId === row.item.id);
      isExpanded = state.expandedInitiatives.includes(row.item.id);
    } else if (row.type === "feature") {
      hasChildren = state.subtasks.some(s => s.featureId === row.item.id);
      isExpanded = state.expandedFeatures.includes(row.item.id);
    }

    label.innerHTML = renderTimelineRowLabel(row, hasChildren, isExpanded);
    el.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "timeline-grid";

    for (let i = 0; i < bounds.totalDays; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell";
      grid.appendChild(cell);
    }

    if (row.type === "initiative") {
      const c = getInitiativeColor(row.item.id);
      const startOffset = daysBetween(minDate, row.item.startDate);
      const duration = Math.max(1, daysBetween(row.item.startDate, row.item.endDate) + 1);
      grid.appendChild(makeTimelineBar("initiative", row.item, startOffset * DAY_PX + 2, duration * DAY_PX - 4, c.fill, c.border, row.item.status || ""));
    } else if (row.type === "feature") {
      const c = getFeatureColor(row.item);
      const startOffset = daysBetween(minDate, row.item.startDate);
      const duration = Math.max(1, daysBetween(row.item.startDate, row.item.endDate) + 1);
      grid.appendChild(makeTimelineBar("feature", row.item, startOffset * DAY_PX + 2, duration * DAY_PX - 4, c.fill, c.border, row.item.type || ""));
    } else if (row.type === "subtask" && row.item.deadline) {
      const feature = state.features.find(f => f.id === row.item.featureId);
      const c = getFeatureColor(feature || {initiativeId: state.initiatives[0]?.id});
      const offset = daysBetween(minDate, row.item.deadline);
      const marker = document.createElement("div");
      marker.className = "subtask-marker";
      marker.style.left = `${offset * DAY_PX + 6}px`;
      marker.style.width = "16px";
      marker.style.background = c.fill;
      marker.style.borderColor = c.border;
      grid.appendChild(marker);
    }

    el.appendChild(grid);
    body.appendChild(el);
  });

  body.querySelectorAll("[data-expand-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.expandType;
      const id = btn.dataset.expandId;
      const key = type === "initiative" ? "expandedInitiatives" : "expandedFeatures";
      const set = new Set(state[key]);
      if (set.has(id)) set.delete(id); else set.add(id);
      state[key] = [...set];
      saveState();
      renderAll();
    });
  });
}

function renderFeatureSelect() {
  const sel = document.getElementById("featureInitiative");
  if (!sel) return;
  sel.innerHTML = "";
  if (!state.initiatives.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No initiatives yet";
    sel.appendChild(opt);
    return;
  }
  state.initiatives.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    sel.appendChild(opt);
  });
}

function renderSubtaskFeatureSelect() {
  const sel = document.getElementById("subtaskFeature");
  if (!sel) return;
  sel.innerHTML = "";
  if (!state.features.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No features yet";
    sel.appendChild(opt);
    return;
  }
  state.features.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    sel.appendChild(opt);
  });
}

function renderFeatures() {
  const body = document.getElementById("featuresBody");
  const empty = document.getElementById("featuresEmpty");
  if (!body || !empty) return;
  body.innerHTML = "";

  if (!state.features.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  state.features.forEach(feature => {
    const initiative = state.initiatives.find(i => i.id === feature.initiativeId);
    const progress = Math.max(0, Math.min(100, Number(feature.progress || 0)));
    const c = getFeatureColor(feature);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="swatch" style="background:${c.fill};border:1px solid ${c.border};display:inline-block;margin-right:8px;vertical-align:middle;"></span>${sanitize(feature.name)}</td>
      <td><span style="background:${c.fill};border:1px solid ${c.border};border-radius:20px;padding:2px 9px;font-size:12px;color:${c.dot}">${sanitize(initiative ? initiative.name : "—")}</span></td>
      <td>${priorityBadge(feature.priority)}</td>
      <td><span class="progress-track"><span class="progress-fill" style="width:${progress}%"></span></span><span style="font-size:12px;color:var(--text-mid)">${progress}%</span></td>
      <td style="color:var(--text-mid);font-size:12.5px">${sanitize(feature.type || "")}</td>
      <td style="color:var(--text-muted);font-size:12px">${sanitize(feature.milestone || "")}</td>
      <td style="color:var(--text-mid);font-size:12.5px">${feature.startDate ? sanitize(formatDateLabel(feature.startDate)) : ""}</td>
      <td style="color:var(--text-mid);font-size:12.5px">${feature.endDate ? sanitize(formatDateLabel(feature.endDate)) : ""}</td>
      <td><button class="delete-btn" data-type="feature" data-id="${feature.id}">✕</button></td>
    `;
    body.appendChild(tr);
  });
}

function renderSubtasks() {
  const body = document.getElementById("subtasksBody");
  const empty = document.getElementById("subtasksEmpty");
  if (!body || !empty) return;
  body.innerHTML = "";

  if (!state.subtasks.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  const today = new Date().toISOString().slice(0,10);
  const sorted = [...state.subtasks].sort((a,b) => (a.deadline || "").localeCompare(b.deadline || ""));
  sorted.forEach(subtask => {
    const feature = state.features.find(f => f.id === subtask.featureId);
    const isOverdue = subtask.deadline && subtask.deadline < today && subtask.status !== "Done";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${sanitize(subtask.name)}</td>
      <td>${sanitize(feature ? feature.name : "")}</td>
      <td>${sanitize(subtask.owner || "")}</td>
      <td style="${isOverdue ? 'color:var(--rose-dk);font-weight:600' : ''}">${subtask.deadline ? sanitize(formatDateLabel(subtask.deadline)) : ""}${isOverdue ? ' ⚠' : ''}</td>
      <td>${statusBadge(subtask.status)}</td>
      <td style="color:var(--text-muted);font-size:12px">${sanitize(subtask.notes || "")}</td>
      <td><button class="delete-btn" data-type="subtask" data-id="${subtask.id}">✕</button></td>
    `;
    body.appendChild(tr);
  });
}

function renderDeadlines() {
  const list = document.getElementById("deadlineList");
  const empty = document.getElementById("deadlineEmpty");
  if (!list || !empty) return;
  list.innerHTML = "";

  const today = new Date().toISOString().slice(0,10);
  const soon = new Date(); soon.setDate(soon.getDate()+3);
  const soonStr = soon.toISOString().slice(0,10);

  const sorted = [...state.subtasks].filter(x => x.deadline && x.status !== "Done")
    .sort((a,b) => a.deadline.localeCompare(b.deadline)).slice(0, 12);
  if (!sorted.length) { empty.classList.remove("hidden"); return; }

  empty.classList.add("hidden");
  sorted.forEach(item => {
    const feature = state.features.find(f => f.id === item.featureId);
    const initiative = feature ? state.initiatives.find(i => i.id === feature.initiativeId) : null;
    const isOverdue = item.deadline < today;
    const isSoon = !isOverdue && item.deadline <= soonStr;
    const div = document.createElement("div");
    div.className = "deadline-item";
    div.innerHTML = `
      <div class="deadline-main">
        <div class="deadline-title">${sanitize(item.name)}</div>
        <div class="deadline-meta">${sanitize(initiative ? initiative.name : "")}${feature ? ' › ' + sanitize(feature.name) : ''}</div>
      </div>
      <div class="deadline-date ${isOverdue ? 'overdue' : isSoon ? 'soon' : ''}">
        ${isOverdue ? '⚠ Overdue · ' : isSoon ? '⏰ Soon · ' : ''}${sanitize(formatDateLabel(item.deadline))}
      </div>
    `;
    list.appendChild(div);
  });
}

function renderDonut() {
  const canvas = document.getElementById("donutCanvas");
  const empty = document.getElementById("donutEmpty");
  const legend = document.getElementById("donutLegend");
  if (!canvas || !empty || !legend) return;
  const ctx = canvas.getContext("2d");
  legend.innerHTML = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.subtasks.length) {
    empty.classList.remove("hidden");
    canvas.classList.add("hidden");
    legend.classList.add("hidden");
    return;
  }

  const statusOrder = ["Not started", "In progress", "Blocked", "Done"];
  const counts = {};
  statusOrder.forEach(s => counts[s] = 0);
  state.subtasks.forEach(s => {
    if (counts[s.status] === undefined) counts[s.status] = 0;
    counts[s.status] += 1;
  });

  const data = Object.entries(counts).map(([name, value]) => ({name, value})).filter(x => x.value > 0);
  if (!data.length) {
    empty.classList.remove("hidden");
    canvas.classList.add("hidden");
    legend.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  canvas.classList.remove("hidden");
  legend.classList.remove("hidden");

  const colorMap = {"Not started":"#C9E4EF","In progress":"#F7EAB3","Blocked":"#F5D8D3","Done":"#C2E8D5"};
  const total = data.reduce((a,b)=>a+b.value,0);
  let start = -Math.PI / 2;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 78;
  const inner = 38;

  data.forEach((item) => {
    const angle = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colorMap[item.name] || "#94a3b8";
    ctx.fill();
    start += angle;
  });

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  data.forEach((item) => {
    const div = document.createElement("div");
    div.className = "legend-item";
    div.innerHTML = `
      <div class="legend-left">
        <span class="swatch" style="background:${colorMap[item.name] || '#94a3b8'}"></span>
        <span>${sanitize(item.name)}</span>
      </div>
      <strong>${item.value}</strong>
    `;
    legend.appendChild(div);
  });
}

function bindDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      const id = btn.dataset.id;
      if (type === "feature") {
        state.features = state.features.filter(x => x.id !== id);
        state.subtasks = state.subtasks.filter(x => x.featureId !== id);
        state.expandedFeatures = state.expandedFeatures.filter(x => x !== id);
      } else {
        state.subtasks = state.subtasks.filter(x => x.id !== id);
      }
      saveState();
      renderAll();
    };
  });
}

function renderAll() {
  buildPanelGrid();
  renderRoadmap();
  renderFeatureSelect();
  renderSubtaskFeatureSelect();
  renderFeatures();
  renderSubtasks();
  renderDeadlines();
  renderDonut();
  bindDeleteButtons();
  bindRoadmapFullscreen();
  document.getElementById("editLayoutBtn").textContent = dragEnabled ? "Finish rearranging" : "Rearrange panels";
}

document.getElementById("initiativeForm").addEventListener("submit", e => {
  e.preventDefault();
  const startDate = document.getElementById("initiativeStart").value;
  const endDate = document.getElementById("initiativeEnd").value;
  if (!startDate || !endDate) return;
  if (endDate < startDate) {
    alert("End date must be after start date.");
    return;
  }
  const item = {
    id: crypto.randomUUID(),
    name: document.getElementById("initiativeName").value.trim(),
    owner: document.getElementById("initiativeOwner").value.trim(),
    startDate,
    endDate,
    status: document.getElementById("initiativeStatus").value.trim(),
    notes: document.getElementById("initiativeNotes").value.trim()
  };
  if (!item.name) return;
  state.initiatives.push(item);
  saveState();
  e.target.reset();
  renderAll();
});

document.getElementById("featureForm").addEventListener("submit", e => {
  e.preventDefault();
  const initiativeId = document.getElementById("featureInitiative").value;
  const startDate = document.getElementById("featureStart").value;
  const endDate = document.getElementById("featureEnd").value;
  if (!initiativeId) {
    alert("Add an initiative first.");
    return;
  }
  if (!startDate || !endDate) {
    alert("Feature start and end dates are required.");
    return;
  }
  if (endDate < startDate) {
    alert("Feature end date must be after start date.");
    return;
  }
  const item = {
    id: crypto.randomUUID(),
    initiativeId,
    name: document.getElementById("featureName").value.trim(),
    priority: document.getElementById("featurePriority").value.trim(),
    progress: document.getElementById("featureProgress").value.trim(),
    type: document.getElementById("featureType").value.trim(),
    milestone: document.getElementById("featureMilestone").value.trim(),
    startDate,
    endDate
  };
  if (!item.name) return;
  state.features.push(item);
  if (!state.expandedInitiatives.includes(initiativeId)) state.expandedInitiatives.push(initiativeId);
  saveState();
  e.target.reset();
  renderAll();
});

document.getElementById("subtaskForm").addEventListener("submit", e => {
  e.preventDefault();
  const featureId = document.getElementById("subtaskFeature").value;
  const deadline = document.getElementById("subtaskDeadline").value;
  if (!featureId) {
    alert("Add a feature first.");
    return;
  }
  if (!deadline) return;
  const item = {
    id: crypto.randomUUID(),
    featureId,
    name: document.getElementById("subtaskName").value.trim(),
    owner: document.getElementById("subtaskOwner").value.trim(),
    deadline,
    status: document.getElementById("subtaskStatus").value,
    notes: document.getElementById("subtaskNotes").value.trim()
  };
  if (!item.name) return;
  state.subtasks.push(item);
  if (!state.expandedFeatures.includes(featureId)) state.expandedFeatures.push(featureId);
  const feature = state.features.find(f => f.id === featureId);
  if (feature && !state.expandedInitiatives.includes(feature.initiativeId)) state.expandedInitiatives.push(feature.initiativeId);
  saveState();
  e.target.reset();
  renderAll();
});

document.getElementById("saveBtn").addEventListener("click", () => saveState(true));

document.getElementById("exportBtn").addEventListener("click", () => {
  saveState();
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "northstar-dashboard-data.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    state = {
      initiatives: Array.isArray(parsed.initiatives) ? parsed.initiatives : clone(defaultState.initiatives),
      features: Array.isArray(parsed.features) ? parsed.features : clone(defaultState.features),
      subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks : clone(defaultState.subtasks),
      expandedInitiatives: Array.isArray(parsed.expandedInitiatives) ? parsed.expandedInitiatives : [],
      expandedFeatures: Array.isArray(parsed.expandedFeatures) ? parsed.expandedFeatures : [],
      panelOrder: Array.isArray(parsed.panelOrder) && parsed.panelOrder.length ? parsed.panelOrder : clone(defaultState.panelOrder)
    };
    saveState();
    renderAll();
    alert("Imported successfully.");
  } catch {
    alert("Could not import that file.");
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset to the default attached data?")) return;
  state = clone(defaultState);
  saveState();
  renderAll();
});

document.getElementById("editLayoutBtn").addEventListener("click", () => {
  dragEnabled = !dragEnabled;
  renderAll();
});

renderAll();


function bindRoadmapFullscreen() {
  const btn = document.getElementById("roadmapFullscreenBtn");
  const roadmapPanel = document.querySelector('[data-panel="roadmap"]');
  if (!btn || !roadmapPanel) return;

  btn.addEventListener("click", () => {
    const isOpen = roadmapPanel.classList.contains("roadmap-fullscreen");
    if (isOpen) {
      closeRoadmapFullscreen();
    } else {
      openRoadmapFullscreen(roadmapPanel, btn);
    }
  });
}

function openRoadmapFullscreen(roadmapPanel, btn) {
  if (document.querySelector(".roadmap-fullscreen-backdrop")) return;

  const backdrop = document.createElement("div");
  backdrop.className = "roadmap-fullscreen-backdrop";
  backdrop.addEventListener("click", closeRoadmapFullscreen);
  document.body.appendChild(backdrop);

  roadmapPanel.classList.add("roadmap-fullscreen");
  document.body.classList.add("roadmap-fullscreen-active");
  btn.textContent = "Exit full screen";
}

function closeRoadmapFullscreen() {
  const roadmapPanel = document.querySelector('[data-panel="roadmap"]');
  const btn = document.getElementById("roadmapFullscreenBtn");
  const backdrop = document.querySelector(".roadmap-fullscreen-backdrop");

  if (backdrop) backdrop.remove();
  if (roadmapPanel) roadmapPanel.classList.remove("roadmap-fullscreen");
  document.body.classList.remove("roadmap-fullscreen-active");
  if (btn) btn.textContent = "Full screen";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeRoadmapFullscreen();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PWA — service worker registration
// ═══════════════════════════════════════════════════════════════════════════
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLAUDE CHAT
// ═══════════════════════════════════════════════════════════════════════════
const chatPanel    = document.getElementById("chatPanel");
const chatBackdrop = document.getElementById("chatBackdrop");
const chatMessages = document.getElementById("chatMessages");
const chatInput    = document.getElementById("chatInput");
const chatForm     = document.getElementById("chatForm");

let chatHistory = []; // [{role, content}]

function openChat() {
  chatPanel.classList.remove("hidden");
  chatBackdrop.classList.remove("hidden");
  chatInput.focus();
}
function closeChat() {
  chatPanel.classList.add("hidden");
  chatBackdrop.classList.add("hidden");
}

document.getElementById("chatToggleBtn").addEventListener("click", openChat);
document.getElementById("chatCloseBtn").addEventListener("click", closeChat);
chatBackdrop.addEventListener("click", closeChat);

function appendMsg(role, text, actionLabel) {
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text;
  if (actionLabel) {
    const badge = document.createElement("div");
    badge.className = "chat-action-badge";
    badge.textContent = "✓ " + actionLabel;
    bubble.appendChild(badge);
  }
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function actionLabel(action) {
  if (!action) return null;
  const map = {
    create_subtask: "Subtask added",
    update_subtask: "Subtask updated",
    delete_subtask: "Subtask deleted",
    create_feature: "Feature added",
    update_feature: "Feature updated",
    create_initiative: "Initiative added",
    update_initiative: "Initiative updated",
  };
  return map[action.type] || "Done";
}

chatForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";

  appendMsg("user", text);
  chatHistory.push({ role: "user", content: text });

  // Loading indicator
  const loadingEl = appendMsg("assistant loading", "Thinking…");
  loadingEl.querySelector(".chat-bubble").className = "chat-bubble";

  try {
    const res = await apiPost("/api/chat", { messages: chatHistory });
    loadingEl.remove();

    const label = actionLabel(res.action);
    appendMsg("assistant", res.message, label);
    chatHistory.push({ role: "assistant", content: res.message });

    // If Claude made a change, re-sync state from server
    if (res.action) {
      await loadStateFromAPI();
    }
  } catch {
    loadingEl.remove();
    appendMsg("assistant", "Sorry, couldn't reach the server. Check your connection.");
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL LOAD — fetch from API after local render
// ═══════════════════════════════════════════════════════════════════════════
loadStateFromAPI();

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function statusBadge(status) {
  const map = {
    "Not started": "status-not-started",
    "In progress": "status-in-progress",
    "Blocked":     "status-blocked",
    "Done":        "status-done",
  };
  const cls = map[status] || "status-not-started";
  return `<span class="status-badge ${cls}">${sanitize(status || "Not started")}</span>`;
}

function priorityBadge(p) {
  if (!p) return `<span class="priority-badge priority-none">—</span>`;
  const n = parseInt(p);
  const cls = n >= 80 ? "priority-high" : n >= 40 ? "priority-mid" : "priority-low";
  return `<span class="priority-badge ${cls}">${p}</span>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS — stored in localStorage, user-supplied keys only
// ═══════════════════════════════════════════════════════════════════════════
const SETTINGS_KEY = "northstar_settings_v1";

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); } catch { return {}; }
}
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
function getSetting(k) { return loadSettings()[k] || ""; }

function updateApiStatusBadge() {
  const badge = document.getElementById("apiStatusBadge");
  if (!badge) return;
  const hasKey = !!getSetting("anthropicKey");
  badge.className = "api-status " + (hasKey ? "ok" : "warn");
  badge.innerHTML = `<div class="api-status-dot"></div>${hasKey ? "API key configured ✓" : "No API key configured"}`;
}

function updateChatUI() {
  const setup = document.getElementById("chatSetup");
  const iface = document.getElementById("chatInterface");
  const hasKey = !!getSetting("anthropicKey");
  if (!setup || !iface) return;
  if (hasKey) {
    setup.classList.add("hidden");
    iface.classList.remove("hidden");
    iface.style.display = "flex";
  } else {
    setup.classList.remove("hidden");
    iface.classList.add("hidden");
    iface.style.display = "none";
  }
}

// Settings modal open/close
document.getElementById("settingsBtn").addEventListener("click", () => {
  const s = loadSettings();
  document.getElementById("settingsApiKey").value     = s.anthropicKey   || "";
  document.getElementById("settingsTwilioSid").value  = s.twilioSid      || "";
  document.getElementById("settingsTwilioToken").value= s.twilioToken    || "";
  document.getElementById("settingsTwilioFrom").value = s.twilioFrom     || "";
  document.getElementById("settingsTwilioTo").value   = s.twilioTo       || "";
  updateApiStatusBadge();
  document.getElementById("settingsModal").classList.remove("hidden");
});

function closeSettings() { document.getElementById("settingsModal").classList.add("hidden"); }
document.getElementById("settingsClose").addEventListener("click", closeSettings);
document.getElementById("settingsCancel").addEventListener("click", closeSettings);
document.getElementById("settingsModal").addEventListener("click", e => { if (e.target === e.currentTarget) closeSettings(); });

document.getElementById("settingsSave").addEventListener("click", () => {
  saveSettings({
    anthropicKey: document.getElementById("settingsApiKey").value.trim(),
    twilioSid:    document.getElementById("settingsTwilioSid").value.trim(),
    twilioToken:  document.getElementById("settingsTwilioToken").value.trim(),
    twilioFrom:   document.getElementById("settingsTwilioFrom").value.trim(),
    twilioTo:     document.getElementById("settingsTwilioTo").value.trim(),
  });
  updateApiStatusBadge();
  updateChatUI();
  closeSettings();
});

// Open settings from chat setup prompt
document.getElementById("chatOpenSettings")?.addEventListener("click", () => {
  closeChat();
  document.getElementById("settingsBtn").click();
});

// ═══════════════════════════════════════════════════════════════════════════
// SMS VIA CLIENT-SIDE TWILIO
// Calls the Twilio REST API directly using user's credentials
// ═══════════════════════════════════════════════════════════════════════════
async function sendSMSSummary() {
  const s = loadSettings();
  if (!s.anthropicKey) return alert("Add your Anthropic API key in Settings first.");
  if (!s.twilioSid || !s.twilioToken || !s.twilioFrom || !s.twilioTo)
    return alert("Add your Twilio credentials and phone numbers in Settings first.");

  const btn = document.getElementById("smsSummaryBtn");
  btn.textContent = "⏳ Generating summary…";
  btn.disabled = true;

  try {
    // 1. Generate summary with Claude (direct API call, user's key)
    const today = new Date().toISOString().slice(0,10);
    const upcoming = [...state.subtasks]
      .filter(s => s.deadline && s.status !== "Done")
      .sort((a,b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 10);

    const prompt = `Write a short SMS daily planning summary for today (${today}).
Be direct and useful — cover: what's overdue, what's due in the next 3 days, and one top priority.
Max 300 characters. No fluff.

Initiatives: ${state.initiatives.map(i => i.name).join(", ")}
Upcoming subtasks: ${upcoming.map(t => `${t.name} (due ${t.deadline}, ${t.status})`).join("; ")}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": s.anthropicKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const claudeData = await claudeRes.json();
    const summary = claudeData.content?.[0]?.text?.slice(0, 1500) || "Daily planning summary not available.";

    // 2. Send via Twilio
    const body = `📋 Today's plan:\n${summary}`;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${s.twilioSid}/Messages.json`;
    const params = new URLSearchParams({ Body: body, From: s.twilioFrom, To: s.twilioTo });

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${s.twilioSid}:${s.twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const twilioData = await twilioRes.json();
    if (twilioData.sid) {
      btn.textContent = "✓ Text sent!";
      setTimeout(() => { btn.textContent = "📱 Send me a text summary now"; btn.disabled = false; }, 3000);
    } else {
      throw new Error(twilioData.message || "Twilio error");
    }
  } catch (err) {
    btn.textContent = "📱 Send me a text summary now";
    btn.disabled = false;
    alert("SMS failed: " + err.message + "\n\nCheck your Twilio credentials in Settings.");
  }
}

document.getElementById("smsSummaryBtn")?.addEventListener("click", sendSMSSummary);

// ═══════════════════════════════════════════════════════════════════════════
// CLAUDE CHAT — direct Anthropic API, user's key
// ═══════════════════════════════════════════════════════════════════════════
const chatPanel    = document.getElementById("chatPanel");
const chatBackdrop = document.getElementById("chatBackdrop");
const chatMessages = document.getElementById("chatMessages");
const chatInput    = document.getElementById("chatInput");
const chatForm     = document.getElementById("chatForm");

let chatHistory = [];

function openChat() {
  chatPanel.classList.remove("hidden");
  chatBackdrop.classList.remove("hidden");
  updateChatUI();
  if (getSetting("anthropicKey")) chatInput?.focus();
}
function closeChat() {
  chatPanel.classList.add("hidden");
  chatBackdrop.classList.add("hidden");
}
document.getElementById("chatToggleBtn").addEventListener("click", openChat);
document.getElementById("chatCloseBtn").addEventListener("click", closeChat);
chatBackdrop.addEventListener("click", closeChat);

function appendMsg(role, text, actionLabel) {
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text;
  if (actionLabel) {
    const badge = document.createElement("div");
    badge.className = "chat-action-badge";
    badge.textContent = "✓ " + actionLabel;
    bubble.appendChild(badge);
  }
  div.appendChild(bubble);
  chatMessages?.appendChild(div);
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

chatForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  const apiKey = getSetting("anthropicKey");
  if (!apiKey) { openSettings(); return; }
  chatInput.value = "";

  appendMsg("user", text);
  chatHistory.push({ role: "user", content: text });
  const loadingEl = appendMsg("assistant loading", "Thinking…");

  const today = new Date().toISOString().slice(0,10);
  const systemPrompt = `You are a smart planning assistant. Today is ${today}.

Current data:
Initiatives: ${JSON.stringify(state.initiatives)}
Features: ${JSON.stringify(state.features)}
Subtasks: ${JSON.stringify(state.subtasks)}

Answer questions about the user's workload, priorities, and deadlines. Be concise and direct.

If the user asks you to ADD, UPDATE, or DELETE items, respond with a JSON action block:
<action>
{"type":"create_subtask"|"update_subtask"|"delete_subtask"|"create_feature"|"update_feature"|"create_initiative"|"update_initiative","data":{...fields}}
</action>
For creates omit id. For updates include id.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: chatHistory,
      }),
    });

    const data = await res.json();
    loadingEl.remove();

    if (!data.content) {
      appendMsg("assistant", "Error: " + (data.error?.message || "Unknown error"));
      return;
    }

    const fullText = data.content[0].text;
    const actionMatch = fullText.match(/<action>([\s\S]*?)<\/action>/);
    const cleanText = fullText.replace(/<action>[\s\S]*?<\/action>/g, "").trim();
    let label = null;

    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1].trim());
        label = executeLocalAction(action);
        saveState();
        renderAll();
      } catch(err) { console.error("Action error", err); }
    }

    appendMsg("assistant", cleanText, label);
    chatHistory.push({ role: "assistant", content: fullText });
  } catch (err) {
    loadingEl.remove();
    appendMsg("assistant", "Connection error. Check your API key in Settings.");
  }
});

function executeLocalAction(action) {
  const { type, data } = action;
  const { id, ...fields } = data;
  const labels = {
    create_subtask:"Subtask added", update_subtask:"Subtask updated", delete_subtask:"Subtask removed",
    create_feature:"Feature added", update_feature:"Feature updated",
    create_initiative:"Initiative added", update_initiative:"Initiative updated",
  };
  switch(type) {
    case "create_subtask":    state.subtasks.push({id: crypto.randomUUID(), ...fields}); break;
    case "update_subtask":    { const i=state.subtasks.findIndex(x=>x.id===id); if(i>=0) state.subtasks[i]={...state.subtasks[i],...fields}; } break;
    case "delete_subtask":    state.subtasks = state.subtasks.filter(x=>x.id!==id); break;
    case "create_feature":    state.features.push({id: crypto.randomUUID(), ...fields}); break;
    case "update_feature":    { const i=state.features.findIndex(x=>x.id===id); if(i>=0) state.features[i]={...state.features[i],...fields}; } break;
    case "create_initiative": state.initiatives.push({id: crypto.randomUUID(), ...fields}); break;
    case "update_initiative": { const i=state.initiatives.findIndex(x=>x.id===id); if(i>=0) state.initiatives[i]={...state.initiatives[i],...fields}; } break;
  }
  return labels[type] || "Done";
}

// ═══════════════════════════════════════════════════════════════════════════
// PWA
// ═══════════════════════════════════════════════════════════════════════════
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Init
updateChatUI();
