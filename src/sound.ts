// no-op stub for now. every place a sound belongs already calls these,
// so wiring real web audio later is just filling in the bodies.

class SoundManager {
  keypress(): void {}
  boot(): void {}
  denied(): void {}
  granted(): void {}
  lock(): void {}
}

export const sound = new SoundManager();
