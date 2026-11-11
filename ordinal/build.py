#!/usr/bin/env python3
"""Build the game as ONE self-contained HTML file, for minting as an HTML ordinal.

Everything is inlined: code, three.js, fonts, artwork and music. The file makes no network requests.

  python3 ordinal/build.py                        all eight tables, full-quality music
  python3 ordinal/build.py --tables dread         one table
  python3 ordinal/build.py --kbps 96              re-encode the music smaller (needs ffmpeg)
  python3 ordinal/build.py --no-music             leave the songs out

Output goes to ordinal/dist/. The songs and artwork inside the file stay copyright (see LICENSE-MEDIA.md).
"""
import argparse, base64, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIME = {'.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2'}

def data_uri(path: pathlib.Path) -> str:
    return 'data:%s;base64,%s' % (MIME[path.suffix], base64.b64encode(path.read_bytes()).decode('ascii'))

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--tables', default='', help='comma-separated table ids (default: all)')
    ap.add_argument('--kbps', type=int, default=0, help='re-encode music at this bitrate (default: keep the files as they are)')
    ap.add_argument('--no-music', action='store_true')
    ap.add_argument('--out', default='')
    a = ap.parse_args()

    all_ids = re.findall(r"\{ id: '([a-z]+)', title:", (ROOT / 'src/themes.js').read_text())
    ids = [t.strip() for t in a.tables.split(',') if t.strip()] or all_ids
    bad = [t for t in ids if t not in all_ids]
    if bad:
        print('Unknown table id(s): %s. Known: %s' % (', '.join(bad), ', '.join(all_ids)), file=sys.stderr); return 2

    assets = {}
    for t in ids:
        assets['art/%s.webp' % t] = data_uri(ROOT / 'art' / (t + '.webp'))
        assets['thumbs/%s.webp' % t] = data_uri(ROOT / 'thumbs' / (t + '.webp'))
    if not a.no_music:
        with tempfile.TemporaryDirectory() as tmp:
            for t in ids:
                src = ROOT / 'music' / (t + '.mp3')
                if not src.exists():
                    print('No song for %s, leaving it silent' % t, file=sys.stderr); continue
                if a.kbps:
                    dst = pathlib.Path(tmp) / (t + '.mp3')
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-map', '0:a', '-map_metadata', '0', '-codec:a', 'libmp3lame', '-b:a', '%dk' % a.kbps, str(dst)], check=True)
                    src = dst
                assets['music/%s.mp3' % t] = data_uri(src)

    html = (ROOT / 'index.html').read_text()
    fonts = (ROOT / 'vendor/fonts/fonts.css').read_text()
    fonts = re.sub(r'url\(([^)]+\.woff2)\)', lambda m: 'url(%s)' % data_uri(ROOT / 'vendor/fonts' / m.group(1)), fonts)
    css = fonts + '\n' + (ROOT / 'src/style.css').read_text()
    html = html.replace('<link rel="stylesheet" href="vendor/fonts/fonts.css">\n', '').replace('<link rel="stylesheet" href="src/style.css">', '<style>\n%s</style>' % css)

    def js_obj(d):  # values are base64 data URIs, so plain double quotes are safe
        return '{' + ','.join('"%s":"%s"' % (k, v) for k, v in d.items()) + '}'
    boot = '<script>window.WH_TABLES=[%s];window.WH_ASSETS=%s;</script>\n' % (','.join('"%s"' % t for t in ids), js_obj(assets))
    first = True
    def inline(m):
        nonlocal first
        code = (ROOT / m.group(1)).read_text().replace('</script', '<\\/script')
        out = ('' if not first else boot) + '<script>\n%s\n</script>' % code
        first = False
        return out
    html, n = re.subn(r'<script src="([^"]+)"></script>', inline, html)
    left = re.findall(r'(?:src|href)="(?!https?:|data:|#)([^"]+)"', html)
    if left:
        print('Still referencing files: %s' % left, file=sys.stderr); return 1

    name = a.out or 'ruth-heasman-pinball%s%s.html' % ('' if len(ids) == len(all_ids) else '-' + '-'.join(ids), '-%dk' % a.kbps if a.kbps else '-silent' if a.no_music else '')
    out = pathlib.Path(name) if a.out else ROOT / 'ordinal/dist' / name
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print('%s  %.1f MB  tables: %s  scripts inlined: %d' % (out, out.stat().st_size / 1e6, ', '.join(ids), n))
    return 0

if __name__ == '__main__':
    sys.exit(main())
