window.StockMovements = (() => {
  const snapshotDate = '2026-10-12';
  const events = [
    {time:'09:36', title:'房地产板块回落，世联行、我爱我家跌幅居前', quotes:[['房地产',-1.67],['世联行',-8.26],['我爱我家',-7.34],['万科A',-5.91]]},
    {time:'09:35', title:'电网设备板块盘初冲高，金冠电气20cm涨停', quotes:[['电网设备',1.19],['金冠电气',20.00],['长城电工',9.99],['美硕科技',2.10]]},
    {time:'09:32', title:'粮食概念股盘初拉升，金健米业涨停', quotes:[['粮食概念',0.25],['金健米业',10.01],['新农开发',0.00],['秋乐种业',-0.35]]},
    {time:'09:31', title:'零售板块盘初冲高，东百集团、汇嘉时代领涨', quotes:[['零售',-0.33],['东百集团',10.04],['百大集团',3.30]]}
  ];
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function mount(host) {
    host.replaceChildren();
    host.classList.add('stock-movements');
    host.setAttribute('aria-label','大盘异动');
    const header=make('header','stock-movements-header');
    const title=make('span','stock-movements-title');
    const date=make('input','stock-movements-date');
    date.type='date';date.value=snapshotDate;date.setAttribute('aria-label','大盘异动日期');
    const updateDate=()=>{if(!date.value)date.value=snapshotDate;title.textContent=`大盘异动 (${date.value.replaceAll('-','/')})`;};
    date.onchange=updateDate;updateDate();header.append(title,date);
    const feed=make('div','stock-movements-feed');feed.tabIndex=0;feed.setAttribute('aria-label','大盘异动列表');
    for (const event of events) {
      const item=make('article','stock-movement');
      const head=make('div','stock-movement-head');
      const summary=make('span','stock-movement-summary',event.title);summary.title=event.title;
      head.append(make('time',null,event.time),summary);
      const quotes=make('div','stock-movement-quotes');
      for (const [name,change] of event.quotes) {
        const row=make('div','stock-movement-quote');
        const value=`${change>0?'+':''}${change.toFixed(2)}%`;
        row.append(make('span','stock-movement-name',name),make('span',change>0?'stock-up':change<0?'stock-down':'',value));
        quotes.append(row);
      }
      item.append(head,quotes);feed.append(item);
    }
    host.append(header,feed);
  }
  return {mount};
})();
