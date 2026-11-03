/* Shared local persistence tools. No credentials or network upload. */
'use strict';
function refreshLearningTools(){
 const badge=$('#saveStatus');if(badge)badge.textContent=storageHealthy?(state.savedAt?'✓ 已自动保存 · '+new Date(state.savedAt).toLocaleString('zh-CN'):'自动保存已开启'):'保存失败：请导出备份，并检查浏览器存储空间或权限';
 const history=$('#importHistory');if(history)history.innerHTML='<h3>题库导入记录</h3><p class="mini muted">已保存 '+state.imported.length+' 道自定义题目</p>'+ (state.imports.length?state.imports.map(x=>`<div class="history-item"><span>${esc(x.name)}<small style="display:block">${esc(new Date(x.at).toLocaleString('zh-CN'))}</small></span><span>${x.count} 题 · 跳过 ${x.duplicates||0} 重复</span></div>`).join(''):'<p class="small muted">尚无导入批次。此前导入的题目也会继续保留。</p>');
 const panel=$('#resumeQuizPanel');if(panel)panel.innerHTML=state.draft?'<div class="card" style="padding:18px;margin-bottom:20px"><strong>有一份自动保存的练习</strong><p class="mini muted">可以继续上次的题目，也可以重新生成练习。</p><button class="btn btn-gold" id="resumeQuiz">继续上次练习 ↗</button></div>':'';
 if($('#resumeQuiz'))$('#resumeQuiz').onclick=resumeQuiz;
 const select=$('#quizTopic');if(select){const value=select.value;const systems=[...new Set(getBank().map(q=>q.system))];select.innerHTML='<option value="all">全部系统与区域</option>'+systems.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');select.value=systems.includes(value)?value:'all'}
}
function resumeQuiz(){
 const d=state.draft;if(!d)return;const bank=new Map(getBank().map(q=>[q.id,q]));
 if(!Array.isArray(d.ids)||!d.ids.length||d.ids.some(id=>!bank.has(id))||!Number.isInteger(d.cursor)||d.cursor<0||d.cursor>=d.ids.length){state.draft=null;save();refreshLearningTools();toast('这份练习引用的题目已不存在，请重新生成。');return}
 navigate('quiz');quizSession={questions:d.ids.map(id=>bank.get(id)),startedAt:Date.now()};quizCursor=d.cursor;quizAnswers=Array.isArray(d.answers)?d.answers.slice():[];
 $('#quizSetup').classList.add('hide');$('#quizSummary').classList.add('hide');$('#quizScreen').classList.remove('hide');renderQuestion();quizSelected=d.selected;
 const input=$('#clozeAnswer');if(input)input.value=d.text||'';
 if(d.answered){quizAnswers=quizAnswers.slice(0,d.cursor);submitQuiz()}else{if(quizSelected!==null)$$('#quizChoices .quiz-option').forEach((b,i)=>b.classList.toggle('selected',i===quizSelected));persistQuiz()}
 toast('已恢复上次的练习进度');
}
function validQuestion(q){return q&&typeof q.id==='string'&&typeof q.q==='string'&&typeof q.system==='string'&&['cn','en','label','cloze'].includes(q.type)&&typeof q.explain==='string'&&(q.type==='cloze'?typeof q.answer==='string':Array.isArray(q.options)&&q.options.length===4&&q.options.every(x=>typeof x==='string')&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4)}
function validateBackup(payload){
 if(!payload||payload.version!==1||!payload.data||typeof payload.data!=='object')throw Error('不是受支持的学习档案备份');
 const d=payload.data;
 for(const key of ['mastered','favorites','wrong','specFavorites','visited'])if(!Array.isArray(d[key])||!d[key].every(x=>typeof x==='string'))throw Error('记录格式不正确：'+key);
 if(!Array.isArray(d.imported)||!d.imported.every(validQuestion)||new Set(d.imported.map(q=>q.id)).size!==d.imported.length)throw Error('题库格式不正确或题目编号重复');
 if(!Array.isArray(d.attempts)||!d.attempts.every(a=>a&&Number.isFinite(a.total)&&a.total>=0&&Number.isFinite(a.correct)&&a.correct>=0&&a.correct<=a.total&&Number.isFinite(a.pct)&&a.pct>=0&&a.pct<=100&&typeof a.date==='string'&&Number.isFinite(Date.parse(a.date))))throw Error('成绩记录格式不正确');
 if(!Array.isArray(d.chat)||!d.chat.every(c=>c&&['user','assistant'].includes(c.role)&&typeof c.text==='string'))throw Error('问答记录格式不正确');
 if(typeof d.nickname!=='string'||!Number.isFinite(d.totalSecs)||d.totalSecs<0)throw Error('档案格式不正确');
 if(d.imports!==undefined&&(!Array.isArray(d.imports)||!d.imports.every(i=>i&&typeof i.name==='string'&&Number.isInteger(i.count)&&i.count>=0&&typeof i.at==='string'&&Number.isFinite(Date.parse(i.at)))))throw Error('导入历史格式不正确');
 const clean={...defaults()};for(const k of Object.keys(clean))if(Object.hasOwn(d,k))clean[k]=d[k];
 // Only restore a structurally valid draft; its IDs are checked against the bank on resume.
 if(clean.draft){const x=clean.draft;if(!Array.isArray(x.ids)||!x.ids.every(id=>typeof id==='string')||!Number.isInteger(x.cursor)||x.cursor<0||x.cursor>=x.ids.length||!Array.isArray(x.answers)||x.answers.length>x.ids.length||!x.answers.every(a=>a&&typeof a.question==='string'&&typeof a.ok==='boolean')||!(x.selected===null||Number.isInteger(x.selected)&&x.selected>=0&&x.selected<4)||typeof x.answered!=='boolean'||typeof x.text!=='string')clean.draft=null}
 return clean;
}
async function restoreLearningBackup(file){
 if(!file)return;if(file.size>8*1024*1024){toast('备份文件超过 8 MB');return}
 try{const replacement=validateBackup(JSON.parse(await file.text()));if(!confirm(`恢复备份将替换当前浏览器的记录（包含 ${replacement.imported.length} 道导入题）。建议先导出当前记录。继续吗？`))return;
 const old=state;state=replacement;if(!save()){state=old;refreshLearningTools();throw Error('浏览器无法保存恢复的数据，原记录已保留')}
 quizSession=null;quizAnswers=[];renderLearn();renderDashboard();renderQuizSetup();renderChat();refreshLearningTools();toast('题库和学习记录已恢复并保存。')
 }catch(e){toast('恢复失败：'+e.message)}
}
function initLearningTools(){
 // The chapter hub preserves every source Q/A and offers chapter-specific practice.
 const chapters=[...new Set(regional.knowledge.map(k=>k.chapter))];
 $('#regionalChapters').innerHTML=chapters.map((c,i)=>{const knowledge=topics.filter(t=>t.chapter===c);const count=builtInBank.filter(q=>q.system==='局解·'+c).length;return `<article class="card" style="padding:24px"><span class="eyebrow">REGION ${String(i+1).padStart(2,'0')}</span><h2>${esc(c)}</h2><p class="muted">${knowledge.length} 条知识 · ${count} 道中英文题</p><p class="small">${esc([...new Set(regional.knowledge.filter(k=>k.chapter===c).map(k=>k.sub))].join(' · '))}</p><button class="btn btn-sm" data-regional-learn="${esc(c)}">阅读本章</button><button class="btn btn-sm" data-regional-quiz="${esc(c)}">本章练习</button></article>`}).join('');
 document.addEventListener('click',e=>{const learn=e.target.closest('[data-regional-learn]'),quiz=e.target.closest('[data-regional-quiz]');if(learn){const chapter=learn.dataset.regionalLearn;openKnowledge(topics.find(t=>t.chapter===chapter).id)}if(quiz){navigate('quiz');$('#quizTopic').value='局解·'+quiz.dataset.regionalQuiz;$('#quizType').value='all';$('#quizDifficulty').value='all';$('#quizMode').value='all'}});
 if(!$('#navLinks [data-route="regional"]')){const b=document.createElement('button');b.className='nav-link';b.dataset.route='regional';b.textContent='局部解剖';$('#navLinks').append(b)}
 $('#restoreData').onclick=()=>$('#restoreInput').click();$('#restoreInput').onchange=async e=>{await restoreLearningBackup(e.target.files[0]);e.target.value=''};
 $('#persistentStorage').onclick=async()=>{try{const ok=await navigator.storage?.persist?.();toast(ok?'浏览器已允许持久保留本机数据。':'浏览器暂未授予持久保留；普通自动保存仍然有效，请定期导出备份。')}catch{toast('此浏览器不支持持久保留申请，请定期导出备份。')}};
 document.addEventListener('input',e=>{if(e.target.id==='clozeAnswer')persistQuiz()});
 window.addEventListener('learning-saved',refreshLearningTools);window.addEventListener('bank-imported',refreshLearningTools);
 // Keep imported banks and records current even while another tab's quiz is open.
 window.addEventListener('storage',e=>{if(e.key===STORAGE&&e.newValue){try{const incoming=validateBackup({version:1,data:JSON.parse(e.newValue)});if(quizSession){incoming.draft=state.draft;const known=new Set(incoming.imported.map(q=>q.id));incoming.imported.push(...state.imported.filter(q=>quizSession.questions.some(active=>active.id===q.id)&&!known.has(q.id)))}state=incoming;refreshLearningTools();if(page==='dashboard')renderDashboard();if(page==='learn')renderLearn()}catch{}}});
 refreshLearningTools();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initLearningTools);else initLearningTools();
