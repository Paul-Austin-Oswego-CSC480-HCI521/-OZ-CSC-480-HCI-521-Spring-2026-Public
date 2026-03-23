const fs = require("fs");
const path = require("path");

const MICROSERVICE_PATHS = {
  worklog: "backend/worklog",
  task: "backend/task",
  notification: "backend/notification",
};

function loadConfig() {
  return JSON.parse(fs.readFileSync("config/env-dev.json", "utf-8"));
}

function writeBackendEnv(servicePath, vars) {
  const dir = path.join(servicePath, "src/main/liberty/config");
  fs.mkdirSync(dir, { recursive: true });
  const content = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join("\n");
  fs.writeFileSync(path.join(dir, "server.env"), content);
}

function writeFrontendEnv(vars) {
  const content = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join("\n");
  fs.writeFileSync("frontend/.env", content);
}

function main() {
  const config = loadConfig();
  const shared = config.shared || {};

  for (const [service, servicePath] of Object.entries(MICROSERVICE_PATHS)) {
    const serviceVars = config.services?.[service] || {};
    writeBackendEnv(servicePath, { ...shared, ...serviceVars });
  }

  if (config.frontend) {
    writeFrontendEnv(config.frontend);
  }
}

main();