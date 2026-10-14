/* Compact, grouped watch targets shared by the browser and native profile. */
window.LumiWatchlist=(()=>{
  const maxVisibleRows=8,rowHeight=40,groupHeight=30;
  const groups=['股票','板块','期权','ETF'];
  const targets=[
    ...DemoFinance.catalog.filter(item=>['002335.SZ','300570.SZ','688333.SH','300308.SZ','300750.SZ','600036.SH','600900.SH','301003.SZ'].includes(item.thscode)).map(item=>({name:item.name,code:item.thscode,displayCode:item.ticker,category:'股票',special:item.thscode==='002335.SZ'})),
    ...[
      ['计算机','801750'],['电子','801080'],['银行','801780'],['电力设备','801730']
    ].map(([name,code])=>target(name,code,'板块')),
    ...[
      ['50ETF购10月3100','510050C2610M03100'],['50ETF沽10月3100','510050P2610M03100'],
      ['300ETF购10月4700','510300C2610M04700'],['300ETF沽10月4700','510300P2610M04700']
    ].map(([name,code])=>target(name,code,'期权')),
    ...[
      ['沪深300ETF','510300'],['创业板ETF','159915'],['科创50ETF','588000'],['黄金ETF','518880']
    ].map(([name,code])=>({...target(name,code,'ETF'),special:code==='510300'}))
  ];
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const paths={more:'M4 12h.01M12 12h.01M20 12h.01',star:'m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3.2 9.6l6.3-.9Z',research:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0M7 12l3-3 3 2',remove:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
  let root,viewport,table,menu,anchor;
  function target(name,code,category){return{name,code,displayCode:code,category,special:false}}
  function sections(){return[['特别关注',targets.filter(item=>item.special)],...groups.map(category=>[category,targets.filter(item=>item.category===category&&!item.special)])].filter(([,items])=>items.length)}
  function closeMenu(restoreFocus=false){
    const previous=anchor;menu?.remove();menu=null;anchor=null;
    previous?.setAttribute('aria-expanded','false');previous?.closest('tr')?.classList.remove('is-menu-open');
    if(restoreFocus&&previous?.isConnected)previous.focus({preventScroll:true});
  }
  function focusTarget(code){const control=[...table.querySelectorAll('.lumi-watch-more')].find(button=>button.dataset.code===code);(control||viewport).focus({preventScroll:true})}
  function research(item){
    const visibleInput=()=>[...document.querySelectorAll('.conversation-view[data-thread-id="lumi"] .conversation-input')].find(input=>input.getClientRects().length);
    closeMenu();let input=visibleInput();
    if(!input){openLumi();input=visibleInput()}
    if(!input)return;
    const prompt=`请深入研究${item.name}（${item.displayCode}），结合最新行情、相关资讯和关键风险进行分析。`;
    input.value=[input.value.trim(),prompt].filter(Boolean).join('\n');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});
  }
  function positionMenu(){
    if(!menu||!anchor?.isConnected)return closeMenu();
    const rect=anchor.getBoundingClientRect(),bounds=viewport.getBoundingClientRect();
    if(rect.bottom<bounds.top||rect.top>bounds.bottom)return closeMenu();
    const size=menu.getBoundingClientRect();
    menu.style.left=Math.max(8,Math.min(rect.right-size.width,innerWidth-size.width-8))+'px';
    menu.style.top=Math.max(8,Math.min(rect.bottom+6+size.height>innerHeight-8?rect.top-size.height-6:rect.bottom+6,innerHeight-size.height-8))+'px';
  }
  function openMenu(item,button){
    if(anchor===button){closeMenu(true);return}
    closeMenu();anchor=button;button.setAttribute('aria-expanded','true');button.closest('tr').classList.add('is-menu-open');
    menu=make('div','lumi-watch-menu');menu.id='lumi-watch-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label',`${item.name}盯盘操作`);
    const actions=[
      [item.special?'取消特别关注':'特别关注','star',()=>{closeMenu();item.special=!item.special;draw();viewport.scrollTop=0;focusTarget(item.code)}],
      ['深入研究','research',()=>research(item)],
      ['从盯盘移除','remove',()=>{const next=button.closest('tr').nextElementSibling?.dataset.code;closeMenu();targets.splice(targets.indexOf(item),1);draw();focusTarget(next)}]
    ];
    for(const [label,glyph,action]of actions){const control=make('button','lumi-watch-menu-item'+(glyph==='remove'?' is-remove':''));control.type='button';control.setAttribute('role','menuitem');control.innerHTML=icon(glyph);control.append(make('span',null,label));control.onclick=action;menu.append(control)}
    menu.onkeydown=event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMenu(true);return}
      const buttons=[...menu.children],index=buttons.indexOf(document.activeElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length].focus()}
      if(event.key==='Tab')closeMenu(true);
    };
    document.body.append(menu);positionMenu();menu.firstElementChild.focus({preventScroll:true});
  }
  function draw(){
    const scrollTop=viewport.scrollTop;table.replaceChildren();
    const columns=make('colgroup');for(const index of [0,1,2])columns.append(make('col',`lumi-watch-col-${index}`));table.append(columns);
    let visible=0,height=0;
    for(const [category,items]of sections()){
      const body=make('tbody'),categoryRow=make('tr','lumi-watch-category'),title=make('th',null,category);title.scope='rowgroup';title.colSpan=3;categoryRow.append(title);body.append(categoryRow);
      if(visible<maxVisibleRows)height+=groupHeight;
      for(const item of items){
        const row=make('tr','lumi-watch-row');row.dataset.code=item.code;
        const values=[item.name,item.displayCode];
        for(const [index,value]of values.entries()){const cell=make('td',`lumi-watch-col-${index}`,value);cell.title=value;row.append(cell)}
        const actions=make('td','lumi-watch-col-2'),more=make('button','lumi-watch-more');more.type='button';more.dataset.code=item.code;more.innerHTML=icon('more');more.setAttribute('aria-label',`${item.name}更多盯盘操作`);more.title='更多';more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','lumi-watch-menu');more.onclick=()=>openMenu(item,more);
        more.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();event.stopPropagation();openMenu(item,more);if(event.key==='ArrowUp')menu?.lastElementChild.focus()}};
        actions.append(more);row.append(actions);body.append(row);if(visible<maxVisibleRows){visible++;height+=rowHeight}
      }
      table.append(body);
    }
    if(!targets.length){const body=make('tbody'),row=make('tr'),cell=make('td','lumi-watch-empty','暂无盯盘标的');cell.colSpan=3;row.append(cell);body.append(row);table.append(body);height+=rowHeight}
    viewport.style.maxHeight=height+'px';viewport.scrollTop=scrollTop;
  }
  function render(){
    if(root)return root;
    root=make('div','lumi-watchlist lumi-profile-settings-group');viewport=make('div','lumi-watch-viewport');viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','盯盘标的列表');viewport.dataset.maxVisibleRows=maxVisibleRows;
    table=make('table','lumi-watch-table');table.setAttribute('aria-label','分类盯盘标的');viewport.append(table);root.append(viewport);draw();
    viewport.addEventListener('scroll',()=>closeMenu());
    document.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target)&&!anchor?.contains(event.target))closeMenu()},true);
    document.addEventListener('focusin',event=>{if(menu&&!menu.contains(event.target)&&!anchor?.contains(event.target))closeMenu()});
    addEventListener('resize',positionMenu);document.addEventListener('scroll',event=>{if(menu&&event.target!==menu)closeMenu()},true);
    new MutationObserver(()=>{if(!root.isConnected||!root.getClientRects().length)closeMenu()}).observe(document.getElementById('stage'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    return root;
  }
  return{render,maxVisibleRows};
})();
