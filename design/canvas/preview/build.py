import json, re, sys, pathlib
src = pathlib.Path('../project/DmDemo.dc.html').read_text()
tpl = src[src.index('<x-dc>')+6: src.index('</x-dc>')]
code = re.search(r'class Component extends DCLogic \{[\s\S]*\n\}\n(?=</script>)', src).group(0)
html = r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>DmDemo local preview</title>
<style>body{margin:0;font-family:system-ui;background:#E4E4DF} .wrap{padding:24px;display:flex;flex-direction:column;gap:24px} .panel{padding:20px;border-radius:14px}</style></head><body>
<div class="wrap" id="root"></div>
<script>
const TPL = __TPL__;
class DCLogic { constructor(props){ this.props = props; this.state = undefined; } setState(o){ this.state = Object.assign({}, this.state, o); this.__render && this.__render(); } forceUpdate(){ this.__render && this.__render(); } }
__CODE__
const tplDoc = new DOMParser().parseFromString('<body>' + TPL + '</body>', 'text/html');
const helmet = tplDoc.querySelector('helmet');
if (helmet) { helmet.querySelectorAll('style,link').forEach(n => document.head.appendChild(n.cloneNode(true))); helmet.remove(); }
const rootTpl = tplDoc.body;
function look(path, scopes){ path = path.trim(); if (path === 'true') return true; if (path === 'false') return false; const parts = path.split('.'); for (let i = scopes.length-1; i >= 0; i--){ if (scopes[i] && parts[0] in scopes[i]){ let v = scopes[i][parts[0]]; for (const p of parts.slice(1)) v = v == null ? undefined : v[p]; return v; } } return undefined; }
function interp(str, scopes){ const whole = str.match(/^\s*\{\{([^}]+)\}\}\s*$/); if (whole) return look(whole[1], scopes); return str.replace(/\{\{([^}]+)\}\}/g, (_, p) => { const v = look(p, scopes); return v == null ? '' : String(v); }); }
const EV = { onClick:'click', onPointerDown:'pointerdown', onPointerUp:'pointerup', onPointerLeave:'pointerleave', onContextMenu:'contextmenu', onKeyDown:'keydown', onChange:'input', onMouseMove:'mousemove' };
function render(node, scopes, out){
  for (const ch of node.childNodes){
    if (ch.nodeType === 3){ out.appendChild(document.createTextNode(interp(ch.nodeValue, scopes) ?? '')); continue; }
    if (ch.nodeType !== 1) continue;
    const tag = ch.localName;
    if (tag === 'sc-if'){ if (interp(ch.getAttribute('value'), scopes)) render(ch, scopes, out); continue; }
    if (tag === 'sc-for'){ const list = interp(ch.getAttribute('list'), scopes) || []; const as = ch.getAttribute('as'); list.forEach((it, i) => render(ch, scopes.concat([{ [as]: it, $index: i }]), out)); continue; }
    const el = ch.namespaceURI === 'http://www.w3.org/2000/svg' ? document.createElementNS(ch.namespaceURI, tag) : document.createElement(tag);
    for (const a of ch.attributes){
      const name = a.name.startsWith('on') ? Object.keys(EV).find(k => k.toLowerCase() === a.name) : null;
      if (name){ const fn = interp(a.value, scopes); if (typeof fn === 'function') el.addEventListener(EV[name], fn); continue; }
      const v = interp(a.value, scopes);
      if (a.name === 'value' && tag === 'input'){ el.value = v ?? ''; continue; }
      if (a.name === 'autofocus') continue;
      el.setAttribute(a.name, v == null ? '' : String(v));
    }
    render(ch, scopes, el); out.appendChild(el);
  }
}
const PANELS = __PANELS__;
const root = document.getElementById('root');
PANELS.forEach(p => {
  const box = document.createElement('section'); box.className = 'panel';
  box.style.cssText = `background:${p.bg};color:${p.ink};--muted:${p.muted};--ink:${p.ink};--bg:${p.bg};--line-strong:${p.line};width:${p.w}px`;
  const h = document.createElement('p'); h.textContent = p.label; h.style.cssText = 'margin:0 0 12px;font:600 12px monospace;letter-spacing:.08em'; box.appendChild(h);
  const host = document.createElement('div'); box.appendChild(host); root.appendChild(box);
  const c = new Component(p.props);
  c.__render = () => { const ae = document.activeElement; const wasInput = ae && ae.tagName === 'INPUT' && host.contains(ae); host.innerHTML = ''; render(rootTpl, [c.renderVals()], host); if (wasInput) { const i = host.querySelector('input'); if (i){ i.focus(); i.selectionStart = i.selectionEnd = i.value.length; } } };
  c.__render(); c.componentDidMount && c.componentDidMount();
});
</script></body></html>'''
L = dict(bg='#F6F6F3', ink='#121417', muted='#50555E', line='#8A8D93')
D = dict(bg='#0E1013', ink='#E8E8E3', muted='#A3A8B1', line='#646A74')
sets = {
 'light': [dict(L, label='LIGHT · live', w=1040, props=dict(theme='light', mode='still', seed=9)), dict(L, label='LIGHT · menu + tray', w=1040, props=dict(theme='light', mode='menu', seed=9)), dict(L, label='LIGHT · album uploading', w=1040, props=dict(theme='light', mode='album', seed=4))],
 'dark': [dict(D, label='DARK · live', w=1040, props=dict(theme='dark', mode='still', seed=9)), dict(D, label='DARK · voice sent', w=1040, props=dict(theme='dark', mode='voice', seed=7)), dict(D, label='DARK · offline', w=1040, props=dict(theme='dark', mode='offline', seed=13))],
 'mobile': [dict(L, label='MOBILE · user tab', w=390, props=dict(theme='light', mode='reply', seed=9)), dict(D, label='MOBILE · engineer tab', w=390, props=dict(theme='dark', mode='video', seed=5, tab='engineer'))],
}
for name, panels in sets.items():
    out = html.replace('__TPL__', json.dumps(tpl)).replace('__CODE__', code).replace('__PANELS__', json.dumps(panels))
    pathlib.Path(f'dm-{name}.html').write_text(out)
print('ok')
