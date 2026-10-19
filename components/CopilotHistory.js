/* Copilot reads the same history records and ordering as the home sidebar. */
window.CopilotHistory=(()=>{
 let activeRestore=null;
 function open(trigger){
  const panel=document.querySelector('#page-copilot');
  if(!panel||panel.querySelector('.copilot-history-page'))return;
  const saved=[...panel.children].map(node=>({node,inert:node.inert,ariaHidden:node.getAttribute('aria-hidden')}));
  for(const {node}of saved){node.classList.add('copilot-history-underlay');node.inert=true;node.setAttribute('aria-hidden','true')}
  const make=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const page=make('section','copilot-history-page');page.setAttribute('aria-label','全部历史');
  const header=make('header','copilot-history-heading'),title=make('h2','','全部历史');title.tabIndex=-1;
  const search=make('button','copilot-toolbar-button copilot-history-search-toggle');search.type='button';search.title='搜索历史';search.setAttribute('aria-label','搜索历史');search.setAttribute('aria-expanded','false');search.setAttribute('aria-controls','copilot-history-search');
  search.innerHTML='<img src="assets/pages/377a9.svg" alt="">';
  const field=make('div','copilot-history-search');field.id='copilot-history-search';field.hidden=true;
  const glyph=make('img','');glyph.src='assets/pages/377a9.svg';glyph.alt='';
  const input=make('input','');input.type='search';input.placeholder='搜索';input.value='';input.setAttribute('aria-label','搜索对话');input.autocomplete='off';
  const clear=make('button','copilot-history-search-clear','×');clear.type='button';clear.title='收起搜索';clear.setAttribute('aria-label','收起历史搜索');field.append(glyph,input,clear);
  const close=make('button','copilot-toolbar-button copilot-history-close');close.type='button';close.title='关闭全部历史';close.setAttribute('aria-label','关闭全部历史');
  close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const list=make('div','copilot-history-list');list.setAttribute('aria-label','历史记录');
  let observer=null,savedListScroll=0;const expanded=new Map();
  function restore(focus=true){
   observer?.disconnect();activeRestore=null;page.remove();
   for(const {node,inert,ariaHidden}of saved){node.classList.remove('copilot-history-underlay');node.inert=inert;if(ariaHidden===null)node.removeAttribute('aria-hidden');else node.setAttribute('aria-hidden',ariaHidden)}
   if(focus&&trigger?.isConnected)trigger.focus({preventScroll:true});
  }
  activeRestore=restore;
  function selectThread(id){
   if(!ChatStore.get(id))return;
   restore(false);openPageConversation(id);
   document.querySelector('#page-copilot .conversation-input')?.focus({preventScroll:true});
  }
  function threadRow(record,result=false){
   const row=make('button','copilot-history-item');row.type='button';row.dataset.historyThread=record.id;row.title=record.title;row.setAttribute('aria-label',record.title);
   const current=state.pageCopilotKind==='lumi'?'lumi':state.copilotThreadId;
   if(record.id===current)row.setAttribute('aria-current','true');
   row.append(make('span','copilot-history-item-title',record.title),make('small','copilot-history-item-time',result?'对话':record.time));
   row.onclick=()=>selectThread(record.id);return row;
  }
  function setSearch(opened,focus=true){
   if(opened&&!field.hidden)return;
   if(opened)savedListScroll=list.scrollTop;
   field.hidden=!opened;title.hidden=opened;search.hidden=opened;search.setAttribute('aria-expanded',String(opened));
   if(!opened){input.value='';draw();list.scrollTop=savedListScroll}
   if(focus)(opened?input:search).focus({preventScroll:true});
  }
  function draw(){
   const groups=sidebarView.historyRecords(),term=input.value.trim().toLowerCase(),matches=text=>text.toLowerCase().includes(term);
   list.replaceChildren();
   if(term){
    const seen=new Set();
    for(const group of groups)for(const record of group.entries){
     if(seen.has(record.id)||!matches(record.title))continue;
     seen.add(record.id);list.append(threadRow(record,true));
    }
   }else{
    for(const group of groups){
     const section=make('section','copilot-history-group'),toggle=make('button','copilot-history-group-toggle',group.name),body=make('div','copilot-history-group-body');toggle.type='button';
     const opened=expanded.get(group.name)??group.expanded;toggle.setAttribute('aria-expanded',String(opened));body.hidden=!opened;
     toggle.onclick=()=>{const open=body.hidden;expanded.set(group.name,open);body.hidden=!open;toggle.setAttribute('aria-expanded',String(open))};section.append(toggle,body);
     for(const entry of group.entries)body.append(threadRow(entry));
     list.append(section);
    }
   }
   if((term&&!list.children.length)||!groups.some(group=>group.entries.length)){
    const empty=make('p','copilot-history-empty',term?'未找到结果':'暂无历史记录');empty.setAttribute('role','status');list.append(empty);
   }
  }
  search.onclick=()=>setSearch(true);clear.onclick=()=>setSearch(false);input.oninput=draw;
  input.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(input.value){input.value='';draw();list.scrollTop=savedListScroll}else setSearch(false)}};
  field.onfocusout=event=>{if(!field.contains(event.relatedTarget)&&!input.value)setSearch(false,false)};
  close.onclick=()=>restore();header.append(title,search,field,close);page.append(header,list);panel.append(page);draw();
  if(typeof MutationObserver!=='undefined'){
   observer=new MutationObserver(()=>{if(page.isConnected)draw();else observer.disconnect()});
   observer.observe(sidebarView.pane.querySelector('.conversation-scroll'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden','aria-expanded','data-open-chat','data-thread-id']});
  }
  page.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();restore()}};
  title.focus({preventScroll:true});
 }
 return {open,close:()=>activeRestore?.(false)};
})();
