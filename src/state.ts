// in-memory session state. deliberately not persisted: a page reload should
// always land you back at the boot sequence and the password lock.
export const session = {
  booted: false,
  unlocked: false,
  // mirrors holotape.settings.instantText so the typewriter doesn't need
  // an async db read on every render
  instantText: false,
};
