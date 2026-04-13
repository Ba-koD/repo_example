(function () {
  const config = window.__APP_CONFIG__ || {};
  const apiBase = config.PUBLIC_API_BASE_PATH || "/api";

  const title = document.getElementById("app-title");
  const badge = document.getElementById("env-badge");
  const envValue = document.getElementById("app-env");
  const apiBaseValue = document.getElementById("api-base");
  const healthState = document.getElementById("health-state");
  const messagesList = document.getElementById("messages");
  const form = document.getElementById("message-form");

  function apiUrl(path) {
    return apiBase.replace(/\/$/, "") + path;
  }

  function setMessages(items) {
    messagesList.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.author}: ${item.text} (${item.environment})`;
      messagesList.appendChild(li);
    });
  }

  async function loadRuntime() {
    title.textContent = config.APP_DISPLAY_NAME || "Idea Dummy App";
    badge.textContent = config.PUBLIC_ENV_NAME || config.APP_ENV || "unknown";
    envValue.textContent = config.APP_ENV || "unknown";
    apiBaseValue.textContent = apiBase;

    try {
      const [healthResponse, messagesResponse] = await Promise.all([
        fetch(apiUrl("/healthz")),
        fetch(apiUrl("/messages")),
      ]);

      healthState.textContent = healthResponse.ok ? "healthy" : "unhealthy";
      healthState.className = healthResponse.ok ? "status-ok" : "status-bad";

      if (!messagesResponse.ok) {
        throw new Error("failed to load messages");
      }

      const payload = await messagesResponse.json();
      setMessages(payload.messages || []);
    } catch (error) {
      healthState.textContent = "unreachable";
      healthState.className = "status-bad";
      setMessages([{ author: "system", text: error.message, environment: config.APP_ENV || "unknown" }]);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const author = document.getElementById("author").value.trim();
    const text = document.getElementById("text").value.trim();

    if (!author || !text) {
      return;
    }

    const response = await fetch(apiUrl("/messages"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, text }),
    });

    if (!response.ok) {
      healthState.textContent = "write failed";
      healthState.className = "status-bad";
      return;
    }

    document.getElementById("text").value = "";
    await loadRuntime();
  });

  loadRuntime();
})();

