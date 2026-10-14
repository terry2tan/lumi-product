/* Docked and floating presentations share the same conversation panel. */
window.CopilotPresentation=(()=>{
 let menu=null,anchor=null,position=null,pinned=false,rememberedWidth=null,opening=null,widthAnimation=null;
 const make=(tag,cls)=>{const node=document.createElement(tag);node.className=cls;return node};
 function closeMenu(restore=false){menu?.remove();menu=null;anchor?.setAttribute('aria-expanded','false');if(restore&&anchor?.isConnected)anchor.focus({preventScroll:true});anchor=null}
 function openMenu(trigger,focus=false){
  if(menu&&anchor===trigger){closeMenu(true);return}closeMenu();CopilotModeMenu.close();anchor=trigger;trigger.setAttribute('aria-expanded','true');
  menu=make('div','copilot-mode-menu copilot-more-menu');menu.id='copilot-more-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Copilot 更多');
  const svg=content=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
  const dockIcon=side=>svg(`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M${side==='left'?9:15} 4v16"/>`);
  const choices=state.copilotFloating?[
   ['始终置顶',PinIcon.html(pinned),()=>{pinned=!pinned;syncPinned()},true],
   ['嵌入客户端',dockIcon(CopilotDock.side()),()=>setFloating(false)]
  ]:[
   [CopilotDock.side()==='right'?'固定到左侧':'固定到右侧',dockIcon(CopilotDock.side()==='right'?'left':'right'),()=>CopilotDock.dock(CopilotDock.side()==='right'?'left':'right')],
   ['在浮窗中打开',svg('<path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>'),()=>setFloating(true)]
  ];
  for(const [label,icon,action,checkable] of choices){const item=make('button','');item.type='button';item.innerHTML=icon;const text=make('span','copilot-more-label');text.textContent=label;item.append(text);item.setAttribute('role',checkable?'menuitemcheckbox':'menuitem');if(checkable){item.setAttribute('aria-checked',String(pinned));if(pinned)item.insertAdjacentHTML('beforeend',svg('<path d="m5 12 4 4L19 6"/>'))}item.onclick=()=>{closeMenu();action()};menu.append(item)}
  document.body.append(menu);const box=trigger.getBoundingClientRect(),rect=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(box.left,innerWidth-rect.width-8))+'px';menu.style.top=Math.max(8,Math.min(box.bottom+6,innerHeight-rect.height-8))+'px';
  menu.onkeydown=event=>{const items=[...menu.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)&&items.length){event.preventDefault();items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length].focus()}};
  if(focus)menu.querySelector('button:not(:disabled)')?.focus();
 }
 function syncPinned(){const root=document.getElementById('copilot-floating-root');if(root)root.classList.toggle('is-always-on-top',pinned)}
 function setFloating(floating){
  const reading=[...document.querySelectorAll('#page-copilot .chat-scroll,#page-copilot .copilot-welcome-scroll')].map(node=>({className:node.className,top:node.scrollTop}));
  if(floating){const panel=document.getElementById('page-copilot'),box=panel?.getBoundingClientRect();opening=box?{x:box.left,y:box.top,width:box.width,height:box.height,side:CopilotDock.side()}:null}
  widthAnimation?.cancel();widthAnimation=null;
  state.copilotFloating=floating;state.copilotExpanded=false;WorkspaceTabs.restoreContent();render({preservePage:true});
  for(const saved of reading){const node=document.getElementById('page-copilot')?.getElementsByClassName(saved.className)[0];if(node)node.scrollTop=saved.top}
  document.querySelector('#page-copilot .conversation-input,#page-copilot .editor')?.focus({preventScroll:true});
 }
 function moreButton(){const button=make('button','copilot-toolbar-button copilot-more-toggle');button.type='button';button.title='更多';button.setAttribute('aria-label','Copilot 更多');button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','copilot-more-menu');button.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';button.onclick=()=>openMenu(button);button.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();openMenu(button,true)}};return button}
 function clampWidth(width){return Math.max(Math.min(320,innerWidth-16),Math.min(width,innerWidth-16))}
 function constrain(root,x,y){position={...position,x:Math.max(8,Math.min(x,innerWidth-root.offsetWidth-8)),y:Math.max(44,Math.min(y,innerHeight-root.offsetHeight-8))};root.style.left=position.x+'px';root.style.top=position.y+'px';root.style.right='auto'}
 function stopWidthAnimation(root){
  if(!widthAnimation)return;const box=root.getBoundingClientRect();widthAnimation.cancel();widthAnimation=null;position={...position,x:box.left,width:box.width};root.style.width=box.width+'px';root.style.left=box.left+'px';
 }
 function resizeWindow(root,width,left){
  width=clampWidth(width);root.style.width=width+'px';position={...position,width};constrain(root,left,position.y);rememberedWidth=width;
  for(const handle of root.querySelectorAll('.copilot-floating-resize'))handle.setAttribute('aria-valuenow',String(Math.round(width)));
 }
 function sync(){
  if(!state.copilotFloating||state.mode!=='split')return;const panel=document.getElementById('page-copilot');if(!panel)return;
  const source=opening;opening=null;
  if(source)position={...source,width:clampWidth(source.width)};
  if(!position)position={x:innerWidth-444,y:64,width:420,height:Math.min(720,innerHeight-80),side:CopilotDock.side()};
  position.width=clampWidth(position.width);position.height=Math.min(position.height,innerHeight-52);
  const root=make('section','copilot-floating-root');root.id='copilot-floating-root';root.setAttribute('role','dialog');root.setAttribute('aria-label','悬浮对话');Object.assign(root.style,{width:position.width+'px',height:position.height+'px'});root.append(panel);document.body.append(root);syncPinned();constrain(root,position.x,position.y);
  if(source&&rememberedWidth!==null){
   const from=root.getBoundingClientRect(),target=clampWidth(rememberedWidth),left=source.side==='right'?from.right-target:from.left;
   root.style.width=target+'px';position.width=target;constrain(root,left,position.y);
   if(Math.abs(target-from.width)>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    widthAnimation=root.animate([{width:from.width+'px',left:from.left+'px'},{width:target+'px',left:position.x+'px'}],{duration:400,easing:'cubic-bezier(.4,0,.2,1)'});
    const current=widthAnimation;current.finished.then(()=>{if(widthAnimation===current)widthAnimation=null},()=>{});
   }
  }
  const close=panel.querySelector('[aria-label="关闭 Copilot"]');if(close){close.setAttribute('aria-label','关闭悬浮对话');close.title='关闭悬浮对话'}
  for(const edge of ['left','right']){
   const handle=make('div','copilot-floating-resize is-'+edge);handle.dataset.edge=edge;handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-label',`调整悬浮对话${edge==='left'?'左':'右'}侧宽度`);handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-valuemin',String(Math.min(320,innerWidth-16)));handle.setAttribute('aria-valuemax',String(innerWidth-16));handle.setAttribute('aria-valuenow',String(Math.round(position.width)));
   handle.onkeydown=event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();stopWidthAnimation(root);const box=root.getBoundingClientRect(),delta=(event.key==='ArrowRight'?1:-1)*(event.shiftKey?40:10),width=clampWidth(box.width+(edge==='left'?-delta:delta));resizeWindow(root,width,edge==='left'?box.right-width:box.left)};root.append(handle);
  }
  let drag=null;
  root.onpointerdown=event=>{
   const edge=event.target.closest('.copilot-floating-resize')?.dataset.edge;
   if(event.button!==0||!edge&&(!event.target.closest('.copilot-toolbar')||event.target.closest('button')))return;
   stopWidthAnimation(root);const box=root.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top,width:box.width,right:box.right,edge};root.setPointerCapture(event.pointerId);event.preventDefault();closeMenu();
  };
  root.onpointermove=event=>{if(!drag||event.pointerId!==drag.id)return;const delta=event.clientX-drag.x;if(drag.edge){const max=drag.edge==='left'?drag.right-8:innerWidth-drag.left-8,width=Math.min(max,clampWidth(drag.width+(drag.edge==='left'?-delta:delta)));resizeWindow(root,width,drag.edge==='left'?drag.right-width:drag.left)}else constrain(root,drag.left+delta,drag.top+event.clientY-drag.y)};
  root.onpointerup=root.onpointercancel=event=>{if(!drag||event.pointerId!==drag.id)return;drag=null;if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId)};
 }
 document.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target)&&!anchor?.contains(event.target))closeMenu()});
 document.addEventListener('focusin',event=>{if(menu&&!menu.contains(event.target)&&!anchor?.contains(event.target))closeMenu()});
 document.addEventListener('keydown',event=>{if(menu&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeMenu(true)}});
 addEventListener('resize',()=>{closeMenu();const root=document.getElementById('copilot-floating-root');if(root&&position){stopWidthAnimation(root);position.width=clampWidth(position.width);root.style.width=position.width+'px';root.style.height=Math.min(position.height,innerHeight-52)+'px';constrain(root,position.x,position.y)}});
 return {moreButton,closeMenu,sync};
})();
