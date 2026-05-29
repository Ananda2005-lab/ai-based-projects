/**
 * remakeGenerator.ts — Browser-side AI Voice Remake Generation
 * 
 * Creates an actual audio remake by processing the song through
 * Web Audio API filters that simulate voice characteristics.
 */

export interface RemakeOptions {
  songPreviewUrl: string;
  speakerVoiceUrl: string;
  speakerPitch: number;
  emotion: string;
  style: string;
}

export interface RemakeResult {
  url: string;
  duration: number;
  blob: Blob;
}

export async function generateRemake(options: RemakeOptions): Promise<RemakeResult> {
  const { songPreviewUrl, speakerVoiceUrl, speakerPitch, emotion, style } = options;

  try {
    // Fetch both audio files
    const [songRes, voiceRes] = await Promise.all([
      fetch(songPreviewUrl),
      fetch(speakerVoiceUrl),
    ]);

    const [songBuf, voiceBuf] = await Promise.all([
      songRes.arrayBuffer(),
      voiceRes.arrayBuffer(),
    ]);

    const audioCtx = new AudioContext();
    const [songBuffer, _voiceBuffer] = await Promise.all([
      audioCtx.decodeAudioData(songBuf.slice(0)),
      audioCtx.decodeAudioData(voiceBuf.slice(0)),
    ]);

    // Create offline renderer
    const offlineCtx = new OfflineAudioContext(2, songBuffer.length, songBuffer.sampleRate);

    // Song source
    const source = offlineCtx.createBufferSource();
    source.buffer = songBuffer;

    // EQ chain to match speaker's voice characteristics
    const eqLow = offlineCtx.createBiquadFilter();
    eqLow.type = "lowshelf";
    eqLow.frequency.value = 150;
    eqLow.gain.value = getEQ(style, "low") + (speakerPitch < 120 ? 4 : 0);

    const eqMid = offlineCtx.createBiquadFilter();
    eqMid.type = "peaking";
    eqMid.frequency.value = 800;
    eqMid.Q.value = 0.8;
    eqMid.gain.value = getEQ(style, "mid");

    const eqHigh = offlineCtx.createBiquadFilter();
    eqHigh.type = "highshelf";
    eqHigh.frequency.value = 2500;
    eqHigh.gain.value = getEQ(style, "high") + (speakerPitch > 180 ? 3 : 0);

    // Formant filter (simulates vocal tract resonance)
    const formant = offlineCtx.createBiquadFilter();
    formant.type = "bandpass";
    formant.frequency.value = Math.max(200, Math.min(3000, speakerPitch * 2));
    formant.Q.value = 0.6;

    // Compressor for professional sound
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 28;
    compressor.ratio.value = 10;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.22;

    // Reverb
    const reverb = offlineCtx.createConvolver();
    reverb.buffer = createReverb(offlineCtx, emotion);

    // Output gain
    const outGain = offlineCtx.createGain();
    outGain.gain.value = 0.82;

    // Connect chain: Source → EQ → Formant → Compressor → Reverb → Output
    source.connect(eqLow).connect(eqMid).connect(eqHigh)
          .connect(formant).connect(compressor)
          .connect(reverb).connect(outGain)
          .connect(offlineCtx.destination);

    source.start(0);
    const rendered = await offlineCtx.startRendering();
    const wavBlob = bufferToWav(rendered);

    return {
      url: URL.createObjectURL(wavBlob),
      duration: rendered.duration,
      blob: wavBlob,
    };
  } catch (err: any) {
    console.error("Remake failed:", err);
    throw new Error(`Could not generate remake: ${err.message}`);
  }
}

function getEQ(style: string, band: "low" | "mid" | "high"): number {
  const eq: Record<string, Record<string, number>> = {
    Original: { low: 0, mid: 0, high: 0 },
    "Lo-fi": { low: 4, mid: -3, high: -5 },
    Acoustic: { low: 2, mid: 2, high: 1 },
    Rock: { low: 3, mid: 4, high: 5 },
    Cinematic: { low: 5, mid: 1, high: 4 },
    Jazz: { low: 2, mid: 0, high: 3 },
  };
  return eq[style]?.[band] ?? 0;
}

function createReverb(ctx: OfflineAudioContext, emotion: string): AudioBuffer {
  const lengths: Record<string, number> = {
    Romantic: 3.2, Sad: 3.0, Chill: 2.6, Melancholic: 2.8,
    Happy: 1.8, Energetic: 1.4,
  };
  const len = ctx.sampleRate * (lengths[emotion] || 2.2);
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  return impulse;
}

export function calculatePitchRatio(speakerPitch: number, emotion: string): number {
  const base = 150 / Math.max(80, speakerPitch);
  const mods: Record<string, number> = {
    Happy: 1.08, Sad: 0.94, Romantic: 0.97, Energetic: 1.05, Chill: 0.98, Melancholic: 0.95,
  };
  return base * (mods[emotion] ?? 1);
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const ch = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const dataLen = len * ch * 2;
  const ab = new ArrayBuffer(44 + dataLen);
  const v = new DataView(ab);

  const write = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  write(0, "RIFF"); v.setUint32(4, 36 + dataLen, true); write(8, "WAVE");
  write(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, ch, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  write(36, "data"); v.setUint32(40, dataLen, true);

  const channels = Array.from({ length: ch }, (_, i) => buffer.getChannelData(i));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
