// Lightweight UMD-style config so it works in plain <script> tags (no bundler required)
(function (global) {
  const detectApiBase = () => {
    // Highest priority: runtime override injected before this file
    if (typeof global !== "undefined" && global.__API_BASE__) {
      return global.__API_BASE__;
    }
    // Next: build-time env (for bundlers, optional here)
    if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    // Next: infer from current origin
    if (typeof window !== "undefined" && window.location) {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:3000";
      }
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    // Fallback
    return "http://localhost:3000";
  };

  const API_BASE = detectApiBase();
  const CONFIG = {
    API_BASE,
    API_ENDPOINTS: {
      AUTH: `${API_BASE}/api/users`,
      TASKS: `${API_BASE}/api/tasks`,
      DASHBOARDS: `${API_BASE}/api/dashboards`,
      AI: `${API_BASE}/api/ai`,
      BOARDS: `${API_BASE}/api/boards`,
    },
  };

  // Expose globally for browser usage
  global.CONFIG = CONFIG;
  // Optional: support import/require if a bundler is present
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CONFIG;
  }
})(typeof window !== "undefined" ? window : globalThis);