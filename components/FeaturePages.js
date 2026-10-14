/* Content and assets from 同花顺未来版, Page 6. */
function featureSource(name){const el=document.createElement('div');el.dataset.component=name;el.innerHTML=Components[name]();return el;}
function featureNode(root,id){return root.querySelector(`[data-node-id="${id}"]`);}
function flowNode(el){if(!el)return el;el.style.position='relative';el.style.left='';el.style.top='';el.style.right='';el.style.bottom='';return el;}
function featureSearch(holder,placeholder,oninput){const input=document.createElement('input');input.type='search';input.placeholder=placeholder;input.setAttribute('aria-label',placeholder);input.oninput=()=>oninput?.(input.value.trim());holder.append(input);return input;}

function projectPage(wb){
 const page=document.createElement('section');page.className='feature-page project-page';page.setAttribute('aria-label','项目首页');wb.append(page);
 const content=featureSource('ProjectHomeSource');page.append(content);content.firstElementChild.style.height='auto';featureNode(content,'349:36757')?.remove();
 const rows=featureNode(content,'349:36733');rows.classList.add('project-grid');
 const cards=[...rows.children].flatMap(row=>[...row.children]);for(const card of cards){card.classList.add('project-card');card.style.backgroundColor='rgba(50,51,55,.6)';rows.append(card)}
 for(const row of [...rows.children])if(!row.classList.contains('project-card'))row.remove();
 const search=featureNode(content,'349:36731');search.querySelector('p').remove();
 featureSearch(search,'搜索项目',term=>cards.forEach(card=>card.hidden=!!term&&!card.textContent.includes(term)));
 const heading=featureNode(content,'349:36726');heading.classList.add('project-page-toolbar');search.classList.add('page-header-search');
 const tools=document.createElement('div');tools.className='page-header-tools';const add=featureNode(content,'349:36728');tools.append(add,search);heading.append(tools);featureNode(content,'349:36730').remove();
 interactive(add,'新建项目',null,{toggle:false});
 for(const card of cards){for(const more of card.querySelectorAll('[data-name="icon按钮"]'))interactive(more,'项目选项',null,{toggle:false})}
}

function taskPage(wb){
 const source=featureSource('TaskListSource'),page=document.createElement('section');page.className='feature-page tasks-page';page.setAttribute('aria-label','自动任务列表');wb.append(page);
 const toolbar=document.createElement('div');toolbar.className='tasks-toolbar';page.append(toolbar);
 const tabs=flowNode(featureNode(source,'349:50684'));tabs.classList.add('task-view-tabs');toolbar.append(tabs);
 const tools=document.createElement('div');tools.className='task-tools';toolbar.append(tools);
 const search=document.createElement('div');search.className='feature-search task-search';search.append(flowNode(featureNode(source,'349:50704')));tools.append(search);
 const add=flowNode(featureNode(source,'349:50688')),batch=flowNode(featureNode(source,'349:50693'));tools.append(add,batch);
 interactive(add,'新建自动任务',null,{toggle:false});interactive(batch,'批量操作任务',null,{toggle:false});
 for(const [id,label] of [['349:50685','自动任务列表'],['349:50686','执行记录']])interactive(featureNode(tabs,id),label,null,{toggle:false});
 const notice=document.createElement('div');notice.className='task-notice';notice.append(flowNode(featureNode(source,'349:50813')),flowNode(featureNode(source,'349:50817')));
 const close=document.createElement('button');close.textContent='关闭';close.setAttribute('aria-label','关闭自动任务提示');close.onclick=()=>notice.remove();notice.append(close);page.append(notice);
 const grid=document.createElement('div');grid.className='task-grid';page.append(grid);
 const cards=[];
 for(const id of ['349:50706','349:50758','349:50725','349:50744','349:50791','349:50772']){
  const original=featureNode(source,id),card=document.createElement('article');card.className='task-card';card.dataset.nodeId=id;
  const paragraphs=[...original.querySelectorAll('p')],title=paragraphs.find(p=>p.style.fontSize==='16px'),description=paragraphs.find(p=>p.style.fontSize==='14px'),status=paragraphs.find(p=>p.style.fontSize==='12px');
  const heading=document.createElement('div');heading.className='task-card-heading';heading.append(flowNode(title));
  const flag=original.querySelector('[data-name="Frame"]');if(flag)heading.append(flowNode(flag));card.append(heading,flowNode(description));
  const footer=document.createElement('div');footer.className='task-card-footer';const statusGroup=document.createElement('div');statusGroup.className='task-status';const statusIcon=original.querySelector('[data-name="状态"]');if(statusIcon)statusGroup.append(flowNode(statusIcon));statusGroup.append(flowNode(status));footer.append(statusGroup);
  const more=flowNode(original.querySelector('[data-name="icon/..."]'));if(more){footer.append(more);interactive(more,'任务选项',null,{toggle:false})}card.append(footer);grid.append(card);cards.push(card);
 }
 featureSearch(search,'搜索任务',term=>cards.forEach(card=>card.hidden=!!term&&!card.textContent.includes(term)));
 const templates=flowNode(featureNode(source,'349:50821'));templates.style.width='100%';templates.classList.add('task-templates');page.append(templates);
}

function fileLibraryPage(wb){
 const page=document.createElement('section');page.className='file-library-page';page.setAttribute('aria-label','文件');wb.append(page);
 const nav=document.createElement('aside');nav.className='file-library-navigation';nav.setAttribute('aria-label','文件分类');page.append(nav);
 const navigation=featureSource('FileNavigationSource');nav.append(navigation);
 const search=featureNode(navigation,'349:42792');featureNode(navigation,'349:42796').remove();const searchInput=featureSearch(search,'搜索文件');searchInput.oninput=()=>{const term=searchInput.value.trim();for(const row of list.children)row.hidden=!!term&&!row.textContent.includes(term)};
 for(const id of ['349:42829','349:42835','349:42842','349:42849']){const row=featureNode(navigation,id);for(const invisible of [...row.children].filter(el=>el.style.opacity==='0'))invisible.remove();row.style.paddingLeft=id==='349:42829'?'32px':'56px';}
 const main=document.createElement('div');main.className='file-library-main';page.append(main);const toolbar=featureSource('FileToolbarSource');toolbar.classList.add('file-library-toolbar');main.append(toolbar);
 const toolbarRow=flowNode(featureNode(toolbar,'349:42666'));toolbarRow.classList.add('file-library-toolbar-row');toolbar.firstElementChild.style.height='auto';
 const tools=featureNode(toolbar,'349:42670');tools.classList.add('page-header-tools');flowNode(search);search.style.paddingRight='12px';search.classList.add('page-header-search');tools.append(search);
 featureNode(navigation,'349:42779').style.top='50px';featureNode(navigation,'349:42798').style.top='180px';
 const header=document.createElement('div');header.className='file-list-heading';header.innerHTML='<span>标题</span><span>更新时间 <span class="sort-arrows">▴<br>▾</span></span><span></span>';main.append(header);
 const list=document.createElement('div');list.className='file-list';list.setAttribute('aria-label','最近文件');main.append(list);
 for(const id of ['42680','42686','42692','42698','42704','42710','42716','42722','42728','42734','42740','42746','42752','42758']){
  const row=featureSource('FileRow'+id);row.className='file-list-row';const inner=row.firstElementChild;inner.style.height='56px';inner.style.paddingTop='0';inner.style.paddingBottom='0';inner.style.borderTopWidth='0';const name=inner.firstElementChild;name.classList.add('file-list-name');name.querySelector('p').title=name.querySelector('p').textContent.trim();const date=inner.querySelector(':scope > p');date.classList.add('file-list-date');
  interactive(inner.lastElementChild,'文件选项',null,{toggle:false});list.append(row);
 }
 interactive(featureNode(navigation,'349:42780'),'最近文件',null,{toggle:false});
 interactive(featureNode(toolbar,'349:42676'),'全部文件类型',null,{toggle:false});
}
