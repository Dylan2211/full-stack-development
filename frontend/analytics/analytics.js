
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

  if (data.errorRate !== null && data.errorRate !== undefined) {
    const err = clampPercent(data.errorRate);
    setText("metric-error", err.toFixed(2));
    setText("metric-error-badge", badgeFromError(err));
  } else {
    setText("metric-error", null);
    setText("metric-error-badge", "unknown");
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
    errorRate: readMetricNumber(params, "error"),
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

document.addEventListener("DOMContentLoaded", function () {
  const data = metricsFromQuery();
  applyMetrics(data);

  const snapshotButton = document.getElementById("snapshot-button");
  if (snapshotButton) {
    snapshotButton.addEventListener("click", function () {
      const now = new Date();
      const label = now.toISOString().slice(0, 19).replace("T", " ");
      const title = "dashboard snapshot " + label;
      alert(title);
    });
  }

  // Kanban navigation button – updated path
  const navKanban = document.getElementById("nav-kanban");
  if (navKanban) {
    navKanban.addEventListener("click", function () {
      window.location.href = "../demo/kanban.html";
    });
  }

  window.updateDashboard = applyMetrics;
});
