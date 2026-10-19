/* 对话区与知识库的衔接（10-19 改版）：存和用都在对话里完成，用户不需要手动引用或选库。
   ① 存：发链接或文件（默认自动存档），或说「记下来 / 存到知识库」→ 调 kb_save，卡片展示读取进度，完成后可查看或撤销。
   ② 用：问到知识库里有的内容时，先 kb_search（改写成「关键词|同义词」）再 kb_read_excerpt，回答逐句标注 [n]，
      下方列出引用片段（平台 · 作者 · 时间点 / 段落），点击回到知识库原文位置。工具调用折叠展示，默认不打扰。 */
window.KnowledgeChat=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const KB=()=>KnowledgeBasePage;
 const SAVE=/记下来|记一下|记住|存一下|存下来|存起来|存到知识库|存进知识库|收藏|放进知识库|加到知识库|保存到知识库/;
 const URL_RE=/https?:\/\/[^\s，。]+/;
 const sessions=new Map();let seq=0,mid=0;
 const changed=id=>dispatchEvent(new CustomEvent('conversation:changed',{detail:{id,reason:'update'}}));
 const now=()=>{try{return ChatStore.clock()}catch{return {}}};
 const msg=(role,text,extra={})=>({id:'kb-msg-'+(++mid),role,text,...now(),status:null,...extra});
 function say(thread,text,s){thread.messages.push(msg('assistant',text,s?{kb:{sid:s.id}}:{}));thread.pendingScroll='bottom';changed(thread.id)}
 const later=(fn,ms=500)=>setTimeout(fn,ms);
 function globalToast(html,actions={}){
  document.querySelector('.kb-toast.is-global')?.remove();
  const tip=document.createElement('div');tip.className='kb-toast is-global kn-toast';tip.setAttribute('role','status');tip.innerHTML=html;
  tip.onclick=e=>{const b=e.target.closest('[data-kn]');if(b){actions[b.dataset.kn]?.();tip.remove()}};
  document.body.append(tip);setTimeout(()=>tip.remove(),4200);
 }

 /* ---------- 存 ---------- */
 function save(thread,source,opts){
  const s={id:'ks'+(++seq),type:'save',thread:thread.id,source};sessions.set(s.id,s);
  const r=KB().ingest(source,{...opts,onStep:()=>changed(thread.id)});
  if(r.dup){s.dup=r.dup.id;say(thread,'这条内容之前已经存过了，没有重复保存。',s);return}
  s.itemId=r.item.id;s.steps=r.steps;
  const kind=r.item.kind,lead={video:'收到，我先把这条视频的语音转成文字，再提炼要点存进知识库。',post:'收到，我读一下这篇笔记（包括图片里的文字），整理好存进知识库。',article:'收到，我读一下正文，整理好存进知识库。',file:'收到，我解析一下这个文件，整理好存进知识库。',answer:'好的，把这段回答存进知识库。',note:'好的，记下来了，存进知识库。'}[kind];
  say(thread,lead,s);
 }
 function lastAnswer(thread){return [...thread.messages].reverse().find(m=>m.role==='assistant'&&m.text&&!m.kb)}

 /* ---------- 用：检索并带引用回答 ---------- */
 function answer(thread,text,result){
  const s={id:'ks'+(++seq),type:'cite',thread:thread.id,result};sessions.set(s.id,s);
  const {hits}=result;
  const lines=hits.map((h,i)=>{const who=h.item.kind==='answer'?'你之前存的一段回答':h.item.kind==='file'?`《${h.item.title.replace(/\.[a-z]+$/i,'')}》`:`${h.item.author}（${h.item.platform}）`;return `${who}提到：${h.chunk.text.replace(/。$/,'')}。[${i+1}]`});
  const body=`从你的知识库里找到 ${hits.length} 条相关内容，先按出处摆出来：\n\n${lines.join('\n\n')}\n\n${hits.length>1?'几条说法大体一致；如果要下判断，建议重点核对出处里的原始数据。':'目前只有这一条出处，结论偏单薄，可以再找几篇不同来源的内容存进来。'}以上只依据你存过的内容，知识库之外的信息我没有补充。`;
  thread.messages.push(msg('assistant',body,{kb:{sid:s.id}}));thread.pendingScroll='bottom';
  KB().cite(hits,thread.title||'当前对话');changed(thread.id);
 }

 /* ---------- 卡片 ---------- */
 const button=(label,act,cls='')=>`<button type="button" class="kb-btn is-small ${cls}" data-kn-act="${act}">${esc(label)}</button>`;
 const chip=(text,cls='')=>`<span class="kb-chip ${cls}">${esc(text)}</span>`;
 function body(s){
  if(s.type==='cite'){
   const {hits,query}=s.result;
   return `<details class="kn-trace"><summary>检索了知识库 · 命中 ${hits.length} 条</summary><ol><li><code>kb_search("${esc(query)}")</code> → ${s.result.total_results} 条知识命中，取前 ${hits.length} 条</li>${hits.slice(0,2).map(h=>`<li><code>kb_read_excerpt("${h.item.id}", "${esc(h.matched[0]||'')}")</code> → ${esc(h.chunk.loc)} 前后</li>`).join('')}</ol></details>
    <div class="kn-refs"><span class="bt-chat-sub">引用 · 来自你的知识库</span>${hits.map((h,i)=>`<button type="button" class="kn-ref" data-kn-act="open" data-id="${h.item.id}" data-chunk="${h.chunk.id}"><span class="kn-ref-n">[${i+1}]</span><span class="kn-ref-body"><span class="kn-ref-meta"><span class="kn-badge is-${h.item.kind}">${esc(h.item.platform)}</span>${esc(h.item.title)} · ${esc(h.chunk.loc)}</span><span class="kn-ref-text">${esc(h.chunk.text)}</span></span></button>`).join('')}</div>`;
  }
  if(s.dup){const x=KB().get(s.dup);return x?`<div class="bt-chat-head"><span class="kn-badge is-${x.kind}">${esc(x.platform)}</span><b>${esc(x.title)}</b><span class="bt-chat-grow"></span>${chip('已在知识库')}</div><div class="bt-chat-actions">${button('查看','view')}</div>`:''}
  const x=KB().get(s.itemId);
  if(!x)return `<p class="bt-chat-sub">已撤销，这条内容没有存进知识库。</p>`;
  if(x.status==='reading')return `<div class="bt-chat-head"><span class="kn-badge is-${x.kind}">${esc(x.platform)}</span><b>正在存入知识库</b><span class="bt-chat-grow"></span><code class="bt-chat-sub">kb_save</code></div>
   <ol class="kn-steps">${(x.steps||s.steps).map((t,i)=>`<li class="${i<x.step?'is-done':i===x.step?'is-active':''}">${t}</li>`).join('')}</ol>${x.url?`<p class="bt-chat-sub kn-url">${esc(x.url)}</p>`:''}`;
  /* 读取失败：如实说明原因，并给出补救的路；补救后仍是同一条知识，这张卡片会接着显示进度。 */
  if(x.status==='failed'){
   const f=KB().FAILS[x.failType]||KB().FAILS.private,web=['login','blocked'].includes(x.failType),video=x.kind==='video';
   return `<div class="bt-chat-head"><span class="kn-badge is-${x.kind}">${esc(x.platform)}</span><b>没有存进来</b>${chip(f.label,'is-warn')}</div>
    <p>${esc(f.reason)}${web?'你可以在应用内打开它，自己登录或完成验证后，我再存你看到的这一页。':''}</p>
    ${s.awaitPaste?`<p class="bt-chat-sub">直接把${video?'文案或字幕':'正文'}粘贴发给我就行，出处仍记为原链接。</p>`:''}
    <div class="bt-chat-actions">${web?button('在应用内打开','browse','is-primary'):''}${s.awaitPaste?'':button(video?'粘贴文案或字幕':'粘贴正文','paste')}<label class="kb-btn is-small kn-upload" tabindex="0" role="button">上传截图<input type="file" data-kn-shot accept="image/*" multiple hidden></label>${button('不存了','dismiss')}</div>
    ${x.platform==='公众号'?'<p class="bt-chat-sub">公众号文章也可以在微信里直接转发给 Lumi。</p>':''}`;
  }
  return `<div class="bt-chat-head"><span class="kn-badge is-${x.kind}">${esc(x.platform)}</span><b>${esc(x.title)}</b><span class="bt-chat-grow"></span>${chip('已存入知识库','is-notice')}</div>
   <p class="bt-chat-sub">${esc(x.author)}${x.duration?' · '+esc(x.duration):''} · 提炼出 ${x.points.length} 个要点，切成 ${x.chunks.length} 个片段</p>
   <ul class="bt-chat-checks">${x.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>
   <div class="bt-chat-actions">${button('查看','view')}${button('撤销','undo')}<span class="bt-chat-sub">之后问到相关问题，Lumi 会自动引用它。</span></div>`;
 }
 const ACTS={
  view(s){KB().open({id:s.itemId||s.dup})},
  open(s,el){KB().open({id:el.dataset.id,chunk:el.dataset.chunk})},
  undo(s){KB().remove(s.itemId);changed(s.thread)},
  dismiss(s){KB().remove(s.itemId);changed(s.thread)},
  browse(s){KB().browse(s.itemId)},
  paste(s){s.awaitPaste=true;changed(s.thread);document.querySelector('#page-copilot .conversation-input,#page-copilot textarea,.conversation-input')?.focus()},
  shot(s){KB().fix(s.itemId,{how:'shot'});changed(s.thread)}
 };
 function card(message){
  const s=sessions.get(message.kb.sid),node=document.createElement('section');node.className='bt-chat-card kn-card'+(s?.type==='cite'?' is-cite':'');
  if(!s){node.innerHTML='<p class="bt-chat-sub">这张卡片来自上一次打开的页面，刷新后不可再操作。</p>';return node}
  node.innerHTML=body(s);
  node.addEventListener('click',e=>{const el=e.target.closest('[data-kn-act]');if(!el||el.disabled)return;e.stopPropagation();ACTS[el.dataset.knAct]?.(s,el)});
  node.addEventListener('change',e=>{if(e.target.matches('[data-kn-shot]')&&e.target.files.length)ACTS.shot(s)});
  return node;
 }

 /* 回答菜单里的「保存到知识库」：直接存，不弹窗，给撤销。 */
 function saveAnswer(message,thread){
  const title=(message.text.split('\n')[0]||'').replace(/[。！？]$/,'').slice(0,24)||'AI 回答';
  const r=KB().ingest(message.text+(message.after?'\n'+message.after:''),{via:'回答菜单保存',fromChat:thread?.title||'对话',title,body:message.text});
  globalToast(`已存入知识库：${esc(title)}<button type="button" class="kb-link" data-kn="view">查看</button><button type="button" class="kb-link" data-kn="undo">撤销</button>`,{view:()=>KB().open({id:r.item.id}),undo:()=>KB().remove(r.item.id)});
 }

 /* ---------- 对话里发文件：网页版的加号直接选文件（桌面端走原有的附件流程），发送后每个文件存一条 ---------- */
 const pending=new Map(),pageKey=()=>navigationPages[state.nav]||'home';
 const ACCEPT='.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.txt,.html,.epub,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.wav,.mp4,.mov';
 function renderFiles(row){
  const files=pending.get(pageKey())||[];
  row.innerHTML=files.map((f,i)=>`<span class="codex-attachment">${esc(f)}<button type="button" data-i="${i}" aria-label="移除附件 ${esc(f)}">×</button></span>`).join('')+(files.length?'<span class="bt-chat-sub">发送后存进知识库</span>':'');
  row.hidden=!files.length;
 }
 const syncFiles=()=>document.querySelectorAll('.kn-attach-row').forEach(renderFiles);
 function installComposer(){
  if(!window.ChatComposer||ChatComposer.__kb)return;ChatComposer.__kb=true;
  const create=ChatComposer.create;
  ChatComposer.create=(thread,options)=>{
   const form=create(thread,options),add=form.querySelector('[aria-label="添加"]');
   if(window.NativeBridge?.available||!add)return form;
   const row=document.createElement('div'),input=document.createElement('input');row.className='kn-attach-row';
   input.type='file';input.multiple=true;input.accept=ACCEPT;input.hidden=true;
   input.onchange=()=>{pending.set(pageKey(),[...(pending.get(pageKey())||[]),...[...input.files].map(f=>f.name)]);input.value='';syncFiles();form.querySelector('textarea')?.focus()};
   row.onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;const files=pending.get(pageKey())||[];files.splice(+b.dataset.i,1);syncFiles()};
   add.title='上传文件';add.onclick=()=>input.click();
   form.prepend(row);form.append(input);renderFiles(row);
   return form;
  };
 }
 installComposer();

 /* ---------- 接入对话提交（目标、策略回测之后判断；都不命中再交给原始回答） ---------- */
 function install(){
  if(!window.ChatStore||ChatStore.__kb)return;ChatStore.__kb=true;
  const original=ChatStore.submit;
  ChatStore.submit=(id,text)=>{
   const thread=ChatStore.get(id),t=String(text||'').trim();
   if(!thread||thread.kind==='personal'||thread.pending||!t)return original(id,text);
   const url=t.match(URL_RE)?.[0],wantSave=SAVE.test(t),cfg=KB().settings;
   const files=pending.get(pageKey())||[];
   const push=(extra={})=>{thread.messages.push(msg('user',t,extra));thread.draft='';thread.pendingScroll='bottom';changed(id)};
   /* 读取失败后用户选了「粘贴正文」：下一条消息就是正文，挂到原来那条知识下面存。 */
   const waiting=[...sessions.values()].find(x=>x.thread===id&&x.awaitPaste);
   if(waiting&&!url&&t.length>=10){waiting.awaitPaste=false;push();later(()=>{const n={id:'ks'+(++seq),type:'save',thread:id,itemId:waiting.itemId};sessions.set(n.id,n);KB().fix(waiting.itemId,{how:'paste',text:t});say(thread,'收到，按你粘贴的内容存进去，出处仍然记为原链接。',n)});return true}
   if(files.length&&(cfg.autoSave||wantSave)){pending.delete(pageKey());syncFiles();push({attachments:files.map(name=>({name,path:name}))});files.forEach((name,i)=>later(()=>save(thread,name,{via:'对话中发送文件',fromChat:thread.title}),500+i*300));return true}
   if(url&&(cfg.autoSave||wantSave)){push();later(()=>save(thread,url,{via:'对话中发送链接',fromChat:thread.title}));return true}
   if(wantSave){
    const rest=t.replace(SAVE,'').replace(/^[\s:：,，把这个帮我请]+/,'').trim();
    if(rest.length>=8){push();later(()=>save(thread,rest,{via:'对话中说「记下来」',fromChat:thread.title}));return true}
    const prev=lastAnswer(thread);
    if(prev){push();later(()=>save(thread,prev.text,{via:'对话中说「记下来」',fromChat:thread.title,body:prev.text,title:(prev.text.split('\n')[0]||'').slice(0,24)}));return true}
   }
   if(cfg.autoSearch){const q=KB().rewrite(t);if(q){const result=KB().search(q);if(result.hits.length){push();thread.pending=true;later(()=>{thread.pending=false;answer(thread,t,result)},900);return true}}}
   return original(id,text);
  };
 }
 addEventListener('DOMContentLoaded',install);install();
 return {card,saveAnswer};
})();
