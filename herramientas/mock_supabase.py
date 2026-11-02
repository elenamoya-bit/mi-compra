# Imita las funciones RPC de supabase/familia.sql para probar la app sin internet.
import json, random, string, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
H={}; L=threading.Lock(); ALF='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
class S(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def cors(self):
        self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','*'); self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def out(self,obj,code=200):
        b=json.dumps(obj).encode(); self.send_response(code); self.cors(); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(b)
    def do_POST(self):
        n=int(self.headers.get('Content-Length',0)); a=json.loads(self.rfile.read(n) or b'{}'); fn=self.path.rsplit('/',1)[-1]
        if not self.headers.get('apikey'): return self.out({'message':'no apikey'},401)
        with L:
            if fn=='crear_hogar':
                c=''.join(random.choice(ALF) for _ in range(12)); H[c]={'estado':a['p_estado'],'version':1}; return self.out([{'codigo':c,'version':1}])
            c=str(a.get('p_codigo','')).upper()
            if fn=='leer_hogar': return self.out([{'estado':H[c]['estado'],'version':H[c]['version']}] if c in H else [])
            if fn=='version_hogar': return self.out(H[c]['version'] if c in H else None)
            if fn=='guardar_hogar':
                if c not in H: return self.out([])
                if H[c]['version']==a['p_version']:
                    H[c]['estado']=a['p_estado']; H[c]['version']+=1; return self.out([{'ok':True,'version':H[c]['version'],'estado':None}])
                return self.out([{'ok':False,'version':H[c]['version'],'estado':H[c]['estado']}])
        self.out({'message':'no existe'},404)
ThreadingHTTPServer(('localhost',8790),S).serve_forever()
