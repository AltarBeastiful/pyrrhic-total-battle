import re, json, sys
IDENT=re.compile(r'[A-Za-z_$][\w$]*')
def convert(s):
    """Tokenize a JS literal and emit JSON. Bare identifiers become "$ref:name". Arrow functions -> raise."""
    out=[];i=0;n=len(s)
    while i<n:
        c=s[i]
        if c in '"\'`':
            q=c;j=i+1;buf=''
            while j<n and s[j]!=q:
                if s[j]=='\\':
                    buf+=s[j:j+2]; j+=2; continue
                buf+=s[j]; j+=1
            i=j+1
            if q=='"': out.append('"'+buf+'"')
            else:
                # unescape \' and re-escape "
                buf=buf.replace("\\'", "'").replace('"','\\"')
                out.append('"'+buf+'"')
            continue
        if c.isspace(): i+=1; continue
        if c in '[]{},:': out.append(c); i+=1; continue
        m=re.match(r'-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?', s[i:])
        if m:
            tok=m.group(0)
            if tok.startswith('.'): tok='0'+tok
            if tok.startswith('-.'): tok='-0'+tok[1:]
            out.append(tok); i+=m.end(); continue
        if s.startswith('!0',i): out.append('true'); i+=2; continue
        if s.startswith('!1',i): out.append('false'); i+=2; continue
        if s.startswith('...',i):
            m2=IDENT.match(s,i+3); out.append('"$spread:'+m2.group(0)+'"'); i=m2.end(); continue
        m=IDENT.match(s,i)
        if m:
            name=m.group(0); j=m.end()
            # key position? next non-space char is ':'
            k=j
            while k<n and s[k].isspace(): k+=1
            if k<n and s[k]==':' and out and out[-1] in '{,':
                out.append('"'+name+'"'); i=j; continue
            if name in ('true','false','null'): out.append(name); i=j; continue
            # value identifier: could be a function call like Oe("x","y") or arrow
            if k<n and s[k]=='(':
                # skip balanced parens
                d=0;p=k
                while p<n:
                    if s[p]=='(': d+=1
                    elif s[p]==')':
                        d-=1
                        if d==0: break
                    p+=1
                out.append('"$call:'+s[i:p+1].replace('"','\\"')+'"'); i=p+1; continue
            if k<n and s.startswith('=>',k): raise ValueError('arrow fn')
            out.append('"$ref:'+name+'"'); i=j; continue
        raise ValueError('unexpected char %r at %d: %s' % (c,i,s[max(0,i-40):i+40]))
    return ''.join(out)

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
if __name__=='__main__':
    for fn in sys.argv[1:]:
        src=open(fn,encoding='utf-8').read()
        tag=fn.replace('ts-','').split('-')[0]
        for m in re.finditer(r'(?:const|let|var|,)\s*([A-Za-z_$][\w$]*)\s*=\s*([\[{])\s*(?=\{|"[a-zA-Z])', src):
            start=m.start(2); end=match_bracket(src,start)
            if end<0: continue
            lit=src[start:end+1]
            if len(lit)<150: continue
            if not re.search(r'\b(health|strength|name|label|level|bonus|cost|tier)\b', lit, re.I): continue
            try:
                obj=json.loads(convert(lit))
            except Exception as e:
                print(f"FAIL {tag}.{m.group(1)} len={len(lit)} :: {lit[:100]!r} :: {e}"); continue
            n=len(obj) if isinstance(obj,(list,dict)) else 0
            first=json.dumps(obj[0] if isinstance(obj,list) else dict(list(obj.items())[:2]))[:200]
            print(f"OK   {tag}.{m.group(1)} n={n} :: {first}")
            json.dump(obj,open(f'data/{tag}.{m.group(1)}.json','w'),indent=1)
