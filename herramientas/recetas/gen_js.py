import json, re, sys
SP='/tmp/claude-0/-home-claude/b44067f1-6f82-51c8-8fe2-7de877efe344/scratchpad'
exec(open(SP+'/nuevas.py').read())
drop=open(SP+'/drop.txt').read().split()
keep=[r for r in R if r['id'] not in drop]
html=open(sys.argv[1],encoding='utf8').read()
# productos del propio index.html (unidad, envase, formato)
PRODS={}
for m in re.finditer(r"\{id:'([a-z]+)',[^\n]*?unidad:'(g|ml|ud)',\s*envase:([0-9.]+),\s*formato:(?:\"([^\"]*)\"|'([^']*)')", html):
    PRODS[m.group(1)]=dict(unidad=m.group(2),envase=float(m.group(3)),formato=m.group(4) or m.group(5))
ESPECIAL={'cerveza':1980}
def gramos_envase(pid):
    if pid in ESPECIAL: return ESPECIAL[pid]
    f=PRODS[pid]['formato']
    m=re.search(r'(\d+(?:,\d+)?)\s*(kg|g|ml|cl|l)\b',f)
    if not m: raise SystemExit(f'sin gramos: {pid} {f}')
    v=float(m.group(1).replace(',','.')); u=m.group(2)
    return v*{'kg':1000,'g':1,'ml':1,'cl':10,'l':1000}[u]
def cant(pid,q):
    p=PRODS[pid]
    if isinstance(q,str):
        g=float(q[2:])
        if p['unidad'] in ('g','ml'): return round(g,1)
        return round(g/gramos_envase(pid),3)
    return q
lines=[]
for r in keep:
    ing=[[pid,cant(pid,q)] for pid,q in r['ing']]
    d=dict(id=r['id']);
    s="  {id:%s%s, nombre:%s, momentos:%s, min:%d, ing:%s,\n   pasos:%s}," % (
        json.dumps(r['id'],ensure_ascii=False).replace('"',"'"), ", premium:true" if r.get('premium') else "",
        json.dumps(r['n'],ensure_ascii=False), json.dumps(r['m']).replace('"',"'"), r['t'],
        json.dumps(ing).replace('"',"'"), json.dumps(r['p'],ensure_ascii=False))
    lines.append(s)
# dibujo sencillo de reserva (si la imagen no carga)
def dish(r):
    im=r['img']; b=(im.get('b') or [None,None]); base=b[1] if len(b)>1 and isinstance(b[1],str) else '#E9C77A'
    if im.get('pizza'): return {'k':'bigpizza'}
    if im.get('tortilla'): return {'k':'tortilla','base':im['tortilla'],'tops':['#E9D9A6']}
    if im.get('revuelto'): return {'k':'scramble','tops':['#8D6E63','#E07B2E']}
    if im.get('gratin') or im.get('rellenos') or im.get('empanada'): return {'k':'crema','base':im.get('gratin') or im.get('rellenos') or '#D9A04E'}
    if im['v']=='paellera': return {'k':'paella','base':base,'tops':['#C98A50','#4E9A3A','#D64533']}
    if b[0]=='arroz': return {'k':'rice','base':base,'grain':'#FFFFFF','tops':['#7CB342','#E07B2E']}
    if b[0]=='espaguetis': return {'k':'spag','base':base,'pasta':'#F2CF63','tops':['#FFF3B8']}
    if any(i[0]=='macarron' for i in im.get('it',[])): return {'k':'pasta','base':base,'pasta':'#F2C94C','tops':['#D9B38C']}
    if b[0]=='hojas' or r['n'].lower().startswith('ensalada'): return {'k':'salad','tops':['#D6402C','#D9B38C','#BFD88A']}
    if any(i[0]=='tortillaTrigo' for i in im.get('it',[])): return {'k':'wrap','tops':['#D64533','#F4D03F','#7CB342','#E8D3B0']}
    if b[0]=='crema': return {'k':'crema','base':base}
    if im['v'] in ('cazuela','cuenco'): return {'k':'bowl','base':base,'tops':['#E07B2E','#7CB342','#F3E6C2']}
    return {'k':'plate','prot':'#E3BE84','protEdge':'#C99A5A','sides':['#E8C15A','#7CB342','#D6402C']}
dl=["  %-22s %s," % ("'%s':"%r['id'], json.dumps(dish(r)).replace('"',"'").replace("'k'",'k').replace("'base'",'base').replace("'tops'",'tops').replace("'grain'",'grain').replace("'pasta'",'pasta').replace("'prot'",'prot').replace("'protEdge'",'protEdge').replace("'sides'",'sides')) for r in keep]
open(SP+'/recetas-js.txt','w').write('\n'.join(lines)+'\n')
open(SP+'/dish-js.txt','w').write('\n'.join(dl)+'\n')
print(len(lines), len(dl))
