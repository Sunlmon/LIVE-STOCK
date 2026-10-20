import { CONFIG, PHYSICS_CONFIG } from "./config.js";
import { SPECIES, loadAnimalSprites, findAnimalAt, updateAnimalAnimations } from "./animals.js";
import { beginBreedingPulse, advanceBreedingPulse, getBreedingTiming, measureDensity } from "./breeding.js";
import { createCanvasRenderer } from "./canvas-renderer.js";
import { adoptAnimal, updateParticles } from "./particles.js";
import { createState, startRound, captureStageOne, beginStageOneFinish, isStageOneFinishReady, beginCapacityNotice, advanceCapacityNotice } from "./state.js";
import { createPhysicsStage } from "./physics-stage.js";
import { createReveal, updateReveal, revealVisualAt, REVEAL_CONFIG } from "./reveal.js";
import { drawExitIcon } from "./physics-renderer.js";
import { translate, getFateLabels, localizePhysicsError, normalizeLanguage,
  readLanguagePreference, saveLanguagePreference, applyTranslations } from "./i18n.js";

const introScreen = document.querySelector("#intro-screen");
const playScreen = document.querySelector("#play-screen");
const canvas = document.querySelector("#animal-canvas");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const stageOneHud = document.querySelector("#stage-one-hud");
const physicsHud = document.querySelector("#physics-hud");
const physicsStatus = document.querySelector("#physics-status");
const physicsProgress = document.querySelector("#physics-progress");
const physicsRetry = document.querySelector("#physics-retry");
const loadError = document.querySelector("#load-error");
const animalCount = document.querySelector("#animal-count");
const adoptedCount = document.querySelector("#adopted-count");
const densityFill = document.querySelector("#density-fill");
const coverAnimals = document.querySelector("#cover-animals");
const revealHud = document.querySelector("#reveal-hud");
const revealStatus = document.querySelector("#reveal-status");
const endingScreen = document.querySelector("#ending-screen");
const resultList = document.querySelector("#simulated-results");
const resultSummary = document.querySelector("#result-summary");
const physicalSummary = document.querySelector("#physical-summary");
const capacityScreen = document.querySelector("#capacity-screen");
const capacityContinue = document.querySelector("#capacity-continue");

if (coverAnimals) {
  coverAnimals.innerHTML = SPECIES.map((species, index) =>
    `<span class="cover-animal cover-animal-${index}" style="--float-delay:${index * -0.7}s">${species.svg}</span>`,
  ).join("");
}

const state = createState();
let sprites = new Map();
let renderer;
let previousFrameAt = 0;
let introIsLeaving = false;
let introExitStartedAt = null;
let activePointer = null;
let language = readLanguagePreference();
const t = (key, values) => translate(language, key, values);

for (const group of document.querySelectorAll("[data-language-switch]")) {
  for (const [locale, label] of [["zh", "中文"], ["en", "EN"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.language = locale;
    button.lang = locale === "zh" ? "zh-CN" : "en";
    button.textContent = label;
    button.setAttribute("aria-label", locale === "zh" ? "切换到中文 / Switch to Chinese" : "Switch to English / 切换到英文");
    button.addEventListener("click", () => {
      if (language === locale) return;
      language = normalizeLanguage(locale);
      saveLanguagePreference(language);
      // Text wrapping can change the HUD/viewport fit. Cancel a held lever
      // safely, like resizing, without launching or replacing its animal.
      cancelPointer();
      refreshLanguage();
    });
    group.append(button);
  }
}
refreshLanguage();

function refreshLanguage() {
  applyTranslations(document, language);
  const canvasKey = state.mode === "physics" ? "canvas.physics" : state.mode === "reveal" ? "canvas.reveal" : "canvas.active";
  canvas.setAttribute("aria-label", t(canvasKey));
  if (state.mode === "physics") updatePhysicsHud();
  if (state.mode === "reveal") updateRevealStatus();
  if (state.mode === "ending") updateEndingText();
  renderer?.resize();
}

try {
  sprites = await loadAnimalSprites();
  renderer = createCanvasRenderer(canvas, sprites, { physicsHud });
} catch (error) {
  console.error("无法初始化动物画布：", error);
  loadError.hidden = false;
  startButton.disabled = true;
}

startButton.addEventListener("click", beginRound);
restartButton.addEventListener("click", beginRound);
physicsRetry.addEventListener("click", () => enterPhysics(true));
document.querySelector("#reveal-restart").addEventListener("click", beginRound);
document.querySelector("#ending-restart").addEventListener("click", beginRound);
document.querySelector("#capacity-restart").addEventListener("click", beginRound);
capacityContinue.addEventListener("click", () => {
  if (state.mode === "capacity") enterPhysics();
});
window.addEventListener("resize", () => { cancelPointer(); renderer?.resize(); });
window.addEventListener("blur", pausePhysics);
document.addEventListener("visibilitychange", pausePhysics);

canvas.addEventListener("pointerdown", (event) => {
  if (!renderer || introIsLeaving || event.button !== 0) return;
  const point = renderer.pointerToLogical(event.clientX, event.clientY);
  if (state.mode === "physics") {
    if (activePointer === null && state.physics?.beginPull(point)) {
      activePointer = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add("is-pulling");
      event.preventDefault();
      updatePhysicsHud();
    }
    return;
  }
  if (state.mode !== "active") return;
  const index = findAnimalAt(state.animals, point.x, point.y, state.elapsedMs);
  if (adoptAnimal(state, index)) updateHud(true);
});

canvas.addEventListener("pointermove", (event) => {
  if (state.mode !== "physics" || !renderer || !state.physics) return;
  const point = renderer.pointerToLogical(event.clientX, event.clientY);
  if (activePointer === event.pointerId) {
    state.physics.dragPull(point);
    updatePhysicsHud();
  } else canvas.style.cursor = state.physics.canPull() && state.physics.hitHandle(point) ? "grab" : "default";
});
canvas.addEventListener("pointerup", (event) => {
  if (activePointer !== event.pointerId || !renderer) return;
  state.physics?.dragPull(renderer.pointerToLogical(event.clientX, event.clientY));
  state.physics?.releasePull();
  clearPointerCapture();
  updatePhysicsHud();
});
canvas.addEventListener("pointercancel", cancelPointer);
canvas.addEventListener("lostpointercapture", () => { if (activePointer !== null) cancelPointer(); });

function clearPointerCapture() {
  const pointerId = activePointer;
  activePointer = null;
  canvas.classList.remove("is-pulling");
  canvas.style.cursor = "";
  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
}
function cancelPointer() {
  state.physics?.cancelPull();
  clearPointerCapture();
  if (state.mode === "physics") updatePhysicsHud();
}
function pausePhysics() {
  cancelPointer();
  state.physics?.pause();
  previousFrameAt = 0;
}

function beginRound() {
  if (!renderer || introIsLeaving) return;
  cancelPointer();
  const fromCover = !introScreen.hidden;
  startRound(state);
  stageOneHud.hidden = false;
  physicsHud.hidden = true;
  revealHud.hidden = true;
  endingScreen.hidden = true;
  hideCapacityNotice();
  resultList.replaceChildren();
  resultSummary.textContent = "";
  physicalSummary.textContent = "";
  document.querySelector("#ending-error").hidden = true;
  playScreen.inert = false;
  canvas.classList.remove("is-physics");
  canvas.classList.remove("is-reveal");
  canvas.setAttribute("aria-label", t("canvas.active"));
  playScreen.hidden = false;
  if (fromCover) {
    introIsLeaving = true;
    introExitStartedAt = null;
    startButton.disabled = true;
    introScreen.classList.add("is-leaving");
  }
  // The canvas lives inside a hidden section during initial loading, so its first
  // measured size is 0×0. Re-measure after revealing the play screen.
  renderer.resize();
  previousFrameAt = 0;
  updateHud(true);
}

function hideCapacityNotice() {
  capacityScreen.hidden = true;
  capacityScreen.classList.remove("is-visible");
  canvas.classList.remove("is-capacity");
  canvas.inert = false;
}

function lockStageOneEndIfNeeded() {
  if (!beginStageOneFinish(state)) return;
  // Canvas animation continues; native pointer input and the active-only
  // adoption handler are both disabled from the threshold-crossing frame.
  canvas.inert = true;
  updateHud(true);
}

function showCapacityNotice() {
  if (!beginCapacityNotice(state)) return;
  cancelPointer();
  introScreen.hidden = true;
  playScreen.hidden = false;
  stageOneHud.hidden = true;
  canvas.classList.add("is-capacity");
  canvas.inert = true;
  capacityScreen.hidden = false;
  capacityScreen.classList.add("is-visible");
  renderer.resize();
  capacityContinue.focus({ preventScroll: true });
}

function enterPhysics(retry = false) {
  cancelPointer();
  hideCapacityNotice();
  state.physics?.dispose();
  state.physics = null;
  if (!retry) captureStageOne(state);
  state.physicalOutcomes = [];
  state.pendingParents = [];
  state.pendingParentIndex = 0;
  state.pendingBirthAt = null;
  state.particles = [];
  state.mode = "physics";
  introScreen.hidden = true;
  playScreen.hidden = false;
  stageOneHud.hidden = true;
  physicsHud.hidden = false;
  canvas.classList.add("is-physics");
  canvas.setAttribute("aria-label", t("canvas.physics"));
  try {
    state.physics = createPhysicsStage(window.Matter, state.physicsRepresentatives, state.physicalOutcomes);
    updatePhysicsHud();
  } catch (error) {
    console.error("无法初始化物理装置：", error);
    physicsStatus.textContent = t("physics.loadError");
    physicsStatus.classList.add("is-error");
    physicsRetry.hidden = false;
    physicsProgress.textContent = t("physics.progress", { count: 0 });
  }
  renderer?.resize();
  previousFrameAt = 0;
}

function updatePhysicsHud() {
  const physics = state.physics?.state;
  if (!physics) {
    if (state.mode === "physics") {
      physicsStatus.textContent = t("physics.loadError");
      physicsProgress.textContent = t("physics.progress", { count: 0 });
    }
    return;
  }
  let hint;
  if (physics.status === "complete") hint = t("physics.complete");
  else if (physics.status === "error") hint = localizePhysicsError(language, physics.error);
  else if (physics.status === "flight") hint = t("physics.flight");
  else if (physics.status === "returned") hint = t("physics.returned");
  else if (physics.status === "pulling") hint = physics.pull >= PHYSICS_CONFIG.minPull
    ? t("physics.charge", { percent: Math.round(physics.pull / PHYSICS_CONFIG.maxPull * 100) })
    : t("physics.pullMore");
  else hint = t("physics.ready");
  if (physicsStatus.textContent !== hint) physicsStatus.textContent = hint;
  const progress = t("physics.progress", { count: physics.launched });
  if (physicsProgress.textContent !== progress) physicsProgress.textContent = progress;
  physicsStatus.classList.toggle("is-error", physics.status === "error");
  physicsStatus.classList.toggle("is-charged", physics.status === "pulling" && physics.pull >= PHYSICS_CONFIG.minPull);
  physicsRetry.hidden = !["complete", "error"].includes(physics.status);
}

function enterReveal() {
  // Build from the real, unadopted snapshot before disposing the physical world.
  // Simulation assignment does not read or rewrite the four actual exit records.
  const reveal = createReveal(state.stageOneSnapshot);
  cancelPointer();
  state.physics?.dispose();
  state.physics = null;
  state.reveal = reveal;
  state.simulatedFates = reveal.items;
  state.mode = "reveal";
  physicsHud.hidden = true;
  stageOneHud.hidden = true;
  revealHud.hidden = false;
  canvas.classList.remove("is-physics");
  canvas.classList.add("is-reveal");
  canvas.setAttribute("aria-label", t("canvas.reveal"));
  renderer.resize();
  updateRevealStatus();
}

function updateRevealStatus() {
  const phase = revealVisualAt(state.reveal.elapsedMs).phase;
  const label = t(`reveal.${phase}`);
  if (revealStatus.textContent !== label) revealStatus.textContent = label;
}

function showEnding(animationError = false) {
  state.mode = "ending";
  revealHud.hidden = true;
  physicsHud.hidden = true;
  stageOneHud.hidden = true;
  playScreen.inert = true;
  endingScreen.hidden = false;
  document.querySelector("#ending-error").hidden = !animationError;
  resultList.replaceChildren(...getFateLabels(language).map((label, i) => {
    const card = document.createElement("li");
    const title = document.createElement("span"); title.className = "result-label";
    // Reuse the actual outlet symbols, not a separate or approximate icon set.
    const icon = document.createElement("canvas");
    icon.width = icon.height = 72;
    icon.className = "result-icon";
    icon.setAttribute("aria-hidden", "true");
    const paint = icon.getContext("2d");
    paint.translate(36, 36);
    paint.lineCap = "round"; paint.lineJoin = "round";
    drawExitIcon(paint, i, 0, 0, "#282A27");
    const name = document.createElement("span"); name.textContent = label;
    name.dataset.i18n = `fate.${i}`;
    title.append(icon, name);
    const count = document.createElement("strong"); count.textContent = String(state.reveal.counts[i]);
    count.dataset.count = String(state.reveal.counts[i]);
    const percent = document.createElement("small"); percent.textContent = `${(state.reveal.percentages[i] / 10).toFixed(1)}%`;
    card.append(title, count, percent);
    return card;
  }));
  updateEndingText();
  endingScreen.scrollTop = 0;
  endingScreen.focus({ preventScroll: true });
}

function updateEndingText() {
  resultSummary.textContent = t("ending.summary", {
    remaining: state.simulatedFates.length, adopted: state.stageOneSummary?.adoptedCount ?? 0,
  });
  const labels = getFateLabels(language);
  const actualCounts = labels.map((_, i) => state.physicalOutcomes.filter(item => item.exitIndex === i).length);
  physicalSummary.textContent = t("ending.physical", {
    count: state.physicalOutcomes.length,
    results: labels.map((label, i) => `${label} ${actualCounts[i]}`).join(" · "),
  });
}

function updateHud(force = false) {
  animalCount.textContent = String(state.animals.length);
  adoptedCount.textContent = String(state.adoptedCount);
  densityFill.style.width = `${Math.min(100, Math.round((state.density / CONFIG.saturationDensity) * 100))}%`;
  if (force) state.lastHudUpdateAt = state.elapsedMs;
}

function frame(timestamp) {
  try {
    const dt = previousFrameAt === 0 ? 0 : Math.min((timestamp - previousFrameAt) / 1000, 0.05);
    previousFrameAt = timestamp;

    if (introIsLeaving) {
      introExitStartedAt ??= timestamp;
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (reducedMotion || timestamp - introExitStartedAt >= CONFIG.introTransitionMs) {
        introScreen.hidden = true;
        introScreen.classList.remove("is-leaving");
        introIsLeaving = false;
        startButton.disabled = false;
      }
    }

    if ((state.mode === "active" || state.mode === "finishing") && !introIsLeaving) {
      state.elapsedMs += dt * 1000;
      updateAnimalAnimations(state.animals, dt);
      updateParticles(state.particles, dt);

      state.density = measureDensity(state.animals);
      lockStageOneEndIfNeeded();

      if (
        state.mode === "active" &&
        state.pendingBirthAt === null && state.elapsedMs >= state.nextBreedAt &&
        state.elapsedMs >= state.breedingBusyUntil
      ) {
        if (!beginBreedingPulse(state)) state.nextBreedAt = state.elapsedMs + getBreedingTiming(state.breedRound + 1).intervalMs;
      }
      if (state.pendingBirthAt !== null && state.elapsedMs >= state.pendingBirthAt) {
        advanceBreedingPulse(state);
      }

      // A litter can reach the existing capacity limit in this very frame.
      lockStageOneEndIfNeeded();
      // No guessed duration, recovery timer or packing timeout: finish the
      // already queued sources and every delayed/in-flight offspring first.
      if (isStageOneFinishReady(state)) {
        updateHud(true);
        showCapacityNotice();
      }

      if (state.elapsedMs - state.lastHudUpdateAt >= 100) {
        updateHud(true);
      }
    }

    if (advanceCapacityNotice(state, dt, document.hidden)) enterPhysics();

    if (state.mode === "physics" && !document.hidden) {
      state.physics?.update(dt);
      updatePhysicsHud();
      const physics = state.physics?.state;
      const lastOutcome = state.physicalOutcomes.at(-1);
      if (physics?.status === "complete" && physics.resolved === PHYSICS_CONFIG.totalShots && lastOutcome &&
        physics.elapsedMs - lastOutcome.passedAtMs >= REVEAL_CONFIG.entryDelayMs) enterReveal();
    }

    if (state.mode === "reveal" && !document.hidden) {
      updateReveal(state.reveal, dt);
      updateRevealStatus();
      if (state.reveal.complete) showEnding();
    }

    renderer?.render(state);
  } catch (error) {
    if (state.mode === "reveal" && state.reveal) {
      console.error("结尾动画中断：", error);
      showEnding(true); // preserve valid simulation counts, offer a visible restart
      return;
    }
    if (state.mode === "physics") {
      console.error("物理体验出错：", error);
      state.physics?.fail("装置运行中断，请重新体验本轮。");
      cancelPointer();
      updatePhysicsHud();
      return;
    }
    // A single bad reproduction frame should not stop requestAnimationFrame
    // forever and leave every parent frozen as a black dot.
    console.error("动画帧出错，已恢复繁殖动画：", error);
    if (state.mode !== "finishing") {
      state.pendingParents = [];
      state.pendingParentIndex = 0;
      state.pendingBirthAt = null;
      state.breedingBusyUntil = state.elapsedMs;
      state.nextBreedAt = state.elapsedMs + getBreedingTiming(state.breedRound + 1).intervalMs;
    }
    try {
      renderer?.render(state);
    } catch (renderError) {
      console.error("Canvas 绘制失败：", renderError);
    }
  } finally {
    requestAnimationFrame(frame);
  }
}

requestAnimationFrame(frame);

// Local QA shortcut: uses the initial population as a clearly documented sample.
// Normal visits always start at the unchanged cover and stage-one experience.
const previewStage = new URLSearchParams(window.location.search).get("stage");
if (["physics", "capacity"].includes(previewStage) && renderer) {
  startRound(state);
  if (previewStage === "capacity") showCapacityNotice();
  else enterPhysics();
}
