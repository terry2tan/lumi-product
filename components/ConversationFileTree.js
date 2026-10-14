/* Project documents and generated artifacts share an expandable tree view. */
(() => {
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const icons={
    folder:'<svg viewBox="0 0 24 24" fill="none"><path d="M3 5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2H3V5Z" fill="#FFE08A"/><path d="M2 8h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z" fill="#FFD15B"/></svg>',
    file:'<svg viewBox="0 0 24 24" fill="none"><path d="M5 2h9l5 5v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" fill="#2168D5"/><path d="M14 2v5h5" fill="#83B3FF"/><path d="M8 11h7M8 15h8M8 19h8" stroke="#FFF" stroke-width="1.6"/></svg>',
    chevron:'<svg viewBox="0 0 16 16" fill="none"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const folder=(id,name,children)=>({id,name,children});
  function projects(){return (sidebarView.historyRecords?.()||[]).flatMap(group=>group.projects||[])}
  function projectDocument(record){
    const owner=ChatStore.get(record.id),paragraphs=[];
    for(const message of owner?.messages||[]){
      if(message.role!=='assistant')continue;
      if(message.text)paragraphs.push(message.text);
      if(message.table)paragraphs.push([message.table.headers,...message.table.rows].map(row=>row.join(' · ')).join('\n'));
    }
    return {id:`project-file-${record.id}`,title:record.title,type:'text',text:paragraphs.join('\n\n')};
  }
  function data(type,owner){
    const catalog=projects(),project=catalog.find(item=>item.records.some(record=>record.id===owner?.id));
    if(type==='project-files'&&NativeBridge.available)return{heading:'工作目录文件',nodes:[]};
    if(type==='project-files'){
      const records=project?[project]:catalog;
      return {heading:project?`${project.name}的知识库文件`:'知识库文件',nodes:records.map(item=>folder(`project:${item.name}`,item.name,[folder(`project:${item.name}:research`,'研究资料',item.records.map(record=>({id:`project-file-${record.id}`,name:record.title,file:projectDocument(record)})))]))};
    }
    const owners=owner?[owner]:[...ChatStore.threads.values()],nodes=[];
    for(const current of owners){
      const children=current.messages.filter(message=>message.role==='assistant').flatMap(message=>[...(message.document||message.report?[WorkspaceTabs.fileFor(current,message)]:[]),...(message.files||[])]).filter((file,index,list)=>list.findIndex(item=>item.id===file.id)===index).map(file=>({id:file.id,name:file.title,file}));
      if(!children.length)continue;
      const conversation=folder(`artifacts:${current.id}`,current.title,children),group=catalog.find(item=>item.records.some(record=>record.id===current.id));
      if(owner||!group){nodes.push(conversation);continue}
      let branch=nodes.find(item=>item.id===`artifacts-project:${group.name}`);
      if(!branch){branch=folder(`artifacts-project:${group.name}`,group.name,[]);nodes.push(branch)}branch.children.push(conversation);
    }
    return {heading:owner?`${owner.title}的对话产物`:'对话产物',nodes};
  }
  function render(item,owner,onOpen){
    const model=data(item.type,owner),root=make('section','home-file-tree-view'),heading=make('h2','home-file-tree-heading',model.heading),tree=make('ul','home-file-tree');
    root.dataset.treeId=item.id;root.append(heading,tree);tree.setAttribute('role','tree');tree.setAttribute('aria-label',model.heading);
    item.expanded ||= new Map();
    const rows=[],nodes=new Map();
    function add(list,node,level,parent){
      nodes.set(node.id,node);const entry=make('li','home-file-tree-entry'),row=make('button','home-file-tree-row'),isFolder=!!node.children;
      entry.setAttribute('role','none');row.type='button';row.title=node.name;row.dataset.treeNode=node.id;row.dataset.treeParent=parent||'';row.setAttribute('role','treeitem');row.setAttribute('aria-level',String(level));row.setAttribute('aria-label',node.name);row.setAttribute('aria-selected',String(item.selected===node.id));row.tabIndex=-1;row.style.setProperty('--tree-level',level-1);
      const arrow=make('span','home-file-tree-chevron'),icon=make('span','home-file-tree-icon');arrow.setAttribute('aria-hidden','true');icon.setAttribute('aria-hidden','true');
      if(isFolder)arrow.innerHTML=icons.chevron;icon.innerHTML=icons[isFolder?'folder':'file'];row.append(arrow,icon,make('span','home-file-tree-name',node.name));entry.append(row);list.append(entry);rows.push(row);
      let children;
      if(isFolder){
        if(!item.expanded.has(node.id))item.expanded.set(node.id,level<=2);
        children=make('ul','home-file-tree-children');children.id=`${item.id}-branch-${encodeURIComponent(node.id)}`;children.setAttribute('role','group');row.setAttribute('aria-owns',children.id);entry.append(children);for(const child of node.children)add(children,child,level+1,node.id);
        row.setAttribute('aria-expanded',String(item.expanded.get(node.id)));children.hidden=!item.expanded.get(node.id);
      }
      const expand=value=>{item.expanded.set(node.id,value);row.setAttribute('aria-expanded',String(value));children.hidden=!value;updateFocus()};
      row.treeExpand=expand;
      row.onfocus=()=>{item.focused=node.id;updateFocus()};
      row.onclick=()=>{
        item.selected=item.focused=node.id;for(const button of rows)button.setAttribute('aria-selected',String(button===row));
        if(isFolder)expand(!item.expanded.get(node.id));else{updateFocus();onOpen(node.file)}
      };
    }
    const visible=()=>rows.filter(row=>{for(let parent=row.parentElement;parent&&parent!==tree;parent=parent.parentElement)if(parent.hidden)return false;return true});
    function updateFocus(){const available=visible(),focused=available.find(row=>row.dataset.treeNode===item.focused)||available.find(row=>row.dataset.treeNode===item.selected)||available[0];for(const row of rows)row.tabIndex=row===focused?0:-1}
    for(const node of model.nodes)add(tree,node,1,null);
    if(!model.nodes.length){const empty=make('p','home-file-tree-empty',item.type==='project-files'?'暂无知识库文件':'暂无对话产物');root.append(empty);tree.hidden=true}
    updateFocus();
    tree.onkeydown=event=>{
      const row=event.target.closest('[data-tree-node]');if(!row||!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      event.preventDefault();const available=visible(),index=available.indexOf(row),node=nodes.get(row.dataset.treeNode);let next=row;
      if(event.key==='ArrowDown')next=available[Math.min(index+1,available.length-1)];
      if(event.key==='ArrowUp')next=available[Math.max(index-1,0)];
      if(event.key==='Home')next=available[0];if(event.key==='End')next=available.at(-1);
      if(event.key==='ArrowRight'&&node.children){if(!item.expanded.get(node.id))row.treeExpand(true);else next=rows.find(button=>button.dataset.treeParent===node.id)||row}
      if(event.key==='ArrowLeft'){if(node.children&&item.expanded.get(node.id))row.treeExpand(false);else next=rows.find(button=>button.dataset.treeNode===row.dataset.treeParent)||row}
      item.focused=next.dataset.treeNode;updateFocus();next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});
    };
    tree.onscroll=()=>item.treeScrollTop=tree.scrollTop;requestAnimationFrame(()=>{if(tree.isConnected)tree.scrollTop=item.treeScrollTop||0});
    if(item.type==='project-files'&&NativeBridge.available){root.refreshNativeTree=async()=>{try{const nodes=await NativeBridge.call('fileTree');if(!root.isConnected)return;model.nodes=nodes;heading.textContent='工作目录文件';tree.setAttribute('aria-label','工作目录文件');tree.replaceChildren();tree.hidden=false;root.querySelectorAll('.home-file-tree-empty').forEach(n=>n.remove());rows.splice(0);for(const child of nodes)add(tree,child,1,null);updateFocus();if(!nodes.length)tree.append(make('li','home-file-tree-empty','暂无文件'))}catch(error){heading.textContent=error.message}};root.refreshNativeTree()}
    return root;
  }
  window.ConversationFileTree={data,render};
})();
