"""Gera os assets da Vynt a partir das fotos geradas (pasta de origem → public/)."""
import sys, json, os
import numpy as np
from PIL import Image, ImageFilter

SRC, PUB = sys.argv[1], sys.argv[2]
TARGET = np.array([245, 243, 239], np.float32)  # #F5F3EF

def gain_for(arr):
    edge = np.concatenate([arr[:40, :40].reshape(-1, 3), arr[:40, -40:].reshape(-1, 3)])
    return TARGET / edge.mean(0)

def norm(img, g):
    a = np.asarray(img.convert("RGB")).astype(np.float32) * g
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def bbox(arr):
    bg = np.concatenate([arr[:, :50], arr[:, -50:]], 1).mean(1)
    d = np.sqrt(((arr.astype(np.float32) - bg[:, None]) ** 2).sum(2))
    ys, xs = np.where(d > 45)
    return xs.min(), ys.min(), xs.max(), ys.max()

def save(img, path, w, q=82):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if img.width > w:
        img = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
    img.save(path, "WEBP", quality=q, method=6)

products = ["orbita","trama","basalto","serra","pulso","quadra","bloco","varzea","neblina","asfalto","linha","ferro"]
meta = {}
for slug in products:
    raw = Image.open(f"{SRC}/{slug}.jpg").convert("RGB")
    arr = np.asarray(raw)
    g = gain_for(arr)
    img = norm(raw, g)
    x0, y0, x1, y1 = bbox(arr)
    W, H = img.size
    out = f"{PUB}/produtos/{slug}"
    save(img, f"{out}/1.webp", 1400)
    # detalhe: metade da frente, 4:5
    cw = int((x1 - x0) * 0.62); ch = int(cw * 1.25)
    cx = x1 - cw + int(cw * 0.06); cy = max(0, (y0 + y1) // 2 - ch // 2)
    save(img.crop((cx, cy, min(W, cx + cw), min(H, cy + ch))), f"{out}/2.webp", 1400)
    # detalhe: calcanhar
    cx = max(0, x0 - int(cw * 0.06))
    save(img.crop((cx, cy, cx + cw, cy + ch)), f"{out}/3.webp", 1400)
    # miniatura quadrada para sacola/admin
    # quadrado do tamanho da largura, centrado no tênis, sem sair da foto
    side = W; my = (y0 + y1) // 2
    top = max(0, min(H - side, my - side // 2))
    save(img.crop((0, top, side, top + side)), f"{out}/thumb.webp", 400)
    meta[slug] = {"bbox": [int(x0), int(y0), int(x1), int(y1)], "size": [W, H]}

# editoriais
for name, w in [("rua", 2200), ("entrega", 1400)]:
    raw = Image.open(f"{SRC}/{name}.jpg").convert("RGB")
    save(raw, f"{PUB}/editorial/{name}.webp", w, 80)
    # versão de celular da rua (recorte vertical no meio)
    if name == "rua":
        W, H = raw.size; cw = int(H * 0.8)
        save(raw.crop(((W - cw) // 2 + int(W * 0.03), 0, (W + cw) // 2 + int(W * 0.03), H)), f"{PUB}/editorial/rua-m.webp", 1000, 80)

print(json.dumps(meta))
