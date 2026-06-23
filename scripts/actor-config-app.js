import { FLAGS, MODULE_ID } from "./constants.js";
import {
  assignImagesToStages,
  getDefaultStages,
  getPresetStages,
  normalizeConfig,
  recommendPresetForImageCount,
  updateTokenImageForStage
} from "./damage-engine.js";
import { ensureActorImageDirectory, getActorImageDirectory, uploadActorImageFiles } from "./asset-folders.js";

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
      defaultImageDirectory: getActorImageDirectory(this.actor),
      tokenizerAvailable: game.modules.get(MODULE_ID)?.api?.isTokenizerAvailable?.() ?? false
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='file-picker']").on("click", (event) => this.#openFilePicker(event));
    html.find("[data-action='open-art-browser']").on("click", (event) => this.#openArtBrowser(event));
    html.find("[data-action='upload-images']").on("click", (event) => this.#openUploadPicker(event));
    html.find("[data-action='upload-input']").on("change", (event) => this.#uploadImages(event));
    html.find("[data-action='apply-preset']").on("click", (event) => this.#applyPreset(event));
    html.find("[data-action='preview-stage']").on("click", (event) => this.#previewStage(event));
    html.find("[data-action='add-stage']").on("click", (event) => this.#addStage(event));
    html.find("[data-action='remove-stage']").on("click", (event) => this.#removeStage(event));
    html.find("[data-action='auto-distribute']").on("click", (event) => this.#autoDistribute(event));
    html.find("[data-action='restore-original']").on("click", (event) => this.#restoreOriginalImages(event));
    html.find("[data-action='reset-stages']").on("click", (event) => this.#resetStages(event));
  }

  async _updateObject(_event, formData) {
    const config = this.#getConfigFromForm(formData);
    await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);

    if (config.enabled) {
      await this.#ensureActorDirectory({ notify: true });
    }
  }

  async #openFilePicker(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const input = target.closest(".tbd-stage")?.querySelector("input[data-image-path]");
    if (!input) return;

    const directory = input.value || await this.#ensureActorDirectory({ notify: false });

    new FilePicker({
      type: "image",
      current: directory,
      callback: (path) => {
        input.value = path;
      }
    }).browse();
  }

  #openArtBrowser(event) {
    event.preventDefault();

    this.#ensureActorDirectory({ notify: false }).then((directory) => {
      new FilePicker({
        type: "image",
        current: directory,
        callback: () => {}
      }).browse();
    });
  }

  #openUploadPicker(event) {
    event.preventDefault();
    this.form.querySelector("[data-action='upload-input']")?.click();
  }

  async #uploadImages(event) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    try {
      const paths = await uploadActorImageFiles(this.actor, files);
      if (!paths.length) {
        ui.notifications.warn(game.i18n.localize("TBD.ActorConfig.NoImagesUploaded"));
        return;
      }

      const preset = recommendPresetForImageCount(paths.length);
      const config = this.#getConfigFromCurrentForm();
      config.enabled = true;
      config.stages = assignImagesToStages(getPresetStages(preset), paths);
      await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);
      ui.notifications.info(game.i18n.format("TBD.ActorConfig.UploadedImages", { count: paths.length, preset: game.i18n.localize(`TBD.ActorConfig.Preset.${preset}`) }));
      this.render();
    } catch (error) {
      ui.notifications.error(game.i18n.format("TBD.ActorConfig.UploadFailed", { error: error.message }));
    } finally {
      input.value = "";
    }
  }

  async #applyPreset(event) {
    event.preventDefault();

    const preset = event.currentTarget.dataset.preset ?? "full";
    const config = this.#getConfigFromCurrentForm();
    const existingImages = config.stages.filter((stage) => !stage.useOriginal && stage.img).map((stage) => stage.img);

    config.enabled = true;
    config.stages = assignImagesToStages(getPresetStages(preset), existingImages);
    await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);
    await this.#ensureActorDirectory({ notify: false });
    this.render();
  }

  async #previewStage(event) {
    event.preventDefault();

    const stage = this.#getStageFromElement(event.currentTarget.closest(".tbd-stage"));
    if (!stage) return;

    const tokens = this.actor.getActiveTokens(true);
    for (const token of tokens) {
      await updateTokenImageForStage(token, stage);
    }
    ui.notifications.info(game.i18n.format("TBD.ActorConfig.PreviewedStage", { label: stage.label }));
  }

  async #ensureActorDirectory({ notify = false } = {}) {
    try {
      const directory = await ensureActorImageDirectory(this.actor);
      if (notify) {
        ui.notifications.info(game.i18n.format("TBD.ActorConfig.ActorFolderReady", { directory }));
      }
      return directory;
    } catch (error) {
      ui.notifications.warn(game.i18n.format("TBD.ActorConfig.ActorFolderFailed", { error: error.message }));
      return getActorImageDirectory(this.actor);
    }
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

    const originalActorImg = this.actor.getFlag(MODULE_ID, FLAGS.ORIGINAL_ACTOR_IMG);
    if (originalActorImg && this.actor.img !== originalActorImg) {
      updates.push(this.actor.update({ img: originalActorImg }));
    }

    await Promise.all(updates);
    ui.notifications.info(game.i18n.format("TBD.ActorConfig.RestoredOriginals", { count: updates.length }));
  }

  async #resetStages(event) {
    event.preventDefault();

    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("TBD.ActorConfig.ResetStages"),
      content: `<p>${game.i18n.localize("TBD.ActorConfig.ResetStagesConfirm")}</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (!confirmed) return;

    const config = normalizeConfig(this.actor.getFlag(MODULE_ID, FLAGS.CONFIG));
    config.stages = getDefaultStages();
    await this.actor.setFlag(MODULE_ID, FLAGS.CONFIG, config);

    if (config.enabled) await this.#ensureActorDirectory({ notify: false });
    this.render();
  }

  #getConfigFromCurrentForm() {
    return this.#getConfigFromForm(Object.fromEntries(new FormData(this.form).entries()));
  }

  #getConfigFromForm(formData) {
    const expanded = foundry.utils.expandObject(formData);
    const stages = Object.values(expanded.stages ?? {}).map((stage, index) => ({
      id: stage.id || foundry.utils.randomID(),
      label: String(stage.label ?? `Stage ${index + 1}`).trim(),
      minPct: clampPercent(stage.minPct),
      maxPct: clampPercent(stage.maxPct),
      img: String(stage.img ?? "").trim(),
      useOriginal: Boolean(stage.useOriginal)
    }));

    return {
      enabled: Boolean(expanded.enabled),
      stages
    };
  }

  #getStageFromElement(stageElement) {
    if (!stageElement) return null;

    return {
      id: stageElement.querySelector("input[data-stage-id]")?.value || foundry.utils.randomID(),
      label: String(stageElement.querySelector("input[data-stage-label]")?.value ?? "").trim() || game.i18n.localize("TBD.ActorConfig.NewStage"),
      minPct: clampPercent(stageElement.querySelector("input[data-stage-min]")?.value),
      maxPct: clampPercent(stageElement.querySelector("input[data-stage-max]")?.value),
      img: String(stageElement.querySelector("input[data-image-path]")?.value ?? "").trim(),
      useOriginal: Boolean(stageElement.querySelector("input[data-use-original]")?.checked)
    };
  }
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}
