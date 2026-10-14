/* Shared responsive composer, based on Figma 379:53065. */
window.ChatModels=(()=>{
  let models=[],selection={model:'',reasoningEffort:'medium',thinking:true},error='';
  const labels={none:'关闭',minimal:'最少',low:'低',medium:'中',high:'高',xhigh:'超高',max:'最大',ultra:'极限'};
  const snapshot=()=>({...selection});
  const current=()=>models.find(model=>model.id===selection.model)||models[0];
  const label=()=>current()?`${current().label} · ${labels[selection.reasoningEffort]||selection.reasoningEffort}`:'Codex';
  function set(values){
    const model=values.model!==undefined?models.find(model=>model.id===values.model):current();if(!model)return false;
    const supported=(model.efforts||[]).map(value=>value.reasoningEffort),effort=values.reasoningEffort||selection.reasoningEffort;
    selection={model:model.id,reasoningEffort:supported.includes(effort)?effort:model.defaultEffort||supported[0]||'medium',thinking:true};
    selection.thinking=selection.reasoningEffort!=='none';
    try{localStorage.setItem('thsai-v5-model',JSON.stringify(selection))}catch{}
    document.querySelectorAll('.composer-model-label').forEach(node=>node.textContent=label());
    window.dispatchEvent(new CustomEvent('chat-model:changed'));return true;
  }
  function configure(config){
    if(!config.models?.length)return;models=config.models;error='';
    let saved;try{saved=JSON.parse(localStorage.getItem('thsai-v5-model')||'null')}catch{}
    set(models.some(model=>model.id===(saved?.model||selection.model))?saved||selection:{model:config.model,reasoningEffort:config.reasoningEffort});
    window.dispatchEvent(new Event('chat-model:catalog'));
  }
  configure({model:'deepseek-flash',reasoningEffort:'none',models:[{id:'deepseek-flash',name:'DeepSeek-V4.1-Flash',label:'DeepSeek Flash',defaultEffort:'none',efforts:['none','low','high','max'].map(reasoningEffort=>({reasoningEffort}))},{id:'deepseek-v4-pro',name:'DeepSeek-V4-Pro',label:'DeepSeek Pro',defaultEffort:'high',efforts:['none','low','high','max'].map(reasoningEffort=>({reasoningEffort}))}]});
  function fail(message){error=message;window.dispatchEvent(new Event('chat-model:catalog'))}
  return {get models(){return models},get error(){return error},get efforts(){return(current()?.efforts||[]).map(value=>({id:value.reasoningEffort,label:labels[value.reasoningEffort]||value.reasoningEffort}))},label,snapshot,set,configure,fail};
})();

window.ChatComposer=(()=>{
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const asset=name=>{const img=make('img');img.src='assets/composer-v2/'+name;img.alt='';img.draggable=false;const dimensions={'mic.svg':[10.3333,14.3333],'send.svg':[19.3846,19.3846]};if(dimensions[name]){const [width,height]=dimensions[name];img.style.width=width+'px';img.style.height=height+'px'}return img};
  const button=(label,cls)=>{const b=make('button',cls);b.type='button';b.setAttribute('aria-label',label);b.title=label;return b};
  // Classic scrollbars sit inside the shared side gutter so both columns keep the same width.
  const alignColumn=scroll=>{const style=getComputedStyle(scroll),width=Math.max(0,scroll.offsetWidth-scroll.clientWidth-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth))+'px';if(scroll.style.getPropertyValue('--conversation-scrollbar-width')!==width)scroll.style.setProperty('--conversation-scrollbar-width',width)};
  let columnFrame=0;const pendingColumns=new Set();
  const columnObserver=new ResizeObserver(entries=>{
    entries.forEach(({target})=>pendingColumns.add(target));
    if(!columnFrame)columnFrame=requestAnimationFrame(()=>{columnFrame=0;const targets=[...pendingColumns];pendingColumns.clear();targets.forEach(target=>{if(target.isConnected)alignColumn(target)})});
  });
  function observeColumns(){columnObserver.disconnect();document.querySelectorAll('.conversation-log,.copilot-welcome-scroll,.chat-scroll').forEach(scroll=>{alignColumn(scroll);columnObserver.observe(scroll)})}
  window.addEventListener('resize',observeColumns);
  let menu=null,owner=null;
  function closeMenu(focus=false){const trigger=owner;menu?.remove();menu=null;owner=null;trigger?.setAttribute('aria-expanded','false');if(focus&&trigger?.isConnected)trigger.focus({preventScroll:true})}
  function updateMenu(){
    if(!menu)return;const value=ChatModels.snapshot();
    menu.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.model===value.model)));
    menu.querySelectorAll('[data-effort]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.effort===(value.thinking?value.reasoningEffort:'none'))));
  }
  function openMenu(trigger,focus=false,refresh=true){
    if(owner===trigger){closeMenu();return}closeMenu();owner=trigger;trigger.setAttribute('aria-expanded','true');
    menu=make('div','composer-model-menu');menu.id='composer-model-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','模型与思考强度');
    menu.append(make('p','composer-menu-heading','模型'));
    if(!ChatModels.models.length)menu.append(make('p','composer-menu-status',ChatModels.error||'正在加载可用模型…'));
    for(const model of ChatModels.models){
      const option=button(model.name,'composer-model-option');option.setAttribute('role','menuitemradio');option.dataset.model=model.id;
      option.append(make('span',null,model.name),make('span','composer-option-check','✓'));option.onclick=()=>{ChatModels.set({model:model.id});closeMenu();openMenu(trigger)};menu.append(option);
    }
    const section=make('div','composer-effort-section'),group=make('div','composer-effort-options');group.setAttribute('role','group');group.setAttribute('aria-label','思考强度');section.append(make('p','composer-menu-heading','思考强度'));
    for(const effort of ChatModels.efforts){const option=button('思考强度：'+effort.label,'composer-effort-option');option.textContent=effort.label;option.dataset.effort=effort.id;option.setAttribute('role','menuitemradio');option.onclick=()=>ChatModels.set({reasoningEffort:effort.id});group.append(option)}
    section.append(group);menu.append(section);if(NativeBridge.available){const settings=button('Codex 账号与工具','composer-model-option');settings.textContent='Codex 账号与工具';settings.onclick=()=>{closeMenu();CodexUI.openSettings()};menu.append(settings)}document.body.append(menu);updateMenu();
    const rect=trigger.getBoundingClientRect();menu.style.right=Math.max(8,Math.min(innerWidth-rect.right,innerWidth-menu.offsetWidth-8))+'px';menu.style.bottom=Math.max(8,innerHeight-rect.top+8)+'px';
    if(focus)menu.querySelector('[data-model][aria-checked=true],button')?.focus();
    if(refresh&&NativeBridge.available)CodexUI.refresh().catch(()=>{});
    menu.onkeydown=event=>{
      if(event.key==='Escape'){event.preventDefault();closeMenu(true);return}
      const options=[...menu.querySelectorAll('button')],index=options.indexOf(document.activeElement);
      if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:-1)+options.length)%options.length;options[next].focus()}
    };
  }
  document.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target)&&!owner?.contains(event.target))closeMenu()},true);
  document.addEventListener('keydown',event=>{if(menu&&event.key==='Escape'){event.preventDefault();closeMenu(true)}});
  document.addEventListener('focusin',event=>{if(menu&&!menu.contains(event.target)&&!owner?.contains(event.target))closeMenu()});
  window.addEventListener('resize',()=>closeMenu());window.addEventListener('chat-model:changed',updateMenu);
  window.addEventListener('chat-model:catalog',()=>{if(!menu)return;const trigger=owner;closeMenu();if(trigger?.isConnected)openMenu(trigger,false,false)});
  function create(thread,{submitDraft,placeholder='现在帮你做什么'}={}){
    const personal=thread.kind==='personal',form=make('form','conversation-composer chat-composer'+(personal?' lumi-home-composer':''));form.dataset.nodeId='379:52932';
    const field=make('div','composer-field'),input=make('textarea','conversation-input editor');input.rows=2;input.placeholder=placeholder;input.setAttribute('aria-label','对话输入');input.value=thread.draft||'';field.append(input);
    const toolbar=make('div','composer-toolbar'),left=make('div','composer-toolbar-left'),right=make('div','composer-toolbar-right');
    const add=button('添加','composer-icon-button');add.append(asset('add.svg'));add.setAttribute('aria-pressed','false');add.onclick=()=>NativeBridge.available?CodexUI.refresh().then(()=>NativeBridge.call('chooseAttachments')).then(files=>{delete thread.draftError;thread.attachments=[...(thread.attachments||[]),...files].filter((file,index,list)=>list.findIndex(item=>item.path===file.path)===index);renderAttachments()}).catch(error=>{thread.draftError=error.message;renderAttachments()}):add.setAttribute('aria-pressed',String(add.getAttribute('aria-pressed')!=='true'));left.append(add);
    // The optional selected expert uses the design's avatar slot; new chats keep no preselected expert.
    if(thread.expert){const expert=make('div','composer-expert');expert.append(asset('expert.png'),make('span',null,thread.expert.name));left.append(expert)}
    const model=button('模型与思考程度','composer-model-trigger');model.setAttribute('aria-haspopup','menu');model.setAttribute('aria-expanded','false');model.setAttribute('aria-controls','composer-model-menu');model.append(make('span','composer-model-label',ChatModels.label()),asset('chevron.svg'));model.onclick=()=>openMenu(model);model.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();openMenu(model,true)}};
    const mic=button('语音输入','composer-icon-button');mic.append(asset('mic.svg'));mic.setAttribute('aria-pressed','false');mic.onclick=()=>mic.setAttribute('aria-pressed',String(mic.getAttribute('aria-pressed')!=='true'));
    const send=button('发送','composer-icon-button composer-send conversation-send');send.append(asset('send.svg'));send.dataset.lumiSend='';
    right.append(model,mic,send);toolbar.append(left,right);form.append(field,toolbar);
    const attachmentRow=make('div','codex-attachments');form.prepend(attachmentRow);
    function renderAttachments(){attachmentRow.replaceChildren();for(const file of thread.attachments||[]){const chip=make('div','codex-attachment'),remove=button('移除附件 '+file.name,'');remove.textContent='×';remove.onclick=()=>{thread.attachments=thread.attachments.filter(item=>item.path!==file.path);renderAttachments()};chip.append(make('span',null,file.name),remove);attachmentRow.append(chip)}if(thread.draftError)attachmentRow.append(make('span','codex-note is-error',thread.draftError));attachmentRow.hidden=!attachmentRow.children.length;requestAnimationFrame(()=>{if(form.isConnected)update()})}renderAttachments();
    const update=()=>{
      if(thread.pending){send.disabled=false;send.setAttribute('aria-label','停止生成');send.title='停止生成';send.textContent='■'}else{send.setAttribute('aria-label','发送');send.title='发送';send.replaceChildren(asset('send.svg'));send.disabled=!input.value.trim()}
      if(form.classList.contains('is-preview-floating')){
        form.classList.add('is-preview-compact');input.rows=1;input.style.height='20px';
        const expanded=!!input.value&&(input.value.includes('\n')||input.scrollHeight>input.clientHeight+1)||!attachmentRow.hidden||form.classList.contains('has-reply-quote');
        form.classList.toggle('is-preview-compact',!expanded);if(!expanded)return;
      }
      input.rows=2;input.style.height='38px';input.style.height=Math.min(180,Math.max(38,input.scrollHeight))+'px';
    };
    const submit=()=>{if(!input.value.trim()||thread.pending)return;if(submitDraft?submitDraft(input.value):ChatStore.submit(thread.id,input.value)){input.value='';if(personal)LumiReply.renderQuote(form,thread);update();if(input.isConnected)input.focus({preventScroll:true})}};
    send.onclick=()=>thread.pending?ChatStore.stop(thread.id):submit();form.onsubmit=event=>{event.preventDefault();submit()};input.oninput=()=>{thread.draft=input.value;update()};input.onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit()}};
    form.refreshComposer=()=>{renderAttachments();update()};update();queueMicrotask(observeColumns);requestAnimationFrame(update);if(personal)LumiReply.renderQuote(form,thread);return form;
  }
  return {create,closeMenu};
})();
