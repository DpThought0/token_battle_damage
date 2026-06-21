import { MODULE_ID, SETTINGS } from "./constants.js";

export function debug(...args) {
  if (!game.settings.get(MODULE_ID, SETTINGS.DEBUG_LOGGING)) return;
  console.debug(`${MODULE_ID} |`, ...args);
}

export function warn(...args) {
  console.warn(`${MODULE_ID} |`, ...args);
}
