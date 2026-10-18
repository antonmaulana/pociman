import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720

def get_font(size, bold=True):
    try:
        path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_bubble(draw, x, y, text, font, fill="#ffffff", text_fill="#0f172a", stroke="#facc15"):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 16, 10
    rx, ry = x - tw // 2, y - th // 2
    draw.rounded_rectangle([rx - pad_x, ry - pad_y, rx + tw + pad_x, ry + th + pad_y], radius=14, fill=fill, outline=stroke, width=3)
    # triangle tail
    draw.polygon([(x - 8, ry + th + pad_y), (x + 8, ry + th + pad_y), (x - 2, ry + th + pad_y + 12)], fill=fill, outline=stroke)
    draw.text((rx, ry), text, font=font, fill=text_fill)

print("Test render module loaded")
