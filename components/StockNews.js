/* One-time news and announcement excerpts. URLs are retained as authoring records. */
window.StockNews=(()=>{
 const report='https://static.cninfo.com.cn/finalpage/2026-08-14/1225471335.PDF';
 const datasets={
  '301003.SZ':[
   {tag:'公司动态',date:'2026-09-11',title:'江苏博云：股权转让按进展披露',body:'公司在投资者互动中表示，相关股权转让仍在推进，将按进展披露后续公告。',url:'https://vip.stock.finance.sina.com.cn/corp/view/vCB_AllNewsStock.php?symbol=sz301003'},
   {tag:'股东变化',date:'2026-09-11',title:'江苏博云：9月10日股东户数为8017户',body:'公司披露，截至9月10日，合并融资融券账户后的股东户数为8017户。',url:'https://data.eastmoney.com/stockcalendar/301003.html'},
   {tag:'半年报',date:'2026-08-14',title:'江苏博云上半年营收3.25亿元，增长13.61%',body:'2026年上半年，公司营业收入约3.25亿元，同比增长13.61%；归母净利润约5606.51万元，同比增长0.29%。',url:report},
   {tag:'分红',date:'2026-08-14',title:'江苏博云半年度利润分配预案：每10股派3元',body:'公司公布半年度利润分配预案，拟向全体股东每10股派发现金红利3元，含税。',url:report},
   {tag:'行业',date:'2026-08-14',title:'改性塑料需求向高端功能材料延伸',body:'半年度报告介绍了高端装备、算力基础设施等应用对功能性材料的需求。公司主营改性塑料的研发、生产和销售。',url:report}
  ],
  '301638.SZ':[
   {tag:'业绩说明',date:'2026-09-08',title:'南网数字：上半年末在手订单67.90亿元',body:'在半年度业绩说明会上，公司介绍上半年末在手订单为67.90亿元。定制化软件与技术服务通常具有6至18个月的实施周期。',url:'https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12591186&stockid=301638'},
   {tag:'半年报',date:'2026-08-28',title:'南网数字上半年营收22.18亿元，增长42.37%',body:'公司2026年上半年营收约22.18亿元，同比增长42.37%；归母净利润约2.02亿元，同比增长1453.65%。',url:'https://finance.eastmoney.com/a/202608283857849376.html'},
   {tag:'分红',date:'2026-08-28',title:'南网数字拟每10股派现0.3元',body:'公司披露2026年半年度利润分配预案，拟向全体股东每10股派发现金红利0.3元，含税。',url:'https://finance.eastmoney.com/a/202608283857849376.html'},
   {tag:'项目进展',date:'2026-07-22',title:'南网数字加快项目实施与交付',body:'公司在业绩预告中解释，客户投资进度加快带动公司推进项目实施和交付，上年同期较低的利润基数也影响同比增幅。',url:'https://static.cninfo.com.cn/finalpage/2026-07-22/1225437248.PDF'}
  ],
  '002638.SZ':[
   {tag:'公司公告',date:'2026-09-09',title:'勤上股份子公司拟向参股公司增资不超2000万元',body:'公司披露拟通过子公司向广东勤上进行同比例现金增资，金额不超过2000万元。',url:'https://vip.stock.finance.sina.com.cn/corp/go.php/vCB_AllNewsStock/symbol/sz002638.phtml'},
   {tag:'股份变动',date:'2026-09-02',title:'勤上股份累计减持回购股份700万股',body:'截至8月末，公司累计减持回购股份700万股，成交总额约2525万元。',url:'https://vip.stock.finance.sina.com.cn/corp/go.php/vCB_AllNewsStock/symbol/sz002638.phtml'},
   {tag:'半年报',date:'2026-08-28',title:'勤上股份上半年营收1.83亿元',body:'2026年上半年营业收入约1.83亿元，同比下降30.67%；归母净利润为负4031.79万元。',url:'https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12561510&stockid=002638'},
   {tag:'经营观察',date:'2026-07-11',title:'勤上股份关注订单、施工进度与汇率变化',body:'公司业绩预告提到，订单量下降、工程施工进度放缓，以及汇兑损失和资产减值影响了报告期业绩。',url:'https://vip.stock.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12440079&stockid=002638'}
  ],
  '002335.SZ':[
   {tag:'半年报',date:'2026-08-28',title:'科华数据发布2026年半年度报告',body:'公司披露2026年半年度报告及摘要，介绍报告期业务经营、财务状况和主要事项。',url:'https://static.cninfo.com.cn/finalpage/2026-08-28/1225522569.PDF'},
   {tag:'经营事项',date:'2026-07-14',title:'科华数据披露半年度业绩预告',body:'公司业绩预告提到出售控股子公司部分股权产生的收益对报告期经营业绩有正向贡献，该部分属于非经常性损益。',url:'https://disc.static.szse.cn/download/disc/disk03/finalpage/2026-07-14/b79fb431-0859-478c-88c5-2dc3a94cf477.PDF'}
  ]
 };
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 function open(item){
  document.querySelector('.stock-article-dialog')?.remove();const dialog=node('dialog','mh-dialog stock-article-dialog'),head=node('header','mh-dialog-head'),close=node('button','mh-icon','×');
  close.type='button';close.setAttribute('aria-label','关闭资讯详情');close.onclick=()=>dialog.close();head.append(node('h2',null,item.title),close);dialog.append(head,node('p','mh-muted',item.date),node('p','mh-article-body',item.body));
  dialog.addEventListener('close',()=>dialog.remove());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});document.body.append(dialog);dialog.showModal();
 }
 function mount(body){
  const list=body.querySelector('.stock-news-list'),tabs=body.querySelector('[aria-label="个股资讯分类"]');let current={thscode:'301003.SZ',name:'江苏博云'},category=tabs.querySelector('[aria-pressed="true"]')?.textContent.replace('[汽车零部件]','')||'个股新闻';
  for(const b of tabs.querySelectorAll('button')){b.textContent=b.textContent.replace('[汽车零部件]','');b.addEventListener('click',()=>{category=b.textContent;for(const tab of tabs.querySelectorAll('button')){tab.classList.toggle('selected',tab===b);tab.setAttribute('aria-pressed',String(tab===b))}render()})}
  function render(){
   const base=datasets[current.thscode]||[{tag:'经营观察',date:'2026-10-09',title:current.name+'：关注业绩与业务进展',body:'结合收入、利润、现金流及公司公告，观察经营变化和项目推进情况。'}];
   let shown=base;
   if(category==='个股公告')shown=base.filter(r=>['公司公告','半年报','分红','股份变动','业绩说明'].includes(r.tag));
   else if(category==='个股研报')shown=base.filter(r=>['半年报','经营观察','项目进展','行业'].includes(r.tag));
   else if(category==='个股扫雷')shown=[{tag:'经营风险',date:'2026-10-09',title:current.name+'：关注现金流与应收账款变化',body:'观察经营现金流与收入变化是否一致，结合应收账款、存货及费用变化理解利润质量。'},{tag:'事项跟踪',date:'2026-10-09',title:'持续观察项目交付、股东变动与行业竞争',body:'跟踪项目交付节奏和重要股东变化，并结合行业竞争与原材料价格变化观察经营影响。'}];
   else if(category==='行业资讯')shown=base.filter(r=>['行业','项目进展','经营观察'].includes(r.tag));
   else if(category==='社区')shown=[{tag:'讨论',date:'2026-10-09',title:'近期走势与成交量有哪些变化？',body:'可以结合日线、周线和成交量观察走势，整理下一步需要关注的公司事项。'},{tag:'讨论',date:'2026-10-09',title:'一起梳理半年度经营情况',body:'从收入、毛利、费用和现金流几个方面比较经营变化。'}];
   else if(category==='关联报价'||category==='报价的')shown=[{tag:'关联观察',date:'2026-10-09',title:current.name+'与板块表现对照',body:'将个股与所属板块的价格、涨跌幅和成交额一起观察，查看走势与成交变化。'}];
   if(!shown.length)shown=base.slice(-2);
   list.replaceChildren();for(const item of shown){const row=node('button','stock-news-row');row.type='button';row.title=item.title;row.append(node('span','stock-news-tag','【'+item.tag+'】'),node('span','stock-news-title',item.title),node('time',null,item.date.slice(5)));row.onclick=()=>open(item);list.append(row)}
  }
  render();body.setStockNews=stock=>{current=stock;render()};return render;
 }
 return {mount,datasets};
})();
