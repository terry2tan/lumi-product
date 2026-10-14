/* Secondary navigation: opens beside the rail and stays open while hovered. */
window.NavigationMoreMenu=class {
 constructor(railMain,{beforeOpen,onSelect,onPinsChanged,items=NavigationMoreMenu.items,pinned=[],id="navigation-more-menu"}={}){
  this.beforeOpen=beforeOpen;this.onPinsChanged=onPinsChanged;
  this.entries=items;this.pinned=new Set(pinned);this.shortcuts=new Map();
  this.button=document.createElement('button');
  this.button.type='button';
  this.button.className='rail-button rail-more-button';
  this.button.dataset.control='更多';
  this.button.setAttribute('aria-label','更多');
  this.button.setAttribute('aria-haspopup','menu');
  this.button.setAttribute('aria-expanded','false');
  this.button.setAttribute('aria-controls',id);
  this.button.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  railMain.append(this.button);
  this.strip=document.createElement('div');this.strip.className='rail-pinned-features';this.strip.hidden=true;
  railMain.append(this.strip);
  for(const [label,icon]of this.entries){
   const shortcut=document.createElement('button');shortcut.type='button';shortcut.className='rail-button';shortcut.dataset.control=label;
   shortcut.setAttribute('aria-label',label);shortcut.setAttribute('aria-pressed','false');shortcut.innerHTML=(NavigationMoreMenu.icons[icon]||'');
   shortcut.onclick=e=>{e.stopPropagation();this.close();onSelect?.(label)};this.shortcuts.set(label,shortcut);
  }
  this.menu=document.createElement('div');
  this.menu.id=id;
  this.menu.className='navigation-more-menu';
  this.menu.setAttribute('role','menu');
  this.menu.setAttribute('aria-label','更多功能');
  this.menu.hidden=true;
  this.menu.innerHTML=`<div class="navigation-more-list">${this.entries.map(([label,icon])=>`<div class="navigation-more-row" role="none"><button type="button" class="navigation-more-item" role="menuitem" data-more-feature="${label}">${(NavigationMoreMenu.icons[icon]||'')}<span>${label}</span></button><button type="button" class="navigation-more-pin" role="menuitem" data-more-pin="${label}"></button></div>`).join('')}</div>`;
  this.syncPinned();
  stage.append(this.menu);
  this.button.onmouseenter=()=>this.open();
  this.button.onmouseleave=()=>this.scheduleClose();
  this.button.onfocus=()=>{if(!this.skipFocusOpen)this.open()};
  this.button.onblur=()=>this.scheduleClose();
  this.button.onclick=e=>{e.stopPropagation();this.open()};
  this.button.onkeydown=e=>{
   if(e.key==='ArrowRight'||e.key==='ArrowDown'){
    e.preventDefault();this.open();this.items()[0].focus();
   }else if(e.key==='Escape'){e.preventDefault();this.close()}
  };
  this.menu.onmouseenter=()=>this.cancelClose();
  this.menu.onmouseleave=()=>this.scheduleClose();
  this.menu.onfocusin=()=>this.cancelClose();
  this.menu.onfocusout=()=>this.scheduleClose();
  this.menu.onclick=e=>{
   e.stopPropagation();
   const pin=e.target.closest('[data-more-pin]');
   if(pin){this.cancelClose();this.togglePinned(pin.dataset.morePin);pin.focus({preventScroll:true});this.position();return}
   const item=e.target.closest('[data-more-feature]');
   if(!item)return;
   this.close();onSelect?.(item.dataset.moreFeature);
   document.querySelector('.more-feature-page h1')?.focus({preventScroll:true});
  };
  this.menu.onkeydown=e=>this.handleMenuKey(e);
  document.addEventListener('click',e=>{if(!this.contains(e.target))this.close()});
  document.addEventListener('focusin',e=>{if(!this.menu.hidden&&!this.contains(e.target))this.close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!this.menu.hidden)this.close(this.menu.contains(document.activeElement))});
  railMain.addEventListener('scroll',()=>this.close());
  addEventListener('resize',()=>{if(!this.menu.hidden)this.position()});
 }
 items(){return Array.from(this.menu.querySelectorAll('[data-more-feature]'))}
 togglePinned(label){
  if(!this.shortcuts.has(label))return;
  this.pinned.has(label)?this.pinned.delete(label):this.pinned.add(label);
  this.syncPinned();this.onPinsChanged?.();
 }
 syncPinned(){
  this.strip.replaceChildren(...[...this.pinned].map(label=>this.shortcuts.get(label)));
  this.strip.hidden=!this.pinned.size;
  for(const pin of this.menu.querySelectorAll('[data-more-pin]')){
   const pinned=this.pinned.has(pin.dataset.morePin),action=`${pinned?'取消置顶':'置顶'}${pin.dataset.morePin}`;
   pin.parentElement.classList.toggle('is-pinned',pinned);pin.setAttribute('aria-label',action);pin.setAttribute('title',action);pin.setAttribute('aria-pressed',String(pinned));pin.innerHTML=NavigationMoreMenu.pinIcon(pinned);
  }
  this.setCurrent(this.current);
 }
 setCurrent(label){
  this.current=label;
  for(const item of this.items()){
   const active=item.dataset.moreFeature===label;
   item.classList.toggle('is-current',active);
   if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');
  }
  for(const [name,shortcut]of this.shortcuts){
   const active=name===label;shortcut.classList.toggle('is-active',active);shortcut.setAttribute('aria-pressed',String(active));
   if(active)shortcut.setAttribute('aria-current','page');else shortcut.removeAttribute('aria-current');
  }
 }
 contains(target){return this.button.contains(target)||this.alternateAnchor?.contains(target)||this.menu.contains(target)}
 cancelClose(){clearTimeout(this.closeTimer)}
 open(){
  this.cancelClose();this.beforeOpen?.();this.menu.hidden=false;
  this.button.classList.add('is-open');this.button.setAttribute('aria-expanded','true');this.alternateAnchor?.setAttribute('aria-expanded','true');
  this.position();
 }
 position(){
  const anchor=(this.anchor?.()||this.button).getBoundingClientRect();
  const rect=this.menu.getBoundingClientRect();
  this.menu.style.left=Math.max(8,Math.min(anchor.right+10,innerWidth-rect.width-8))+'px';
  this.menu.style.top=Math.max(8,Math.min(anchor.top,innerHeight-rect.height-8))+'px';
 }
 scheduleClose(){
  this.cancelClose();
  this.closeTimer=setTimeout(()=>{
   if(this.button.matches(':hover')||this.alternateAnchor?.matches(':hover')||this.menu.matches(':hover')||this.contains(document.activeElement))return;
   this.close();
  },180);
 }
 close(restoreFocus=false){
  this.cancelClose();this.menu.hidden=true;
  this.button.classList.remove('is-open');this.button.setAttribute('aria-expanded','false');this.alternateAnchor?.setAttribute('aria-expanded','false');
  if(restoreFocus){this.skipFocusOpen=true;(this.anchor?.()||this.button).focus({preventScroll:true});this.skipFocusOpen=false}
 }
 handleMenuKey(e){
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close(true);return}
  const items=this.items(),current=items.findIndex(item=>item.parentElement.contains(e.target)),pin=e.target.matches('[data-more-pin]');
  if(e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();if(pin)items[current]?.focus();else this.close(true);return}
  if(e.key==='ArrowRight'&&current>=0){e.preventDefault();items[current].parentElement.querySelector('[data-more-pin]').focus();return}
  let next;
  if(e.key==='ArrowDown')next=(current+1)%items.length;
  if(e.key==='ArrowUp')next=(current-1+items.length)%items.length;
  if(e.key==='Home')next=0;
  if(e.key==='End')next=items.length-1;
  if(next!==undefined){e.preventDefault();(pin?items[next].parentElement.querySelector('[data-more-pin]'):items[next]).focus()}
 }
};
NavigationMoreMenu.items=[['知识库','projects'],['策略回测','flask-conical']];
NavigationMoreMenu.pinIcon=filled=>PinIcon.html(filled);
NavigationMoreMenu.icons={
 "canvas": '<img src="assets/navigation/canvas.svg" alt="" draggable="false">',
 "files": '<img src="assets/navigation/文件.svg" alt="" draggable="false">',
 "projects": '<img src="assets/navigation/项目-收起.svg" alt="" draggable="false">',
 "flask-conical": "<svg aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" > <path d=\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\" /> <path d=\"M6.453 15h11.094\" /> <path d=\"M8.5 2h7\" /> </svg>",
 "rss": "<svg aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" > <path d=\"M4 11a9 9 0 0 1 9 9\" /> <path d=\"M4 4a16 16 0 0 1 16 16\" /> <circle cx=\"5\" cy=\"19\" r=\"1\" /> </svg>",
 "chart-pie": "<svg aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" > <path d=\"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z\" /> <path d=\"M21.21 15.89A10 10 0 1 1 8 2.83\" /> </svg>",
 "chart-candlestick": "<svg aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" > <path d=\"M9 5v4\" /> <rect width=\"4\" height=\"6\" x=\"7\" y=\"9\" rx=\"1\" /> <path d=\"M9 15v2\" /> <path d=\"M17 3v2\" /> <rect width=\"4\" height=\"8\" x=\"15\" y=\"5\" rx=\"1\" /> <path d=\"M17 13v3\" /> <path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /> </svg>"
};
