
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

function clampPercent(value) {
  if (typeof value !== "number" || isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

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
