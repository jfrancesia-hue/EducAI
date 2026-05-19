const { rmSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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
  rmSync(path.join(process.cwd(), ".next"), { recursive: true, force: true });
}

cleanNextArtifacts();
let result = runBuild();

if (result.status !== 0) {
  cleanNextArtifacts();
  result = runBuild();
}

process.exit(result.status ?? 1);
