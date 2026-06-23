import { DEFAULT_BATTLE_DAMAGE_DIRECTORY, MODULE_ID, SETTINGS } from "./constants.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.HP_CURRENT_PATH, {
    name: game.i18n.localize("TBD.Settings.HpCurrentPath.Name"),
    hint: game.i18n.localize("TBD.Settings.HpCurrentPath.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: "system.attributes.hp.value"
  });

  game.settings.register(MODULE_ID, SETTINGS.HP_MAX_PATH, {
    name: game.i18n.localize("TBD.Settings.HpMaxPath.Name"),
    hint: game.i18n.localize("TBD.Settings.HpMaxPath.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: "system.attributes.hp.max"
  });

  game.settings.register(MODULE_ID, SETTINGS.ENABLE_AUTOMATIC_UPDATES, {
    name: game.i18n.localize("TBD.Settings.EnableAutomaticUpdates.Name"),
    hint: game.i18n.localize("TBD.Settings.EnableAutomaticUpdates.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.REVERT_ON_HEALING, {
    name: game.i18n.localize("TBD.Settings.RevertOnHealing.Name"),
    hint: game.i18n.localize("TBD.Settings.RevertOnHealing.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.INCLUDE_DEFEATED_IMAGE, {
    name: game.i18n.localize("TBD.Settings.IncludeDefeatedImage.Name"),
    hint: game.i18n.localize("TBD.Settings.IncludeDefeatedImage.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.DEFAULT_IMAGE_DIRECTORY, {
    name: game.i18n.localize("TBD.Settings.DefaultImageDirectory.Name"),
    hint: game.i18n.localize("TBD.Settings.DefaultImageDirectory.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: DEFAULT_BATTLE_DAMAGE_DIRECTORY
  });

  game.settings.register(MODULE_ID, SETTINGS.ONLY_GM_UPDATES, {
    name: game.i18n.localize("TBD.Settings.OnlyGmUpdates.Name"),
    hint: game.i18n.localize("TBD.Settings.OnlyGmUpdates.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.UPDATE_ACTOR_PORTRAIT_FOR_TRACKERS, {
    name: game.i18n.localize("TBD.Settings.UpdateActorPortraitForTrackers.Name"),
    hint: game.i18n.localize("TBD.Settings.UpdateActorPortraitForTrackers.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTINGS.REFRESH_COMBAT_TRACKER, {
    name: game.i18n.localize("TBD.Settings.RefreshCombatTracker.Name"),
    hint: game.i18n.localize("TBD.Settings.RefreshCombatTracker.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTINGS.DEBUG_LOGGING, {
    name: game.i18n.localize("TBD.Settings.DebugLogging.Name"),
    hint: game.i18n.localize("TBD.Settings.DebugLogging.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
}

export function getSetting(setting) {
  return game.settings.get(MODULE_ID, setting);
}
