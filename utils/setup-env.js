const fs = require("fs");
const path = require("path");

const MICROSERVICE_PATHS = {
  worklog: "backend/worklog",
  task: "backend/task",
  notification: "backend/notification",
};

function loadConfig() {
  const base = JSON.parse(fs.readFileSync("config/env.json", "utf8"));

  if (fs.existsSync("config/env.json")) {
    const local = JSON.parse(fs.readFileSync("config/env.json", "utf8"));
    for (const key of Object.keys(local)) {
      if (key in base && typeof base[key] === "object") {
        Object.assign(base[key], local[key]);
      } else {
        base[key] = local[key];
      }
    }
  }
  return base;
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