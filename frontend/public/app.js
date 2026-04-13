(function () {
  const config = window.__APP_CONFIG__ || {};
  const apiBase = config.PUBLIC_API_BASE_URL || "/api";

  const title = document.getElementById("app-title");
  const badge = document.getElementById("env-badge");
  const envValue = document.getElementById("app-env");
  const apiBaseValue = document.getElementById("api-base");
  const healthState = document.getElementById("health-state");
  const hostnameValue = document.getElementById("hostname");
  const appTimeValue = document.getElementById("app-time");
  const databaseTimeValue = document.getElementById("database-time");
  const databaseNameValue = document.getElementById("database-name");

  function apiUrl(path) {
    return apiBase.replace(/\/$/, "") + path;
  }

  async function loadRuntime() {
    title.textContent = config.APP_DISPLAY_NAME || "Idea Time Sample";
    badge.textContent = config.APP_ENV || "unknown";
    envValue.textContent = config.APP_ENV || "unknown";
    apiBaseValue.textContent = apiBase;

    try {
      const response = await fetch(apiUrl("/healthz"));

      if (!response.ok) {
        throw new Error(`failed with status ${response.status}`);
      }

      const payload = await response.json();
      healthState.textContent = payload.status === "ok" ? "healthy" : payload.status || "unknown";
      healthState.className = payload.status === "ok" ? "status-ok" : "status-bad";
      hostnameValue.textContent = payload.hostname || "-";
      appTimeValue.textContent = payload.appTime || "-";
      databaseTimeValue.textContent = payload.databaseTime || "-";
      databaseNameValue.textContent = payload.databaseName || "-";
    } catch (error) {
      healthState.textContent = "unreachable";
      healthState.className = "status-bad";
      hostnameValue.textContent = error.message;
      appTimeValue.textContent = "-";
      databaseTimeValue.textContent = "-";
      databaseNameValue.textContent = "-";
    }
  }

  loadRuntime();
  setInterval(loadRuntime, 5000);
})();
