"""Builds screen/index.html from template.html (inlines the drop logo path)."""
import re, pathlib
here = pathlib.Path(__file__).parent
path = ' '.join(re.search(r'<path d="([^"]*)"', (here/'logo.svg').read_text()).group(1).split())
(here/'index.html').write_text((here/'template.html').read_text().replace('__PATH__', path))
print('ok')
