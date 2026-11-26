# Render any static .dc.html board locally (no claude.ai sign-in): python3 build_board.py Icon
import re, sys, json, pathlib
name = sys.argv[1]
src = pathlib.Path(f'../project/{name}.dc.html').read_text()
tpl = src[src.index('<x-dc>')+6: src.index('</x-dc>')]
code = re.search(r'class Component extends DCLogic \{[\s\S]*\n\}\n(?=</script>)', src)
code = code.group(0) if code else 'class Component extends DCLogic { renderVals(){ return {}; } }'
b = pathlib.Path('build.py').read_text()
interp = b[b.index('function look('): b.index('const PANELS')]
html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{name} local preview</title><style>body{{margin:0}}</style></head><body><div id="root"></div>
<script>
const TPL = {json.dumps(tpl)};
class DCLogic {{ constructor(p){{ this.props=p||{{}}; }} setState(){{}} forceUpdate(){{}} }}
{code}
const tplDoc = new DOMParser().parseFromString('<body>' + TPL + '</body>', 'text/html');
const helmet = tplDoc.querySelector('helmet');
if (helmet) {{ helmet.querySelectorAll('style,link').forEach(n => document.head.appendChild(n.cloneNode(true))); helmet.remove(); }}
{interp}
const c = new Component({{}}); const vals = c.renderVals();
render(tplDoc.body, [vals], document.getElementById('root'));
</script></body></html>'''
pathlib.Path(f'{name.lower()}.html').write_text(html)
print('wrote', f'{name.lower()}.html')
