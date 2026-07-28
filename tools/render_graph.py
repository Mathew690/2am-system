"""
Render the real link structure of an Obsidian vault as an SVG.

Not a mockup: nodes are the actual .md files, edges are the actual [[wikilinks]],
node size is real degree. Deterministic layout (fixed seed) so re-runs are stable.
"""
import io, os, re, math, random, sys

VAULT = sys.argv[1]
OUT = sys.argv[2]

W, H = 1600, 1100
PAD = 110
BG = "#0d0d0f"
GREEN = "#22c55e"
GREEN_SOFT = "#86efac"

# ---------- parse ----------
LINK = re.compile(r"\[\[([^\]|#]+)")
CODE = re.compile(r"`[^`]*`")

# walk subfolders too — Obsidian's own graph includes them, so ours must
paths = {}
for root, dirs, files in os.walk(VAULT):
    dirs[:] = [d for d in dirs if not d.startswith(".")]
    for fn in files:
        if fn.endswith(".md"):
            paths[fn[:-3]] = os.path.join(root, fn)

names = sorted(paths)
idx = {n: i for i, n in enumerate(names)}
edges = set()

for n in names:
    body = io.open(paths[n], encoding="utf-8").read()
    body = CODE.sub("", body)  # ignore wikilink examples inside backticks
    for m in LINK.findall(body):
        t = m.strip()
        if t in idx and t != n:
            a, b = sorted((idx[n], idx[t]))
            edges.add((a, b))

edges = sorted(edges)
N = len(names)
deg = [0] * N
for a, b in edges:
    deg[a] += 1
    deg[b] += 1

# ---------- force-directed layout (Fruchterman-Reingold) ----------
random.seed(7)
pos = [[random.uniform(-1, 1), random.uniform(-1, 1)] for _ in range(N)]
area = 1.0
k = math.sqrt(area / N) * 1.9
temp = 0.30

for step in range(900):
    disp = [[0.0, 0.0] for _ in range(N)]

    for i in range(N):
        for j in range(i + 1, N):
            dx = pos[i][0] - pos[j][0]
            dy = pos[i][1] - pos[j][1]
            d2 = dx * dx + dy * dy
            if d2 < 1e-9:
                dx, dy, d2 = random.uniform(-1e-3, 1e-3), random.uniform(-1e-3, 1e-3), 1e-6
            d = math.sqrt(d2)
            f = (k * k) / d
            disp[i][0] += dx / d * f
            disp[i][1] += dy / d * f
            disp[j][0] -= dx / d * f
            disp[j][1] -= dy / d * f

    for a, b in edges:
        dx = pos[a][0] - pos[b][0]
        dy = pos[a][1] - pos[b][1]
        d = math.hypot(dx, dy) or 1e-6
        f = (d * d) / k
        disp[a][0] -= dx / d * f
        disp[a][1] -= dy / d * f
        disp[b][0] += dx / d * f
        disp[b][1] += dy / d * f

    for i in range(N):
        # gentle pull to centre keeps the cluster tight instead of sprawling
        disp[i][0] -= pos[i][0] * 0.55
        disp[i][1] -= pos[i][1] * 0.55
        d = math.hypot(*disp[i]) or 1e-6
        pos[i][0] += disp[i][0] / d * min(d, temp)
        pos[i][1] += disp[i][1] / d * min(d, temp)

    temp *= 0.985

# ---------- fit to canvas ----------
# Scale on the longer axis, then size the canvas to the content's own aspect
# ratio. Fixing W/H up front letterboxes the graph and is what makes it read
# as "small" — the nodes were fine, the empty margin wasn't.
xs = [p[0] for p in pos]
ys = [p[1] for p in pos]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
spanx, spany = (maxx - minx) or 1, (maxy - miny) or 1
s = 1250.0 / max(spanx, spany)
P = [((p[0] - minx) * s, (p[1] - miny) * s) for p in pos]

maxdeg = max(deg) or 1

def radius(i):
    return 7 + 15 * (deg[i] / maxdeg) ** 0.75

# pad for node radius + the label that hangs below each node
PAD_X, PAD_TOP, PAD_BOT = 120, 60, 70
W = int(spanx * s + 2 * PAD_X)
H = int(spany * s + PAD_TOP + PAD_BOT)
P = [(x + PAD_X, y + PAD_TOP) for x, y in P]

# ---------- emit ----------
o = []
o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">')
o.append('<defs><filter id="g" x="-70%" y="-70%" width="240%" height="240%">'
         '<feGaussianBlur stdDeviation="7" result="b"/>'
         '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
o.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')

for a, b in edges:
    x1, y1 = P[a]
    x2, y2 = P[b]
    o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
             f'stroke="{GREEN}" stroke-opacity="0.26" stroke-width="1.6"/>')

for i, n in enumerate(names):
    x, y = P[i]
    r = radius(i)
    hub = deg[i] >= maxdeg * 0.55
    o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{GREEN_SOFT if hub else GREEN}" '
             f'fill-opacity="{0.95 if hub else 0.8}"{" filter=\"url(#g)\"" if hub else ""}/>')

for i, n in enumerate(names):
    x, y = P[i]
    fs = 15 if deg[i] >= maxdeg * 0.55 else 13
    o.append(f'<text x="{x:.1f}" y="{y + radius(i) + fs + 3:.1f}" text-anchor="middle" '
             f'font-size="{fs}" fill="#c9cbd1" fill-opacity="0.82">{n}</text>')

o.append('</svg>')

io.open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(o))
print(f"nodes={N} edges={len(edges)} maxdeg={maxdeg} -> {OUT}")
