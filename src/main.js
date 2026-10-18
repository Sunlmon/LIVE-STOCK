import { CONFIG } from "./config.js";
import { loadAnimalSprites, findAnimalAt, updateAnimalAnimations } from "./animals.js";
import { beginBreedingPulse, completeBreedingPulse, measureDensity, isScreenSaturated } from "./breeding.js";
import { createCanvasRenderer } from "./canvas-renderer.js";
import { adoptAnimal, updateParticles } from "./particles.js";
import { createState, startRound } from "./state.js";

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

const state = createState();
let sprites = new Map();
let renderer;
let previousFrameAt = 0;

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
  if (!renderer) return;
  startRound(state);
  introScreen.hidden = true;
  playScreen.hidden = false;
  // The canvas lives inside a hidden section during initial loading, so its first
  // measured size is 0×0. Re-measure after revealing the play screen.
  renderer.resize();
  placeholder.hidden = true;
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
  const dt = previousFrameAt === 0 ? 0 : Math.min((timestamp - previousFrameAt) / 1000, 0.05);
  previousFrameAt = timestamp;

  if (state.mode === "active") {
    state.elapsedMs += dt * 1000;
    updateAnimalAnimations(state.animals, dt);
    updateParticles(state.particles, dt);

    if (state.elapsedMs >= state.nextBreedAt) {
      beginBreedingPulse(state);
      state.nextBreedAt = state.elapsedMs + CONFIG.breedIntervalMs;
    }
    if (state.pendingBirthAt !== null && state.elapsedMs >= state.pendingBirthAt) {
      completeBreedingPulse(state);
    }

    state.density = measureDensity(state.animals);
    if (isScreenSaturated(state)) {
      state.mode = "placeholder";
      placeholder.hidden = false;
    }

    if (state.elapsedMs - state.lastHudUpdateAt >= 100) {
      updateHud(true);
    }
  }

  renderer?.render(state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
