"""Builds screen/index.html from template.html (inlines the drop logo path) and stamps a build id.
build.json holds the same id; open screens see it change and reload themselves smoothly."""
import re, json, hashlib, pathlib
here = pathlib.Path(__file__).parent
path = ' '.join(re.search(r'<path d="([^"]*)"', (here/'logo.svg').read_text()).group(1).split())
html = (here/'template.html').read_text().replace('__PATH__', path)
build = hashlib.sha1(html.encode()).hexdigest()[:10]
(here/'index.html').write_text(html.replace('__BUILD__', build))
(here/'build.json').write_text(json.dumps({'build': build}) + '\n')
print('ok', build)
