"""One-time migration of the original static platform to the independent anatomy studio."""
from pathlib import Path
import re, shutil

root=Path(__file__).resolve().parents[1]
backup=root/'backups'/'before-studio'
backup.mkdir(parents=True,exist_ok=True)
for name in ['index.html','app.js','server.py','README.md','智触人体-单文件离线版.html']:
    if not (backup/name).exists():shutil.copy2(root/name,backup/name)
h=(root/'index.html').read_text(encoding='utf8')
h=h.replace('</head>','<link rel="stylesheet" href="experience.css">\n</head>')
start=h.index(' <section class="hero">');end=h.index(' <section class="metrics">',start)
h=h[:start]+''' <section class="hero new-hero">
  <div class="hero-grain" aria-hidden="true"></div><div class="hero-ambient" aria-hidden="true"></div>
  <div class="container hero-inner">
   <div class="hero-center"><div class="hero-badge"><span class="dot"></span> 山东大学基础医学院 · 医学教育创新实践</div><div class="hero-edition">ANATOMY, REIMAGINED. <span>VOL. 2026</span></div><h1 class="hero-title">智触人体<span>医脉相承<span class="title-dot">。</span></span></h1><p class="hero-copy">从生命的结构，读懂医学的温度。<br>走近真实形态，让每一次探索都有新的发现。</p><div class="hero-buttons"><a class="btn btn-gold" href="studio.html">进入形态实验室 <span>↗</span></a><button class="btn btn-ghost" data-route="assistant">与 AI 助教对话 <span>↗</span></button></div><div class="hero-featureline"><span>真实三维模型</span><i></i><span>自由交互观察</span><i></i><span>开放医学教育</span></div></div>
   <a class="hero-exhibit" href="studio.html?model=heart" aria-label="进入心脏三维展厅"><div class="exhibit-orbit"></div><span class="exhibit-watermark" aria-hidden="true">COR</span><img class="hero-model" src="assets/models/heart-poster.png" alt="经 Blender 材质与灯光处理的心脏解剖参考模型" width="1000" height="1100" fetchpriority="high"><span class="exhibit-caption"><i></i>01 / HUMAN HEART <small>心脏 · 形态之美</small></span><span class="exhibit-enter">探索<br><b>↗</b></span><span class="exhibit-coordinate">FORM / 001<br>BLENDER STUDIO RENDER</span></a>
   <div class="hero-bottom"><span>SCIENTIFIC CURIOSITY. HUMAN CONNECTION.</span><a class="hero-scroll" href="#discover" data-scroll-discover><span></span> 向下发现更多</a><span>36°40′ N / 117°07′ E</span></div>
  </div>
 </section>
''' + h[end:]
h=h.replace('<section class="section"><div class="container"><div class="section-header">','<section class="section" id="discover"><div class="container"><div class="section-header">',1)
h=h.replace('<strong>05</strong><p>代表性数字标本</p>','<strong>02</strong><p>独立三维模型藏品</p>')
h=h.replace('数字标本库','三维模型馆')
h=h.replace('五大典型解剖主题，以交互式结构示意与多维知识讲解，延续标本的教学价值。','从心脏到全身骨骼，在独立展厅中转动、展开与观察真实解剖网格。')
h=h.replace('<div class="statement-visual"><div class="statement-ring"></div><img src="assets/anatomy.svg" alt="人体解剖学手绘示意"></div>','<a class="statement-visual" href="studio.html?model=skeleton" aria-label="探索全身骨骼模型"><div class="statement-ring"></div><img src="assets/models/skeleton-poster.png" alt="Blender 渲染的全身骨骼模型" loading="lazy"><span class="statement-link">探索骨骼结构 ↗</span></a>')
h=h.replace('02 / CLINICAL LEARNING','02 / THE DIGITAL COLLECTION').replace('从基础结构，<span class="accent">走向临床理解</span>','从不同视角，<span class="accent">看见结构之美</span>').replace('选取五类经典解剖学习主题，在数字空间中建立可检索、可复习的结构认知。','心脏与骨骼，两件可自由探索的三维藏品。进入独立展厅，把观察的主动权交还给你。')
h=h.replace('浏览完整标本库','浏览模型收藏')
start=h.index('<section class="page" id="page-atlas"');end=h.index('<!-- AI -->',start)
h=h[:start]+'''<section class="page" id="page-atlas" data-page="atlas"><div class="page-head"><div class="container page-head-inner"><div class="breadcrumb">THE COLLECTION <span>/</span> ANATOMY STUDIO</div><h1>三维<span class="accent">模型馆</span></h1><p>以真实网格承载精密结构。选择一件藏品，开启属于你的自由观察。</p><a class="btn btn-gold" href="studio.html" style="margin-top:23px">进入独立展厅 ↗</a></div></div><div class="container page-body"><div class="filter-bar"><div class="search-field"><input id="atlasSearch" class="input" type="search" placeholder="搜索心脏、骨骼或系统……" aria-label="搜索模型"></div><div class="chips" id="atlasFilters"><button class="chip active" data-filter="all">全部模型</button><button class="chip" data-filter="循环系统">循环系统</button><button class="chip" data-filter="运动系统">运动系统</button></div><span class="mini muted" id="atlasCount"></span></div><div class="atlas-grid" id="atlasGrid"></div><div class="ethics"><strong class="accent">模型工坊 · 透明来源</strong>　开放解剖参考模型经 Blender 处理与渲染，可在独立展厅中查看来源与授权。颜色及材质用于展示，模型未经本项目的临床精度验证。</div></div></section>
''' + h[end:]
# Remove the original coupled SVG modal entirely.
h=re.sub(r'<div id="specModal".*?(?=<div id="searchModal")','',h,flags=re.S)
h=h.replace('内置结构插画为教学风格示意图；项目活动影像来自所上传的实践报告。报告未提供完整原始标本高清资源、视频源文件或 3D 模型，因此本站不将示意内容宣称为实物扫描或原始标本数据。','三维展厅采用有署名和授权记录的开放解剖模型，经 Blender 处理；项目活动影像来自所上传的实践报告。模型来源与许可可在展厅查看。')
h=h.replace('<script src="app.js" defer></script>','<script src="assets/vendor/gsap.min.js" defer></script>\n<script src="app.js" defer></script>\n<script src="experience.js" defer></script>')
(root/'index.html').write_text(h,encoding='utf8')

p=(root/'app.js').read_text(encoding='utf8')
start=p.index('function organSVG');end=p.index('const specimens=',start);p=p[:start]+p[end:]
start=p.index('function specCard');end=p.index('function specNotes',start)
p=p[:start]+'''const galleryModels=[
 {id:'heart',serial:'01',title:'心脏',en:'HUMAN HEART',system:'循环系统',intro:'沿着冠状血管与心腔表面，观察心脏的立体形态。'},
 {id:'skeleton',serial:'02',title:'全身骨骼',en:'HUMAN SKELETON',system:'运动系统',intro:'从颅骨、脊柱到四肢，探索骨骼之间的空间关系。'}
];
function specCard(s){return `<a class="card card-hover collection-card" href="studio.html?model=${s.id}"><div class="collection-art"><span class="spec-index">COLLECTION / ${s.serial}</span><img src="assets/models/${s.id}-poster.png" alt="${s.title}三维模型渲染" loading="lazy" width="1000" height="1100"><span class="collection-arrow">↗</span></div><div class="spec-text"><span class="eyebrow">${s.en}</span><h3>${s.title}</h3><p>${s.intro}</p><div class="spec-meta"><span>3D · 自由观察</span><span>进入独立展厅 ↗</span></div></div></a>`}
function renderAtlas(){const term=$('#atlasSearch').value.trim().toLowerCase(),filter=$('#atlasFilters .chip.active')?.dataset.filter||'all';const list=galleryModels.filter(s=>(filter==='all'||s.system===filter)&&(s.title+s.en+s.system+s.intro).toLowerCase().includes(term));$('#atlasGrid').innerHTML=list.map(specCard).join('')||'<div class="card" style="padding:40px;grid-column:1/-1">没有匹配的模型，请尝试「心脏」或「骨骼」。</div>';$('#atlasCount').textContent=`${list.length} / ${galleryModels.length} 件模型`}
function renderHomeSpecs(){$('#homeSpecimens').innerHTML=galleryModels.map(specCard).join('')}
function openSpec(id){if(galleryModels.some(s=>s.id===id))location.href='studio.html?model='+encodeURIComponent(id);else navigate('atlas')}
''' + p[end:]
start=p.index('function openSpec',p.index('function specNotes'));end=p.index('/* Structured knowledge',start);p=p[:start]+p[end:]
p=p.replace('renderLearn();bindViewer();checkAiService();','renderLearn();checkAiService();')
p=p.replace("const sibling=specimens.find(s=>s.topic===t.id)||specimens.find(s=>s.system===t.system)||specimens[0];",'')
p=p.replace('<div class="learn-illustration">${organSVG(sibling.id)}</div>','')
p=re.sub(r"if\(q.type==='label'&&q.specimen\)html\+=`.*?`;", "if(q.type==='label')html+='<p class=\"mini muted\">STRUCTURE IDENTIFICATION · 根据文字描述辨认结构</p>';",p)
p=p.replace('图鉴中的膝关节示意重点展示了哪一种纤维软骨结构？','膝关节中分散载荷的纤维软骨结构是？').replace('在颅脑正中矢状面示意中，','在颅脑正中矢状面中，').replace('心脏示意中，','心脏中，').replace('在肺与支气管示意中，','在呼吸系统中，')
p=p.replace('...specimens.map(s=>({label:s.title,route:', '...galleryModels.map(s=>({label:s.title,route:')
p=p.replace("if(specimens.some(s=>s.id===v))", "if(galleryModels.some(s=>s.id===v))")
p=re.sub(r"  const fav=e.target.closest\('\[data-spec-fav\]'\);[^\n]+\n",'',p)
p=p.replace('数字标本库','三维模型馆')
p=p.replace('本交付版本内置的是为网站制作的医学结构示意插画，可缩放、平移、旋转。上传的实践报告没有提供可独立复用的五件标本原始高分辨率文件或 GLTF/GLB 资产，因此没有将示意图冒充真实扫描模型。取得团队正式模型后可替换。','模型馆提供经 Blender 整理的开放解剖参考模型，支持真实三维旋转、结构展开和材质切换。来源及授权见独立展厅；它们不是本团队的标本扫描。展厅不读取题库、知识库或学习记录。')
# Announce route changes for presentation-only animation, without coupling the studio to learning state.
p=p.replace("window.scrollTo({top:0,behavior:'instant'});", "window.scrollTo({top:0,behavior:'instant'});window.dispatchEvent(new CustomEvent('platform:navigate',{detail:{page:to}}));")
(root/'app.js').write_text(p,encoding='utf8')

s=(root/'server.py').read_text(encoding='utf8').replace("filename in ('app.js','index.html')", "filename in ('app.js','index.html','studio.html','studio.css','studio.js','experience.css','experience.js')")
(root/'server.py').write_text(s,encoding='utf8')
print('Updated platform, independent studio links, SVG removal, and server asset routes.')
