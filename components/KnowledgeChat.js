/* 对话区与知识库的衔接：输入框加号菜单引用知识库 / 文件（R3.3），库内对话默认挂载（R3.2），回答保存到知识库（R7.1）。 */
window.KnowledgeChat=(()=>{
 const store=new Map();
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 // 引用范围按页面区分：首页对话与各业务页的 Copilot 互不串用，普通对话不会带上知识库。
 const key=()=>navigationPages[state.nav]||'home';
 const refs=()=>store.get(key())||[];
 function setRefs(list){store.set(key(),list);sync()}
 function addRef(ref){const list=refs().filter(item=>!(item.kind===ref.kind&&item.id===ref.id));list.push(ref);setRefs(list)}
 function removeRef(ref){setRefs(refs().filter(item=>item!==ref))}
 function renderRow(row){
  row.replaceChildren();
  for(const ref of refs()){
   const chip=make('span','kb-ref-chip'),remove=make('button',null,'×');remove.type='button';remove.setAttribute('aria-label','取消引用 '+ref.name);remove.onclick=()=>removeRef(ref);
   chip.append(make('span',null,(ref.kind==='lib'?'知识库：':'文件：')+ref.name+(ref.auto?' · 默认挂载':'')),remove);row.append(chip);
  }
  row.hidden=!row.children.length;
 }
 function sync(){document.querySelectorAll('.kb-ref-row').forEach(renderRow)}
 let pop=null;
 function closePop(){pop?.remove();pop=null}
 function openPop(anchor,build){
  closePop();pop=make('div','kb-pop');pop.setAttribute('role','menu');build(pop);document.body.append(pop);
  const rect=anchor.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(rect.left,innerWidth-pop.offsetWidth-8))+'px';pop.style.bottom=Math.max(8,innerHeight-rect.top+8)+'px';
 }
 const item=(label,action,hint)=>{const b=make('button','kb-pop-item');b.type='button';b.setAttribute('role','menuitem');b.append(make('span',null,label));if(hint)b.append(make('small',null,hint));b.onclick=action;return b};
 function libraryList(anchor){
  openPop(anchor,panel=>{
   panel.append(make('p','kb-pop-title','引用知识库'));
   for(const lib of KnowledgeBasePage.libs())panel.append(item(lib.name,()=>{addRef({kind:'lib',id:lib.id,name:lib.name});closePop()},`${lib.docs.length} 份资料`));
   panel.append(make('p','kb-pop-hint','只检索你引用的知识库与文件；未引用时不会检索任何知识库。'));
  });
 }
 function fileList(anchor){
  openPop(anchor,panel=>{
   panel.append(make('p','kb-pop-title','引用知识库文件'));
   for(const lib of KnowledgeBasePage.libs()){
    panel.append(make('p','kb-pop-group',lib.name));
    for(const doc of lib.docs.slice(0,5)){
     const usable=['ready','partial'].includes(doc.status),row=item(doc.title,()=>{addRef({kind:'doc',id:doc.id,name:doc.title});closePop()},usable?'':'无可检索正文');row.disabled=!usable;panel.append(row);
    }
   }
  });
 }
 function menu(anchor,upload){
  openPop(anchor,panel=>{
   panel.append(item('上传本地文件',()=>{closePop();upload?.()}),item('知识库',()=>libraryList(anchor),'引用整个知识库'),item('知识库文件',()=>fileList(anchor),'引用单份资料'));
  });
 }
 document.addEventListener('pointerdown',event=>{if(pop&&!pop.contains(event.target)&&!event.target.closest('.composer-icon-button'))closePop()},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closePop()});
 const create=ChatComposer.create;
 ChatComposer.create=(thread,options)=>{
  const form=create(thread,options),add=form.querySelector('[aria-label="添加"]'),row=make('div','kb-ref-row');
  form.prepend(row);renderRow(row);
  if(add){const upload=add.onclick;add.setAttribute('aria-haspopup','menu');add.title='添加文件或引用知识库';add.onclick=()=>pop?closePop():menu(add,window.NativeBridge?.available?upload:null)}
  return form;
 };
 /* 回答的「保存到知识库」弹窗，在任意页面的对话区都可用。 */
 function saveAnswer(message,thread){
  const backdrop=make('div','kb-backdrop is-global'),box=make('section','kb-modal');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','保存到知识库');
  const title=make('input','kb-input');title.value='AI 回答：'+(thread?.title||'未命名对话');
  const select=make('select');for(const lib of KnowledgeBasePage.libs()){const option=make('option',null,lib.name);option.value=lib.id;select.append(option)}
  const current=refs().find(ref=>ref.kind==='lib');if(current)select.value=current.id;
  const titleLabel=make('label','kb-label','标题');titleLabel.append(title);const target=make('label','kb-select');target.append(make('span',null,'保存到'),select);
  const foot=make('div','kb-row'),cancel=make('button','kb-btn','取消'),ok=make('button','kb-btn is-primary','保存');cancel.type=ok.type='button';
  const close=()=>backdrop.remove();cancel.onclick=close;backdrop.onclick=event=>{if(event.target===backdrop)close()};
  ok.onclick=()=>{const name=KnowledgeBasePage.addNote(select.value,title.value.trim()||'AI 回答',thread?.title||'对话');close();const tip=make('div','kb-toast is-global','已保存到「'+name+'」，标注为 AI 生成');document.body.append(tip);setTimeout(()=>tip.remove(),2600)};
  foot.append(make('span','kb-grow'),cancel,ok);
  box.append(make('b',null,'保存到知识库'),titleLabel,target,make('p','kb-hint','保存为笔记文件，记录来自哪次对话与保存时间，并标注为 AI 生成。在知识库内的对话中默认保存到当前库。'),foot);
  backdrop.append(box);document.body.append(backdrop);title.focus();title.select();
 }
 return {refs,setRefs,addRef,saveAnswer};
})();
