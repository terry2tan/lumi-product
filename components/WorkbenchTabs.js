/* Workbench pages live inside the workbench card, independently of artifact tabs. */
window.WorkbenchTabs=(()=>{
 let sequence=1,selected='dashboard-1';
 const pages=[{id:selected,title:'新工作台',dashboard:true,fresh:true}];
 const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
 function save(){const root=document.querySelector('.workbench-pages'),page=pages.find(item=>item.id===root?.dataset.pageId),content=root?.querySelector('.workbench-pages-body>.workbench-library,.workbench-pages-body>.workspace-document-preview');if(page&&content)page.scrollTop=content.scrollTop}
 function focus(){requestAnimationFrame(()=>document.querySelector('#workbench-page-tabs .is-active [role=tab]')?.focus({preventScroll:true}))}
 function choose(id){if(!pages.some(page=>page.id===id))return;save();selected=id;refresh();focus()}
 function add(){save();let page=pages.find(item=>item.dashboard);if(!page){page={id:`dashboard-${++sequence}`,title:'新工作台',dashboard:true,fresh:true};pages.push(page)}selected=page.id;refresh();focus()}
 function close(id){const index=pages.findIndex(page=>page.id===id);if(index<0)return;save();pages.splice(index,1);if(!pages.length){pages.push({id:`dashboard-${++sequence}`,title:'新工作台',dashboard:true,fresh:true})}if(selected===id)selected=pages[Math.max(0,index-1)]?.id||pages[0].id;refresh();focus()}
 function openDocument(file){save();let page=pages.find(item=>item.id===file.id);const blankIndex=pages.findIndex(item=>item.dashboard);if(!page){page={...file};if(blankIndex>=0)pages.splice(blankIndex,1,page);else pages.push(page)}else if(blankIndex>=0)pages.splice(blankIndex,1);selected=page.id;if(state.nav!=='工作台')navigate('工作台');else WorkspaceTabs.choose('workbench');refresh();}
 function draw(root){
  root.dataset.pageId=selected;
  const bar=make('div','workbench-page-tabs');bar.id='workbench-page-tabs';const list=make('div','top-workspace-tabs');list.setAttribute('role','tablist');list.setAttribute('aria-label','工作台页面标签');
  for(const page of pages){const active=page.id===selected,row=make('div','top-workspace-tab'+(active?' is-active':''));row.dataset.tabId=page.id;const button=make('button','top-workspace-tab-label');button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-label',page.title);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;button.title=page.title;const icon=make('img','top-workspace-tab-icon');icon.src=`assets/navigation/${page.dashboard?'工作台':'文件'}.svg`;icon.alt='';button.append(icon,make('span','top-workspace-tab-text',page.title));button.onclick=()=>choose(page.id);const remove=make('button','top-workspace-tab-close','×');remove.type='button';remove.setAttribute('aria-label',`关闭${page.title}`);remove.onclick=()=>close(page.id);row.append(button,remove);list.append(row)}
  const plus=make('button','top-workspace-tab-add');plus.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';plus.type='button';plus.title='新建工作台';plus.setAttribute('aria-label','新建工作台');plus.onclick=add;bar.append(list,plus);
  list.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const index=pages.findIndex(page=>page.id===selected);event.preventDefault();choose(pages[event.key==='Home'?0:event.key==='End'?pages.length-1:(index+(event.key==='ArrowRight'?1:-1)+pages.length)%pages.length].id)};
  const body=make('div','workbench-pages-body'),page=pages.find(item=>item.id===selected);body.setAttribute('role','tabpanel');body.setAttribute('aria-label',page.title);root.replaceChildren(bar,body);
  if(page.dashboard){WorkbenchPage.mount(body,{grid:page.fresh});page.fresh=false;requestAnimationFrame(()=>{const library=body.querySelector('.workbench-library');if(library)library.scrollTop=page.scrollTop||0})}
  else{body.append(WorkbenchPage.previewHeader(page),WorkspaceTabs.preview(page));body.classList.add('has-page-preview')}
  TabOverflow.mount(bar,list);
 }
 function refresh(){const root=document.querySelector('.workbench-pages');if(root)draw(root)}
 function mount(parent){const root=make('section','workbench-pages');root.setAttribute('aria-label','工作台页面');parent.append(root);draw(root);return root}
 return {mount,openDocument,save,active:()=>selected};
})();
