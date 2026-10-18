import math
import struct
import wave
import subprocess
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
FPS = 30
DURATION = 14.0
SPLIT = 6.5  # scene 1 (pos ronda) -> scene 2 (TPU)
TOTAL_FRAMES = int(FPS * DURATION)
SAMPLE_RATE = 44100

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
FRAMES_DIR = os.path.join(SCRIPT_DIR, "frames")
OUT_MP4 = os.path.join(PROJECT_DIR, "ending.mp4")
OUT_WEBM = os.path.join(PROJECT_DIR, "ending.webm")

def get_font(size, bold=True):
    try:
        path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

FONT_TITLE = get_font(28, True)
FONT_BUBBLE = get_font(20, True)
FONT_BUBBLE_SUB = get_font(15, False)
FONT_BANNER = get_font(26, True)
FONT_SUB_BANNER = get_font(16, True)
FONT_LABEL = get_font(13, True)

# --- 1. Audio Builder ---
# (start, duration, text, base pitch Hz, shimmer) - must match the bubbles in render_scene_*
LINES = [
    (0.4, 3.2, "Waduh, napas gue abis! Pocong zaman now larinya kayak atlet.", 150, 0.0),
    (SPLIT - 2.8, 2.7, "Ngopi dulu, Pak. Pisang gorengnya jangan dihabisin.", 210, 0.0),
    (SPLIT + 0.3, 3.1, "Makasih udah diajak senam malam. Tarik sis!", 430, 0.0),
    (SPLIT + 3.5, 3.4, "Besok malam main ke sini lagi ya, Mas Poci.", 520, 0.6),
]

def add_talk(master, start, dur, text, base, shimmer):
    step = dur / len(text)
    blip = min(0.055, step * 0.85)
    for i, ch in enumerate(text):
        if not ch.isalpha():
            continue
        freq = base * (1 + ((ord(ch.lower()) * 7) % 9 - 4) * 0.045)
        i0 = int((start + i * step) * SAMPLE_RATE)
        for j in range(int(blip * SAMPLE_RATE)):
            idx = i0 + j
            if idx >= len(master):
                break
            t = j / SAMPLE_RATE
            env = min(1.0, t / 0.006) * math.exp(-t / (blip * 0.55))
            f = freq * (1 + shimmer * 0.03 * math.sin(2 * math.pi * 9 * t))
            wave_v = math.sin(2 * math.pi * f * t) + 0.35 * math.sin(2 * math.pi * f * 2 * t) + 0.15 * math.sin(2 * math.pi * f * 3 * t)
            master[idx] += wave_v * 0.2 * env

def build_master_audio():
    print("Building master audio track...")
    audio_dur = DURATION
    total_samples = int(SAMPLE_RATE * audio_dur)
    master = [0.0] * total_samples

    # Crickets in Scene 1
    for i in range(int(SAMPLE_RATE * SPLIT)):
        t = i / SAMPLE_RATE
        chirp = math.sin(2 * math.pi * 3.5 * t)
        if chirp > 0.45:
            master[i] += (math.sin(2 * math.pi * 4800 * t) * 0.05 + math.sin(2 * math.pi * 5200 * t) * 0.03)

    # Koplo beat in Scene 2
    bpm = 138
    beat_dur = 60.0 / bpm
    koplo_start = SPLIT - 0.1
    koplo_beats = int((audio_dur - koplo_start) / beat_dur)
    bass_freqs = [65.4, 65.4, 49.0, 49.0, 55.0, 55.0, 43.6, 43.6]
    melody_notes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.00]

    for b in range(koplo_beats):
        b_time = koplo_start + b * beat_dur
        b_idx = int(b_time * SAMPLE_RATE)
        pattern = b % 4

        # Shaker / Tambourine on 16ths
        for s in range(4):
            sub_idx = int((b_time + s * (beat_dur / 4)) * SAMPLE_RATE)
            for j in range(int(0.035 * SAMPLE_RATE)):
                idx = sub_idx + j
                if idx < len(master):
                    decay = math.exp(-j / (0.01 * SAMPLE_RATE))
                    master[idx] += ((hash(idx) % 200 - 100) / 100.0) * 0.06 * decay

        # Tak (crisp rim slap) on beats 1 and 3
        if pattern in [0, 2]:
            for j in range(int(0.07 * SAMPLE_RATE)):
                idx = b_idx + j
                if idx < len(master):
                    decay = math.exp(-j / (0.015 * SAMPLE_RATE))
                    master[idx] += math.sin(2 * math.pi * 900 * (j / SAMPLE_RATE)) * 0.3 * decay

        # Dut (resonant bass drop) on beats 2 and 4
        if pattern in [1, 3]:
            for j in range(int(0.24 * SAMPLE_RATE)):
                idx = b_idx + j
                if idx < len(master):
                    decay = math.exp(-j / (0.06 * SAMPLE_RATE))
                    f = 115 - (j / (0.24 * SAMPLE_RATE)) * 50
                    master[idx] += math.sin(2 * math.pi * f * (j / SAMPLE_RATE)) * 0.5 * decay

        # Bass Synth
        bf = bass_freqs[b % len(bass_freqs)]
        for j in range(int(beat_dur * 0.75 * SAMPLE_RATE)):
            idx = b_idx + j
            if idx < len(master):
                decay = math.exp(-j / (beat_dur * 0.45 * SAMPLE_RATE))
                master[idx] += math.sin(2 * math.pi * bf * (j / SAMPLE_RATE)) * 0.25 * decay

        # Cheerful Dangdut Lead Riff
        mf = melody_notes[b % len(melody_notes)]
        for j in range(int(beat_dur * 0.45 * SAMPLE_RATE)):
            idx = b_idx + j
            if idx < len(master):
                decay = math.exp(-j / (beat_dur * 0.28 * SAMPLE_RATE))
                master[idx] += (math.sin(2 * math.pi * mf * (j / SAMPLE_RATE)) * 0.18 +
                                math.sin(2 * math.pi * mf * 2 * (j / SAMPLE_RATE)) * 0.09) * decay

    # Talk blips: one short tone per letter, synced to each speech bubble
    for start, dur, text, base, shimmer in LINES:
        add_talk(master, start, dur, text, base, shimmer)

    # Fade in/out + peak limit
    peak = max(1e-9, max(abs(x) for x in master))
    gain = min(1.0, 0.9 / peak)
    fade_in, fade_out = int(0.5 * SAMPLE_RATE), int(0.9 * SAMPLE_RATE)
    for i in range(total_samples):
        g = gain
        if i < fade_in:
            g *= i / fade_in
        elif i > total_samples - fade_out:
            g *= (total_samples - i) / fade_out
        master[i] *= g

    master_wav = os.path.join(SCRIPT_DIR, "master_audio.wav")
    with wave.open(master_wav, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(b''.join(struct.pack('<h', int(max(-1.0, min(1.0, x)) * 32767)) for x in master))
    print("Master audio created:", master_wav)
    return master_wav

# --- 2. Frame Drawing Utilities ---
def draw_speech_bubble(draw, x, y, title, text, tail_pos="bottom"):
    b_title = draw.textbbox((0, 0), title, font=FONT_BUBBLE_SUB)
    b_text = draw.textbbox((0, 0), text, font=FONT_BUBBLE)
    tw = max(b_title[2] - b_title[0], b_text[2] - b_text[0])
    th = (b_title[3] - b_title[1]) + (b_text[3] - b_text[1]) + 8
    pad_x, pad_y = 18, 12

    rx = x - tw // 2
    rx = max(pad_x + 8, min(rx, W - tw - pad_x - 8))
    ry = y - th - pad_y * 2
    # Shadow
    draw.rounded_rectangle([rx - pad_x + 4, ry - pad_y + 4, rx + tw + pad_x + 4, ry + th + pad_y + 4], radius=14, fill="#0f172a")
    # Main bubble
    draw.rounded_rectangle([rx - pad_x, ry - pad_y, rx + tw + pad_x, ry + th + pad_y], radius=14, fill="#ffffff", outline="#facc15", width=3)
    # Tail
    if tail_pos == "bottom":
        draw.polygon([(x - 10, ry + th + pad_y), (x + 10, ry + th + pad_y), (x, ry + th + pad_y + 14)], fill="#ffffff", outline="#facc15")
        draw.line([(x - 8, ry + th + pad_y), (x + 8, ry + th + pad_y)], fill="#ffffff", width=4)
    # Title & Text
    draw.text((rx, ry), title, font=FONT_BUBBLE_SUB, fill="#b45309")
    draw.text((rx, ry + (b_title[3] - b_title[1]) + 6), text, font=FONT_BUBBLE, fill="#0f172a")

def draw_pociman(draw, cx, cy, t, is_dancing=True):
    # Bobbing & Hip sway (Koplo dance)
    sway = math.sin(t * 12) * 18 if is_dancing else 0
    bob = abs(math.sin(t * 12)) * 12 if is_dancing else 0
    py = cy - bob

    outline_color = "#3e352d"
    shroud_color = "#dfd7ce"  # Canonical warm cream shroud matching game.js
    shadow_color = "#c5baa8"
    twine_color = "#7d7062"   # Canonical rope twine brown matching game.js
    rope_accent = "#998a7c"

    # --- THREE-SACKS CANONICAL BODY (matching drawPocimanThreeSacks from game.js) ---
    # 1. Lower Sack (Tapering teardrop pouch down to tail)
    draw.polygon([
        (cx - 24 + sway, py + 16),
        (cx - 28 + sway, py + 36),
        (cx - 14 + sway, py + 56),
        (cx + sway, py + 62),
        (cx + 14 + sway, py + 56),
        (cx + 28 + sway, py + 36),
        (cx + 24 + sway, py + 16)
    ], fill=shroud_color, outline=outline_color)
    draw.arc([cx - 18 + sway, py + 24, cx + 22 + sway, py + 58], 0, 120, fill=shadow_color, width=3)

    # 2. Middle Sack (Dumpling Torso Pouch)
    draw.ellipse([cx - 30 + sway, py - 16, cx + 30 + sway, py + 24], fill=shroud_color, outline=outline_color, width=3)
    draw.arc([cx - 20 + sway, py - 10, cx + 24 + sway, py + 18], 10, 110, fill=shadow_color, width=3)

    # 3. Top Sack (Bulbous Head Sphere)
    draw.ellipse([cx - 26 + sway, py - 66, cx + 26 + sway, py - 18], fill=shroud_color, outline=outline_color, width=3)
    draw.arc([cx - 16 + sway, py - 60, cx + 20 + sway, py - 24], 20, 120, fill=shadow_color, width=3)

    # --- KNOTS & ROPES (matching drawPocimanKnotsAndRopes) ---
    # Neck Rope Knot
    draw.rounded_rectangle([cx - 14 + sway, py - 22, cx + 14 + sway, py - 14], radius=3, fill=twine_color, outline=outline_color, width=2)
    draw.line([(cx - 6 + sway, py - 22), (cx - 6 + sway, py - 14)], fill=rope_accent, width=2)
    draw.line([(cx + 6 + sway, py - 22), (cx + 6 + sway, py - 14)], fill=rope_accent, width=2)

    # Waist Rope Knot
    draw.rounded_rectangle([cx - 14 + sway, py + 14, cx + 14 + sway, py + 22], radius=3, fill=twine_color, outline=outline_color, width=2)
    draw.line([(cx - 6 + sway, py + 14), (cx - 6 + sway, py + 22)], fill=rope_accent, width=2)
    draw.line([(cx + 6 + sway, py + 14), (cx + 6 + sway, py + 22)], fill=rope_accent, width=2)

    # Top Rosette Tie (Kuncir Kepala 3-Spikes from game.js)
    top_w = math.sin(t * 14) * 8
    draw.polygon([
        (cx - 10 + sway, py - 64),
        (cx - 16 + sway + top_w, py - 82),
        (cx - 6 + sway + top_w, py - 76),
        (cx + sway + top_w, py - 88),
        (cx + 6 + sway + top_w, py - 76),
        (cx + 16 + sway + top_w, py - 82),
        (cx + 10 + sway, py - 64)
    ], fill=shroud_color, outline=outline_color)
    draw.rounded_rectangle([cx - 8 + sway, py - 68, cx + 8 + sway, py - 62], radius=2, fill=twine_color, outline=outline_color, width=2)

    # Bottom Tail Fringe (Kuncir Bawah from game.js)
    tail_w = math.sin(t * 14 + 1.2) * 8
    draw.polygon([
        (cx + sway, py + 62),
        (cx - 12 + sway + tail_w, py + 80),
        (cx - 4 + sway + tail_w, py + 74),
        (cx + sway + tail_w, py + 86),
        (cx + 4 + sway + tail_w, py + 74),
        (cx + 12 + sway + tail_w, py + 80)
    ], fill=shroud_color, outline=outline_color)
    draw.rounded_rectangle([cx - 7 + sway, py + 60, cx + 7 + sway, py + 66], radius=2, fill=twine_color, outline=outline_color, width=2)

    # --- THE ICONIC DIAMOND FACE CUTOUT (matching drawPocimanDiamondFace: #758392) ---
    df_cy = py - 42
    draw.polygon([
        (cx + sway, df_cy - 19),     # Top peak
        (cx + 16 + sway, df_cy),     # Right corner
        (cx + sway, df_cy + 18),     # Bottom point
        (cx - 16 + sway, df_cy)      # Left corner
    ], fill="#758392", outline=outline_color, width=2)

    # --- CANONICAL GAMEPLAY EYES (Two Giant Round Googly Eyes matching Screenshot 2) ---
    eye_cy = df_cy - 2
    # Left eye
    draw.ellipse([cx - 16 + sway, eye_cy - 8, cx - 1 + sway, eye_cy + 8], fill="#ffffff", outline=outline_color, width=2)
    # Right eye
    draw.ellipse([cx + 1 + sway, eye_cy - 8, cx + 16 + sway, eye_cy + 8], fill="#ffffff", outline=outline_color, width=2)

    # Big round black pupils with white catchlights
    draw.ellipse([cx - 11 + sway, eye_cy - 4, cx - 5 + sway, eye_cy + 2], fill="#3e352d")
    draw.ellipse([cx + 5 + sway, eye_cy - 4, cx + 11 + sway, eye_cy + 2], fill="#3e352d")
    draw.ellipse([cx - 10 + sway, eye_cy - 3, cx - 8 + sway, eye_cy - 1], fill="#ffffff")
    draw.ellipse([cx + 6 + sway, eye_cy - 3, cx + 8 + sway, eye_cy - 1], fill="#ffffff")

    # Happy open mouth with pink tongue (matching Screenshot 2 & drawFacePanic from game.js)
    draw.rounded_rectangle([cx - 7 + sway, eye_cy + 8, cx + 7 + sway, eye_cy + 19], radius=5, fill="#7f1d1d", outline=outline_color, width=2)
    draw.ellipse([cx - 4 + sway, eye_cy + 13, cx + 4 + sway, eye_cy + 19], fill="#f472b6")

    # Cyan panic / joget sweat drops popping off head (matching Screenshot 2)
    sw_drop1 = (t * 28) % 18
    sw_drop2 = (t * 32 + 6) % 20
    draw.ellipse([cx - 25 + sway - sw_drop1 * 0.4, df_cy - 16 - sw_drop1, cx - 19 + sway - sw_drop1 * 0.4, df_cy - 8 - sw_drop1], fill="#38bdf8", outline="#0284c7")
    draw.ellipse([cx + 20 + sway + sw_drop2 * 0.4, df_cy - 18 - sw_drop2, cx + 26 + sway + sw_drop2 * 0.4, df_cy - 10 - sw_drop2], fill="#38bdf8", outline="#0284c7")

def draw_pemuda_resting(draw, px, ground_y, t):
    panting = math.sin(t * 7.5) * 4
    outline = "#3e352d"
    
    # 1. Bare Legs & Sandals
    draw.rectangle([px - 16, ground_y - 28, px - 6, ground_y - 6], fill="#fed7aa", outline=outline, width=2)
    draw.rectangle([px + 6, ground_y - 28, px + 18, ground_y - 6], fill="#fed7aa", outline=outline, width=2)
    draw.rectangle([px - 18, ground_y - 8, px - 4, ground_y], fill="#0f172a")
    draw.rectangle([px + 4, ground_y - 8, px + 18, ground_y], fill="#0f172a")
    
    # 2. Rolled Green Sarung Waist & White Singlet Torso
    draw.rounded_rectangle([px - 22, ground_y - 48 - panting, px + 22, ground_y - 26 - panting], radius=6, fill="#15803d", outline=outline, width=3)
    draw.rounded_rectangle([px - 20, ground_y - 76 - panting, px + 20, ground_y - 44 - panting], radius=8, fill="#f8fafc", outline=outline, width=3)
    
    # Arms: Left arm on knee, Right arm holding Torch!
    draw.line([(px - 18, ground_y - 65 - panting), (px - 26, ground_y - 48 - panting), (px - 16, ground_y - 40 - panting)], fill="#fed7aa", width=5)
    draw.line([(px + 18, ground_y - 65 - panting), (px + 30, ground_y - 65 - panting), (px + 36, ground_y - 78 - panting)], fill="#fed7aa", width=5)

    # Blazing Bamboo Torch (Obor)
    draw.line([(px + 36, ground_y - 40), (px + 36, ground_y - 100)], fill="#ca8a04", width=5)
    draw.rectangle([px + 31, ground_y - 110, px + 41, ground_y - 97], fill="#854d0e", outline=outline, width=1)
    flk = math.sin(t * 18) * 4
    draw.polygon([(px + 29, ground_y - 110), (px + 43, ground_y - 110), (px + 36 + flk, ground_y - 140)], fill="#ea580c")
    draw.polygon([(px + 32, ground_y - 110), (px + 40, ground_y - 110), (px + 36 + flk * 0.7, ground_y - 131)], fill="#f59e0b")
    draw.ellipse([px + 33, ground_y - 120, px + 39, ground_y - 112], fill="#fef08a")

    # Head (True Chibi Round Head)
    hy = ground_y - 99 - panting
    draw.ellipse([px - 25, hy - 25, px + 25, hy + 25], fill="#fed7aa", outline=outline, width=3)
    
    # Spiky 3-Point Messy Hair
    draw.polygon([
        (px - 22, hy - 14), (px - 28, hy - 38), (px - 13, hy - 24),
        (px, hy - 43), (px + 13, hy - 24), (px + 28, hy - 38), (px + 22, hy - 14)
    ], fill="#1e1b18", outline=outline, width=2)
    
    # Pita Merah Putih Headband with Fluttering Ribbon
    draw.rectangle([px - 24, hy - 18, px + 24, hy - 11], fill="#dc2626")
    draw.rectangle([px - 24, hy - 11, px + 24, hy - 5], fill="#ffffff")
    draw.rectangle([px - 24, hy - 18, px + 24, hy - 5], outline=outline, width=2)
    ribbon_w = math.sin(t * 8) * 5
    draw.polygon([(px - 24, hy - 16), (px - 44, hy - 22 + ribbon_w), (px - 38, hy - 6 + ribbon_w), (px - 24, hy - 6)], fill="#dc2626", outline=outline, width=2)
    
    # Expressive Anime Eyes
    draw.ellipse([px - 14, hy - 8, px - 1, hy + 6], fill="#ffffff", outline=outline, width=2)
    draw.ellipse([px + 1, hy - 8, px + 14, hy + 6], fill="#ffffff", outline=outline, width=2)
    draw.ellipse([px - 10, hy - 6, px - 5, hy], fill="#1e1b18")
    draw.ellipse([px + 5, hy - 6, px + 11, hy], fill="#1e1b18")
    draw.ellipse([px - 9, hy - 5, px - 7, hy - 3], fill="#ffffff")
    draw.ellipse([px + 6, hy - 5, px + 8, hy - 3], fill="#ffffff")
    
    # Rosy Cheeks & Open Smile with Tongue
    draw.ellipse([px - 21, hy + 2, px - 13, hy + 10], fill="#fca5a5")
    draw.ellipse([px + 13, hy + 2, px + 21, hy + 10], fill="#fca5a5")
    draw.chord([px - 8, hy + 6, px + 8, hy + 20], 0, 180, fill="#7f1d1d", outline=outline, width=2)
    draw.ellipse([px - 4, hy + 13, px + 4, hy + 19], fill="#f43f5e")

def draw_emak_resting(draw, ex, ground_y, t):
    panting = math.sin(t * 6.5) * 3
    outline = "#3e352d"
    
    # Bare Legs & Blue Flip-Flops
    draw.rectangle([ex - 16, ground_y - 24, ex - 6, ground_y - 6], fill="#fed7aa", outline=outline, width=2)
    draw.rectangle([ex + 6, ground_y - 24, ex + 16, ground_y - 6], fill="#fed7aa", outline=outline, width=2)
    draw.rectangle([ex - 18, ground_y - 8, ex - 4, ground_y], fill="#38bdf8", outline="#0284c7", width=1)
    draw.rectangle([ex + 4, ground_y - 8, ex + 18, ground_y], fill="#38bdf8", outline="#0284c7", width=1)
    
    # Orange Batik A-Line Daster
    draw.polygon([
        (ex - 18, ground_y - 76 - panting), (ex + 18, ground_y - 76 - panting),
        (ex + 30, ground_y - 24 - panting), (ex - 30, ground_y - 24 - panting)
    ], fill="#ea580c", outline=outline, width=3)
    
    # Batik Yellow Connected Flower Motif
    draw.line([(ex - 14, ground_y - 58 - panting), (ex + 14, ground_y - 42 - panting)], fill="#fde047", width=3)
    draw.line([(ex + 14, ground_y - 58 - panting), (ex - 14, ground_y - 42 - panting)], fill="#fde047", width=3)
    for dx, dy in [(-14, -58), (14, -58), (-14, -42), (14, -42), (0, -50)]:
        draw.ellipse([ex + dx - 4, ground_y + dy - panting - 4, ex + dx + 4, ground_y + dy - panting + 4], fill="#fde047")
        
    # Arms: Left arm on hip, Right arm holding spatula!
    draw.line([(ex - 18, ground_y - 65 - panting), (ex - 28, ground_y - 50 - panting), (ex - 18, ground_y - 40 - panting)], fill="#fed7aa", width=5)
    draw.line([(ex + 18, ground_y - 65 - panting), (ex + 30, ground_y - 68 - panting), (ex + 38, ground_y - 82 - panting)], fill="#fed7aa", width=5)

    # Golden Spatula / Sutil in Hand!
    draw.line([(ex + 38, ground_y - 82 - panting), (ex + 44, ground_y - 110 - panting)], fill="#ca8a04", width=5)
    draw.rounded_rectangle([ex + 38, ground_y - 128 - panting, ex + 56, ground_y - 105 - panting], radius=4, fill="#eab308", outline=outline, width=2)
    draw.line([(ex + 38, ground_y - 116 - panting), (ex + 56, ground_y - 116 - panting)], fill="#ef4444", width=3)

    # Head (True Chibi Round Head)
    hy = ground_y - 100 - panting
    draw.ellipse([ex - 25, hy - 25, ex + 25, hy + 25], fill="#fed7aa", outline=outline, width=3)
    
    # 3 Giant Hair Rollers (Pink, Cyan, Purple)
    draw.rounded_rectangle([ex - 25, hy - 40, ex - 9, hy - 24], radius=4, fill="#ec4899", outline=outline, width=2)
    draw.rounded_rectangle([ex - 8, hy - 43, ex + 8, hy - 27], radius=4, fill="#06b6d4", outline=outline, width=2)
    draw.rounded_rectangle([ex + 9, hy - 40, ex + 25, hy - 24], radius=4, fill="#a855f7", outline=outline, width=2)
    
    # Angry Slanted Eyebrows
    draw.line([(ex - 15, hy - 14), (ex - 3, hy - 9)], fill=outline, width=3)
    draw.line([(ex + 15, hy - 14), (ex + 3, hy - 9)], fill=outline, width=3)
    
    # Fierce Cartoon Eyes
    draw.ellipse([ex - 14, hy - 9, ex - 1, hy + 5], fill="#ffffff", outline=outline, width=2)
    draw.ellipse([ex + 1, hy - 9, ex + 15, hy + 5], fill="#ffffff", outline=outline, width=2)
    draw.ellipse([ex - 10, hy - 6, ex - 4, hy], fill="#1e1b18")
    draw.ellipse([ex + 4, hy - 6, ex + 10, hy], fill="#1e1b18")
    draw.ellipse([ex - 8, hy - 5, ex - 6, hy - 3], fill="#ffffff")
    draw.ellipse([ex + 6, hy - 5, ex + 8, hy - 3], fill="#ffffff")
    
    # Rosy Cheeks
    draw.ellipse([ex - 21, hy + 2, ex - 13, hy + 10], fill="#fca5a5")
    draw.ellipse([ex + 13, hy + 2, ex + 21, hy + 10], fill="#fca5a5")
    
    # Open Shouting Circle Mouth with Red Lipstick
    draw.ellipse([ex - 8, hy + 6, ex + 8, hy + 22], fill="#dc2626", outline=outline, width=2)
    draw.ellipse([ex - 5, hy + 9, ex + 5, hy + 19], fill="#7f1d1d")

def draw_kunti_flower_pil(draw, fx, fy, size=8):
    for i in range(5):
        a = (i * math.pi * 2) / 5
        px = fx + math.cos(a) * (size * 0.55)
        py = fy + math.sin(a) * (size * 0.55)
        r = size * 0.45
        draw.ellipse([px - r, py - r, px + r, py + r], fill="#ffffff", outline="#3e352d", width=1)
    draw.ellipse([fx - size * 0.35, fy - size * 0.35, fx + size * 0.35, fy + size * 0.35], fill="#facc15", outline="#3e352d", width=1)

def draw_kuntilanak(draw, cx, cy, t):
    float_y = cy + math.sin(t * 4.5) * 14
    sway = math.sin(t * 9) * 14

    # Radiant lilac aura glow & sparkles (matching Screenshot 1 & game.js)
    draw.ellipse([cx - 72, float_y - 72, cx + 72, float_y + 72], fill="#3b0764")
    draw.ellipse([cx - 56, float_y - 56, cx + 56, float_y + 56], fill="#581c87")
    for i in range(6):
        sa = t * 3.5 + i * (math.pi * 2 / 6)
        sx = cx + math.cos(sa) * 62
        sy = float_y + math.sin(sa) * 52
        draw.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill="#d8b4fe")
        draw.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill="#fef08a")

    # Cascading Midnight Hair (#1e1b18 with #3e352d outline) down the left side
    hair_sway = math.sin(t * 5) * 10
    draw.polygon([
        (cx - 10, float_y - 45),
        (cx - 42 + hair_sway, float_y + 10),
        (cx - 36 + hair_sway, float_y + 85),
        (cx - 12 + hair_sway, float_y + 70),
        (cx + 8, float_y - 20)
    ], fill="#1e1b18", outline="#3e352d")

    # Flowing White Dress with Lilac hem and scallop (#f8fafc with #c084fc hem, matching Screenshot 1 & game.js)
    wave1 = math.sin(t * 6) * 8
    wave2 = math.cos(t * 7) * 8
    draw.polygon([
        (cx - 14, float_y - 24),
        (cx + 14, float_y - 24),
        (cx + 34 + wave1, float_y + 35),
        (cx + 30 + wave1, float_y + 80),
        (cx - 30 + wave2, float_y + 80),
        (cx - 34 + wave2, float_y + 35),
        (cx - 14, float_y - 24)
    ], fill="#f8fafc", outline="#3e352d")
    draw.rectangle([cx - 30 + wave2, float_y + 76, cx + 30 + wave1, float_y + 82], fill="#c084fc")

    # Pastel pink ribbon bow at chest (#e879f9)
    draw.ellipse([cx - 6, float_y - 2, cx + 6, float_y + 6], fill="#e879f9", outline="#3e352d", width=1)

    # Cute waving ghost hands (#fef3c7)
    arm_sway = math.sin(t * 10) * 10
    draw.rounded_rectangle([cx + 10, float_y - 6 + arm_sway, cx + 42, float_y + 3 + arm_sway], radius=4, fill="#fef3c7", outline="#3e352d", width=2)
    draw.rounded_rectangle([cx - 42, float_y - 12 - arm_sway, cx - 10, float_y - 3 - arm_sway], radius=4, fill="#fef3c7", outline="#3e352d", width=2)

    # Cute Round Pale Porcelain Chibi Face (#fef3c7, outline #3e352d) matching Screenshot 1
    draw.ellipse([cx - 19, float_y - 50, cx + 19, float_y - 14], fill="#fef3c7", outline="#3e352d", width=2)

    # Cute bangs across forehead matching Screenshot 1
    draw.polygon([
        (cx - 17, float_y - 40), (cx - 8, float_y - 32), (cx, float_y - 40),
        (cx + 8, float_y - 32), (cx + 17, float_y - 40), (cx + 15, float_y - 48),
        (cx - 15, float_y - 48)
    ], fill="#1e1b18")

    # Big Shiny Anime Chibi Eyes with Double Catchlights & Violet bottom iris (matching Screenshot 1)
    # Pupils
    draw.ellipse([cx - 13, float_y - 37, cx - 3, float_y - 22], fill="#1e1b18")
    draw.ellipse([cx + 3, float_y - 37, cx + 13, float_y - 22], fill="#1e1b18")
    # Violet bottom iris
    draw.chord([cx - 12, float_y - 31, cx - 4, float_y - 22], 0, 180, fill="#a855f7")
    draw.chord([cx + 4, float_y - 31, cx + 12, float_y - 22], 0, 180, fill="#a855f7")
    # Double catchlights: large upper-left, small lower-right
    draw.ellipse([cx - 12, float_y - 36, cx - 8, float_y - 30], fill="#ffffff")
    draw.ellipse([cx + 4, float_y - 36, cx + 8, float_y - 30], fill="#ffffff")
    draw.ellipse([cx - 7, float_y - 27, cx - 5, float_y - 24], fill="#ffffff")
    draw.ellipse([cx + 9, float_y - 27, cx + 11, float_y - 24], fill="#ffffff")

    # Rosy Blushing Cheeks & Sweet Red Smile
    draw.ellipse([cx - 16, float_y - 24, cx - 8, float_y - 18], fill="#f472b6")
    draw.ellipse([cx + 8, float_y - 24, cx + 16, float_y - 18], fill="#f472b6")
    draw.chord([cx - 6, float_y - 22, cx + 6, float_y - 15], 0, 180, fill="#dc2626", outline="#3e352d", width=1)

    # 5-petal white flower pin in hair (above right ear, matching Screenshot 1)
    draw_kunti_flower_pil(draw, cx + 15, float_y - 43, size=10)

    # Kantong Plastik Es Teh Jumbo with red straw (Iconic detail from Screenshot 1!)
    tea_x, tea_y = cx + 36, float_y + 12 + arm_sway
    # Straw leading to mouth
    draw.line([(tea_x - 3, tea_y - 4), (tea_x - 12, float_y - 17)], fill="#ef4444", width=3)
    # Plastic pouch with orange iced tea
    draw.rounded_rectangle([tea_x - 9, tea_y, tea_x + 9, tea_y + 24], radius=4, fill="#f97316", outline="#3e352d", width=1)
    # Green rubber band tie at top of bag
    draw.rectangle([tea_x - 6, tea_y - 2, tea_x + 6, tea_y + 2], fill="#22c55e")
    # Floating ice cube in tea
    draw.rectangle([tea_x - 4, tea_y + 6, tea_x + 2, tea_y + 12], fill="#fed7aa")

# --- 3. Scene 1 Characters (Pos Ronda Resting) ---
def draw_pak_rt_resting(draw, rt_x, ground_y, t):
    panting = math.sin(t * 8) * 4
    outline = "#3e352d"
    
    # Legs & Sandals
    draw.rectangle([rt_x - 22, ground_y - 28, rt_x - 8, ground_y - 4], fill="#1e293b", outline=outline, width=2)
    draw.rectangle([rt_x + 8, ground_y - 28, rt_x + 22, ground_y - 4], fill="#1e293b", outline=outline, width=2)
    draw.rectangle([rt_x - 24, ground_y - 6, rt_x - 6, ground_y], fill="#78350f")
    draw.rectangle([rt_x + 6, ground_y - 6, rt_x + 24, ground_y], fill="#78350f")
    
    # Large Round Potbelly Torso (Perut Buncit Bulat)
    draw.ellipse([rt_x - 30, ground_y - 82 - panting, rt_x + 30, ground_y - 26 - panting], fill="#92400e", outline=outline, width=3)
    # Batik gold dots
    for dx, dy in [(-11, -60), (11, -54), (0, -42)]:
        draw.ellipse([rt_x + dx - 3.5, ground_y + dy - panting - 3.5, rt_x + dx + 3.5, ground_y + dy - panting + 3.5], fill="#f59e0b")
        
    # Arms resting on knees / belly
    draw.line([(rt_x - 24, ground_y - 65 - panting), (rt_x - 32, ground_y - 48 - panting), (rt_x - 18, ground_y - 42 - panting)], fill="#fed7aa", width=5)
    draw.line([(rt_x + 24, ground_y - 65 - panting), (rt_x + 32, ground_y - 48 - panting), (rt_x + 18, ground_y - 42 - panting)], fill="#fed7aa", width=5)

    # Head (True Chibi Round Head)
    hy = ground_y - 100 - panting
    draw.ellipse([rt_x - 25, hy - 25, rt_x + 25, hy + 25], fill="#fed7aa", outline=outline, width=3)
    
    # Tilted black peci
    draw.rounded_rectangle([rt_x - 24, hy - 40, rt_x + 24, hy - 17], radius=4, fill="#1e1b18", outline=outline, width=2)
    
    # Comical Wire Glasses & Big Round Eyes
    draw.ellipse([rt_x - 14, hy - 10, rt_x - 1, hy + 3], fill="#ffffff", outline=outline, width=2)
    draw.ellipse([rt_x + 1, hy - 10, rt_x + 14, hy + 3], fill="#ffffff", outline=outline, width=2)
    draw.rectangle([rt_x - 15, hy - 11, rt_x, hy + 4], outline="#94a3b8", width=2)
    draw.rectangle([rt_x, hy - 11, rt_x + 15, hy + 4], outline="#94a3b8", width=2)
    draw.line([(rt_x - 1, hy - 4), (rt_x + 1, hy - 4)], fill="#94a3b8", width=2)
    
    # Pupils & Catchlights
    draw.ellipse([rt_x - 10, hy - 7, rt_x - 5, hy - 2], fill="#1e1b18")
    draw.ellipse([rt_x + 5, hy - 7, rt_x + 10, hy - 2], fill="#1e1b18")
    draw.ellipse([rt_x - 9, hy - 6, rt_x - 7, hy - 4], fill="#ffffff")
    draw.ellipse([rt_x + 6, hy - 6, rt_x + 8, hy - 4], fill="#ffffff")
    
    # Bushy Black Mustache
    draw.ellipse([rt_x - 18, hy + 2, rt_x + 18, hy + 16], fill="#262626")
    
    # Gasping Open Mouth with Tongue
    draw.chord([rt_x - 8, hy + 10, rt_x + 8, hy + 22], 0, 180, fill="#7f1d1d", outline=outline, width=1)
    draw.ellipse([rt_x - 4, hy + 15, rt_x + 4, hy + 21], fill="#f43f5e")
    
    # Cyan Sweat Drop
    sw = (t * 35) % 15
    draw.ellipse([rt_x - 22, hy - 24 + sw, rt_x - 15, hy - 14 + sw], fill="#38bdf8", outline="#0284c7")
    
    # Megaphone TOA resting on bench
    draw.polygon([(rt_x - 36, ground_y - 6), (rt_x - 58, ground_y - 20), (rt_x - 58, ground_y + 4)], fill="#f8fafc", outline=outline, width=2)
    draw.rectangle([rt_x - 61, ground_y - 22, rt_x - 58, ground_y + 6], fill="#ef4444")
    draw.rectangle([rt_x - 38, ground_y - 12, rt_x - 30, ground_y - 2], fill="#64748b")

def draw_hansip_resting(draw, hs_x, ground_y, t):
    panting = math.sin(t * 7) * 3
    outline = "#3e352d"
    
    # Legs & Boots
    draw.rectangle([hs_x - 18, ground_y - 28, hs_x - 6, ground_y - 6], fill="#14532d", outline=outline, width=2)
    draw.rectangle([hs_x + 6, ground_y - 28, hs_x + 18, ground_y - 6], fill="#14532d", outline=outline, width=2)
    draw.rectangle([hs_x - 20, ground_y - 8, hs_x - 4, ground_y], fill="#0f172a")
    draw.rectangle([hs_x + 4, ground_y - 8, hs_x + 20, ground_y], fill="#0f172a")
    
    # Linmas Uniform Torso (Rounded Rectangle)
    draw.rounded_rectangle([hs_x - 22, ground_y - 76 - panting, hs_x + 22, ground_y - 28 - panting], radius=8, fill="#166534", outline=outline, width=3)
    # Epaulets
    draw.rectangle([hs_x - 22, ground_y - 76 - panting, hs_x - 14, ground_y - 69 - panting], fill="#facc15")
    draw.rectangle([hs_x + 14, ground_y - 76 - panting, hs_x + 22, ground_y - 69 - panting], fill="#facc15")
    # White belt & Brass buckle
    draw.rectangle([hs_x - 22, ground_y - 48 - panting, hs_x + 22, ground_y - 40 - panting], fill="#f8fafc", outline="#cbd5e1", width=1)
    draw.rectangle([hs_x - 5, ground_y - 50 - panting, hs_x + 5, ground_y - 38 - panting], fill="#facc15", outline="#ca8a04", width=1)
    
    # Arms resting on knees
    draw.line([(hs_x - 20, ground_y - 65 - panting), (hs_x - 28, ground_y - 48 - panting), (hs_x - 16, ground_y - 42 - panting)], fill="#166534", width=5)
    draw.line([(hs_x + 20, ground_y - 65 - panting), (hs_x + 28, ground_y - 48 - panting), (hs_x + 16, ground_y - 42 - panting)], fill="#166534", width=5)

    # Head (True Chibi Round Head)
    hy = ground_y - 99 - panting
    draw.ellipse([hs_x - 25, hy - 25, hs_x + 25, hy + 25], fill="#fed7aa", outline=outline, width=3)
    
    # Linmas Peaked Cap
    draw.rounded_rectangle([hs_x - 23, hy - 38, hs_x + 23, hy - 16], radius=8, fill="#14532d", outline=outline, width=2)
    draw.ellipse([hs_x - 18, hy - 21, hs_x + 18, hy - 11], fill="#0f172a")
    draw.ellipse([hs_x - 5, hy - 32, hs_x + 5, hy - 22], fill="#facc15", outline="#ca8a04", width=1)
    
    # Big Cartoon Eyes
    draw.ellipse([hs_x - 14, hy - 9, hs_x - 1, hy + 5], fill="#ffffff", outline=outline, width=2)
    draw.ellipse([hs_x + 1, hy - 9, hs_x + 14, hy + 5], fill="#ffffff", outline=outline, width=2)
    draw.ellipse([hs_x - 10, hy - 7, hs_x - 5, hy - 2], fill="#1e1b18")
    draw.ellipse([hs_x + 5, hy - 7, hs_x + 10, hy - 2], fill="#1e1b18")
    draw.ellipse([hs_x - 9, hy - 6, hs_x - 7, hy - 4], fill="#ffffff")
    draw.ellipse([hs_x + 6, hy - 6, hs_x + 8, hy - 4], fill="#ffffff")
    
    # Rosy Cheeks & Cyan Sweat Drop
    draw.ellipse([hs_x - 21, hy + 1, hs_x - 13, hy + 9], fill="#fca5a5")
    draw.ellipse([hs_x + 13, hy + 1, hs_x + 21, hy + 9], fill="#fca5a5")
    draw.ellipse([hs_x - 20, hy - 20, hs_x - 14, hy - 10], fill="#38bdf8", outline="#0284c7")
    
    # Comical Whistle in Mouth (Peluit Perak Kanonikal!)
    draw.rectangle([hs_x + 4, hy + 8, hs_x + 16, hy + 14], fill="#cbd5e1", outline=outline, width=2)
    draw.ellipse([hs_x + 14, hy + 6, hs_x + 22, hy + 16], fill="#cbd5e1", outline=outline, width=2)
    
    # Wooden Baton on Bench
    draw.line([(hs_x + 32, ground_y), (hs_x + 46, ground_y - 65)], fill="#78350f", width=6)
    draw.ellipse([hs_x + 44, ground_y - 69, hs_x + 52, ground_y - 61], fill="#451a03")

# --- 4. Scene 1 Renderer (Pos Ronda Kampung) ---
def render_scene_1(draw, t):
    # Midnight sky gradient
    draw.rectangle([0, 0, W, 480], fill="#090d16")
    # Crescent Moon
    draw.ellipse([W - 160, 60, W - 80, 140], fill="#fef08a")
    draw.ellipse([W - 140, 50, W - 60, 130], fill="#090d16")

    # Stars
    for s in [(120, 80), (250, 50), (450, 90), (600, 40), (820, 110), (1020, 70)]:
        draw.ellipse([s[0], s[1], s[0] + 3, s[1] + 3], fill="#ffffff")

    # Distant kampung houses
    for hx in [80, 320, 960, 1120]:
        draw.rectangle([hx, 360, hx + 120, 480], fill="#111827")
        draw.polygon([(hx - 10, 360), (hx + 60, 310), (hx + 130, 360)], fill="#1f2937")
        draw.rectangle([hx + 40, 390, hx + 70, 420], fill="#facc15") # yellow window

    # Ground
    draw.rectangle([0, 480, W, H], fill="#1c1917")
    draw.rectangle([0, 475, W, 483], fill="#292524")

    # Pos Ronda Structure
    pr_x, pr_y, pr_w, pr_h = 240, 210, 800, 300
    # Clay Roof
    draw.polygon([(pr_x - 60, pr_y + 60), (pr_x + pr_w // 2, pr_y - 50), (pr_x + pr_w + 60, pr_y + 60)], fill="#7f1d1d", outline="#450a0a", width=3)
    # Roof ridge
    draw.rectangle([pr_x + pr_w // 2 - 40, pr_y - 60, pr_x + pr_w // 2 + 40, pr_y - 45], fill="#991b1b")

    # Wooden Pillars
    for px in [pr_x, pr_x + 240, pr_x + 560, pr_x + pr_w]:
        draw.rectangle([px - 14, pr_y + 60, px + 14, 480], fill="#78350f", outline="#451a03", width=2)

    # Bamboo Floor & Bench
    draw.rectangle([pr_x - 30, 430, pr_x + pr_w + 30, 475], fill="#92400e", outline="#451a03", width=3)

    # Hanging Kentongan
    draw.rectangle([pr_x + 80, pr_y + 90, pr_x + 115, pr_y + 210], fill="#b45309", outline="#451a03", width=3)
    draw.rectangle([pr_x + 94, pr_y + 110, pr_x + 101, pr_y + 190], fill="#1c1917")
    draw.line([(pr_x + 120, pr_y + 120), (pr_x + 145, pr_y + 175)], fill="#d97706", width=5) # pemukul

    # Hanging Petromak Lamp (Swaying)
    lamp_swing = math.sin(t * 3.5) * 8
    lamp_x = pr_x + 400 + lamp_swing
    draw.line([(pr_x + 400, pr_y + 40), (lamp_x, pr_y + 120)], fill="#94a3b8", width=2)
    # Lamp glow
    draw.ellipse([lamp_x - 80, pr_y + 80, lamp_x + 80, pr_y + 240], fill="#fef08a")
    draw.rectangle([lamp_x - 22, pr_y + 120, lamp_x + 22, pr_y + 175], fill="#0f172a", outline="#facc15", width=2)
    draw.rectangle([lamp_x - 14, pr_y + 130, lamp_x + 14, pr_y + 165], fill="#ffffff")

    # Wooden Table in Center
    tx, ty = pr_x + 330, 410
    draw.rectangle([tx, ty, tx + 140, ty + 25], fill="#78350f", outline="#451a03", width=2)
    draw.rectangle([tx + 15, ty + 25, tx + 30, 470], fill="#5b21b6")
    draw.rectangle([tx + 110, ty + 25, tx + 125, 470], fill="#5b21b6")

    # Plate of Gorengan (Pisang Goreng & Tahu Isi)
    draw.ellipse([tx + 20, ty - 12, tx + 120, ty + 12], fill="#e2e8f0", outline="#94a3b8", width=2)
    # Golden Pisang Goreng
    draw.ellipse([tx + 35, ty - 14, tx + 75, ty + 2], fill="#f59e0b", outline="#b45309", width=2)
    draw.ellipse([tx + 65, ty - 16, tx + 105, ty], fill="#d97706", outline="#78350f", width=2)
    # Green Cabe Rawit
    draw.polygon([(tx + 50, ty - 2), (tx + 70, ty - 6), (tx + 55, ty + 2)], fill="#16a34a")

    # Cup of Steaming Kopi Tubruk
    draw.rectangle([tx + 125, ty - 18, tx + 145, ty + 2], fill="#1c1917", outline="#ffffff", width=2)
    # Steam waves
    steam_drift = math.sin(t * 8) * 4
    draw.line([(tx + 132 + steam_drift, ty - 22), (tx + 135 - steam_drift, ty - 42)], fill="#f1f5f9", width=2)
    draw.line([(tx + 138 + steam_drift, ty - 22), (tx + 141 - steam_drift, ty - 46)], fill="#f1f5f9", width=2)

    # 1. Pemuda Kampung (Left Pillar, Leaning & Catching Breath - matching drawPemuda from game.js)
    pm_x = pr_x + 75
    draw_pemuda_resting(draw, pm_x, 468, t)

    # 2. Pak RT (Left Bench, Slumped & Panting - matching drawPakRT from game.js)
    rt_x = pr_x + 205
    draw_pak_rt_resting(draw, rt_x, 468, t)

    # 3. Hansip (Right Bench, Ngopi - matching drawHansip from game.js)
    hs_x = pr_x + 605
    draw_hansip_resting(draw, hs_x, 468, t)

    # 4. Emak-emak Daster (Right Bench with Sutil - matching drawEmak from game.js)
    em_x = pr_x + 725
    draw_emak_resting(draw, em_x, 468, t)

    # Pos Ronda Name Sign
    draw.rounded_rectangle([pr_x + pr_w // 2 - 120, pr_y + 20, pr_x + pr_w // 2 + 120, pr_y + 55], radius=6, fill="#0f172a", outline="#facc15", width=2)
    draw.text((pr_x + pr_w // 2 - 100, pr_y + 26), "POS RONDA RT 04 / RW 07", font=FONT_LABEL, fill="#fef08a")

    # Speech Bubbles according to timing
    if 0.4 <= t < SPLIT - 3.0:
        draw_speech_bubble(draw, rt_x + 30, 275, "Pak RT (Kelelahan):", "Waduh, napas gue abis! Pocong zaman now larinya kayak atlet.", "bottom")
    elif SPLIT - 2.8 <= t < SPLIT - 0.1:
        draw_speech_bubble(draw, hs_x - 30, 275, "Hansip Linmas (Ngopi Santai):", "Ngopi dulu, Pak. Pisang gorengnya jangan dihabisin.", "bottom")

# --- 4. Scene 2 Renderer (TPU Kramat Jati Koplo Dance) ---
def render_scene_2(draw, t):
    t_scene = t - SPLIT

    # Mystic Graveyard Sky Gradient
    draw.rectangle([0, 0, W, 480], fill="#1e1035")
    # Giant Full Moon
    draw.ellipse([W // 2 - 140, 50, W // 2 + 140, 330], fill="#fef08a")
    draw.ellipse([W // 2 - 60, 110, W // 2 - 10, 160], fill="#fde047") # crater

    # Spooky Beringin & Kamboja Trees (Silhouettes)
    for tx in [120, W - 140]:
        draw.rectangle([tx - 18, 260, tx + 18, 520], fill="#0f172a")
        draw.ellipse([tx - 110, 140, tx + 110, 320], fill="#090d16")

    # Floating Fireflies / Gaib Orbs
    for i, (fx, fy) in enumerate([(220, 260), (380, 220), (880, 240), (1040, 280), (W // 2, 380)]):
        phase = t_scene * 5 + i
        oy = fy + math.sin(phase) * 20
        draw.ellipse([fx - 6, oy - 6, fx + 6, oy + 6], fill="#a855f7")
        draw.ellipse([fx - 3, oy - 3, fx + 3, oy + 3], fill="#facc15")

    # Cemetery Archway & Gate
    gate_x = W // 2
    # Stone Pillars
    draw.rectangle([gate_x - 380, 220, gate_x - 330, 520], fill="#334155", outline="#0f172a", width=3)
    draw.rectangle([gate_x + 330, 220, gate_x + 380, 520], fill="#334155", outline="#0f172a", width=3)
    # Stone Arch
    draw.rounded_rectangle([gate_x - 400, 170, gate_x + 400, 230], radius=10, fill="#1e293b", outline="#0f172a", width=3)
    gate_label = "GERBANG TPU"
    glb = draw.textbbox((0, 0), gate_label, font=FONT_BANNER)
    draw.text((gate_x - (glb[2] - glb[0]) // 2, 182), gate_label, font=FONT_BANNER, fill="#fef08a")

    # Iron Gate Doors (Closed & Padlocked)
    draw.rectangle([gate_x - 330, 260, gate_x + 330, 500], fill=None, outline="#1e293b", width=4)
    for gx in range(gate_x - 310, gate_x + 330, 35):
        draw.line([(gx, 260), (gx, 500)], fill="#334155", width=3)
        draw.polygon([(gx - 6, 260), (gx + 6, 260), (gx, 245)], fill="#0f172a") # spikes
    # Big Rusty Padlock in center
    draw.rounded_rectangle([gate_x - 20, 360, gate_x + 20, 405], radius=6, fill="#ca8a04", outline="#78350f", width=3)
    draw.arc([gate_x - 14, 340, gate_x + 14, 370], 180, 360, fill="#78350f", width=4)
    lock_label = "TERKUNCI"
    llb = draw.textbbox((0, 0), lock_label, font=FONT_LABEL)
    draw.text((gate_x - (llb[2] - llb[0]) // 2, 412), lock_label, font=FONT_LABEL, fill="#facc15")

    # Graveyard Ground & Fog
    draw.rectangle([0, 480, W, H], fill="#0f172a")
    for fx in range(0, W, 140):
        fog_w = 200 + math.sin(t_scene * 3 + fx) * 30
        draw.ellipse([fx - 30, 465, fx + fog_w, 530], fill="#3b0764")

    # Big Stone Gravestone / Nisan (Center-Left)
    nisan_x, nisan_y = gate_x - 250, 480
    draw.rounded_rectangle([nisan_x - 78, nisan_y - 120, nisan_x + 78, nisan_y], radius=30, fill="#475569", outline="#0f172a", width=3)
    rip = "POCONG"
    nap = "BOBO NYENYAK"
    rb = draw.textbbox((0, 0), rip, font=FONT_TITLE)
    nb = draw.textbbox((0, 0), nap, font=FONT_BUBBLE_SUB)
    draw.text((nisan_x - (rb[2] - rb[0]) // 2, nisan_y - 95), rip, font=FONT_TITLE, fill="#cbd5e1")
    draw.text((nisan_x - (nb[2] - nb[0]) // 2, nisan_y - 58), nap, font=FONT_BUBBLE_SUB, fill="#e2e8f0")
    # Red flower petals at base
    for fpx in [-40, -15, 10, 35]:
        draw.ellipse([nisan_x + fpx, nisan_y - 10, nisan_x + fpx + 12, nisan_y + 2], fill="#ef4444")

    # Characters Peeking and Dancing behind / beside Nisan!
    # Pociman dancing right beside the gravestone
    draw_pociman(draw, gate_x + 170, 455, t_scene, is_dancing=True)

    # Mbak Kuntilanak floating and dancing next to Pociman
    draw_kuntilanak(draw, gate_x + 330, 400, t_scene)

    # Grand Celebratory Victory Banner at top
    draw.rounded_rectangle([W // 2 - 360, 16, W // 2 + 360, 68], radius=16, fill="#0f172a", outline="#facc15", width=3)
    title_text = "TAMAT! POCIMAN JAWARA KAMPUNG RESMI LOLOS"
    tb = draw.textbbox((0, 0), title_text, font=FONT_BANNER)
    draw.text((W // 2 - (tb[2] - tb[0]) // 2, 26), title_text, font=FONT_BANNER, fill="#fef08a")

    # Confetti Bursting
    for i, (cx, cy, col) in enumerate([
        (180, 80, "#ef4444"), (280, 140, "#3b82f6"), (420, 90, "#10b981"),
        (860, 100, "#f59e0b"), (1020, 70, "#ec4899"), (1140, 130, "#8b5cf6")
    ]):
        c_wiggle = math.sin(t_scene * 12 + i) * 15
        draw.rectangle([cx + c_wiggle, cy + (t_scene * 60) % 200, cx + c_wiggle + 8, cy + (t_scene * 60) % 200 + 14], fill=col)

    # Speech Bubbles for Pociman & Kunti (positioned comfortably above heads)
    if SPLIT + 0.3 <= t < SPLIT + 3.4:
        draw_speech_bubble(draw, gate_x + 170, 168, "Pociman (Joget Koplo):", "Makasih udah diajak senam malam. Tarik sis!", "bottom")
    elif SPLIT + 3.5 <= t < SPLIT + 6.9:
        draw_speech_bubble(draw, gate_x + 330, 168, "Mbak Kunti:", "Besok malam main ke sini lagi ya, Mas Poci.", "bottom")

# --- 5. Main Execution: Render All Frames & Encode Video ---
def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    audio_file = build_master_audio()

    print(f"Rendering {TOTAL_FRAMES} frames ({DURATION}s @ {FPS}fps)...")
    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / FPS
        img = Image.new("RGB", (W, H), "#000000")
        draw = ImageDraw.Draw(img)

        if t < SPLIT:
            render_scene_1(draw, t)
        else:
            render_scene_2(draw, t)

        k = min(t / 0.5, (DURATION - t) / 0.9, abs(t - SPLIT) / 0.25, 1.0)
        if k < 1.0:
            img = Image.blend(Image.new("RGB", (W, H), "#000000"), img, max(0.0, k))

        frame_path = os.path.join(FRAMES_DIR, f"frame_{frame_idx:04d}.png")
        img.save(frame_path)

        if frame_idx % 60 == 0 or frame_idx == TOTAL_FRAMES - 1:
            print(f"Rendered frame {frame_idx + 1}/{TOTAL_FRAMES} (t={t:.2f}s)")

    print("Encoding ending.mp4 with ffmpeg...")
    cmd_mp4 = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(FRAMES_DIR, "frame_%04d.png"),
        "-i", audio_file,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-shortest",
        OUT_MP4
    ]
    subprocess.run(cmd_mp4, check=True)
    print("ending.mp4 generated successfully! Size:", os.path.getsize(OUT_MP4), "bytes")

    print("Encoding ending.webm with ffmpeg...")
    cmd_webm = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(FRAMES_DIR, "frame_%04d.png"),
        "-i", audio_file,
        "-c:v", "libvpx-vp9",
        "-crf", "30",
        "-b:v", "0",
        "-c:a", "libopus",
        "-b:a", "128k",
        "-shortest",
        OUT_WEBM
    ]
    subprocess.run(cmd_webm, check=True)
    print("ending.webm generated successfully! Size:", os.path.getsize(OUT_WEBM), "bytes")

    # Clean up frames directory to save disk space
    shutil.rmtree(FRAMES_DIR)
    print("Done! Animation video generated and ready.")

if __name__ == "__main__":
    main()
