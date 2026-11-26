# Phin: a Vietnamese drip-coffee filter (cà phê phin) that delivers messages one drop at a time.
INK='#121417'; MET='#D7DADF'; MET2='#B4B9C1'; MET3='#8E949D'; AMB='#F5B041'; COF='#5A321A'; MILK='#EAD9B5'
def phin(eyes='open', drop=1, cup=0.5, extra='', mouth='smile', arm=''):
    s=[]
    # cup (glass) with condensed milk + coffee
    s.append('<path d="M17 47h30l-2.6 13.2a3 3 0 0 1-3 2.4H22.6a3 3 0 0 1-3-2.4z" fill="#FFFFFF" fill-opacity=".14" stroke="#C9CDD3" stroke-width="1.4"/>')
    s.append(f'<path d="M19.6 {61-3}h24.8l-.5 2.4a2 2 0 0 1-2 1.6H22.1a2 2 0 0 1-2-1.6z" fill="{MILK}"/>')
    if cup>0:
        top=58-11*cup
        s.append(f'<path d="M{19.6-(58-top)*0.0} {top}h24.8l-.9 {58-top}H20.5z" fill="{COF}"/>')
    # drip
    if drop==1: s.append(f'<path d="M32 40.5c1.6 2.4 2.4 3.8 2.4 5a2.4 2.4 0 0 1-4.8 0c0-1.2.8-2.6 2.4-5z" fill="{AMB}"/>')
    # base plate (rests on cup)
    s.append(f'<rect x="12" y="43.5" width="40" height="4" rx="2" fill="{MET2}"/><rect x="29" y="40" width="6" height="3.6" rx="1" fill="{MET3}"/>' if False else f'<rect x="12" y="43.5" width="40" height="4" rx="2" fill="{MET2}"/>')
    # body
    s.append(f'<rect x="18" y="17" width="28" height="27" rx="4" fill="{MET}"/><rect x="21" y="19.5" width="3" height="21" rx="1.5" fill="#FFFFFF" fill-opacity=".7"/><rect x="18" y="40" width="28" height="4" fill="{MET2}" fill-opacity=".6"/>')
    # lid hat (tilted slightly), knob
    s.append(f'<g transform="rotate(-8 32 14)"><rect x="17" y="12.5" width="30" height="5" rx="2.5" fill="{MET2}"/><rect x="29.5" y="7.8" width="5" height="5.5" rx="2" fill="{MET3}"/></g>')
    # face
    if eyes=='open': s.append(f'<ellipse cx="27" cy="28" rx="2.1" ry="2.7" fill="{INK}"/><ellipse cx="37" cy="28" rx="2.1" ry="2.7" fill="{INK}"/><circle cx="27.7" cy="27" r=".8" fill="#fff"/><circle cx="37.7" cy="27" r=".8" fill="#fff"/>')
    if eyes=='closed': s.append(f'<path d="M24.8 28.5q2.2 1.8 4.4 0M34.8 28.5q2.2 1.8 4.4 0" fill="none" stroke="{INK}" stroke-width="1.6" stroke-linecap="round"/>')
    if eyes=='happy': s.append(f'<path d="M24.8 29q2.2-2.6 4.4 0M34.8 29q2.2-2.6 4.4 0" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>')
    if eyes=='dizzy': s.append(f'<path d="M25.4 26.4l3.2 3.2M28.6 26.4l-3.2 3.2M35.4 26.4l3.2 3.2M38.6 26.4l-3.2 3.2" stroke="{INK}" stroke-width="1.6" stroke-linecap="round"/>')
    s.append(f'<circle cx="23.6" cy="32.6" r="1.7" fill="{AMB}" fill-opacity=".55"/><circle cx="40.4" cy="32.6" r="1.7" fill="{AMB}" fill-opacity=".55"/>')
    m={'smile':'M29.6 33q2.4 2.2 4.8 0','o':'M32 32.2a1.5 1.8 0 1 0 .01 0','flat':'M30 34h4','wavy':'M29.4 34q1.3-1.4 2.6 0t2.6 0'}[mouth]
    s.append(f'<path d="{m}" fill="none" stroke="{INK}" stroke-width="1.6" stroke-linecap="round"/>')
    s.append(arm); s.append(extra)
    return ''.join(s)
poses=[
 ('Hi, I\'m Phin', phin(arm=f'<path d="M46 30q5-1 6.5-6" fill="none" stroke="{MET3}" stroke-width="2.4" stroke-linecap="round"/><circle cx="52.8" cy="23.4" r="2" fill="{MET2}"/>')),
 ('Sending… (one drop at a time)', phin(eyes='open',mouth='o',cup=.3,extra=f'<circle cx="48" cy="12" r="1.2" fill="{AMB}"/><circle cx="52" cy="12" r="1.2" fill="{AMB}" fill-opacity=".6"/><circle cx="56" cy="12" r="1.2" fill="{AMB}" fill-opacity=".3"/>')),
 ('Delivered ✓✓ (cup full)', phin(eyes='happy',drop=0,cup=1,extra=f'<path d="M50 8l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="{AMB}"/><path d="M10 14l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="{AMB}"/>')),
 ('Offline: napping, drops queued', phin(eyes='closed',drop=0,cup=.3,mouth='flat',extra=f'<text x="47" y="15" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="7" fill="{MET}">z</text><text x="52" y="9" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="9" fill="{MET}">Z</text>')),
 ('404: spilled', phin(eyes='dizzy',drop=0,cup=0,mouth='wavy',extra=f'<path d="M50 60c3-1 6-.6 9 .4" stroke="{COF}" stroke-width="2.4" stroke-linecap="round" fill="none"/>')),
]
open('poses.py','w')
import json; json.dump(poses,open('poses.json','w'))
# sheet
o=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="#E4E4DF"/>']
o.append(f'<rect x="20" y="20" width="560" height="560" rx="40" fill="{INK}"/><g transform="translate(44 44) scale(8)">{poses[0][1]}</g>')
for i,(name,g) in enumerate(poses[1:]):
    x=600+(i%2)*290; y=20+(i//2)*290
    o.append(f'<rect x="{x}" y="{y}" width="270" height="270" rx="24" fill="{INK}"/><g transform="translate({x+7} {y+7}) scale(4)">{g}</g>')
# icon: head only crop on ink tile
icon=f'<rect width="64" height="64" rx="14" fill="{INK}"/><g transform="translate(-6 -2) scale(1.2)">{poses[0][1].split("<path d=\"M46 30")[0]}</g>'
open('icon.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{icon}</svg>')
y=620
o.append(f'<g transform="translate(20 {y}) scale(4)">{icon}</g>')
for k,(s,x) in enumerate([(1,300),(.5,390),(.25,450)]):
    o.append(f'<g transform="translate({x} {y}) scale({s})">{icon}</g>')
o.append('</svg>'); open('sheet.svg','w').write(''.join(o))
