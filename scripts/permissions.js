import { MODULE_ID, SETTINGS } from "./constants.js";
import { getSetting } from "./settings.js";

export function canCurrentUserUpdateTokens() {
  if (!getSetting(SETTINGS.ONLY_GM_UPDATES)) return true;
  return isPrimaryGM();
}

export function isPrimaryGM() {
  if (!game.user?.isGM) return false;

  const activeGms = game.users
    .filter((user) => user.active && user.isGM)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return activeGms[0]?.id === game.user.id;
}

export function isTokenizerAvailable() {
  const tokenizerModule = game.modules.get("vtta-tokenizer") ?? game.modules.get("tokenizer");
  return Boolean(tokenizerModule?.active && (tokenizerModule.api || window.Tokenizer));
}

export function registerModuleApi() {
  const module = game.modules.get(MODULE_ID);
  if (!module) return;

  module.api = {
    isPrimaryGM,
    isTokenizerAvailable
  };
}
