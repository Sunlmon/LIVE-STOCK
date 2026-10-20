// All translations are local. No network service or game state is stored.
export const LANGUAGE_STORAGE_KEY = "live-stock-language";
export const MESSAGES = Object.freeze({
  zh: Object.freeze({
    "page.title": "活体滞销 — 清空屏幕",
    "language.label": "界面语言",
    "cover.kicker": "活 体 滞 销",
    "cover.description": "一次关于「清空」的互动实验。",
    "cover.hint": "点击，开始领养",
    "cover.footer": "点击领养 · 看它们不断生长",
    "cover.brand": "LIVE STOCK — 活体滞销",
    "stageOne.title": "清空屏幕",
    "stageOne.hint": "通过点击将小动物都领养出去",
    "stageOne.onScreen": "屏幕中",
    "stageOne.adopted": "已领养",
    "stageOne.density": "画面密度",
    "canvas.scene": "清空屏幕互动场景",
    "canvas.active": "点击动物，尝试将它们领养离开",
    "canvas.physics": "四只动物的物理弹珠体验：向下拖动右下角拉杆，松开发射；返回通道的动物可再次发射",
    "canvas.reveal": "本轮模拟：动物静止、褪色，转为结局符号，再转为骷髅并逐个消散",
    "button.restart": "重新开始",
    "button.retry": "重新体验",
    "button.endingRestart": "重新开始 ↗",
    "capacity.lineOne": "动物数量太多了，",
    "capacity.lineTwo": "已经超出承受能力。",
    "capacity.description": "领养的速度，已经追不上繁育的速度。",
    "capacity.continue": "进入分流装置 →",
    "capacity.timing": "稍后自动进入，也可点击继续。",
    "load.error": "动物图形未能载入。请通过本地网页服务器重新打开页面。",
    "physics.ready": "向下拖过金色刻度，选择不同深度后松开发射。",
    "physics.complete": "本轮体验完成。",
    "physics.flight": "运动中 · 等待动物通过出口。",
    "physics.returned": "动物已返回发射通道 · 可再次拉动拉杆发射。",
    "physics.charge": "蓄力 {percent}% · 松开发射。",
    "physics.pullMore": "继续向下拉，越过中段的金色刻度。",
    "physics.progress": "已发射 {count} / 4",
    "physics.loadError": "装置未能载入，请检查 vendor 文件并刷新页面。",
    "physics.boundsError": "动物离开了装置边界，请重新体验本轮。",
    "physics.timeoutError": "本次运动未能完成，请重新体验本轮。",
    "physics.runtimeError": "装置运行中断，请重新体验本轮。",
    "reveal.badge": "03 · 本轮模拟",
    "reveal.hold": "动物已停止运动。",
    "reveal.fade": "动物正在褪色。",
    "reveal.symbols": "动物转为本轮模拟的结局符号。",
    "reveal.fates": "本轮模拟的结局符号暂时停留。",
    "reveal.skulls": "符号转为视觉隐喻中的骷髅。",
    "reveal.dissolve": "图形正在逐个消散。",
    "ending.brand": "活体滞销",
    "ending.title": "屏幕终于清空了。",
    "ending.lineTwo": "但那些生命，并没有因此消失。",
    "ending.lineThree": "当繁育不断继续，",
    "ending.lineFour": "没有被市场选择的生命，最终去了哪里？",
    "ending.resultTitle": "本轮模拟结果",
    "ending.summary": "未领养 {remaining} 只 · 已领养 {adopted} 只（不参与模拟）",
    "ending.weights": "四类等权的创作模拟参数，不是现实统计或发生率。每轮可能不同，某类也可能为零。",
    "ending.physical": "弹珠实际出口记录（仅 {count} 只）：{results}。以上整屏结果另行模拟，并非全部经过弹珠装置。",
    "ending.metaphor": "骷髅转化为视觉隐喻；“继续繁育”不等同于死亡。",
    "ending.contextLabel": "关于模拟数据的说明",
    "ending.contextOne": "我无法为这些去向给出确切的发生概率。本作品未采用能够覆盖各类宠物、持续追踪未被领养个体去向的可靠数据，因此，这里的数字只是创作模拟，不代表现实中的比例。",
    "ending.contextTwo": "猫、狗、兔子、仓鼠、鸟和金鱼……当它们没有被领养，我仍想追问：后来发生了什么？让人心痛的，不只是它们离开了屏幕，而是它们的去向，可能始终没有进入我们的视线。",
    "ending.error": "结尾动画未能完整播放。已保留本轮模拟结果，你可以重新开始。",
    "fate.0": "流浪",
    "fate.1": "意外死亡",
    "fate.2": "商品化处理",
    "fate.3": "继续繁育",
  }),
  en: Object.freeze({
    "page.title": "LIVE STOCK — Clear the Screen",
    "language.label": "Interface language",
    "cover.kicker": "UNSOLD LIVES",
    "cover.description": "An interactive experiment in clearing a screen.",
    "cover.hint": "Click to begin adopting",
    "cover.footer": "Click to adopt · Watch them keep multiplying",
    "cover.brand": "LIVE STOCK — EVERY LITTLE LIFE.",
    "stageOne.title": "Clear the screen",
    "stageOne.hint": "Click to find every animal a home",
    "stageOne.onScreen": "On screen",
    "stageOne.adopted": "Adopted",
    "stageOne.density": "Density",
    "canvas.scene": "Clear the screen: interactive animal scene",
    "canvas.active": "Click animals to adopt them and clear the screen",
    "canvas.physics": "Four-animal physics experience: drag the lower-right lever down and release to launch; an animal that returns can be launched again",
    "canvas.reveal": "Creative simulation: animals stop, fade into outcome symbols, become skulls, then disappear one by one",
    "button.restart": "Restart",
    "button.retry": "Try again",
    "button.endingRestart": "Restart ↗",
    "capacity.lineOne": "There are too many animals.",
    "capacity.lineTwo": "Capacity has been exceeded.",
    "capacity.description": "Adoption can no longer keep pace with breeding.",
    "capacity.continue": "Enter the sorting machine →",
    "capacity.timing": "Continuing shortly. You can also click to proceed.",
    "load.error": "Animal graphics could not load. Please open this page through a local web server.",
    "physics.ready": "Drag past the gold mark, then release at your chosen depth.",
    "physics.complete": "This round is complete.",
    "physics.flight": "In motion · Waiting for the animal to pass through an exit.",
    "physics.returned": "The animal has returned · Pull the lever to launch it again.",
    "physics.charge": "Power {percent}% · Release to launch.",
    "physics.pullMore": "Keep pulling down, past the middle gold mark.",
    "physics.progress": "Launched {count} / 4",
    "physics.loadError": "The machine could not load. Check the vendor files and reload the page.",
    "physics.boundsError": "The animal left the machine's boundaries. Please try this round again.",
    "physics.timeoutError": "This launch did not finish. Please try this round again.",
    "physics.runtimeError": "The machine was interrupted. Please try this round again.",
    "reveal.badge": "03 · SIMULATION",
    "reveal.hold": "The animals have stopped moving.",
    "reveal.fade": "The animals are fading.",
    "reveal.symbols": "The animals become symbols of this round's simulated outcomes.",
    "reveal.fates": "The simulated outcome symbols remain on screen briefly.",
    "reveal.skulls": "The symbols become skulls as a visual metaphor.",
    "reveal.dissolve": "The shapes disappear one by one.",
    "ending.brand": "LIVE STOCK",
    "ending.title": "The screen is finally clear.",
    "ending.lineTwo": "But those lives have not disappeared.",
    "ending.lineThree": "As breeding continues,",
    "ending.lineFour": "where do the lives the market leaves behind end up?",
    "ending.resultTitle": "This round's simulated outcomes",
    "ending.summary": "Not adopted: {remaining} · Adopted: {adopted} (excluded from the simulation)",
    "ending.weights": "Four equally weighted creative parameters, not real-world statistics or probabilities. Results vary each round; a category may have zero animals.",
    "ending.physical": "Actual pinball exit records ({count} animals only): {results}. The full-screen outcomes above are simulated separately; not every animal passed through the machine.",
    "ending.metaphor": "The skull transformation is a visual metaphor. Continued breeding does not mean death.",
    "ending.contextLabel": "About the simulated data",
    "ending.contextOne": "I cannot give exact probabilities for these outcomes. This work does not use reliable data that covers every kind of pet and follows unadopted individuals over time. These numbers are a creative simulation, not real-world proportions.",
    "ending.contextTwo": "Cats, dogs, rabbits, hamsters, birds and goldfish… When they are not adopted, I still want to ask: what happened next? What hurts is not only that they leave the screen, but that where they go may never come into view.",
    "ending.error": "The ending animation was interrupted. This round's simulated results are preserved. You can restart.",
    "fate.0": "Stray life",
    "fate.1": "Accidental death",
    "fate.2": "Commercial processing",
    "fate.3": "Continued breeding",
  }),
});

export function normalizeLanguage(value) {
  return value === "en" ? "en" : "zh";
}

export function translate(language, key, values = {}) {
  const template = MESSAGES[normalizeLanguage(language)][key] ?? MESSAGES.zh[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : placeholder);
}

export function getFateLabels(language) {
  return Array.from({ length: 4 }, (_, index) => translate(language, `fate.${index}`));
}

export function localizePhysicsError(language, message) {
  const key = ["physics.boundsError", "physics.timeoutError", "physics.runtimeError"]
    .find(key => MESSAGES.zh[key] === message);
  return translate(language, key ?? "physics.runtimeError");
}

export function readLanguagePreference(storage) {
  try {
    return normalizeLanguage((storage === undefined ? globalThis.localStorage : storage)?.getItem(LANGUAGE_STORAGE_KEY));
  } catch { return "zh"; }
}

export function saveLanguagePreference(language, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target) return false;
    target.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
    return true;
  } catch { return false; }
}

export function applyTranslations(root, language) {
  const locale = normalizeLanguage(language);
  root.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  root.title = translate(locale, "page.title");
  for (const node of root.querySelectorAll("[data-i18n]")) {
    node.textContent = translate(locale, node.dataset.i18n);
  }
  for (const node of root.querySelectorAll("[data-i18n-aria-label]")) {
    node.setAttribute("aria-label", translate(locale, node.dataset.i18nAriaLabel));
  }
  for (const button of root.querySelectorAll("[data-language]")) {
    button.setAttribute("aria-pressed", String(button.dataset.language === locale));
  }
}
