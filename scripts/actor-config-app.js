import { FLAGS, MODULE_ID, SETTINGS } from "./constants.js";
import { getSetting } from "./settings.js";
import { normalizeConfig } from "./damage-engine.js";

export class BattleDamageActorConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "token-battle-damage-actor-config",
      classes: ["token-battle-damage", "sheet"],
      title: game.i18n.localize("TBD.ActorConfig.Title"),
      template: "modules/token-battle-damage/templates/actor-config.hbs",
      width: 760,
      height: 560,
      resizable: true,
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false
    });
  }

  get actor() {
    return this.object;
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    const config = normalizeConfig(this.actor.getFlag(MODULE_ID, FLAGS.CONFIG));
    return {
      ...data,
      actor: this.actor,
      config,
      defaultImageDirectory: getDefaultImageDirectory(),
      tokenizerAvailable: game.modules.get(MODULE_ID)?.api?.isTokenizerAvailable?.() ?? false
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='file-picker']").on("click", (event) => this.#openFilePicker(event));
    html.find("[data-action='open-art-browser']").on("click", (event) => this.#openArtBrowser(event));
    html.find("[data-action='add-stage']").on("click", (event) => this.#addStage(event));
    html.find("[data-action='remove-stage']").on("click", (event) => this.#removeStage(event));
    html.find("[data-action='auto-distribute']").on("click", (event) => this.#autoDistribute(event));
    html.find("[data-action='restore-original']").on("click", (event) => this.#restoreOriginalImages(event));
  }

  async _updateObject(_event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const stages = Object.values(expanded.stages ?? {}).map((stage, index) => ({
      id: stage.id || foundry.utils.randomID(),
      label: String(stage.label ?? `Stage ${index + 1}`).trim(),
      minPct: clampPercent(stage.minPct),
      maxPct: clampPercent(stage.maxPct),
      img: String(stage.img ?? "").trim(),
      useOriginal: Boolean(stage.useOriginal)
    }));

    const config = {
      enabled: Boolean(expanded.enabled),
      stages
    };

    await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);
  }

  #openFilePicker(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const input = target.closest(".tbd-stage")?.querySelector("input[data-image-path]");
    if (!input) return;

    new FilePicker({
      type: "image",
      current: input.value || getDefaultImageDirectory(),
      callback: (path) => {
        input.value = path;
      }
    }).browse();
  }

  #openArtBrowser(event) {
    event.preventDefault();

    new FilePicker({
      type: "image",
      current: getDefaultImageDirectory(),
      callback: () => {}
    }).browse();
  }

  async #addStage(event) {
    event.preventDefault();
    await this.submit({ preventClose: true, updateData: {} });

    const config = normalizeConfig(this.actor.getFlag(MODULE_ID, FLAGS.CONFIG));
    config.stages.push({
      id: foundry.utils.randomID(),
      label: game.i18n.localize("TBD.ActorConfig.NewStage"),
      minPct: 1,
      maxPct: 1,
      img: "",
      useOriginal: false
    });

    await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);
    this.render();
  }

  async #removeStage(event) {
    event.preventDefault();
    const stageElement = event.currentTarget.closest(".tbd-stage");
    const stageId = stageElement?.dataset.stageId;
    if (!stageId) return;

    await this.submit({ preventClose: true, updateData: {} });
    const config = normalizeConfig(this.actor.getFlag(MODULE_ID, FLAGS.CONFIG));
    config.stages = config.stages.filter((stage) => stage.id !== stageId);
    await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);
    this.render();
  }

  async #autoDistribute(event) {
    event.preventDefault();
    await this.submit({ preventClose: true, updateData: {} });

    const config = normalizeConfig(this.actor.getFlag(MODULE_ID, FLAGS.CONFIG));
    const nonDefeated = config.stages.filter((stage) => !(Number(stage.minPct) === 0 && Number(stage.maxPct) === 0));
    const width = Math.floor(100 / Math.max(nonDefeated.length, 1));
    let max = 100;

    for (const stage of nonDefeated) {
      stage.maxPct = max;
      stage.minPct = Math.max(1, max - width + 1);
      max = stage.minPct - 1;
    }

    await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);
    this.render();
  }

  async #restoreOriginalImages(event) {
    event.preventDefault();
    const tokens = this.actor.getActiveTokens(true);
    const updates = [];

    for (const token of tokens) {
      const doc = token.document;
      const original = doc.getFlag(MODULE_ID, "originalTextureSrc");
      if (!original || doc.texture?.src === original) continue;
      updates.push(doc.update({ "texture.src": original }));
    }

    await Promise.all(updates);
    ui.notifications.info(game.i18n.format("TBD.ActorConfig.RestoredOriginals", { count: updates.length }));
  }
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function getDefaultImageDirectory() {
  const configured = String(getSetting(SETTINGS.DEFAULT_IMAGE_DIRECTORY) ?? "").trim();
  return configured || "";
}
