"""Build the public GitHub Pages /docs site using an explicit asset allowlist."""
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'docs'
DEST.mkdir(exist_ok=True)
files=['index.html','app.js','experience.css','experience.js','studio.html','studio.css','studio.js']
files += [str(p.relative_to(ROOT)) for p in (ROOT/'assets').glob('*.webp')]
files += [str(p.relative_to(ROOT)) for p in (ROOT/'assets/vendor').rglob('*') if p.is_file()]
files += [f'assets/models/{name}' for name in ['heart.glb','skeleton.glb','heart-poster.png','skeleton-poster.png','ATTRIBUTION.md','manifest.json','heart-provenance.md','heart-source-manifest.json','skeleton-source-readme.md']]
files += [f'assets/models/{kind}{suffix}' for kind in ['kidneys','brain','spleen','muscles','knee'] for suffix in ['.glb','-poster.png']]
files += ['assets/models/expansion-sources.json','assets/models/expansion-downloads.json']
for name in files:
    source=ROOT/name;target=DEST/name
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,target)
(DEST/'.nojekyll').write_text('',encoding='utf8')
print(f'GitHub Pages: {len(files)} files, {sum((DEST/name).stat().st_size for name in files)/1048576:.1f} MiB, output docs/')
