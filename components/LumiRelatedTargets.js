/* Related instruments share the conversation renderer and existing stock page. */
window.LumiRelatedTargets=(()=>{
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const stockCode=/^(?:[036]\d{5}\.(?:SH|SZ)|[489]\d{5}\.BJ)$/;
  const catalog=[
    ...DemoFinance.catalog.filter(item=>stockCode.test(item.thscode)&&!['000001.SH','000680.SH','000688.SH','399001.SZ','399006.SZ'].includes(item.thscode)),
    ...[
      ['601899.SH','紫金矿业',29.42,-1.97,4892000000],['600489.SH','中金黄金',20.95,-5.29,1478000000],['600547.SH','山东黄金',26.16,-10.01,3778000000],
      ['600988.SH','赤峰黄金'],['002155.SZ','湖南黄金'],['600621.SH','华鑫股份'],['601555.SH','东吴证券'],['601162.SH','天风证券'],
      ['600030.SH','中信证券'],['601688.SH','华泰证券'],['300059.SZ','东方财富'],['605577.SH','龙版传媒'],['601811.SH','新华文轩'],['300805.SZ','电声股份'],
      ['601595.SH','上海电影'],['300133.SZ','华策影视'],['603103.SH','横店影视'],['601929.SH','吉视传媒'],['834021.BJ','流金科技'],
      ['002241.SZ','歌尔股份'],['002475.SZ','立讯精密'],['300433.SZ','蓝思科技']
    ].map(([thscode,name,price,change,turnover])=>({thscode,name,price,change,turnover}))
  ];
  const cache=new Map(),requests=new Map();
  function normalize(items){
    if(!Array.isArray(items))return[];
    const unique=new Map();
    for(const item of items){
      if(!item||typeof item!=='object')continue;
      const code=String(item.thscode||item.code||'').toUpperCase();
      if(!stockCode.test(code)||['000001.SH','000680.SH','000688.SH','399001.SZ','399006.SZ'].includes(code))continue;
      const base=catalog.find(row=>row.thscode===code),name=String(item.name||base?.name||code.split('.')[0]);
      unique.set(code,{...base,...unique.get(code),...item,thscode:code,ticker:code.split('.')[0],name});
      if(unique.size>=160)break;
    }
    return [...unique.values()];
  }
  function mentioned(item,text){
    if(item.name&&item.name!==item.ticker&&text.includes(item.name))return true;
    if(item.thscode==='600621.SH'&&text.includes('华鑫证券'))return true;
    return new RegExp(`(^|[^0-9])${item.thscode.split('.')[0]}(?:\\.(?:SH|SZ|BJ))?(?=$|[^0-9])`,'i').test(text);
  }
  function resolve(text,candidates=[]){
    const supplied=Array.isArray(candidates)?candidates:[];
    return normalize([...supplied,...catalog.filter(row=>!supplied.some(item=>(item?.thscode||item?.code)===row.thscode))].filter(item=>{
      const code=item?.thscode||item?.code;return typeof code==='string'&&stockCode.test(code)&&mentioned({...item,thscode:code},text);
    }));
  }
  function prepare(answer,{live=false}={}){
    const targets=normalize(answer.relatedTargets||resolve(answer.text||'',answer.targetCandidates||[]));
    if(!live)for(const item of targets){const quote=DemoFinance.quote(item,item);Object.assign(item,quote);if(Number.isFinite(item.price))item.last_price=item.price;if(Number.isFinite(item.change))item.price_change_ratio_pct=item.change;DemoMarketData.remember(item);}
    if(targets.length)answer.relatedTargets=targets;else delete answer.relatedTargets;
    delete answer.targetCandidates;return answer;
  }
  async function enrich(answer){
    if(!FuyaoData.available())return false;
    const directory=await FuyaoData.metadata();
    const found=resolve(answer.text||'',directory),existing=normalize(answer.relatedTargets),added=found.filter(item=>!existing.some(row=>row.thscode===item.thscode));
    if(!added.length)return false;
    answer.relatedTargets=normalize([...existing,...added]);return true;
  }
  const gold=()=>catalog.filter(item=>['601899.SH','600489.SH','600547.SH','600988.SH','002155.SZ'].includes(item.thscode));
  function text(items){return ['相关标的\n名称\t代码\t最新\t涨幅\t成交额',...normalize(items).map(item=>[item.name,item.ticker,FuyaoData.number(item.last_price),FuyaoData.percent(item.price_change_ratio_pct),FuyaoData.amount(item.turnover)].join('\t'))].join('\n');}
  function openStock(item){FuyaoData.openStock({...item,price:item.last_price,change:item.price_change_ratio_pct});}
  async function quotes(items){
    if(!FuyaoData.available())return;
    const missing=items.filter(item=>!cache.has(item.thscode)||Date.now()-cache.get(item.thscode).at>60000);
    if(missing.length){
      const key=missing.map(item=>item.thscode).sort().join(',');
      if(!requests.has(key))requests.set(key,FuyaoData.query('stock_snapshot',{thscodes:key}).then(data=>{
        for(const item of data.item||[])if(stockCode.test(item.thscode))cache.set(item.thscode,{at:Date.now(),item});
      }).catch(()=>{}).finally(()=>requests.delete(key)));
      await requests.get(key);
    }
    for(const item of items){const quote=cache.get(item.thscode)?.item;if(quote)for(const field of ['last_price','price_change_ratio_pct','turnover','circulating_market_value'])if(Number.isFinite(quote[field]))item[field]=quote[field];}
  }
  function render(message,thread,{full=false,scrollState=message}={}){
    const items=normalize(message.relatedTargets);if(!items.length)return null;message.relatedTargets=items;
    const root=make('section','lumi-related-targets'+(full?' is-full-list':''));root.setAttribute('aria-label','相关标的');root.dataset.nodeId='160:36059';
    const header=make('header','lumi-related-header'),title=make('div','lumi-related-title'),glyph=make('img');glyph.src='assets/related-targets/related.svg';glyph.alt='';glyph.width=glyph.height=16;
    title.append(glyph,make('span',null,'相关标的'));header.append(title);
    if(!full){
      const more=make('button','lumi-related-more');more.type='button';more.setAttribute('aria-label','查看更多相关标的');more.setAttribute('aria-controls','home-right-sidebar');
      const arrow=make('img');arrow.src='assets/related-targets/arrow.svg';arrow.alt='';more.append(make('span',null,'查看更多'),arrow);
      more.onclick=()=>HomeLayout.openRelatedTargets(thread,message);header.append(more);
    }
    root.append(header);
    const scroll=make('div','lumi-related-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',full?'全部相关标的行情':'相关标的行情，可横向滚动');
    scroll.onscroll=()=>{scrollState.relatedScrollLeft=scroll.scrollLeft;scrollState.relatedScrollTop=scroll.scrollTop;};
    requestAnimationFrame(()=>{if(root.isConnected){scroll.scrollLeft=scrollState.relatedScrollLeft||0;scroll.scrollTop=scrollState.relatedScrollTop||0;}});
    const table=make('table','lumi-related-table'),head=make('thead'),headRow=make('tr');
    for(const label of ['股票名称','最新','涨幅','成交额']){const cell=make('th',null,label);cell.scope='col';headRow.append(cell);}head.append(headRow);table.append(head);
    const body=make('tbody');
    for(const item of full?items:items.slice(0,3)){
      const row=make('tr');row.dataset.code=item.thscode;
      const name=make('td'),link=make('button','lumi-related-name');link.type='button';link.setAttribute('aria-label',`查看${item.name} ${item.ticker}行情`);
      link.append(make('span',null,item.name),make('span','lumi-related-code',item.ticker));link.onclick=()=>openStock(item);name.append(link);row.append(name);
      for(let i=0;i<3;i++)row.append(make('td',i===2?'lumi-related-turnover':'lumi-related-change'));
      body.append(row);
    }
    table.append(body);scroll.append(table);root.append(scroll);
    function paint(){
      for(const row of body.children){const item=items.find(item=>item.thscode===row.dataset.code),direction=item.price_change_ratio_pct>0?'is-up':item.price_change_ratio_pct<0?'is-down':'is-flat';
        [FuyaoData.number(item.last_price),FuyaoData.percent(item.price_change_ratio_pct),FuyaoData.amount(item.turnover)].forEach((value,index)=>{const cell=row.children[index+1];cell.textContent=value;if(index<2)cell.className='lumi-related-change '+direction;});
      }
    }
    paint();quotes(items).then(()=>{if(root.isConnected)paint();});return root;
  }
  function preview(file){
    return LumiRelatedPanel.render(file);
  }
  return{normalize,resolve,prepare,enrich,gold,text,render,preview,quotes,openStock};
})();
