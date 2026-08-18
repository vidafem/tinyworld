// ==============================================================================
// TINYWORLD - SINTETIZADOR DE SONIDO DE PASO DE PÁGINA (WEB AUDIO API)
// 100% Offline, sin dependencias externas, ultraliviano y con latencia cero.
// ==============================================================================

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isAudioMuted(): boolean {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("tinyworld_album_muted");
    if (saved !== null) {
      isMuted = saved === "true";
    }
  }
  return isMuted;
}

export function setAudioMuted(muted: boolean): void {
  isMuted = muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("tinyworld_album_muted", String(muted));
  }
}

export function toggleAudioMuted(): boolean {
  const next = !isAudioMuted();
  setAudioMuted(next);
  return next;
}

/**
 * Genera y reproduce un sonido natural y cálido de paso de hoja de papel.
 */
export function playPageTurnSound(direction: "forward" | "backward" = "forward"): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generar ruido blanco con modulación suave (fricción de papel)
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const white = Math.random() * 2 - 1;
      // Filtro pasa bajos simple para suavizar el ruido a ruido rosa/marrón
      lastOut = (lastOut + (0.05 * white)) / 1.05;
      // Modulación para textura de roce
      const texture = (Math.random() > 0.96 ? 1.4 : 1.0);
      data[i] = (lastOut * 0.8 + white * 0.2) * texture * (1 - progress * 0.3);
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filtro Paso Banda para timbre de papel fino/seda
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(direction === "forward" ? 1100 : 950, now);
    filter.frequency.exponentialRampToValueAtTime(direction === "forward" ? 650 : 800, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    // Envolvente de Ganancia (ataque rápido, caída suave)
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.025);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Conectar nodos de audio
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sutil capa de baja frecuencia ("woosh" de aire al mover la hoja)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + duration);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    // Si el navegador restringe el audio context, silenciar sin romper la UI
  }
}

/**
 * Sonido de apertura de la portada del libro.
 */
export function playBookOpenSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.35;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.04 * white)) / 1.04;
      data[i] = lastOut;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);
  } catch (err) {}
}
