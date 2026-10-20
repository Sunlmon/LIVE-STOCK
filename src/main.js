import { CONFIG, PHYSICS_CONFIG } from "./config.js";
import { SPECIES, loadAnimalSprites, findAnimalAt, updateAnimalAnimations } from "./animals.js";
import { beginBreedingPulse, advanceBreedingPulse, measureDensity, isScreenSaturated } from "./breeding.js";
import { createCanvasRenderer } from "./canvas-renderer.js";
import { adoptAnimal, updateParticles } from "./particles.js";
import { createState, startRound, captureStageOne, beginCapacityNotice, advanceCapacityNotice } from "./state.js";
import { isPackingSettled } from "./packing.js";
import { createPhysicsStage } from "./physics-stage.js";
import { createReveal, updateReveal, revealVisualAt, FATE_LABELS, REVEAL_CONFIG } from "./reveal.js";

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
  canvas.setAttribute("aria-label", "点击动物，尝试将它们领养离开");
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
  canvas.setAttribute("aria-label", "四只动物的物理弹珠体验：向下拖动右下角拉杆，松开发射；返回通道的动物可再次发射");
  try {
    state.physics = createPhysicsStage(window.Matter, state.physicsRepresentatives, state.physicalOutcomes);
    updatePhysicsHud();
  } catch (error) {
    console.error("无法初始化物理装置：", error);
    physicsStatus.textContent = "装置未能载入，请检查 vendor 文件并刷新页面。";
    physicsStatus.classList.add("is-error");
    physicsRetry.hidden = false;
    physicsProgress.textContent = "已发射 0 / 4";
  }
  renderer?.resize();
  previousFrameAt = 0;
}

function updatePhysicsHud() {
  const physics = state.physics?.state;
  if (!physics) return;
  let hint;
  if (physics.status === "complete") hint = "本轮体验完成。";
  else if (physics.status === "error") hint = physics.error;
  else if (physics.status === "flight") hint = "运动中 · 等待动物通过出口。";
  else if (physics.status === "returned") hint = "动物已返回发射通道 · 可再次拉动拉杆发射。";
  else if (physics.status === "pulling") hint = physics.pull >= PHYSICS_CONFIG.minPull
    ? `蓄力 ${Math.round(physics.pull / PHYSICS_CONFIG.maxPull * 100)}% · 松开发射。`
    : "继续向下拉，越过中段的金色刻度。";
  else hint = "向下拖过金色刻度，选择不同深度后松开发射。";
  if (physicsStatus.textContent !== hint) physicsStatus.textContent = hint;
  const progress = `已发射 ${physics.launched} / 4`;
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
  canvas.setAttribute("aria-label", "本轮模拟：动物静止、褪色，转为结局符号，再转为骷髅并逐个消散");
  renderer.resize();
  updateRevealStatus();
}

function updateRevealStatus() {
  const phase = revealVisualAt(state.reveal.elapsedMs).phase;
  const labels = { hold: "动物已停止运动。", fade: "动物正在褪色。", symbols: "动物转为本轮模拟的结局符号。",
    skulls: "符号转为视觉隐喻中的骷髅。", dissolve: "图形正在逐个消散。" };
  if (revealStatus.textContent !== labels[phase]) revealStatus.textContent = labels[phase];
}

function showEnding(animationError = false) {
  state.mode = "ending";
  revealHud.hidden = true;
  physicsHud.hidden = true;
  stageOneHud.hidden = true;
  playScreen.inert = true;
  endingScreen.hidden = false;
  document.querySelector("#ending-error").hidden = !animationError;
  resultList.replaceChildren(...FATE_LABELS.map((label, i) => {
    const card = document.createElement("li");
    const title = document.createElement("span"); title.textContent = label;
    const count = document.createElement("strong"); count.textContent = String(state.reveal.counts[i]);
    count.dataset.count = String(state.reveal.counts[i]);
    const percent = document.createElement("small"); percent.textContent = `${(state.reveal.percentages[i] / 10).toFixed(1)}%`;
    card.append(title, count, percent);
    return card;
  }));
  resultSummary.textContent = `未领养 ${state.simulatedFates.length} 只 · 已领养 ${state.stageOneSummary?.adoptedCount ?? 0} 只（不参与模拟）`;
  const actualCounts = FATE_LABELS.map((_, i) => state.physicalOutcomes.filter(item => item.exitIndex === i).length);
  physicalSummary.textContent = `弹珠实际出口记录（仅 ${state.physicalOutcomes.length} 只）：${FATE_LABELS.map((label, i) => `${label} ${actualCounts[i]}`).join(" · ")}。以上整屏结果另行模拟，并非全部经过弹珠装置。`;
  endingScreen.scrollTop = 0;
  endingScreen.focus({ preventScroll: true });
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

    if (state.mode === "active" && !introIsLeaving) {
      state.elapsedMs += dt * 1000;
      updateAnimalAnimations(state.animals, dt);
      updateParticles(state.particles, dt);

      state.density = measureDensity(state.animals);
      // Keep icon size fixed: leave when the screen is full, even before wave six.
      const screenIsFull = isScreenSaturated(state);
      // Adoption or redistribution can open room again during the full-screen hold.
      if (!screenIsFull) state.saturationPendingAt = null;

      if (
        state.saturationPendingAt === null && !screenIsFull &&
        state.pendingBirthAt === null && state.elapsedMs >= state.nextBreedAt &&
        state.elapsedMs >= state.breedingBusyUntil
      ) {
        if (!beginBreedingPulse(state)) state.nextBreedAt = state.elapsedMs + CONFIG.breedIntervalMs;
      }
      if (state.pendingBirthAt !== null && state.elapsedMs >= state.pendingBirthAt) {
        advanceBreedingPulse(state);
      }

      if (state.saturationPendingAt === null && screenIsFull) {
        state.saturationPendingAt = state.elapsedMs + CONFIG.saturationTransitionDelayMs;
      }
      // Let in-flight offspring finish before the stage change so their movement
      // is not cut off by the overlay.
      if (
        state.saturationPendingAt !== null &&
        state.elapsedMs >= state.saturationPendingAt &&
        state.elapsedMs >= state.breedingBusyUntil &&
        state.pendingBirthAt === null &&
        !state.animals.some((animal) => animal.birth && !animal.birth.complete) &&
        (
          isPackingSettled(state.animals, false) ||
          state.elapsedMs >= state.saturationPendingAt + CONFIG.saturationMaxSettleMs
        )
      ) {
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
    state.pendingParents = [];
    state.pendingParentIndex = 0;
    state.pendingBirthAt = null;
    state.breedingBusyUntil = state.elapsedMs;
    state.nextBreedAt = state.elapsedMs + CONFIG.breedIntervalMs;
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
