const fs = require("fs");
const path = require("path");

function loadConfig() {
  return JSON.parse(fs.readFileSync("config/env-docker-compose.json", "utf-8"));
}

const dir = ".secrets";

function writeBackendEnv(backend_service, vars) {
  const content = Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(path.join(dir, `backend-${backend_service}.env`), content);
}

function writeFrontendEnv(frontend_vars) {
  const content = Object.entries(frontend_vars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(path.join(dir, `frontend.env`), content);
}

function writeMongoDBEnv(mongodb_vars) {
  const content = Object.entries(mongodb_vars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(path.join(dir, `mongodb.env`), content);
}

function main() {
  const config = loadConfig();
  const shared = config.shared || {};
  fs.mkdirSync(".secrets", { recursive: true });

  // Backend: create files based on the keys of services
  for (const backend_service of Object.keys(config.services)) {
    writeBackendEnv(backend_service, {
      ...shared,
      ...config.services?.[backend_service],
    });
  }

  if (config.frontend) {
    writeFrontendEnv(config.frontend);
  }

  if (config.mongodb) {
    writeMongoDBEnv(config.mongodb);
  }
}

main();
