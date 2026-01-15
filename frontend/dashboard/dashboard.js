// #region Value helpers
function clampPercent(value) {
  if (typeof value !== "number" || isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function readMetricNumber(params, key) {
  var raw = params.get(key);
  if (raw === null || raw === "") return null;
  var v = Number(raw);
  if (!isFinite(v)) return null;
  return v;
}

function readList(params, key) {
  var all = params.getAll(key);
  var values = [];
  for (var i = 0; i < all.length; i++) {
    var v = Number(all[i]);
    if (!isFinite(v)) continue;
    values.push(v);
  }
  return values;
}
// #endregion

// #region DOM helpers
function setText(id, value, suffix) {
  var el = document.getElementById(id);
  if (!el) return;
  if (value === null || value === undefined || value === "") {
    el.textContent = "–";
    return;
  }
  if (suffix) {
    el.textContent = value + suffix;
  } else {
    el.textContent = value;
  }
}

function setPercentBar(barId, value) {
  var bar = document.getElementById(barId);
  if (!bar) return;
  var v = clampPercent(value);
  bar.style.width = v + "%";
}

function clearChildren(node) {
  while (node && node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
// #endregion

// #region Label and status helpers
function badgeFromAcceptance(value) {
  var v = clampPercent(value);
  if (!value && value !== 0) return "unknown";
  if (v >= 80) return "excellent";
  if (v >= 60) return "good";
  if (v >= 40) return "needs review";
  return "poor";
}

function badgeFromError(value) {
  var v = clampPercent(value);
  if (!value && value !== 0) return "unknown";
  if (v <= 1) return "very low";
  if (v <= 3) return "low";
  if (v <= 7) return "elevated";
  return "high";
}

function tagFromLoad(value) {
  var v = clampPercent(value);
  if (!value && value !== 0) return "no signal";
  if (v < 40) return "comfortably idle";
  if (v < 75) return "healthy";
  if (v < 90) return "hot";
  return "near limit";
}

function statusClassFromText(text) {
  if (!text) return "";
  var t = String(text).toLowerCase();
  if (t === "online" || t === "ready" || t === "active") return "agent-status-online";
  if (t === "busy" || t === "running") return "agent-status-busy";
  if (t === "offline" || t === "disabled") return "agent-status-offline";
  return "";
}
// #endregion

// #region Renderers
function applyAgentStatus(id, statusText) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = statusText || "unknown";
  el.classList.remove("agent-status-online", "agent-status-busy", "agent-status-offline");
  var cls = statusClassFromText(statusText);
  if (cls) el.classList.add(cls);
}

function renderUsageBars(values) {
  var container = document.getElementById("usage-chart");
  var empty = document.getElementById("usage-empty");
  if (!container || !empty) return;
  clearChildren(container);
  if (!values || !values.length) {
    container.appendChild(empty);
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  var max = Math.max.apply(null, values.map(function (v) { return v || 0; }));
  if (max <= 0) max = 1;
  for (var i = 0; i < values.length; i++) {
    var val = values[i] || 0;
    var bar = document.createElement("div");
    bar.className = "usage-bar";
    var inner = document.createElement("div");
    inner.className = "usage-bar-inner";
    var height = (val / max) * 100;
    inner.style.height = height.toFixed(0) + "%";
    if (height > 70) inner.classList.add("usage-bar-high");
    else if (height > 40) inner.classList.add("usage-bar-medium");
    bar.appendChild(inner);
    container.appendChild(bar);
  }
}

function renderEvents(events) {
  var list = document.getElementById("events-list");
  var empty = document.getElementById("events-empty");
  if (!list || !empty) return;
  clearChildren(list);
  if (!events || !events.length) {
    list.appendChild(empty);
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  events.forEach(function (e) {
    var row = document.createElement("div");
    row.className = "event-row";
    var time = document.createElement("div");
    time.className = "event-time";
    time.textContent = e.time || "";
    var text = document.createElement("div");
    text.className = "event-text";
    text.textContent = e.message || "";
    var tag = document.createElement("div");
    tag.className = "event-tag";
    var type = (e.type || "").toLowerCase();
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
    var acc = clampPercent(data.acceptanceRate);
    setText("metric-acceptance", acc.toFixed(1));
    setText("metric-acceptance-badge", badgeFromAcceptance(acc));
  } else {
    setText("metric-acceptance", null);
    setText("metric-acceptance-badge", "unknown");
  }

  if (data.errorRate !== null && data.errorRate !== undefined) {
    var err = clampPercent(data.errorRate);
    setText("metric-error", err.toFixed(2));
    setText("metric-error-badge", badgeFromError(err));
  } else {
    setText("metric-error", null);
    setText("metric-error-badge", "unknown");
  }

  if (data.loadPercent !== null && data.loadPercent !== undefined) {
    var lp = clampPercent(data.loadPercent);
    setText("metric-load-value", lp.toFixed(1) + "%");
    setPercentBar("metric-load-fill", lp);
    var tag = tagFromLoad(lp);
    setText("metric-load-tag", tag);
  } else {
    setText("metric-load-value", "–");
    setPercentBar("metric-load-fill", 0);
    setText("metric-load-tag", "no signal");
  }

  if (data.codingShare !== null && data.codingShare !== undefined) {
    var cs = clampPercent(data.codingShare);
    setPercentBar("metric-coding-share", cs);
    setText("metric-coding-share-value", cs.toFixed(0) + "%");
  }

  if (data.analysisShare !== null && data.analysisShare !== undefined) {
    var asVal = clampPercent(data.analysisShare);
    setPercentBar("metric-analysis-share", asVal);
    setText("metric-analysis-share-value", asVal.toFixed(0) + "%");
  }

  if (data.otherShare !== null && data.otherShare !== undefined) {
    var os = clampPercent(data.otherShare);
    setPercentBar("metric-other-share", os);
    setText("metric-other-share-value", os.toFixed(0) + "%");
  }

  if (data.testsPassing !== null && data.testsPassing !== undefined) {
    var tp = clampPercent(data.testsPassing);
    setPercentBar("metric-tests-bar", tp);
    setText("metric-tests-value", tp.toFixed(1) + "%");
  } else {
    setText("metric-tests-value", "–");
  }

  if (data.securityPassing !== null && data.securityPassing !== undefined) {
    var sp = clampPercent(data.securityPassing);
    setPercentBar("metric-security-bar", sp);
    setText("metric-security-value", sp.toFixed(1) + "%");
  } else {
    setText("metric-security-value", "–");
  }

  if (data.lintClean !== null && data.lintClean !== undefined) {
    var lc = clampPercent(data.lintClean);
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
// #endregion

// #region Query parsing
function metricsFromQuery() {
  var params = new URLSearchParams(window.location.search);
  var usage = readList(params, "usage");
  var events = [];
  for (var i = 1; ; i += 1) {
    var msg = params.get("event" + i);
    if (!msg) break;
    events.push({
      time: params.get("event" + i + "_time") || "",
      message: msg,
      type: params.get("event" + i + "_type") || "info"
    });
  }
  var agents = {
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
// #endregion

// #region UI wiring
async function loadDashboards(userId) {
  try {
    const token = getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
    const response = await fetch("/api/dashboards", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      console.error('Failed to load dashboards:', response.status, await response.text());
      return;
    }
    const dashboards = await response.json();

    const grid = document.querySelector(".dashboard-grid");
    dashboards.forEach((dashboard) => {
      const card = document.createElement("a");
      card.href = `/kanban/kanban.html?id=${dashboard.DashboardId}`;
      card.className = "card";
      card.innerHTML = `
        <h3>${dashboard.Name}</h3>
        <p>${dashboard.Description || "No description provided."}</p>
      `;
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Failed to load dashboards:", error);
  }
}

function setupSnapshotButton() {
  var snapshotButton = document.getElementById("snapshot-button");
  if (!snapshotButton) return;
  snapshotButton.addEventListener("click", function () {
    var now = new Date();
    var label = now.toISOString().slice(0, 19).replace("T", " ");
    var title = "dashboard snapshot " + label;
    alert(title);
  });
}

function setupOverlay() {
  var createCard = document.getElementById("create-dashboard-card");
  var overlay = document.getElementById("new-dashboard-overlay");
  var overlayBackdrop = document.getElementById("overlay-backdrop");
  var overlayClose = document.getElementById("overlay-close");
  var overlayCancel = document.getElementById("overlay-cancel");
  var form = document.getElementById("new-dashboard-form");
  var nameInput = document.getElementById("dashboard-name");
  var descInput = document.getElementById("dashboard-description");
  var grid = document.querySelector(".dashboard-grid");

  if (!createCard || !overlay || !form || !grid || !nameInput || !descInput) {
    return;
  }

  function openOverlay() {
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    nameInput.value = "";
    descInput.value = "";
    nameInput.focus();
  }

  function closeOverlay() {
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
  }

  createCard.addEventListener("click", function () {
    openOverlay();
  });

  if (overlayBackdrop) {
    overlayBackdrop.addEventListener("click", function () {
      closeOverlay();
    });
  }

  if (overlayClose) {
    overlayClose.addEventListener("click", function () {
      closeOverlay();
    });
  }

  if (overlayCancel) {
    overlayCancel.addEventListener("click", function () {
      closeOverlay();
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = nameInput.value.trim();
    var desc = descInput.value.trim();
    if (!title) return;

    var card = document.createElement("div");
    card.className = "card";

    var h3 = document.createElement("h3");
    h3.textContent = title;

    var p = document.createElement("p");
    p.textContent = desc || "Custom dashboard";

    card.appendChild(h3);
    card.appendChild(p);

    if (createCard.nextSibling) {
      grid.insertBefore(card, createCard.nextSibling);
    } else {
      grid.appendChild(card);
    }

    closeOverlay();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("visible")) {
      closeOverlay();
    }
  });
}

import { requireAuth, getUserInfoFromToken, logout, getAuthToken } from '../auth-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // Enforce immediate redirect to login if not authenticated
  requireAuth();

  // Render header: settings icon + avatar showing first initial
  const userArea = document.getElementById('user-area');
  const userInfo = getUserInfoFromToken();
  if (userArea) {
    if (userInfo && (userInfo.fullName || userInfo.email)) {
      const display = (userInfo.fullName || userInfo.email);
      const initial = String(display).charAt(0).toUpperCase();
      userArea.innerHTML = `
        <a href="/settings" title="Settings" class="icon-button settings-btn">⚙️</a>
        <a href="/settings" class="user-pill-link" id="profile-link">
          <div class="user-pill" aria-hidden="true"><span class="user-initials">${initial}</span></div>
        </a>
        <button id="logout-btn" class="icon-button" title="Log out">Log out</button>
      `;
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) logoutBtn.addEventListener('click', () => logout());
    } else {
      userArea.innerHTML = `<a href="/login/login.html" class="login-btn">Log In</a>`;
    }
  }

  // Now load dashboard contents and wire UI
  loadDashboards();
  var data = metricsFromQuery();
  applyMetrics(data);
  window.updateDashboard = applyMetrics;
  setupSnapshotButton();
  setupOverlay();
});
// #endregion
