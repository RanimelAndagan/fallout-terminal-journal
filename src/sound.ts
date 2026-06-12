// web audio backed by wavs extracted from the user's own fallout 3 install
// (docs/sounds.md has the mapping and the extraction command). public/sounds
// is gitignored, so every file is optional: a missing one just means that cue
// stays silent and the app behaves exactly like the old no-op stub.

const KEY_VARIANTS = 8;

const FILES: Record<string, string> = {
  scroll: "ui_hacking_charscroll_lp.wav",
  hum: "ui_hacking_fanhum_lp.wav",
  granted: "ui_hacking_passgood.wav",
  denied: "ui_hacking_passbad.wav",
  boot: "obj_computerterminal_forward.wav",
  lock: "obj_computerterminal_powerdown.wav",
  tapein: "ui_pipboy_holotape_start.wav",
  tapeout: "ui_pipboy_holotape_stop.wav",
};
for (let i = 1; i <= KEY_VARIANTS; i++) {
  FILES[`key${i}`] = `ui_hacking_charsingle_0${i}.wav`;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private scrollSrc: AudioBufferSourceNode | null = null;
  private scrollTimer = 0;
  private humSrc: AudioBufferSourceNode | null = null;

  constructor() {
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);

    // browsers keep a fresh context suspended until a user gesture
    const resume = () => void this.ctx?.resume();
    window.addEventListener("keydown", resume, { once: true, capture: true });
    window.addEventListener("pointerdown", resume, { once: true, capture: true });

    for (const [key, file] of Object.entries(FILES)) void this.load(key, file);
  }

  private async load(key: string, file: string): Promise<void> {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sounds/${file}`);
      if (!res.ok) return;
      const data = await res.arrayBuffer();
      this.buffers.set(key, await this.ctx!.decodeAudioData(data));
    } catch {
      // optional file, stay silent
    }
  }

  private node(key: string, gain: number, loop: boolean): AudioBufferSourceNode | null {
    const buf = this.buffers.get(key);
    if (!buf || !this.ctx || !this.master) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(this.master);
    return src;
  }

  private play(key: string, gain = 1): void {
    // a suspended context queues sounds and dumps them all on the first
    // gesture, so drop one-shots until it's running (loops are fine to queue)
    if (this.ctx?.state !== "running") {
      void this.ctx?.resume();
      return;
    }
    this.node(key, gain, false)?.start();
  }

  // one of the game's eight hacking-keyboard clicks, picked at random
  keypress(): void {
    this.play(`key${1 + Math.floor(Math.random() * KEY_VARIANTS)}`);
  }

  // the typewriter calls this once per printed character. the game doesn't
  // click per character, it loops one scroll sound while text prints, so keep
  // a loop alive and let it die shortly after the calls stop coming
  scroll(): void {
    if (!this.scrollSrc) {
      this.scrollSrc = this.node("scroll", 0.7, true);
      this.scrollSrc?.start();
    }
    clearTimeout(this.scrollTimer);
    this.scrollTimer = window.setTimeout(() => {
      this.scrollSrc?.stop();
      this.scrollSrc = null;
    }, 90);
  }

  // the quiet fan/electronics loop the game plays over the hacking screen
  humStart(): void {
    if (this.humSrc) return;
    this.humSrc = this.node("hum", 0.25, true);
    this.humSrc?.start();
  }

  humStop(): void {
    this.humSrc?.stop();
    this.humSrc = null;
  }

  boot(): void {
    this.play("boot");
  }

  granted(): void {
    this.play("granted");
  }

  denied(): void {
    this.play("denied");
  }

  lock(): void {
    this.humStop();
    this.play("lock");
  }

  tapeInsert(): void {
    this.play("tapein");
  }

  tapeEject(): void {
    this.play("tapeout");
  }
}

export const sound = new SoundManager();
