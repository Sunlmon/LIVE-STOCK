import { CONFIG, COLORS } from "./config.js";
import { getAnimalCenter, getAnimalScale } from "./animals.js";
import { drawPhysicsStage, drawPhysicsDecorations } from "./physics-renderer.js";
import { fitPhysicsViewport, screenPointToPhysics } from "./physics-viewport.js";
import { drawReveal } from "./reveal.js";
import { completionVisualAt } from "./physics-completion.js";

export function createCanvasRenderer(canvas, sprites, { physicsHud } = {}) {
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!context) throw new Error("当前浏览器无法创建 Canvas 2D 画布");

  const viewport = { width: 1, height: 1, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let physicsViewport;

  function fitPhysics() {
    const bounds = canvas.getBoundingClientRect();
    const hudBottom = physicsHud && !physicsHud.hidden ? physicsHud.getBoundingClientRect().bottom - bounds.top : 80;
    physicsViewport = fitPhysicsViewport(viewport.width, viewport.height, hudBottom);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    viewport.width = Math.max(1, bounds.width);
    viewport.height = Math.max(1, bounds.height);
    viewport.dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDevicePixelRatio);
    viewport.scale = Math.min(
      viewport.width / CONFIG.logicalWidth,
      viewport.height / CONFIG.logicalHeight,
    );
    viewport.offsetX = (viewport.width - CONFIG.logicalWidth * viewport.scale) / 2;
    viewport.offsetY = (viewport.height - CONFIG.logicalHeight * viewport.scale) / 2;
    canvas.width = Math.round(viewport.width * viewport.dpr);
    canvas.height = Math.round(viewport.height * viewport.dpr);
    fitPhysics();
  }

  function render(state) {
    context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    context.fillStyle = COLORS.paper;
    context.fillRect(0, 0, viewport.width, viewport.height);
    context.save();
    if (state.mode === "physics" || state.mode === "physics-complete") {
      if (state.physics) {
        if (state.mode === "physics-complete") {
          context.globalAlpha = completionVisualAt(state.physicsCompletion.elapsedMs).machineAlpha;
          if (context.globalAlpha === 0) { context.restore(); return; }
        }
        drawPhysicsDecorations(context, sprites, reducedMotion.matches ? 0 : state.physics.state.elapsedMs, physicsViewport.decorations);
        context.translate(physicsViewport.offsetX, physicsViewport.offsetY);
        context.scale(physicsViewport.scale, physicsViewport.scale);
        drawPhysicsStage(context, state.physics.state, sprites);
      }
      context.restore();
      return;
    }
    context.translate(viewport.offsetX, viewport.offsetY);
    context.scale(viewport.scale, viewport.scale);

    if (state.mode === "active" || state.mode === "finishing" || state.mode === "capacity") {
      drawAnimals(state.animals, state.elapsedMs);
      drawParticles(state.particles);
    } else if (state.mode === "reveal" && state.reveal) {
      drawReveal(context, state.reveal, sprites);
    }

    context.restore();
  }

  function drawAnimals(animals, elapsedMs) {
    const radius = CONFIG.animalDiameter / 2;
    context.lineWidth = 1.25;

    // Render newborns first so a parent remains visible above its overlapping litter.
    for (let pass = 0; pass < 2; pass += 1) {
      for (const animal of animals) {
        const inFlight = animal.birth && !animal.birth.complete;
        if ((pass === 0) !== Boolean(inFlight)) continue;

        const center = getAnimalCenter(animal, elapsedMs);
        const scale = getAnimalScale(animal, elapsedMs);
        const diameter = CONFIG.animalDiameter * scale;
        const scaledRadius = radius * scale;

        context.beginPath();
        context.arc(center.x, center.y, scaledRadius, 0, Math.PI * 2);
        context.fillStyle = COLORS.paper;
        context.fill();
        context.strokeStyle = COLORS.ink;
        context.stroke();

        const image = sprites.get(animal.species);
        if (image?.complete && image.naturalWidth > 0) {
          const imageSize = diameter * 0.76;
          context.save();
          context.beginPath();
          context.arc(center.x, center.y, scaledRadius - 0.5, 0, Math.PI * 2);
          context.clip();
          context.drawImage(
            image,
            center.x - imageSize / 2,
            center.y - imageSize / 2,
            imageSize,
            imageSize,
          );
          context.restore();
          context.globalAlpha = 1;
        }
      }
    }
  }

  function drawParticles(particles) {
    for (const particle of particles) {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = particle.color;
      context.fill();
    }
    context.globalAlpha = 1;
  }

  function pointerToLogical(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    if (canvas.classList.contains("is-physics")) return screenPointToPhysics(physicsViewport, x, y);
    return {
      x: (x - viewport.offsetX) / viewport.scale,
      y: (y - viewport.offsetY) / viewport.scale,
    };
  }

  resize();
  // Hint/control wrapping may change header height without a window resize.
  if (physicsHud && typeof ResizeObserver !== "undefined") new ResizeObserver(fitPhysics).observe(physicsHud);
  return { render, resize, pointerToLogical };
}
