"""Embed the platform and posters; the WebGL studio remains a separate local HTTP page."""
from pathlib import Path
import re,base64,mimetypes
root=Path(__file__).resolve().parents[1]
h=(root/'index.html').read_text(encoding='utf8')
for name in ['experience.css']:
    h=h.replace(f'<link rel="stylesheet" href="{name}">','<style>'+ (root/name).read_text(encoding='utf8')+'</style>')
for name in ['assets/vendor/gsap.min.js','app.js','experience.js']:
    code=(root/name).read_text(encoding='utf8').replace('</script','<\\/script')
    if name=='app.js':
        for kind in ['heart','skeleton']:
            data=base64.b64encode((root/f'assets/models/{kind}-poster.png').read_bytes()).decode()
            code=code.replace("const galleryModels=[",f"const {kind}Poster='data:image/png;base64,{data}';\nconst galleryModels=[",1)
        code=code.replace('assets/models/${s.id}-poster.png','${s.id===\'heart\'?heartPoster:skeletonPoster}')
    h=h.replace(f'<script src="{name}" defer></script>','<script>'+code+'</script>')
def embed(m):
    path=root/m[1]
    mime=mimetypes.guess_type(path)[0] or {'.webp':'image/webp','.png':'image/png'}[path.suffix]
    return 'src="data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()+'"'
h=re.sub(r'src="(assets/[^"<>]+\.(?:png|webp))"',embed,h)
h=h.replace('<body>','<body><div style="padding:8px 20px;background:#1d3039;color:#d6c5a5;font:12px/1.7 sans-serif;text-align:center">离线阅读版 · 首页与学习功能可直接使用。三维交互请双击同目录「启动网站.bat」。</div>',1)
(root/'智触人体-单文件离线版.html').write_text(h,encoding='utf8')
print('Updated offline platform with rendered posters and no anatomy SVG.')
