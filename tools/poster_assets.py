"""Pre-renders the static layers of public/poster/ so the screen only moves finished images (GPU transforms).

  bg.jpg        gradient + dark glow + camo texture, 1080x1920 (was CSS gradient + blur(112px) + SVG noise with mix-blend)
  row.png       one strip of blurred "2/10" in Higed, wide enough to loop (was 17 live text rows under a blur + mask)
  word.png      KACHA HAUS in Higed with the pale chrome gradient (was SVG text with gradient fill + clipPath)
  word-lit.png  the same letters in white, shown through the moving light band
  layout.json   letter boxes and sizes read by index.html

Run:  python tools/poster_assets.py   (needs Pillow)
"""
import json, pathlib, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/poster'; FONT = str(ROOT / 'src/assets/higed.ttf')
W, H = 1080, 1920
# The Figma frame is 960x1200; on the 9:16 screen it is drawn 1.5x (1440x1800) at (-180, 120) so the model fills the height.
FX, FY, FS = -180, 120, 1.5
def fx(x): return FX + x * FS
def fy(y): return FY + y * FS
CAP_TOP = round(fy(90))                                           # KACHA HAUS caps start where the Figma caps do

def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
def hexc(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))

# ---- background: black -> sage gradient, glow, camo blobs (multiply, 50%)
sage = hexc('#81987c')
bg = Image.new('RGB', (W, H))
px = bg.load(); d = ImageDraw.Draw(bg)
for y in range(H):
    t = y / H
    t0, t1 = FY / H, fy(.34615 * 1200) / H                          # Figma: black at the frame top -> sage at 34.6%
    c = (0, 0, 0) if t <= t0 else sage if t >= t1 else lerp((0, 0, 0), sage, (t - t0) / (t1 - t0))
    d.line([(0, y), (W, y)], fill=c)
glow = Image.new('L', (W, H), 0); ImageDraw.Draw(glow).ellipse([fx(0), fy(282), fx(878), fy(282 + 964)], fill=255)
glow = glow.filter(ImageFilter.GaussianBlur(100 * FS))
bg = Image.composite(Image.new('RGB', (W, H), hexc('#373737')), bg, glow)
random.seed(7)
def noise(cell):
    small = Image.new('L', (W // cell + 2, H // cell + 2)); small.putdata([random.randrange(256) for _ in range(small.width * small.height)])
    return small.resize((small.width * cell, small.height * cell), Image.BICUBIC).crop((0, 0, W, H))
n = Image.blend(noise(8), noise(3), .4)
blobs = n.point(lambda v: 255 if v > 130 else 0).filter(ImageFilter.GaussianBlur(.6))
dark = Image.new('RGB', (W, H), (74, 89, 71))                    # #4a5947, the camo ink
layer = Image.composite(ImageChops.multiply(bg, dark), bg, blobs)
bg = Image.blend(bg, layer, .5)
bg.save(OUT / 'bg.jpg', quality=88, optimize=True, progressive=True)

# ---- 2/10 strip: Higed 128px, black, blurred 5px; strip = whole repeats so it loops seamlessly
f = ImageFont.truetype(FONT, 128)
unit_txt = '2/10 '; unit = f.getlength(unit_txt)
reps = 1
while unit * reps < 2 * W + 200: reps += 1
loop_w = unit * reps
strip_w = int(loop_w * 2) + 4                                     # two loops wide: x runs over [-loop_w, 0]
strip = Image.new('L', (strip_w, 160), 0); sd = ImageDraw.Draw(strip)
x = 0.0
while x < strip_w:
    sd.text((x, 16), unit_txt, font=f, fill=255); x += unit
strip = strip.filter(ImageFilter.GaussianBlur(4)).point(lambda v: min(255, round(v * 1.2)))   # matches CSS blur(5px) on live text
row = Image.new('RGBA', strip.size, (0, 0, 0, 0)); row.putalpha(strip)
row.save(OUT / 'row.png', optimize=True)

# ---- KACHA HAUS: fitted to 960 px wide, caps start at CAP_TOP
text = 'KACHA HAUS'; size = 100
size = 100 * 960 / ImageFont.truetype(FONT, 100).getlength(text)
fw = ImageFont.truetype(FONT, round(size))
tw = fw.getlength(text); left = (W - tw) / 2
x0, y0, x1, y1 = fw.getbbox(text)                                  # y0 = cap top offset from the draw origin
PAD = 24; boxH = (y1 - y0) + 2 * PAD
mask = Image.new('L', (W, boxH), 0)
ImageDraw.Draw(mask).text((left, PAD - y0), text, font=fw, fill=255)
stops = [(0, '#c9d3c6'), (.14, '#eef1ec'), (.27, '#b3c1b0'), (.4, '#e4e0ea'), (.53, '#c3cfc0'), (.66, '#f2f4f0'), (.8, '#aebdab'), (.92, '#e6ece8'), (1, '#c5d0c2')]
grad = Image.new('RGB', (W, boxH)); gd = ImageDraw.Draw(grad)
for xx in range(W):
    t = xx / (W - 1)
    for k in range(len(stops) - 1):
        if stops[k][0] <= t <= stops[k + 1][0]:
            c = lerp(hexc(stops[k][1]), hexc(stops[k + 1][1]), (t - stops[k][0]) / (stops[k + 1][0] - stops[k][0])); break
    gd.line([(xx, 0), (xx, boxH)], fill=c)
word = grad.convert('RGBA'); word.putalpha(mask.point(lambda v: v * 240 // 255))
word.save(OUT / 'word.png', optimize=True)
lit = Image.new('RGBA', (W, boxH), (255, 255, 255, 0)); lit.putalpha(mask.point(lambda v: v * 215 // 255))
lit.save(OUT / 'word-lit.png', optimize=True)

letters = []
for i, ch in enumerate(text):
    if ch == ' ': continue
    a = left + fw.getlength(text[:i]); b = left + fw.getlength(text[:i + 1])
    letters.append([round(a - 6), round(b - a + 12)])                # a little overlap so no glyph edge is cut
json.dump({'top': CAP_TOP - PAD, 'h': boxH, 'left': round(left), 'width': round(tw), 'letters': letters,
           'rowLoop': loop_w, 'rowH': 160}, open(OUT / 'layout.json', 'w'))
print('ok', {p.name: p.stat().st_size for p in OUT.glob('*') if p.suffix in ('.jpg', '.png')}, 'font', round(size), 'loop', round(loop_w))
