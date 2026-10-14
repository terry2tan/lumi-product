/* Shared artifact collection for conversation cards and document previews. */
window.WorkbenchPage=(()=>{
 const items=new Map();let query='',layout='grid',noticeTimer,picker=null,pickerAnchor=null,openTimer,closeTimer;
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 const glyph=(name)=>({grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'}[name]);
 const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">${glyph(name)}</svg>`;
 const seeds=[['market-observation','市场观察'],['industry-research','产业链研究'],['portfolio-review','持仓复盘'],['company-research','公司研究'],['sector-tracking','板块跟踪'],['earnings-notes','财报笔记'],['watchlist','自选观察'],['weekly-review','每周复盘']].map(([id,title],index)=>({id:`workbench-${id}`,title,type:'text',text:'',savedAt:`2026-10-${String(12-index).padStart(2,'0')}T07:00:00.000Z`}));
 try{localStorage.removeItem('thsai-v4-workbench')}catch{}
 for(const file of seeds)items.set(file.id,file);
 function notice(text){let el=document.getElementById('workbench-save-status');if(!el){el=make('div','workbench-save-status');el.id='workbench-save-status';el.setAttribute('role','status');document.body.append(el)}el.textContent=text;el.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.hidden=true,2500)}
 function syncButtons(){for(const button of document.querySelectorAll('[data-save-workbench]')){const saved=items.has(button.dataset.saveWorkbench);button.textContent=saved?'已保存':'保存到工作台';button.disabled=saved;button.setAttribute('aria-label',saved?'已保存到工作台':'保存到工作台')}}
 function save(source,{notify=true}={}){
  if(!source?.id||!source.title)return false;
  if(items.has(source.id)){if(notify)notice('已保存到工作台');return true}
  const file=JSON.parse(JSON.stringify({...source,text:source.text||'',savedAt:new Date().toISOString()}));items.set(file.id,file);
  syncButtons();refresh();if(notify)notice('已保存到工作台');return true;
 }
 function saveButton(file){const button=make('button','artifact-save-button','保存到工作台');button.type='button';button.dataset.saveWorkbench=file.id;button.onclick=()=>save(file);const saved=items.has(file.id);button.disabled=saved;button.textContent=saved?'已保存':'保存到工作台';button.setAttribute('aria-label',saved?'已保存到工作台':'保存到工作台');return button}
 function moreButton(){const button=make('button','copilot-toolbar-button artifact-preview-more');button.type='button';button.title='更多';button.setAttribute('aria-label','更多选项');button.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';return button}
 function previewHeader(file){const header=make('header','artifact-preview-header');header.setAttribute('aria-label','文件预览标题栏');const name=make('span','artifact-preview-title',file.title);name.title=file.title;header.append(name,saveButton(file),moreButton());return header}
 function artifactCard(file,owner){const card=make('div','conversation-report-card artifact-card');card.setAttribute('role','group');card.setAttribute('aria-label',file.title);const open=make('button','artifact-open');open.type='button';open.dataset.fileId=file.id;open.setAttribute('aria-label',`打开${file.title}`);const image=make('img');image.src='assets/navigation/文件.svg';image.alt='';open.append(image,make('span','artifact-card-title',file.title),make('span','conversation-report-link','打开'));open.onclick=()=>HomeLayout.openDocument(file,owner.id);card.append(open,saveButton(file));return card}
 function tile(file){
  const card=make('article','workbench-artifact');card.dataset.workbenchFile=file.id;const open=make('button','workbench-artifact-open');open.type='button';open.setAttribute('aria-label',`打开${file.title}`);open.setAttribute('aria-current',String(window.WorkbenchTabs?.active()===file.id));
  const thumbnail=make('div','workbench-thumbnail');thumbnail.setAttribute('aria-hidden','true');
  const body=make('div','workbench-artifact-body'),title=make('h2',null,file.title),date=new Date(file.savedAt);title.title=file.title;body.append(title,make('span','workbench-artifact-meta',`${date.getMonth()+1}月${date.getDate()}日`));open.append(thumbnail,body);open.onclick=()=>{hidePicker();WorkbenchTabs.openDocument(file)};card.append(open);return card;
 }
 function refresh(){for(const page of document.querySelectorAll('.workbench-library'))draw(page)}
 function draw(page){
  const compact=page.classList.contains('is-compact'),term=compact?page.querySelector('input').value:query,list=page.querySelector('.workbench-artifacts');list.classList.toggle('is-list',compact||layout==='list');list.replaceChildren();
  const filtered=[...items.values()].filter(file=>file.title.toLowerCase().includes(term.trim().toLowerCase())).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));for(const file of filtered)list.append(tile(file));
  const empty=page.querySelector('.workbench-empty');empty.hidden=filtered.length>0;empty.textContent=term?'未找到匹配的内容':'暂无内容';
  for(const button of page.querySelectorAll('[data-workbench-layout]'))button.setAttribute('aria-pressed',String(button.dataset.workbenchLayout===layout));
 }
 function mount(parent,{compact=false,grid=false}={}){
  if(grid){layout='grid';query=''}
  const page=make('section','workbench-library'+(compact?' is-compact':''));page.setAttribute('aria-label','工作台内容');
  const head=make('header','workbench-library-heading'),search=make('label','workbench-search');search.innerHTML=icon('search');const input=make('input');input.type='search';input.placeholder='搜索工作台';input.setAttribute('aria-label','搜索工作台');input.value=compact?'':query;input.oninput=()=>{if(!compact)query=input.value;draw(page)};search.append(input);
  const create=make('button','workbench-create','新建');create.type='button';create.setAttribute('aria-label','新建工作台内容');create.onclick=()=>{const file={id:`workbench-${Date.now()}`,title:'未命名文档',type:'text',text:''};if(save(file,{notify:false})){query='';input.value='';draw(page);hidePicker();WorkbenchTabs.openDocument(file)}};
  const title=make('h1',null,'工作台');
  if(compact){
   const toggle=make('button','workbench-search-toggle');toggle.type='button';toggle.innerHTML=icon('search');toggle.setAttribute('aria-label','搜索工作台');toggle.title='搜索工作台';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','workbench-picker-search');search.id='workbench-picker-search';search.hidden=true;
   const close=make('button','workbench-search-close','×');close.type='button';close.setAttribute('aria-label','收起工作台搜索');search.append(close);
   const setSearch=(opened,focus=true)=>{search.hidden=!opened;title.hidden=opened;toggle.hidden=opened;toggle.setAttribute('aria-expanded',String(opened));head.classList.toggle('is-searching',opened);if(focus)(opened?input:toggle).focus({preventScroll:true})};
   toggle.onclick=()=>setSearch(true);close.onclick=()=>{input.value='';draw(page);setSearch(false)};
   input.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(input.value){input.value='';draw(page)}else setSearch(false)}};
   search.onfocusout=event=>{if(!search.contains(event.relatedTarget)&&!input.value)setSearch(false,false)};
   head.append(title,toggle,search,create);
  }else head.append(title,search,create);
  const views=make('div','workbench-view-controls');views.setAttribute('role','group');views.setAttribute('aria-label','工作台视图');for(const [id,label]of [['grid','卡片视图'],['list','列表视图']]){const button=make('button');button.type='button';button.dataset.workbenchLayout=id;button.setAttribute('aria-label',label);button.innerHTML=icon(id);button.onclick=()=>{layout=id;draw(page)};views.append(button)}
  const list=make('div','workbench-artifacts');list.setAttribute('aria-label','工作台产物');const empty=make('p','workbench-empty');empty.setAttribute('role','status');page.append(head);if(!compact)page.append(views);if(compact){const body=make('div','workbench-picker-scroll');body.append(list,empty);page.append(body)}else page.append(list,empty);parent.append(page);draw(page);return page;
 }
 function hidePicker(){clearTimeout(openTimer);clearTimeout(closeTimer);picker?.remove();picker=null;pickerAnchor=null;for(const tab of document.querySelectorAll('[aria-controls="workbench-tab-picker"]'))tab.setAttribute('aria-expanded','false')}
 function scheduleClose(){clearTimeout(openTimer);clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!picker?.contains(document.activeElement))hidePicker()},180)}
 function showPicker(anchor,{focus=false}={}){
  clearTimeout(openTimer);clearTimeout(closeTimer);if(!anchor.isConnected)return;
  if(picker&&pickerAnchor===anchor){if(focus)picker.querySelector('.workbench-search-toggle').focus();return}hidePicker();pickerAnchor=anchor;
  picker=make('div','workbench-tab-picker');picker.id='workbench-tab-picker';picker.setAttribute('role','dialog');picker.setAttribute('aria-label','工作台列表');document.body.append(picker);mount(picker,{compact:true});
  const rect=anchor.getBoundingClientRect(),width=Math.min(320,innerWidth-24),top=rect.bottom+8;picker.style.width=width+'px';picker.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';picker.style.top=top+'px';picker.style.maxHeight=Math.min(560,innerHeight-top-12)+'px';
  anchor.querySelector('[role="tab"]').setAttribute('aria-expanded','true');picker.onmouseenter=()=>clearTimeout(closeTimer);picker.onmouseleave=scheduleClose;picker.onfocusin=()=>clearTimeout(closeTimer);picker.onfocusout=e=>{if(!picker.contains(e.relatedTarget)&&!pickerAnchor.contains(e.relatedTarget))scheduleClose()};if(focus)picker.querySelector('.workbench-search-toggle').focus();
 }
 function bindTab(row){
  const button=row.querySelector('[role="tab"]');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','workbench-tab-picker');button.setAttribute('aria-expanded','false');
  row.onmouseenter=()=>{clearTimeout(closeTimer);clearTimeout(openTimer);openTimer=setTimeout(()=>showPicker(row),180)};row.onmouseleave=scheduleClose;
  button.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();showPicker(row,{focus:true})}});
 }
 addEventListener('keydown',event=>{if(event.key==='Escape'&&picker){event.preventDefault();const anchor=pickerAnchor;hidePicker();anchor?.querySelector('[role="tab"]').focus({preventScroll:true})}});
 addEventListener('pointerdown',event=>{if(picker&&!picker.contains(event.target)&&!pickerAnchor.contains(event.target))hidePicker()});
 addEventListener('resize',hidePicker);document.addEventListener('scroll',event=>{if(picker&&event.target instanceof Node&&!picker.contains(event.target))hidePicker()},true);
 return {mount,save,saveButton,previewHeader,artifactCard,bindTab,hidePicker,get:id=>items.get(id)};
})();
