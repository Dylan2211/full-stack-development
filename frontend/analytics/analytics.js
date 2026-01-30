
function applyAgentStatus(id, statusText) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = statusText || "unknown";
  el.classList.remove("agent-status-online", "agent-status-busy", "agent-status-offline");
  const cls = statusClassFromText(statusText);
  if (cls) el.classList.add(cls);
}



function renderUsageBars(values) {
  const container = document.getElementById("usage-chart");
  const empty = document.getElementById("usage-empty");
  if (!container || !empty) return;
  clearChildren(container);
  if (!values || !values.length) {
    container.appendChild(empty);
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  let max = Math.max.apply(null, values.map(function (v) { return v || 0; }));
  if (max <= 0) max = 1;
  for (let i = 0; i < values.length; i++) {
    const val = values[i] || 0;
    const bar = document.createElement("div");
    bar.className = "usage-bar";
    const inner = document.createElement("div");
    inner.className = "usage-bar-inner";
    const height = (val / max) * 100;
    inner.style.height = height.toFixed(0) + "%";
    if (height > 70) inner.classList.add("usage-bar-high");
    else if (height > 40) inner.classList.add("usage-bar-medium");
    bar.appendChild(inner);
    container.appendChild(bar);
  }
}

function renderEvents(events) {
  const list = document.getElementById("events-list");
  const empty = document.getElementById("events-empty");
  if (!list || !empty) return;
  clearChildren(list);
  if (!events || !events.length) {
    list.appendChild(empty);
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  events.forEach(function (e) {
    const row = document.createElement("div");
    row.className = "event-row";
    const time = document.createElement("div");
    time.className = "event-time";
    time.textContent = e.time || "";
    const text = document.createElement("div");
    text.className = "event-text";
    text.textContent = e.message || "";
    const tag = document.createElement("div");
    tag.className = "event-tag";
    const type = (e.type || "").toLowerCase();
    if (type === "info") tag.classList.add("event-tag-info");
    else if (type === "warning") tag.classList.add("event-tag-warning");
    else if (type === "error") tag.classList.add("event-tag-error");
    else tag.classList.add("event-tag-info");
    tag.textContent = type || "info";
    row.appendChild(time);
    row.appendChild(text);
    row.appendChild(tag);
    list.appendChild(row);
  });
}

function readMetricNumber(params, key) {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  const v = Number(raw);
  if (!isFinite(v)) return null;
  return v;
}

function readList(params, key) {
  const all = params.getAll(key);
  const values = [];
  for (let i = 0; i < all.length; i++) {
    const v = Number(all[i]);
    if (!isFinite(v)) continue;
    values.push(v);
  }
  return values;
}

function applyMetrics(data) {
  setText("metric-live-requests", data.liveRequests);
  setText("metric-live-trend", data.liveTrendLabel || "no data");

  if (data.latencyMs !== null && data.latencyMs !== undefined) {
    setText("metric-latency", Math.round(data.latencyMs));
  } else {
    setText("metric-latency", null);
  }
  setText("metric-latency-trend", data.latencyTrendLabel || "no data");

  if (data.acceptanceRate !== null && data.acceptanceRate !== undefined) {
    const acc = clampPercent(data.acceptanceRate);
    setText("metric-acceptance", acc.toFixed(1));
    setText("metric-acceptance-badge", badgeFromAcceptance(acc));
  } else {
    setText("metric-acceptance", null);
    setText("metric-acceptance-badge", "unknown");
  }

  if (data.loadPercent !== null && data.loadPercent !== undefined) {
    const lp = clampPercent(data.loadPercent);
    setText("metric-load-value", lp.toFixed(1) + "%");
    setPercentBar("metric-load-fill", lp);
    const tag = tagFromLoad(lp);
    setText("metric-load-tag", tag);
  } else {
    setText("metric-load-value", "–");
    setPercentBar("metric-load-fill", 0);
    setText("metric-load-tag", "no signal");
  }

  if (data.codingShare !== null && data.codingShare !== undefined) {
    const cs = clampPercent(data.codingShare);
    setPercentBar("metric-coding-share", cs);
    setText("metric-coding-share-value", cs.toFixed(0) + "%");
  }

  if (data.analysisShare !== null && data.analysisShare !== undefined) {
    const asVal = clampPercent(data.analysisShare);
    setPercentBar("metric-analysis-share", asVal);
    setText("metric-analysis-share-value", asVal.toFixed(0) + "%");
  }

  if (data.otherShare !== null && data.otherShare !== undefined) {
    const os = clampPercent(data.otherShare);
    setPercentBar("metric-other-share", os);
    setText("metric-other-share-value", os.toFixed(0) + "%");
  }

  if (data.testsPassing !== null && data.testsPassing !== undefined) {
    const tp = clampPercent(data.testsPassing);
    setPercentBar("metric-tests-bar", tp);
    setText("metric-tests-value", tp.toFixed(1) + "%");
  } else {
    setText("metric-tests-value", "–");
  }

  if (data.securityPassing !== null && data.securityPassing !== undefined) {
    const sp = clampPercent(data.securityPassing);
    setPercentBar("metric-security-bar", sp);
    setText("metric-security-value", sp.toFixed(1) + "%");
  } else {
    setText("metric-security-value", "–");
  }

  if (data.lintClean !== null && data.lintClean !== undefined) {
    const lc = clampPercent(data.lintClean);
    setPercentBar("metric-lint-bar", lc);
    setText("metric-lint-value", lc.toFixed(1) + "%");
  } else {
    setText("metric-lint-value", "–");
  }

  if (data.usage && data.usage.length) {
    renderUsageBars(data.usage);
  } else {
    renderUsageBars([]);
  }

  if (data.agents) {
    applyAgentStatus("agent-gemini-status", data.agents.gemini);
    applyAgentStatus("agent-claude-status", data.agents.claude);
    applyAgentStatus("agent-amp-status", data.agents.amp);
    applyAgentStatus("agent-custom-status", data.agents.custom);
  }

  if (data.events) {
    renderEvents(data.events);
  }
}

function metricsFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const usage = readList(params, "usage");
  const events = [];
  let i = 1;
  while (true) {
    const msg = params.get("event" + i);
    if (!msg) break;
    events.push({
      time: params.get("event" + i + "_time") || "",
      message: msg,
      type: params.get("event" + i + "_type") || "info"
    });
    i += 1;
  }
  const agents = {
    gemini: params.get("agent_gemini") || null,
    claude: params.get("agent_claude") || null,
    amp: params.get("agent_amp") || null,
    custom: params.get("agent_custom") || null
  };
  return {
    liveRequests: readMetricNumber(params, "live"),
    liveTrendLabel: params.get("live_label") || null,
    latencyMs: readMetricNumber(params, "latency"),
    latencyTrendLabel: params.get("latency_label") || null,
    acceptanceRate: readMetricNumber(params, "accept"),
    // errorRate removed
    loadPercent: readMetricNumber(params, "load"),
    codingShare: readMetricNumber(params, "coding_share"),
    analysisShare: readMetricNumber(params, "analysis_share"),
    otherShare: readMetricNumber(params, "other_share"),
    testsPassing: readMetricNumber(params, "tests"),
    securityPassing: readMetricNumber(params, "security"),
    lintClean: readMetricNumber(params, "lint"),
    usage: usage,
    agents: agents,
    events: events
  };
}

async function fetchOverview() {
  try {
    const r = await authFetch('/api/analytics/overview');
    if (!r.ok) {
      setLatencyValue(null);
      // error rate removed — only clear latency
      return;
    }
    const d = await r.json();
    setText('metric-live-requests', d.liveRequests);
    setLatencyValue(d.avgLatency);
  } catch (e) {
    console.warn('overview fetch failed', e);
    setLatencyValue(null);
    // error rate removed
  }
}

async function fetchUsage() {
  try {
    // Fetch usage scoped to current user if available
    let url = '/api/analytics/usage';
    if (typeof getUserInfoFromToken === 'function') {
      const u = getUserInfoFromToken();
      const uid = u && (u.id || u.userId || u.sub);
      if (uid) url = '/api/analytics/usage?user=' + encodeURIComponent(uid);
    }
    const r = await authFetch(url);
    if (!r.ok) return;
    const rows = await r.json();
    renderWeeklyUsage(rows);
  } catch (e) {
    console.warn('usage fetch failed', e);
  }
}

async function fetchEvents() {
  try {
    const r = await authFetch('/api/analytics/events');
    if (!r.ok) return;
    const events = await r.json();
    renderSimpleEvents(events);
  } catch (e) {
    console.warn('events fetch failed', e);
  }
}

async function fetchAgents() {
  try {
    const r = await authFetch('/api/analytics/agents');
    if (!r.ok) return;
    const rows = await r.json();
    applyAgentCards(rows);
  } catch (e) {
    console.warn('agents fetch failed', e);
  }
}

async function fetchLive() {
  try {
    const r = await authFetch('/api/analytics/live');
    if (!r.ok) return;
    const arr = await r.json();
    renderLiveChart(arr);
  } catch (e) {
    console.warn('live fetch failed', e);
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = val == null ? '–' : String(val);
}

function setLatencyValue(ms) {
  const el = document.getElementById('metric-latency');
  if (!el) return;
  if (ms == null || !isFinite(ms)) {
    el.textContent = '–';
    return;
  }
  el.textContent = Math.round(ms) + 'ms';
}


function renderWeeklyUsage(rows) {
  const container = document.getElementById('weekly-usage');
  if (!container) return;
  container.innerHTML = '';
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  // Map dates to weekdays
  const byDay = new Map();
  rows.forEach(r => {
    const d = new Date(r.day);
    const wd = d.getDay(); // 0-6 Sun-Sat
    const label = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wd];
    byDay.set(label, Number(r.tokens || 0));
  });
  const values = days.map(label => byDay.get(label) || 0);
  const max = Math.max(1, ...values);
  days.forEach((label, i) => {
    const v = values[i];
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.setProperty('--h', ((v / max) * 100).toFixed(0) + '%');
    const top = document.createElement('span');
    top.className = 'bar-top';
    top.textContent = String(v);
    const bl = document.createElement('span');
    bl.className = 'bar-label';
    bl.textContent = label;
    bar.appendChild(top);
    bar.appendChild(bl);
    container.appendChild(bar);
  });
}

function renderLiveChart(buckets) {
  const container = document.getElementById('live-chart');
  if (!container) return;
  container.innerHTML = '';
  const max = Math.max(1, ...buckets.map(b => Number(b.value || 0)));
  buckets.forEach(b => {
    const v = Number(b.value || 0);
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.setProperty('--h', ((v / max) * 100).toFixed(0) + '%');
    const top = document.createElement('span');
    top.className = 'bar-top';
    top.textContent = String(v);
    const bl = document.createElement('span');
    bl.className = 'bar-label';
    bl.textContent = b.label;
    bar.appendChild(top);
    bar.appendChild(bl);
    container.appendChild(bar);
  });
}

function renderSimpleEvents(events) {
  const list = document.getElementById('events-list');
  if (!list) return;
  list.innerHTML = '';
  if (!events || !events.length) {
    const li = document.createElement('li');
    li.className = 'event-item';
    li.textContent = 'No events yet';
    list.appendChild(li);
    return;
  }
  events.forEach(e => {
    const li = document.createElement('li');
    li.className = 'event-item';
    const title = document.createElement('div');
    title.className = 'event-title';
    title.textContent = e.message;
    const sub = document.createElement('div');
    sub.className = 'event-sub';
    sub.textContent = e.time;
    li.appendChild(title);
    li.appendChild(sub);
    list.appendChild(li);
  });
}

function applyAgentCards(rows) {
  // rows: [{provider, calls, avgLatencyMs, errorRate}]
  const map = {};
  rows.forEach(r => { map[(r.provider || '').toLowerCase()] = r; });

  function setAgent(prefix, key) {
    const callsEl = document.getElementById(`agent-${prefix}-calls`);
    const latEl = document.getElementById(`agent-${prefix}-latency`);
    const row = map[key] || null;
    if (callsEl) callsEl.textContent = row ? row.calls : '0';
    if (latEl) latEl.textContent = row ? `${row.avgLatencyMs || 0}` : '–';
  }

  setAgent('gemini', 'gemini');
  setAgent('groq', 'groq');
  // OpenAI may be labeled 'OpenAI' in tracker
  setAgent('openai', 'openai');
  setAgent('openai', 'chatgpt');
}

async function fetchFailures() {
  try {
    const r = await authFetch('/api/analytics/failures');
    if (!r.ok) return;
    const data = await r.json();
    renderFailures(data);
  } catch (e) {
    console.warn('failures fetch failed', e);
  }
}

function renderFailures(data) {
  const container = document.getElementById('failures-summary');
  if (!container) return;
  container.innerHTML = '';
  
  if (!data || data.totalFailures === 0) {
    const msg = document.createElement('div');
    msg.textContent = '✓ No failures detected';
    msg.style.cssText = 'padding: 10px; color: #666; text-align: center;';
    container.appendChild(msg);
    return;
  }

  const title = document.createElement('h4');
  title.textContent = `⚠ ${data.totalFailures} Failures (${data.failureRate}%)`;
  title.style.cssText = 'margin: 0 0 10px 0; color: #c33;';
  container.appendChild(title);

  if (Object.keys(data.failuresByProvider).length > 0) {
    const providerDiv = document.createElement('div');
    providerDiv.style.cssText = 'font-size: 0.9em; color: #666; margin-bottom: 8px;';
    const providerList = Object.entries(data.failuresByProvider)
      .map(([p, c]) => `${p}: ${c}`)
      .join(' • ');
    providerDiv.textContent = providerList;
    container.appendChild(providerDiv);
  }

  if (data.recentFailures && data.recentFailures.length > 0) {
    const recentDiv = document.createElement('div');
    recentDiv.style.cssText = 'font-size: 0.85em; color: #999; max-height: 80px; overflow-y: auto;';
    data.recentFailures.slice(0, 3).forEach(f => {
      const line = document.createElement('div');
      line.textContent = `${f.provider}: ${f.error}`;
      line.style.cssText = 'margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      recentDiv.appendChild(line);
    });
    container.appendChild(recentDiv);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchOverview();
  await fetchUsage();
  await fetchEvents();
   await fetchAgents();
  await fetchLive();
  await fetchFailures();
  // Refresh every 10s for live metrics
  setInterval(fetchOverview, 10000);
  setInterval(fetchEvents, 15000);
  setInterval(fetchAgents, 12000);
  setInterval(fetchLive, 10000);
  setInterval(fetchFailures, 15000);
});
