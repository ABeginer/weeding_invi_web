/**
 * lib/sfx-foley.ts
 *
 * Studio-grade Web Audio API Procedural Foley Engine cho các mẫu thiệp Standard (159k).
 * - Zero external audio download (0 KB bandwidth trên Mobile 4G)
 * - Khớp từng mili-giây với vũ đạo mở bìa 3 pha Live-Hero Reveal, mở quà VIP & Micro-SFX
 * - Singleton AudioContext, tự dọn node, an toàn tuyệt đối trên iOS Safari & Android Chrome
 */

export type StandardCoverFoleyId =
  | "kowloon-vip-doors"
  | "cinema-clapper-35mm"
  | "cinema-ticket-curtain"
  | "artdeco-grand-doors"
  | "neon-vhs-crt"
  | "lotus-wax-envelope"
  | "crane-fan-harp"
  | "vintage-wax-letter"
  | "amber-secret-letter"
  | "diary-tape-peel-fall";

export type StandardGiftFoleyId =
  | "briefcase-vip"
  | "tin-vhs-retro"
  | "artdeco-box-luxury"
  | "lotus-silk-giftbox"
  | "enamel-crane-casket"
  | "vintage-kraft-gift"
  | "amber-parcel-gift"
  | "diary-kraft-parcel";

export type InteractionSfxId =
  | "scratch-tick"
  | "scratch-reveal"
  | "card-flip"
  | "paper-tear"
  | "paper-rustle"
  | "paper-settle"
  | "vintage-stamp"
  | "polaroid-flip";

let sharedCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;
let sharedPinkBuffer: AudioBuffer | null = null;
let sharedHandcraftCtx: AudioContext | null = null;
let sharedHandcraftBus: AudioNode | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedCtx) {
      sharedCtx = new AudioCtxClass();
    }
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume().catch(() => {});
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 1.6);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  sharedNoiseBuffer = buffer;
  return buffer;
}

function playNoiseBurst(
  ctx: AudioContext,
  startAt: number,
  duration: number,
  opts: {
    filterType?: BiquadFilterType;
    freqStart: number;
    freqEnd?: number;
    q?: number;
    gainPeak: number;
    attack?: number;
  },
): void {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType ?? "bandpass";
  filter.Q.setValueAtTime(opts.q ?? 1.8, startAt);
  filter.frequency.setValueAtTime(Math.max(40, opts.freqStart), startAt);
  if (opts.freqEnd && opts.freqEnd !== opts.freqStart) {
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(40, opts.freqEnd),
      startAt + duration,
    );
  }

  const gain = ctx.createGain();
  const attack = Math.min(opts.attack ?? 0.015, duration * 0.4);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(Math.max(0.001, opts.gainPeak), startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  src.start(startAt);
  src.stop(startAt + duration + 0.02);
}

function playTone(
  ctx: AudioContext,
  startAt: number,
  duration: number,
  opts: {
    type?: OscillatorType;
    freqStart: number;
    freqEnd?: number;
    gainPeak: number;
    attack?: number;
  },
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(Math.max(25, opts.freqStart), startAt);
  if (opts.freqEnd && opts.freqEnd !== opts.freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(25, opts.freqEnd),
      startAt + duration,
    );
  }

  const attack = Math.min(opts.attack ?? 0.012, duration * 0.35);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(Math.max(0.001, opts.gainPeak), startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playChordSwell(
  ctx: AudioContext,
  startAt: number,
  duration: number,
  freqs: number[],
  gainPeak: number,
): void {
  const perVoice = gainPeak / Math.max(1, freqs.length);
  freqs.forEach((freq) => {
    playTone(ctx, startAt, duration, {
      type: "triangle",
      freqStart: freq,
      gainPeak: perVoice,
      attack: duration * 0.28,
    });
  });
}

/* ============================================================
   WARM ACOUSTIC ENGINE — RIÊNG CHO HANDCRAFT "MỘT THỜI ĐỂ NHỚ"
   - Pink Noise (Paul Kellet) mô phỏng chất liệu giấy kraft & dây gai êm tai
   - Warm Wooden Room Bus (LowShelf + Soft LowPass + Room Reverb 1.15s + Compressor)
   ============================================================ */

function getPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (sharedPinkBuffer && sharedPinkBuffer.sampleRate === ctx.sampleRate) {
    return sharedPinkBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 2.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    data[i] = Math.max(-0.98, Math.min(0.98, sample));
  }
  sharedPinkBuffer = buffer;
  return buffer;
}

function createWarmRoomImpulse(ctx: AudioContext): AudioBuffer {
  const durationSec = 1.15;
  const length = Math.floor(ctx.sampleRate * durationSec);
  const ir = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = Math.pow(1 - t, 3.1) * Math.exp(-t * 2.2);
      const raw = (Math.random() * 2 - 1) * decay;
      // Lọc trầm dần theo thời gian để phòng gỗ nhỏ êm dịu, không vang chói
      const coeff = 0.42 - t * 0.3;
      lp += coeff * (raw - lp);
      channelData[i] = lp * 0.55;
    }
  }
  return ir;
}

function getHandcraftBus(ctx: AudioContext): AudioNode {
  if (sharedHandcraftCtx === ctx && sharedHandcraftBus) {
    return sharedHandcraftBus;
  }
  try {
    const inputGain = ctx.createGain();
    inputGain.gain.value = 1.9;

    const warmLowShelf = ctx.createBiquadFilter();
    warmLowShelf.type = "lowshelf";
    warmLowShelf.frequency.value = 240;
    warmLowShelf.gain.value = 2.5;

    const softLowPass = ctx.createBiquadFilter();
    softLowPass.type = "lowpass";
    softLowPass.frequency.value = 5600;
    softLowPass.Q.value = 0.65;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.76;

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.24;

    let masterOut: AudioNode = ctx.destination;
    try {
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.knee.value = 18;
      compressor.ratio.value = 2.5;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.25;
      compressor.connect(ctx.destination);
      masterOut = compressor;
    } catch {
      masterOut = ctx.destination;
    }

    inputGain.connect(warmLowShelf);
    warmLowShelf.connect(softLowPass);
    softLowPass.connect(dryGain);
    dryGain.connect(masterOut);

    try {
      const convolver = ctx.createConvolver();
      convolver.buffer = createWarmRoomImpulse(ctx);
      softLowPass.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(masterOut);
    } catch {
      // Fallback sang dry hoàn toàn nếu thiết bị không hỗ trợ ConvolverNode
    }

    sharedHandcraftCtx = ctx;
    sharedHandcraftBus = inputGain;
    return inputGain;
  } catch {
    return ctx.destination;
  }
}

function connectWithPan(
  ctx: AudioContext,
  node: AudioNode,
  destination: AudioNode,
  pan?: number,
): void {
  if (typeof pan === "number" && Math.abs(pan) > 0.01) {
    try {
      if (typeof ctx.createStereoPanner === "function") {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
        node.connect(panner);
        panner.connect(destination);
        return;
      }
    } catch {
      // Fallback kết nối trực tiếp nếu thiếu StereoPannerNode
    }
  }
  node.connect(destination);
}

function playCraftPaperBrush(
  ctx: AudioContext,
  bus: AudioNode,
  startAt: number,
  duration: number,
  opts: {
    freqStart: number;
    freqEnd: number;
    q?: number;
    lowpassHz?: number;
    peak: number;
    midPeak?: number;
    midRatio?: number;
    attack?: number;
    pan?: number;
  },
): void {
  const safeDur = Math.max(0.03, duration);
  const src = ctx.createBufferSource();
  src.buffer = getPinkNoiseBuffer(ctx);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.Q.setValueAtTime(opts.q ?? 1.25, startAt);
  bandpass.frequency.setValueAtTime(Math.max(60, opts.freqStart), startAt);
  if (opts.freqEnd !== opts.freqStart) {
    bandpass.frequency.exponentialRampToValueAtTime(
      Math.max(60, opts.freqEnd),
      startAt + safeDur,
    );
  }

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(Math.min(3800, opts.lowpassHz ?? 3200), startAt);
  lowpass.Q.setValueAtTime(0.7, startAt);

  const gain = ctx.createGain();
  const safePeak = Math.max(0.002, opts.peak);
  const attackTime = Math.min(opts.attack ?? 0.025, safeDur * 0.35);
  gain.gain.setValueAtTime(0.0001, startAt);

  if (typeof opts.midPeak === "number" && opts.midPeak > 0) {
    const safeMidPeak = Math.max(0.002, opts.midPeak);
    const midAt = startAt + Math.max(attackTime + 0.008, safeDur * (opts.midRatio ?? 0.45));
    const peakAt = startAt + Math.min(safeDur * 0.85, Math.max(midAt + 0.012, safeDur * 0.72));
    gain.gain.linearRampToValueAtTime(safeMidPeak * 0.72, startAt + attackTime);
    gain.gain.linearRampToValueAtTime(safeMidPeak, midAt);
    gain.gain.linearRampToValueAtTime(safePeak, peakAt);
  } else {
    gain.gain.linearRampToValueAtTime(safePeak, startAt + attackTime);
  }

  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + safeDur);

  src.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(gain);
  connectWithPan(ctx, gain, bus, opts.pan);

  src.start(startAt);
  src.stop(startAt + safeDur + 0.03);
}

function playHandcraftPluck(
  ctx: AudioContext,
  bus: AudioNode,
  startAt: number,
  freq: number,
  opts: {
    duration: number;
    gainPeak: number;
    pan?: number;
  },
): void {
  const safeDur = Math.max(0.12, opts.duration);
  const safeFreq = Math.max(60, freq);
  const safeGain = Math.max(0.002, opts.gainPeak);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.setValueAtTime(0.85, startAt);
  filter.frequency.setValueAtTime(Math.min(5400, safeFreq * 3.2), startAt);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(80, safeFreq * 1.15),
    startAt + Math.min(0.18, safeDur * 0.55),
  );

  const voiceGain = ctx.createGain();
  voiceGain.gain.setValueAtTime(0.0001, startAt);
  voiceGain.gain.linearRampToValueAtTime(safeGain, startAt + 0.01);
  voiceGain.gain.exponentialRampToValueAtTime(0.0001, startAt + safeDur);

  const oscTri = ctx.createOscillator();
  oscTri.type = "triangle";
  oscTri.frequency.setValueAtTime(safeFreq, startAt);
  oscTri.detune.setValueAtTime(-3, startAt);

  const oscSine = ctx.createOscillator();
  oscSine.type = "sine";
  oscSine.frequency.setValueAtTime(safeFreq, startAt);
  oscSine.detune.setValueAtTime(3, startAt);

  const triMix = ctx.createGain();
  triMix.gain.value = 0.55;
  const sineMix = ctx.createGain();
  sineMix.gain.value = 0.65;

  oscTri.connect(triMix);
  oscSine.connect(sineMix);
  triMix.connect(filter);
  sineMix.connect(filter);
  filter.connect(voiceGain);
  connectWithPan(ctx, voiceGain, bus, opts.pan);

  oscTri.start(startAt);
  oscSine.start(startAt);
  oscTri.stop(startAt + safeDur + 0.03);
  oscSine.stop(startAt + safeDur + 0.03);

  // Tiếng chạm dây nylon cực khẽ (12ms finger transient)
  playCraftPaperBrush(ctx, bus, startAt, 0.025, {
    freqStart: 1400,
    freqEnd: 950,
    q: 1.5,
    lowpassHz: 2600,
    peak: safeGain * 0.22,
    attack: 0.003,
    pan: opts.pan,
  });
}

function playKalimbaNote(
  ctx: AudioContext,
  bus: AudioNode,
  startAt: number,
  freq: number,
  opts: {
    duration: number;
    gainPeak: number;
    pan?: number;
  },
): void {
  const safeDur = Math.max(0.1, opts.duration);
  const safeFreq = Math.max(80, freq);
  const safeGain = Math.max(0.002, opts.gainPeak);

  // Thân nốt tròn ấm
  const fundOsc = ctx.createOscillator();
  fundOsc.type = "sine";
  fundOsc.frequency.setValueAtTime(safeFreq, startAt);
  const fundGain = ctx.createGain();
  fundGain.gain.setValueAtTime(0.0001, startAt);
  fundGain.gain.linearRampToValueAtTime(safeGain, startAt + 0.007);
  fundGain.gain.exponentialRampToValueAtTime(0.0001, startAt + safeDur);
  fundOsc.connect(fundGain);
  connectWithPan(ctx, fundGain, bus, opts.pan);
  fundOsc.start(startAt);
  fundOsc.stop(startAt + safeDur + 0.03);

  // Họa âm bậc 2 tắt nhanh trong 140ms
  const overOsc = ctx.createOscillator();
  overOsc.type = "sine";
  overOsc.frequency.setValueAtTime(safeFreq * 2, startAt);
  const overGain = ctx.createGain();
  overGain.gain.setValueAtTime(0.0001, startAt);
  overGain.gain.linearRampToValueAtTime(Math.max(0.001, safeGain * 0.14), startAt + 0.004);
  overGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.14);
  overOsc.connect(overGain);
  connectWithPan(ctx, overGain, bus, opts.pan);
  overOsc.start(startAt);
  overOsc.stop(startAt + 0.16);

  // Tiếng gõ đầu ngón tay lên phím gỗ/thép (18ms)
  const tapOsc = ctx.createOscillator();
  tapOsc.type = "triangle";
  tapOsc.frequency.setValueAtTime(Math.min(4800, safeFreq * 2.8), startAt);
  tapOsc.frequency.exponentialRampToValueAtTime(safeFreq, startAt + 0.018);
  const tapGain = ctx.createGain();
  tapGain.gain.setValueAtTime(0.0001, startAt);
  tapGain.gain.linearRampToValueAtTime(Math.max(0.001, safeGain * 0.16), startAt + 0.003);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.032);
  tapOsc.connect(tapGain);
  connectWithPan(ctx, tapGain, bus, opts.pan);
  tapOsc.start(startAt);
  tapOsc.stop(startAt + 0.05);
}

function playBusWoodTone(
  ctx: AudioContext,
  bus: AudioNode,
  startAt: number,
  duration: number,
  opts: {
    type?: OscillatorType;
    freqStart: number;
    freqEnd?: number;
    gainPeak: number;
    attack?: number;
    pan?: number;
  },
): void {
  const safeDur = Math.max(0.025, duration);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(Math.max(30, opts.freqStart), startAt);
  if (opts.freqEnd && opts.freqEnd !== opts.freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, opts.freqEnd),
      startAt + safeDur,
    );
  }
  const atk = Math.min(opts.attack ?? 0.008, safeDur * 0.4);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(Math.max(0.001, opts.gainPeak), startAt + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + safeDur);
  osc.connect(gain);
  connectWithPan(ctx, gain, bus, opts.pan);
  osc.start(startAt);
  osc.stop(startAt + safeDur + 0.03);
}

/* ============================================================
   A. BẢN PHỐI MỞ BÌA 3 PHA ĐỘC BẢN CHO 5 MẪU HONG KONG STANDARD
   ============================================================ */
export function playStandardCoverFoley(id: StandardCoverFoleyId, volume = 0.45): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const v = Math.max(0.05, Math.min(0.85, volume));
  const now = ctx.currentTime;

  try {
    switch (id) {
      case "kowloon-vip-doors": {
        // 0ms (Pha 1): Quân mạt chược ngà voi va lách cách + xoay 3D
        playNoiseBurst(ctx, now, 0.06, {
          filterType: "bandpass",
          freqStart: 2400,
          freqEnd: 1600,
          q: 3.2,
          gainPeak: v * 0.55,
          attack: 0.004,
        });
        playTone(ctx, now + 0.02, 0.09, {
          type: "triangle",
          freqStart: 1950,
          freqEnd: 1420,
          gainPeak: v * 0.25,
          attack: 0.003,
        });
        playNoiseBurst(ctx, now + 0.09, 0.28, {
          filterType: "bandpass",
          freqStart: 900,
          freqEnd: 3200,
          q: 2.2,
          gainPeak: v * 0.22,
          attack: 0.04,
        });

        // 480ms (Pha 2): Chuông thang máy phòng VIP "DING!" đồng thau ấm áp
        playTone(ctx, now + 0.48, 0.65, {
          type: "sine",
          freqStart: 1318.5, // E6
          gainPeak: v * 0.36,
          attack: 0.005,
        });
        playTone(ctx, now + 0.48, 0.45, {
          type: "sine",
          freqStart: 2637.0, // E7 harmonic
          gainPeak: v * 0.14,
          attack: 0.004,
        });

        // 920ms (Pha 3): Hai cánh cửa đồng đen trượt mở trầm hùng + hợp âm vàng ấm
        playNoiseBurst(ctx, now + 0.92, 0.58, {
          filterType: "lowpass",
          freqStart: 240,
          freqEnd: 880,
          q: 1.2,
          gainPeak: v * 0.42,
          attack: 0.08,
        });
        playChordSwell(ctx, now + 0.94, 0.68, [261.63, 329.63, 392.0, 587.33], v * 0.26);
        break;
      }

      case "cinema-clapper-35mm": {
        // 0ms (Pha 1): Clapperboard gỗ sập "CẠP!" sắc gọn + màn trập cơ
        playNoiseBurst(ctx, now, 0.055, {
          filterType: "bandpass",
          freqStart: 1850,
          freqEnd: 950,
          q: 2.4,
          gainPeak: v * 0.72,
          attack: 0.002,
        });
        playTone(ctx, now, 0.07, {
          type: "triangle",
          freqStart: 420,
          freqEnd: 130,
          gainPeak: v * 0.45,
          attack: 0.002,
        });

        // 400ms (Pha 2): Cuộn phim 35mm chạy tách tách + âm trầm Anamorphic Braam
        for (let i = 0; i < 6; i++) {
          playNoiseBurst(ctx, now + 0.4 + i * 0.075, 0.025, {
            filterType: "highpass",
            freqStart: 2600,
            q: 1.5,
            gainPeak: v * 0.16,
            attack: 0.002,
          });
        }
        playTone(ctx, now + 0.42, 0.52, {
          type: "sawtooth",
          freqStart: 65.4, // C2 cinema braam
          freqEnd: 82.4,
          gainPeak: v * 0.18,
          attack: 0.12,
        });

        // 920ms (Pha 3): Màn trập phim tách dọc mượt mà
        playNoiseBurst(ctx, now + 0.92, 0.46, {
          filterType: "bandpass",
          freqStart: 600,
          freqEnd: 2400,
          q: 1.4,
          gainPeak: v * 0.34,
          attack: 0.05,
        });
        playChordSwell(ctx, now + 0.94, 0.55, [293.66, 369.99, 440.0], v * 0.22);
        break;
      }

      case "cinema-ticket-curtain": {
        // 0ms (Pha 1): Xé cuống vé giấy "RẸT!"
        playNoiseBurst(ctx, now, 0.19, {
          filterType: "bandpass",
          freqStart: 2200,
          freqEnd: 4600,
          q: 2.0,
          gainPeak: v * 0.52,
          attack: 0.015,
        });
        // 190ms: Con dấu son đỏ đóng sập "CỘP!"
        playTone(ctx, now + 0.19, 0.14, {
          type: "sine",
          freqStart: 135,
          freqEnd: 42,
          gainPeak: v * 0.62,
          attack: 0.004,
        });
        playNoiseBurst(ctx, now + 0.19, 0.05, {
          filterType: "lowpass",
          freqStart: 750,
          gainPeak: v * 0.36,
          attack: 0.003,
        });

        // 440ms (Pha 2): Máy chiếu phim cổ quay rè nhẹ ấm áp
        for (let i = 0; i < 7; i++) {
          playNoiseBurst(ctx, now + 0.44 + i * 0.065, 0.02, {
            filterType: "bandpass",
            freqStart: 1700,
            q: 3.0,
            gainPeak: v * 0.13,
            attack: 0.002,
          });
        }

        // 920ms (Pha 3): Kéo rèm nhung đỏ sân khấu điện ảnh "XOẠT—" + dây ấm
        playNoiseBurst(ctx, now + 0.92, 0.62, {
          filterType: "bandpass",
          freqStart: 320,
          freqEnd: 1350,
          q: 1.1,
          gainPeak: v * 0.46,
          attack: 0.09,
        });
        playChordSwell(ctx, now + 0.95, 0.65, [220.0, 277.18, 329.63, 440.0], v * 0.25);
        break;
      }

      case "artdeco-grand-doors": {
        // 0ms (Pha 1): Bật cầu dao 2 chùm đèn pha sân khấu "CẠCH—BÙNG!"
        playNoiseBurst(ctx, now, 0.04, {
          filterType: "bandpass",
          freqStart: 1400,
          q: 3.0,
          gainPeak: v * 0.55,
          attack: 0.002,
        });
        playTone(ctx, now + 0.05, 0.38, {
          type: "triangle",
          freqStart: 110,
          freqEnd: 220,
          gainPeak: v * 0.28,
          attack: 0.06,
        });

        // 450ms (Pha 2): Hào quang vàng champagne lấp lánh (Harp glissando)
        const arp = [659.25, 830.61, 987.77, 1318.51, 1661.22];
        arp.forEach((f, idx) => {
          playTone(ctx, now + 0.45 + idx * 0.065, 0.45, {
            type: "sine",
            freqStart: f,
            gainPeak: v * 0.2,
            attack: 0.008,
          });
        });

        // 940ms (Pha 3): Hai cánh cửa đại sảnh Art Deco 3D xoay mở rộng
        playNoiseBurst(ctx, now + 0.94, 0.64, {
          filterType: "lowpass",
          freqStart: 280,
          freqEnd: 1050,
          q: 1.0,
          gainPeak: v * 0.38,
          attack: 0.1,
        });
        playChordSwell(ctx, now + 0.96, 0.72, [329.63, 415.3, 493.88, 659.25], v * 0.28);
        break;
      }

      case "neon-vhs-crt": {
        // 0ms (Pha 1): Bóng đèn Neon tăng áp "ZIZZ—BZZT!" + VHS tracking
        playTone(ctx, now, 0.14, {
          type: "sawtooth",
          freqStart: 120,
          freqEnd: 126,
          gainPeak: v * 0.22,
          attack: 0.01,
        });
        playNoiseBurst(ctx, now + 0.04, 0.28, {
          filterType: "bandpass",
          freqStart: 3600,
          freqEnd: 1800,
          q: 2.8,
          gainPeak: v * 0.34,
          attack: 0.01,
        });

        // 420ms (Pha 2): Đầu máy VHS bấm PLAY "CẠCH-RÈ"
        playNoiseBurst(ctx, now + 0.42, 0.045, {
          filterType: "bandpass",
          freqStart: 1600,
          q: 3.5,
          gainPeak: v * 0.5,
          attack: 0.003,
        });
        playTone(ctx, now + 0.47, 0.35, {
          type: "sine",
          freqStart: 240,
          freqEnd: 460,
          gainPeak: v * 0.18,
          attack: 0.05,
        });

        // 920ms (Pha 3): Tia sáng TV CRT bừng sáng + hợp âm synthwave
        playTone(ctx, now + 0.92, 0.28, {
          type: "sine",
          freqStart: 3200,
          freqEnd: 1100,
          gainPeak: v * 0.18,
          attack: 0.01,
        });
        playChordSwell(ctx, now + 0.94, 0.66, [261.63, 311.13, 392.0, 523.25], v * 0.26);
        break;
      }
      case "lotus-wax-envelope": {
        // 0ms: Tiếng tách con dấu sáp khô giòn gọn
        playNoiseBurst(ctx, now, 0.045, {
          filterType: "bandpass",
          freqStart: 2900,
          freqEnd: 1400,
          q: 3.4,
          gainPeak: v * 0.52,
          attack: 0.002,
        });
        playTone(ctx, now, 0.06, {
          type: "triangle",
          freqStart: 420,
          freqEnd: 180,
          gainPeak: v * 0.24,
          attack: 0.003,
        });

        // 140ms: Tiếng giấy mỹ thuật & nắp phong bì mở lướt nhẹ
        playNoiseBurst(ctx, now + 0.14, 0.34, {
          filterType: "bandpass",
          freqStart: 950,
          freqEnd: 2600,
          q: 1.3,
          gainPeak: v * 0.26,
          attack: 0.04,
        });

        // 300ms: Chuỗi nốt ngũ cung đàn tranh / chuông ngọc thanh tao (D5 - E5 - A5 - D6)
        [587.33, 659.25, 880.0, 1174.66].forEach((freq, idx) => {
          playTone(ctx, now + 0.3 + idx * 0.085, 0.65, {
            type: "sine",
            freqStart: freq,
            gainPeak: v * (0.22 - idx * 0.02),
            attack: 0.006,
          });
          playTone(ctx, now + 0.3 + idx * 0.085, 0.28, {
            type: "triangle",
            freqStart: freq * 2,
            gainPeak: v * 0.06,
            attack: 0.004,
          });
        });
        break;
      }

      case "crane-fan-harp": {
        // 0ms -> 580ms: Tiếng 4 nhịp nan quạt gỗ khép gọn + chốt khép nhẹ
        [0.05, 0.17, 0.30, 0.44].forEach((offset, idx) => {
          playNoiseBurst(ctx, now + offset, 0.045, {
            filterType: "bandpass",
            freqStart: 2450 - idx * 280,
            freqEnd: 1500,
            q: 4.5,
            gainPeak: v * 0.25,
            attack: 0.003,
          });
        });
        playTone(ctx, now + 0.52, 0.09, {
          type: "triangle",
          freqStart: 420,
          freqEnd: 210,
          gainPeak: v * 0.28,
          attack: 0.004,
        });

        // 560ms -> 1680ms: Tiếng gió lụa xoay quạt + chuỗi 10 nốt Đàn Hạc (rải đều khớp 1040->1660ms bung nan)
        playNoiseBurst(ctx, now + 0.58, 0.65, {
          filterType: "bandpass",
          freqStart: 650,
          freqEnd: 2600,
          q: 1.4,
          gainPeak: v * 0.22,
          attack: 0.12,
        });

        const harpNotes = [
          293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99, 880.0, 1174.66,
        ];
        harpNotes.forEach((freq, idx) => {
          const noteStart = now + 0.88 + idx * 0.078;
          const noteDur = idx >= harpNotes.length - 2 ? 1.55 : 1.15;
          playTone(ctx, noteStart, noteDur, {
            type: "triangle",
            freqStart: freq,
            gainPeak: v * 0.24,
            attack: 0.006,
          });
          playTone(ctx, noteStart, 0.6, {
            type: "sine",
            freqStart: freq * 2,
            gainPeak: v * 0.08,
            attack: 0.004,
          });
        });

        // 1820ms -> 2700ms: Hợp âm ngân mở tranh thủy mặc + tiếng lụa cuốn tranh
        playChordSwell(ctx, now + 1.82, 1.05, [293.66, 440.0, 587.33, 739.99], v * 0.26);
        playNoiseBurst(ctx, now + 1.82, 0.6, {
          filterType: "bandpass",
          freqStart: 900,
          freqEnd: 1900,
          q: 1.3,
          gainPeak: v * 0.14,
          attack: 0.06,
        });
        break;
      }

      case "vintage-wax-letter": {
        const bus = getHandcraftBus(ctx);

        // Nhịp 1 (0.00s → 0.72s): 2 nhịp tách dấu sáp ấm giòn + dây gai trượt khẽ + nắp kraft bật mềm
        playCraftPaperBrush(ctx, bus, now, 0.045, {
          freqStart: 1450,
          freqEnd: 720,
          q: 2.1,
          lowpassHz: 2600,
          peak: v * 0.42,
          attack: 0.002,
          pan: -0.06,
        });
        playCraftPaperBrush(ctx, bus, now + 0.022, 0.048, {
          freqStart: 1280,
          freqEnd: 620,
          q: 2.0,
          lowpassHz: 2400,
          peak: v * 0.34,
          attack: 0.002,
          pan: 0.06,
        });
        playBusWoodTone(ctx, bus, now + 0.006, 0.08, {
          type: "triangle",
          freqStart: 135,
          freqEnd: 58,
          gainPeak: v * 0.28,
          attack: 0.002,
        });

        // 0.07s: Dây gai trượt mở khẽ
        playCraftPaperBrush(ctx, bus, now + 0.07, 0.22, {
          freqStart: 750,
          freqEnd: 1450,
          q: 1.35,
          lowpassHz: 2800,
          peak: v * 0.16,
          attack: 0.025,
        });

        // 0.18s: Nắp phong thư kraft mở chậm mềm mại
        playCraftPaperBrush(ctx, bus, now + 0.18, 0.56, {
          freqStart: 380,
          freqEnd: 980,
          q: 1.15,
          lowpassHz: 2400,
          peak: v * 0.2,
          midPeak: v * 0.14,
          attack: 0.07,
        });
        playBusWoodTone(ctx, bus, now + 0.19, 0.14, {
          type: "sine",
          freqStart: 160,
          freqEnd: 85,
          gainPeak: v * 0.07,
          attack: 0.02,
        });

        // Nhịp 2 (0.72s → 2.20s): Tờ giấy thủ công trượt sang trái êm ái kiểu ASMR + 2 nốt Kalimba dạo nhẹ
        playCraftPaperBrush(ctx, bus, now + 0.72, 1.42, {
          freqStart: 360,
          freqEnd: 880,
          q: 1.1,
          lowpassHz: 2600,
          peak: v * 0.18,
          midPeak: v * 0.11,
          attack: 0.16,
          pan: -0.1,
        });
        playCraftPaperBrush(ctx, bus, now + 0.8, 1.15, {
          freqStart: 1250,
          freqEnd: 1850,
          q: 1.4,
          lowpassHz: 3400,
          peak: v * 0.06,
          midPeak: v * 0.04,
          attack: 0.14,
          pan: -0.15,
        });
        playKalimbaNote(ctx, bus, now + 1.05, 293.66, { duration: 0.65, gainPeak: v * 0.09, pan: -0.18 });
        playKalimbaNote(ctx, bus, now + 1.52, 440.0, { duration: 0.68, gainPeak: v * 0.09, pan: 0.18 });

        // Nhịp 3 (2.22s → 3.38s): Rải Guitar dây nylon + Kalimba ấm hòa âm Fmaj9 khi zoom vào Hero
        const handcraftFmaj9 = [
          { freq: 349.23, offset: 0, pan: -0.28 },
          { freq: 440.0, offset: 0.14, pan: -0.16 },
          { freq: 523.25, offset: 0.29, pan: -0.05 },
          { freq: 659.25, offset: 0.45, pan: 0.06 },
          { freq: 783.99, offset: 0.63, pan: 0.18 },
          { freq: 880.0, offset: 0.82, pan: 0.28 },
        ];
        handcraftFmaj9.forEach(({ freq, offset, pan }, idx) => {
          const noteAt = now + 2.22 + offset;
          playHandcraftPluck(ctx, bus, noteAt, freq, {
            duration: 1.05,
            gainPeak: v * (0.2 - idx * 0.01),
            pan,
          });
          if (idx >= 2) {
            playKalimbaNote(ctx, bus, noteAt + 0.012, freq, {
              duration: 0.78,
              gainPeak: v * 0.075,
              pan: -pan * 0.5,
            });
          }
        });

        // Đệm hợp âm gỗ ấm dịu F3 - C4 - E4
        [174.61, 261.63, 329.63].forEach((freq, idx) => {
          playBusWoodTone(ctx, bus, now + 2.3, 1.25, {
            type: "sine",
            freqStart: freq,
            gainPeak: v * 0.065,
            attack: 0.28,
            pan: (idx - 1) * 0.14,
          });
        });
        break;
      }

      case "amber-secret-letter": {
        const bus = getHandcraftBus(ctx);

        // 0.00s & 0.024s: 2 nhịp tách sáp đồng cổ ấm giòn + cộng hưởng gỗ óc chó trầm
        playCraftPaperBrush(ctx, bus, now, 0.044, {
          freqStart: 1320,
          freqEnd: 580,
          q: 2.0,
          lowpassHz: 2400,
          peak: v * 0.44,
          attack: 0.002,
          pan: -0.05,
        });
        playCraftPaperBrush(ctx, bus, now + 0.024, 0.046, {
          freqStart: 1180,
          freqEnd: 520,
          q: 1.9,
          lowpassHz: 2200,
          peak: v * 0.34,
          attack: 0.002,
          pan: 0.05,
        });
        playBusWoodTone(ctx, bus, now + 0.005, 0.095, {
          type: "triangle",
          freqStart: 115,
          freqEnd: 48,
          gainPeak: v * 0.3,
          attack: 0.003,
        });

        // 0.18s → 1.36s: Phong thư nâu dày lướt lên & nắp 3D mở ngược chậm mượt (+10%)
        playCraftPaperBrush(ctx, bus, now + 0.18, 1.05, {
          freqStart: 320,
          freqEnd: 840,
          q: 1.15,
          lowpassHz: 2400,
          peak: v * 0.2,
          midPeak: v * 0.14,
          attack: 0.11,
        });
        playBusWoodTone(ctx, bus, now + 0.2, 0.22, {
          type: "sine",
          freqStart: 148,
          freqEnd: 78,
          gainPeak: v * 0.075,
          attack: 0.025,
        });

        // 1.18s → 2.74s: Ảnh Polaroid lướt êm trên giấy nhung + 2 nốt dạo Đàn Hạc / Felt Piano (D4, A4)
        playCraftPaperBrush(ctx, bus, now + 1.18, 1.38, {
          freqStart: 520,
          freqEnd: 1350,
          q: 1.25,
          lowpassHz: 2900,
          peak: v * 0.17,
          midPeak: v * 0.12,
          attack: 0.16,
          pan: -0.08,
        });
        playCraftPaperBrush(ctx, bus, now + 1.28, 1.12, {
          freqStart: 1350,
          freqEnd: 1650,
          q: 1.5,
          lowpassHz: 3200,
          peak: v * 0.055,
          attack: 0.13,
          pan: 0.08,
        });
        playHandcraftPluck(ctx, bus, now + 1.36, 293.66, {
          duration: 1.15,
          gainPeak: v * 0.11,
          pan: -0.16,
        });
        playHandcraftPluck(ctx, bus, now + 1.84, 440.0, {
          duration: 1.18,
          gainPeak: v * 0.11,
          pan: 0.16,
        });

        // 2.18s → 3.64s: Felt Piano / Harp Châu Âu hòa âm Dmaj9 + Cello ấm dịu D3 - A3
        const amberDmaj9 = [
          { freq: 293.66, offset: 0, pan: -0.25 },
          { freq: 369.99, offset: 0.2, pan: -0.13 },
          { freq: 440.0, offset: 0.41, pan: 0 },
          { freq: 554.37, offset: 0.64, pan: 0.13 },
          { freq: 659.25, offset: 0.9, pan: 0.25 },
        ];
        amberDmaj9.forEach(({ freq, offset, pan }, idx) => {
          const noteAt = now + 2.18 + offset;
          playHandcraftPluck(ctx, bus, noteAt, freq, {
            duration: 1.5,
            gainPeak: v * (0.2 - idx * 0.01),
            pan,
          });
          playKalimbaNote(ctx, bus, noteAt + 0.02, freq, {
            duration: 1.15,
            gainPeak: v * 0.065,
            pan: -pan * 0.45,
          });
        });

        // Đệm Cello ấm siêu dịu (D3 = 146.83Hz, A3 = 220.00Hz)
        [146.83, 220.0].forEach((freq, idx) => {
          playBusWoodTone(ctx, bus, now + 2.26, 1.62, {
            type: "sine",
            freqStart: freq,
            gainPeak: v * 0.085,
            attack: 0.35,
            pan: idx === 0 ? -0.12 : 0.12,
          });
        });
        break;
      }

      case "diary-tape-peel-fall": {
        const bus = getHandcraftBus(ctx);

        // 0.00s → 0.56s: Tiếng tách băng keo Washi bên phải sột soạt giòn dính
        playCraftPaperBrush(ctx, bus, now, 0.54, {
          freqStart: 1750,
          freqEnd: 3400,
          q: 2.2,
          lowpassHz: 4200,
          peak: v * 0.3,
          midPeak: v * 0.24,
          attack: 0.04,
          pan: 0.2,
        });
        [0.08, 0.22, 0.38].forEach((offset, idx) => {
          playCraftPaperBrush(ctx, bus, now + offset, 0.055, {
            freqStart: 2400 + idx * 240,
            freqEnd: 3600,
            q: 2.6,
            lowpassHz: 4600,
            peak: v * 0.22,
            attack: 0.005,
            pan: 0.22,
          });
        });

        // 0.58s: Tiếng "PỰC!" bung nốt băng keo bên trái (snap giòn gọn, nổi nhẹ trên nền)
        playBusWoodTone(ctx, bus, now + 0.58, 0.072, {
          type: "triangle",
          freqStart: 440,
          freqEnd: 115,
          gainPeak: v * 0.42,
          attack: 0.002,
          pan: -0.22,
        });
        playCraftPaperBrush(ctx, bus, now + 0.58, 0.056, {
          freqStart: 2600,
          freqEnd: 1200,
          q: 2.4,
          lowpassHz: 4400,
          peak: v * 0.48,
          attack: 0.002,
          pan: -0.22,
        });

        // 0.78s → 2.35s: 2 lớp gió cuộn stereo êm ái & 2 nhịp giấy phấp phới khi tờ giấy xoay 180°
        playCraftPaperBrush(ctx, bus, now + 0.78, 1.52, {
          freqStart: 240,
          freqEnd: 760,
          q: 1.05,
          lowpassHz: 1900,
          peak: v * 0.2,
          midPeak: v * 0.16,
          attack: 0.22,
          pan: -0.38,
        });
        playCraftPaperBrush(ctx, bus, now + 1.15, 1.18, {
          freqStart: 620,
          freqEnd: 310,
          q: 1.1,
          lowpassHz: 1800,
          peak: v * 0.18,
          midPeak: v * 0.12,
          attack: 0.2,
          pan: 0.36,
        });
        [1.06, 1.68].forEach((offset, idx) => {
          playCraftPaperBrush(ctx, bus, now + offset, 0.32, {
            freqStart: 520 + idx * 140,
            freqEnd: 1100,
            q: 1.4,
            lowpassHz: 2600,
            peak: v * 0.12,
            attack: 0.06,
            pan: idx === 0 ? 0.18 : -0.15,
          });
        });
        break;
      }
    }
  } catch {
    // An toàn tuyệt đối nếu thiết bị chặn AudioContext
  }
}

/* ============================================================
   B. BẢN PHỐI MỞ QUÀ MỪNG VIP ĐỘC BẢN (VALI TIỀN, HỘP THIẾC, ART DECO)
   ============================================================ */
export function playStandardGiftFoley(id: StandardGiftFoleyId, volume = 0.46): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const v = Math.max(0.05, Math.min(0.85, volume));
  const now = ctx.currentTime;

  try {
    switch (id) {
      case "briefcase-vip": {
        // 2 chốt khóa số kim loại bật "TÁCH-TÁCH!" (0ms & 125ms)
        [0, 0.125].forEach((offset) => {
          playNoiseBurst(ctx, now + offset, 0.035, {
            filterType: "bandpass",
            freqStart: 3200,
            freqEnd: 1800,
            q: 4.5,
            gainPeak: v * 0.62,
            attack: 0.002,
          });
          playTone(ctx, now + offset, 0.06, {
            type: "square",
            freqStart: 1450,
            freqEnd: 820,
            gainPeak: v * 0.18,
            attack: 0.002,
          });
        });

        // 280ms: Nắp vali bật mở + tiếng giấy tiền & ánh kim vàng lấp lánh
        playNoiseBurst(ctx, now + 0.28, 0.24, {
          filterType: "bandpass",
          freqStart: 950,
          freqEnd: 2800,
          q: 1.5,
          gainPeak: v * 0.32,
          attack: 0.04,
        });
        [1046.5, 1318.5, 1567.98, 2093.0].forEach((f, idx) => {
          playTone(ctx, now + 0.36 + idx * 0.055, 0.36, {
            type: "sine",
            freqStart: f,
            gainPeak: v * 0.22,
            attack: 0.005,
          });
        });
        break;
      }

      case "tin-vhs-retro": {
        // 0ms: Nắp hộp thiếc / khay VHS bật "PÓP!" kim loại vang nhẹ
        playTone(ctx, now, 0.16, {
          type: "triangle",
          freqStart: 880,
          freqEnd: 520,
          gainPeak: v * 0.36,
          attack: 0.003,
        });
        playNoiseBurst(ctx, now, 0.05, {
          filterType: "bandpass",
          freqStart: 2800,
          q: 3.8,
          gainPeak: v * 0.45,
          attack: 0.002,
        });
        // 220ms: Tiếng bíp điện tử retro 90s dễ thương
        playTone(ctx, now + 0.22, 0.12, {
          type: "sine",
          freqStart: 987.77,
          gainPeak: v * 0.22,
          attack: 0.005,
        });
        playTone(ctx, now + 0.33, 0.24, {
          type: "sine",
          freqStart: 1318.51,
          gainPeak: v * 0.24,
          attack: 0.005,
        });
        break;
      }

      case "artdeco-box-luxury": {
        // 0ms: Chốt khóa đồng hộp trang sức + nắp nhung mở
        playNoiseBurst(ctx, now, 0.04, {
          filterType: "bandpass",
          freqStart: 2600,
          q: 4.0,
          gainPeak: v * 0.44,
          attack: 0.002,
        });
        // 160ms: Chùm chuông pha lê champagne
        [880.0, 1108.73, 1318.51, 1760.0].forEach((f, idx) => {
          playTone(ctx, now + 0.16 + idx * 0.06, 0.42, {
            type: "sine",
            freqStart: f,
            gainPeak: v * 0.22,
            attack: 0.006,
          });
        });
        break;
      }

      case "lotus-silk-giftbox": {
        // 0ms: Tiếng rút dải ruy-băng lụa mềm
        playNoiseBurst(ctx, now, 0.18, {
          filterType: "highpass",
          freqStart: 1800,
          freqEnd: 3200,
          q: 1.4,
          gainPeak: v * 0.22,
          attack: 0.02,
        });
        // 140ms: Tiếng mở nắp hộp giấy cao cấp
        playNoiseBurst(ctx, now + 0.14, 0.16, {
          filterType: "bandpass",
          freqStart: 700,
          freqEnd: 1500,
          q: 1.6,
          gainPeak: v * 0.28,
          attack: 0.015,
        });
        // 220ms: Hợp âm chuông vàng sen ngọc ấm áp (A5 - C#6 - E6)
        [880.0, 1108.73, 1318.51].forEach((f, idx) => {
          playTone(ctx, now + 0.22 + idx * 0.075, 0.52, {
            type: "sine",
            freqStart: f,
            gainPeak: v * 0.24,
            attack: 0.006,
          });
        });
        break;
      }

      case "enamel-crane-casket": {
        // Rương Pháp Lam Lưu Ly: bấm chốt đồng → mở nắp nhung lụa → 4 chuông ngọc lưu ly khớp điệu hạc (F#5-A5-D6-F#6)
        // 0ms: Chốt đồng thau nảy khẽ
        playTone(ctx, now, 0.09, {
          type: "triangle",
          freqStart: 2280,
          freqEnd: 740,
          gainPeak: v * 0.28,
          attack: 0.002,
        });
        playNoiseBurst(ctx, now, 0.05, {
          filterType: "bandpass",
          freqStart: 2600,
          freqEnd: 1100,
          q: 2.2,
          gainPeak: v * 0.22,
        });
        // 70ms: Làn gió lụa khi mở nắp rương
        playNoiseBurst(ctx, now + 0.07, 0.26, {
          filterType: "bandpass",
          freqStart: 580,
          freqEnd: 1580,
          q: 1.35,
          gainPeak: v * 0.2,
        });
        // 155ms: 4 nốt chuông ngọc lưu ly vang thanh (F#5 - A5 - D6 - F#6)
        [739.99, 880.0, 1174.66, 1479.98].forEach((f, idx) => {
          playTone(ctx, now + 0.155 + idx * 0.072, 0.58, {
            type: "sine",
            freqStart: f,
            gainPeak: v * (0.21 - idx * 0.015),
            attack: 0.005,
          });
          playTone(ctx, now + 0.158 + idx * 0.072, 0.34, {
            type: "triangle",
            freqStart: f * 2,
            gainPeak: v * 0.05,
            attack: 0.004,
          });
        });
        break;
      }

      case "vintage-kraft-gift": {
        const bus = getHandcraftBus(ctx);
        // 0ms: Rút dây ruy-băng vải gai mềm bằng Pink Noise
        playCraftPaperBrush(ctx, bus, now, 0.18, {
          freqStart: 700,
          freqEnd: 1550,
          q: 1.25,
          lowpassHz: 2900,
          peak: v * 0.18,
          attack: 0.025,
          pan: -0.08,
        });
        // 120ms: Nhấc nắp hộp carton thủ công + pop gỗ nhỏ
        playCraftPaperBrush(ctx, bus, now + 0.12, 0.18, {
          freqStart: 320,
          freqEnd: 780,
          q: 1.3,
          lowpassHz: 2300,
          peak: v * 0.22,
          attack: 0.022,
          pan: 0.06,
        });
        playBusWoodTone(ctx, bus, now + 0.13, 0.09, {
          type: "triangle",
          freqStart: 150,
          freqEnd: 80,
          gainPeak: v * 0.18,
          attack: 0.005,
        });
        // 200ms: 4 nốt Kalimba gỗ ấm hòa âm Gmaj7 (G4 - B4 - D5 - F#5)
        [392.0, 493.88, 587.33, 739.99].forEach((freq, idx) => {
          playKalimbaNote(ctx, bus, now + 0.2 + idx * 0.085, freq, {
            duration: 0.72,
            gainPeak: v * (0.2 - idx * 0.012),
            pan: -0.18 + idx * 0.12,
          });
        });
        break;
      }

      case "amber-parcel-gift": {
        const bus = getHandcraftBus(ctx);
        // 0ms: Rút dây thừng gai bưu kiện cổ
        playCraftPaperBrush(ctx, bus, now, 0.18, {
          freqStart: 680,
          freqEnd: 1480,
          q: 1.25,
          lowpassHz: 2800,
          peak: v * 0.18,
          attack: 0.025,
          pan: -0.07,
        });
        // 130ms: Nhấc nắp hộp carton nâu trầm + gỗ óc chó nhẹ
        playCraftPaperBrush(ctx, bus, now + 0.13, 0.18, {
          freqStart: 300,
          freqEnd: 740,
          q: 1.3,
          lowpassHz: 2200,
          peak: v * 0.22,
          attack: 0.022,
          pan: 0.07,
        });
        playBusWoodTone(ctx, bus, now + 0.135, 0.09, {
          type: "triangle",
          freqStart: 140,
          freqEnd: 70,
          gainPeak: v * 0.18,
          attack: 0.005,
        });
        // 210ms: 4 nốt Felt Piano / Celesta ấm hòa âm Amaj7 (A4 - C#5 - E5 - G#5)
        [440.0, 554.37, 659.25, 830.61].forEach((freq, idx) => {
          playHandcraftPluck(ctx, bus, now + 0.21 + idx * 0.085, freq, {
            duration: 0.76,
            gainPeak: v * (0.19 - idx * 0.012),
            pan: -0.18 + idx * 0.12,
          });
        });
        break;
      }

      case "diary-kraft-parcel": {
        const bus = getHandcraftBus(ctx);
        // 0.00s: Bóc băng keo / rút dây thừng kraft
        playCraftPaperBrush(ctx, bus, now, 0.16, {
          freqStart: 1200,
          freqEnd: 2600,
          q: 1.6,
          lowpassHz: 3600,
          peak: v * 0.22,
          attack: 0.02,
          pan: -0.06,
        });
        // 0.15s: Mở nắp giấy kraft
        playCraftPaperBrush(ctx, bus, now + 0.15, 0.18, {
          freqStart: 320,
          freqEnd: 780,
          q: 1.3,
          lowpassHz: 2400,
          peak: v * 0.22,
          attack: 0.022,
          pan: 0.06,
        });
        playBusWoodTone(ctx, bus, now + 0.16, 0.09, {
          type: "triangle",
          freqStart: 145,
          freqEnd: 74,
          gainPeak: v * 0.16,
          attack: 0.005,
        });
        // 0.24s: 4 nốt Kalimba / Acoustic ấm hòa âm Cmaj7 (C5 - E5 - G5 - B5)
        [523.25, 659.25, 783.99, 987.77].forEach((freq, idx) => {
          playKalimbaNote(ctx, bus, now + 0.24 + idx * 0.085, freq, {
            duration: 0.76,
            gainPeak: v * (0.2 - idx * 0.012),
            pan: -0.18 + idx * 0.12,
          });
        });
        break;
      }
    }
  } catch {
    // An toàn tuyệt đối
  }
}

/* ============================================================
   C. MICRO-SFX TƯƠNG TÁC ĐỘC BẢN STANDARD (CÀO NHŨ & LẬT BÀI 3D)
   ============================================================ */
export function playInteractionFoley(id: InteractionSfxId, volume = 0.32): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const v = Math.max(0.04, Math.min(0.7, volume));
  const now = ctx.currentTime;

  try {
    switch (id) {
      case "scratch-tick": {
        // Tiếng cào lớp nhũ kim loại sột soạt siêu thật (nhẹ, không chói)
        playNoiseBurst(ctx, now, 0.055, {
          filterType: "bandpass",
          freqStart: 3400 + Math.random() * 900,
          freqEnd: 2400,
          q: 2.6,
          gainPeak: v * 0.28,
          attack: 0.005,
        });
        break;
      }

      case "scratch-reveal": {
        // Tiếng "TING-CHING!" lấp lánh chiến thắng khi mở khóa ngày cưới
        [1046.5, 1318.51, 1567.98, 2093.0].forEach((f, idx) => {
          playTone(ctx, now + idx * 0.055, 0.44, {
            type: "sine",
            freqStart: f,
            gainPeak: v * 0.34,
            attack: 0.004,
          });
        });
        break;
      }

      case "card-flip": {
        // Tiếng vút lá bài Tây "PHẠT!" sắc gọn khi lật thẻ 3D K♥/Q♥
        playNoiseBurst(ctx, now, 0.11, {
          filterType: "bandpass",
          freqStart: 1400,
          freqEnd: 4200,
          q: 1.8,
          gainPeak: v * 0.52,
          attack: 0.006,
        });
        playTone(ctx, now + 0.015, 0.06, {
          type: "triangle",
          freqStart: 520,
          freqEnd: 240,
          gainPeak: v * 0.22,
          attack: 0.003,
        });
        break;
      }

      case "paper-tear": {
        const bus = getHandcraftBus(ctx);
        // Thân giấy rách trầm ấm, không rít dải cao (~320ms)
        playCraftPaperBrush(ctx, bus, now, 0.32, {
          freqStart: 950,
          freqEnd: 2450,
          q: 1.3,
          lowpassHz: 3400,
          peak: v * 0.38,
          midPeak: v * 0.26,
          attack: 0.012,
        });
        // 5 hạt sợi giấy đứt li ti tự nhiên
        const fiberOffsets = [0.035, 0.088, 0.145, 0.198, 0.248];
        fiberOffsets.forEach((offset, idx) => {
          playCraftPaperBrush(ctx, bus, now + offset, 0.042, {
            freqStart: 1600 + idx * 240,
            freqEnd: 2900,
            q: 2.0,
            lowpassHz: 3600,
            peak: v * (0.22 - idx * 0.018),
            attack: 0.004,
            pan: -0.1 + idx * 0.05,
          });
        });
        // Bứt gọn mềm ở cuối đường xé
        playBusWoodTone(ctx, bus, now + 0.26, 0.06, {
          type: "triangle",
          freqStart: 480,
          freqEnd: 190,
          gainPeak: v * 0.14,
          attack: 0.003,
        });
        break;
      }

      case "paper-rustle": {
        const bus = getHandcraftBus(ctx);
        playCraftPaperBrush(ctx, bus, now, 0.095, {
          freqStart: 620 + Math.random() * 140,
          freqEnd: 1350,
          q: 1.2,
          lowpassHz: 2500,
          peak: v * 0.18,
          attack: 0.015,
        });
        break;
      }

      case "paper-settle": {
        const bus = getHandcraftBus(ctx);
        playCraftPaperBrush(ctx, bus, now, 0.12, {
          freqStart: 820,
          freqEnd: 320,
          q: 0.9,
          lowpassHz: 1400,
          peak: v * 0.22,
          attack: 0.01,
        });
        playBusWoodTone(ctx, bus, now + 0.01, 0.075, {
          type: "sine",
          freqStart: 180,
          freqEnd: 85,
          gainPeak: v * 0.15,
          attack: 0.004,
        });
        break;
      }

      case "vintage-stamp": {
        const bus = getHandcraftBus(ctx);
        // Con dấu mộc gỗ đệm cao su "bộp!" trầm ấm trên mặt giấy
        playBusWoodTone(ctx, bus, now, 0.105, {
          type: "triangle",
          freqStart: 165,
          freqEnd: 58,
          gainPeak: v * 0.56,
          attack: 0.002,
        });
        playCraftPaperBrush(ctx, bus, now, 0.045, {
          freqStart: 680,
          freqEnd: 280,
          q: 1.1,
          lowpassHz: 1500,
          peak: v * 0.32,
          attack: 0.002,
        });
        break;
      }

      case "polaroid-flip": {
        const bus = getHandcraftBus(ctx);
        // Lật thẻ ảnh Polaroid giấy mờ cứng (~135ms)
        playCraftPaperBrush(ctx, bus, now, 0.135, {
          freqStart: 560,
          freqEnd: 1750,
          q: 1.35,
          lowpassHz: 2900,
          peak: v * 0.34,
          attack: 0.01,
        });
        playBusWoodTone(ctx, bus, now + 0.022, 0.068, {
          type: "triangle",
          freqStart: 290,
          freqEnd: 135,
          gainPeak: v * 0.16,
          attack: 0.003,
        });
        break;
      }
    }
  } catch {
    // An toàn tuyệt đối
  }
}
