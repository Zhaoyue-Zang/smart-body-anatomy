"""Dependency-free, loopback-only static site server. Only public web assets are served."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse, threading, webbrowser

ROOT=Path(__file__).resolve().parents[1]
PUBLIC={'index.html','app.js','experience.css','experience.js','learning-tools.js','studio.html','studio.css','studio.js','智触人体-单文件离线版.html'}
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary','.wasm':'application/wasm'}
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def do_GET(self):
        path=unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        resolved=(ROOT/path).resolve()
        if not resolved.is_relative_to(ROOT) or not (path in PUBLIC or path.startswith('assets/')):
            self.send_error(404);return
        if not resolved.is_file():self.send_error(404);return
        super().do_GET()
    def do_HEAD(self):
        path=unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        resolved=(ROOT/path).resolve()
        if not resolved.is_relative_to(ROOT) or not (path in PUBLIC or path.startswith('assets/')) or not resolved.is_file():
            self.send_error(404);return
        super().do_HEAD()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8000);p.add_argument('--open',action='store_true');args=p.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    url=f'http://127.0.0.1:{args.port}'
    print('Local: '+url,flush=True)
    if args.open:threading.Timer(.5,lambda:webbrowser.open(url)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
