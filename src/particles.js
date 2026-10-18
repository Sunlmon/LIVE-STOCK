import { CONFIG, COLORS } from "./config.js";
import { getAnimalCenter } from "./animals.js";

export function adoptAnimal(state, index) {
  if (state.mode !== "active" || index < 0 || index >= state.animals.length) return false;

  const [animal] = state.animals.splice(index, 1);
  const center = getAnimalCenter(animal, state.elapsedMs);
  state.adoptedCount += 1;
  emitAdoptionParticles(state.particles, center.x, center.y);
  return true;
}

function emitAdoptionParticles(particles, x, y) {
  const available = Math.max(0, CONFIG.maxParticles - particles.length);
  const count = Math.min(CONFIG.adoptionParticleCount, available);

  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.28;
    const speed = 28 + Math.random() * 68;
    const life = CONFIG.particleLifeMin + Math.random() * (CONFIG.particleLifeMax - CONFIG.particleLifeMin);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1 + Math.random() * 1.3,
      life,
      maxLife: life,
      color: COLORS.ink,
    });
  }
}

export function updateParticles(particles, dt) {
  for (const particle of particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
  }

  let writeIndex = 0;
  for (const particle of particles) {
    if (particle.life <= 0) continue;
    particles[writeIndex] = particle;
    writeIndex += 1;
  }
  particles.length = writeIndex;
}
