/* Shared boundaries resize adjacent panels without remounting their contents. */
(() => {
  const preferences={left:null,right:null,copilot:null},handles=new Map();
  const limits={left:{min:220,max:320,default:248},right:{min:360,maxRatio:.7},copilot:{min:360,max:640},conversationMin:480,businessMin:640,marketMin:640,gap:12};
  let frame=0,drag=null,observer;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const resizeDirection=id=>id==='right'||id==='copilot'&&CopilotDock.side()==='right'?-1:1;
  const visible=node=>node&&!node.hidden&&node.getClientRects().length;
  const rect=node=>node.getBoundingClientRect();
  const setWidth=(name,value)=>document.documentElement.style.setProperty(name,`${value}px`);
  function boundary(id,label,controls){
    const handle=document.createElement('div');handle.className='panel-resize-handle';handle.dataset.resizePanel=id;handle.hidden=true;handle.tabIndex=0;
    handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label',label);handle.setAttribute('aria-controls',controls);handle.title=label;
    handle.addEventListener('pointerdown',event=>{
      if(event.button!==0||handle.max<=handle.min)return;event.preventDefault();handle.focus({preventScroll:true});
      drag={id,x:event.clientX,width:handle.width,pointer:event.pointerId};handle.setPointerCapture(event.pointerId);handle.classList.add('is-dragging');document.body.classList.add('is-resizing-panels');
    });
    handle.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==id||drag.pointer!==event.pointerId)return;
      preferences[id]=clamp(drag.width+(event.clientX-drag.x)*resizeDirection(id),handle.min,handle.max);layout();
    });
    const finish=()=>{if(drag?.id!==id)return;drag=null;handle.classList.remove('is-dragging');document.body.classList.remove('is-resizing-panels')};
    handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);handle.addEventListener('lostpointercapture',finish);
    handle.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
      if(handle.max<=handle.min)return;
      const change=(event.key==='ArrowRight'?1:-1)*(event.shiftKey?50:10)*resizeDirection(id);
      preferences[id]=event.key==='Home'?handle.min:event.key==='End'?handle.max:clamp(handle.width+change,handle.min,handle.max);layout();
    });
    handle.addEventListener('dblclick',()=>{preferences[id]=null;layout()});
    handles.set(id,handle);document.getElementById('stage').append(handle);return handle;
  }
  const left=boundary('left','调整首页左侧栏宽度','home-history-sidebar surface');
  const right=boundary('right','调整右侧边栏宽度','surface home-right-sidebar');
  const copilot=boundary('copilot','调整 Copilot 宽度','surface');
  function place(handle,x,box,width,min,max){
    handle.hidden=false;handle.style.left=`${x-4}px`;handle.style.top=`${box.top}px`;handle.style.height=`${box.height}px`;
    Object.assign(handle,{width,min,max});for(const [key,value]of Object.entries({valuenow:width,valuemin:min,valuemax:max}))handle.setAttribute(`aria-${key}`,String(Math.round(value)));
    handle.setAttribute('aria-valuetext',`${Math.round(width)}px，范围 ${Math.round(min)}–${Math.round(max)}px`);
    handle.classList.toggle('is-fixed',max<=min);handle.title=`${handle.getAttribute('aria-label')} · ${Math.round(min)}–${Math.round(max)}px（双击恢复默认）`;
  }
  function layout(){
    frame=0;const stage=document.getElementById('stage'),surface=document.getElementById('surface'),card=document.getElementById('home-card'),panel=document.getElementById('home-right-sidebar'),sidebar=document.getElementById('home-history-sidebar');
    surface.classList.toggle('copilot-on-left',CopilotDock.side()==='left');
    const home=visible(card)&&stage.classList.contains('is-home-layout'),horizontal=innerWidth>700,hasLeft=home&&visible(sidebar)&&!sidebar.classList.contains('is-floating-history'),hasRight=visible(panel);
    const chat=surface.querySelector(':scope>.chat-panel'),work=surface.querySelector(':scope>.workbench'),split=surface.classList.contains('with-copilot')&&!surface.classList.contains('copilot-expanded')&&visible(chat)&&visible(work);
    for(const handle of handles.values())handle.hidden=true;
    if(HomeLayout.fullscreenPreview()){
      card.classList.remove('is-stacked-home','is-inline-right');stage.classList.remove('has-inline-page-right-sidebar');
      if(hasLeft&&horizontal&&!sidebar.classList.contains('is-floating-history')){const max=Math.max(limits.left.min,Math.min(limits.left.max,card.clientWidth-limits.conversationMin)),width=clamp(preferences.left??limits.left.default,limits.left.min,max);setWidth('--home-sidebar-width',width);const box=rect(sidebar);place(left,box.right,box,box.width,limits.left.min,max)}
      HomeLayout.position();return;
    }
    // Readable widths take priority over the saved preference and the 50% default.
    // The saved preference remains intact when a smaller window clamps the layout.
    const gap=home?0:limits.gap;
    const available=home?card.clientWidth:Math.max(0,stage.clientWidth-rect(surface).left-8-(surface.offsetWidth-surface.clientWidth));
    const homeHorizontal=home&&horizontal&&(!hasLeft||available>=limits.left.min+gap+limits.conversationMin);
    const leftGap=homeHorizontal&&hasLeft?gap:0;
    card.classList.toggle('is-stacked-home',home&&hasLeft&&!homeHorizontal);
    const businessMin=work?.querySelector('.market-content')?limits.marketMin:limits.businessMin;
    const mainMin=home?limits.conversationMin:businessMin+(split?limits.copilot.min+gap:0);
    const inlineRight=hasRight&&horizontal&&(home?homeHorizontal&&available>=(hasLeft?limits.left.min:0)+leftGap+mainMin+gap+limits.right.min:available>=mainMin+gap+limits.right.min);
    card.classList.toggle('is-inline-right',home&&inlineRight);
    stage.classList.toggle('has-inline-page-right-sidebar',!home&&inlineRight);
    const leftMax=homeHorizontal?Math.min(limits.left.max,available-mainMin-leftGap-(inlineRight?limits.right.min+gap:0)):limits.left.max;
    const leftWidth=clamp(preferences.left??limits.left.default,limits.left.min,Math.max(limits.left.min,leftMax));setWidth('--home-sidebar-width',leftWidth);
    const rightSpace=inlineRight?available-mainMin-(home?(hasLeft?leftWidth:0)+leftGap+gap:gap):available-(homeHorizontal&&hasLeft?leftWidth+leftGap:0);
    const rightMax=Math.max(0,Math.min(innerWidth*limits.right.maxRatio,rightSpace));
    const rightWidth=horizontal?clamp(preferences.right??innerWidth*.5,Math.min(limits.right.min,rightMax),rightMax):available;setWidth('--right-sidebar-width',rightWidth);
    if(home&&horizontal){
      if(hasLeft&&homeHorizontal){const box=rect(sidebar);place(left,(box.right+rect(surface).left)/2,box,box.width,limits.left.min,Math.min(limits.left.max,available-limits.conversationMin-leftGap-(inlineRight?rightWidth+gap:0)))}
      if(hasRight){const box=rect(panel);place(right,inlineRight?(rect(surface).right+box.left)/2:box.left,box,box.width,limits.right.min,rightMax)}
    }else if(!home&&hasRight&&horizontal){const box=rect(panel);place(right,box.left,box,box.width,limits.right.min,rightMax)}
    surface.classList.toggle('is-horizontal-copilot',!!split);
    if(split){
      setWidth('--copilot-page-min-width',businessMin);
      const max=Math.max(limits.copilot.min,Math.min(limits.copilot.max,surface.clientWidth-gap-businessMin)),width=clamp(preferences.copilot??clamp(surface.clientWidth*.285,limits.copilot.min,488),limits.copilot.min,max);setWidth('--copilot-width',width);
      const box=rect(chat),workBox=rect(work),bounds=rect(surface),center=CopilotDock.side()==='left'?(box.right+workBox.left)/2:(workBox.right+box.left)/2;
      if(center>=bounds.left+4&&center<=bounds.right-4)place(copilot,center,box,box.width,limits.copilot.min,max);
    }
    HomeLayout.position();WorkspaceTabs.position();
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(layout)}
  function sync(){
    observer?.disconnect();observer=new ResizeObserver(schedule);
    for(const node of [document.getElementById('stage'),document.getElementById('home-card'),document.getElementById('surface'),document.getElementById('home-right-sidebar'),document.querySelector('#surface>.chat-panel')])if(node)observer.observe(node);
    layout();
  }
  document.getElementById('surface').addEventListener('scroll',schedule);
  addEventListener('resize',schedule);window.PanelResize={sync,schedule};
})();
