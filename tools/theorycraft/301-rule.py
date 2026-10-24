#!/usr/bin/env python3
"""301's rule check: python3 -I 301-rule.py <301 jsonl> <300 jsonl...>. Window rule:
out = round(5 * (1 - flatQ)) when flatQ < 0.95 (k = m - out, +/-1); silver saver with flatQ >= 0.95: k in [m-3, m]; else k = m."""
import sys, json
t = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
d = {}
for f in sys.argv[2:]:
    for l in open(f):
        r = json.loads(l)
        if 'pick' in r: d[(r['label'], r['pick'])] = r
hit = 0; n = 0; vis_all = 0; vis_win = 0; worse = 0
for r in t:
    m, q = r['m'], r['flatQueueOverStop']
    if q < 0.95:
        o = round(5 * (1 - q)); W = range(max(1, m - o - 1), min(m, m - o + 1) + 1)
    elif r['pick'] == 'silver-saver': W = range(m - 3, m + 1)
    else: W = range(m, m + 1)
    ok = r['kWin'] in W; n += 1; hit += ok
    x = d[(r['label'], r['pick'])]['descent']
    pk = {int(k): v for k, v in x['perK'].items()}
    bestk = (x['shape'] or {}).get('k') if x['rf'] > 0.005 else None
    lost = bestk is not None and bestk not in W
    worse += lost
    vis_all += x['visited']
    # visits a window-restricted descent needs: the 8 seeds, then the levels from m down to min(W) (2k children each), none below
    lv = 8; k = m
    while k > min(W) and lv < x['visited']:
        lv += 2 * k; k -= 1
    vis_win += min(lv, x['visited'])
    print(f"{r['case']:7} {r['pick'][:6]} m{m} flatQ {q:.2f} W[{min(W)},{max(W)}] kWin {r['kWin']:2} {'ok' if ok else 'MISS'} descent best k {bestk} {'LOST' if lost else ''} visits {x['visited']}->{min(lv, x['visited'])}")
print(f'window holds the winner {hit}/{n}; descent gains lost by pruning {worse}; visits {vis_all} -> {vis_win} ({100*(1-vis_win/vis_all):.0f} % saved)')
