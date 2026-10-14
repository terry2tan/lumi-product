/* In-card market tools; switching leaves the chart and quote DOM intact. */
function marketToolsPanel(wb,bar){
 const buttons=()=>Array.from(bar.querySelectorAll('[data-market-tool]'));
 const panel=document.createElement('aside');
 panel.id='market-tool-panel';
 panel.className='market-tool-panel';
 panel.hidden=true;
 panel.setAttribute('aria-label','行情工具');
 const line=(width=64)=>`<span class="wf-line" style="--wf-line-width:${width}%"></span>`;
 const text=(widths=[88,64])=>`<div class="wf-text">${widths.map(line).join('')}</div>`;
 const box=(content,className='')=>`<div class="wf-box ${className}">${content}</div>`;
 const tabs=count=>`<div class="wf-tabs">${Array.from({length:count},()=>box(line(62))).join('')}</div>`;
 const tag=()=>box(line(75),'market-tool-wf-tag');
 const summary=()=>`<div class="market-tool-wf-summary">${line(40)}${line(18)}</div>`;
 const alertCard=()=>box(`<div class="market-tool-wf-meta">${line(24)}${tag()}</div>${text([72,94,60])}`,'market-tool-wf-card');
 const newsCard=()=>box(`${line(26)}${text([80,96,58])}`,'market-tool-wf-card');
 const discussionCard=()=>box(`<div class="market-tool-wf-author"><span class="market-tool-wf-avatar"></span>${text([62,35])}</div>${text([94,80,52])}<div class="market-tool-wf-actions">${tag()}${tag()}</div>`,'market-tool-wf-card');
 panel.innerHTML=`
  <header class="market-tool-heading"><span class="market-tool-heading-icon" aria-hidden="true"></span><h2></h2><button type="button" class="market-tool-close" aria-label="关闭行情工具">×</button></header>
  <section class="market-tool-view" data-market-view="短线精灵" hidden>
   <div class="market-tool-wireframe" aria-hidden="true">${summary()}${tabs(3)}<div class="market-tool-wf-list">${Array.from({length:4},alertCard).join('')}</div></div>
  </section>
  <section class="market-tool-view" data-market-view="快讯" hidden>
   <div class="market-tool-wireframe" aria-hidden="true">${summary()}${tabs(3)}<div class="market-tool-wf-list market-tool-wf-timeline">${Array.from({length:5},newsCard).join('')}</div></div>
  </section>
  <section class="market-tool-view" data-market-view="论股" hidden>
   <div class="market-tool-wireframe" aria-hidden="true">${box(text([58,34]))}${tabs(2)}<div class="market-tool-wf-list">${Array.from({length:3},discussionCard).join('')}</div></div>
  </section>
  <section class="market-tool-view" data-market-view="诊股" hidden>
   <div class="market-tool-wireframe" aria-hidden="true">${summary()}${box(text([64,42]))}${tabs(3)}<div class="market-tool-wf-list">${Array.from({length:3},alertCard).join('')}</div></div>
  </section>
  <section class="market-tool-view" data-market-view="小程序" hidden>
   <div class="market-tool-wireframe" aria-hidden="true">${summary()}${tabs(2)}<div class="market-tool-wf-list">${Array.from({length:4},()=>box(text([54,78]))).join('')}</div></div>
  </section>
  <section class="market-tool-view" data-market-view="决策" hidden>
   <div class="market-tool-wireframe" aria-hidden="true">${summary()}${tabs(3)}<div class="market-tool-wf-list">${Array.from({length:3},()=>box(`${tag()}${text([88,62])}`,'market-tool-wf-card')).join('')}</div></div>
  </section>`;
 const title=panel.querySelector('h2');
 const icon=panel.querySelector('.market-tool-heading-icon');
 const closeButton=panel.querySelector('.market-tool-close');
 const views=Array.from(panel.querySelectorAll('[data-market-view]'));
 const readingPositions=new Map();
 function saveReading(){
  if(panel.hidden||!panel.isConnected||!panel.getClientRects().length)return;
  for(const view of views)if(!view.hidden)readingPositions.set(view.dataset.marketView,view.scrollTop);
 }
 function restoreReading(){
  requestAnimationFrame(()=>{
   if(panel.hidden||!panel.isConnected||!panel.getClientRects().length)return;
   for(const view of views)if(!view.hidden)view.scrollTop=readingPositions.get(view.dataset.marketView)||0;
  });
 }
 wb.marketToolReading={save:saveReading,restore:restoreReading};
 let selected=null;
 function syncButtons(){buttons().forEach(button=>{const active=button.dataset.marketTool===selected;button.classList.toggle('active',active);button.setAttribute('aria-expanded',String(active))})}
 function close(){
  if(!selected)return;
  saveReading();
  const previous=selected;
  selected=null;
  panel.hidden=true;
  wb.classList.remove('has-market-tool-panel');
  syncButtons();
  (buttons().find(button=>button.dataset.marketTool===previous)||bar.querySelector('.market-tools-toggle'))?.focus({preventScroll:true});
 }
 function select(name){
   const item=MarketToolsMenu.items.find(item=>item.label===name);if(!item)return;
   if(selected===name){close();return}
   saveReading();
   selected=name;
   title.textContent=name;
   panel.setAttribute('aria-label',name);
   closeButton.setAttribute('aria-label',`关闭${name}`);
   icon.innerHTML=item.icon;
   views.forEach(view=>{view.hidden=view.dataset.marketView!==name});
   syncButtons();
   panel.hidden=false;
   wb.classList.add('has-market-tool-panel');
   restoreReading();
 }
 closeButton.addEventListener('click',close);
 function dismissWithEscape(event){if(event.key==='Escape'&&selected){event.preventDefault();event.stopPropagation();close()}}
 panel.addEventListener('keydown',dismissWithEscape);
 bar.addEventListener('keydown',dismissWithEscape);
 wb.append(panel);
 return {select,close,syncButtons,selected:()=>selected,panelId:panel.id};
}
