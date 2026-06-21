import { FLAGS, MODULE_ID, SETTINGS } from "./constants.js";
import { debug, warn } from "./logger.js";
import { getSetting } from "./settings.js";

export function getActorHp(actor) {
  const currentPath = getSetting(SETTINGS.HP_CURRENT_PATH);
  const maxPath = getSetting(SETTINGS.HP_MAX_PATH);

  const current = Number(foundry.utils.getProperty(actor, currentPath));
  const max = Number(foundry.utils.getProperty(actor, maxPath));

  if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return null;
  return { current, max };
}

export function calculateHpPercent(current, max) {
  if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return null;
  return Math.max(0, Math.min(100, Math.ceil((current / max) * 100)));
}

export function findStageForPercent(stages = [], pct) {
  if (!Number.isFinite(pct)) return null;
  const ordered = [...stages].sort((a, b) => Number(b.maxPct) - Number(a.maxPct));
  return ordered.find((stage) => pct >= Number(stage.minPct) && pct <= Number(stage.maxPct)) ?? null;
}

export function getDefaultStages() {
  return [
    { id: "healthy", label: "Healthy", minPct: 80, maxPct: 100, img: "", useOriginal: true },
    { id: "light", label: "Lightly Damaged", minPct: 60, maxPct: 79, img: "", useOriginal: false },
    { id: "moderate", label: "Damaged", minPct: 40, maxPct: 59, img: "", useOriginal: false },
    { id: "heavy", label: "Badly Damaged", minPct: 20, maxPct: 39, img: "", useOriginal: false },
    { id: "critical", label: "Near Death", minPct: 1, maxPct: 19, img: "", useOriginal: false },
    { id: "defeated", label: "Defeated", minPct: 0, maxPct: 0, img: "", useOriginal: false }
  ];
}

export function createDefaultConfig() {
  return {
    enabled: false,
    stages: getDefaultStages()
  };
}

export function normalizeConfig(config) {
  const defaults = createDefaultConfig();
  if (!config || typeof config !== "object") return defaults;

  return {
    ...defaults,
    ...config,
    stages: Array.isArray(config.stages) && config.stages.length ? config.stages : defaults.stages
  };
}

export function mightIncludeHpChange(changes) {
  const currentPath = getSetting(SETTINGS.HP_CURRENT_PATH);
  const maxPath = getSetting(SETTINGS.HP_MAX_PATH);
  return pathMayBeIncluded(changes, currentPath) || pathMayBeIncluded(changes, maxPath);
}

export function pathMayBeIncluded(changes, path) {
  if (!changes || !path) return false;
  const parts = path.split(".");
  let node = changes;

  for (const part of parts) {
    if (!node || typeof node !== "object") return false;
    if (Object.hasOwn(node, part)) {
      node = node[part];
      continue;
    }

    return Object.keys(node).some((key) => key === path || path.startsWith(`${key}.`) || key.startsWith(`${path}.`));
  }

  return true;
}

export async function updateBattleDamageForActor(actor) {
  const config = normalizeConfig(actor.getFlag(MODULE_ID, FLAGS.CONFIG));
  if (!config.enabled) return;

  const hp = getActorHp(actor);
  if (!hp) {
    warn(`Could not read HP for ${actor.name}. Check Token Battle Damage HP path settings.`);
    return;
  }

  const pct = calculateHpPercent(hp.current, hp.max);
  const stage = findStageForPercent(filterStages(config.stages), pct);
  if (!stage) {
    debug("No matching damage stage", { actor: actor.name, pct });
    return;
  }

  const tokens = actor.getActiveTokens(true);
  debug("Updating actor tokens", { actor: actor.name, pct, stage, tokenCount: tokens.length });

  for (const token of tokens) {
    await updateTokenImageForStage(token, stage);
  }
}

export function filterStages(stages = []) {
  if (getSetting(SETTINGS.INCLUDE_DEFEATED_IMAGE)) return stages;
  return stages.filter((stage) => !(Number(stage.minPct) === 0 && Number(stage.maxPct) === 0));
}

export async function updateTokenImageForStage(token, stage) {
  const doc = token.document ?? token;
  let original = doc.getFlag(MODULE_ID, FLAGS.ORIGINAL_TEXTURE_SRC);

  if (!original) {
    original = doc.texture?.src;
    if (original) await doc.setFlag(MODULE_ID, FLAGS.ORIGINAL_TEXTURE_SRC, original);
  }

  if (stage.useOriginal && !getSetting(SETTINGS.REVERT_ON_HEALING)) return;

  const desiredImg = stage.useOriginal ? original : stage.img;
  if (!desiredImg || doc.texture?.src === desiredImg) return;

  await doc.update({ "texture.src": desiredImg });

  if (getSetting(SETTINGS.REFRESH_COMBAT_TRACKER)) {
    ui.combat?.render(false);
  }
}
