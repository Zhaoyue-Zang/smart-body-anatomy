import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Deliberately standalone: no imports from the platform, quiz, knowledge or learning state.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const models = {
  heart: { title:'心脏', latin:'Cor', index:'01', word:'COR', file:'assets/models/heart.glb' },
  skeleton: { title:'全身骨骼', latin:'Systema skeletale', index:'02', word:'OSSA', file:'assets/models/skeleton.glb' }
};
const heartNames={'right-atrium':'右心房壁','left-atrium':'左心房壁','ventricular-wall':'心室壁','right-ventricle':'右心室腔表面','left-ventricle':'左心室腔表面','ascending-aorta':'升主动脉','aortic-arch':'主动脉弓','pulmonary-trunk':'肺动脉干','superior-vena-cava':'上腔静脉','left-coronary':'左冠状动脉树','right-coronary':'右冠状动脉树'};
let renderer, scene, camera, controls, root, meshes=[], selections=[], selected=null, isolated=false;
let current='heart', materialMode='original', loadToken=0, busy=false, spin=false, dirty=true, raf=0;
let warmLight, fillLight, animation, pointerStart, toastTimer;
const stage=$('#stage'), canvas=$('#anatomyCanvas');
function toast(message){$('#studioToast').textContent=message;$('#studioToast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#studioToast').classList.remove('visible'),2800)}
function invalidate(){dirty=true;if(!raf&&!document.hidden)raf=requestAnimationFrame(frame)}
let lastFrame=0;
function frame(t){raf=0;const dt=Math.min((t-lastFrame)/1000,.05);lastFrame=t;if(document.hidden)return;
  if(controls){controls.autoRotate=spin;controls.update(dt)}
  if(dirty&&renderer){renderer.render(scene,camera);dirty=false}
  if(spin||animation)invalidate();
}
function setSpin(value){spin=value;$('#spinButton').setAttribute('aria-pressed',String(value));$('#spinButton').innerHTML=`${value?'Ⅱ':'⟳'} <span>${value?'暂停旋转':'自动旋转'}</span>`;invalidate()}
function disposeModel(object){object?.traverse(o=>{if(o.isMesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()})}})}
function fail(message){busy=false;$('#loadState').hidden=false;$('#loadState').classList.add('failed');$('#loadTitle').textContent='暂时无法呈现模型';$('#loadDetail').textContent=message;$('#retryButton').hidden=false}
function resize(){if(!renderer)return;const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate()}
function start(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(37,1,.01,100);camera.position.set(0,.1,6.8);
  scene.add(new THREE.HemisphereLight(0xe8f0f2,0x4d3729,2.5));
  warmLight=new THREE.DirectionalLight(0xffdfb5,3.5);warmLight.position.set(-3,4,5);scene.add(warmLight);
  fillLight=new THREE.DirectionalLight(0x9bc9e8,2);fillLight.position.set(4,1,2);scene.add(fillLight);
  const rim=new THREE.DirectionalLight(0xf4cf95,4);rim.position.set(2,3,-4);scene.add(rim);
  controls=new OrbitControls(camera,canvas);controls.enableDamping=!reducedMotion.matches;controls.dampingFactor=.09;controls.enablePan=true;controls.minDistance=1.3;controls.maxDistance=15;controls.autoRotateSpeed=.65;controls.target.set(0,0,0);
  controls.addEventListener('change',()=>{dirty=true;invalidate()});controls.addEventListener('start',()=>{animation?.kill();animation=null;setSpin(false);$('#viewLabel').textContent='自由视角';$$('[data-view]').forEach(b=>b.classList.remove('active'))});
  new ResizeObserver(resize).observe(stage);resize();
  const initial=new URLSearchParams(location.search).get('model');loadModel(models[initial]?initial:'heart');
 }catch(e){console.error(e);fail('当前浏览器无法启用 WebGL。请尝试支持硬件加速的浏览器。')}
}
async function loadModel(id){
 const token=++loadToken;current=id;busy=true;setSpin(false);selected=null;isolated=false;materialMode='original';$('#explodeRange').value=0;$('#explodeValue').value='0%';$('#exposureRange').value=100;$('#exposureValue').value='100%';if(renderer)renderer.toneMappingExposure=1.25;
 $('#loadState').hidden=false;$('#loadState').classList.remove('failed');$('#loadTitle').textContent='正在布置展台';$('#loadDetail').textContent='载入本地三维模型…';$('#retryButton').hidden=true;
 $('#structureSelect').innerHTML='<option value="">完整模型</option>';$('#selectionBadge').hidden=true;$('#isolateButton').disabled=$('#focusButton').disabled=true;$('#isolateButton').setAttribute('aria-pressed','false');$('#isolateButton').textContent='单独显示';$('#structureHint').textContent='选择结构后，可单独显示或聚焦观察。';
 const model=models[id];$('#modelTitle').textContent=model.title+' ';const em=document.createElement('em');em.textContent=model.latin;$('#modelTitle').append(em);$('#modelIndex').textContent=model.index;$('.stage-word').textContent=model.word;
 $$('[data-model]').forEach(b=>{b.classList.toggle('active',b.dataset.model===id);b.setAttribute('aria-pressed',String(b.dataset.model===id))});
 $$('[data-material]').forEach(b=>{b.classList.toggle('active',b.dataset.material==='original');b.setAttribute('aria-pressed',String(b.dataset.material==='original'))});
 if(root){scene.remove(root);disposeModel(root);root=null;meshes=[];invalidate()}
 try{
  const gltf=await new GLTFLoader().loadAsync(model.file,e=>{if(token===loadToken)$('#loadDetail').textContent=e.total?`载入模型 ${Math.round(e.loaded/e.total*100)}%`:`已读取 ${(e.loaded/1048576).toFixed(1)} MB`});
  if(token!==loadToken){disposeModel(gltf.scene);return}
  root=gltf.scene;scene.add(root);meshes=[];
  root.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();o.material.side=THREE.DoubleSide;o.material.roughness=id==='heart'?.43:.57;o.userData.baseColor=o.material.color.clone();o.userData.basePosition=o.position.clone();o.geometry.computeBoundingBox();o.userData.explode=o.geometry.boundingBox.getCenter(new THREE.Vector3()).normalize().multiplyScalar(id==='heart'?.8:.5);meshes.push(o)});
  buildSelections();$('#meshStats').textContent=`${meshes.length} MESHES / LOCAL GLB`;$('#loadState').hidden=true;busy=false;
  setView('front',true);history.replaceState(null,'',`?model=${id}`);invalidate();
 }catch(error){if(token!==loadToken)return;console.error(error);fail(location.protocol==='file:'?'请运行「启动网站.bat」，再从本地网址打开三维展厅。':'模型载入失败，请检查 assets/models 文件是否完整，然后重试。')}
}
function groupOf(name){const n=name.toLowerCase();if(/rib|sternum/.test(n))return '胸廓';if(/vertebra|atlas|axis|sacrum|coccyx/.test(n))return '脊柱';if(/femur|tibia|fibula|patella|foot|metatars|tarsal|calcaneus|talus|cuneiform|cuboid|navicular/.test(n))return '下肢骨';if(/hip/.test(n))return '骨盆';if(/humerus|radius|ulna|scapula|clavicle|carpal|finger|capitate|hamate|lunate|pisiform|scaphoid|trapez|triquetr/.test(n))return '上肢骨';return '颅骨与牙齿'}
function buildSelections(){
 selections=current==='heart'?meshes.map(o=>({name:heartNames[o.name]||o.name,items:[o]})):['颅骨与牙齿','脊柱','胸廓','骨盆','上肢骨','下肢骨'].map(name=>({name,items:meshes.filter(o=>groupOf(o.name)===name)})).filter(g=>g.items.length);
 selections.forEach((g,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=g.name;$('#structureSelect').append(option)});
}
function paint(){meshes.forEach(o=>{const m=o.material;const chosen=selected?.items.includes(o);m.wireframe=materialMode==='wire';m.color.copy(materialMode==='original'?o.userData.baseColor:new THREE.Color(materialMode==='clay'?0xc6bfae:0x83b5bd));m.emissive.set(chosen?0x82602d:0x000000);m.emissiveIntensity=chosen?.25:0;m.transparent=Boolean(selected&&!chosen&&!isolated);m.opacity=m.transparent?.18:1;m.depthWrite=!m.transparent;o.visible=!isolated||Boolean(chosen);m.needsUpdate=true});invalidate()}
function select(index){selected=selections[index]||null;isolated=false;$('#structureSelect').value=selected?String(index):'';$('#selectionBadge').hidden=!selected;$('#selectionLabel').textContent=selected?.name||'';$('#isolateButton').disabled=$('#focusButton').disabled=!selected;$('#isolateButton').setAttribute('aria-pressed','false');$('#isolateButton').textContent='单独显示';$('#structureHint').textContent=selected?`${selected.name} · ${selected.items.length} 个网格部件。其他结构已淡化。`:'选择结构后，可单独显示或聚焦观察。';paint()}
function moveCamera(position,target,instant=false){animation?.kill();animation=null;if(instant||reducedMotion.matches||!window.gsap){camera.position.copy(position);controls.target.copy(target);controls.update();invalidate();return}
 animation=gsap.timeline({onUpdate:()=>{controls.update();invalidate()},onComplete:()=>{animation=null}}).to(camera.position,{x:position.x,y:position.y,z:position.z,duration:1.05,ease:'power3.inOut'},0).to(controls.target,{x:target.x,y:target.y,z:target.z,duration:1.05,ease:'power3.inOut'},0);invalidate()}
function setView(view,instant=false){if(!camera)return;setSpin(false);const r=current==='heart'?6.5:6.8;const extra=camera.aspect<.8?1.12:1;const positions={front:new THREE.Vector3(0,.05,r*extra),side:new THREE.Vector3(r*extra,.05,0),back:new THREE.Vector3(0,.05,-r*extra)};moveCamera(positions[view],new THREE.Vector3(),instant);$('#viewLabel').textContent=({front:'前面观 / ANTERIOR',side:'侧面观 / LATERAL',back:'后面观 / POSTERIOR'})[view];$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view))}
function reset(){if(busy||!root)return;$('#explodeRange').value=0;$('#explodeValue').value='0%';meshes.forEach(o=>o.position.copy(o.userData.basePosition));select(-1);setView('front');toast('已复位模型、结构与视角')}
$$('[data-model]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.model!==current||!root)loadModel(b.dataset.model)}));
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$$('[data-material]').forEach(b=>b.addEventListener('click',()=>{materialMode=b.dataset.material;$$('[data-material]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});paint()}));
$('#explodeRange').addEventListener('input',e=>{if(!root)return;const value=+e.target.value/100;$('#explodeValue').value=e.target.value+'%';meshes.forEach(o=>o.position.copy(o.userData.basePosition).addScaledVector(o.userData.explode,value));invalidate()});
$('#exposureRange').addEventListener('input',e=>{if(renderer)renderer.toneMappingExposure=+e.target.value/100*1.25;$('#exposureValue').value=e.target.value+'%';invalidate()});
$$('[data-light]').forEach(b=>b.addEventListener('click',()=>{if(!warmLight)return;warmLight.color.set(b.dataset.light==='warm'?0xffdfb5:0xc1dfff);fillLight.color.set(b.dataset.light==='warm'?0x9bc9e8:0xd4eaff);$$('[data-light]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});invalidate()}));
$('#gridButton').onclick=()=>{const hidden=$('#stageGrid').hidden=!$('#stageGrid').hidden;$('#gridButton').setAttribute('aria-pressed',String(!hidden));$('#gridButton').textContent=hidden?'网格 ○':'网格 ✓'};
$('#structureSelect').onchange=e=>select(e.target.value===''?-1:+e.target.value);
$('#clearSelection').onclick=()=>select(-1);
$('#isolateButton').onclick=()=>{if(!selected)return;isolated=!isolated;$('#isolateButton').setAttribute('aria-pressed',String(isolated));$('#isolateButton').textContent=isolated?'显示全部':'单独显示';$('#structureHint').textContent=`${selected.name} · ${selected.items.length} 个网格部件。${isolated?'其他结构已隐藏。':'其他结构已淡化。'}`;paint()};
$('#focusButton').onclick=()=>{if(!selected)return;setSpin(false);const box=new THREE.Box3();selected.items.forEach(o=>box.expandByObject(o));const center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3()).length();const direction=camera.position.clone().sub(controls.target).normalize();moveCamera(center.clone().addScaledVector(direction,Math.max(1.6,size*1.8)),center);$('#viewLabel').textContent='聚焦 / '+selected.name};
$('#spinButton').onclick=()=>setSpin(!spin);$('#resetCamera').onclick=reset;
$('#fullscreenButton').onclick=()=>{const active=document.body.classList.toggle('immersive');$('#fullscreenButton').setAttribute('aria-pressed',String(active));resize()};
$('#snapshotButton').onclick=()=>{if(!root||busy){toast('请等待模型载入后再截图');return}renderer.render(scene,camera);const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const ctx=out.getContext('2d');ctx.fillStyle='#10171a';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(canvas,0,0);ctx.font=`${Math.max(12,Math.round(out.width/70))}px sans-serif`;ctx.fillStyle='#c4b18e';ctx.fillText(current==='heart'?'BodyParts3D / DBCLS · CC BY 4.0':'Open3Dmodel / Open Anatomy · CC BY-SA 4.0',20,out.height-20);out.toBlob(blob=>{if(!blob){toast('截图失败，请重试');return}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`智触人体-${current}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('当前视图已导出 PNG')})};
$('#helpButton').onclick=()=>$('#helpDialog').showModal();$('#creditsButton').onclick=()=>$('#creditsDialog').showModal();
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
$('#retryButton').onclick=()=>{if(!renderer)location.reload();else loadModel(current)};
canvas.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5||busy||!root)return;const rect=canvas.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObjects(meshes.filter(o=>o.visible),false)[0];if(hit)select(selections.findIndex(g=>g.items.includes(hit.object)));else select(-1)});
canvas.addEventListener('keydown',e=>{if(!controls)return;if(e.code==='Space'){e.preventDefault();setSpin(!spin)}else if(e.key.toLowerCase()==='r'){reset()}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();setSpin(false);const offset=camera.position.clone().sub(controls.target);const s=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi-=.1;if(e.key==='ArrowDown')s.phi+=.1;if(e.key==='+'||e.key==='=')s.radius*=.9;if(e.key==='-')s.radius*=1.1;s.radius=THREE.MathUtils.clamp(s.radius,1.3,15);s.makeSafe();camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();invalidate()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('immersive')){document.body.classList.remove('immersive');$('#fullscreenButton').setAttribute('aria-pressed','false');resize()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastFrame=0}else invalidate()});
reducedMotion.addEventListener('change',()=>{if(controls)controls.enableDamping=!reducedMotion.matches;if(reducedMotion.matches)setSpin(false)});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setSpin(false);fail('图形上下文已中断，请刷新页面恢复。');$('#retryButton').onclick=()=>location.reload()});
if(location.protocol==='file:')fail('请运行「启动网站.bat」，再从本地网址打开三维展厅。');else start();
