"""Pre-renders the posters in public/poster/ so the shop player only moves finished images (GPU transforms, no per-frame
blur, mask, blend or SVG). Compositions come from the Kacha Haus Figma file (key yaMMqRwyH9jsbDL4jEMa9X):
  p1 = Frame 5 (26:77) pink fur · p2 = Frame 3 (17:30) grape cup · p3 = Frame 4 (26:61) silver jacket

Each poster folder gets:
  bg.jpg        background: gradient, glow(s) under the rows, texture — 1080x1920
  row.png       one strip of the blurred background word ("2/10", "เปรี้ยว หวาน", "โคตรคูล"), two loops wide
  over.webp     (optional) static layer above the rows: a glow, or the blurred ghost of the model
  cut.webp      the model / product cut-out from Figma, drawn 1.5x
  word.png      KACHA HAUS in Higed with the chrome colours · word-lit.png = same letters in white (light sweep)
  layout.json   positions read by index.html

Sources (Figma cut-outs, git-ignored): tools/poster-src/p1-cut.png, p2-cut.png, p3-cut.png
Run:  python tools/poster_assets.py   (needs Pillow)
"""
import json, pathlib, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/poster'; SRC = ROOT / 'tools/poster-src'
HIGED = str(ROOT / 'src/assets/higed.ttf'); THAI = ('/System/Library/Fonts/Thonburi.ttc', 1)   # Thonburi Bold
W, H = 1080, 1920
# The Figma frames are 960x1200; on the 9:16 screen they are drawn 1.5x (1440x1800) at (-180, 120): the subject fills the height.
FX, FY, FS = -180, 120, 1.5
def fx(x): return FX + x * FS
def fy(y): return FY + y * FS
CAP_TOP = round(fy(90))                                           # KACHA HAUS caps start where the Figma caps do

def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
def hexc(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))

POSTERS = {
  'p1': dict(  # sage, camo, "2/10" black rows, pale chrome word in front of her
    bg=('flat', '#81987c'), under=[((0, 282, 878, 964), '#373737', 1.0)], over=None, ghost=None,
    texture=((74, 89, 71), 8, 3, .5),
    rows=dict(text='2/10 ', font='higed', color=(0, 0, 0), alpha=1.0, fade=(0, 1920, .35, .85)),
    word=dict(stops=['#c9d3c6', '#eef1ec', '#b3c1b0', '#e4e0ea', '#c3cfc0', '#f2f4f0', '#aebdab', '#e6ece8', '#c5d0c2'], alpha=.94),
    behind=False, logo='#81987C'),
  'p2': dict(  # black -> grey, lavender glow over the rows, "เปรี้ยว หวาน" rows, silver word behind the cup
    bg=('frame', '#000000', '#666666'), under=[], over=[((206, 285, 548, 824), '#EEC7FF', .6)], ghost=None,
    texture=((58, 52, 62), 6, 2, .35),
    rows=dict(text='เปรี้ยว หวาน ', font='thai', color=(0, 0, 0), alpha=.3, fade=(fy(99), 1920, 0, 1)),
    word=dict(stops=['#e9e9ee', '#ffffff', '#c9c9d3', '#f4eefa', '#d8d8e0', '#ffffff', '#c2c2cc', '#eef0f6', '#dcdce4'], alpha=.9),
    behind=True, logo='#FFFFFF'),
  'p3': dict(  # black -> grey, blurred ghost of her at 50%, grey glow, red "โคตรคูล" rows, red word in front
    bg=('frame', '#000000', '#666666'), under=[], over=[((184, 447, 652, 827), '#D9D9D9', 1.0)],
    ghost=((111, -307, 1206, 1507), .5, 7.5),
    texture=((40, 40, 40), 6, 2, .35),
    rows=dict(text='โคตรคูล ', font='thai', color=(255, 103, 103), alpha=.5, fade=(fy(174), 1920, 0, 1)),
    word=dict(stops=['#d90f14', '#ff3b3b', '#b0060b', '#ff2a2a', '#c80c10', '#ff4a4a', '#a8050a', '#f52525', '#cc1014'], alpha=.95),
    behind=False, logo='#FF0000'),
}

def noise(cell, seed):
    random.seed(seed)
    small = Image.new('L', (W // cell + 2, H // cell + 2)); small.putdata([random.randrange(256) for _ in range(small.width * small.height)])
    return small.resize((small.width * cell, small.height * cell), Image.BICUBIC).crop((0, 0, W, H))

def glow_layer(boxes):
    """Figma ellipses with a 100px layer blur, drawn 1.5x; returns an RGBA layer."""
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for (x, y, w, h), col, op in boxes:
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).ellipse([fx(x), fy(y), fx(x + w), fy(y + h)], fill=round(255 * op))
        m = m.filter(ImageFilter.GaussianBlur(100 * FS))
        out = Image.alpha_composite(out, Image.merge('RGBA', (*Image.new('RGB', (W, H), hexc(col)).split(), m)))
    return out

def build(name, P):
    out = OUT / name; out.mkdir(parents=True, exist_ok=True)
    # background
    bg = Image.new('RGB', (W, H)); d = ImageDraw.Draw(bg)
    for y in range(H):
        if P['bg'][0] == 'flat': c = hexc(P['bg'][1])
        else:
            t = min(1, max(0, (y - FY) / (H - FY)))                 # Figma: frame top -> frame bottom
            c = lerp(hexc(P['bg'][1]), hexc(P['bg'][2]), t)
        d.line([(0, y), (W, y)], fill=c)
    if P['under']: bg = Image.alpha_composite(bg.convert('RGBA'), glow_layer(P['under'])).convert('RGB')
    ink, c1, c2, op = P['texture']                                   # camo / grain blobs, multiplied in
    blobs = Image.blend(noise(c1, 7), noise(c2, 8), .4).point(lambda v: 255 if v > 130 else 0).filter(ImageFilter.GaussianBlur(.6))
    bg = Image.blend(bg, Image.composite(ImageChops.multiply(bg, Image.new('RGB', (W, H), ink)), bg, blobs), op)
    bg.save(out / 'bg.jpg', quality=88, optimize=True, progressive=True)

    # rows strip
    R = P['rows']
    f = ImageFont.truetype(HIGED, 128) if R['font'] == 'higed' else ImageFont.truetype(THAI[0], 110, index=THAI[1])
    unit = f.getlength(R['text']); reps = 1
    while unit * reps < 2 * W + 200: reps += 1
    loop_w = unit * reps; strip_w = int(loop_w * 2) + 4
    strip = Image.new('L', (strip_w, 160), 0); sd = ImageDraw.Draw(strip); x = 0.0
    top = 16 if R['font'] == 'higed' else 4
    while x < strip_w: sd.text((x, top), R['text'], font=f, fill=255); x += unit
    strip = strip.filter(ImageFilter.GaussianBlur(4)).point(lambda v: min(255, round(v * 1.2 * R['alpha'])))
    row = Image.new('RGBA', strip.size, R['color'] + (0,)); row.putalpha(strip); row.save(out / 'row.png', optimize=True)

    # static layer above the rows: glows and / or the ghost
    over = None
    if P['over']: over = glow_layer(P['over'])
    if P['ghost']:
        (gx, gy, gw, gh), gop, gblur = P['ghost']
        cut = Image.open(SRC / f'{name}-cut.png').convert('RGBA').resize((round(gw * FS), round(gh * FS)), Image.LANCZOS)
        cut = cut.filter(ImageFilter.GaussianBlur(gblur * FS)); a = cut.getchannel('A').point(lambda v: round(v * gop)); cut.putalpha(a)
        layer = Image.new('RGBA', (W + 2000, H + 2000), (0, 0, 0, 0)); layer.alpha_composite(cut, (round(fx(gx)) + 1000, round(fy(gy)) + 1000))
        ghost = layer.crop((1000, 1000, 1000 + W, 1000 + H))
        over = ghost if over is None else Image.alpha_composite(ghost, over)
    for old in ('over.png', 'over.webp'):
        if (out / old).exists(): (out / old).unlink()
    if over: over.save(out / 'over.webp', 'WEBP', quality=82, method=6)

    # cut-out at 1.5x
    src = SRC / f'{name}-cut.png'
    if src.exists(): Image.open(src).convert('RGBA').resize((1440, 1800), Image.LANCZOS).save(out / 'cut.webp', 'WEBP', quality=86, method=6)

    # KACHA HAUS: Higed, 960 px wide, caps at CAP_TOP
    text = 'KACHA HAUS'; size = 100 * 960 / ImageFont.truetype(HIGED, 100).getlength(text)
    fw = ImageFont.truetype(HIGED, round(size)); tw = fw.getlength(text); left = (W - tw) / 2
    x0, y0, x1, y1 = fw.getbbox(text); PAD = 24; boxH = (y1 - y0) + 2 * PAD
    mask = Image.new('L', (W, boxH), 0); ImageDraw.Draw(mask).text((left, PAD - y0), text, font=fw, fill=255)
    stops = P['word']['stops']; grad = Image.new('RGB', (W, boxH)); gd = ImageDraw.Draw(grad)
    for xx in range(W):
        t = xx / (W - 1) * (len(stops) - 1); k = min(int(t), len(stops) - 2)
        gd.line([(xx, 0), (xx, boxH)], fill=lerp(hexc(stops[k]), hexc(stops[k + 1]), t - k))
    word = grad.convert('RGBA'); word.putalpha(mask.point(lambda v: round(v * P['word']['alpha']))); word.save(out / 'word.png', optimize=True)
    lit = Image.new('RGBA', (W, boxH), (255, 255, 255, 0)); lit.putalpha(mask.point(lambda v: v * 215 // 255)); lit.save(out / 'word-lit.png', optimize=True)
    letters = []
    for i, ch in enumerate(text):
        if ch == ' ': continue
        a = left + fw.getlength(text[:i]); b = left + fw.getlength(text[:i + 1])
        letters.append([round(a - 6), round(b - a + 12)])

    # logo in the poster's colour (Figma k_symbol, 50px at (26, 1133) in the 960 frame -> fixed corner on the screen)
    logo = (ROOT / 'tools/k-symbol.svg').read_text().replace('#81987C', P['logo'])
    (out / 'logo.svg').write_text(logo)

    fa, fb, amin, amax = R['fade']
    json.dump({'top': CAP_TOP - PAD, 'h': boxH, 'left': round(left), 'width': round(tw), 'letters': letters,
               'rowLoop': loop_w, 'rowH': 160, 'rowFade': [fa, fb, amin, amax], 'over': bool(over), 'behind': P['behind']},
              open(out / 'layout.json', 'w'))
    print(name, {p.name: p.stat().st_size for p in out.glob('*')})

for n, p in POSTERS.items(): build(n, p)
