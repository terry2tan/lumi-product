/* Keep complete tabs visible; remaining open tabs share an overflow menu. */
window.TabOverflow=(()=>{
 const instances=new Map();let menu=null,anchor=null;
 function close(restore=false){menu?.remove();menu=null;anchor?.setAttribute('aria-expanded','false');if(restore&&anchor?.isConnected)anchor.focus();anchor=null}
 function open(instance){
  if(anchor===instance.button&&menu){close(true);return}close();anchor=instance.button;anchor.setAttribute('aria-expanded','true');
  menu=document.createElement('div');menu.className='workspace-recent-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','剩余标签页');
  for(const row of instance.hidden){const source=row.querySelector('[role=tab]'),item=document.createElement('button');item.type='button';item.className='workspace-recent-item';item.setAttribute('role','menuitem');const icon=source.querySelector('.top-workspace-tab-icon');if(icon)item.append(icon.cloneNode(true));const label=document.createElement('span');label.textContent=source.getAttribute('aria-label')||source.title;item.append(label);item.onclick=()=>{close();source.click();requestAnimationFrame(()=>document.querySelector(`#${instance.root.id} .is-active [role=tab]`)?.focus({preventScroll:true}))};menu.append(item)}
  document.body.append(menu);const box=anchor.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(box.right-menu.offsetWidth,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=(box.bottom+6)+'px';menu.firstElementChild?.focus();
  menu.onkeydown=event=>{const items=[...menu.children],index=items.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true)}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus()}};
 }
 function update(root){
  const instance=instances.get(root);if(!instance)return;const {list,button}=instance,rows=[...list.children];
  const style=getComputedStyle(root),extra=root.querySelector('.top-workspace-tab-add')?34:0,available=Math.max(0,root.clientWidth-parseFloat(style.paddingLeft||0)-parseFloat(style.paddingRight||0)-extra-Number(root.dataset.tabSeparatorWidth||0));
  const overflowing=rows.length*154-4>available,count=overflowing?Math.max(0,Math.floor((available-34+4)/154)):rows.length;
  const selected=rows.find(row=>row.classList.contains('is-active'))||rows[0],visible=new Set(rows.slice(0,count));if(count&&selected&&!visible.has(selected)){visible.delete([...visible].pop());visible.add(selected)}
  instance.hidden=rows.filter(row=>!visible.has(row));rows.forEach(row=>row.hidden=!visible.has(row));button.hidden=!instance.hidden.length;button.title=`剩余标签页（${instance.hidden.length}）`;
  if(anchor===button&&(!instance.hidden.length||!root.isConnected))close();
 }
 function mount(root,list){
  for(const [node,old]of instances)if(!node.isConnected){old.observer.disconnect();instances.delete(node);if(anchor===old.button)close()}
  root.classList.add('has-tab-overflow');const button=document.createElement('button');button.type='button';button.className='workspace-recent-button tab-overflow-button';button.hidden=true;button.setAttribute('aria-label','剩余标签页');button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2h10M5 6h14"/><rect width="18" height="12" x="3" y="10" rx="2"/></svg>';list.after(button);
  const instance={root,list,button,hidden:[],observer:new ResizeObserver(()=>update(root))};instances.set(root,instance);button.onclick=()=>open(instance);button.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();open(instance)}};instance.observer.observe(root);update(root);
 }
 document.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target)&&!anchor?.contains(event.target))close()});addEventListener('resize',()=>close());
 return {mount,update,close};
})();
