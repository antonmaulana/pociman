import math
import struct
import wave
import subprocess
import os

SAMPLE_RATE = 44100

def generate_silence(duration):
    return [0.0] * int(SAMPLE_RATE * duration)

def generate_crickets(duration):
    samples = []
    total = int(SAMPLE_RATE * duration)
    for i in range(total):
        t = i / SAMPLE_RATE
        # intermittent chirp
        burst = math.sin(2 * math.pi * 3.5 * t)
        if burst > 0.4:
            s = math.sin(2 * math.pi * 4800 * t) * 0.08 + math.sin(2 * math.pi * 5200 * t) * 0.05
        else:
            s = 0.0
        samples.append(s)
    return samples

def generate_koplo_beat(duration):
    samples = [0.0] * int(SAMPLE_RATE * duration)
    bpm = 138
    beat_dur = 60.0 / bpm
    total_beats = int(duration / beat_dur)

    # Patterns for kendang koplo (Dut, Tak, Tung, Plak)
    # Bass melody (C - G - Am - F)
    bass_freqs = [65.4, 65.4, 49.0, 49.0, 55.0, 55.0, 43.6, 43.6]
    melody_notes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.00]

    for b in range(total_beats):
        b_time = b * beat_dur
        b_idx = int(b_time * SAMPLE_RATE)
        pattern = b % 4

        # Tambourine / Shaker on 16th notes
        for sixteenth in range(4):
            sub_time = b_time + sixteenth * (beat_dur / 4)
            sub_idx = int(sub_time * SAMPLE_RATE)
            for j in range(int(0.04 * SAMPLE_RATE)):
                idx = sub_idx + j
                if idx < len(samples):
                    decay = math.exp(-j / (0.012 * SAMPLE_RATE))
                    noise = (hash(idx) % 200 - 100) / 100.0 * 0.08 * decay
                    samples[idx] += noise

        # Kendang Tak (sharp slap) on beat 1 and 3
        if pattern in [0, 2]:
            for j in range(int(0.08 * SAMPLE_RATE)):
                idx = b_idx + j
                if idx < len(samples):
                    decay = math.exp(-j / (0.018 * SAMPLE_RATE))
                    samples[idx] += math.sin(2 * math.pi * 850 * (j / SAMPLE_RATE)) * 0.35 * decay

        # Kendang Dut (deep resonant bass kick) on offbeats
        if pattern in [1, 3]:
            for j in range(int(0.25 * SAMPLE_RATE)):
                idx = b_idx + j
                if idx < len(samples):
                    decay = math.exp(-j / (0.07 * SAMPLE_RATE))
                    f = 110 - (j / (0.25 * SAMPLE_RATE)) * 45
                    samples[idx] += math.sin(2 * math.pi * f * (j / SAMPLE_RATE)) * 0.6 * decay

        # Bass synth
        bf = bass_freqs[b % len(bass_freqs)]
        for j in range(int(beat_dur * 0.8 * SAMPLE_RATE)):
            idx = b_idx + j
            if idx < len(samples):
                decay = math.exp(-j / (beat_dur * 0.5 * SAMPLE_RATE))
                samples[idx] += math.sin(2 * math.pi * bf * (j / SAMPLE_RATE)) * 0.3 * decay

        # Lead melody (cheerful bouncy sound)
        mf = melody_notes[b % len(melody_notes)]
        for j in range(int(beat_dur * 0.45 * SAMPLE_RATE)):
            idx = b_idx + j
            if idx < len(samples):
                decay = math.exp(-j / (beat_dur * 0.3 * SAMPLE_RATE))
                # Sawtooth-like blend
                s = math.sin(2 * math.pi * mf * (j / SAMPLE_RATE)) * 0.22 + \
                    math.sin(2 * math.pi * mf * 2 * (j / SAMPLE_RATE)) * 0.12
                samples[idx] += s * decay

    return samples

print("Audio generator module defined")
