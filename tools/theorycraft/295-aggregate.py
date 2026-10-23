#!/usr/bin/env python3
"""Aggregate 295's JSONL: python3 295-aggregate.py <dir-or-files...>"""
import sys, json, glob, os
files=[]
for a in sys.argv[1:]:
    files += glob.glob(os.path.join(a,'*.jsonl')) if os.path.isdir(a) else [a]
rows=[json.loads(l) for f in sorted(files) for l in open(f) if l.strip()]
rows=[r for r in rows if 'skipped' not in r]
n=len(rows)
EPS=0.005
fi=sum(r['frontier']['rf']>EPS for r in rows)
ai=sum(r['arch']['rf']>EPS for r in rows)
a_beats_f=sum(r['arch']['rf']>r['frontier']['rf']+EPS for r in rows)
f_beats_a=sum(r['frontier']['rf']>r['arch']['rf']+EPS for r in rows)
union=sum(max(r['arch']['rf'],r['frontier']['rf'])>EPS for r in rows)
print(f'stops {n}; frontier-based improves {fi}, archetypes improve {ai}, union improves {union}; archetype > frontier {a_beats_f}, frontier > archetype {f_beats_a}; worse than shipped: 0 by construction')
print('sum gain frontier %.2f archetype %.2f union %.2f' % (sum(r['frontier']['rf'] for r in rows), sum(r['arch']['rf'] for r in rows), sum(max(r['arch']['rf'],r['frontier']['rf']) for r in rows)))
by={}
for r in rows: by.setdefault(r['pick'],[]).append(r)
for k,v in by.items():
    print(k, 'n',len(v),'F>0',sum(x['frontier']['rf']>EPS for x in v),'A>0',sum(x['arch']['rf']>EPS for x in v),'A>F',sum(x['arch']['rf']>x['frontier']['rf']+EPS for x in v))
ta=[r['arch']['genMs']+r['arch']['ms'] for r in rows]
tf=[r['frontier']['genMs']+r['frontier']['ms'] for r in rows]
print('arch ms per stop: mean %.0f median %.0f max %.0f ; frontier-read ms per stop: mean %.0f median %.0f max %.0f' % (sum(ta)/n, sorted(ta)[n//2], max(ta), sum(tf)/n, sorted(tf)[n//2], max(tf)))
print('archetype count: mean %.0f max %d' % (sum(r['arch']['n'] for r in rows)/n, max(r['arch']['n'] for r in rows)))
print()
for r in rows:
    if r['arch']['rf']>EPS or r['frontier']['rf']>EPS:
        print(f"{r['label'][:44]:44} {r['pick']:12} burn {r['burn']:2} ship {r['shipped']['damage']} F +{r['frontier']['rf']:.2f} A +{r['arch']['rf']:.2f}")
