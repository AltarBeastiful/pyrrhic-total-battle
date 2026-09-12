import re, json, sys
from jsconv import convert, match_bracket
targets = {'ts-bundle.js': ['bc','vc','cl','gl','xo','vo','Co','Yd','zn','uc','dc','Nd'], 'ts-Home-BBHzMhJU.js': ['Yd','zn','uc','dc','Nd','Ol']}
for fn, names in targets.items():
    src=open(fn,encoding='utf-8').read()
    tag=fn.replace('ts-','').split('-')[0]
    for name in names:
        for m in re.finditer(r'[,;=(]\s*'+re.escape(name)+r'\s*=\s*(Object\.freeze\()?([\[{])', src):
            start=m.start(2); end=match_bracket(src,start)
            lit=src[start:end+1]
            if len(lit)<40: continue
            try:
                obj=json.loads(convert(lit))
            except Exception as e:
                print(f"FAIL {tag}.{name} {lit[:120]!r} :: {e}"); continue
            n=len(obj) if isinstance(obj,(list,dict)) else 0
            print(f"OK {tag}.{name} n={n} :: {json.dumps(obj)[:300]}")
            json.dump(obj,open(f'data/{tag}.{name}.json','w'),indent=1)
            break
