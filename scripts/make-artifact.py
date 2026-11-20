"""Turn dist/ into a single-page artifact (inline CSS/JS) at artifact/index.html, copying media beside it."""
import glob, os, re, shutil
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist, out = os.path.join(root, 'dist'), os.path.join(root, 'artifact')
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
html = open(os.path.join(dist, 'index.html')).read()
css = ''.join(open(f).read() for f in glob.glob(os.path.join(dist, 'assets', '*.css')))
js = ''.join(open(f).read() for f in glob.glob(os.path.join(dist, 'assets', '*.js'))).replace('</script', '<\\/script')
html = re.sub(r'<link rel="stylesheet"[^>]*assets/[^>]*>', '', html)
html = re.sub(r'<script type="module"[^>]*assets/[^>]*></script>', '', html)
head = re.search(r'<head>(.*)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>|<meta name="viewport"[^>]*>', '', head)
head = re.sub(r'<title>.*?</title>', '<title>KYS.CUTZ</title>', head)
page = head.strip() + f'\n<style>{css}</style>\n' + body.strip() + f'\n<script type="module">{js}</script>\n'
open(os.path.join(out, 'index.html'), 'w').write(page)
for f in glob.glob(os.path.join(dist, 'work', '*')) + [os.path.join(dist, p) for p in ('hero-poster.jpg', 'hero-reel.mp4', 'hero-reel.webm')]:
    if os.path.exists(f):
        d = os.path.join(out, os.path.relpath(f, dist)); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy(f, d)
print(len(page), sorted(os.listdir(out)))
