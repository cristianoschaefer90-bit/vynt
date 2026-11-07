"""Recorta as peças da vista explodida em PNGs transparentes (GrabCut por peça)."""
import sys, json
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
rgb = np.asarray(Image.open(src).convert("RGB"))
im = rgb.astype(np.int32)
H, W, _ = im.shape
bg = np.concatenate([im[:, :60], im[:, -60:]], 1).mean(1)
d = np.sqrt(((im - bg[:, None, :]) ** 2).sum(2))
coarse = ndi.binary_closing(ndi.binary_opening(d > 14, iterations=2), iterations=10)
lab, n = ndi.label(coarse)
sizes = ndi.sum(coarse, lab, range(1, n + 1))
boxes = []
for i, s in enumerate(sizes):
    if s < 8000: continue
    ys, xs = np.where(lab == i + 1)
    boxes.append([ys.min(), ys.max(), xs.min(), xs.max()])
boxes.sort()
bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
small = cv2.resize(bgr, (W // 2, H // 2))
ds = cv2.resize(d.astype(np.float32), (W // 2, H // 2))
gc = np.full(ds.shape, cv2.GC_PR_BGD, np.uint8)
gc[ds > 10] = cv2.GC_PR_FGD
gc[ds > 40] = cv2.GC_FGD
gc[ds < 4] = cv2.GC_BGD
bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
cv2.grabCut(small, gc, None, bgm, fgm, 5, cv2.GC_INIT_WITH_MASK)
m = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
m = cv2.resize(m * 255, (W, H), interpolation=cv2.INTER_LINEAR) > 127
m = ndi.binary_opening(m, iterations=2)
lab, n = ndi.label(ndi.binary_closing(m, iterations=2))
sizes = ndi.sum(m, lab, range(1, n + 1))
comps = []
for i, s_ in enumerate(sizes):
    if s_ < 6000: continue
    ys, xs = np.where(lab == i + 1)
    comps.append((ys.min(), i + 1))
comps.sort()
meta = []
for k, (_, li) in enumerate(comps):
    base = (lab == li) & (ndi.binary_dilation(d > 22, iterations=4) | (lab == li) & (d > 22))
    base = ndi.binary_opening(base, iterations=2)
    lb, nb = ndi.label(base)
    if nb > 1:
        sz = ndi.sum(base, lb, range(1, nb + 1))
        base = np.isin(lb, [j + 1 for j, v in enumerate(sz) if v > 0.02 * sz.max()])
    filled = ndi.binary_fill_holes(base)
    holes, nh = ndi.label(filled & ~base)
    if nh:
        hs = ndi.sum(filled & ~base, holes, range(1, nh + 1))
        big = np.isin(holes, [j + 1 for j, v in enumerate(hs) if v > 2500])
        filled &= ~big
    mk = filled
    a = cv2.GaussianBlur(mk.astype(np.uint8) * 255, (5, 5), 0)
    ys, xs = np.where(mk)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb, a])[y0:y1, x0:x1]
    Image.fromarray(rgba, "RGBA").save(f"{out}/camada-{k}.png")
    meta.append({"i": k, "y": int(y0), "x": int(x0), "w": int(x1 - x0), "h": int(y1 - y0)})
print(json.dumps({"W": W, "H": H, "pieces": meta}))
