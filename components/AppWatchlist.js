/* Shared in-memory watch targets for the HTML prototype. */
window.AppWatchlist=(()=>{
 const imported=[
  ['300045','华力创通'],['515050','通信ETF华夏'],['588750','科创芯片ETF汇添富'],['159558','半导体设备ETF易方达'],['159611','电力ETF广发'],['002922','伊戈尔'],['159748','创新药ETF富国'],['002273','水晶光电'],['300207','欣旺达'],['588060','科创50ETF广发'],['688981','中芯国际'],['002475','立讯精密'],['000988','华工科技'],['300476','胜宏科技'],['600584','长电科技'],['688256','寒武纪'],['688008','澜起科技'],['300570','太辰光'],['002384','东山精密'],['300308','中际旭创'],['300502','新易盛'],['159227','航空航天ETF华夏'],['000725','京东方A'],['301669','高特电子'],['301319','唯特偶'],['300033','同花顺']
 ].map(([code,name])=>({code,ticker:code,thscode:code+(/^[56]/.test(code)?'.SH':'.SZ'),name,asset_type:/ETF/.test(name)?'fund-etf':'a-share',tag:/ETF/.test(name)?'ETF':'股票'}));
 const original=[['300308','中际旭创','算力'],['002335','科华数据','算力'],['300570','太辰光','算力'],['300750','宁德时代','新能源'],['600036','招商银行','高股息'],['00700','腾讯控股','互联网']].map(([code,name,tag])=>({code,ticker:code,thscode:code+(code.length===5?'.HK':code[0]==='6'?'.SH':'.SZ'),name,tag,asset_type:code.length===5?'hk-stock':'a-share'}));
 const normalize=row=>({code:row.code||row.ticker||row.thscode.split('.')[0],ticker:row.ticker||row.code,thscode:row.thscode||row.code+(row.code.length===5?'.HK':/^[56]/.test(row.code)?'.SH':'.SZ'),name:row.name,tag:row.tag||(/ETF/.test(row.name)?'ETF':'股票'),asset_type:row.asset_type||(/ETF/.test(row.name)?'fund-etf':row.code.length===5?'hk-stock':'a-share')});

 const byCode=new Map(original.map(normalize).map(row=>[row.code,row]));
 for(const row of imported)byCode.set(row.code,{...byCode.get(row.code),...row});
 let targets=[...byCode.values()];const listeners=new Set();
 const emit=()=>{for(const listener of listeners)listener()};
 function list(){return targets.map(row=>{const quote=window.DemoMarketData?DemoMarketData.snapshot(row):DemoFinance.quote(row);return {...row,price:quote.last_price.toFixed(row.asset_type==='fund-etf'?3:2),change:quote.price_change_ratio_pct}})}
 function replace(rows){const next=[...new Map(rows.map(row=>{const value=normalize(row);return[value.code,value]})).values()];if(JSON.stringify(next)===JSON.stringify(targets))return;targets=next;emit()}
 function refresh(){emit();return Promise.resolve()}
 return {list,replace,refresh,importedCodes:imported.map(row=>row.code),subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener)}};
})();
