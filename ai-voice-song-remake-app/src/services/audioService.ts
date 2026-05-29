/**
 * audioService.ts — Real browser-side speaker detection & separation
 *
 * Pipeline:
 * 1. Decode uploaded audio → AudioBuffer
 * 2. Split into 250ms frames
 * 3. Compute per-frame features: pitch (autocorrelation), RMS energy, spectral centroid
 * 4. Voice Activity Detection — keep only voiced frames
 * 5. K-means clustering on pitch to find distinct speakers
 * 6. Merge consecutive same-speaker frames into segments
 * 7. Generate real WAV blob URLs per speaker
 */

export interface AudioSegment {
  start: number;
  end: number;
}

export interface SpeakerAudio {
  id: string;
  label: string;
  previewUrl: string;
  fullUrl: string;
  duration: number;
  segments: AudioSegment[];
  avgPitch: number;
  confidence: number; // 0-1, how distinct this speaker is from others
}

interface FrameFeatures {
  idx: number;
  startTime: number;
  endTime: number;
  rms: number;
  pitch: number;      // fundamental frequency in Hz (0 if unvoiced)
  centroid: number;   // spectral centroid in Hz
  zcr: number;        // zero-crossing rate
  isVoiced: boolean;
}

let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

/* ============================================================
   1. DECODE
   ============================================================ */
export async function decodeAudioFile(file: File | ArrayBuffer): Promise<AudioBuffer> {
  const ctx = getAudioCtx();
  const arrayBuf = file instanceof File ? await file.arrayBuffer() : file;
  // decodeAudioData consumes the buffer, so clone it first
  return await ctx.decodeAudioData(arrayBuf.slice(0));
}

/* ============================================================
   2. FEATURE EXTRACTION
   ============================================================ */

const FRAME_SIZE_MS = 250;   // 250ms windows
const HOP_SIZE_MS = 125;     // 50% overlap
const MIN_PITCH = 60;        // Hz — lowest male voice
const MAX_PITCH = 400;       // Hz — highest female voice
const RMS_THRESHOLD = 0.015; // below this = silence

/**
 * Extract per-frame features from an AudioBuffer.
 */
function extractFeatures(buffer: AudioBuffer): FrameFeatures[] {
  const sampleRate = buffer.sampleRate;
  const frameSize = Math.floor(sampleRate * FRAME_SIZE_MS / 1000);
  const hopSize = Math.floor(sampleRate * HOP_SIZE_MS / 1000);
  // Use first channel (mono is fine for speaker detection)
  const data = buffer.getChannelData(0);
  const totalFrames = Math.floor((data.length - frameSize) / hopSize) + 1;

  const frames: FrameFeatures[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const start = i * hopSize;
    const end = start + frameSize;
    const frame = data.slice(start, end);

    const rms = computeRMS(frame);
    const pitch = rms > RMS_THRESHOLD ? detectPitch(frame, sampleRate) : 0;
    const centroid = computeSpectralCentroid(frame, sampleRate);
    const zcr = computeZCR(frame);
    const isVoiced = rms > RMS_THRESHOLD && pitch >= MIN_PITCH && pitch <= MAX_PITCH;

    frames.push({
      idx: i,
      startTime: start / sampleRate,
      endTime: end / sampleRate,
      rms,
      pitch,
      centroid,
      zcr,
      isVoiced,
    });
  }

  return frames;
}

/** Root-mean-square energy */
function computeRMS(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}

/**
 * Fundamental frequency via autocorrelation.
 * Uses the normalized autocorrelation method for robust pitch detection.
 */
function detectPitch(frame: Float32Array, sampleRate: number): number {
  const n = frame.length;

  // Remove DC offset
  let mean = 0;
  for (let i = 0; i < n; i++) mean += frame[i];
  mean /= n;

  // Normalized autocorrelation
  const maxLag = Math.floor(sampleRate / MIN_PITCH);
  const minLag = Math.floor(sampleRate / MAX_PITCH);

  // Compute energy for normalization
  let energy = 0;
  for (let i = 0; i < n; i++) energy += (frame[i] - mean) * (frame[i] - mean);
  if (energy < 1e-10) return 0;

  let bestCorr = -1;
  let bestLag = minLag;

  for (let lag = minLag; lag <= Math.min(maxLag, n - 1); lag++) {
    let corr = 0;
    for (let i = 0; i < n - lag; i++) {
      corr += (frame[i] - mean) * (frame[i + lag] - mean);
    }
    corr /= energy; // normalize

    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  // If correlation is too low, it's probably unvoiced
  if (bestCorr < 0.3) return 0;

  // Parabolic interpolation for sub-sample accuracy
  const lag = bestLag;
  if (lag > minLag && lag < maxLag) {
    // Get correlation at lag-1 and lag+1
    let corrM1 = 0, corrP1 = 0;
    for (let i = 0; i < n - (lag - 1); i++) corrM1 += (frame[i] - mean) * (frame[i + lag - 1] - mean);
    for (let i = 0; i < n - (lag + 1); i++) corrP1 += (frame[i] - mean) * (frame[i + lag + 1] - mean);
    corrM1 /= energy;
    corrP1 /= energy;

    const shift = (corrP1 - corrM1) / (2 * (2 * bestCorr - corrM1 - corrP1));
    if (Math.abs(shift) < 1) {
      return sampleRate / (lag + shift);
    }
  }

  return sampleRate / lag;
}

/** Spectral centroid — "brightness" of the sound */
function computeSpectralCentroid(frame: Float32Array, sampleRate: number): number {
  const n = frame.length;
  // Simple DFT magnitude (we only need a rough estimate)
  const numBins = Math.min(256, n);
  let num = 0, den = 0;
  for (let k = 1; k < numBins; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n;
      re += frame[i] * Math.cos(angle);
      im -= frame[i] * Math.sin(angle);
    }
    const mag = Math.sqrt(re * re + im * im);
    const freq = (k * sampleRate) / n;
    num += freq * mag;
    den += mag;
  }
  return den > 0 ? num / den : 0;
}

/** Zero-crossing rate */
function computeZCR(frame: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < frame.length; i++) {
    if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) crossings++;
  }
  return crossings / frame.length;
}

/* ============================================================
   3. CLUSTERING — K-means on pitch
   ============================================================ */

/**
 * Determine optimal number of speakers from pitch distribution.
 * Uses a simple histogram-based approach: find distinct peaks in
 * the pitch histogram of voiced frames.
 */
function estimateNumSpeakers(pitches: number[]): number {
  if (pitches.length < 10) return 1;

  // Build histogram from 60-400 Hz in 20 Hz bins
  const binSize = 20;
  const numBins = Math.ceil((MAX_PITCH - MIN_PITCH) / binSize);
  const histogram = new Float64Array(numBins);

  for (const p of pitches) {
    const bin = Math.floor((p - MIN_PITCH) / binSize);
    if (bin >= 0 && bin < numBins) histogram[bin]++;
  }

  // Smooth histogram
  const smoothed = new Float64Array(numBins);
  for (let i = 0; i < numBins; i++) {
    smoothed[i] = histogram[i];
    if (i > 0) smoothed[i] += histogram[i - 1] * 0.3;
    if (i < numBins - 1) smoothed[i] += histogram[i + 1] * 0.3;
  }

  // Find peaks (local maxima above threshold)
  const maxVal = Math.max(...smoothed);
  const threshold = maxVal * 0.15;
  let peaks = 0;
  for (let i = 1; i < numBins - 1; i++) {
    if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1] && smoothed[i] > threshold) {
      peaks++;
    }
  }

  // Clamp to reasonable range
  return Math.max(1, Math.min(peaks, 5));
}

/**
 * K-means clustering on 1D pitch values.
 * Uses stricter distance thresholds to prevent voice mixing.
 * Returns cluster assignments for each value.
 */
function kMeans1D(values: number[], k: number, maxIter: number = 100): number[] {
  if (values.length === 0) return [];
  if (k === 1) return values.map(() => 0);

  // Initialize centroids using k-means++ style (spread apart)
  const sorted = [...values].sort((a, b) => a - b);
  const centroids: number[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(sorted[Math.floor((i + 0.5) * sorted.length / k)]);
  }

  const assignments = new Int32Array(values.length);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign each value to nearest centroid
    let changed = false;
    for (let i = 0; i < values.length; i++) {
      let bestDist = Infinity, bestK = 0;
      for (let j = 0; j < k; j++) {
        const d = Math.abs(values[i] - centroids[j]);
        if (d < bestDist) { bestDist = d; bestK = j; }
      }
      if (assignments[i] !== bestK) { changed = true; assignments[i] = bestK; }
    }
    if (!changed) break;

    // Update centroids
    const sums = new Float64Array(k);
    const counts = new Int32Array(k);
    for (let i = 0; i < values.length; i++) {
      sums[assignments[i]] += values[i];
      counts[assignments[i]]++;
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) centroids[j] = sums[j] / counts[j];
    }
  }

  // Post-process: reassign borderline cases to ensure clean separation
  // If centroids are too close (< 30 Hz), merge those clusters
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      if (Math.abs(centroids[i] - centroids[j]) < 30) {
        // Merge cluster j into i
        for (let idx = 0; idx < assignments.length; idx++) {
          if (assignments[idx] === j) assignments[idx] = i;
        }
      }
    }
  }

  return Array.from(assignments);
}

/* ============================================================
   4. DIARIZATION — Main pipeline
   ============================================================ */

export function detectSpeakers(buffer: AudioBuffer): { speakers: SpeakerAudio[]; buffer: AudioBuffer } {
  // Step 1: Extract features
  const frames = extractFeatures(buffer);

  // Step 2: Get voiced frames with valid pitch
  const voicedFrames = frames.filter((f) => f.isVoiced && f.pitch > 0);

  if (voicedFrames.length < 5) {
    // Not enough voiced speech — treat as single speaker
    return singleSpeaker(buffer);
  }

  // Step 3: Estimate number of speakers from pitch distribution
  const pitches = voicedFrames.map((f) => f.pitch);
  const numSpeakers = estimateNumSpeakers(pitches);

  // Step 4: Cluster voiced frames by pitch
  const assignments = kMeans1D(pitches, numSpeakers);

  // Step 5: Assign ALL frames (including unvoiced) to nearest speaker
  // For unvoiced frames, assign to the speaker of the nearest voiced frame
  const clusterCentroids: number[] = [];
  for (let k = 0; k < numSpeakers; k++) {
    const clusterPitches = pitches.filter((_, i) => assignments[i] === k);
    clusterCentroids.push(
      clusterPitches.length > 0
        ? clusterPitches.reduce((a, b) => a + b, 0) / clusterPitches.length
        : 0
    );
  }

  // Assign every frame to a speaker
  const frameAssignments: number[] = [];
  for (const frame of frames) {
    if (frame.isVoiced && frame.pitch > 0) {
      // Find nearest centroid
      let bestDist = Infinity, bestK = 0;
      for (let k = 0; k < numSpeakers; k++) {
        const d = Math.abs(frame.pitch - clusterCentroids[k]);
        if (d < bestDist) { bestDist = d; bestK = k; }
      }
      frameAssignments.push(bestK);
    } else {
      // Unvoiced/silent — assign to -1 (no speaker)
      frameAssignments.push(-1);
    }
  }

  // Step 6: Fill gaps — assign short unvoiced gaps to surrounding speaker
  fillGaps(frameAssignments, 4); // fill gaps up to 4 frames (~500ms)

  // Step 7: Merge consecutive same-speaker frames into segments
  const speakerSegments: AudioSegment[][] = Array.from({ length: numSpeakers }, () => []);
  let currentSpeaker = -1;
  let segStart = 0;

  for (let i = 0; i < frames.length; i++) {
    const spk = frameAssignments[i];
    if (spk !== currentSpeaker) {
      if (currentSpeaker >= 0 && segStart < frames[i - 1]?.endTime) {
        speakerSegments[currentSpeaker].push({
          start: segStart,
          end: frames[i - 1].endTime,
        });
      }
      currentSpeaker = spk;
      segStart = frames[i].startTime;
    }
  }
  // Close last segment
  if (currentSpeaker >= 0 && frames.length > 0) {
    speakerSegments[currentSpeaker].push({
      start: segStart,
      end: frames[frames.length - 1].endTime,
    });
  }

  // Step 8: Filter out speakers with too little speech (< 1 second total)
  const validSpeakers: { idx: number; segments: AudioSegment[]; totalDuration: number; avgPitch: number }[] = [];
  for (let k = 0; k < numSpeakers; k++) {
    const segs = speakerSegments[k];
    const totalDur = segs.reduce((s, seg) => s + (seg.end - seg.start), 0);
    if (totalDur >= 1.0) {
      const clusterPitches = pitches.filter((_, i) => assignments[i] === k);
      const avgPitch = clusterPitches.length > 0
        ? clusterPitches.reduce((a, b) => a + b, 0) / clusterPitches.length
        : 0;
      validSpeakers.push({ idx: k, segments: segs, totalDuration: totalDur, avgPitch });
    }
  }

  // If no valid speakers found, fall back to single speaker
  if (validSpeakers.length === 0) return singleSpeaker(buffer);

  // Sort by total duration (most talkative first)
  validSpeakers.sort((a, b) => b.totalDuration - a.totalDuration);

  // Step 9: Generate audio blobs for each speaker
  const speakers: SpeakerAudio[] = [];
  for (let i = 0; i < validSpeakers.length; i++) {
    const vs = validSpeakers[i];
    const fullUrl = combineSegmentsToWavUrl(buffer, vs.segments);

    // Preview: find the longest continuous segment, take 10-15 seconds
    const longestSeg = vs.segments.reduce((best, seg) =>
      (seg.end - seg.start) > (best.end - best.start) ? seg : best
    );
    // Use 10-15 seconds for preview (longer = better voice identification)
    const previewLen = Math.min(longestSeg.end - longestSeg.start, 15);
    const previewStart = longestSeg.start;
    const previewUrl = audioBufferToWavUrl(buffer, previewStart, previewStart + previewLen);

    // Calculate confidence based on pitch distinctiveness and segment continuity
    const otherPitches = validSpeakers
      .filter((_, idx) => idx !== i)
      .map((v) => v.avgPitch);
    const minPitchDiff = otherPitches.length > 0
      ? Math.min(...otherPitches.map((p) => Math.abs(vs.avgPitch - p)))
      : 100;
    const confidence = Math.min(0.99, 0.5 + (minPitchDiff / 100) * 0.4 + (vs.segments.length > 0 ? 0.1 : 0));

    speakers.push({
      id: `sp${i + 1}`,
      label: `Speaker ${i + 1}`,
      previewUrl,
      fullUrl,
      duration: Math.round(vs.totalDuration * 10) / 10,
      segments: vs.segments,
      avgPitch: Math.round(vs.avgPitch),
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  return { speakers, buffer };
}

/**
 * Fill short gaps of unassigned frames (-1) between same-speaker frames.
 */
function fillGaps(assignments: number[], maxGap: number) {
  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i] >= 0) continue;
    // Found a gap — see how long it is
    let gapEnd = i;
    while (gapEnd < assignments.length && assignments[gapEnd] === -1) gapEnd++;
    const gapLen = gapEnd - i;

    if (gapLen <= maxGap) {
      // Check if surrounded by same speaker
      const before = i > 0 ? assignments[i - 1] : -1;
      const after = gapEnd < assignments.length ? assignments[gapEnd] : -1;

      if (before >= 0 && before === after) {
        // Fill with surrounding speaker
        for (let j = i; j < gapEnd; j++) assignments[j] = before;
      } else if (before >= 0) {
        // Fill with previous speaker
        for (let j = i; j < gapEnd; j++) assignments[j] = before;
      } else if (after >= 0) {
        for (let j = i; j < gapEnd; j++) assignments[j] = after;
      }
    }

    i = gapEnd - 1;
  }
}

/** Fallback: treat entire audio as single speaker */
function singleSpeaker(buffer: AudioBuffer): { speakers: SpeakerAudio[]; buffer: AudioBuffer } {
  const dur = buffer.duration;
  const previewEnd = Math.min(15, dur); // 15 sec preview
  return {
    speakers: [{
      id: "sp1",
      label: "Speaker 1",
      previewUrl: audioBufferToWavUrl(buffer, 0, previewEnd),
      fullUrl: audioBufferToWavUrl(buffer, 0, dur),
      duration: Math.round(dur * 10) / 10,
      segments: [{ start: 0, end: dur }],
      avgPitch: 0,
      confidence: 1.0,
    }],
    buffer,
  };
}

/* ============================================================
   5. WAV ENCODING
   ============================================================ */

export function audioBufferToWavUrl(buffer: AudioBuffer, startSec: number, endSec: number): string {
  const ctx = getAudioCtx();
  const length = Math.min(endSec, buffer.duration) - startSec;
  if (length <= 0) return "";

  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const frameCount = Math.floor(length * sampleRate);
  const offline = ctx.createBuffer(channels, frameCount, sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = offline.getChannelData(ch);
    const startFrame = Math.floor(startSec * sampleRate);
    for (let i = 0; i < frameCount; i++) {
      dst[i] = src[startFrame + i] ?? 0;
    }
  }

  const wav = encodeWAV(offline);
  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}

export function combineSegmentsToWavUrl(buffer: AudioBuffer, segments: AudioSegment[]): string {
  const ctx = getAudioCtx();
  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;

  let totalFrames = 0;
  for (const seg of segments) {
    totalFrames += Math.floor((Math.min(seg.end, buffer.duration) - seg.start) * sampleRate);
  }
  if (totalFrames === 0) return "";

  const offline = ctx.createBuffer(channels, totalFrames, sampleRate);
  let writeOffset = 0;

  for (const seg of segments) {
    const startFrame = Math.floor(seg.start * sampleRate);
    const endFrame = Math.floor(Math.min(seg.end, buffer.duration) * sampleRate);
    const segFrames = endFrame - startFrame;
    for (let ch = 0; ch < channels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = offline.getChannelData(ch);
      for (let i = 0; i < segFrames; i++) {
        dst[writeOffset + i] = src[startFrame + i] ?? 0;
      }
    }
    writeOffset += segFrames;
  }

  const wav = encodeWAV(offline);
  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}

function encodeWAV(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const frameCount = buffer.length;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = frameCount * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < frameCount; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return ab;
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

/* ============================================================
   6. CLEANUP
   ============================================================ */
export function revokeSpeakerAudio(speakers: SpeakerAudio[]) {
  for (const sp of speakers) {
    try { URL.revokeObjectURL(sp.previewUrl); } catch {}
    try { URL.revokeObjectURL(sp.fullUrl); } catch {}
  }
}
