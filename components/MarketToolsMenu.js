/* Pinned footer shortcuts and the complete market-tool menu. */
window.MarketToolsMenu=class {
 constructor(bar,control){
  this.bar=bar;this.control=control;this.buttons=new Map();this.rows=[];
  const tools=bar.querySelector('.market-status-tools');
  this.strip=document.createElement('div');this.strip.className='market-status-pinned-tools';
  for(const item of MarketToolsMenu.items){
   const button=document.createElement('button');button.type='button';button.className='market-status-tool';button.dataset.marketTool=item.label;button.setAttribute('aria-label',item.label);button.setAttribute('aria-controls',control.panelId);
   button.innerHTML=`${item.icon}<span class="market-status-tool-label">${item.label}</span>`;
   button.onclick=()=>{this.close();control.select(item.label)};this.buttons.set(item.label,button);
  }
  this.button=document.createElement('button');this.button.type='button';this.button.className='market-tools-toggle';this.button.setAttribute('aria-label','更多行情工具');this.button.setAttribute('aria-haspopup','menu');this.button.setAttribute('aria-expanded','false');
  this.button.innerHTML='<img src="assets/navigation/工具菜单.svg" width="16" height="16" alt="" aria-hidden="true" draggable="false">';
  this.menu=document.createElement('div');this.menu.id=`market-tools-menu-${++MarketToolsMenu.sequence}`;this.menu.className='market-tools-menu';this.menu.setAttribute('role','menu');this.menu.setAttribute('aria-label','行情工具菜单');this.menu.hidden=true;
  this.button.setAttribute('aria-controls',this.menu.id);
  for(const item of MarketToolsMenu.items){
   const row=document.createElement('div');row.className='market-tools-menu-row';row.setAttribute('role','none');
   const label=document.createElement('button');label.type='button';label.className='market-tools-menu-label';label.setAttribute('role','menuitem');label.setAttribute('aria-label',item.label);label.setAttribute('aria-controls',control.panelId);label.innerHTML=`${item.icon}<span>${item.label}</span>`;
   label.onclick=()=>{this.close();control.select(item.label);(this.buttons.get(item.label).isConnected?this.buttons.get(item.label):this.button).focus({preventScroll:true})};
   const pin=document.createElement('button');pin.type='button';pin.className='market-tool-pin';pin.setAttribute('role','menuitem');
   pin.onclick=event=>{event.stopPropagation();const pinned=MarketToolsMenu.pinned;pinned.has(item.label)?pinned.delete(item.label):pinned.add(item.label);for(const instance of MarketToolsMenu.instances)instance.renderPinned();pin.focus({preventScroll:true});this.position()};
   row.append(label,pin);this.menu.append(row);this.rows.push({row,label,pin,item});
  }
  tools.append(this.strip,this.button);document.body.append(this.menu);MarketToolsMenu.instances.add(this);this.renderPinned();
  this.button.onclick=event=>{event.stopPropagation();this.menu.hidden?this.open():this.close()};
  this.button.onkeydown=event=>{
   if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();event.stopPropagation();this.open();this.rows[event.key==='ArrowDown'?0:this.rows.length-1].label.focus()}
   else if(event.key==='Escape'&&!this.menu.hidden){event.preventDefault();event.stopPropagation();this.close(true)}
  };
  this.menu.onkeydown=event=>this.handleKey(event);
  this.menu.onclick=event=>event.stopPropagation();
  document.addEventListener('click',event=>{if(!this.contains(event.target))this.close()},true);
  document.addEventListener('focusin',event=>{if(!this.menu.hidden&&!this.contains(event.target))this.close()});
  addEventListener('resize',()=>{if(!this.menu.hidden)this.position()});
 }
 contains(target){return this.button.contains(target)||this.menu.contains(target)}
 renderPinned(){
  this.strip.replaceChildren(...MarketToolsMenu.items.filter(item=>MarketToolsMenu.pinned.has(item.label)).map(item=>this.buttons.get(item.label)));
  this.control.syncButtons();this.syncRows();
 }
 syncRows(){
  for(const {row,label,pin,item}of this.rows){
   const pinned=MarketToolsMenu.pinned.has(item.label),action=`${pinned?'取消置顶':'置顶'}${item.label}`;
   row.classList.toggle('is-pinned',pinned);row.classList.toggle('is-current',this.control.selected()===item.label);label.setAttribute('aria-expanded',String(this.control.selected()===item.label));
   pin.setAttribute('aria-label',action);pin.setAttribute('title',action);pin.setAttribute('aria-pressed',String(pinned));pin.innerHTML=MarketToolsMenu.pinIcon(pinned);
  }
 }
 open(){MarketToolsMenu.closeAll();this.syncRows();this.menu.hidden=false;this.button.classList.add('is-open');this.button.setAttribute('aria-expanded','true');this.position()}
 close(restoreFocus=false){this.menu.hidden=true;this.button.classList.remove('is-open');this.button.setAttribute('aria-expanded','false');if(restoreFocus)this.button.focus({preventScroll:true})}
 position(){
  const anchor=this.button.getBoundingClientRect();this.menu.style.maxHeight=Math.max(40,anchor.top-16)+'px';
  const width=this.menu.getBoundingClientRect().width;
  this.menu.style.left=Math.max(8,Math.min(anchor.right-width,innerWidth-width-8))+'px';this.menu.style.bottom=Math.max(8,innerHeight-anchor.top+8)+'px';
 }
 handleKey(event){
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.close(true);return}
  const index=this.rows.findIndex(({row})=>row.contains(event.target));if(index<0)return;
  const pin=event.target===this.rows[index].pin;let next=index;
  if(event.key==='ArrowDown')next=(index+1)%this.rows.length;
  else if(event.key==='ArrowUp')next=(index-1+this.rows.length)%this.rows.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=this.rows.length-1;
  else if(event.key==='ArrowRight'){event.preventDefault();this.rows[index].pin.focus();return}
  else if(event.key==='ArrowLeft'){event.preventDefault();this.rows[index].label.focus();return}
  else return;
  event.preventDefault();this.rows[next][pin?'pin':'label'].focus();
 }
};
MarketToolsMenu.instances=new Set();MarketToolsMenu.sequence=0;MarketToolsMenu.pinned=new Set(['短线精灵','快讯','论股']);
MarketToolsMenu.closeAll=()=>{for(const instance of MarketToolsMenu.instances)instance.close()};
MarketToolsMenu.pinIcon=filled=>PinIcon.html(filled);
MarketToolsMenu.items=[
 ['短线精灵','<path d="M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z"/>'],
 ['快讯','<path d="M4 22h16a2 2 0 0 0 2-2V4H8a2 2 0 0 0-2 2v14a2 2 0 0 1-4 0v-9h4M10 14h8M10 18h5"/><rect x="10" y="6" width="8" height="4" rx="1"/>'],
 ['诊股','<path d="M3 3v16a2 2 0 0 0 2 2h16M6 14l4-4 4 3 7-9M16 4h5v5"/>'],
 ['论股','<path d="M16 10a2 2 0 0 1-2 2H6l-4 3V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2zM20 9a2 2 0 0 1 2 2v10l-4-2h-8a2 2 0 0 1-2-2v-1"/>'],
 ['小程序','<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'],
 ['决策','<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>']
].map(([label,paths])=>({label,icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`}));
