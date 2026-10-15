/* Market-led new conversation homepage. All datasets are local demo snapshots. */
window.MarketHome = (() => {
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const icons = {
    arrow: 'M5 12h14m-5-5 5 5-5 5', chevron: 'm6 9 6 6 6-6', plus: 'M12 5v14M5 12h14',
    expand: 'M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5', star: 'm12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3.2 9.6l6.3-.9Z',
    spark: 'm12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z', close: 'm6 6 12 12M18 6 6 18', search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]}"/></svg>`;
  const control = (label, cls, action, glyph) => { const b = make('button', cls); b.type = 'button'; b.setAttribute('aria-label', label); if (glyph) b.innerHTML = icon(glyph); else if (!cls || cls === 'mh-text-action') b.textContent = label; b.onclick = action; return b; };
  const markets = {
    'A股': {
      indices: [['上证指数','000001','3,892.36',1.28,'+49.16'],['深证成指','399001','12,836.42',1.86,'+234.41'],['创业板指','399006','2,986.75',2.34,'+68.29'],['科创50','000688','1,328.19',-0.62,'−8.29']],
      breadth: ['3,286','1,842','1.86万亿','+12.6%'],
      summaries: [
        ['算力产业链领涨，市场成交额回升至 1.86 万亿元','算力硬件与光通信方向表现活跃，创业板指涨幅居前。市场上涨家数多于下跌家数，成交额较上一交易日增加 12.6%。','算力 · 光通信'],
        ['半导体板块分化，设备与先进封装表现活跃','半导体设备与先进封装方向走强，部分芯片设计公司回落。板块内部表现分化，关注成交向哪些细分方向集中。','半导体'],
        ['高股息方向震荡，银行与煤炭温和回调','银行、煤炭方向小幅回调，电力板块表现相对平稳。市场风格变化可以结合成交量与板块广度一起观察。','高股息'],
        ['消费电子回暖，产业链关注新品与订单进展','消费电子板块震荡走强，连接器与精密制造方向表现活跃，关注企业公告中的新品、订单及产能信息。','消费电子'],
      ],
      sectors: [['算力硬件',4.26,['中际旭创','新易盛','天孚通信','工业富联','沪电股份','太辰光']],['半导体',2.18,['北方华创','中微公司','海光信息','寒武纪','长电科技']],['新能源',1.62,['宁德时代','阳光电源','比亚迪','隆基绿能']],['消费电子',1.34,['立讯精密','歌尔股份','蓝思科技','京东方A']],['金融',-0.58,['招商银行','工商银行','中国平安','东方财富']],['医药',0.76,['恒瑞医药','迈瑞医疗','药明康德','爱尔眼科']],['能源',-1.12,['中国神华','中国石油','陕西煤业','长江电力']]],
    },
    '港股': {
      indices: [['恒生指数','HSI','26,482.18',1.42,'+370.78'],['恒生科技','HSTECH','6,128.43',2.18,'+130.75'],['国企指数','HSCEI','9,468.20',1.26,'+117.82'],['红筹指数','HSCCI','4,186.57',-0.38,'−15.97']],
      breadth: ['1,286','872','2,368亿港元','+8.2%'],
      summaries: [['科技股走强，恒生科技指数涨幅居前','互联网与科技硬件方向活跃，市场成交额回升。观察头部公司的价格变化与板块整体成交分布。','互联网'],['互联网平台表现活跃，消费方向温和回暖','互联网平台与消费服务公司走强，部分零售与出行标的成交放大。','消费'],['内银股窄幅波动，红筹指数小幅回落','银行与能源方向走势分化，红筹指数小幅回落。','金融'],['汽车板块走强，市场关注交付与海外进展','汽车与零部件方向活跃，关注公司发布的交付及产能进展。','汽车']],
      sectors: [['互联网',3.12,['腾讯控股','阿里巴巴','美团','京东集团','网易']],['科技硬件',2.46,['小米集团','联想集团','舜宇光学','中芯国际']],['汽车',2.08,['比亚迪股份','理想汽车','吉利汽车','小鹏汽车']],['消费',1.12,['泡泡玛特','安踏体育','农夫山泉','海底捞']],['金融',-0.46,['汇丰控股','友邦保险','建设银行','香港交易所']],['医药',0.84,['信达生物','百济神州','药明生物','石药集团']],['能源',-0.78,['中国海洋石油','中国神华','中国石油','中煤能源']]],
    },
    '美股': {
      indices: [['标普500','SPX','7,811.54',0.59,'+45.82'],['纳斯达克','IXIC','27,336.17',0.64,'+173.81'],['道琼斯','DJI','51,654.95',0.83,'+425.30'],['VIX','VIX','14.84',-3.70,'−0.57']],
      breadth: ['2,812','1,624','5,286亿美元','+6.4%'],
      summaries: [['科技股回暖，美股三大指数收高','科技与消费方向回暖，标普500、纳斯达克与道琼斯指数均上涨。关注科技龙头表现与指数上涨广度。','科技'],['AI 基础设施仍受关注，硬件与软件表现分化','算力与软件公司表现分化，市场关注资本开支和收入兑现。','人工智能'],['原油小幅震荡，能源板块温和回调','能源板块小幅回调，观察原油价格与企业成本变化。','能源'],['美债收益率高位震荡，市场关注利率路径','利率相关资产表现分化，观察债券收益率、美元和风险资产的联动。','宏观']],
      sectors: [['科技',0.51,['NVIDIA','Microsoft','Apple','Broadcom','AMD','Micron']],['通信服务',-1.51,['Alphabet','Meta','Netflix','Disney']],['可选消费',1.02,['Amazon','Tesla','Home Depot','McDonald’s']],['医疗',1.58,['Eli Lilly','JNJ','AbbVie','Merck']],['金融',0.92,['Berkshire','JPMorgan','Visa','Mastercard']],['工业',0.50,['Caterpillar','GE','Honeywell','Boeing']],['能源',-0.25,['Exxon Mobil','Chevron','ConocoPhillips','SLB']]],
    },
    '全球': {
      indices: [['美元指数','DXY','102.68',-0.24,'−0.25'],['现货黄金','XAUUSD','3,986.42',0.86,'+33.99'],['布伦特原油','BRENT','82.46',1.12,'+0.91'],['日经225','N225','46,218.36',0.74,'+339.51']],
      breadth: ['亚太 +0.82%','欧洲 +0.46%','黄金 +0.86%','原油 +1.12%'],
      summaries: [['亚太市场普遍上涨，黄金与原油走强','亚太主要指数温和上涨，黄金与原油走强，美元指数小幅回落。','全球市场'],['美元指数小幅回落，非美货币表现分化','观察利率预期与主要货币走势的关系。','汇率'],['黄金温和走强，贵金属方向受到关注','贵金属价格震荡走强，关注美元与实际利率的变化。','贵金属'],['原油上涨，市场关注需求与库存变化','观察供应、库存和运输成本变化对价格的影响。','原油']],
      sectors: [['亚太市场',0.82,['日经225','韩国综合','澳洲标普','台湾加权']],['欧洲市场',0.46,['德国DAX','法国CAC','英国富时','欧洲50']],['美国市场',0.59,['标普500','纳斯达克','道琼斯','罗素2000']],['贵金属',0.86,['黄金','白银','铂金','钯金']],['外汇',-0.24,['美元指数','欧元美元','英镑美元','美元日元']],['农产品',0.64,['大豆','玉米','小麦','棉花']],['能源',1.12,['布伦特原油','WTI原油','天然气','燃油']]],
    },
  };
  const stocks = [
    {name:'中际旭创',code:'300308',price:'168.42',change:5.26,tag:'算力',badge:'中',color:'#46577d'},
    {name:'科华数据',code:'002335',price:'42.86',change:3.18,tag:'算力',badge:'科',color:'#4e7066'},
    {name:'太辰光',code:'300570',price:'58.64',change:4.72,tag:'算力',badge:'太',color:'#795b48'},
    {name:'宁德时代',code:'300750',price:'286.50',change:1.86,tag:'新能源',badge:'宁',color:'#475c74'},
    {name:'招商银行',code:'600036',price:'42.38',change:-0.86,tag:'高股息',badge:'招',color:'#78464a'},
    {name:'腾讯控股',code:'00700',price:'628.50',change:2.34,tag:'互联网',badge:'腾',color:'#3f667c'},
    {name:'长江电力',code:'600900',price:'28.64',change:-0.42,tag:'高股息',badge:'长',color:'#456f73'},
    {name:'铂力特',code:'688333',price:'78.26',change:2.18,tag:'高端制造',badge:'铂',color:'#6b586c'},
  ];
  for(const item of AppWatchlist.list()){const existing=stocks.find(row=>row.code===item.code);if(existing)Object.assign(existing,item);else stocks.push({...item,price:item.price||'--',change:item.change??null,badge:item.name.slice(0,1),color:'#46577d'})}
  const news = [
    {tag:'算力',title:'算力产业链成交活跃，光通信与服务器方向表现居前',source:'同花顺资讯',time:'14:52',body:'光通信、服务器与 PCB 方向表现活跃，部分公司成交量上升。观察板块内部表现、上涨家数与成交集中度，可以帮助理解这轮变化。',color:'#655574',mark:'AI',related:true},
    {tag:'半导体',title:'半导体设备与先进封装走强，产业链关注订单进展',source:'财联社',time:'14:36',body:'半导体设备与先进封装方向表现较强，市场关注企业订单、交付节奏以及产能利用变化。公司层面的信息仍以公告为准。',color:'#4b606d',mark:'芯',related:false},
    {tag:'公司公告',title:'自选公司公告速览：项目进展、业绩披露与股东变化',source:'公告精选',time:'13:48',body:'将自选公司的项目进展、业绩披露和股东变化按公司整理，保留公告日期与来源，便于继续查看原文和追踪后续变化。',color:'#5c6852',mark:'报',related:true},
    {tag:'宏观',title:'市场成交额回升，关注后续量能与行业扩散情况',source:'同花顺资讯',time:'13:26',body:'成交额较上一交易日增加。观察增量成交是否向更多行业扩散，以及指数、上涨家数和个股表现是否同步变化。',color:'#765950',mark:'市',related:false},
  ];
  const rankMarkets = {
    'A股': stocks.filter(s=>s.code.length===6&&s.asset_type!=='fund-etf').map((s,i)=>({...s,turnover:[86.4,28.3,21.6,74.2,32.8,18.1,9.5][i]??DemoMarketData.snapshot(s).turnover/1e8})),
    '港股': [['腾讯控股','00700','628.50',2.34,86.7],['阿里巴巴','09988','168.20',3.12,104.2],['小米集团','01810','52.46',4.16,92.8],['建设银行','00939','7.82',-0.68,42.6],['中国海洋石油','00883','21.64',-1.26,31.8]],
    '美股': [['NVIDIA','NVDA','229.28',-0.52,286.4],['Microsoft','MSFT','535.07',2.38,124.8],['Amazon','AMZN','246.18',3.29,164.2],['Apple','AAPL','336.64',-1.11,182.6],['Tesla','TSLA','428.50',2.05,216.7]],
    '全球': [['现货黄金','XAUUSD','3,986.42',0.86,328.6],['布伦特原油','BRENT','82.46',1.12,148.2],['美元指数','DXY','102.68',-0.24,186.4],['日经225','N225','46,218.36',0.74,264.1],['德国DAX','DAX','26,218.50',0.46,128.7]],
  };
  const preference = {market:'A股',watchGroup:'全部',watchQuery:'',watch:new Set(AppWatchlist.list().map(s=>s.code)),rank:'涨幅榜',news:'精选',heat:'行业',summary:0,scroll:0};
  let root, dialog;
  const pct = n => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;
  const tone = n => n >= 0 ? 'mh-up' : 'mh-down';
  function sparkline(n, seed, large=false) {
    const points = Array.from({length:52},(_,i)=> {const trend=n>=0?27-i*.34:13+i*.29;return [i*4,Math.max(4,Math.min(40,trend+Math.sin(i*1.08+seed)*2.3+Math.sin(i*.33+seed)*4.1))]});
    const d=points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '),svg=make('div','mh-spark '+tone(n));
    svg.innerHTML=`<svg viewBox="0 0 204 46" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mh-gradient-${seed}-${large}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".20"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${d} L204 46 L0 46Z" fill="url(#mh-gradient-${seed}-${large})"/><path d="M0 31H204" stroke="currentColor" opacity=".15" stroke-dasharray="2 3"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`;
    return svg;
  }
  function heading(title, action) { const h=make('div','mh-section-head');h.append(make('h2',null,title));if(action)h.append(action);return h; }
  function ask(text) { closeDialog();const input=root.querySelector('.conversation-input');input.value=text;input.oninput();root.scrollTop=0;input.focus({preventScroll:true}); }
  function closeDialog(){if(dialog){dialog.close();dialog.remove();dialog=null}}
  function openDialog(title, build) {
    closeDialog();dialog=make('dialog','mh-dialog');dialog.setAttribute('aria-label',title);const currentDialog=dialog;
    const h=make('header','mh-dialog-head');h.append(make('h2',null,title),control('关闭详情','mh-icon',closeDialog,'close'));dialog.append(h);build(dialog);dialog.addEventListener('click',e=>{if(e.target===currentDialog)closeDialog()});dialog.addEventListener('close',()=>{currentDialog.remove();if(dialog===currentDialog)dialog=null});document.body.append(dialog);dialog.showModal();
  }
  function stockDetail(s){if(s.thscode&&s.asset_type!=='hk-stock'){FuyaoData.openStock({...s,ticker:s.code});return;}openDialog(s.name,d=>{const q=make('div','mh-detail-quote');q.append(make('strong',null,s.price),make('span',tone(s.change),pct(s.change)));d.append(make('p','mh-muted',s.code),q,sparkline(s.change,stocks.indexOf(s)+81,true));const metrics=make('div','mh-detail-metrics');for(const [label,value]of [['昨收',Number.isFinite(Number(s.price.replaceAll(',','')))?(Number(s.price.replaceAll(',',''))/(1+s.change/100)).toFixed(2):'—'],['涨跌幅',pct(s.change)],['关注方向',s.tag||'市场指数']]){const n=make('div');n.append(make('span',null,label),make('strong',null,value));metrics.append(n)}d.append(metrics,control('让 AI 分析 '+s.name,'mh-primary',()=>ask(`帮我分析${s.name}的近期走势、相关资讯和需要关注的变化。`),'spark'));d.lastChild.append(make('span',null,'让 AI 分析'));});}
  function replaceModule(selector, component) {
    const slot=root.querySelector(selector),active=document.activeElement;
    const activeLabel=slot.contains(active)&&active.getAttribute('role')==='tab'?active.textContent:null;
    slot.replaceChildren(component);
    if(activeLabel){const tab=[...component.querySelectorAll('[role="tab"]')].find(node=>node.textContent===activeLabel);tab?.focus({preventScroll:true});}
  }
  function renderIndices(){replaceModule('.hf-indices',HomeFinance.indices(markets[preference.market].indices,stockDetail));replaceModule('.hf-breadth',HomeFinance.breadth(markets[preference.market].breadth,preference.market));}
  function renderSummary(){replaceModule('.hf-analysis',HomeFinance.analysis(markets[preference.market].summaries,preference.market,ask));}
  function resolveStock(name,code,change,tag){return stocks.find(s=>s.name===name)||rankMarkets[preference.market].map(s=>Array.isArray(s)?{name:s[0],code:s[1],price:s[2],change:s[3],tag:preference.market}:s).find(s=>s.name===name)||{name,code:code||'—',price:'—',change,tag};}
  function renderHeat(){replaceModule('.hf-heat',HomeFinance.heatmap(preference.market,markets[preference.market].sectors,resolveStock,stockDetail));}
  function readNews(n){openDialog(n.title,d=>{d.append(make('p','mh-muted',n.time),make('p','mh-article-body',n.body));d.append(control('让 AI 解读这条资讯','mh-primary',()=>ask(`请解读“${n.title}”，并说明与我的自选股有什么关联。`),'spark'));d.lastChild.append(make('span',null,'让 AI 解读'))});}
  function renderNews(){const marketNews=preference.market==='A股'?news:markets[preference.market].summaries.map(([title,body,tag],i)=>({...news[i],title,body,tag,source:'市场资讯'}));const shown=preference.news==='自选相关'?news.filter(n=>n.related):preference.news==='快讯'?[marketNews[3],marketNews[0],marketNews[1]]:marketNews.slice(0,3);replaceModule('.hf-news',HomeFinance.news(shown,preference.news,label=>{preference.news=label;renderNews()},readNews));}
  function feedback(text){const slot=root.querySelector('.hf-watch-feedback');slot.textContent=text;slot.hidden=false;}
  function saveWatch(){AppWatchlist.replace(stocks.filter(s=>preference.watch.has(s.code)))}
  AppWatchlist.subscribe(()=>{const items=AppWatchlist.list();preference.watch=new Set(items.map(s=>s.code));for(const item of items){const row=stocks.find(s=>s.code===item.code);if(row)Object.assign(row,item);else stocks.push({...item,price:item.price||'--',change:item.change??null})}if(root?.isConnected)renderWatch()});
  function addWatch(s){if(!s.code||s.code==='—'){feedback('该资产未提供证券代码，可在管理自选中选择已收录证券');return;}if(preference.watch.has(s.code)){feedback(`${s.name}已在自选中`);return;}if(!stocks.some(item=>item.code===s.code))stocks.push({...s,badge:s.name.slice(0,1),color:'#46577d'});preference.watch.add(s.code);saveWatch();renderWatch();feedback(`已添加${s.name}`);}
  function renderWatch(){const component=root.querySelector('[data-component="watchlist-monitor"]');const shown=stocks.filter(s=>preference.watch.has(s.code)&&(preference.watchGroup==='全部'||s.tag===preference.watchGroup)&&(`${s.name} ${s.code}`.toLowerCase().includes(preference.watchQuery.trim().toLowerCase())));component.querySelector('[data-watchlist-items]').replaceChildren(HomeFinance.watchItems(shown,stockDetail));component.querySelector('h2').textContent=`我的自选 · ${preference.watch.size}`;}
  function manageWatch(){openDialog('管理自选',d=>{const field=make('input','mh-stock-search');field.placeholder='搜索名称或代码';field.setAttribute('aria-label','搜索自选股票');const list=make('div','mh-manage-list');function update(){list.replaceChildren();const matched=stocks.filter(s=>(s.name+s.code).toLowerCase().includes(field.value.trim().toLowerCase()));matched.forEach(s=>{const b=control(`${preference.watch.has(s.code)?'移除':'添加'}${s.name}`,'mh-manage-stock',()=>{preference.watch.has(s.code)?preference.watch.delete(s.code):preference.watch.add(s.code);saveWatch();renderWatch();update()});b.setAttribute('aria-pressed',String(preference.watch.has(s.code)));b.append(make('span',null,s.name),make('small',null,s.code),make('strong',null,preference.watch.has(s.code)?'✓':'＋'));list.append(b)});if(!matched.length)list.append(make('p','mh-empty','没有找到匹配的股票'))}field.oninput=update;d.append(field,list);update()});}
  function batchWatch(){openDialog('批量添加自选',d=>{const selected=new Set();const list=make('div','mh-manage-list');stocks.filter(s=>!preference.watch.has(s.code)).forEach(s=>{const label=make('label','hf-batch-row'),box=make('input');box.type='checkbox';box.onchange=()=>box.checked?selected.add(s.code):selected.delete(s.code);label.append(box,make('span',null,s.name),make('small',null,s.code));list.append(label)});const status=make('p','mh-muted');status.setAttribute('role','status');if(!list.children.length)status.textContent='已收录的证券均已加入自选';const submit=control('添加选中证券','mh-primary',()=>{if(!selected.size){status.textContent='请先选择需要添加的证券';return;}selected.forEach(code=>preference.watch.add(code));saveWatch();renderWatch();closeDialog();feedback(`已添加 ${selected.size} 只自选股`)});submit.textContent='添加选中证券';d.append(list,status,submit)});}
  function renderRanks(){const list=rankMarkets[preference.market].map(s=>Array.isArray(s)?{name:s[0],code:s[1],price:s[2],change:s[3],turnover:s[4],tag:preference.market}:s).sort((a,b)=>preference.rank==='跌幅榜'?a.change-b.change:preference.rank==='成交榜'?b.turnover-a.turnover:b.change-a.change);replaceModule('.hf-ranks',HomeFinance.ranking(list.slice(0,5),preference.rank,label=>{preference.rank=label;renderRanks()},stockDetail,addWatch,preference.market));}
  function renderSectors(){
    const card=make('section','market-component hf-sector-card');card.setAttribute('aria-label','板块表现');card.dataset.component='sector-performance';
    const head=make('header','widget-titlebar');head.append(make('h2',null,'板块表现'),make('span','hf-sector-market',preference.market));card.append(head);
    const list=make('div','hf-sector-list');
    const sectors=[...markets[preference.market].sectors].sort((a,b)=>b[1]-a[1]);
    sectors.forEach(([name,change,names],index)=>{
      const row=control(`分析${name}板块`,'hf-sector-row',()=>ask(`请分析${preference.market}的${name}板块表现，并整理${names.slice(0,3).join('、')}等相关公司的动态。`));
      const copy=make('span','hf-sector-copy');copy.append(make('strong',null,name),make('small',null,names.slice(0,2).join(' · ')));
      row.append(make('span','hf-sector-rank',String(index+1).padStart(2,'0')),copy,make('span',change<0?'text-fall-3':'text-rise-3',pct(change)));list.append(row);
    });card.append(list);replaceModule('.hf-sectors',card);
  }
  function refreshMarket(){renderIndices();renderSummary();renderHeat();renderNews();renderRanks();renderSectors();root.querySelector('.hf-dashboard').setAttribute('aria-labelledby',`home-market-${Object.keys(markets).indexOf(preference.market)}`);root.querySelector('.conversation-input').placeholder=`问问${preference.market}市场，或聊聊你的自选股`}
  function liveHome(mounted){
    if(!window.NativeBridge?.available)return;
    let busy=false;
    async function refresh(){
      if(busy||!mounted.isConnected)return;busy=true;
      await Promise.allSettled([AppWatchlist.refresh(),
        (async()=>{try{const data=await FuyaoData.query('index_snapshot',{thscodes:'000001.SH,399001.SZ,399006.SZ,000688.SH'});if(!mounted.isConnected)return;markets['A股'].indices.forEach((row,i)=>{const code=row[1]+(i===0||i===3?'.SH':'.SZ'),raw=data.item?.find(r=>r.thscode===code);if(raw?.last_price>0){row[2]=raw.last_price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});if(Number.isFinite(raw.price_change_ratio_pct))row[3]=raw.price_change_ratio_pct;if(Number.isFinite(raw.price_change))row[4]=(raw.price_change>0?'+':'')+raw.price_change.toFixed(2)}});if(preference.market==='A股')renderIndices()}catch{}})(),
        (async()=>{try{const data=await FuyaoData.query('stock_snapshot',{thscodes:stocks.filter(s=>s.code.length===6&&s.asset_type!=='fund-etf').map(s=>s.thscode||s.code+(s.code[0]==='6'?'.SH':'.SZ')).join(',')});if(!mounted.isConnected)return;for(const s of stocks){const raw=data.item?.find(r=>r.thscode?.split('.')[0]===s.code);if(raw?.last_price>0){s.price=raw.last_price.toFixed(2);if(Number.isFinite(raw.price_change_ratio_pct))s.change=raw.price_change_ratio_pct;const rank=rankMarkets['A股'].find(r=>r.code===s.code);if(rank){rank.price=s.price;rank.change=s.change;if(raw.turnover>0)rank.turnover=raw.turnover/1e8}}}renderWatch();renderRanks()}catch{}})()
      ]);busy=false;
    }
    refresh();const timer=setInterval(()=>{if(!mounted.isConnected)clearInterval(timer);else if(!document.hidden)refresh()},60000);
  }
  function mount(parent){closeDialog();root=make('section','market-home');root.setAttribute('aria-label','新对话市场首页');
    const hero=make('div','mh-hero'),welcome=make('div','mh-welcome'),logo=make('img','mh-welcome-logo');logo.src='assets/bd5dc.png';logo.alt='';logo.width=64;logo.height=58;
    const recommendations=HomeRecommendations.create({ask,openDialog,openWatchlist:()=>navigate('自选'),openMonitor:openLumi});welcome.append(logo,recommendations.headline);const composer=make('div','mh-composer');hero.append(welcome,recommendations.section,composer);root.append(hero);
    const head=make('header','mh-page-head'),intro=make('div','mh-page-intro');intro.append(make('h1',null,'市场概览'));
    const marketTabs=HomeFinance.tabs(Object.keys(markets),preference.market,label=>{preference.market=label;refreshMarket()},'市场切换');marketTabs.classList.add('mh-market-tabs');
    [...marketTabs.children].forEach((tab,index)=>{tab.id=`home-market-${index}`;tab.setAttribute('aria-controls','home-market-dashboard')});head.append(intro,marketTabs);root.append(head);
    const dashboard=make('div','mh-components hf-dashboard');dashboard.id='home-market-dashboard';dashboard.setAttribute('role','tabpanel');
    const main=make('div','hf-main-column'),aside=make('aside','hf-side-column');aside.setAttribute('aria-label','自选与板块');
    for(const cls of ['hf-indices','hf-analysis','hf-breadth','hf-news','hf-heat','hf-ranks'])main.append(make('div',`hf-module ${cls}`));
    for(const cls of ['hf-watch','hf-sectors','hf-focus'])aside.append(make('div',`hf-module ${cls}`));dashboard.append(main,aside);
    const watch=HomeFinance.watchlist({query:preference.watchQuery,group:preference.watchGroup,search:value=>{preference.watchQuery=value;renderWatch()},switchGroup:label=>{preference.watchGroup=label;renderWatch()},batch:batchWatch,manage:manageWatch});const feedbackSlot=make('div','hf-watch-feedback');feedbackSlot.setAttribute('role','status');feedbackSlot.hidden=true;watch.append(feedbackSlot);dashboard.querySelector('.hf-watch').append(watch);
    const focus=make('section','mh-section');focus.append(heading('自选动态',make('span','mh-live-label','3 条更新')));const focusCard=make('div','mh-card mh-focus-card');for(const [time,title,body]of [['14:52','算力方向活跃','科华数据、太辰光同步上涨'],['14:36','光通信成交放大','中际旭创涨幅居自选首位'],['13:48','公告更新','关注公司项目与订单进展']]){const b=control(`解读自选动态：${title}`,'mh-focus-item',()=>ask(`请解读自选动态“${title}：${body}”，整理与我关注公司的关联。`));b.append(make('time',null,time));const copy=make('span');copy.append(make('strong',null,title),make('small',null,body));b.append(copy);focusCard.append(b)}focusCard.append(control('汇总我的自选动态','mh-focus-ai',()=>ask('帮我汇总今天的自选股动态，合并相关资讯和公告，并整理需要关注的变化。'),'spark'));focusCard.lastChild.append(make('span',null,'让 AI 汇总自选动态'),make('span','mh-focus-arrow','↗'));focus.append(focusCard);dashboard.querySelector('.hf-focus').append(focus);
    root.append(dashboard);parent.append(root);bindComposer(composer,{home:true,showDisclaimer:false});refreshMarket();renderWatch();
    root.scrollTop=preference.scroll;root.onscroll=()=>preference.scroll=root.scrollTop;
    const mounted=root;const observer=new ResizeObserver(([entry])=>{mounted.classList.toggle('mh-narrow',entry.contentRect.width<980);mounted.classList.toggle('mh-small',entry.contentRect.width<660);mounted.querySelector('.chat-composer')?.refreshComposer?.();if(!mounted.isConnected)observer.disconnect()});observer.observe(root);
    liveHome(root);return root;
  }
  function addToWatchlist(items){const existing=AppWatchlist.list(),codes=new Set(existing.map(row=>row.code)),added=items.filter(item=>!codes.has(item.ticker||item.thscode?.split('.')[0])).map(item=>({...item,code:item.ticker||item.thscode.split('.')[0],tag:item.group||item.industry||'股票'}));if(added.length)AppWatchlist.replace([...existing,...added]);return added.length;}
  return {mount,addToWatchlist};
})();
