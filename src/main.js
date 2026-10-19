import { CONFIG } from "./config.js";
import { SPECIES, loadAnimalSprites, findAnimalAt, updateAnimalAnimations } from "./animals.js";
import { beginBreedingPulse, advanceBreedingPulse, measureDensity, isScreenSaturated } from "./breeding.js";
import { createCanvasRenderer } from "./canvas-renderer.js";
import { adoptAnimal, updateParticles } from "./particles.js";
import { createState, startRound } from "./state.js";
import { isPackingSettled } from "./packing.js";

const introScreen = document.querySelector("#intro-screen");
const playScreen = document.querySelector("#play-screen");
const canvas = document.querySelector("#animal-canvas");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const placeholder = document.querySelector("#stage-placeholder");
const loadError = document.querySelector("#load-error");
const animalCount = document.querySelector("#animal-count");
const adoptedCount = document.querySelector("#adopted-count");
const densityFill = document.querySelector("#density-fill");
const coverAnimals = document.querySelector("#cover-animals");

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

try {
  sprites = await loadAnimalSprites();
  renderer = createCanvasRenderer(canvas, sprites);
} catch (error) {
  console.error("无法初始化动物画布：", error);
  loadError.hidden = false;
  startButton.disabled = true;
}

startButton.addEventListener("click", beginRound);
restartButton.addEventListener("click", beginRound);
window.addEventListener("resize", () => renderer?.resize());

canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "active" || !renderer) return;
  const point = renderer.pointerToLogical(event.clientX, event.clientY);
  const index = findAnimalAt(state.animals, point.x, point.y, state.elapsedMs);
  if (adoptAnimal(state, index)) updateHud(true);
});

function beginRound() {
  if (!renderer || introIsLeaving) return;
  const fromCover = !introScreen.hidden;
  startRound(state);
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
  placeholder.hidden = true;
  placeholder.classList.remove("is-visible");
  previousFrameAt = 0;
  updateHud(true);
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
        state.mode = "placeholder";
        placeholder.hidden = false;
        placeholder.classList.remove("is-visible");
        requestAnimationFrame(() => placeholder.classList.add("is-visible"));
      }

      if (state.elapsedMs - state.lastHudUpdateAt >= 100) {
        updateHud(true);
      }
    }

    renderer?.render(state);
  } catch (error) {
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
