import { CONFIG, COLORS } from "./config.js";
import { getAnimalCenter, getAnimalScale } from "./animals.js";

export function createCanvasRenderer(canvas, sprites) {
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!context) throw new Error("当前浏览器无法创建 Canvas 2D 画布");

  const viewport = { width: 1, height: 1, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 };

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
  }

  function render(state) {
    context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    context.fillStyle = COLORS.paper;
    context.fillRect(0, 0, viewport.width, viewport.height);
    context.save();
    context.translate(viewport.offsetX, viewport.offsetY);
    context.scale(viewport.scale, viewport.scale);

    if (state.mode === "active") {
      drawAnimals(state.animals, state.elapsedMs);
      drawParticles(state.particles);
    }

    context.restore();
  }

  function drawAnimals(animals, elapsedMs) {
    const radius = CONFIG.animalDiameter / 2;
    context.lineWidth = 1.25;

    for (const animal of animals) {
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
        context.drawImage(
          image,
          center.x - imageSize / 2,
          center.y - imageSize / 2,
          imageSize,
          imageSize,
        );
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
    return {
      x: (x - viewport.offsetX) / viewport.scale,
      y: (y - viewport.offsetY) / viewport.scale,
    };
  }

  resize();
  return { render, resize, pointerToLogical };
}
