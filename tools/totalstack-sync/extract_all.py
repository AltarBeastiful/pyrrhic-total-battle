import re, json, sys
def match_bracket(s, start):
    depth=0;i=start;instr=None
    while i<len(s):
        c=s[i]
        if instr:
            if c=='\\': i+=2; continue
            if c==instr: instr=None
        else:
            if c in '"\'`': instr=c
            elif c in '[{': depth+=1
            elif c in ']}':
                depth-=1
                if depth==0: return i
        i+=1
    return -1
def js_to_json(t):
    t=re.sub(r'([{,])\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:', r'\1"\2":', t)
    t=re.sub(r"'([^'\\]*)'", r'"\1"', t)
    t=re.sub(r'([\[,:])\s*\.(\d)', r'\g<1>0.\2', t)
    t=re.sub(r'([\[,:])\s*-\.(\d)', r'\g<1>-0.\2', t)
    t=t.replace(':!0',':true').replace(':!1',':false')
    return t
for fn in sys.argv[1:]:
    src=open(fn,encoding='utf-8').read()
    tag=fn.replace('ts-','').split('-')[0]
    for m in re.finditer(r'(?:const|let|var|,)\s*([A-Za-z_$][\w$]*)\s*=\s*([\[{])\s*(?=\{|"[a-zA-Z])', src):
        start=m.start(2); end=match_bracket(src,start)
        if end<0: continue
        lit=src[start:end+1]
        if len(lit)<150: continue
        # quick filter: must contain some data-like key
        if not re.search(r'\b(health|strength|name|label|level|bonus|cost|tier)\b', lit): continue
        try:
            obj=json.loads(js_to_json(lit))
        except Exception as e:
            # Report failures with a hint of what it is
            print(f"FAIL {tag}.{m.group(1)} len={len(lit)} :: {lit[:120]!r} :: {e}")
            continue
        n=len(obj) if isinstance(obj,(list,dict)) else 0
        first=json.dumps(obj[0] if isinstance(obj,list) else dict(list(obj.items())[:2]))[:160]
        print(f"OK   {tag}.{m.group(1)} n={n} :: {first}")
        json.dump(obj,open(f'data/{tag}.{m.group(1)}.json','w'),indent=1)
