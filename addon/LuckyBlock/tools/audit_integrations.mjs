import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const registryPath = path.join(root, "vendor", "ASSET_REGISTRY.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const errors = [];
const ids = new Map();
const targetOwners = new Map();

for (const [key, source] of Object.entries(registry.sources ?? {})) {
  if (!source.url || !source.license || !source.reviewedCommit || !source.integrationMode) {
    errors.push(`source ${key}: missing url/license/reviewedCommit/integrationMode`);
  }
}

for (const asset of registry.assets ?? []) {
  if (!asset.key || !asset.source || !registry.sources?.[asset.source]) {
    errors.push(`asset ${asset.key ?? "<unknown>"}: invalid source`);
    continue;
  }

  if (asset.contentId) {
    if (!asset.contentId.startsWith("lb:")) errors.push(`non-lb contentId ${asset.contentId}: ${asset.key}`);
    if (ids.has(asset.contentId)) errors.push(`duplicate contentId ${asset.contentId}: ${ids.get(asset.contentId)} and ${asset.key}`);
    else ids.set(asset.contentId, asset.key);
  }

  for (const target of asset.targets ?? []) {
    if (target.includes("*") || target.includes("{")) continue;
    const owner = targetOwners.get(target);
    if (owner) errors.push(`duplicate target ${target}: ${owner} and ${asset.key}`);
    else targetOwners.set(target, asset.key);

    const full = path.join(root, target);
    if (!fs.existsSync(full)) errors.push(`missing target for ${asset.key}: ${target}`);
  }

  if (registry.sources[asset.source].integrationMode === "vendored" && !(asset.upstream?.length > 0)) {
    errors.push(`vendored asset ${asset.key}: no exact upstream path`);
  }
}

if (errors.length) {
  console.error("Integration audit FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Integration audit OK: ${Object.keys(registry.sources).length} sources, ${registry.assets.length} asset records, ${ids.size} content IDs`);
}
