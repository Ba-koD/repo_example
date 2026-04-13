const http = require("http");
const { URL } = require("url");
const os = require("os");
const { healthcheck, readDatabaseTime, pool } = require("./db");

const port = Number(process.env.PORT || "8080");
const appEnv = process.env.APP_ENV || "local";
const apiBasePath = "/api";

function json(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function buildPayload(databaseRow) {
  return {
    status: "ok",
    service: "idea-time-backend",
    environment: appEnv,
    appTime: new Date().toISOString(),
    databaseTime: databaseRow.database_time,
    databaseName: databaseRow.database_name,
    hostname: os.hostname(),
  };
}

async function start() {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const pathname = url.pathname;

    try {
      if (request.method === "GET" && pathname === "/") {
        json(response, 200, {
          service: "idea-time-backend",
          environment: appEnv,
          apiBasePath,
          message: "Use /api/time or /api/healthz.",
        });
        return;
      }

      if (request.method === "GET" && pathname === `${apiBasePath}/healthz`) {
        const databaseRow = await readDatabaseTime();
        json(response, 200, buildPayload(databaseRow));
        return;
      }

      if (request.method === "GET" && pathname === `${apiBasePath}/readyz`) {
        await healthcheck();
        json(response, 200, {
          status: "ready",
          service: "idea-time-backend",
          environment: appEnv,
          hostname: os.hostname(),
        });
        return;
      }

      if (request.method === "GET" && pathname === `${apiBasePath}/time`) {
        const databaseRow = await readDatabaseTime();
        json(response, 200, buildPayload(databaseRow));
        return;
      }

      json(response, 404, { error: "not found", path: pathname });
    } catch (error) {
      json(response, 500, { error: error.message, environment: appEnv });
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`idea-time-backend listening on ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  pool.end().catch(() => {});
  process.exit(1);
});
