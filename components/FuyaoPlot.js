/* ECharts price/volume panes share dates, crosshair and zoom. Only source OHLC is used. */
window.FuyaoPlot=(()=>{
 const valid=value=>typeof value==='number'&&Number.isFinite(value);
 const day=stamp=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date(stamp));
 const ohlc=row=>['open_price','high_price','low_price','close_price'].every(k=>valid(row[k])&&row[k]>0)&&row.high_price>=Math.max(row.open_price,row.close_price)&&row.low_price<=Math.min(row.open_price,row.close_price);
 function bars(records,period='日K'){
  const dates=new Map();for(const record of records){const stamp=record.date_ms??record.timestamp;if(valid(stamp)&&ohlc(record))dates.set(day(stamp),{...record,date_ms:stamp})}
  const sorted=[...dates.values()].sort((a,b)=>a.date_ms-b.date_ms);if(period==='日K')return sorted;
  const groups=new Map();
  for(const row of sorted){const date=day(row.date_ms),d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));const key=period==='年K'?date.slice(0,4):period==='季K'?date.slice(0,4)+'-'+Math.floor((Number(date.slice(5,7))-1)/3):period==='月K'?date.slice(0,7):d.toISOString().slice(0,10),old=groups.get(key);
   if(!old)groups.set(key,{...row});else{old.date_ms=row.date_ms;old.high_price=Math.max(old.high_price,row.high_price);old.low_price=Math.min(old.low_price,row.low_price);old.close_price=row.close_price;for(const field of ['volume','turnover'])old[field]=valid(old[field])&&valid(row[field])?old[field]+row[field]:null}
  }return [...groups.values()];
 }
 function mergeSnapshot(records,row,timestamp){
  const result=bars(records),last=result.at(-1);if(!last||!row||!valid(timestamp))return result;
  const next={date_ms:timestamp,open_price:row.open_price,high_price:row.high_price,low_price:row.low_price,close_price:row.last_price,volume:valid(row.volume)?row.volume:null,turnover:valid(row.turnover)?row.turnover:null};
  if(!ohlc(next)||day(timestamp)<day(last.date_ms))return result;
  if(day(timestamp)===day(last.date_ms)){next.date_ms=last.date_ms;result[result.length-1]=next}
  else{
   // A refreshed server timestamp can still carry the previous session on holidays.
   const weekday=new Date(day(timestamp)+'T00:00:00Z').getUTCDay();
   if(weekday===0||weekday===6||['open_price','high_price','low_price','close_price','volume'].every(k=>next[k]===last[k]))return result;
   result.push(next);
  }
  return result;
 }
 let sequence=0;
 function create(candle,volume){
  const group='stock-chart-'+(++sequence),hosts=[candle,volume],instances=[],overlays=[];let records=[],identity='',destroyed=false,priceDigits=2;
  for(const [index,host]of hosts.entries()){
   host.replaceChildren();host.classList.add('fuyao-plot');host.dataset.renderer='echarts';
   const canvas=document.createElement('div');canvas.className='stock-echarts-canvas';canvas.setAttribute('aria-label',index?'成交量图':'K线图');host.append(canvas);
   const empty=document.createElement('div');empty.className='fuyao-chart-empty';host.append(empty);overlays.push(empty);
   const chart=echarts.init(canvas,null,{renderer:'canvas'});chart.group=group;instances.push(chart);
  }
  const up='#ef525f',down='#22b985',muted='#95979d';
  const axis={type:'category',data:[],boundaryGap:true,axisLine:{lineStyle:{color:'#343438'}},axisTick:{show:false},axisLabel:{color:muted,fontSize:12,hideOverlap:true,showMaxLabel:true},axisPointer:{show:true,type:'line',lineStyle:{color:muted,type:'dashed'},label:{color:'#dfe0e3',backgroundColor:'#36373b'}}};
  const zoom=(slider=false)=>({type:slider?'slider':'inside',xAxisIndex:0,start:0,end:100,filterMode:'filter',...(slider?{height:16,bottom:4,showDetail:false,brushSelect:false,borderColor:'#343438',backgroundColor:'#202124',fillerColor:'#383b4455',handleStyle:{color:'#737987',borderColor:'#737987'},dataBackground:{lineStyle:{color:'#555963'},areaStyle:{color:'#363940'}}}:{zoomOnMouseWheel:true,moveOnMouseMove:true,moveOnMouseWheel:false})});
  function tooltip(params){const at=(Array.isArray(params)?params[0]:params)?.dataIndex,row=records[at];if(!row)return '';return `${day(row.date_ms)}<br/>开 ${row.open_price.toFixed(priceDigits)}　高 ${row.high_price.toFixed(priceDigits)}<br/>低 ${row.low_price.toFixed(priceDigits)}　收 ${row.close_price.toFixed(priceDigits)}<br/>成交量 ${valid(row.volume)?row.volume.toLocaleString('zh-CN')+' 股':'--'}`}
  for(const [index,chart]of instances.entries())chart.setOption({animation:false,backgroundColor:'transparent',grid:{left:12,right:72,top:index?12:18,bottom:index?48:28},tooltip:{trigger:'axis',axisPointer:{type:'cross'},confine:true,backgroundColor:'#24262a',borderColor:'#44454a',padding:8,textStyle:{color:'#dfe0e3',fontSize:12},formatter:tooltip},axisPointer:{snap:true},xAxis:axis,yAxis:{type:'value',position:'right',scale:!index,min:index?0:null,splitNumber:index?3:4,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:muted,fontSize:12,formatter:value=>index?(Math.abs(value)>=1e8?(value/1e8).toFixed(1)+'亿股':(value/1e4).toFixed(1)+'万股'):value.toFixed(priceDigits)},splitLine:{lineStyle:{color:'#343438',width:.7}},axisPointer:{label:{backgroundColor:'#36373b',color:'#dfe0e3'}}},dataZoom:index?[zoom(),zoom(true)]:[zoom()],series:[]});
  // Share the date and zoom, while each pane keeps its own price/volume axis.
  let syncing=false;
  for(const [index,chart]of instances.entries()){
   const paired=instances[1-index];
   chart.on('datazoom',()=>{
    if(syncing)return;syncing=true;
    try{const {start,end}=chart.getOption().dataZoom[0];paired.dispatchAction({type:'dataZoom',start,end})}finally{syncing=false}
   });
   chart.on('updateAxisPointer',event=>{
    if(syncing)return;const axis=event.axesInfo?.find(info=>info.axisDim==='x');if(!axis)return;
    const at=typeof axis.value==='number'?axis.value:records.findIndex(row=>day(row.date_ms)===axis.value);if(at<0||at>=records.length)return;
    syncing=true;try{paired.dispatchAction({type:'showTip',seriesIndex:0,dataIndex:at})}finally{syncing=false}
   });
   chart.getZr().on('globalout',()=>{if(syncing)return;syncing=true;try{paired.dispatchAction({type:'hideTip'})}finally{syncing=false}});
  }
  const observer=new ResizeObserver(()=>{if(!destroyed)for(const chart of instances)chart.resize()});hosts.forEach(host=>observer.observe(host));
  function update(source,{period='日K',symbol='',reset=false,digits=2}={}){
   if(destroyed)return [];priceDigits=digits;const changed=identity!==symbol+'|'+period;identity=symbol+'|'+period;records=bars(source,period);
   const dates=records.map(r=>day(r.date_ms)),values=records.map(r=>[r.open_price,r.close_price,r.low_price,r.high_price]);
   const series=[{id:'ohlc',name:'K线',type:'candlestick',data:values,barMaxWidth:18,itemStyle:{color:up,color0:down,borderColor:up,borderColor0:down},emphasis:{itemStyle:{borderWidth:2}}}];
   for(const [n,color]of [[5,'#d9ac50'],[20,'#82a5e0'],[60,'#b887d6']])series.push({id:'ma'+n,name:'MA'+n,type:'line',data:records.map((_,i)=>i<n-1?'-':records.slice(i-n+1,i+1).reduce((sum,r)=>sum+r.close_price,0)/n),showSymbol:false,lineStyle:{color,width:1.3},itemStyle:{color},connectNulls:false,emphasis:{disabled:true}});
   const dataZoom=reset||changed?{start:Math.max(0,(records.length-100)/Math.max(1,records.length)*100),end:100}:null;
   instances[0].setOption({xAxis:{data:dates},series,...(dataZoom?{dataZoom:[dataZoom]}:{})});
   instances[1].setOption({xAxis:{data:dates},series:[{id:'volume',name:'成交量',type:'bar',barMaxWidth:18,data:records.map(r=>({value:valid(r.volume)?r.volume:'-',itemStyle:{color:r.close_price>=r.open_price?up:down}}))}],...(dataZoom?{dataZoom:[dataZoom,dataZoom]}:{})});
   for(const host of hosts){host.dataset.barCount=String(records.length);host.dataset.period=period;host.dataset.lastClose=records.at(-1)?.close_price??'';host.dataset.lastVolume=records.at(-1)?.volume??'';host.dataset.lastDate=records.length?day(records.at(-1).date_ms):''}
   status(records.length?'':'暂无可用 K 线数据');return records;
  }
  function status(message){overlays.forEach((overlay,index)=>{const text=message||(!index||records.some(r=>valid(r.volume))?'':'暂无可用成交量数据');overlay.textContent=text;overlay.hidden=!text})}
  function destroy(){if(destroyed)return;destroyed=true;observer.disconnect();echarts.disconnect(group);instances.forEach(chart=>chart.dispose())}
  return {update,status,destroy,price:instances[0],volume:instances[1],get records(){return records}};
 }
 return {create,bars,mergeSnapshot,valid,ohlc,day};
})();
