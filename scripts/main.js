import { MODULE_ID } from "./constants.js";
import { registerHooks } from "./hooks.js";
import { registerModuleApi } from "./permissions.js";
import { registerSettings } from "./settings.js";

Hooks.once("init", () => {
  registerSettings();
  registerHooks();
});

Hooks.once("ready", () => {
  registerModuleApi();
  console.log(`${MODULE_ID} | ready`);
});
