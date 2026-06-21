import { MODULE_ID, SETTINGS } from "./constants.js";
import { BattleDamageActorConfig } from "./actor-config-app.js";
import { mightIncludeHpChange, updateBattleDamageForActor } from "./damage-engine.js";
import { canCurrentUserUpdateTokens } from "./permissions.js";
import { getSetting } from "./settings.js";

export function registerHooks() {
  Hooks.on("getActorSheetHeaderButtons", addActorSheetButton);
  Hooks.on("updateActor", onUpdateActor);
}

function addActorSheetButton(app, buttons) {
  if (!game.user?.isGM) return;

  buttons.unshift({
    label: game.i18n.localize("TBD.ActorConfig.Button"),
    class: "token-battle-damage",
    icon: "fas fa-heart-broken",
    onclick: () => new BattleDamageActorConfig(app.actor).render(true)
  });
}

async function onUpdateActor(actor, changes) {
  if (!getSetting(SETTINGS.ENABLE_AUTOMATIC_UPDATES)) return;
  if (!canCurrentUserUpdateTokens()) return;
  if (!mightIncludeHpChange(changes)) return;

  await updateBattleDamageForActor(actor);
}

Hooks.on("renderActorSheet", (_app, html) => {
  html.find(".token-battle-damage").attr("title", game.i18n.localize("TBD.ActorConfig.Button"));
});

Hooks.once("ready", () => {
  const tokenizerActive = game.modules.get("vtta-tokenizer")?.active || game.modules.get("tokenizer")?.active;
  if (tokenizerActive && game.settings.get(MODULE_ID, SETTINGS.DEBUG_LOGGING)) {
    console.debug(`${MODULE_ID} | Tokenizer detected. Token Battle Damage will use normal image paths only.`);
  }
});
