import math
import struct
import wave
import subprocess
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
FPS = 30
DURATION = 12.0
TOTAL_FRAMES = int(FPS * DURATION)
SAMPLE_RATE = 44100

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
FRAMES_DIR = os.path.join(SCRIPT_DIR, "frames")
VOICES_DIR = os.path.join(SCRIPT_DIR, "raw_voices")
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
def build_master_audio():
    print("Building master audio track...")
    audio_dur = DURATION
    total_samples = int(SAMPLE_RATE * audio_dur)
    master = [0.0] * total_samples

    # Crickets in Scene 1 (0 to 5.5s)
    for i in range(int(SAMPLE_RATE * 5.5)):
        t = i / SAMPLE_RATE
        chirp = math.sin(2 * math.pi * 3.5 * t)
        if chirp > 0.45:
            master[i] += (math.sin(2 * math.pi * 4800 * t) * 0.05 + math.sin(2 * math.pi * 5200 * t) * 0.03)

    # Koplo beat in Scene 2 (5.3s to 12.0s)
    bpm = 138
    beat_dur = 60.0 / bpm
    koplo_start = 5.2
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

    # Save instrumental background track
    bg_wav = os.path.join(SCRIPT_DIR, "bg_music.wav")
    with wave.open(bg_wav, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        raw = bytearray()
        for s in master:
            clamped = max(-1.0, min(1.0, s))
            raw.extend(struct.pack('<h', int(clamped * 32767)))
        wf.writeframes(raw)

    # Process individual voices with ffmpeg filters and mix with background track
    rt_wav = os.path.join(VOICES_DIR, "pak_rt.wav")
    hansip_wav = os.path.join(VOICES_DIR, "hansip.wav")
    poci_wav = os.path.join(VOICES_DIR, "pociman.wav")
    kunti_wav = os.path.join(VOICES_DIR, "kunti.wav")
    master_wav = os.path.join(SCRIPT_DIR, "master_audio.wav")

    # Filter graph mixing:
    # Pak RT starts at 0.5s, pitched down (tired, panting deep voice)
    # Hansip starts at 3.3s, energetic friendly pitch
    # Pociman starts at 5.8s, pitched up chipmunk cheerful voice
    # Kunti starts at 8.7s, pitched up feminine voice with reverb echo
    cmd = [
        "ffmpeg", "-y",
        "-i", bg_wav,
        "-i", rt_wav,
        "-i", hansip_wav,
        "-i", poci_wav,
        "-i", kunti_wav,
        "-filter_complex",
        "[1:a]asetrate=44100*0.88,atempo=1/0.88,adelay=500|500,volume=1.4[v1];" +
        "[2:a]asetrate=44100*1.08,atempo=1/1.08,adelay=3300|3300,volume=1.3[v2];" +
        "[3:a]asetrate=44100*1.42,atempo=1/1.42,adelay=5800|5800,volume=1.5[v3];" +
        "[4:a]asetrate=44100*1.30,atempo=1/1.30,aecho=0.8:0.85:35:0.35,adelay=8700|8700,volume=1.4[v4];" +
        "[0:a][v1][v2][v3][v4]amix=inputs=5:duration=first:dropout_transition=2[aout]",
        "-map", "[aout]",
        "-ar", str(SAMPLE_RATE),
        "-ac", "2",
        master_wav
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
        (cx + sway, df_cy - 20),     # Top peak
        (cx + 17 + sway, df_cy),     # Right corner
        (cx + sway, df_cy + 19),     # Bottom point
        (cx - 17 + sway, df_cy)      # Left corner
    ], fill="#758392", outline=outline_color)

    # --- EXPRESSIVE JOYFUL FACE (matching drawFaceKuntiJoy from game.js) ---
    eye_y = df_cy - 3
    # Smiling curved eyes (arches inside diamond face)
    draw.arc([cx - 12 + sway, eye_y - 6, cx - 2 + sway, eye_y + 4], 190, 350, fill="#1e1b18", width=3)
    draw.arc([cx + 2 + sway, eye_y - 6, cx + 12 + sway, eye_y + 4], 190, 350, fill="#1e1b18", width=3)

    # Rosy pink blush cheeks
    draw.ellipse([cx - 13 + sway, eye_y + 5, cx - 6 + sway, eye_y + 12], fill="#f43f5e")
    draw.ellipse([cx + 6 + sway, eye_y + 5, cx + 13 + sway, eye_y + 12], fill="#f43f5e")

    # Happy open smiling mouth with pink tongue
    draw.chord([cx - 7 + sway, eye_y + 4, cx + 7 + sway, eye_y + 16], 0, 180, fill="#f43f5e", outline=outline_color, width=2)
    draw.ellipse([cx - 3 + sway, eye_y + 10, cx + 3 + sway, eye_y + 15], fill="#fca5a5")

    # Waving dancing arm in shroud cloth
    arm_wave = math.sin(t * 18) * 20
    draw.line([(cx - 24 + sway, py - 8), (cx - 52 + sway, py - 42 + arm_wave)], fill=shroud_color, width=12)
    draw.ellipse([cx - 58 + sway, py - 48 + arm_wave, cx - 44 + sway, py - 34 + arm_wave], fill=shroud_color, outline=outline_color, width=2)

def draw_kuntilanak(draw, cx, cy, t):
    float_y = cy + math.sin(t * 4.5) * 14
    sway = math.sin(t * 9) * 14

    # Radiant lilac aura glow & sparkles (matching drawKuntilanakRescue from game.js)
    draw.ellipse([cx - 68, float_y - 68, cx + 68, float_y + 68], fill="#3b0764")
    draw.ellipse([cx - 54, float_y - 54, cx + 54, float_y + 54], fill="#581c87")
    for i in range(6):
        sa = t * 3.5 + i * (math.pi * 2 / 6)
        sx = cx + math.cos(sa) * 60
        sy = float_y + math.sin(sa) * 50
        draw.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill="#d8b4fe")
        draw.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill="#fef08a")

    # Cascading Midnight Hair (#1e1b18 with #3e352d outline)
    hair_sway = math.sin(t * 5) * 10
    draw.polygon([
        (cx - 10, float_y - 45),
        (cx - 40 + hair_sway, float_y + 10),
        (cx - 34 + hair_sway, float_y + 85),
        (cx - 10 + hair_sway, float_y + 70),
        (cx + 8, float_y - 20)
    ], fill="#1e1b18", outline="#3e352d")

    # Flowing White Dress with Lilac hem (#f8fafc with #c084fc hem, matching game.js)
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

    # Cute pale waving ghost hands (#fef3c7)
    arm_sway = math.sin(t * 10) * 10
    draw.rounded_rectangle([cx + 10, float_y - 6 + arm_sway, cx + 42, float_y + 3 + arm_sway], radius=4, fill="#fef3c7", outline="#3e352d", width=2)
    draw.rounded_rectangle([cx - 42, float_y - 12 - arm_sway, cx - 10, float_y - 3 - arm_sway], radius=4, fill="#fef3c7", outline="#3e352d", width=2)

    # Cute Pale Porcelain Face (#fef3c7, outline #3e352d)
    draw.ellipse([cx - 15, float_y - 48, cx + 15, float_y - 18], fill="#fef3c7", outline="#3e352d", width=2)

    # Big Anime Chibi Eyes with White Catchlight Glints (matching game.js)
    draw.ellipse([cx - 11, float_y - 40, cx - 3, float_y - 28], fill="#1e1b18")
    draw.ellipse([cx + 3, float_y - 40, cx + 11, float_y - 28], fill="#1e1b18")
    draw.ellipse([cx - 9, float_y - 39, cx - 6, float_y - 34], fill="#ffffff")
    draw.ellipse([cx + 5, float_y - 39, cx + 8, float_y - 34], fill="#ffffff")

    # Rosy Blushing Cheeks & Cheerful Red Smile
    draw.ellipse([cx - 13, float_y - 28, cx - 6, float_y - 22], fill="#f472b6")
    draw.ellipse([cx + 6, float_y - 28, cx + 13, float_y - 22], fill="#f472b6")
    draw.chord([cx - 5, float_y - 26, cx + 5, float_y - 19], 0, 180, fill="#dc2626", outline="#3e352d", width=1)

# --- 3. Scene 1 Renderer (Pos Ronda Kampung) ---
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

    # Pak RT (Left Bench, Slumped & Panting - matching drawPakRT from game.js)
    rt_x = pr_x + 160
    rt_panting = math.sin(t * 8) * 6
    # Body (Batik #92400e with gold pattern dots #f59e0b)
    draw.rectangle([rt_x - 30, 360 - rt_panting, rt_x + 30, 435], fill="#92400e", outline="#451a03", width=2)
    for bx, by in [(rt_x - 16, 375 - rt_panting), (rt_x + 16, 375 - rt_panting), (rt_x, 395 - rt_panting), (rt_x - 16, 415 - rt_panting), (rt_x + 16, 415 - rt_panting)]:
        draw.ellipse([bx - 4, by - 4, bx + 4, by + 4], fill="#f59e0b")
    # Sarung / Trousers (#1e293b matching game.js)
    draw.rectangle([rt_x - 34, 425, rt_x + 34, 465], fill="#1e293b", outline="#0f172a", width=2)
    # Head & Peci (Skin #fed7aa, Peci #1e1b18 matching drawPakRTHead)
    draw.ellipse([rt_x - 20, 315 - rt_panting, rt_x + 20, 360 - rt_panting], fill="#fed7aa", outline="#3e352d", width=2)
    draw.rounded_rectangle([rt_x - 22, 300 - rt_panting, rt_x + 22, 324 - rt_panting], radius=4, fill="#1e1b18", outline="#0f172a", width=2)
    # Big Bushy Black Mustache (#262626) & Tired Panting Face (#7f1d1d)
    draw.ellipse([rt_x - 14, 342 - rt_panting, rt_x + 14, 354 - rt_panting], fill="#262626")
    draw.line([(rt_x - 15, 332 - rt_panting), (rt_x - 5, 336 - rt_panting)], fill="#0f172a", width=2) # tired eyes
    draw.line([(rt_x + 5, 336 - rt_panting), (rt_x + 15, 332 - rt_panting)], fill="#0f172a", width=2)
    draw.chord([rt_x - 7, 350 - rt_panting, rt_x + 7, 359 - rt_panting], 0, 180, fill="#7f1d1d")
    # Sweat drops popping off head
    sw_drop = (t * 40) % 25
    draw.ellipse([rt_x + 26, 315 + sw_drop, rt_x + 34, 326 + sw_drop], fill="#38bdf8")

    # Hansip (Right Bench, Ngopi - matching drawHansip from game.js)
    hs_x = pr_x + 640
    # Linmas Dark Green Uniform (#166534)
    draw.rectangle([hs_x - 28, 360, hs_x + 28, 435], fill="#166534", outline="#14532d", width=2)
    # White cross-belt (#f8fafc) and brass badge (#facc15)
    draw.rectangle([hs_x - 30, 385, hs_x + 30, 393], fill="#f8fafc", outline="#cbd5e1", width=1)
    draw.ellipse([hs_x - 6, 385, hs_x + 6, 393], fill="#facc15")
    # Linmas Trousers (#14532d)
    draw.rectangle([hs_x - 28, 435, hs_x + 28, 465], fill="#14532d", outline="#0f172a", width=2)

    # Head & Linmas Green Cap with Black Visor & Gold Badge (matching drawHansipHead)
    draw.ellipse([hs_x - 20, 315, hs_x + 20, 360], fill="#fed7aa", outline="#3e352d", width=2)
    draw.rounded_rectangle([hs_x - 22, 300, hs_x + 22, 322], radius=4, fill="#14532d", outline="#0f172a", width=2)
    draw.rectangle([hs_x - 24, 320, hs_x + 6, 325], fill="#0f172a") # black visor brim
    draw.ellipse([hs_x - 4, 306, hs_x + 4, 314], fill="#facc15") # golden emblem badge
    # Cheerful Face with Eyes & Gold Tooth in Mouth
    draw.ellipse([hs_x - 12, 330, hs_x - 4, 338], fill="#ffffff", outline="#3e352d")
    draw.ellipse([hs_x - 10, 332, hs_x - 6, 336], fill="#0f172a")
    draw.ellipse([hs_x + 4, 330, hs_x + 12, 338], fill="#ffffff", outline="#3e352d")
    draw.ellipse([hs_x + 6, 332, hs_x + 10, 336], fill="#0f172a")
    draw.chord([hs_x - 10, 342, hs_x + 10, 356], 0, 180, fill="#7f1d1d", outline="#3e352d", width=2)
    draw.rectangle([hs_x + 2, 343, hs_x + 6, 347], fill="#facc15") # signature gold tooth!

    # Pos Ronda Name Sign
    draw.rounded_rectangle([pr_x + pr_w // 2 - 120, pr_y + 20, pr_x + pr_w // 2 + 120, pr_y + 55], radius=6, fill="#0f172a", outline="#facc15", width=2)
    draw.text((pr_x + pr_w // 2 - 100, pr_y + 26), "POS RONDA RT 04 / RW 07", font=FONT_LABEL, fill="#fef08a")

    # Speech Bubbles according to timing
    if 0.5 <= t < 3.2:
        draw_speech_bubble(draw, rt_x + 30, 275, "Pak RT (Kelelahan):", "Waduh... napas gue abis! Pocong zaman now larinya kayak atlet! Hosh...", "bottom")
    elif 3.3 <= t < 5.4:
        draw_speech_bubble(draw, hs_x - 30, 275, "Hansip Linmas (Ngopi Santai):", "Udah Pak RT, ngopi tubruk dulu... sambil comot pisang gorengnya! ☕🍌", "bottom")

# --- 4. Scene 2 Renderer (TPU Kramat Jati Koplo Dance) ---
def render_scene_2(draw, t):
    t_scene = t - 5.5

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
    draw.text((gate_x - 220, 185), "TPU KAMPUNG SERAM • KRAMAT JATI GAIB", font=FONT_BANNER, fill="#fef08a")

    # Iron Gate Doors (Closed & Padlocked)
    draw.rectangle([gate_x - 330, 260, gate_x + 330, 500], fill=None, outline="#1e293b", width=4)
    for gx in range(gate_x - 310, gate_x + 330, 35):
        draw.line([(gx, 260), (gx, 500)], fill="#334155", width=3)
        draw.polygon([(gx - 6, 260), (gx + 6, 260), (gx, 245)], fill="#0f172a") # spikes
    # Big Rusty Padlock in center
    draw.rounded_rectangle([gate_x - 20, 360, gate_x + 20, 405], radius=6, fill="#ca8a04", outline="#78350f", width=3)
    draw.arc([gate_x - 14, 340, gate_x + 14, 370], 180, 360, fill="#78350f", width=4)
    draw.text((gate_x - 12, 410), "TERKUNCI AMAN", font=FONT_LABEL, fill="#facc15")

    # Graveyard Ground & Fog
    draw.rectangle([0, 480, W, H], fill="#0f172a")
    for fx in range(0, W, 140):
        fog_w = 200 + math.sin(t_scene * 3 + fx) * 30
        draw.ellipse([fx - 30, 465, fx + fog_w, 530], fill="#3b0764")

    # Big Stone Gravestone / Nisan (Center-Left)
    nisan_x, nisan_y = gate_x - 90, 480
    draw.rounded_rectangle([nisan_x - 65, nisan_y - 120, nisan_x + 65, nisan_y], radius=30, fill="#475569", outline="#0f172a", width=3)
    draw.text((nisan_x - 22, nisan_y - 95), "R. I. P", font=FONT_TITLE, fill="#cbd5e1")
    draw.text((nisan_x - 45, nisan_y - 60), "1240 - 2026", font=FONT_BUBBLE_SUB, fill="#94a3b8")
    # Red flower petals at base
    for fpx in [-40, -15, 10, 35]:
        draw.ellipse([nisan_x + fpx, nisan_y - 10, nisan_x + fpx + 12, nisan_y + 2], fill="#ef4444")

    # Characters Peeking and Dancing behind / beside Nisan!
    # Pociman dancing right beside the gravestone
    draw_pociman(draw, gate_x - 10, 440, t_scene, is_dancing=True)

    # Mbak Kuntilanak floating and dancing next to Pociman
    draw_kuntilanak(draw, gate_x + 135, 390, t_scene)

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
    if 5.8 <= t < 8.7:
        draw_speech_bubble(draw, gate_x - 10, 245, "Pociman (Joget Koplo Santai):", "Daaaa warga kampung! Makasih udah diajak senam malam! Asik, tarik sis, semongkooo!", "bottom")
    elif 8.8 <= t < 11.8:
        draw_speech_bubble(draw, gate_x + 135, 230, "Mbak Kuntilanak (Centil):", "Hihihihi... Besok malam ronda lagi yaa mas-mas hansip!", "bottom")

# --- 5. Main Execution: Render All Frames & Encode Video ---
def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    audio_file = build_master_audio()

    print(f"Rendering {TOTAL_FRAMES} frames ({DURATION}s @ {FPS}fps)...")
    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / FPS
        img = Image.new("RGB", (W, H), "#000000")
        draw = ImageDraw.Draw(img)

        if t < 5.5:
            render_scene_1(draw, t)
        else:
            render_scene_2(draw, t)

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
