import sys, asyncio, json
from playwright.async_api import async_playwright
SP=sys.argv[1]; URL='http://localhost:8765/'; API=json.dumps({'url':'http://localhost:8790','clave':'publica'})
R=[]
def ok(n,c,d=''): R.append(bool(c)); print(('✅' if c else '❌'),n,d)
async def movil(b,errs,nombre):
    ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    await ctx.add_init_script(f"localStorage.setItem('mci-api-pruebas',{json.dumps(API)})")
    pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(nombre+': '+str(e))); return ctx,pg
async def espera(pg,expr,seg=15):
    for _ in range(seg*4):
        if await pg.evaluate(expr): return True
        await pg.wait_for_timeout(250)
    return False
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        ca,A=await movil(b,errs,'A'); cb,B=await movil(b,errs,'B')
        await A.goto(URL); await A.click('[data-act="ob-crear"]'); await A.wait_for_timeout(300)
        await A.click('.gear'); await A.wait_for_timeout(200)
        ok('Ajustes muestra «Compra familiar»', await A.locator('#familia').count()==1)
        await A.screenshot(path=f'{SP}/fam/1-ajustes.png')
        await A.click('[data-act="fam-crear"]'); await A.wait_for_timeout(600)
        cod=await A.evaluate("fam&&fam.codigo")
        ok('Crea la compra familiar con un código de 12', bool(cod) and len(cod)==12, cod)
        await A.screenshot(path=f'{SP}/fam/2-invitar.png')
        enlace=await A.evaluate("enlaceFamilia()"); ok('El enlace de invitación lleva el código', enlace.endswith('?familia='+cod), enlace)
        await A.click('.sheet [data-act="cerrar"]')
        # B abre el enlace (primera vez que usa la app)
        await B.goto(URL+'?familia='+cod); await B.wait_for_timeout(500)
        ok('B ve la invitación al abrir el enlace (sin bienvenida encima)', await B.locator('[data-act="fam-aceptar"]').count()==1 and await B.locator('.welcome').count()==0)
        await B.screenshot(path=f'{SP}/fam/3-invitacion.png')
        await B.click('[data-act="fam-aceptar"]'); await B.wait_for_timeout(600)
        ok('B tiene el mismo menú que A', await A.evaluate("JSON.stringify(state.menu)")==await B.evaluate("JSON.stringify(state.menu)"))
        ok('El enlace desaparece de la barra de direcciones', '?familia' not in B.url)
        # A marca un producto en la lista → B lo ve
        await A.click('nav [data-tab="lista"]'); await A.wait_for_timeout(200)
        pid=await A.evaluate("calcularCesta().lineas.find(l=>l.envases>0).pid")
        await A.click(f'label[for="chk-{pid}"]'); await A.wait_for_timeout(100)
        ok('B ve lo que A marca en el carro', await espera(B,f"!!state.marcados['{pid}']"), pid)
        await B.click('nav [data-tab="lista"]'); await B.wait_for_timeout(300)
        ok('La lista de B dice «Compartida con tu familia»', await B.locator('.fam-pill').count()==1)
        await B.screenshot(path=f'{SP}/fam/4-lista-b.png')
        # Los dos añaden cosas distintas a la vez → no se pierde nada
        await A.evaluate("state.extras.aguacate=2; commit()"); await B.evaluate("state.extras.cafe=1; commit()")
        ok('Cambios a la vez: A tiene lo de los dos', await espera(A,"state.extras.aguacate===2&&state.extras.cafe===1"))
        ok('Cambios a la vez: B tiene lo de los dos', await espera(B,"state.extras.aguacate===2&&state.extras.cafe===1"))
        # B cambia las personas → A lo ve y su presupuesto se recalcula
        t0=await A.evaluate("calcularCesta().total")
        await B.evaluate("state.hogar.personas=6; commit()")
        ok('A ve el cambio de personas de B', await espera(A,"state.hogar.personas===6"))
        ok('…y su cesta se recalcula', await A.evaluate("calcularCesta().total")!=t0, f"{t0} → {await A.evaluate('calcularCesta().total')}")
        # B sin conexión marca algo; al volver la conexión, A lo recibe
        await cb.set_offline(True)
        pid2=await B.evaluate(f"calcularCesta().lineas.filter(l=>l.envases>0).map(l=>l.pid).find(p=>p!=='{pid}')")
        await B.evaluate(f"state.marcados['{pid2}']=true; commit()"); await B.wait_for_timeout(1500)
        await B.click('.gear'); await B.wait_for_timeout(200)
        txt=await B.locator('#fam-sinc').inner_text(); ok('Sin conexión, B avisa de que se enviará al volver', 'Sin conexión' in txt, txt)
        await B.screenshot(path=f'{SP}/fam/5-sin-conexion.png')
        ok('…y A todavía no lo tiene', not await A.evaluate(f"!!state.marcados['{pid2}']"))
        await cb.set_offline(False); await B.evaluate("window.dispatchEvent(new Event('online'))")
        ok('Al volver la conexión, A recibe lo que marcó B', await espera(A,f"!!state.marcados['{pid2}']"))
        # Unirse escribiendo el código
        cc,C=await movil(b,errs,'C'); await C.goto(URL); await C.click('[data-act="ob-crear"]'); await C.click('.gear'); await C.wait_for_timeout(200)
        await C.click('[data-act="fam-codigo"]'); await C.fill('#fam-input',cod[:4].lower()+'-'+cod[4:8]+' '+cod[8:]); await C.click('[data-act="fam-unir"]'); await C.wait_for_timeout(700)
        ok('C se une escribiendo el código (con guiones y minúsculas)', await C.evaluate("fam&&fam.codigo")==cod and await C.evaluate("state.hogar.personas")==6)
        await C.click('[data-act="fam-codigo"]') if await C.locator('[data-act="fam-codigo"]').count() else None
        # Código inventado
        cd,D=await movil(b,errs,'D'); await D.goto(URL); await D.click('[data-act="ob-crear"]'); await D.click('.gear'); await D.click('[data-act="fam-codigo"]')
        await D.fill('#fam-input','ABCD-EFGH-JKLM'); await D.click('[data-act="fam-unir"]'); await D.wait_for_timeout(500)
        ok('Un código inventado no deja entrar', await D.evaluate("fam")==None)
        # B sale: deja de recibir cambios
        await B.click('[data-act="fam-salir"]'); await B.click('[data-act="fam-salir-ok"]'); await B.wait_for_timeout(200)
        await A.evaluate("state.hogar.personas=3; commit()"); await A.wait_for_timeout(8000)
        ok('Quien sale conserva su copia y deja de recibir cambios', await B.evaluate("fam")==None and await B.evaluate("state.hogar.personas")==6)
        ok('En familia no aparecen «Ver el ejemplo» ni «Empezar de cero»', await C.locator('[data-act="reset"],[data-act="decero"]').count()==0)
        ok('Sin errores', not errs, '; '.join(errs[:3]))
        # Sin Supabase configurado: no aparece nada
        ce=await b.new_context(viewport={'width':390,'height':844}); E=await ce.new_page(); await E.goto(URL); await E.click('[data-act="ob-crear"]'); await E.click('.gear'); await E.wait_for_timeout(200)
        ok('Sin Supabase configurado, la tarjeta no aparece', await E.locator('#familia').count()==0)
        await b.close()
asyncio.run(main()); print(f'{sum(R)}/{len(R)}')
