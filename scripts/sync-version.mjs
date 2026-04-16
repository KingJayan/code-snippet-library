#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const packageJsonPath = resolve(repoRoot, "package.json");
const appVersionPath = resolve(repoRoot, "src/lib/app-version.ts");

function getCommitCount() {
  const output = execSync("git rev-list --count HEAD", {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

  const count = Number.parseInt(output, 10);
  if (!Number.isFinite(count) || count < 0) {
    throw new Error(`Invalid commit count: ${output}`);
  }

  return count;
}

function versionFromCommitCount(commitCount) {
  const minor = Math.floor(commitCount / 10);
  const patch = commitCount % 10;
  return `1.${minor}.${patch}`;
}

function syncPackageVersion(version) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  packageJson.version = version;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function syncAppVersionModule(version) {
  const moduleContents = `export const APP_VERSION = "v${version}";\n`;
  writeFileSync(appVersionPath, moduleContents, "utf8");
}

try {
  const commitCount = getCommitCount() + 1;
  const version = versionFromCommitCount(commitCount);
  syncPackageVersion(version);
  syncAppVersionModule(version);
  process.stdout.write(`synced app version: v${version}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown version sync failure";
  process.stderr.write(`failed to sync app version: ${message}\n`);
  process.exit(1);
}
