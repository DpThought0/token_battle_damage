import test from "node:test";
import assert from "node:assert/strict";

globalThis.game = {
  settings: {
    get: (_moduleId, setting) => {
      const values = {
        includeDefeatedImage: true,
        hpCurrentPath: "system.attributes.hp.value",
        hpMaxPath: "system.attributes.hp.max"
      };
      return values[setting];
    }
  }
};

globalThis.foundry = {
  utils: {
    getProperty: (object, path) => path.split(".").reduce((value, key) => value?.[key], object)
  }
};

const engine = await import("../scripts/damage-engine.js");

test("calculateHpPercent clamps and rounds upward", () => {
  assert.equal(engine.calculateHpPercent(8, 10), 80);
  assert.equal(engine.calculateHpPercent(1, 3), 34);
  assert.equal(engine.calculateHpPercent(-5, 10), 0);
  assert.equal(engine.calculateHpPercent(15, 10), 100);
});

test("findStageForPercent returns the matching threshold", () => {
  const stages = engine.getDefaultStages();
  assert.equal(engine.findStageForPercent(stages, 100).id, "healthy");
  assert.equal(engine.findStageForPercent(stages, 79).id, "light");
  assert.equal(engine.findStageForPercent(stages, 0).id, "defeated");
  assert.equal(engine.findStageForPercent(stages, 101), null);
});

test("getActorHp reads configured paths", () => {
  const actor = {
    system: {
      attributes: {
        hp: {
          value: 7,
          max: 12
        }
      }
    }
  };

  assert.deepEqual(engine.getActorHp(actor), { current: 7, max: 12 });
});

test("pathMayBeIncluded handles nested and flattened update payloads", () => {
  assert.equal(engine.pathMayBeIncluded({ system: { attributes: { hp: { value: 4 } } } }, "system.attributes.hp.value"), true);
  assert.equal(engine.pathMayBeIncluded({ "system.attributes.hp.value": 4 }, "system.attributes.hp.value"), true);
  assert.equal(engine.pathMayBeIncluded({ system: { details: { biography: "x" } } }, "system.attributes.hp.value"), false);
});
