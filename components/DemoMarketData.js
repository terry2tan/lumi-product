/* Deterministic local market snapshots, directory and OHLC records. */
window.DemoMarketData=(()=>{
 const timestamp=Date.UTC(2026,9,9,7),extra=new Map();
 const seed=code=>[...code].reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,7);
 const round=(value,digits=2)=>Number(value.toFixed(digits));
 const normalize=row=>{const ticker=row.ticker||row.code||row.thscode.split('.')[0];return {...row,ticker,code:ticker,thscode:row.thscode||ticker+(ticker.length===5?'.HK':/^[56]/.test(ticker)?'.SH':'.SZ'),asset_type:row.asset_type||(/ETF/.test(row.name)?'fund-etf':ticker.length===5?'hk-stock':'a-share')}};
 const related=[['601899.SH','紫金矿业',29.42,-1.97],['600489.SH','中金黄金',20.95,-5.29],['600547.SH','山东黄金',26.16,-10.01],['00700.HK','腾讯控股',658.5,1.28]].map(([thscode,name,price,change])=>normalize({thscode,name,price,change}));
 function directory(){return [...new Map([...DemoFinance.catalog,...AppWatchlist.list(),...related,...extra.values()].map(row=>{const item=normalize(row);return [item.thscode,item]})).values()]}
 function remember(row){const item=normalize(row);extra.set(item.thscode,item);return item}
 function snapshot(row){
  const identity=normalize(row),known=extra.get(identity.thscode)||related.find(item=>item.thscode===identity.thscode),meta={...known,...identity},digits=meta.asset_type==='fund-etf'?3:2;
  if(!Number.isFinite(Number(meta.price))&&known?.price)meta.price=known.price;
  if(meta.asset_type==='fund-etf'){
   const price=1+(seed(meta.thscode)%2000)/1000,change=(seed(meta.thscode)%601-200)/100;
   const prev=round(price/(1+change/100),digits),volume=5000000+seed(meta.thscode)%30000000;
   return {...meta,last_price:price,prev_price:prev,price_change:round(price-prev,digits),price_change_ratio_pct:round((price-prev)/prev*100),open_price:round(prev*1.002,digits),high_price:round(Math.max(price,prev)*1.015,digits),low_price:round(Math.min(price,prev)*.986,digits),volume,turnover:round(volume*price),pe_ttm:null};
  }
  const price=Number(meta.price),quoteMeta=Number.isFinite(price)&&price>0?{...meta,price}:meta;
  return DemoFinance.quote(quoteMeta,known||{});
 }
 function find(code){return directory().find(row=>row.thscode===code)||normalize({thscode:code,name:code.split('.')[0]})}
 function history(row){
  const quote=snapshot(row),factor=row.asset_type==='fund-etf'?10:1;
  const records=DemoFinance.history(row,quote.last_price*factor).map(record=>({...record,...Object.fromEntries(['open_price','high_price','low_price','close_price'].map(field=>[field,round(record[field]/factor,row.asset_type==='fund-etf'?3:2)])),turnover:round(record.turnover/factor)}));
  const last=records.at(-1);if(last)Object.assign(last,{open_price:quote.open_price,high_price:quote.high_price,low_price:quote.low_price,close_price:quote.last_price,volume:quote.volume,turnover:quote.turnover});return records;
 }
 async function query(operation,parameters={}){
  const codes=String(parameters.thscodes||parameters.thscode||'').split(',').filter(Boolean);
  let item=[];
  if(operation==='ticker_list')item=directory();
  else if(operation==='ticker_search'){const q=String(parameters.q||'').trim().toLowerCase();item=directory().filter(row=>(row.name+' '+row.thscode).toLowerCase().includes(q)).slice(0,parameters.limit||12)}
  else if(operation==='stock_history'||operation==='fund_history')item=history(find(codes[0]));
  else if(['stock_snapshot','fund_snapshot','index_snapshot','stock_valuation'].includes(operation))item=codes.map(code=>snapshot(find(code)));
  else throw new Error('暂无对应内容。');
  return {item,timestamp};
 }
 return {snapshot,query,directory,remember};
})();
