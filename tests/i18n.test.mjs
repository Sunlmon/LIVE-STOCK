import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { MESSAGES, LANGUAGE_STORAGE_KEY, normalizeLanguage, translate, getFateLabels,
  localizePhysicsError, readLanguagePreference, saveLanguagePreference, applyTranslations } from "../src/i18n.js";
import { FATE_LABELS } from "../src/reveal.js";

test("both local dictionaries cover the same keys with nonempty strings", () => {
  assert.deepEqual(Object.keys(MESSAGES.zh).sort(), Object.keys(MESSAGES.en).sort());
  for (const locale of ["zh", "en"]) for (const [key, value] of Object.entries(MESSAGES[locale])) {
    assert.equal(typeof value, "string", key);
    assert.ok(value.trim().length > 0, key);
    const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    assert.deepEqual(placeholders(value), placeholders(MESSAGES.zh[key]), key);
    if (locale === "en") assert.equal(/\p{Script=Han}/u.test(value), false, key);
  }
});

test("every static HTML translation and accessibility label exists in both languages", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const keys = [...html.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)].map(match => match[1]);
  assert.ok(keys.length > 35);
  for (const key of keys) for (const locale of ["zh", "en"]) assert.ok(Object.hasOwn(MESSAGES[locale], key), key);
  assert.equal([...html.matchAll(/data-language-switch/g)].length, 6);
  assert.equal(html.includes('class="capacity-timing"'), false);
  assert.equal(html.includes('data-i18n="capacity.timing"'), false);
  const capacityActions = html.match(/<div class="capacity-actions">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(capacityActions);
  assert.equal([...capacityActions.matchAll(/<button\b/g)].length, 1);
  assert.ok(capacityActions.includes('id="capacity-continue"'));
  assert.equal(html.includes('id="capacity-restart"'), false);
  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  assert.equal(main.includes('querySelector("#capacity-restart")'), false);
  const completion = html.match(/<section[^>]*id="physics-completion-screen"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(completion);
  assert.equal([...completion.matchAll(/<button\b/g)].length, 1);
  assert.ok(completion.includes('id="physics-results-button"'));
  assert.ok(completion.includes('data-i18n="physics.viewResults"'));
  assert.equal(MESSAGES.zh["physics.viewResults"], "查看结果");
  assert.equal(MESSAGES.en["physics.viewResults"], "View results");
  const startMarkup = html.match(/<button[^>]*id="start-button"[^>]*>([\s\S]*?)<\/button>/)?.[1];
  assert.ok(startMarkup);
  assert.equal(/svg|start-index|start-contact|[↗→]/.test(startMarkup), false);
});

test("ending story connects demand, unsold lives, the lever metaphor and the call against overbreeding", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const story = html.match(/<div class="ending-copy">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(story);
  const keys = ["title", "lead", "market", "fates", "lever", "callToAction"];
  let previous = -1;
  for (const key of keys) {
    const position = story.indexOf(`data-i18n="ending.${key}"`);
    assert.ok(position > previous, `missing or out-of-order ending.${key}`);
    previous = position;
    assert.ok(story.includes(MESSAGES.zh[`ending.${key}`]), `Chinese fallback differs: ${key}`);
  }
  assert.match(MESSAGES.zh["ending.title"], /滞销动物/);
  assert.match(MESSAGES.zh["ending.market"], /购买力缩减/);
  assert.match(MESSAGES.zh["ending.fates"], /可能/);
  assert.equal(MESSAGES.zh["ending.lever"], "你轻轻拉下杠杆，生命便开始滚动。在一次次碰撞与分流之间，它们被推向不同的去处。从诞生到终局，命运似乎始终握在他人手中。");
  assert.match(MESSAGES.zh["ending.callToAction"], /停止过度繁育/);
  assert.match(MESSAGES.en["ending.lever"], /lever.*collisions.*birth.*someone else's hands/);
  assert.match(MESSAGES.en["ending.callToAction"], /Stop overbreeding/);
  assert.match(MESSAGES.zh["ending.metaphor"], /不等同于死亡/);
  assert.match(MESSAGES.en["ending.metaphor"], /does not mean death/);
  assert.match(MESSAGES.zh["ending.weights"], /不是现实统计/);
});

test("dynamic numbers are interpolated without changing their values", () => {
  assert.equal(translate("zh", "physics.charge", { percent: 75 }), "蓄力 75% · 松开发射。");
  assert.equal(translate("en", "physics.charge", { percent: 75 }), "Power 75% · Release to launch.");
  assert.equal(translate("en", "physics.progress", { count: 3 }), "Launched 3 / 4");
  assert.match(translate("en", "ending.summary", { remaining: 479, adopted: 80 }), /479.*80/);
  assert.match(translate("en", "ending.physical", { count: 4, results: "Stray life 0" }), /4 animals only.*Stray life 0/);
  assert.equal(translate("zh", "physics.tryVariation", { percent: 75 }), "上次蓄力 75% · 试试更浅或更深地拉动。");
  assert.match(translate("en", "physics.tryVariation", { percent: 75 }), /75%/);
  for (let i = 0; i < 4; i++) for (const locale of ["zh", "en"]) {
    assert.ok(translate(locale, `fate.description.${i}`).length > 15);
  }
  assert.match(translate("zh", "fate.description.3"), /并不代表死亡/);
  assert.match(translate("en", "fate.description.3"), /does not mean death/);
  assert.equal(translate("zh", "capacity.continue"), "确认");
  assert.equal(translate("en", "capacity.continue"), "Confirm");
  assert.equal(/[↗→]/.test(translate("zh", "button.endingRestart")), false);
});

test("localized fate names retain the original four physical exit indices", () => {
  assert.deepEqual(getFateLabels("zh"), FATE_LABELS);
  assert.deepEqual(getFateLabels("en"), ["Stray life", "Accidental death", "Commercial processing", "Continued breeding"]);
  const first = getFateLabels("en"); first.reverse();
  assert.equal(getFateLabels("en")[0], "Stray life");
});

test("all physical error messages localize without mutating engine records", () => {
  for (const key of ["physics.boundsError", "physics.timeoutError", "physics.runtimeError"]) {
    const error = MESSAGES.zh[key];
    assert.equal(localizePhysicsError("zh", error), error);
    assert.equal(localizePhysicsError("en", error), MESSAGES.en[key]);
  }
  assert.equal(localizePhysicsError("en", "unexpected internal details"), MESSAGES.en["physics.runtimeError"]);
});

test("only the language preference is saved, with safe default and invalid-value handling", () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  assert.equal(readLanguagePreference(storage), "zh");
  assert.equal(saveLanguagePreference("en", storage), true);
  assert.equal(readLanguagePreference(storage), "en");
  assert.deepEqual([...data], [[LANGUAGE_STORAGE_KEY, "en"]]);
  assert.equal(saveLanguagePreference("zh", storage), true);
  assert.equal(readLanguagePreference(storage), "zh");
  data.set(LANGUAGE_STORAGE_KEY, "invalid");
  assert.equal(readLanguagePreference(storage), "zh");
  assert.equal(normalizeLanguage(null), "zh");
});

test("blocked or unavailable storage cannot break language switching", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(readLanguagePreference(blocked), "zh");
  assert.equal(saveLanguagePreference("en", blocked), false);
  assert.equal(readLanguagePreference(null), "zh");
  assert.equal(saveLanguagePreference("en", null), false);
  assert.equal(translate("en", "stageOne.title"), "Clear the screen");
});

test("DOM translation updates text, accessibility and pressed states without replacing game elements", () => {
  const node = { dataset: { i18n: "ending.title" }, textContent: "" };
  const label = { dataset: { i18nAriaLabel: "language.label" }, setAttribute(name, value) { this[name] = value; } };
  const buttons = ["zh", "en"].map(language => ({ dataset: { language }, setAttribute(name, value) { this[name] = value; } }));
  const root = { documentElement: {}, title: "", querySelectorAll(selector) {
    return selector === "[data-i18n]" ? [node] : selector === "[data-i18n-aria-label]" ? [label] : buttons;
  } };
  applyTranslations(root, "en");
  assert.equal(root.documentElement.lang, "en");
  assert.equal(root.title, MESSAGES.en["page.title"]);
  assert.equal(node.textContent, MESSAGES.en["ending.title"]);
  assert.equal(label["aria-label"], "Interface language");
  assert.deepEqual(buttons.map(button => button["aria-pressed"]), ["false", "true"]);
  applyTranslations(root, "zh");
  assert.equal(node.textContent, "看不见的滞销动物，去了哪里？");
  assert.equal(root.documentElement.lang, "zh-CN");
  assert.deepEqual(buttons.map(button => button["aria-pressed"]), ["true", "false"]);
});
