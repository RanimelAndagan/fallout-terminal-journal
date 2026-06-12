// procedural stand-ins for the fallout sound effects. real files always win;
// these only fill the gaps if a wav in public/sounds fails to load, which is
// why the keys here mirror the FILES map in sound.ts exactly.

// deterministic noise so the same cue sounds identical every session
function makeNoise(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff - 0.5;
  };
}

function buffer(
  ctx: AudioContext,
  seconds: number,
  fill: (t: number) => number,
): AudioBuffer {
  const rate = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.max(1, Math.round(seconds * rate)), rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = fill(i / rate);
  return buf;
}

const TAU = Math.PI * 2;

// short mechanical keyboard click, one of eight pitched variants
function click(ctx: AudioContext, variant: number): AudioBuffer {
  const noise = makeNoise(variant * 7919);
  const f = 1100 + variant * 160;
  return buffer(ctx, 0.05, (t) => {
    const env = Math.exp(-t * 120);
    return (Math.sin(TAU * f * t) * 0.4 + noise() * 0.9) * env * 0.6;
  });
}

// loopable burst of ticks for the typewriter char-scroll
function scrollLoop(ctx: AudioContext): AudioBuffer {
  const noise = makeNoise(42);
  const ticks = [0, 0.03, 0.06];
  return buffer(ctx, 0.09, (t) => {
    let v = 0;
    for (const tk of ticks) {
      if (t >= tk) v += noise() * Math.exp(-(t - tk) * 420);
    }
    return v * 0.5;
  });
}

// purely periodic so the 1-second loop point is seamless
function hum(ctx: AudioContext): AudioBuffer {
  return buffer(
    ctx,
    1,
    (t) =>
      (Math.sin(TAU * 60 * t) * 0.5 +
        Math.sin(TAU * 120 * t) * 0.25 +
        Math.sin(TAU * 180 * t) * 0.12) *
      0.5,
  );
}

// two ascending beeps, the "access granted" chirp
function granted(ctx: AudioContext): AudioBuffer {
  return buffer(ctx, 0.35, (t) => {
    let v = 0;
    if (t < 0.12) v = Math.sin(TAU * 990 * t) * Math.exp(-t * 18);
    if (t >= 0.15) v += Math.sin(TAU * 1320 * t) * Math.exp(-(t - 0.15) * 12);
    return v * 0.5;
  });
}

// low flat buzz, the "access denied" raspberry
function denied(ctx: AudioContext): AudioBuffer {
  return buffer(ctx, 0.4, (t) => {
    const sq = Math.tanh(Math.sin(TAU * 130 * t) * 5);
    return sq * Math.exp(-t * 6) * 0.4;
  });
}

// rising sweep with a thunk at the front: terminal powering on
function boot(ctx: AudioContext): AudioBuffer {
  const noise = makeNoise(7);
  return buffer(ctx, 0.5, (t) => {
    const sweep = Math.sin(TAU * (150 * t + 750 * t * t));
    const env = Math.min(t * 60, 1) * Math.exp(-t * 2.5);
    const thunk = noise() * Math.exp(-t * 220);
    return (sweep * env + thunk) * 0.5;
  });
}

// falling sweep: terminal powering down / locking out
function lock(ctx: AudioContext): AudioBuffer {
  return buffer(ctx, 0.6, (t) => {
    const sweep = Math.sin(TAU * (700 * t - 516 * t * t));
    return sweep * Math.exp(-t * 4) * 0.5;
  });
}

// mechanical clunk plus a latch click for the holotape drive
function tape(ctx: AudioContext, freq: number, seed: number): AudioBuffer {
  const noise = makeNoise(seed);
  return buffer(ctx, 0.14, (t) => {
    let v = Math.sin(TAU * freq * t) * Math.exp(-t * 55) * 0.6 + noise() * 0.5 * Math.exp(-t * 160);
    if (t >= 0.07) v += noise() * Math.exp(-(t - 0.07) * 320) * 0.7;
    return v * 0.7;
  });
}

export function synthesize(key: string, ctx: AudioContext): AudioBuffer {
  const m = /^key(\d)$/.exec(key);
  if (m) return click(ctx, Number(m[1]));
  switch (key) {
    case "scroll":
      return scrollLoop(ctx);
    case "hum":
      return hum(ctx);
    case "granted":
      return granted(ctx);
    case "denied":
      return denied(ctx);
    case "boot":
      return boot(ctx);
    case "lock":
      return lock(ctx);
    case "tapein":
      return tape(ctx, 180, 11);
    case "tapeout":
      return tape(ctx, 140, 13);
    default:
      // unknown cue: a tiny silent buffer keeps callers uniform
      return ctx.createBuffer(1, 1, ctx.sampleRate);
  }
}
