import test from "node:test";
import assert from "node:assert/strict";
import { SPECIES, SPECIES_BY_KEY } from "../src/animals.js";
import { CONFIG, PHYSICS_CONFIG } from "../src/config.js";

test("approved icons select direction B except for the direction A parrot", () => {
  const selection = [
    ["cat", "猫", "b-cat"], ["dog", "狗", "b-dog"],
    ["rabbit", "兔子", "b-rabbit"], ["hamster", "仓鼠", "b-hamster"],
    ["bird", "鹦鹉", "a-parrot"], ["goldfish", "金鱼", "b-goldfish"],
  ];
  assert.equal(SPECIES.length, selection.length);
  selection.forEach(([key, label, variant], i) => {
    const species = SPECIES[i];
    assert.equal(species.key, key);
    assert.equal(species.label, label);
    assert.equal(SPECIES_BY_KEY.get(key), species);
    assert.ok(species.svg.includes(`data-icon-variant="${variant}"`));
  });
});

test("every sprite is self-contained, shares the preview palette and preserves the game dimensions", () => {
  for (const { key, svg } of SPECIES) {
    assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/, key);
    assert.match(svg, /viewBox="0 0 100 100"/, key);
    assert.match(svg, /fill="#F1EFE8" stroke="#343530" stroke-width="4.6"/, key);
    assert.match(svg, /stroke-linecap="round" stroke-linejoin="round"/, key);
    assert.equal(/<script|<image|<text|<use|class=|href=/i.test(svg), false, key);
    assert.ok(svg.includes('fill="#343530" stroke="none"'), key);
  }
  assert.equal(CONFIG.animalDiameter, 78 * 0.7);
  assert.equal(PHYSICS_CONFIG.animalDiameter, 48);
});
