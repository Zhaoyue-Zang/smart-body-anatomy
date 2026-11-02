"""Import data literals only, without executing the supplied HTML scripts."""
from pathlib import Path
import re,json,json5,hashlib,sys
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'assets/reference/regional-original.html.txt'
s=source.read_text(encoding='utf8')
def extract(name):
    return json5.loads(re.search(r'const '+name+r'\s*=\s*(\[.*?\n\s*\]);',s,re.S)[1])
data={'source':'局解小帮手.html','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'knowledge':extract('KNOWLEDGE'),'questions':extract('SEED_QUESTIONS')+extract('SEED_EN')}
assert len(data['knowledge'])==101 and len(data['questions'])==32
(ROOT/'assets/reference').mkdir(exist_ok=True)
(ROOT/'assets/reference/regional-original.html.txt').write_bytes(source.read_bytes())
(ROOT/'assets/regional-data.js').write_text('/* Imported data only; source scripts are not executed. */\nwindow.REGIONAL_DATA = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
print('Imported 101 knowledge entries and 32 bilingual questions, with unchanged source archive.')
