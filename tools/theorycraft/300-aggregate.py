#!/usr/bin/env python3
"""Aggregate 300's JSONL: python3 -I 300-aggregate.py <300 jsonl> [<295 jsonl dir>]"""
import sys, json, glob, os
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
mono = [r for r in rows if 'monotone' in r]
rows = [r for r in rows if 'pick' in r]
ref = {}
if len(sys.argv) > 2:
    for f in glob.glob(os.path.join(sys.argv[2], '*.jsonl')):
        for l in open(f):
            if l.strip():
                x = json.loads(l)
                if 'pick' in x: ref[(x['label'], x['pick'])] = x
EPS = 0.005
def fmt(b): return f"{b['damage']/1e6:.2f}M/{(b.get('silver') or 0)/1e6:.3f}M"
print('label | pick | burn | shipped | descent rf (bill) k types | frontier rf | arch rf (295) | visited | ms | path')
up = eq = 0; gains = []; dvf = [0, 0, 0]; ms = []
for r in rows:
    d = r['descent']; F = r.get('frontier') or {}
    R = ref.get((r['label'], r['pick']))
    frf = F.get('rf') if F else (R['frontier']['rf'] if R else None)
    arf = R['arch']['rf'] if R else None
    sh = d.get('shape') or r['shippedShape']
    if d['rf'] > EPS: up += 1; gains.append(d['rf'])
    else: eq += 1
    if frf is not None:
        dvf[0 if d['rf'] > frf + EPS else (2 if frf > d['rf'] + EPS else 1)] += 1
    ms.append(d['ms'])
    note = '' if not R else ('' if R['shipped']['damage'] == r['shipped']['damage'] else ' [shipped differs from 295]')
    print(f"{r['label'][:40]:40} | {r['pick']:12} | {r['burn']:2} | {fmt(r['shipped'])} k{r['shippedShape']['k'] if r['shippedShape'] else '-'} | +{d['rf']:.2f} {fmt(d['bill'])} k{sh['k'] if sh else '-'} | "
          f"{'' if frf is None else '+%.2f' % frf} | {'' if arf is None else '+%.2f' % arf} | {d['visited']} | {d['ms']} | {' > '.join(d['path'])}{note}")
n = len(rows)
print(f'\nstops {n}: descent improves {up}, equal {eq}, worse 0 (added candidate, gated); gains sum {sum(gains):.2f} max {max(gains or [0]):.2f}')
print(f'descent vs frontier: better {dvf[0]} same {dvf[1]} worse {dvf[2]}')
if ms: print(f'descent ms per stop: mean {sum(ms)/n:.0f} median {sorted(ms)[n//2]} max {max(ms)}')
for m in mono:
    print(f"monotone {m['monotone']}: ★a best played {fmt(m['played'])} vs ★b best {fmt(m['best'])} rate {m['rate']:+.2f}")
