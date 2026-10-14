/* Local sample data and shared application chart lifecycle. */
window.FuyaoData=(()=>{
 const available=()=>true,valid=n=>typeof n==='number'&&Number.isFinite(n);
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const number=(n,d=2)=>valid(n)?n.toFixed(d):'--',signed=(n,d=2)=>valid(n)?(n>0?'+':'')+n.toFixed(d):'--',percent=n=>valid(n)?signed(n)+'%':'--';
 const amount=n=>!valid(n)?'--':Math.abs(n)>=1e8?(n/1e8).toFixed(2)+'亿':Math.abs(n)>=1e4?(n/1e4).toFixed(2)+'万':n.toFixed(2);
 const date=n=>valid(n)?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(n)):'';
 const items=data=>Array.isArray(data?.item)?data.item:[];
 const defaults=[...new Map([...DemoFinance.catalog.slice(0,3),...AppWatchlist.list().filter(row=>row.asset_type!=='hk-stock')].map(row=>[row.thscode,row])).values()],indices=[['000001.SH','沪指'],['399001.SZ','深指'],['399006.SZ','创指'],['000680.SH','科创综指']];
 let selected=defaults[0],metadataPromise=null;
 async function query(operation,parameters={}){return DemoMarketData.query(operation,parameters)}
 function direction(n,value){n.classList.remove('stock-up','stock-down','stock-empty','up','down');if(!valid(value))n.classList.add('stock-empty');else if(value!==0)n.classList.add(value>0?'stock-up':'stock-down')}
 const priceDirection=(price,previous)=>valid(price)&&valid(previous)&&previous>0?Math.round(price*1000)-Math.round(previous*1000):null;
 function metadata(){if(!metadataPromise)metadataPromise=query('ticker_list',{asset_type:'a-share',limit:10000,offset:0}).then(data=>items(data).length?items(data):DemoFinance.catalog).catch(()=>{metadataPromise=null;return DemoFinance.catalog});return metadataPromise}
 function mountStock(body){
  body.dataset.fuyao='stock';body.dataset.dataMode='local';
  const list=body.querySelector('.stock-detail-list'),quote=body.querySelector('.stock-quote'),candle=body.querySelector('.candles'),volume=body.querySelector('.volume'),signals=body.querySelector('.stock-chart-signals');
  for(const host of [list,quote,candle,volume])host.classList.add('fuyao-live');
  let stocks=defaults.map(r=>({...r})),records=[],period='日K',sequence=0,started=false,refreshing=false,snapshots=[],currentQuote=null,snapshotTime=null,historyReady=false,historyFailed=false,closed=false,cooldown=0;
  const valuations=new Map(),chart=FuyaoPlot.create(candle,volume);body.stockChart=chart;body.dataset.pollInterval='2000';
  if(!stocks.some(r=>r.thscode===selected.thscode))stocks.push(selected);
  const adjustment=el('span',null,'前复权'),updateState=el('span','stock-chart-update-state'),retry=el('button','fuyao-retry','重试');updateState.hidden=retry.hidden=true;retry.type='button';retry.setAttribute('aria-label','重新加载行情');retry.onclick=()=>load();signals.replaceChildren(adjustment,updateState,retry);
  const setHeader=row=>{quote.querySelector('.stock-quote-title strong').textContent=row.name||row.thscode;quote.querySelector('.stock-quote-title>span').textContent=row.ticker||row.thscode.split('.')[0]};
  // The public service does not supply the five-level order book.
  const book=quote.querySelector('.stock-orderbook');book.replaceChildren();
  for(const sideName of ['卖','买']){const side=el('div','stock-orderbook-side');for(let i=0;i<5;i++){const line=el('div','stock-orderbook-row');line.append(el('span',null,sideName+(sideName==='卖'?5-i:i+1)),el('span','stock-empty','--'),el('span','stock-empty','--'));side.append(line)}book.append(side)}
  const ratio=quote.querySelector('.stock-quote-ratio');for(const value of [...ratio.children].slice(1)){value.textContent='--';direction(value,null)}quote.querySelector('.stock-large-order').replaceChildren(el('span',null,'大单成交'),el('span','stock-empty','--'));
  function fillQuote(raw={},timestamp){
   const digits=selected.asset_type==='fund-etf'?3:2,priceNumber=value=>number(value,digits);
   const price=quote.querySelector('.stock-quote-price');price.classList.remove('stock-up','stock-down');price.children[0].textContent=priceNumber(raw.last_price);price.children[1].textContent=signed(raw.price_change,digits);price.children[2].textContent=percent(raw.price_change_ratio_pct);[priceDirection(raw.last_price,raw.prev_price),raw.price_change,raw.price_change_ratio_pct].forEach((value,i)=>direction(price.children[i],value));
   const amplitude=valid(raw.high_price)&&valid(raw.low_price)&&raw.prev_price>0?(raw.high_price-raw.low_price)/raw.prev_price*100:null;
   const fields={'最新':priceNumber(raw.last_price),'涨跌':signed(raw.price_change,digits),'涨幅':percent(raw.price_change_ratio_pct),'振幅':valid(amplitude)?number(amplitude)+'%':'--','总手':valid(raw.volume)?(raw.volume/100).toLocaleString('zh-CN',{maximumFractionDigits:2}):'--','金额':amount(raw.turnover),'今开':priceNumber(raw.open_price),'最高':priceNumber(raw.high_price),'最低':priceNumber(raw.low_price),'昨收':priceNumber(raw.prev_price)};
   const directions={'最新':priceDirection(raw.last_price,raw.prev_price),'涨跌':raw.price_change,'涨幅':raw.price_change_ratio_pct,'今开':priceDirection(raw.open_price,raw.prev_price),'最高':priceDirection(raw.high_price,raw.prev_price),'最低':priceDirection(raw.low_price,raw.prev_price)};
   const metrics=quote.querySelector('.stock-quote-metrics');metrics.replaceChildren();for(const [key,value]of Object.entries(fields)){const line=el('div'),data=el('dd',value==='--'?'stock-empty':null,value);if(key in directions)direction(data,directions[key]);line.append(el('dt',null,key),data);metrics.append(line)}
   const pe=el('div'),peValue=valuations.get(selected.thscode);pe.append(el('dt',null,'市盈(TTM)'),el('dd',valid(peValue)?null:'stock-empty',number(peValue)));pe.dataset.valuation='pe_ttm';metrics.append(pe);if(timestamp!==undefined)body.dataset.snapshotTimestamp=timestamp??'';
  }
  function drawList(){const byCode=new Map(snapshots.map(r=>[r.thscode,r]));list.replaceChildren();for(const row of stocks){const value=byCode.get(row.thscode)||{},button=el('button','stock-list-row'),name=el('span','stock-list-name');button.type='button';button.dataset.thscode=row.thscode;button.classList.toggle('selected',row.thscode===selected.thscode);button.setAttribute('aria-pressed',String(row.thscode===selected.thscode));name.append(el('span',null,row.name||row.thscode),el('small',null,row.ticker||row.thscode.split('.')[0]));const change=el('span',null,percent(value.price_change_ratio_pct)),price=el('span','stock-list-price',number(value.last_price,row.asset_type==='fund-etf'?3:2));direction(change,value.price_change_ratio_pct);direction(price,priceDirection(value.last_price,value.prev_price));button.append(name,price,change);button.onclick=()=>{selected=row;load();drawList()};list.append(button)}}
  function plot(reset=false){
   const supplied=historyReady?FuyaoPlot.mergeSnapshot(records,currentQuote,snapshotTime):[];
   const plotted=chart.update(supplied,{period,symbol:selected.thscode,reset,digits:selected.asset_type==='fund-etf'?3:2});window.UserDrawings?.apply(chart,selected.thscode);
   body.querySelector('.stock-chart-averages').textContent=[5,20,60].map(n=>'MA'+n+' '+(plotted.length<n?'--':number(plotted.slice(-n).reduce((sum,r)=>sum+r.close_price,0)/n,selected.asset_type==='fund-etf'?3:2))).join('    ');
   if(!available())chart.status('尚未连接行情');else if(!historyReady)chart.status(historyFailed?'K线数据暂不可用':'正在加载行情…');
  }
  const supported=['日K','周K','月K','年K','季K'];
  for(const button of body.querySelectorAll('[aria-label="图表周期"] button')){const label=button.textContent.trim(),enabled=supported.includes(label);button.disabled=!enabled;button.title=enabled?'':'暂无对应行情数据';button.classList.toggle('selected',label===period);button.setAttribute('aria-pressed',String(label===period));if(enabled)button.addEventListener('click',()=>{period=label;for(const b of body.querySelectorAll('[aria-label="图表周期"] button')){b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))}plot(true)})}
  async function updatePrices(token=sequence){
   if(refreshing||closed||!available()||Date.now()<cooldown)return;refreshing=true;
   try{
    const requests=[query('stock_snapshot',{thscodes:stocks.filter(r=>r.asset_type!=='fund-etf').map(r=>r.thscode).join(',')})];if(selected.asset_type==='fund-etf')requests.push(query('fund_snapshot',{thscode:selected.thscode}));
    const responses=await Promise.all(requests),data=responses.at(-1);if(!body.isConnected||token!==sequence)return;
    if(valid(snapshotTime)&&valid(data.timestamp)&&data.timestamp<snapshotTime)return;
    snapshots=[...snapshots.filter(row=>stocks.find(meta=>meta.thscode===row.thscode)?.asset_type==='fund-etf'&&row.thscode!==selected.thscode),...responses.flatMap(items)];currentQuote=snapshots.find(r=>r.thscode===selected.thscode)||null;snapshotTime=data.timestamp;
    body.dataset.snapshotReceivedAt=String(Date.now());body.dataset.snapshotUpdates=String(Number(body.dataset.snapshotUpdates||0)+1);
    drawList();fillQuote(currentQuote||{},data.timestamp);plot();updateState.hidden=true;retry.hidden=!historyFailed;
   }catch(error){if(body.isConnected&&token===sequence){updateState.textContent='更新暂不可用';updateState.hidden=false;retry.hidden=false;if(/频繁|429|4001/.test(error.message))cooldown=Date.now()+60000}}
   finally{refreshing=false;if(!closed&&body.isConnected&&token!==sequence)updatePrices(sequence)}
  }
  function load(){
   const token=++sequence,code=selected.thscode;body.dataset.thscode=code;records=[];currentQuote=null;snapshotTime=null;historyReady=false;historyFailed=false;updateState.hidden=retry.hidden=true;
   adjustment.textContent=selected.asset_type==='fund-etf'?'不复权':'前复权';setHeader(selected);body.setStockNews?.(selected);fillQuote({},null);plot(true);if(!available())return;
   query(selected.asset_type==='fund-etf'?'fund_history':'stock_history',selected.asset_type==='fund-etf'?{thscode:code}:{thscode:code,adjust:'forward'}).then(data=>{if(!body.isConnected||token!==sequence)return;records=FuyaoPlot.bars(items(data));historyReady=true;body.dataset.historyTimestamp=data.timestamp??'';plot(true)}).catch(()=>{if(!body.isConnected||token!==sequence)return;historyFailed=true;retry.hidden=false;plot()});
   updatePrices(token);
   if(selected.asset_type!=='fund-etf')query('stock_valuation',{thscodes:code}).then(data=>{if(!body.isConnected||token!==sequence)return;const value=items(data).find(r=>r.thscode===code)?.pe_ttm;if(valid(value)){valuations.set(code,value);const metric=quote.querySelector('[data-valuation] dd');metric.textContent=number(value);metric.classList.remove('stock-empty')}}).catch(()=>{});
  }
  body.fuyaoActivate=()=>{if(started)return;started=true;load();if(available())metadata().then(all=>{if(!body.isConnected)return;stocks=stocks.map(r=>all.find(m=>m.thscode===r.thscode)||r);selected=stocks.find(r=>r.thscode===selected.thscode)||selected;setHeader(selected);drawList()})};
  body.fuyaoSelect=row=>{DemoMarketData.remember(row);if(!stocks.some(r=>r.thscode===row.thscode))stocks.push(row);selected=row;drawList();if(started)load();else body.fuyaoActivate()};
  function dispose(){if(closed)return;closed=true;clearInterval(timer);document.removeEventListener('visibilitychange',resume);chart.destroy()}
  const resume=()=>{if(!document.hidden&&body.isConnected&&body.getClientRects().length&&started)updatePrices()};
  // 行情页的 DOM 会被缓存并在切回时重新挂上，断开期间只暂停刷新，不销毁图表。
  const timer=setInterval(()=>{if(!body.isConnected||!body.getClientRects().length||document.hidden||!started)return;updatePrices()},2000);
  document.addEventListener('visibilitychange',resume);body.disposeStockChart=dispose;
  drawList();setHeader(selected);fillQuote({},null);plot();if(state.selectedPage==='个股')body.fuyaoActivate();
 }
 function mountIndices(bar){
  const time=bar.querySelector('time'),clockFormat=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  function tick(){const now=new Date(),parts=Object.fromEntries(clockFormat.formatToParts(now).map(part=>[part.type,part.value]));time.textContent=`${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;time.dateTime=now.toISOString();time.title='北京时间'}
  tick();const clockTimer=setInterval(()=>{if(!bar.isConnected)clearInterval(clockTimer);else tick()},1000);
  if(!available())return;bar.dataset.fuyao='indices';const rows=[...bar.querySelectorAll('.market-status-index')],connection=bar.querySelector('.market-connection');
  function draw(data={}){if(!bar.isConnected)return;indices.forEach(([code],i)=>{const meta=DemoFinance.catalog.find(r=>r.thscode===code),row=DemoFinance.quote(meta,items(data).find(r=>r.thscode===code)),nodes=rows[i].children;[number(row.last_price),signed(row.price_change),percent(row.price_change_ratio_pct),amount(row.turnover)].forEach((value,n)=>{nodes[n+1].textContent=value;direction(nodes[n+1],row.price_change_ratio_pct)})});connection.dataset.state='ready';connection.setAttribute('aria-label','行情已连接');bar.dataset.snapshotTimestamp=data.timestamp??''}
  async function refresh(){try{draw(await query('index_snapshot',{thscodes:indices.map(r=>r[0]).join(',')}))}catch{draw()}}draw();refresh();const timer=setInterval(()=>{if(!bar.isConnected)clearInterval(timer);else if(bar.getClientRects().length&&!document.hidden)refresh()},60000);
 }
 function bindSearch(input,wb){
  if(!available())return;const parent=input.parentElement,popup=el('div','fuyao-search-results');popup.hidden=true;popup.id='fuyao-search-'+Math.random().toString(36).slice(2);popup.setAttribute('role','listbox');parent.append(popup);input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',popup.id);input.setAttribute('aria-expanded','false');let timer,sequence=0;
  const hide=()=>{sequence++;popup.hidden=true;input.setAttribute('aria-expanded','false')};
  input.oninput=()=>{clearTimeout(timer);const q=input.value.trim(),token=++sequence;if(!q){hide();return}timer=setTimeout(async()=>{let rows;try{rows=items(await query('ticker_search',{q,asset_type:'a-share',limit:12}))}catch{rows=[]}if(!rows.length)rows=DemoFinance.catalog.filter(r=>(r.name+r.thscode).includes(q));if(!input.isConnected||token!==sequence)return;popup.hidden=false;input.setAttribute('aria-expanded','true');popup.replaceChildren();if(!rows.length){popup.append(el('p','fuyao-empty','未找到相关股票'));return}for(const row of rows){const button=el('button');button.type='button';button.setAttribute('role','option');button.append(el('span',null,row.name||row.thscode),el('small',null,row.thscode));button.onclick=()=>{state.selectedPage='个股';state.marketSecondary=null;syncMarketPrimaryNavigation(wb);wb.querySelector('.stock-detail-page').fuyaoSelect(row);input.value='';hide();input.focus()};button.onkeydown=event=>{const buttons=[...popup.querySelectorAll('button')],at=buttons.indexOf(button);if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();buttons[(at+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus()}else if(event.key==='Escape'){hide();input.focus()}};popup.append(button)}},250)};
  input.onkeydown=e=>{if(e.key==='Escape'){clearTimeout(timer);input.value='';hide()}if(e.key==='ArrowDown'){e.preventDefault();popup.querySelector('button')?.focus()}};
  const outside=e=>{if(!input.isConnected){document.removeEventListener('pointerdown',outside);return}if(!parent.contains(e.target))hide()};document.addEventListener('pointerdown',outside);
 }
 function openStock(row){DemoMarketData.remember(row);selected=row;state.selectedPage='个股';state.marketSecondary=null;navigate('行情',{keepCopilot:true});document.querySelector('.stock-detail-page')?.fuyaoSelect?.(row);}
 return {available:()=>false,query,mountStock,mountIndices,bindSearch,openStock,mountHome:()=>{},number,percent,amount,date};
})();
