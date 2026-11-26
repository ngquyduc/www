# Render a .dc.html board locally with nested <dc-import> support (no claude.ai sign-in).
# Usage: python3 build_page.py Home '{"theme":"dark"}' [out-name]
import re, sys, json, pathlib
root = pathlib.Path('../project')
name = sys.argv[1]
props = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
out = sys.argv[3] if len(sys.argv) > 3 else name.lower()
comps = {}
for f in root.glob('*.dc.html'):
    src = f.read_text()
    tpl = src[src.index('<x-dc>') + 6: src.rindex('</x-dc>')]
    m = re.search(r'class Component extends DCLogic \{[\s\S]*\n\}\n(?=</script>)', src)
    code = m.group(0) if m else 'class Component extends DCLogic { renderVals(){ return {}; } }'
    comps[f.name[:-8]] = {'tpl': tpl, 'code': code}
b = pathlib.Path('build.py').read_text()
interp = b[b.index('function look('): b.index('function render(')]
factories = ',\n'.join(f'{json.dumps(k)}: (function(){{ {v["code"]}\n return Component; }})()' for k, v in comps.items())
html = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>__NAME__ preview</title><style>body{margin:0}</style></head><body><div id="root"></div>
<script>
const TPLS = __TPLS__;
class DCLogic { constructor(p){ this.props = p || {}; this.state = undefined; } setState(o){ this.state = Object.assign({}, this.state, o); this.__render && this.__render(); } forceUpdate(){ this.__render && this.__render(); } }
const COMPS = { __FACT__ };
const parsed = {};
function tplOf(n){ if (!parsed[n]) { const d = new DOMParser().parseFromString('<body>' + TPLS[n] + '</body>', 'text/html'); const h = d.querySelector('helmet'); if (h) { h.querySelectorAll('style,link').forEach(x => document.head.appendChild(x.cloneNode(true))); h.remove(); } parsed[n] = d.body; } return parsed[n]; }
__INTERP__
function camel(s){ return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
function mount(n, props, host){
  const C = COMPS[n]; if (!C) { host.textContent = '[missing ' + n + ']'; return; }
  const c = new C(props);
  c.__render = () => { host.innerHTML = ''; render(tplOf(n), [c.renderVals()], host); };
  c.__render(); c.componentDidMount && c.componentDidMount();
}
function render(node, scopes, out){
  for (const ch of node.childNodes){
    if (ch.nodeType === 3){ out.appendChild(document.createTextNode(interp(ch.nodeValue, scopes) ?? '')); continue; }
    if (ch.nodeType !== 1) continue;
    const tag = ch.localName;
    if (tag === 'sc-if'){ if (interp(ch.getAttribute('value'), scopes)) render(ch, scopes, out); continue; }
    if (tag === 'sc-for'){ const list = interp(ch.getAttribute('list'), scopes) || []; const as = ch.getAttribute('as'); list.forEach((it, i) => render(ch, scopes.concat([{ [as]: it, $index: i }]), out)); continue; }
    if (tag === 'dc-import'){ const p = {}; let n = ''; for (const a of ch.attributes){ if (a.name === 'name') n = a.value; else if (!a.name.startsWith('hint-')) p[camel(a.name)] = interp(a.value, scopes); } const host = document.createElement('div'); out.appendChild(host); mount(n, p, host); continue; }
    const el = ch.namespaceURI === 'http://www.w3.org/2000/svg' ? document.createElementNS(ch.namespaceURI, tag) : document.createElement(tag);
    for (const a of ch.attributes){
      const nm = a.name.startsWith('on') ? ['onClick','onPointerDown','onPointerUp','onPointerLeave','onContextMenu','onKeyDown','onChange','onMouseMove'].find(k => k.toLowerCase() === a.name) : null;
      if (nm){ const fn = interp(a.value, scopes); const ev = {onClick:'click',onPointerDown:'pointerdown',onPointerUp:'pointerup',onPointerLeave:'pointerleave',onContextMenu:'contextmenu',onKeyDown:'keydown',onChange:'input',onMouseMove:'mousemove'}[nm]; if (typeof fn === 'function') el.addEventListener(ev, fn); continue; }
      const v = interp(a.value, scopes);
      if (a.name === 'value' && tag === 'input'){ el.value = v ?? ''; continue; }
      el.setAttribute(a.name, v == null ? '' : String(v));
    }
    render(ch, scopes, el); out.appendChild(el);
  }
}
mount(__NAMEJ__, __PROPS__, document.getElementById('root'));
</script></body></html>'''
html = (html.replace('__TPLS__', json.dumps({k: v['tpl'] for k, v in comps.items()}))
        .replace('__FACT__', factories).replace('__INTERP__', interp)
        .replace('__NAMEJ__', json.dumps(name)).replace('__NAME__', name).replace('__PROPS__', json.dumps(props)))
pathlib.Path(f'{out}.html').write_text(html)
print('wrote', f'{out}.html')
