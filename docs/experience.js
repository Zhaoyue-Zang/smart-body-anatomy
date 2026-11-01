(() => {
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const bar=document.createElement('div');bar.className='scroll-progress';document.body.append(bar);
 let scrollFrame;
 window.addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{const total=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${total>0?scrollY/total:0})`;scrollFrame=0})},{passive:true});
 document.querySelector('[data-scroll-discover]')?.addEventListener('click',e=>{e.preventDefault();document.querySelector('#discover').scrollIntoView({behavior:motion.matches?'instant':'smooth'})});
 document.querySelectorAll('.module[data-route]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','link');el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}})});
 let observer;
 function animatePage(){
  bar.style.transform='scaleX(0)';observer?.disconnect();if(motion.matches||!window.gsap)return;
  const page=document.querySelector('.active-page');
  const headings=page.querySelectorAll('.page-head-inner > *');
  if(headings.length)gsap.fromTo(headings,{y:20,opacity:0},{y:0,opacity:1,stagger:.06,duration:.7,ease:'power3.out',clearProps:'transform,opacity'});
  if(page.id==='page-home'){
   gsap.fromTo('.hero-center > *',{y:28,opacity:0},{y:0,opacity:1,stagger:.08,duration:1.1,ease:'power3.out',clearProps:'transform,opacity'});
   gsap.fromTo('.hero-exhibit',{opacity:0,y:35},{opacity:1,y:0,duration:1.5,ease:'power3.out',clearProps:'transform,opacity'});
  }
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;gsap.fromTo(entry.target,{y:27,opacity:0},{y:0,opacity:1,duration:.85,ease:'power3.out',clearProps:'transform,opacity'});observer.unobserve(entry.target)}),{threshold:.12});
  page.querySelectorAll('.section-header,.module,.statement-grid,.collection-card,.resource-card,.timeline-row,.metric').forEach(el=>observer.observe(el));
 }
 window.addEventListener('platform:navigate',()=>requestAnimationFrame(animatePage));
 motion.addEventListener('change',()=>{observer?.disconnect();if(window.gsap)gsap.killTweensOf('.hero-center > *,.hero-exhibit,.hero-model,.card');document.querySelectorAll('[style]').forEach(el=>{if(el.matches('.hero-center > *,.hero-exhibit,.hero-model,.card')){el.style.opacity='';el.style.transform=''}})});
 const exhibit=document.querySelector('.hero-exhibit');
 exhibit?.addEventListener('pointermove',e=>{if(motion.matches||!window.gsap||e.pointerType!=='mouse')return;const r=exhibit.getBoundingClientRect();gsap.to('.hero-model',{rotationY:(e.clientX-r.left-r.width/2)/25,rotationX:-(e.clientY-r.top-r.height/2)/35,rotationZ:-9,x:(e.clientX-r.left-r.width/2)/35,y:(e.clientY-r.top-r.height/2)/35,duration:.7,ease:'power2.out'})});
 exhibit?.addEventListener('pointerleave',()=>{if(window.gsap)gsap.to('.hero-model',{rotationX:0,rotationY:0,rotationZ:-9,x:0,y:0,duration:1,ease:'power3.out'})});
 document.addEventListener('pointermove',e=>{if(motion.matches||e.pointerType!=='mouse')return;const card=e.target.closest('.card');if(!card)return;const r=card.getBoundingClientRect();card.style.setProperty('--mx',`${e.clientX-r.left}px`);card.style.setProperty('--my',`${e.clientY-r.top}px`)},{passive:true});
 animatePage();
})();
