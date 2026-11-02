import json
exec(open('nuevas.py').read())
PESCADO={'merluza','bacalao','salmon','dorada','lubina','sardinas','boquerones','mejillones','langostinos','varitas'}
SALSA={'ketchup':'#C8402A','mayonesa':'#F3E6B0','guacamole':'#9AB85A'}
ASOMA={'macarrones-gratinados':'macarron','canelones':None}
def acc(r):
    im=r['img']; ids={p for p,_ in r['ing']}; a=list(im.get('acc',[]))
    if ids&PESCADO and 'limon' in ids: a.append('limon')
    if im['v'] in ('tabla','plato','fuente'):
        for k,c in SALSA.items():
            if k in ids: a.append('salsa:'+c); break
    if im['v'] in ('cazuela','cuenco') and 'pan' in ids and not im.get('b',[None])[0]=='crema': a.append('pan')
    return a
def guarnicion(r,sp):
    it=list(sp.get('it') or []); ids={p for p,_ in r['ing']}; pintado={x[0] for x in it}
    principal=any(isinstance(x[1],list) for x in it)
    if sp['v']!='plato' or not principal or any(k in sp for k in ('gratin','tortilla','pizza','rellenos','revuelto','usar')): return sp
    lados=[]
    if ('arroz' in ids or 'basmati' in ids) and 'montonArroz' not in pintado: lados.append(['montonArroz',[[.66,.5,.3]],44])
    if 'patata' in ids and not pintado&{'patata','frita'}: lados.append(['patata',10,24,'gajo'])
    if 'lechuga' in ids and 'lechuga' not in pintado: lados+= [['lechuga',4,40],['tomate',5,18]]
    if 'judias' in ids and 'judia' not in pintado: lados.append(['judia',12,26])
    if 'brocoli' in ids and 'brocoli' not in pintado: lados.append(['brocoli',6,26])
    if 'pimiento' in ids and 'pimiento' not in pintado: lados.append(['pimiento',10,22,None,'tira'])
    sp=dict(sp); sp['it']=lados+it; return sp
js=open('render/motor.js').read().replace("window.PLATOS_IDS=Object.keys(P); window.pintarPlato=pintar;","")+'\n'+open('render/generico.js').read()+'\n'
for r in R:
    sp=dict(r['img']); sp['acc']=acc(r)
    if r['id'] in ASOMA and ASOMA[r['id']]: sp['asoma']=ASOMA[r['id']]
    sp=guarnicion(r,sp)
    js+=f"P[{json.dumps(r['id'])}]=G({json.dumps(sp)});\n"
open('render/motor-nuevas.js','w').write(js+"window.PLATOS_IDS=Object.keys(P); window.pintarPlato=pintar;\n")
open('render/ids-todas.txt','w').write(' '.join(r['id'] for r in R))
print(len(R))
