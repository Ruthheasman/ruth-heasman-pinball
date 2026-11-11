#!/usr/bin/env python3
"""Build the game as ONE self-contained HTML file, for minting as an HTML ordinal.

Everything is inlined: code, three.js, fonts, artwork and music. The file makes no network requests.

  python3 ordinal/build.py                        all eight tables, full-quality music
  python3 ordinal/build.py --tables dread         one table
  python3 ordinal/build.py --kbps 96              re-encode the music smaller (needs ffmpeg)
  python3 ordinal/build.py --no-music             leave the songs out
  python3 ordinal/build.py --each --max-mb 9.5    one file per table, each kept under 9.5 MB by lowering
                                                  the music bitrate only as far as needed (needs ffmpeg)

Output goes to ordinal/dist/. The songs and artwork inside the file stay copyright (see LICENSE-MEDIA.md).
"""
import argparse, base64, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIME = {'.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2'}

def data_uri(path: pathlib.Path) -> str:
    return 'data:%s;base64,%s' % (MIME[path.suffix], base64.b64encode(path.read_bytes()).decode('ascii'))

STEPS = [256, 224, 192, 160, 128, 112, 96, 80, 64]

def all_table_ids():
    return re.findall(r"\{ id: '([a-z]+)', title:", (ROOT / 'src/themes.js').read_text())

def bundle(ids, kbps=0, music=True):
    """Return the single-file HTML for these tables. kbps=0 keeps the songs as they are."""
    assets = {}
    for t in ids:
        assets['art/%s.webp' % t] = data_uri(ROOT / 'art' / (t + '.webp'))
        assets['thumbs/%s.webp' % t] = data_uri(ROOT / 'thumbs' / (t + '.webp'))
    if music:
        with tempfile.TemporaryDirectory() as tmp:
            for t in ids:
                src = ROOT / 'music' / (t + '.mp3')
                if not src.exists():
                    print('No song for %s, leaving it silent' % t, file=sys.stderr); continue
                if kbps:
                    dst = pathlib.Path(tmp) / (t + '.mp3')
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-map', '0:a', '-map_metadata', '0', '-codec:a', 'libmp3lame', '-b:a', '%dk' % kbps, str(dst)], check=True)
                    src = dst
                assets['music/%s.mp3' % t] = data_uri(src)

    html = (ROOT / 'index.html').read_text()
    fonts = (ROOT / 'vendor/fonts/fonts.css').read_text()
    fonts = re.sub(r'url\(([^)]+\.woff2)\)', lambda m: 'url(%s)' % data_uri(ROOT / 'vendor/fonts' / m.group(1)), fonts)
    css = fonts + '\n' + (ROOT / 'src/style.css').read_text()
    html = html.replace('<link rel="stylesheet" href="vendor/fonts/fonts.css">\n', '').replace('<link rel="stylesheet" href="src/style.css">', '<style>\n%s</style>' % css)

    # values are base64 data URIs, so plain double quotes are safe
    boot = '<script>window.WH_TABLES=[%s];window.WH_ASSETS={%s};</script>\n' % (','.join('"%s"' % t for t in ids), ','.join('"%s":"%s"' % kv for kv in assets.items()))
    state = {'first': True}
    def inline(m):
        code = (ROOT / m.group(1)).read_text().replace('</script', '<\\/script')
        out = (boot if state['first'] else '') + '<script>\n%s\n</script>' % code
        state['first'] = False
        return out
    html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
    left = re.findall(r'(?:src|href)="(?!https?:|data:|#)([^"]+)"', html)
    if left:
        raise SystemExit('Still referencing files: %s' % left)
    return html

def song_kbps(t):
    src = ROOT / 'music' / (t + '.mp3')
    if not src.exists(): return 0
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=bit_rate', '-of', 'csv=p=0', str(src)], capture_output=True, text=True).stdout.strip()
    return int(out) // 1000 if out.isdigit() else 0

def fit(ids, cap_bytes):
    """Build at the songs' own quality, then step the bitrate down only until the file fits the cap."""
    html = bundle(ids)
    if len(html.encode()) <= cap_bytes: return html, 0
    top = max(song_kbps(t) for t in ids)
    for k in [k for k in STEPS if k < top]:
        html = bundle(ids, kbps=k)
        if len(html.encode()) <= cap_bytes: return html, k
    raise SystemExit('%s does not fit under %.1f MB even at %d kbps' % (', '.join(ids), cap_bytes / 1e6, STEPS[-1]))

def write(html, name):
    out = ROOT / 'ordinal/dist' / name
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    return out

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--tables', default='', help='comma-separated table ids (default: all)')
    ap.add_argument('--kbps', type=int, default=0, help='re-encode music at this bitrate (default: keep the files as they are)')
    ap.add_argument('--no-music', action='store_true')
    ap.add_argument('--each', action='store_true', help='write one file per table instead of one file holding them all')
    ap.add_argument('--max-mb', type=float, default=0, help='keep each file under this many megabytes (1 MB = 1,000,000 bytes)')
    a = ap.parse_args()

    all_ids = all_table_ids()
    ids = [t.strip() for t in a.tables.split(',') if t.strip()] or all_ids
    bad = [t for t in ids if t not in all_ids]
    if bad:
        print('Unknown table id(s): %s. Known: %s' % (', '.join(bad), ', '.join(all_ids)), file=sys.stderr); return 2

    for group in ([[t] for t in ids] if a.each else [ids]):
        if a.max_mb and not a.no_music and not a.kbps:
            html, k = fit(group, int(a.max_mb * 1e6))
        else:
            html, k = bundle(group, kbps=a.kbps, music=not a.no_music), a.kbps
            if a.max_mb and len(html.encode()) > a.max_mb * 1e6:
                print('%s is over %.1f MB' % (', '.join(group), a.max_mb), file=sys.stderr); return 1
        name = 'ruth-heasman-pinball%s%s.html' % ('' if len(group) == len(all_ids) else '-' + '-'.join(group), '-%dk' % k if k else '-silent' if a.no_music else '')
        out = write(html, name)
        print('%-34s %5.2f MB  music: %s' % (out.name, out.stat().st_size / 1e6, 'none' if a.no_music else '%d kbps' % k if k else 'original quality'))
    return 0

if __name__ == '__main__':
    sys.exit(main())
