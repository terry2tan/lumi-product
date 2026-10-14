/* Shared structural placeholders for business pages. */
window.MoreFeaturePages=(()=>{
 const line=(width=64)=>`<span class="wf-line" style="--wf-line-width:${width}%"></span>`;
 const text=(count=2)=>`<div class="wf-text">${Array.from({length:count},(_,i)=>line([68,90,48][i%3])).join('')}</div>`;
 const box=(content='',className='')=>`<div class="wf-box ${className}">${content}</div>`;
 const tabs=(count=3)=>`<div class="wf-tabs">${Array.from({length:count},()=>box(line(62))).join('')}</div>`;
 const chart=()=>box('<svg viewBox="0 0 600 280" preserveAspectRatio="none"><path d="M0 0 600 280M600 0 0 280"/></svg>','wf-chart');
 const table=(rows=5,columns=4)=>`<div class="wf-table" style="--wf-columns:${columns}">${Array.from({length:rows+1},()=>`<div class="wf-table-row">${Array.from({length:columns},(_,i)=>`<div>${line(i?44:66)}</div>`).join('')}</div>`).join('')}</div>`;
 const actions=(count=2)=>`<div class="wf-actions">${Array.from({length:count},()=>box(line(60),'wf-action')).join('')}</div>`;
 const cards=(count,content)=>`<div class="wf-card-grid">${Array.from({length:count},(_,i)=>box(content(i),'wf-card')).join('')}</div>`;
 const layouts={
  catalog:()=>`${tabs(4)}${box('','wf-banner')}${cards(8,()=>box('','wf-card-image')+text(3)+actions(1))}`,
  documents:()=>`<div class="wf-two-column wf-library"><div class="wf-category-list">${Array.from({length:6},(_,i)=>box(line(62),`wf-category${i===0?' current':''}`)).join('')}</div><div class="wf-stack"><div class="wf-list-toolbar">${text(1)}${actions()}</div>${table(8,5)}</div></div>`,
  tasks:()=>`${tabs(2)}<div class="wf-list-toolbar">${text(1)}${actions()}</div>${cards(6,()=>`<div class="wf-card-heading">${text(1)}${box(line(60),'wf-status')}</div>${text(3)}${box(text(1),'wf-card-detail')}${actions(2)}`)}`,
  projects:()=>`<div class="wf-list-toolbar">${text(1)}${actions(1)}</div>${cards(6,()=>`<div class="wf-card-heading">${box('','wf-project-symbol')}${text(1)}</div>${text(3)}${box(text(2),'wf-card-detail')}${actions(1)}`)}`,
  backtest:()=>`<div class="wf-two-column wf-backtest"><div class="wf-stack">${box(text(1)+Array.from({length:3},()=>box(text(2),'wf-list-card')).join(''))}${box(text(1)+box(line(60),'wf-field')+box(line(60),'wf-field'))}</div><div class="wf-stack"><div class="wf-controls">${Array.from({length:3},()=>box(line(55),'wf-field')).join('')}</div>${chart()}${table(3)}</div></div>`,
  news:()=>`${tabs(4)}<div class="wf-two-column wf-news"><div class="wf-news-list">${Array.from({length:4},()=>`<div class="wf-news-row">${box('','wf-thumbnail')}${text(3)}</div>`).join('')}</div><div class="wf-stack">${box(text(1)+text(3))}${box(text(1)+text(3))}</div></div>`,
  funds:()=>`${tabs()}<div class="wf-summary">${Array.from({length:3},()=>box(text(2))).join('')}</div>${table(6,5)}`,
  futures:()=>`${tabs()}<div class="wf-two-column wf-futures">${table(6)}<div class="wf-stack">${box(text(2))}${chart()}<div class="wf-summary">${Array.from({length:3},()=>box(text(2))).join('')}</div></div></div>`,
  feedback:()=>`${box(text(2))}${tabs()}<div class="wf-two-column wf-news"><div class="wf-stack">${Array.from({length:4},()=>box(text(3))).join('')}</div><div class="wf-stack">${Array.from({length:3},()=>box(text(3))).join('')}</div></div>`,
  settings:()=>`<div class="wf-two-column wf-settings"><div class="wf-settings-navigation">${Array.from({length:5},(_,i)=>box(line(62),`wf-settings-category${i===0?' current':''}`)).join('')}</div><div class="wf-stack">${Array.from({length:3},(_,group)=>box(text(1)+Array.from({length:3},(_,row)=>`<div class="wf-settings-row">${text(2)}${(group+row)%2?box(line(60),'wf-settings-option'):'<span class="wf-settings-toggle"><i></i></span>'}</div>`).join(''),'wf-settings-group')).join('')}</div></div>`
 };
 function mount(wb,route){
  const page=document.createElement('section');
  const title={catalog:'商城',documents:'文件',tasks:'自动任务',projects:'项目',backtest:'策略回测',news:'资讯',funds:'基金/ETF',futures:'期货',feedback:'反馈',settings:'系统设置'}[route];
  page.className='more-feature-page';page.dataset.morePage=route;page.setAttribute('aria-label',title);
  page.innerHTML=`<header class="wf-heading"><h1 tabindex="-1">${title}</h1>${route==='settings'?'':box(line(50),'wf-search')}</header><div class="wf-body" aria-hidden="true">${layouts[route]()}</div>`;
  wb.append(page);
  return page;
 }
 function watchlistLayout(){
  const grid=(headings,rows,cls)=>`<div class="wf-watch-grid ${cls}" style="--wf-columns:${headings.length}"><div class="wf-watch-row wf-watch-header">${headings.map(label=>`<span>${label}</span>`).join('')}</div>${Array.from({length:rows},(_,row)=>`<div class="wf-watch-row${row===0?' is-selected':''}">${headings.map((_,column)=>`<span>${line(column===1?74:42+(row+column)%3*14)}</span>`).join('')}</div>`).join('')}</div>`;
  const analysis=(title,kind)=>`<section class="wf-watch-analysis" aria-label="${title}"><header><span>${title}</span><span>${kind}</span></header><div class="wf-watch-chart" aria-hidden="true">${chart()}</div><div class="wf-watch-volume" aria-hidden="true">${chart()}</div></section>`;
  return `<div class="wf-watch-layout"><div class="wf-watch-main"><section class="wf-watch-quotes" aria-label="自选行情表"><div class="wf-watch-groups"><span class="is-selected">全部自选</span><span>我的持仓</span>${Array.from({length:3},()=>`<span class="wf-watch-group-placeholder" aria-hidden="true">${line(65)}</span>`).join('')}<span class="wf-watch-manage">板块管理</span></div><div class="wf-watch-table-scroll">${grid(['代码','名称','现价','涨幅%','涨跌','涨速','主力净量','总量','换手%','量比'],18,'wf-watch-quotes-grid')}</div></section><section class="wf-watch-recommendations" aria-label="每日个股精选"><header>每日个股精选</header><div class="wf-watch-table-scroll">${grid(['股票名称','推荐原因','今日涨幅','5日涨幅','20日涨幅','年初至今','操作'],5,'wf-watch-picks-grid')}</div></section></div><aside class="wf-watch-charts">${analysis('分时图','分时')}${analysis('分析图','日线')}</aside></div>`;
 }
 function mountMarket(wb,category,{key=category,section=0}={}){
  const page=document.createElement('section');page.className='more-feature-page market-category-placeholder';page.dataset.marketPage=key;page.setAttribute('aria-label',category);
  if(category==='自选'&&section===0){
   page.classList.add('market-watchlist-wireframe');page.innerHTML=watchlistLayout();wb.append(page);return page;
  }
  const content=section%3===1
   ?`<div class="wf-two-column wf-futures"><div class="wf-stack">${box(text(2))}${table(8,4)}</div><div class="wf-stack">${chart()}${table(3,4)}</div></div>`
   :section%3===2||category==='环球'
   ?`<div class="wf-summary">${Array.from({length:3},()=>box(text(2))).join('')}</div><div class="wf-two-column wf-futures">${table(8,4)}${table(8,4)}</div>`
   :`<div class="wf-summary">${Array.from({length:3},()=>box(text(2))).join('')}</div>${table(10,6)}`;
  page.innerHTML=`<header class="wf-heading"><h1>${category}</h1></header><div class="wf-body" aria-hidden="true">${content}</div>`;wb.append(page);return page;
 }
 return {mount,mountMarket};
})();
