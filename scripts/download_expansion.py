"""Fetch only the named, licensed BodyParts3D anatomy sources."""
import json, urllib.request, hashlib, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
spec=json.loads((ROOT/'assets/models/expansion-sources.json').read_text())
out=ROOT/'assets/models/sources';out.mkdir(exist_ok=True)
ids=sorted({p['id'] for parts in spec['models'].values() for p in parts})
def fetch(id):
    p=out/(id+'.stl')
    if not p.exists():
        for attempt in range(3):
            try:
                data=urllib.request.urlopen('https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data/stl/'+id+'.stl',timeout=90).read()
                p.write_bytes(data);break
            except Exception:
                if attempt==2:raise
                time.sleep(1)
    data=p.read_bytes()
    assert len(data)==84+int.from_bytes(data[80:84],'little')*50, id
    print(id,len(data),flush=True)
    return {'id':id,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
with ThreadPoolExecutor(max_workers=6) as pool: rows=list(pool.map(fetch,ids))
(ROOT/'assets/models/expansion-downloads.json').write_text(json.dumps(rows,indent=2))
