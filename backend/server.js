const http = require("http");
const { URL } = require("url");
const { ensureSchema, healthcheck, insertMessage, listMessages, pool } = require("./db");

const port = Number(process.env.PORT || "8080");
const appEnv = process.env.APP_ENV || "dev";
const appMessage = process.env.APP_MESSAGE || "Hello from backend";
const apiBasePath = normalizeBasePath(process.env.API_BASE_PATH || "/api");

function normalizeBasePath(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/api";
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function json(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function start() {
  await ensureSchema();

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Origin": "*",
      });
      response.end();
      return;
    }

    try {
      if (request.method === "GET" && pathname === "/") {
        json(response, 200, {
          service: "idea-dummy-backend",
          environment: appEnv,
          apiBasePath,
          message: appMessage,
        });
        return;
      }

      if (request.method === "GET" && pathname === `${apiBasePath}/healthz`) {
        await healthcheck();
        json(response, 200, { status: "ok", environment: appEnv });
        return;
      }

      if (request.method === "GET" && pathname === `${apiBasePath}/readyz`) {
        await healthcheck();
        json(response, 200, { status: "ready", environment: appEnv });
        return;
      }

      if (request.method === "GET" && pathname === `${apiBasePath}/config`) {
        json(response, 200, {
          environment: appEnv,
          apiBasePath,
          message: appMessage,
        });
        return;
      }

      if (request.method === "GET" && pathname === `${apiBasePath}/messages`) {
        const messages = await listMessages();
        json(response, 200, { messages });
        return;
      }

      if (request.method === "POST" && pathname === `${apiBasePath}/messages`) {
        const payload = await readJson(request);
        const author = String(payload.author || "").trim();
        const text = String(payload.text || "").trim();

        if (!author || !text) {
          json(response, 400, { error: "author and text are required" });
          return;
        }

        const message = await insertMessage(author, text);
        json(response, 201, { message });
        return;
      }

      json(response, 404, { error: "not found", path: pathname });
    } catch (error) {
      json(response, 500, { error: error.message, environment: appEnv });
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`idea-dummy-backend listening on ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  pool.end().catch(() => {});
  process.exit(1);
});

