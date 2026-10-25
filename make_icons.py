# Generates the Android launcher icons into the Capacitor android project (run by the GitHub workflow).
from PIL import Image, ImageDraw
import os
RES = 'android/app/src/main/res'
def art(sz, fg_only=False):
    S = sz*4
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    if not fg_only:
        d = ImageDraw.Draw(im)
        for y in range(S):
            t = y/S
            d.line([(0, y), (S, y)], fill=(int(67+32*t), int(56+46*t), int(202+39*t), 255))
    d = ImageDraw.Draw(im)
    c = S*0.5; r = S*0.2; cx = cy = c-S*0.04; w = int(S*0.055)
    d.ellipse([cx-r, cy-r, cx+r, cy+r], outline='white', width=w)
    d.line([cx+r*0.72, cy+r*0.72, cx+r*1.45, cy+r*1.45], fill='white', width=w)
    pl = r*0.55
    d.polygon([(cx-pl*0.45, cy-pl*0.7), (cx-pl*0.45, cy+pl*0.7), (cx+pl*0.75, cy)], fill='white')
    return im.resize((sz, sz), Image.LANCZOS)
def mask(l, shape):
    m = Image.new('L', (l*4, l*4), 0); d = ImageDraw.Draw(m)
    if shape == 'round': d.ellipse([0, 0, l*4-1, l*4-1], fill=255)
    else: d.rounded_rectangle([0, 0, l*4-1, l*4-1], radius=l*4//5, fill=255)
    return m.resize((l, l), Image.LANCZOS)
for k, (l, f) in {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}.items():
    d = f'{RES}/mipmap-{k}'; os.makedirs(d, exist_ok=True)
    ic = art(l)
    for name, shape in (('ic_launcher.png', 'sq'), ('ic_launcher_round.png', 'round')):
        o = Image.new('RGBA', (l, l), (0, 0, 0, 0)); o.paste(ic, (0, 0), mask(l, shape)); o.save(f'{d}/{name}')
    fg = art(f, True); o = Image.new('RGBA', (f, f), (0, 0, 0, 0))
    s = fg.resize((int(f*.66), int(f*.66)), Image.LANCZOS); o.paste(s, ((f-s.width)//2, (f-s.height)//2), s); o.save(f'{d}/ic_launcher_foreground.png')
open(f'{RES}/values/ic_launcher_background.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#4F46E5</color>\n</resources>\n')
print('icons written')
