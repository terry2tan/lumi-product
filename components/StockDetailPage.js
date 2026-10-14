/* Shared stock detail layout with interactive price and volume charts. */
window.StockDetailPage=(()=>{
 const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const source=name=>{const template=document.createElement('template');template.innerHTML=Components[name]();return template.content.firstElementChild};
 const make=(name,cls,html)=>{const el=document.createElement('div');el.dataset.component=name;el.className=cls;el.innerHTML=html;return el};
 const settings=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 3-1 2 2 3-1 1-3 3-1 1-3-2-2 1-3-3-2-3 1Z"/><circle cx="12" cy="12" r="3"/></svg>';
 function buttons(root,items,selected,group){
  for(const [i,label]of items.entries()){
   const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.nodeId=`stock-${group}-${i}`;
   if(!items.some((_,n)=>state.selected.has(`stock-${group}-${n}`))&&label===selected)state.selected.add(button.dataset.nodeId);
   interactive(button,label,null,{group});root.append(button);
  }
 }
 function stocks(){
  const original=source('StockList'),root=make('StockList','stock-detail-list','');
  for(const [index,row]of [...original.children].entries()){
   const [name,code,price,change]=[...row.querySelectorAll('p')].map(p=>p.textContent.trim());
   const button=document.createElement('button');button.type='button';button.className='stock-list-row';button.dataset.nodeId=row.dataset.nodeId;
   button.innerHTML=`<span class="stock-list-name"><span>${esc(name)}</span><small>${esc(code)}</small></span><span class="stock-list-price">${esc(price)}</span><span class="stock-up">${esc(change)}</span>`;
   if(index===0&&![...original.children].some(item=>state.selected.has(item.dataset.nodeId)))state.selected.add(button.dataset.nodeId);
   interactive(button,name,null,{group:'stock'});root.append(button);
  }
  return root;
 }
 function toolbar(){
  const original=source('ChartToolbar'),root=make('ChartToolbar','stock-chart-toolbar','');
  const periods=document.createElement('div');periods.className='stock-scroll-tabs';periods.setAttribute('aria-label','图表周期');
  const labels=[...original.firstElementChild.querySelectorAll('p')].map(p=>p.textContent.trim());
  buttons(periods,labels,'日K','chart-period');
  const signals=document.createElement('div');signals.className='stock-chart-signals';
  for(const p of original.children[1].querySelectorAll('p')){const button=document.createElement('button');button.type='button';button.textContent=p.textContent;button.className=p.style.color==='rgb(0, 205, 89)'?'stock-down':'stock-up';interactive(button,p.textContent,null,{group:'chart-signals'});signals.append(button)}
  const averages=document.createElement('div');averages.className='stock-chart-averages';averages.innerHTML=original.children[2].querySelector('p').innerHTML;
  root.append(periods,signals,averages);return root;
 }
 function news(){
  const original=source('News'),root=make('News','stock-news','');
  const indicators=document.createElement('div');indicators.className='stock-scroll-tabs';indicators.setAttribute('aria-label','图表指标');
  buttons(indicators,['设置','量比指标','成交对比','买卖力道','成交量','KDJFS','RSIFS','BOLLFS','主力控盘'],'成交量','indicators');
  const tabs=document.createElement('div');tabs.className='stock-scroll-tabs';tabs.setAttribute('aria-label','个股资讯分类');
  buttons(tabs,['个股新闻','个股公告','个股研报','个股扫雷','行业资讯[汽车零部件]','社区','关联报价','报价的'],'个股新闻','stock-news-tabs');
  const list=document.createElement('div');list.className='stock-news-list';
  const paragraphs=[...original.querySelectorAll('p')].map(p=>p.textContent.trim());
  let count=0;
  for(let i=0;i<paragraphs.length&&count<7;i++)if(paragraphs[i].startsWith('【')){
   const [tag,title,time]=paragraphs.slice(i,i+3),row=document.createElement('button');row.type='button';row.className='stock-news-row';row.title=title;
   row.innerHTML=`<span class="stock-news-tag">${esc(tag)}</span><span class="stock-news-title">${esc(title)}</span><time>${esc(time)}</time>`;
   interactive(row,title,null,{group:'news'});list.append(row);count++;
  }
  root.append(indicators,tabs,list);return root;
 }
 function quote(){
  const original=source('Quote'),text=id=>node(original,id)?.textContent.trim()||'',ps=[...original.querySelectorAll('p')].map(p=>p.textContent.trim());
  const root=make('Quote','stock-quote',`
   <header class="stock-quote-header"><div class="stock-quote-title"><strong>${esc(text('344:18574'))}</strong><span>${esc(text('344:18575'))}</span><button type="button" class="stock-settings" aria-label="行情设置" title="行情设置">${settings()}</button></div><div class="stock-quote-price stock-down"><strong>${esc(text('344:18567'))}</strong><span>${esc(text('344:18568'))}</span><span>${esc(text('344:18569'))}</span></div></header>
   <div class="stock-quote-ratio"><span>委比</span><span class="stock-up">${esc(ps[ps.indexOf('委比')+1])}</span><span class="stock-up">${esc(ps[ps.indexOf('委比')+2])}</span></div>
   <div class="stock-quote-actions"><button type="button" class="stock-buy">买</button><button type="button" class="stock-sell">卖</button><button type="button">撤</button><button type="button" class="stock-open-account">开户</button></div>`);
  const orderBook=document.createElement('div');orderBook.className='stock-orderbook';orderBook.setAttribute('aria-label','五档盘口');
  for(const [direction,firstPrice]of [['卖','48.65'],['买','48.36']]){
   // The price may also occur in the headline; use the first following book row.
   const start=ps.findIndex((value,i)=>value===firstPrice&&/^[1-5]$/.test(ps[i-1])),side=document.createElement('div');side.className='stock-orderbook-side';
   for(let i=0;i<5;i++){const [level,price,volume]=ps.slice(start-1+i*3,start+2+i*3);const row=document.createElement('div');row.className='stock-orderbook-row';row.innerHTML=`<span>${direction}${esc(level)}</span><span class="stock-down">${esc(price)}</span><span>${esc(volume)}</span>`;side.append(row)}
   orderBook.append(side);
  }
  root.append(orderBook);
  const largeOrder=make('','stock-large-order','<span>大卖单</span><span>***手</span><button type="button">点击查看</button>');root.append(largeOrder);
  const metrics=document.createElement('dl');metrics.className='stock-quote-metrics';
  for(const label of ['最新','涨跌','涨幅','振幅','总手','金额','涨停','外盘','总市值','总股本','市盈(静)']){
   const at=ps.indexOf(label),value=ps[at+2],row=document.createElement('div');row.innerHTML=`<dt>${esc(label)}</dt><dd${['最新','涨跌','涨幅','涨停','外盘','市盈(静)'].includes(label)?' class="stock-up"':''}>${esc(value)}</dd>`;metrics.append(row);
  }
  root.append(metrics);
  const alerts=make('','stock-quote-alerts','');StockMovements.mount(alerts);
  root.append(alerts);
  for(const button of root.querySelectorAll('button'))interactive(button,button.getAttribute('aria-label')||button.textContent.trim(),null,{group:'quote-controls'});
  return root;
 }
 function mount(wb){
  const body=document.createElement('div');body.className='market-content stock-detail-page';body.setAttribute('aria-label','个股行情');wb.append(body);body.append(stocks());
  const chart=document.createElement('section');chart.className='market-chart';body.append(chart);chart.append(toolbar());
  for(const [name,cls]of [['Candles','candles'],['Volume','volume']]){
   const f=document.createElement('div');f.className='fragment '+cls;f.setAttribute('aria-label',cls==='candles'?'K线与均线':'成交量');chart.append(f);
  }
  chart.append(news());body.append(quote());
  StockNews.mount(body);
  window.FuyaoData?.mountStock(body);
  return body;
 }
 return {mount};
})();
