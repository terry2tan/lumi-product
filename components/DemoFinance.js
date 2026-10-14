/* Stable local values fill gaps in the prototype's financial responses. */
window.DemoFinance=(()=>{
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 const round=n=>Math.round(n*100)/100;
 const seed=code=>[...code].reduce((n,c)=>n*31+c.charCodeAt(0),7)>>>0;
 const catalog=[
  ['301003.SZ','江苏博云',56.78,1.26],['301638.SZ','南网数字',20.90,2.14],['002638.SZ','勤上股份',3.68,-.54],
  ['002335.SZ','科华数据',42.86,3.18],['300570.SZ','太辰光',58.64,4.72],['688333.SH','铂力特',78.26,2.18],
  ['300308.SZ','中际旭创',168.42,5.26],['300750.SZ','宁德时代',286.50,1.86],['600036.SH','招商银行',42.38,-.86],['600900.SH','长江电力',28.64,-.42],
  ['000001.SH','上证指数',3892.36,1.28],['399001.SZ','深证成指',12836.42,1.86],['399006.SZ','创业板指',2986.75,2.34],['000680.SH','科创综指',1726.70,.92],['000688.SH','科创50',1328.19,-.62]
 ].map(([thscode,name,price,change])=>({thscode,ticker:thscode.split('.')[0],name,price,change}));
 function quote(meta,raw={},history=[]){
  const base=catalog.find(r=>r.thscode===meta.thscode)||(valid(meta.price)&&meta.price>0?{price:meta.price,change:valid(meta.change)?meta.change:1.28}:{price:round(10+seed(meta.thscode)%9000/100),change:1.28});
  const last=history.at(-1),live=valid(raw.last_price)&&raw.last_price>0;
  const price=live?raw.last_price:valid(last?.close_price)&&last.close_price>0?last.close_price:base.price;
  const previous=valid(raw.prev_price)&&raw.prev_price>0?raw.prev_price:round(price/(1+base.change/100));
  const change=live&&valid(raw.price_change)?raw.price_change:round(price-previous);
  const ratio=live&&valid(raw.price_change_ratio_pct)?raw.price_change_ratio_pct:round(change/previous*100);
  const volume=valid(raw.volume)&&raw.volume>0?raw.volume:valid(last?.volume)&&last.volume>0?last.volume:Math.round(500000+seed(meta.thscode)%9000000);
  return {...meta,...raw,last_price:price,prev_price:previous,price_change:change,price_change_ratio_pct:ratio,
   open_price:valid(raw.open_price)&&raw.open_price>0?raw.open_price:round(previous*1.002),
   high_price:valid(raw.high_price)&&raw.high_price>0?raw.high_price:round(Math.max(price,previous)*1.015),
   low_price:valid(raw.low_price)&&raw.low_price>0?raw.low_price:round(Math.min(price,previous)*.986),
   volume,turnover:valid(raw.turnover)&&raw.turnover>0?raw.turnover:round(volume*price),pe_ttm:valid(raw.pe_ttm)?raw.pe_ttm:round(18+seed(meta.thscode)%6500/100)};
 }
 function history(meta,price,period='日K'){
  const intraday=period.includes('分'),step=intraday?(parseInt(period)||1)*60000:86400000;
  const count=period==='分时'?240:160,phase=seed(meta.thscode)%100/10,records=[];
  let stamp=Date.UTC(2026,9,9,intraday?7:0),previous=price*.88;
  for(let i=0;i<count;i++){
   const at=count-i-1;let date=stamp-at*step;
   if(!intraday){const d=new Date(date);if(d.getUTCDay()===0||d.getUTCDay()===6)continue;}
   const close=round(price*(intraday?1+Math.sin(i*.16+phase)*.006+i/count*.003:.84+i/count*.16+Math.sin(i*.12+phase)*.045));
   const open=round(previous*(1+Math.sin(i*1.7+phase)*.006)),high=round(Math.max(open,close)*1.012),low=round(Math.min(open,close)*.988);
   const volume=Math.round((500000+seed(meta.thscode)%3000000)*(1+.4*Math.sin(i*.8+phase)));
   records.push({date_ms:date,open_price:open,high_price:high,low_price:low,close_price:close,volume,turnover:round(volume*close)});previous=close;
  }
  if(records.length){const last=records.at(-1);last.close_price=price;last.high_price=Math.max(last.high_price,price);last.low_price=Math.min(last.low_price,price)}
  return records;
 }
 return {catalog,quote,history};
})();
