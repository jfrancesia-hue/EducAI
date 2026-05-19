const { rmSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function runBuild() {
  const nextBin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "next.cmd" : "next",
  );

  return spawnSync(nextBin, ["build"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
}

function cleanNextArtifacts() {
  const nextDir = path.join(process.cwd(), ".next");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(nextDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
      return;
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }

      sleep(400);
    }
  }
}

cleanNextArtifacts();
let result = runBuild();

if (result.status !== 0) {
  sleep(1000);
  cleanNextArtifacts();
  result = runBuild();
}

process.exit(result.status ?? 1);
