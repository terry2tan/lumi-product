/* Grouped related instruments reuse the conversation sidebar and watch stores. */
window.LumiRelatedPanel=(()=>{
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const sectors=[
    ['贵金属',['601899.SH','600489.SH','600547.SH','600988.SH','002155.SZ']],
    ['证券',['600621.SH','601555.SH','601162.SH','600030.SH','601688.SH','300059.SZ']],
    ['影视传媒',['605577.SH','601811.SH','300805.SZ','601595.SH','300133.SZ','603103.SH','601929.SH','834021.BJ']],
    ['消费电子',['002241.SZ','002475.SZ','300433.SZ']],
    ['算力与光通信',['002335.SZ','300570.SZ','300308.SZ']],
    ['新能源',['300750.SZ']],['高股息',['600036.SH','600900.SH']]
  ];
  const demoReasons={
    '601899.SH':'结合金价变化观察个股表现，继续对照成本、产量与公司公告。',
    '600489.SH':'与其他黄金标的对照走势，关注金价波动与业绩变化的关联。',
    '600547.SH':'结合金价、成本与产量，继续研究公司的经营变化。',
    '600988.SH':'纳入黄金方向的对照列表，关注行情异动与后续公司公告。',
    '002155.SZ':'与黄金方向的其他公司一起观察，继续跟踪相关资讯和公告。',
    '002335.SZ':'与算力方向的相关标的一起观察，对照订单、业绩及公司公告中的变化。',
    '300570.SZ':'与光通信方向的相关标的一起观察，关注行业资讯与个股行情变化。',
    '002241.SZ':'与消费电子方向的相关标的一起观察，继续跟踪新品、订单与公司公告。',
    '002475.SZ':'与消费电子方向的相关标的一起观察，对照订单进展及经营变化。'
  };
  const icons={columns:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',batch:'M5 3h14v18H5zM8 7h1m3 0h4M8 12h1m3 0h4M8 17h1m3 0h4',close:'m6 6 12 12M18 6 6 18'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]}"/></svg>`;
  function button(label,action,cls=''){const node=make('button','lumi-related-panel-action '+cls,label);node.type='button';node.onclick=action;return node}
  function groups(items){
    const grouped=new Map();
    for(const item of LumiRelatedTargets.normalize(items)){
      const name=String(item.group||item.industry||item.sector||sectors.find(([,codes])=>codes.includes(item.thscode))?.[0]||'相关标的');
      if(!grouped.has(name))grouped.set(name,[]);grouped.get(name).push(item);
    }
    return [...grouped].map(([name,items])=>({name,items}));
  }
  function reason(item,message){
    const supplied=item.description||item.reason||item.relevance;if(typeof supplied==='string'&&supplied.trim())return supplied.trim();
    if(!FuyaoData.available()&&demoReasons[item.thscode])return demoReasons[item.thscode];
    return String(message.text||'').split(/(?<=[。！？\n])/).map(text=>text.trim()).find(text=>text.includes(item.name)||text.includes(item.ticker))||'';
  }
  function selection(items,saved=[]){
    const codes=new Set(items.map(item=>item.thscode)),chosen=new Set(saved.filter(code=>codes.has(code)));
    return {chosen,set(rows,value){for(const item of rows)if(value)chosen.add(item.thscode);else chosen.delete(item.thscode)},status(rows){const count=rows.filter(item=>chosen.has(item.thscode)).length;return{checked:rows.length>0&&count===rows.length,indeterminate:count>0&&count<rows.length}},items:()=>items.filter(item=>chosen.has(item.thscode))};
  }
  function addToWatchlist(items){
    const targets=LumiRelatedTargets.normalize(items);if(!targets.length)return 0;
    if(window.AppWatchlist){
      const existing=AppWatchlist.list(),codes=new Set(existing.map(item=>item.thscode)),added=targets.filter(item=>!codes.has(item.thscode));
      if(added.length)AppWatchlist.replace([...existing,...added.map(item=>({code:item.ticker,ticker:item.ticker,thscode:item.thscode,name:item.name,tag:item.group||item.industry||'股票',asset_type:'a-share'}))]);
      return added.length;
    }
    return MarketHome.addToWatchlist(targets);
  }
  function render(file){
    const root=make('section','workspace-document-preview lumi-related-preview lumi-related-panel');root.dataset.documentId=file.id;root.setAttribute('aria-label','全部相关标的');
    const thread=ChatStore.get(file.ownerId),message=thread?.messages.find(item=>item.id===file.messageId)||file;
    const grouped=groups(message.relatedTargets),items=grouped.flatMap(group=>group.items),selected=selection(items,file.relatedSelected||[]),checks=[],quoteRows=[];
    const toolbar=make('header','lumi-related-panel-toolbar'),label=make('div','lumi-related-panel-title');label.innerHTML=icon('columns');label.append(make('span',null,'多股同列'));
    const batch=button('批量操作',()=>{file.relatedBatch=!file.relatedBatch;draw();batch.focus({preventScroll:true})});batch.innerHTML=icon('batch');batch.append(make('span',null,'批量操作'));batch.setAttribute('aria-pressed',String(!!file.relatedBatch));toolbar.append(label,batch);root.append(toolbar);
    const content=make('div','lumi-related-panel-content'),status=make('p','lumi-related-panel-status');status.setAttribute('role','status');status.textContent=file.relatedStatus||'';status.hidden=!status.textContent;root.append(status,content);
    function save(){file.relatedSelected=[...selected.chosen]}
    function syncSelection(){
      save();const count=content.querySelector('[data-selection-count]');if(count)count.textContent=`已选 ${selected.chosen.size} 个`;
      for(const {box,rows}of checks){const state=selected.status(rows);box.checked=state.checked;box.indeterminate=state.indeterminate;}
      const add=content.querySelector('[data-add-watch]');if(add)add.disabled=!selected.chosen.size;
    }
    function checkbox(rows,label){const box=make('input','lumi-related-panel-check');box.type='checkbox';box.setAttribute('aria-label',label);box.onchange=()=>{selected.set(rows,box.checked);syncSelection()};checks.push({box,rows});return box}
    function paint(){for(const {item,price,change,value}of quoteRows){price.textContent=FuyaoData.number(item.last_price);change.textContent=FuyaoData.percent(item.price_change_ratio_pct);value.textContent=FuyaoData.amount(item.circulating_market_value);const tone=item.price_change_ratio_pct>0?'is-up':item.price_change_ratio_pct<0?'is-down':'is-flat';price.className=change.className='lumi-related-change '+tone}}
    function draw(){
      const previousScroll=root.scrollTop;content.replaceChildren();checks.length=quoteRows.length=0;batch.setAttribute('aria-pressed',String(!!file.relatedBatch));
      if(file.relatedBatch){
        const bar=make('div','lumi-related-panel-batch'),count=make('span');count.dataset.selectionCount='';
        const all=button('全选',()=>{selected.set(items,true);syncSelection()},'is-link'),clear=button('清空',()=>{selected.set(items,false);syncSelection()});
        const add=button('加自选',()=>{const added=addToWatchlist(selected.items());file.relatedStatus=added?`已添加 ${added} 个标的到自选`:'所选标的已在自选中';status.textContent=file.relatedStatus;status.hidden=false},'is-add');add.dataset.addWatch='';
        const close=button('',()=>{file.relatedBatch=false;draw();batch.focus({preventScroll:true})},'is-icon');close.innerHTML=icon('close');close.setAttribute('aria-label','退出批量操作');bar.append(count,all,clear,add,close);content.append(bar);
      }
      if(grouped.length>1){const chips=make('nav','lumi-related-panel-groups');chips.setAttribute('aria-label','相关标的分类');grouped.forEach((group,index)=>{const chip=button(group.name,()=>content.querySelector(`[data-group-index="${index}"]`).scrollIntoView({block:'start',behavior:'smooth'}),'is-group');chip.append(make('span',null,String(group.items.length)));chips.append(chip)});content.append(chips)}
      for(const [index,group]of grouped.entries()){
        const card=make('section','lumi-related-panel-card');card.dataset.groupIndex=index;card.setAttribute('aria-label',group.name+'相关标的');
        const head=make('header','lumi-related-panel-group-head');if(file.relatedBatch)head.append(checkbox(group.items,'选择全部'+group.name+'标的'));head.append(make('h3',null,group.name));card.append(head);
        const scroll=make('div','lumi-related-panel-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',group.name+'标的列表，可横向滚动');
        scroll.onscroll=()=>{file.relatedGroupScroll||={};file.relatedGroupScroll[group.name]=scroll.scrollLeft};
        const table=make('table','lumi-related-panel-table'+(file.relatedBatch?' is-batch':'')),thead=make('thead'),titles=make('tr');
        if(file.relatedBatch){const cell=make('th');cell.setAttribute('aria-label','选择标的');titles.append(cell)}
        for(const title of ['股票名称','最新','涨幅','流通市值']){const cell=make('th',null,title);cell.scope='col';titles.append(cell)}thead.append(titles);table.append(thead);
        const body=make('tbody');
        for(const item of group.items){
          const row=make('tr','lumi-related-panel-stock');row.dataset.code=item.thscode;
          if(file.relatedBatch){const cell=make('td');cell.append(checkbox([item],'选择'+item.name+' '+item.ticker));row.append(cell)}
          const name=make('td'),link=button('',()=>LumiRelatedTargets.openStock(item),'lumi-related-name');link.setAttribute('aria-label',`查看${item.name} ${item.ticker}行情`);link.append(make('span',null,item.name),make('span','lumi-related-code',item.ticker));name.append(link);
          const price=make('td'),change=make('td'),value=make('td','lumi-related-panel-value');row.append(name,price,change,value);body.append(row);quoteRows.push({item,price,change,value});
          const description=reason(item,message);if(description){const descriptionRow=make('tr','lumi-related-panel-description');if(file.relatedBatch)descriptionRow.append(make('td'));const cell=make('td',null,description);cell.colSpan=4;descriptionRow.append(cell);body.append(descriptionRow)}else row.classList.add('without-description');
        }
        table.append(body);scroll.append(table);card.append(scroll);content.append(card);
        requestAnimationFrame(()=>{if(scroll.isConnected)scroll.scrollLeft=file.relatedGroupScroll?.[group.name]||0});
      }
      if(!items.length)content.append(make('p','lumi-related-panel-empty','暂无相关标的'));syncSelection();paint();root.scrollTop=previousScroll;
    }
    draw();LumiRelatedTargets.quotes(items).then(()=>{if(root.isConnected)paint()});return root;
  }
  return{groups,reason,selection,addToWatchlist,render};
})();
