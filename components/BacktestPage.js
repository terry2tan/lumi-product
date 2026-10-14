/* 策略回测交互稿：线框保真度，主要流程可点。沿用知识库页（KnowledgeBasePage）的结构与 kb-* 样式。
   对应需求稿 lumi/docs/requirements-pool/workflow/strategy-backtest/REQUIREMENTS.md（R1–R12）。
   曲线、指标、成交均为按策略与设置生成的示意数据：同一策略版本 + 同一设置重复运行结果一致（R4.5）。 */
window.BacktestPage=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const DATA_DATE='2026-10-12';
 const POOLS={
  '沪深300':['贵州茅台 600519','招商银行 600036','中国平安 601318','长江电力 600900','美的集团 000333','兴业银行 601166','中国神华 601088','格力电器 000651','宁德时代 300750','工商银行 601398','海螺水泥 600585','中国建筑 601668'],
  '中证500':['华工科技 000988','天孚通信 300394','赤峰黄金 600988','科伦药业 002422','西部矿业 601168','中天科技 600522','华海药业 600521','新和成 002001'],
  '全市场':['贵州茅台 600519','中际旭创 300308','长江电力 600900','华工科技 000988','比亚迪 002594','赤峰黄金 600988','美的集团 000333','科伦药业 002422'],
  '场内 ETF':['沪深300ETF 510300','中证500ETF 510500','创业板ETF 159915','红利ETF 510880','纳指ETF 513100','黄金ETF 518880'],
  '我的自选':['中际旭创 300308','新易盛 300502','天孚通信 300394','长江电力 600900','贵州茅台 600519','比亚迪 002594'],
  '自选板块：CPO':['中际旭创 300308','新易盛 300502','天孚通信 300394','太辰光 300570'],
  '自选板块：高股息':['长江电力 600900','中国神华 601088','工商银行 601398','格力电器 000651']
 };
 const SELF_POOL=p=>p.startsWith('我的自选')||p.startsWith('自选板块');
 /* 一个用户可以有多个模拟炒股账户：每个账户同一时间只跟踪一个策略，不同策略可以各用一个账户并行跟踪 */
 const SIM_ACCOUNTS=[{id:'a1',name:'模拟账户 1',cash:1000000},{id:'a2',name:'模拟账户 2',cash:500000},{id:'a3',name:'模拟账户 3',cash:200000}];
 const simAccount=id=>SIM_ACCOUNTS.find(a=>a.id===id)||SIM_ACCOUNTS[0];
 const SECTORS=['CPO','高股息','回测持仓'];
 const defaults=()=>({start:'2021-10-13',end:DATA_DATE,capital:'1000000',benchmark:'沪深300',price:'次日开盘价',fee:'万分之三（最低 5 元）',slippage:'0.1%',oos:false});
 const param=(key,label,value,min,max,note)=>({key,label,value:String(value),min,max,note});
 let seq=100;
 const CODE={
  rotate:`# 示意代码：接口命名以设计稿为准，对齐业界主流事件驱动接口
def initialize(context):
    context.hold_num = param("hold_num", 10)
    run_monthly(rebalance, monthday=1)      # 每月第一个交易日

def rebalance(context):
    pool = stock_pool(context.pool)          # 取运行设置中的股票池
    pe = factor(pool, "pe_ttm")              # 只能取到昨日及以前的数据
    targets = pe[pe > 0].nsmallest(context.hold_num).index
    order_target_weights({s: 1 / len(targets) for s in targets})`,
  timing:`# 示意代码：接口命名以设计稿为准，对齐业界主流事件驱动接口
def initialize(context):
    context.target = "510300.SH"
    context.fast = param("fast", 20)
    context.slow = param("slow", 60)
    run_daily(check)

def check(context):
    close = history(context.target, "close", context.slow + 1)
    fast, slow = close[-context.fast:].mean(), close[-context.slow:].mean()
    if fast > slow:
        order_target_percent(context.target, 1.0)   # 次日开盘成交
    else:
        order_target_percent(context.target, 0)`
 };
 CODE.rotate2=CODE.rotate.replace('    pool = stock_pool(context.pool)          # 取运行设置中的股票池','    pool = stock_pool(context.pool)          # 取运行设置中的股票池\n    pool = exclude_st(pool)                  # 剔除 ST\n    pool = listed_over(pool, days=250)       # 剔除上市不足一年');
 CODE.rotate3=CODE.rotate2.replace('    run_monthly(rebalance, monthday=1)      # 每月第一个交易日','    context.stop = param("stop", 0.08)\n    run_monthly(rebalance, monthday=1)      # 每月第一个交易日\n    run_daily(stop_loss)').replace('    order_target_weights({s: 1 / len(targets) for s in targets})','    weights = {s: 1 / len(targets) for s in targets}\n    order_target_weights(weights)\n\ndef stop_loss(context):\n    for s, pos in context.positions.items():\n        if pos.price / pos.cost - 1 < -context.stop:\n            order_target_percent(s, 0)       # 亏损超过止损线，次日开盘卖出');
 const strategy=(name,desc,kind,more={})=>({id:'s'+(++seq),name,desc,kind,ver:1,source:'自建',updated:'刚刚',pool:'沪深300',set:defaults(),params:[],rules:[],versions:[],runs:[],tries:0,signal:null,alert:false,drift:.0022,vol:.021,code:CODE[kind],...more});
 CODE.dca=`# 示意代码：接口命名以设计稿为准
def initialize(context):
    context.target = "510300.SH"
    context.amount = param("amount", 2000)
    run_monthly(invest, monthday=param("day", 1))   # 非交易日顺延到下一个交易日

def invest(context):
    deposit(context.amount)                          # 定投是持续追加资金，不是一次性投入
    order_value(context.target, context.cash)        # 按整百股买入，买不满的余额留到下一期`;
 CODE.grid=`# 示意代码：接口命名以设计稿为准
def initialize(context):
    context.target = "510300.SH"
    context.base = 4.00                              # 基准价
    context.step = param("step", 2) / 100            # 每格间距
    context.lot = param("lot", 1000)                 # 每格数量
    context.low, context.high = 3.60, 4.40           # 网格上下边界
    run_daily(place_orders)

def place_orders(context):
    # 每天收盘后按当前所在格，挂出下一个交易日的相邻两格限价单
    buy, sell = next_levels(context)
    if buy >= context.low:
        order_limit(context.target, context.lot, price=buy)
    if sell <= context.high and sellable(context.target) >= context.lot:
        order_limit(context.target, -context.lot, price=sell)`;
 CODE.boll=`# 示意代码：接口命名以设计稿为准
def init(context):
    context.target = param("target", "600644.SH")
    context.window = param("window", 20)
    context.width = param("width", 2)
    run_daily(check)

def check(context):
    close = history(context.target, "close", context.window)   # 只取到昨日收盘
    mid, std = close.mean(), close.std(ddof=0)
    if close[-1] <= mid - context.width * std and not holding(context.target):
        order_target_percent(context.target, 0.8)              # 次日开盘成交
    elif close[-1] >= mid + context.width * std and holding(context.target):
        order_target_percent(context.target, 0)`;
 CODE.price=`# 示意代码：接口命名以设计稿为准
def init(context):
    context.target = param("target", "600644.SH")
    context.buy = param("buy", 8.00)
    context.sell = param("sell", 10.00)
    run_daily(check)

def check(context):
    close = history(context.target, "close", 1)[-1]
    if close <= context.buy and not holding(context.target):
        order_target_percent(context.target, 0.8)
    elif close >= context.sell and holding(context.target):
        order_target_percent(context.target, 0)`;
 CODE.ma=`# 示意代码：接口命名以设计稿为准
def init(context):
    context.target = param("target", "600644.SH")
    context.ma = param("ma", 60)
    context.gap = param("gap", 10) / 100
    run_daily(check)

def check(context):
    close = history(context.target, "close", context.ma)
    avg = close.mean()
    if close[-1] < avg * (1 - context.gap) and not holding(context.target):
        order_target_percent(context.target, 0.8)
    elif close[-1] >= avg and holding(context.target):
        order_target_percent(context.target, 0)`;
 const dcaRules=()=>[['标的','沪深300ETF（510300）'],['买入','每月 1 号投入 2000 元，非交易日顺延'],['卖出','不卖出，持续持有'],['资金','每期追加，不是一次性投入'],['零头处理','按整百股买入，余额留到下一期'],['采用的默认值','近 5 年 · 基准为同样方式定投沪深 300 · 佣金万分之三（最低 5 元）']];
 const gridRules=()=>[['标的','沪深300ETF（510300）'],['网格','基准价 4.00 元，每格 2%，范围 3.60–4.40 元'],['买入','每下跌一格买入 1000 股'],['卖出','每上涨一格卖出 1000 股'],['破网','跌破下界停止买入，突破上界卖完为止'],['成交假设','限价单；当日最高最低价覆盖格价即成交，每格每天最多一次']];
 const PRESET={
  dca:()=>({pool:'场内 ETF',single:'沪深300ETF 510300',params:[param('amount','每期金额',2000,100,100000,'元'),param('day','每月定投日',1,1,28,'号')],rules:dcaRules(),drift:.0015,vol:.016}),
  grid:()=>({pool:'场内 ETF',single:'沪深300ETF 510300',params:[param('step','网格间距',2,0.5,10,'%'),param('lot','每格数量',1000,100,100000,'股')],rules:gridRules(),drift:.0012,vol:.012})
 };
 const preset=kind=>PRESET[kind]();
 const rotateRules=(pool,n)=>[['股票池',pool],['买入条件','市盈率（TTM）为正且最低的 '+n+' 只'],['卖出条件','调仓日不在目标名单内的全部卖出'],['调仓频率','每月第一个交易日'],['仓位分配','等权'],['采用的默认值','近 5 年 · 100 万 · 基准沪深 300 · 次日开盘价成交']];
 const timingRules=()=>[['标的','沪深300ETF（510300）'],['买入条件','20 日均线上穿 60 日均线，满仓买入'],['卖出条件','20 日均线下穿 60 日均线，全部卖出'],['检查频率','每个交易日收盘后'],['仓位分配','满仓 / 空仓'],['采用的默认值','近 5 年 · 100 万 · 基准沪深 300 · 次日开盘价成交']];
 const strategies=[
  strategy('低估值轮动','沪深 300 里每月买入市盈率最低的 10 只，等权持有。','rotate',{ver:3,updated:'10 分钟前',params:[param('hold_num','持仓数量',10,5,30,'只'),param('interval','调仓间隔',20,5,60,'个交易日')],rules:rotateRules('沪深 300 成分股',10),fromChat:'低估值轮动策略',tries:3,signal:{time:'每个交易日 15:30',sector:''},code:CODE.rotate3,
   versions:[{ver:3,time:'10 分钟前',note:'对话修改：加入 8% 止损',by:'AI',code:CODE.rotate3},{ver:2,time:'昨天',note:'对话修改：剔除 ST 与上市不足一年',by:'AI',code:CODE.rotate2},{ver:1,time:'3 天前',note:'首次生成',by:'AI',code:CODE.rotate}]}),
  strategy('沪深300ETF 双均线择时','20 日均线上穿 60 日均线买入，下穿卖出。','timing',{updated:'昨天',pool:'场内 ETF',single:'沪深300ETF 510300',params:[param('fast','短均线',20,5,60,'日'),param('slow','长均线',60,20,250,'日')],rules:timingRules(),drift:.0016,vol:.016,fromChat:'ETF 均线择时',tries:1,versions:[{ver:1,time:'昨天',note:'首次生成'}]}),
  strategy('ETF 动量轮动','每周持有近 20 日涨幅最高的 2 只 ETF。','rotate',{updated:'3 天前',source:'策略库',fromPack:'p-mom',pool:'场内 ETF',params:[param('hold_num','持仓数量',2,1,4,'只'),param('lookback','动量窗口',20,10,120,'日')],rules:[['股票池','场内 ETF（6 只宽基与商品）'],['买入条件','近 20 日涨幅最高的 2 只'],['卖出条件','调仓日跌出前 2 名'],['调仓频率','每周第一个交易日'],['仓位分配','等权'],['采用的默认值','近 5 年 · 100 万 · 基准沪深 300 · 次日开盘价成交']],drift:.0026,vol:.024,tries:1,versions:[{ver:1,time:'3 天前',note:'从策略库下载'}]}),
  strategy('自选股低波动','在我的自选里每月持有波动最小的 3 只。','rotate',{updated:'5 天前',pool:'我的自选',params:[param('hold_num','持仓数量',3,1,6,'只')],rules:rotateRules('我的自选（运行时成分快照）',3),drift:.0019,vol:.019,error:{line:14,msg:'KeyError: \'volatility_20\' —— 股票池中有 1 只标的上市不足 20 日，缺少该指标'},versions:[{ver:1,time:'5 天前',note:'首次生成'}]})
 ];
 const packs=[
  {id:'p-ma',name:'双均线择时',cat:'择时',intro:'单一标的的趋势跟随：短均线上穿长均线买入，下穿卖出。',fit:'趋势明显的宽基指数与 ETF',unfit:'长期横盘震荡的标的，会被反复打脸',params:['短均线 20 日','长均线 60 日'],rules:timingRules(),kind:'timing',sum:['+38.6%','-14.2%','0.71']},
  {id:'p-dca',name:'指数定投',cat:'定投',intro:'每月固定一天投入固定金额买入宽基 ETF，长期持有。',fit:'每月有结余、不想择时的长期投资',unfit:'短期要用的钱；期望短期见效',params:['每期金额 2000 元','每月定投日 1 号'],rules:dcaRules(),kind:'dca',sum:['+31.2%','-19.8%','年化 6.9%']},
  {id:'p-grid',name:'网格交易',cat:'网格',intro:'在一个价格区间内分格，跌一格买一份，涨一格卖一份，赚震荡的差价。',fit:'长期在区间内震荡的宽基 ETF',unfit:'单边行情：单边下跌会买满被套，单边上涨会早早卖光',params:['网格间距 2%','每格数量 1000 股'],rules:gridRules(),kind:'grid',sum:['+18.4%','-9.6%','0.74']},
  {id:'p-mom',name:'ETF 动量轮动',cat:'轮动',intro:'在几只宽基与商品 ETF 之间，每周持有近期最强的两只。',fit:'想做大类轮动、不想选个股',unfit:'各类资产同涨同跌的阶段',params:['持仓数量 2 只','动量窗口 20 日'],rules:[['股票池','场内 ETF'],['买入条件','近 20 日涨幅最高的 2 只'],['调仓频率','每周']],kind:'rotate',sum:['+71.4%','-18.9%','0.92'],stId:strategies[2].id},
  {id:'p-div',name:'红利低波',cat:'选股',intro:'高股息里挑波动最小的一批，每季度调仓。',fit:'追求回撤小、能长期拿住',unfit:'成长风格强势的牛市阶段会明显跑输',params:['持仓数量 20 只','调仓间隔 60 个交易日'],rules:rotateRules('中证红利成分股',20),kind:'rotate',sum:['+52.3%','-11.7%','0.88']},
  {id:'p-small',name:'小市值轮动',cat:'选股',intro:'每月持有市值最小的一批股票，剔除 ST 与停牌。',fit:'了解小盘股风险、能承受大回撤',unfit:'流动性收紧阶段；成交量限制对结果影响大',params:['持仓数量 20 只','成交量上限 10%'],rules:rotateRules('全市场（剔除 ST、停牌、上市不足一年）',20),kind:'rotate',sum:['+96.8%','-34.5%','0.79']},
  {id:'p-boll',name:'布林带均值回归',cat:'择时',intro:'价格跌破布林带下轨买入，回到中轨卖出。',fit:'波动有规律的震荡标的',unfit:'单边下跌趋势，会越跌越买',params:['窗口 20 日','带宽 2 倍标准差'],rules:timingRules(),kind:'timing',sum:['+24.9%','-16.3%','0.54']},
  {id:'p-ind',name:'行业动量',cat:'轮动',intro:'每月持有近三个月最强的 3 个行业的龙头。',fit:'行业主线清晰的行情',unfit:'行业快速轮动、主线不明的阶段',params:['行业数量 3 个','动量窗口 60 日'],rules:rotateRules('申万一级行业龙头',6),kind:'rotate',sum:['+63.0%','-22.1%','0.83']}
 ];
 const S={view:'home',stId:null,packId:null,tab:'report',q:'',prompt:'',menu:null,modal:null,notes:false,run:null,viewRun:null,cmp:null,curve:'收益',range:'全部',tradeStock:'全部',posDate:0,codeView:'code',diffVer:null,
  dataState:'ready',gen:'ok',pending:null,clientOffline:false,failNext:false,tipClient:true,downloading:{},imp:{agree:false},sig:{time:'每个交易日 15:30',sync:false,sector:'回测持仓'},sector:{mode:'new',name:'',target:'回测持仓'},simForm:{mode:'confirm',capital:'200000',account:'a1'},rename:''};
 let root=null,toastTimer=0;
 const cur=()=>strategies.find(s=>s.id===S.stId),pack=()=>packs.find(p=>p.id===S.packId);
 const chip=(text,cls='')=>`<span class="kb-chip ${cls}">${esc(text)}</span>`;
 const btn=(label,act,attrs='',cls='')=>`<button type="button" class="kb-btn ${cls}" data-act="${act}" ${attrs}>${esc(label)}</button>`;
 const link=(label,act,attrs='')=>`<button type="button" class="kb-link" data-act="${act}" ${attrs}>${esc(label)}</button>`;
 const crumb=items=>`<nav class="kb-crumb" aria-label="位置">${items.map(([label,act,attrs],i)=>i<items.length-1?`${link(label,act,attrs||'')}<span>/</span>`:`<b>${esc(label)}</b>`).join('')}</nav>`;
 const pct=(x,sign=true)=>(sign&&x>=0?'+':'')+(x*100).toFixed(2)+'%';
 /* 依赖同花顺客户端在线的操作（自选、K 线）：离线时置灰并说明原因（R10.14） */
 const clientAttr=()=>S.clientOffline?'disabled title="需要同花顺客户端在线"':'';
 function toast(text){if(!root)return;clearTimeout(toastTimer);let t=root.querySelector('.kb-toast');if(!t){t=document.createElement('div');t.className='kb-toast';t.setAttribute('role','status');root.append(t)}t.textContent=text;t.hidden=false;toastTimer=setTimeout(()=>t.hidden=true,2800)}

 /* ---------- 示意数据：按策略与设置确定性生成 ---------- */
 const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
 const rng=seed=>{let s=seed>>>0||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}};
 const walk=(seed,n,drift,vol)=>{const r=rng(seed),out=[1];for(let i=1;i<n;i++)out.push(out[i-1]*(1+(r()+r()+r()-1.5)*vol*2+drift));return out};
 const day=(start,i)=>{const d=new Date(start+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+i*7);return d.toISOString().slice(0,10)};
 function stats(v){
  const n=v.length,rets=v.slice(1).map((x,i)=>x/v[i]-1),mean=rets.reduce((a,b)=>a+b,0)/(rets.length||1),sd=Math.sqrt(rets.reduce((a,b)=>a+(b-mean)**2,0)/(rets.length||1));
  let peak=v[0],mdd=0,from=0,to=0,pi=0;v.forEach((x,i)=>{if(x>peak){peak=x;pi=i}const d=x/peak-1;if(d<mdd){mdd=d;from=pi;to=i}});
  return {total:v[n-1]/v[0]-1,annual:Math.pow(v[n-1]/v[0],52/Math.max(1,n-1))-1,sharpe:sd?mean/sd*Math.sqrt(52):0,vol:sd*Math.sqrt(52),mdd,from,to};
 }
 const cache=new Map();
 const snapshot=st=>({ver:st.ver,pool:st.pool,set:{...st.set},params:st.params.map(p=>p.value)});
 function compute(st,snap){
  /* 结果只取决于策略版本、股票池、设置与参数；运行记录的编号、时间与展示选项不参与 */
  const {oos,...used}=snap.set,key=JSON.stringify([st.id,snap.ver,snap.pool,used,snap.params]);if(cache.has(key))return cache.get(key);
  const weeks=Math.max(12,Math.min(520,Math.round((new Date(snap.set.end)-new Date(snap.set.start))/6048e5)||260)),seed=hash(key);
  const eq=walk(seed,weeks,st.drift+((seed%9)-4)*.00018,st.vol),bm=walk(hash(snap.set.benchmark+snap.set.start+snap.set.end),weeks,.0009,.022);
  const dates=eq.map((_,i)=>day(snap.set.start,i)),m=stats(eq),b=stats(bm),r=rng(seed^0x9e3779b9);
  const names=st.single?[st.single]:(POOLS[snap.pool]||POOLS['沪深300']);
  const hold=st.single?1:Math.max(1,Math.min(names.length,+snap.params[0]||3));
  const trades=Array.from({length:14},(_,i)=>{const side=i%2?'卖出':'买入',price=+(8+r()*180).toFixed(2),qty=(1+Math.floor(r()*30))*100,amount=price*qty;return {date:dates[Math.max(0,weeks-1-i*Math.max(1,Math.floor(weeks/40)))],stock:names[Math.floor(r()*names.length)],side,qty,price,fee:+(Math.max(5,amount*.0003)+(side==='卖出'&&!/ETF/.test(snap.pool)?amount*.0005:0)).toFixed(2)}});
  const capital=(+snap.set.capital||1e6)*eq[weeks-1];
  const positions=names.slice(0,hold).map(stock=>{const price=+(8+r()*180).toFixed(2),value=capital*.98/hold;return {stock,qty:Math.floor(value/price/100)*100,cost:+(price*(.85+r()*.25)).toFixed(2),price,weight:.98/hold}});
  const months={};dates.forEach((d,i)=>{if(!i)return;const k=d.slice(0,7);months[k]=(months[k]||1)*(eq[i]/eq[i-1])});
  const cut=Math.floor(weeks*.7);
  const out={eq,bm,dates,m,b,trades,positions,months,weeks,count:st.kind==='dca'?Math.round(weeks/4.33):st.kind==='grid'?46+seed%50:st.kind==='timing'?8+seed%9:Math.round(weeks/4)*Math.max(1,Math.ceil(hold*.4)),win:.42+(seed%20)/100,plr:1.2+(seed%14)/10,is:stats(eq.slice(0,cut+1)),oos:stats(eq.slice(cut)),cutDate:dates[cut],secs:(st.kind==='timing'?1.8:22)+(seed%30)/10};
  cache.set(key,out);return out;
 }
 const okRuns=st=>st.runs.filter(r=>r.status==='ok');
 const shownRun=st=>(S.viewRun&&st.runs.find(r=>r.id===S.viewRun))||okRuns(st)[0];
 function addRun(st,status,snap=snapshot(st)){const run={id:'r'+(++seq),time:'刚刚',status,dataDate:DATA_DATE,...snap};st.runs.unshift(run);return run}
 /* 预置的运行记录 */
 for(const st of strategies){
  if(st.error){addRun(st,'failed').time='5 天前';continue}
  if(st.name==='低估值轮动'){const a=snapshot(st);a.ver=1;addRun(st,'ok',a).time='3 天前';const b=snapshot(st);b.ver=2;b.params=['15','20'];addRun(st,'ok',b).time='昨天'}
  addRun(st,'ok').time=st.updated;
 }

 /* ---------- 图形（线框：灰阶折线） ---------- */
 function lineChart(list,{h=220,labels=[],percent=true}={}){
  const all=list.flatMap(s=>s.data),lo=Math.min(...all),hi=Math.max(...all),W=600,pad=6,span=hi-lo||1,n=Math.max(...list.map(s=>s.total||s.data.length));
  const y=v=>(h-pad-(v-lo)/span*(h-pad*2)).toFixed(1),x=i=>(i/Math.max(1,n-1)*W).toFixed(1);
  const paths=list.map(s=>`<polyline class="bt-line ${s.cls||''}" points="${s.data.map((v,i)=>x(i)+','+y(v)).join(' ')}"/>`).join('');
  const fmt=v=>percent?pct(v-1):v.toFixed(2);
  return `<div class="bt-chart"><div class="bt-axis-y"><span>${fmt(hi)}</span><span>${fmt((hi+lo)/2)}</span><span>${fmt(lo)}</span></div><div class="bt-plot"><svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px" aria-hidden="true"><path class="bt-grid" d="M0 ${pad}H${W}M0 ${h/2}H${W}M0 ${h-pad}H${W}"/>${paths}</svg><div class="bt-axis-x">${labels.map(l=>`<span>${l}</span>`).join('')}</div></div></div>`;
 }
 function drawdownChart(v,labels){
  let peak=v[0];const dd=v.map(x=>{peak=Math.max(peak,x);return x/peak-1}),lo=Math.min(...dd,-.01),W=600,h=90,x=i=>(i/Math.max(1,v.length-1)*W).toFixed(1),y=d=>(d/lo*(h-4)).toFixed(1);
  return `<div class="bt-chart"><div class="bt-axis-y"><span>0%</span><span>${pct(lo,false)}</span></div><div class="bt-plot"><svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px" aria-hidden="true"><path class="bt-area" d="M0 0${dd.map((d,i)=>'L'+x(i)+' '+y(d)).join('')}L${W} 0Z"/></svg><div class="bt-axis-x">${labels.map(l=>`<span>${l}</span>`).join('')}</div></div></div>`;
 }
 function klineChart(seed,grid){
  const r=rng(seed),W=600,h=200;let p=100;const bars=Array.from({length:60},()=>{const o=p,c=p*(1+(r()-.48)*.05),hi=Math.max(o,c)*(1+r()*.012),lo=Math.min(o,c)*(1-r()*.012);p=c;return {o,c,hi,lo}});
  const lo=Math.min(...bars.map(b=>b.lo)),hi=Math.max(...bars.map(b=>b.hi)),y=v=>(h-18-(v-lo)/(hi-lo)*(h-40)).toFixed(1),marks={9:'买',24:'卖',33:'买',51:'卖'};
  return `<svg class="bt-kline" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" aria-label="日 K 线与买卖点（示意）">${grid?[0,1,2,3,4].map(i=>`<path class="bt-gridline" d="M0 ${30+i*35}H${W}"/>`).join(''):''}${bars.map((b,i)=>{const cx=i*10+5,up=b.c>=b.o,top=y(Math.max(b.o,b.c)),ht=Math.max(1,Math.abs(y(b.o)-y(b.c)));return `<path class="bt-wick" d="M${cx} ${y(b.hi)}V${y(b.lo)}"/><rect class="${up?'bt-up':'bt-down'}" x="${cx-3}" y="${top}" width="6" height="${ht}"/>${marks[i]?`<text class="bt-mark" x="${cx}" y="${marks[i]==='买'?(+y(b.lo)+14):(+y(b.hi)-6)}">${marks[i]}</text>`:''}`}).join('')}</svg>`;
 }
 const yearLabels=dates=>{const out=[];for(const d of dates){const yy=d.slice(0,4);if(out[out.length-1]!==yy)out.push(yy)}return out};

 /* ---------- 首页 ---------- */
 function dataBanner(){
  if(S.dataState==='first')return `<div class="kb-banner"><span>首次使用，正在准备回测环境与行情数据。可以先在对话里描述策略，准备完成后会自动开始回测。</span><span class="kb-grow"></span><span class="kb-sub">回测环境 100% · 行情数据 46%</span><span class="kb-progress" aria-hidden="true"><i style="width:46%"></i></span>${btn('转入后台','noop','data-toast="已转入后台，完成后通知你"','is-small')}</div>`;
  if(S.dataState==='stale')return `<div class="kb-banner is-warn"><span>行情数据截至 2026-09-30。同花顺客户端未连接，暂时无法更新；仍可用已有数据回测，报告会标注数据截止日期。</span><span class="kb-grow"></span>${btn('重试更新','noop','data-toast="仍未连接到同花顺客户端"','is-small')}</div>`;
  return `<div class="kb-row"><span class="kb-sub">行情数据截至 ${DATA_DATE} · 已是最新 · 每个交易日收盘后自动更新</span><span class="kb-grow"></span>${link('数据与存储','modal','data-modal="data"')}</div>`;
 }
 function strategyCard(st){
  const run=okRuns(st)[0],r=run&&compute(st,run),running=S.run?.stId===st.id;
  return `<article class="kb-card" data-act="open-strategy" data-id="${st.id}" tabindex="0" role="button" aria-label="打开策略 ${esc(st.name)}">
   <div class="kb-card-head"><span class="kb-cover" aria-hidden="true"></span><div><h3>${esc(st.name)}</h3><p class="kb-sub">${esc(st.source)} · v${st.ver} · ${esc(st.updated)}修改</p></div></div>
   <p class="kb-desc">${esc(st.desc)}</p>
   <div class="bt-mini">${r?`<span><b>${pct(r.m.annual)}</b>年化收益</span><span><b>${pct(r.m.mdd,false)}</b>最大回撤</span><span><b>${r.m.sharpe.toFixed(2)}</b>夏普</span>`:'<span class="kb-sub">还没有回测结果</span>'}</div>
   <div class="kb-card-foot">${running?chip(`回测中 ${S.run.pct}%`,'is-parsing'):''}${st.error&&!run?chip('运行失败','is-warn'):''}${st.signal?chip('每日信号','is-notice'):''}${st.alert?chip('盘中预警','is-notice'):''}${st.sim?chip(st.sim.paused?'模拟跟踪已暂停':'模拟跟踪','is-notice'):''}${SELF_POOL(st.pool)?chip('自选'):''}${st.fromPack?chip('来自策略库'):''}</div>
  </article>`;
 }
 function packCard(p){
  const loading=S.downloading[p.id];
  return `<article class="kb-card" data-act="open-pack" data-id="${p.id}" tabindex="0" role="button" aria-label="预览 ${esc(p.name)}">
   <div class="kb-card-head"><span class="kb-cover" aria-hidden="true"></span><div><h3>${esc(p.name)}</h3><p class="kb-sub">同花顺投研学院 · <span class="kb-badge">官方</span> · ${esc(p.cat)}</p></div></div>
   <p class="kb-desc">${esc(p.intro)}</p>
   <div class="kb-card-foot"><span class="kb-sub">近 5 年 ${p.sum[0]} · 回撤 ${p.sum[1]}</span><span class="kb-grow"></span>${p.stId?chip('已添加'):loading?chip(`下载中 ${loading}%`,'is-parsing'):btn('使用','add-pack',`data-id="${p.id}"`,'is-small')}</div>
  </article>`;
 }
 function home(){
  const q=S.q.trim(),hit=x=>!q||x.name.includes(q)||(x.desc||x.intro).includes(q),mine=strategies.filter(hit),lib=packs.filter(hit);
  const section=(title,sub,body,extra='')=>`<section class="kb-section"><div class="kb-row"><h2>${title}</h2><span class="kb-sub">${sub}</span><span class="kb-grow"></span>${extra}</div><div class="kb-grid">${body||'<p class="kb-empty">没有找到相关策略</p>'}</div></section>`;
  return `<header class="kb-head"><h1 tabindex="-1">策略回测</h1><div class="kb-head-tools"><input class="kb-input" type="search" data-input="q" value="${esc(S.q)}" placeholder="搜索策略" aria-label="搜索策略">${btn('导入策略文件','modal','data-modal="import"')}${btn('新建策略','new-in-chat','','is-primary')}</div></header>
   ${S.tipClient?`<div class="kb-banner"><span>这里的「策略回测」由 AI 生成策略并在本机回测，支持选股与轮动；同花顺客户端个股页底部的「策略回测」是 K 线上的指标策略，两者互不影响。</span><span class="kb-grow"></span>${btn('知道了','hide-tip','','is-small')}</div>`:''}
   ${dataBanner()}
   <section class="kb-panel bt-new"><div class="kb-row kb-wrap"><div class="kb-grow"><b>新建策略在对话中完成</b><p class="kb-sub">在对话里说出你的想法，AI 会补齐规则请你确认，再生成代码并回测；结果自动收进「我的策略」。</p></div>${btn('在对话中新建','new-in-chat','','is-primary')}</div></section>
   ${section('我的策略',`${mine.length} 个`,mine.map(strategyCard).join(''))}
   ${section('策略库','官方精选，下载后可改参数、可让 AI 修改',lib.map(packCard).join(''),link('在商城中查看全部','noop','data-toast="跳转到 商城 › 策略库"'))}
   <p class="kb-hint">历史回测不代表未来收益，不构成投资建议。策略库首期仅提供官方精选；用户发布与排行在后续版本开放。</p>`;
 }

 /* ---------- 策略详情 ---------- */
 function settingsPanel(st){
  const field=(label,html,note='')=>`<label class="bt-field"><span>${label}</span>${html}${note?`<small>${note}</small>`:''}</label>`;
  const input=(key,value,type='text')=>`<input class="kb-input" type="${type}" data-input="${key}" value="${esc(value)}">`;
  const select=(key,value,options)=>`<select data-select="${key}">${options.map(o=>`<option ${value===o?'selected':''}>${o}</option>`).join('')}</select>`;
  return `<aside class="kb-panel bt-settings" aria-label="运行设置"><div class="kb-row"><b>运行设置</b><span class="kb-grow"></span>${link('恢复默认','reset-settings')}</div>
   <div class="bt-field-row">${field('开始',input('set.start',st.set.start,'date'))}${field('结束',input('set.end',st.set.end,'date'))}</div>
   ${field('初始资金（元）',input('set.capital',st.set.capital,'number'))}
   ${field('基准',select('set.benchmark',st.set.benchmark,['沪深300','中证500','中证1000','创业板指']))}
   ${st.single?field('标的',`<input class="kb-input" value="${esc(st.single)}" disabled>`,'更换标的请通过对话修改'):field('股票池',select('st.pool',st.pool,Object.keys(POOLS)),SELF_POOL(st.pool)?'使用运行当时的自选成分，并记入运行记录':'')}
   ${field('成交价',select('set.price',st.set.price,['次日开盘价','当日收盘价']),'默认次日开盘价，更保守')}
   <div class="bt-field-row">${field('佣金',select('set.fee',st.set.fee,['万分之三（最低 5 元）','万分之一（最低 5 元）','免佣']))}${field('滑点',select('set.slippage',st.set.slippage,['0','0.1%','0.2%']))}</div>
   <div class="bt-divider"></div><b>策略参数</b>
   ${st.params.map((p,i)=>field(`${p.label}（${p.note}）`,`<input class="kb-input" type="number" min="${p.min}" max="${p.max}" data-input="param.${i}" value="${esc(p.value)}">`,`${p.min}–${p.max}`)).join('')||'<p class="kb-sub">这个策略没有可调参数</p>'}
   <div class="bt-divider"></div>
   <label class="kb-check"><input type="checkbox" data-check="set.oos" ${st.set.oos?'checked':''}>分成样本内 / 样本外两段展示<small class="kb-sub">最后 30% 的区间作为样本外，帮助识别过拟合</small></label>
   ${btn(S.run?.stId===st.id?'回测中…':'运行回测','run','','is-primary')}
   <p class="kb-hint">改完直接运行，不经过 AI、不消耗对话额度。修改买卖逻辑请用「对话修改」，或在「策略」里直接改代码。</p></aside>`;
 }
 function banners(st,r,run){
  let out='';
  if(S.run?.stId===st.id)out+=`<div class="kb-banner is-notice"><span>正在回测 · 已回测到 ${r?r.dates[Math.max(0,Math.floor(r.weeks*S.run.pct/100)-1)]:''}</span><span class="kb-progress is-wide" aria-hidden="true"><i style="width:${S.run.pct}%"></i></span><span class="kb-grow"></span>${btn('取消','cancel-run','','is-small')}</div>`;
  if(st.error&&!S.run)out+=`<div class="kb-banner is-warn"><span>上次运行失败：策略第 ${st.error.line} 行 · ${esc(st.error.msg)}</span><span class="kb-grow"></span>${btn('让 AI 修复','ai-fix','','is-small')}${btn('查看日志','tab','data-tab="logs"','is-small')}</div>`;
  if(S.viewRun&&run)out+=`<div class="kb-banner"><span>正在查看历史运行：${esc(run.time)} · v${run.ver} · 数据截至 ${run.dataDate}</span><span class="kb-grow"></span>${btn('回到最新','view-latest','','is-small')}</div>`;
  if(st.tries>=6)out+=`<div class="kb-banner is-warn"><span>这个策略已调整并运行 ${st.tries} 次。反复调参后挑出的最好结果往往偏乐观，建议打开「样本内 / 样本外」看看在没参与调参的区间里表现如何。</span></div>`;
  if(SELF_POOL(run?.pool||st.pool))out+=`<div class="kb-banner"><span>股票池为「${esc(run?.pool||st.pool)}」的当前成分。用今天的自选回测过去，结果带有选择偏差（自选里的股票往往已经涨过）。</span></div>`;
  return out;
 }
 /* 定投与网格的专属指标（R14）：普通的总收益率对这两类策略会误导，需要换口径 */
 function kindPanel(st,r,run,live){
  if(live||!['dca','grid'].includes(st.kind))return '';
  const stat=(v,label)=>`<div class="kb-stat"><b>${v}</b><span>${label}</span></div>`,money=v=>Math.round(v).toLocaleString();
  if(st.kind==='dca'){
   const periods=Math.round(r.weeks/4.33),invested=periods*(+run.params[0]||2000),gain=r.m.total*.42,lump=r.b.total;
   return `<section class="kb-panel"><div class="kb-row"><b>定投视角</b><span class="kb-sub">共 ${periods} 期</span></div><div class="bt-metrics">${stat(money(invested)+' 元','累计投入')}${stat(money(invested*(1+gain))+' 元','期末市值')}${stat(pct(gain),'累计收益率（按投入）')}${stat(pct(r.m.annual*.78),'年化（资金加权）')}${stat(pct(lump),'同期一次性买入')}${stat(pct(gain-lump*.4),'相对定投基准')}</div>
    <p class="kb-hint">定投的钱是分批进场的，不能用「期末市值 ÷ 初始资金」算收益。这里的累计收益率按累计投入计算，年化按每笔资金实际在场的时间加权（内部收益率）；基准是用同样的节奏定投${esc(run.set.benchmark)}。每期按整百股买入，买不满的余额留到下一期；小额定投时最低 5 元佣金的影响会被放大。</p></section>`;
  }
  const seed=hash(st.id+run.params.join()),lot=+run.params[1]||1000;
  return `<section class="kb-panel"><div class="kb-row"><b>网格视角</b><span class="kb-sub">${esc(st.single)} · 每格 ${esc(run.params[0])}%</span></div><div class="bt-metrics">${stat('+'+money(lot*.08*r.count/2)+' 元','网格已实现收益')}${stat((seed%2?'+':'-')+money(lot*(2+seed%5)*.11)+' 元','持仓浮动盈亏')}${stat(r.count,'成交次数')}${stat(pct(.38+(seed%30)/100,false),'平均资金占用')}${stat(12+seed%40+' 天','价格在网格之外')}${stat((seed%6)+' 格','当前持有')}</div>
   <div class="kb-banner is-warn"><span>日线回测的网格是近似：只知道每天的最高价和最低价，同一天内的多次往返无法还原，这里按「每格每天最多成交一次」计算，成交次数和网格收益会比实际偏少。当天买入的份额当天不能卖出（T+1）。</span></div>
   <p class="kb-hint">网格收益是已经卖出赚到的差价；持仓浮动盈亏是还没卖出的份额按现价计算的盈亏，两者要分开看。价格跳空越过格价时按开盘价成交。</p></section>`;
 }
 function reportTab(st,r,run){
  if(!r)return `<div class="kb-empty-box"><p>还没有回测结果</p><p class="kb-sub">${st.error?'上次运行失败。可以让 AI 修复后重试。':'确认左侧设置后点击「运行回测」。'}</p></div>`;
  const live=S.run?.stId===st.id,n=live?Math.max(2,Math.floor(r.weeks*S.run.pct/100)):r.weeks,m=live?stats(r.eq.slice(0,n)):r.m,b=live?stats(r.bm.slice(0,n)):r.b;
  const from=S.range==='近 1 年'?Math.max(0,n-52):S.range==='近 3 年'?Math.max(0,n-156):0,cut=a=>{const part=a.slice(from,n),base=part[0]||1;return part.map(v=>v/base)};
  const eq=cut(r.eq),bm=cut(r.bm),labels=yearLabels(r.dates.slice(from,n)),total=live?r.weeks-from:undefined;
  const series=S.curve==='超额'?[{data:eq.map((v,i)=>1+v-bm[i]),total}]:[{data:eq,total},{data:bm,cls:'is-bench',total}];
  const stat=(v,label)=>`<div class="kb-stat"><b>${v}</b><span>${label}</span></div>`;
  const seg=(key,options)=>`<div class="kb-seg">${options.map(o=>`<button type="button" class="${S[key]===o?'is-active':''}" data-act="seg" data-key="${key}" data-value="${o}">${o}</button>`).join('')}</div>`;
  const years=[...new Set(Object.keys(r.months).map(k=>k.slice(0,4)))];
  const monthTable=`<div class="bt-months"><div class="bt-month-row is-head"><span>年份</span>${Array.from({length:12},(_,i)=>`<span>${i+1}月</span>`).join('')}<span>全年</span></div>${years.map(yy=>{let year=1;const cells=Array.from({length:12},(_,i)=>{const v=r.months[yy+'-'+String(i+1).padStart(2,'0')];if(v==null)return '<span></span>';year*=v;return `<span class="${v>=1?'is-pos':'is-neg'}">${((v-1)*100).toFixed(1)}</span>`}).join('');return `<div class="bt-month-row"><span>${yy}</span>${cells}<span class="${year>=1?'is-pos':'is-neg'}">${((year-1)*100).toFixed(1)}</span></div>`}).join('')}</div>`;
  const oos=run.set.oos&&!live?`<section class="kb-panel"><div class="kb-row"><b>样本内 / 样本外</b><span class="kb-sub">以 ${r.cutDate} 为界</span></div><div class="bt-table" style="--bt-cols:1.2fr 1fr 1fr 1fr 1fr"><div class="bt-tr bt-th"><span></span><span>年化收益</span><span>最大回撤</span><span>夏普</span><span>波动率</span></div>${[['样本内（前 70%）',r.is],['样本外（后 30%）',r.oos]].map(([label,x])=>`<div class="bt-tr"><span>${label}</span><span>${pct(x.annual)}</span><span>${pct(x.mdd,false)}</span><span>${x.sharpe.toFixed(2)}</span><span>${pct(x.vol,false)}</span></div>`).join('')}</div><p class="kb-hint">样本外明显差于样本内，说明策略可能只是贴合了历史。</p></section>`:'';
  const notes=[r.count<20?'交易次数较少（'+r.count+' 次），结论的偶然性较大。':'',r.weeks<104?'回测区间不足两年，没有覆盖完整的涨跌周期。':''].filter(Boolean);
  return `${st.justCreated?`<section class="kb-panel"><div class="kb-row"><b>AI 理解的规则</b>${chip('AI 生成','is-ai')}<span class="kb-grow"></span>${link('理解得不对？对话修改','chat-edit')}</div>${rulesHtml(st)}</section>`:''}
   <div class="bt-metrics">${stat(pct(m.total),'策略收益')}${stat(pct(m.annual),'年化收益')}${stat(pct(b.total),'基准收益')}${stat(pct(m.total-b.total),'超额收益')}${stat(pct(m.mdd,false),'最大回撤')}${stat(m.sharpe.toFixed(2),'夏普比率')}${stat(pct(m.vol,false),'波动率')}${stat(live?'--':pct(r.win,false),'胜率')}${stat(live?'--':r.plr.toFixed(2),'盈亏比')}${stat(live?'--':r.count,'交易次数')}</div>
   ${kindPanel(st,r,run,live)}${notes.map(t=>`<div class="kb-banner is-warn"><span>${t}</span></div>`).join('')}
   <section class="kb-panel"><div class="kb-row kb-wrap"><b>收益曲线</b><span class="bt-legend"><i></i>策略${S.curve==='超额'?'超额':''}</span>${S.curve==='超额'?'':`<span class="bt-legend is-bench"><i></i>${esc(run.set.benchmark)}</span>`}<span class="kb-grow"></span>${seg('curve',['收益','超额'])}${seg('range',['近 1 年','近 3 年','全部'])}</div>${lineChart(series,{labels})}
    <div class="kb-row"><b>回撤</b><span class="kb-sub">最大回撤 ${pct(m.mdd,false)}${live?'':` · ${r.dates[m.from]} 至 ${r.dates[m.to]}`}</span></div>${drawdownChart(eq,labels)}</section>
   ${live?'':`${oos}<section class="kb-panel"><div class="kb-row"><b>月度收益（%）</b></div>${monthTable}</section>
   <section class="kb-panel"><div class="kb-row"><b>AI 解读</b>${chip('AI 生成','is-ai')}</div><p>近 ${Math.round(r.weeks/52)} 年策略收益 ${pct(m.total)}，${m.total>b.total?'跑赢':'跑输'}基准 ${pct(Math.abs(m.total-b.total),false)}。最大回撤 ${pct(m.mdd,false)} 出现在 ${r.dates[m.from]} 至 ${r.dates[m.to]}，同期基准也在下跌，主要来自市场整体回落而非个别持仓。</p><p class="kb-sub">可以继续验证：${st.kind==='timing'?'把长均线换成 120 日是否更稳；震荡年份的表现':'持仓数量从 10 只增加到 20 只后回撤是否改善；加入止损条件'}。</p><div class="kb-row">${btn('对话修改策略','chat-edit','','is-small')}${btn('复制解读','noop','data-toast="已复制"','is-small')}</div></section>
   ${st.sim?simPanel(st,r):''}${st.signal?signalPanel(st,r):''}
   <section class="kb-panel kb-sample" aria-label="示例：对话中的结果卡片"><div class="kb-row"><b>示例：对话中的结果卡片</b><span class="kb-sub">（形态示意，真实卡片出现在对话区，点击后在这里打开完整报告）</span></div><div class="bt-result-card"><div><b>${esc(st.name)}</b><p class="kb-sub">${run.set.start} 至 ${run.set.end} · 基准 ${esc(run.set.benchmark)}</p></div><div class="bt-mini"><span><b>${pct(m.annual)}</b>年化收益</span><span><b>${pct(m.mdd,false)}</b>最大回撤</span><span><b>${m.sharpe.toFixed(2)}</b>夏普</span></div>${lineChart([{data:r.eq},{data:r.bm,cls:'is-bench'}],{h:64})}${btn('查看完整报告','noop','data-toast="在右侧打开完整报告"','is-small')}</div></section>
   <p class="kb-hint">数据截至 ${run.dataDate}。${run.pool==='沪深300'||run.pool==='中证500'?'指数成分股使用当前成分（缺少历史成分数据），存在幸存者偏差。':''}成交按${esc(run.set.price)}，已计入佣金、印花税与滑点，遵循 T+1、涨跌停与停牌规则。历史回测不代表未来收益，不构成投资建议。</p>`}`;
 }
 const rulesHtml=st=>`<div class="bt-rules">${st.rules.map(([k,v])=>`<div><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join('')}</div>`;
 function signalPanel(st,r){
  const buy=r.positions.slice(0,2),sell=(POOLS[st.pool]||[]).slice(-2);
  return `<section class="kb-panel"><div class="kb-row kb-wrap"><b>每日信号</b>${chip(st.signal.time,'is-notice')}${st.signal.sector?chip('同步到自选板块：'+st.signal.sector):''}<span class="kb-grow"></span>${link('在自动任务中管理','noop','data-toast="跳转到 自动任务"')}${link('关闭','signal-off')}</div>
   <p class="kb-sub">${DATA_DATE} 收盘后生成 · 下一个交易日开盘执行</p>
   <div class="kb-two"><div class="kb-list">${buy.map(p=>`<div class="kb-list-row"><span>买入 ${stockLink(p.stock)}</span><span class="kb-sub">目标仓位 ${pct(p.weight,false)}</span></div>`).join('')}${st.single?'':sell.map(s=>`<div class="kb-list-row"><span>卖出 ${stockLink(s)}</span><span class="kb-sub">清仓</span></div>`).join('')}</div>
   <div class="kb-list"><div class="kb-list-row"><span>应持仓 ${r.positions.length} 只</span><span class="kb-row">${btn('存为自选板块','modal','data-modal="sector" '+clientAttr(),'is-small')}</span></div><div class="kb-list-row"><span class="kb-sub">信号由回测引擎直接计算，不重新生成策略代码</span></div></div></div></section>`;
 }
 /* 模拟账户跟踪：只操作同花顺模拟炒股账户，不触碰真实交易账户（R10.15–R10.21） */
 function simPanel(st,r){
  const sim=st.sim,orders=[...r.positions.slice(0,2).map(p=>({side:'买入',stock:p.stock,qty:Math.max(100,Math.floor((+sim.capital||2e5)*p.weight/p.price/100)*100)})),...(st.single?[]:(POOLS[st.pool]||[]).slice(-1).map(stock=>({side:'卖出',stock,qty:300})))];
  const state=S.clientOffline?'offline':sim.paused?'paused':sim.orders;
  const status={offline:'同花顺客户端未连接，今日委托没有执行。连接后可以补发，或跳过这一次。',paused:'已暂停：信号照常生成，但不会向模拟账户下单。',pending:sim.mode==='auto'?'将在下一个交易日开盘自动委托。':'等待你确认后下单。',sent:'已委托，下一个交易日开盘成交。',skipped:'本次已跳过，模拟账户持仓不变。'}[state];
  return `<section class="kb-panel"><div class="kb-row kb-wrap"><b>模拟账户跟踪</b>${chip(sim.mode==='auto'?'自动下单':'每次由我确认','is-notice')}${chip(simAccount(sim.account).name)}${chip('投入 '+(+sim.capital||0).toLocaleString()+' 元')}${chip('仅模拟账户')}<span class="kb-grow"></span>${link('在客户端查看模拟账户','noop','data-toast="已在同花顺客户端打开模拟炒股" '+clientAttr())}${link(sim.paused?'恢复':'暂停','sim-pause')}${link('停止跟踪','sim-stop')}</div>
   <div class="bt-mini"><span><b>+1.82%</b>模拟账户 · 跟踪 12 个交易日</span><span><b>+2.10%</b>回测同期</span><span><b>-0.28%</b>偏差</span></div>
   <p class="kb-sub">偏差主要来自实际成交价与回测假设的开盘价不同；有 1 笔委托因涨停没有成交。</p>
   <div class="kb-banner ${state==='offline'?'is-warn':''}"><span>${DATA_DATE} 的信号 · ${status}</span><span class="kb-grow"></span>${state==='pending'&&sim.mode==='confirm'?btn('确认下单','sim-order','','is-small is-primary')+btn('本次跳过','sim-skip','','is-small'):state==='offline'?btn('本次跳过','sim-skip','','is-small'):''}</div>
   <div class="kb-list">${orders.map(o=>`<div class="kb-list-row"><span>${o.side} ${stockLink(o.stock)} ${o.qty} 股</span><span class="kb-sub">${state==='sent'?'已委托 · 开盘价':state==='skipped'?'已跳过':'待委托 · 开盘价'}</span></div>`).join('')}</div>
   <p class="kb-hint">只会向同花顺模拟炒股账户下单，不会也不能操作真实交易账户。每笔委托都记录来自哪个策略版本和哪一天的信号。模拟成绩不代表真实交易结果。</p></section>`;
 }
 const stockLink=s=>`<button type="button" class="kb-link" data-act="open-kline" data-stock="${esc(s)}" ${clientAttr()}>${esc(s)}</button>`;
 function tradesTab(st,r){
  if(!r)return '<p class="kb-empty">运行回测后在这里查看成交明细。</p>';
  const stocks=['全部',...new Set(r.trades.map(t=>t.stock))],rows=r.trades.filter(t=>S.tradeStock==='全部'||t.stock===S.tradeStock);
  return `<div class="kb-row kb-wrap kb-toolbar"><label class="kb-select"><span>标的</span><select data-select="tradeStock" aria-label="标的">${stocks.map(o=>`<option ${S.tradeStock===o?'selected':''}>${o}</option>`).join('')}</select></label><span class="kb-sub">共 ${r.count} 笔，显示最近 ${rows.length} 笔</span><span class="kb-grow"></span>${btn('导出明细','noop','data-toast="已导出为 CSV"','is-small')}</div>
   <div class="bt-table" role="table" aria-label="交易明细" style="--bt-cols:92px minmax(110px,1.6fr) 44px minmax(48px,.6fr) minmax(52px,.7fr) minmax(48px,.6fr) 28px"><div class="bt-tr bt-th" role="row"><span>日期</span><span>标的</span><span>方向</span><span>数量</span><span>成交价</span><span>费用</span><span></span></div>
   ${rows.map((t,i)=>`<div class="bt-tr" role="row"><span>${t.date}</span><span>${stockLink(t.stock)}</span><span>${t.side}</span><span>${t.qty}</span><span>${t.price.toFixed(2)}</span><span>${t.fee.toFixed(2)}</span><span class="kb-menu-anchor"><button type="button" class="kb-icon" data-act="row-menu" data-id="t${i}" aria-label="${esc(t.stock)} 的操作" aria-haspopup="menu">⋯</button>${S.menu==='t'+i?`<div class="kb-menu" role="menu"><button type="button" role="menuitem" data-act="open-kline" data-stock="${esc(t.stock)}" ${clientAttr()}>在客户端打开日 K</button><button type="button" role="menuitem" data-act="mark-kline" data-stock="${esc(t.stock)}" ${clientAttr()}>把买卖点标到客户端 K 线</button><button type="button" role="menuitem" data-act="filter-stock" data-stock="${esc(t.stock)}">只看这只</button></div>`:''}</span></div>`).join('')}</div>
   ${S.clientOffline?'<p class="kb-hint">同花顺客户端未连接，暂时不能打开 K 线或标注买卖点，不影响查看回测结果。</p>':'<p class="kb-hint">点击标的名称在同花顺客户端打开该股日 K 页。买入为整百股；未成交的委托（涨停、跌停、停牌）见「日志」。</p>'}`;
 }
 function positionsTab(st,r,run){
  if(!r)return '<p class="kb-empty">运行回测后在这里查看持仓。</p>';
  const dates=[r.dates[r.weeks-1],r.dates[Math.floor(r.weeks*.75)],r.dates[Math.floor(r.weeks*.5)]];
  const kline=st.single?`<section class="kb-panel"><div class="kb-row kb-wrap"><b>${esc(st.single)} · 日 K 与买卖点</b><span class="kb-sub">最近 60 个交易日</span><span class="kb-grow"></span>${btn('在客户端打开','open-kline',`data-stock="${esc(st.single)}" ${clientAttr()}`,'is-small')}${btn('标到客户端 K 线','mark-kline',`data-stock="${esc(st.single)}" ${clientAttr()}`,'is-small')}</div>${klineChart(hash(st.id+run.id),st.kind==='grid')}</section>`:'';
  return `${kline}<div class="kb-row kb-wrap kb-toolbar"><label class="kb-select"><span>日期</span><select data-select="posDate" aria-label="持仓日期">${dates.map((d,i)=>`<option value="${i}" ${+S.posDate===i?'selected':''}>${d}${i?'':'（最新）'}</option>`).join('')}</select></label><span class="kb-sub">持仓 ${r.positions.length} 只 · 仓位 98%</span><span class="kb-grow"></span>${btn('存为自选板块','modal','data-modal="sector" '+clientAttr(),'is-small')}</div>
   <div class="bt-table" role="table" aria-label="每日持仓" style="--bt-cols:minmax(110px,1.6fr) minmax(44px,.6fr) minmax(48px,.6fr) minmax(48px,.6fr) minmax(64px,.9fr) minmax(48px,.6fr) minmax(56px,.7fr)"><div class="bt-tr bt-th" role="row"><span>标的</span><span>数量</span><span>成本价</span><span>现价</span><span>市值</span><span>占比</span><span>浮动盈亏</span></div>
   ${r.positions.map(p=>`<div class="bt-tr" role="row"><span>${stockLink(p.stock)}</span><span>${p.qty}</span><span>${p.cost.toFixed(2)}</span><span>${p.price.toFixed(2)}</span><span>${Math.round(p.qty*p.price).toLocaleString()}</span><span>${pct(p.weight,false)}</span><span>${pct(p.price/p.cost-1)}</span></div>`).join('')}</div>
   <p class="kb-hint">成交与持仓按真实价格计算，分红送转在除权除息日作用到账户；信号计算使用复权价。</p>`;
 }
 function logsTab(st,r){
  const rows=st.error&&!r?[['2026-10-08','ERROR',`第 ${st.error.line} 行 · ${st.error.msg}`],['2026-10-08','INFO','回测已终止，未生成结果']]
   :[[DATA_DATE,'INFO',`回测完成，用时 ${r?r.secs.toFixed(1):'--'} 秒，数据截至 ${DATA_DATE}`],['2026-09-01','WARNING','格力电器 000651 涨停，买入委托未成交，资金保留至下个调仓日'],['2026-08-03','WARNING','海螺水泥 600585 停牌，卖出委托顺延至复牌日'],['2026-07-01','INFO','调仓：卖出 2 只，买入 2 只'],['2026-06-12','INFO','长江电力 600900 除权除息，现金分红计入账户'],['2026-06-02','WARNING','当日买入的 中国平安 601318 不可卖出（T+1），卖出委托未成交']];
  return `<div class="kb-list bt-log">${rows.map(([d,level,text])=>`<div class="kb-list-row"><span><span class="kb-sub">${d}</span> ${chip(level,level==='ERROR'?'is-warn':level==='WARNING'?'is-parsing':'')} ${esc(text)}</span></div>`).join('')}</div>${st.error&&!r?`<div class="kb-row">${btn('让 AI 修复','ai-fix','','is-primary')}<span class="kb-sub">AI 会读取报错信息修改策略并重新运行，最多自动重试 3 次。</span></div>`:''}`;
 }
 /* 按行对比两段代码，连续的增删归为一处改动（h 为改动序号） */
 function diffLines(before,after){
  const A=before.split('\n'),B=after.split('\n'),n=A.length,m=B.length,dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const rows=[];let i=0,j=0;
  while(i<n||j<m){if(i<n&&j<m&&A[i]===B[j]){rows.push({t:' ',s:A[i],a:i+1,b:j+1});i++;j++}else if(i<n&&(j>=m||dp[i+1][j]>=dp[i][j+1])){rows.push({t:'-',s:A[i],a:i+1});i++}else{rows.push({t:'+',s:B[j],b:j+1});j++}}
  let h=-1,prev=' ';for(const r of rows){if(r.t!==' '){if(prev===' ')h++;r.h=h}prev=r.t}
  return rows;
 }
 const verCode=(st,ver)=>{const v=st.versions.find(x=>x.ver===ver);return v?.code??st.code};
 function saveVersion(st,code,note,by){const now=st.versions.find(v=>v.ver===st.ver);if(now&&now.code==null)now.code=st.code;st.ver++;st.code=code;st.updated='刚刚';st.versions.unshift({ver:st.ver,time:'刚刚',note,by,code})}
 function diffHtml(st,ver,review){
  const prev=st.versions.filter(v=>v.ver<ver).sort((x,y)=>y.ver-x.ver)[0];
  if(!prev)return '<p class="kb-empty">这是第一个版本，没有可对比的改动。</p>';
  const rows=diffLines(verCode(st,prev.ver),verCode(st,ver)),add=rows.filter(r=>r.t==='+').length,del=rows.filter(r=>r.t==='-').length,seen=new Set();
  if(!add&&!del)return '<p class="kb-empty">与 v'+prev.ver+' 相比代码没有变化。</p>';
  return `<div class="kb-row kb-wrap"><span class="kb-sub">v${prev.ver} → v${ver}</span><span class="bt-diff-stat is-add">+${add} 行</span><span class="bt-diff-stat is-del">−${del} 行</span></div>
   <div class="bt-diff" role="table" aria-label="代码改动">${rows.map(r=>{const first=review&&r.t!==' '&&!seen.has(r.h);if(first)seen.add(r.h);return `<div class="bt-diff-row ${r.t==='+'?'is-add':r.t==='-'?'is-del':''}" role="row"><span class="bt-ln">${r.a??''}</span><span class="bt-ln">${r.b??''}</span><span class="bt-sign">${r.t==='+'?'+':r.t==='-'?'−':''}</span><code>${esc(r.s)||' '}</code>${first?`<button type="button" class="bt-hunk" data-act="undo-hunk" data-h="${r.h}">撤销此处</button>`:''}</div>`}).join('')}</div>`;
 }
 function codeTab(st){
  const editing=st.draft!=null,dirty=editing&&st.draft!==st.code,ver=S.diffVer&&st.versions.some(v=>v.ver===S.diffVer)?S.diffVer:st.ver,view=editing?'code':S.codeView;
  const review=st.review?`<div class="kb-banner is-notice"><span>AI 修改了策略代码，已保存为 v${st.ver}${S.run?.stId===st.id?'，正在用新版本回测':''}。绿色为新增、红色为删除。</span><span class="kb-grow"></span>${btn('保留','keep-ai','','is-small is-primary')}${btn('全部撤销','undo-ai','','is-small')}</div>`:'';
  const seg=`<div class="kb-seg">${[['code','代码'],['diff','改动']].map(([id,label])=>`<button type="button" class="${view===id?'is-active':''}" data-act="code-view" data-view="${id}" ${editing&&id==='diff'?'disabled title="先保存或放弃修改"':''}>${label}</button>`).join('')}</div>`;
  const body=view==='diff'?`<div class="kb-row kb-wrap"><label class="kb-select"><span>查看版本</span><select data-select="diffVer" aria-label="查看版本">${st.versions.map(v=>`<option value="${v.ver}" ${v.ver===ver?'selected':''}>v${v.ver} · ${esc(v.note)}</option>`).join('')}</select></label></div>${diffHtml(st,ver,!!st.review&&ver===st.ver)}`
   :editing?`${st.checkError?`<div class="kb-banner is-warn"><span>${esc(st.checkError)}</span></div>`:''}<textarea class="bt-code bt-code-edit" data-input="st.draft" spellcheck="false" rows="${Math.max(12,st.draft.split('\n').length+1)}" aria-label="策略代码">${esc(st.draft)}</textarea><div class="kb-row kb-wrap">${btn('保存并运行','save-code','data-run="1"','is-primary')}${btn('保存','save-code')}${btn('放弃修改','cancel-edit')}<span class="kb-sub">保存后生成 v${st.ver+1}，保存时检查语法与可用库</span><span class="kb-grow"></span>${link('可用的函数与库','noop','data-toast="打开引擎接口与可用库说明"')}</div>`
   :`<pre class="bt-code">${esc(st.code)}</pre>`;
  return `${review}<section class="kb-panel"><div class="kb-row"><b>规则</b>${chip('AI 生成','is-ai')}<span class="kb-grow"></span>${btn('对话修改','chat-edit','','is-small')}</div>${rulesHtml(st)}${st.manual?'<p class="kb-hint">代码被手动修改过，上面的规则说明可能与代码不一致。可以让 AI 根据当前代码重新整理。</p>':''}</section>
   <section class="kb-panel"><div class="kb-row kb-wrap"><b>策略代码</b><span class="kb-sub">v${st.ver}${editing?' · 编辑中':''}</span>${seg}<span class="kb-grow"></span>${editing?'':btn('编辑','edit-code','','is-small is-primary')}${btn('复制','noop','data-toast="已复制策略代码"','is-small')}${btn('导出策略文件','noop','data-toast="已导出 '+esc(st.name)+'.strategy"','is-small')}</div>${body}<p class="kb-hint">可以直接改代码，也可以用「对话修改」让 AI 改。每次保存或 AI 修改都生成一个新版本，随时可以对比和回退。</p></section>
   <section class="kb-panel"><b>版本</b><div class="kb-list">${st.versions.map(v=>`<div class="kb-list-row"><span>v${v.ver} · ${esc(v.note)} ${v.by?chip(v.by==='AI'?'AI 修改':v.by,v.by==='AI'?'is-ai':''):''}${v.ver===st.ver?' '+chip('当前'):''}</span><span class="kb-row"><span class="kb-sub">${esc(v.time)}</span>${btn('查看改动','view-diff',`data-ver="${v.ver}"`,'is-small')}${v.ver===st.ver?'':btn('回退到此版本','rollback',`data-ver="${v.ver}"`,'is-small')}</span></div>`).join('')}</div></section>`;
 }
 function runsTab(st){
  if(!st.runs.length)return '<p class="kb-empty">还没有运行记录。</p>';
  const latest=okRuns(st)[0];
  return `<div class="bt-table bt-runs" role="table" aria-label="运行记录" style="--bt-cols:84px 48px minmax(0,1.4fr) 84px 84px 60px 72px minmax(0,1fr)"><div class="bt-tr bt-th" role="row"><span>时间</span><span>版本</span><span>设置</span><span>年化收益</span><span>最大回撤</span><span>夏普</span><span>状态</span><span></span></div>
   ${st.runs.map(run=>{const ok=run.status==='ok',r=ok&&compute(st,run);return `<div class="bt-tr" role="row"><span>${esc(run.time)}</span><span>v${run.ver}</span><span>${run.set.start.slice(0,7)} 至 ${run.set.end.slice(0,7)} · ${esc(run.pool)}${run.params.length?' · 参数 '+run.params.join(' / '):''}</span><span>${ok?pct(r.m.annual):'--'}</span><span>${ok?pct(r.m.mdd,false):'--'}</span><span>${ok?r.m.sharpe.toFixed(2):'--'}</span><span>${chip({ok:'完成',failed:'失败',cancelled:'已取消',interrupted:'已中断'}[run.status],ok?'':'is-warn')}</span><span class="kb-row">${ok?btn('查看','view-run',`data-id="${run.id}"`,'is-small'):''}${ok&&latest&&run!==latest?btn('对比最新','compare',`data-id="${run.id}"`,'is-small'):''}</span></div>`}).join('')}</div>
   <p class="kb-hint">每次运行都留存所用的策略版本、参数、设置与数据截止日期，可随时重新打开。同一版本、设置与数据重复运行，结果完全一致。</p>`;
 }
 function liveHtml(st){
  const run=shownRun(st),live=S.run?.stId===st.id,r=live?compute(st,S.run.snap):run&&compute(st,run),shown=live?{...S.run.snap,dataDate:DATA_DATE,time:'运行中',id:'live'}:run;
  const tabs=[['report','报告'],['trades','交易明细'],['positions','每日持仓'],['logs','日志'],['code','策略'],['runs',`运行记录 ${st.runs.length}`]];
  const body={report:()=>reportTab(st,r,shown),trades:()=>tradesTab(st,live?null:r),positions:()=>positionsTab(st,live?null:r,shown),logs:()=>logsTab(st,live?null:r),code:()=>codeTab(st),runs:()=>runsTab(st)}[S.tab]();
  return `${banners(st,r,shown)}<div class="kb-tabs" role="tablist">${tabs.map(([id,label])=>`<button type="button" role="tab" aria-selected="${S.tab===id}" class="${S.tab===id?'is-active':''}" data-act="tab" data-tab="${id}">${label}</button>`).join('')}</div><div class="kb-tab-body">${body}</div>`;
 }
 function strategyView(){
  const st=cur();if(!st)return home();
  const more=[['每日信号','modal','data-modal="signal"'],['盘中预警','modal','data-modal="alert"'],['模拟账户跟踪','modal','data-modal="sim" '+clientAttr()],['保存报告到文件','modal','data-modal="save"'],['存为自选板块','modal','data-modal="sector" '+clientAttr()],['复制策略','duplicate',''],['重命名','modal','data-modal="rename"'],['导出策略文件','noop','data-toast="已导出 '+esc(st.name)+'.strategy"'],['删除','modal','data-modal="delete"']];
  return `${crumb([['策略回测','go','data-view="home"'],[st.name]])}
   <header class="kb-head"><div class="kb-row kb-grow"><span class="kb-cover is-large" aria-hidden="true"></span><div><h1 tabindex="-1">${esc(st.name)}</h1><p class="kb-sub">${esc(st.desc)}</p><p class="kb-sub">${esc(st.source)} · v${st.ver}${st.fromChat?' · ':''}${st.fromChat?link('来自对话「'+st.fromChat+'」','noop','data-toast="打开创建这个策略的对话"'):''}</p></div></div>
    <div class="kb-head-tools">${btn('对话修改','chat-edit')}${btn('每日信号','modal','data-modal="signal"')}<span class="kb-menu-anchor">${btn('更多 ▾','menu','data-menu="more"')}${S.menu==='more'?`<div class="kb-menu is-right" role="menu">${more.map(([label,act,attrs])=>`<button type="button" role="menuitem" data-act="${act}" ${attrs}>${label}</button>`).join('')}</div>`:''}</span></div></header>
   <div class="bt-layout">${settingsPanel(st)}<div class="bt-main" data-live>${liveHtml(st)}</div></div>`;
 }

 /* ---------- 运行对比 ---------- */
 function compareView(){
  const st=cur(),a=st?.runs.find(r=>r.id===S.cmp),b=st&&okRuns(st)[0];if(!a||!b)return strategyView();
  const ra=compute(st,a),rb=compute(st,b),n=Math.min(ra.weeks,rb.weeks);
  const rows=[['策略版本','v'+a.ver,'v'+b.ver],['回测区间',a.set.start+' 至 '+a.set.end,b.set.start+' 至 '+b.set.end],['股票池',a.pool,b.pool],['参数',a.params.join(' / ')||'无',b.params.join(' / ')||'无'],['年化收益',pct(ra.m.annual),pct(rb.m.annual)],['最大回撤',pct(ra.m.mdd,false),pct(rb.m.mdd,false)],['夏普比率',ra.m.sharpe.toFixed(2),rb.m.sharpe.toFixed(2)],['波动率',pct(ra.m.vol,false),pct(rb.m.vol,false)],['交易次数',ra.count,rb.count]];
  return `${crumb([['策略回测','go','data-view="home"'],[st.name,'open-strategy',`data-id="${st.id}"`],['运行对比']])}
   <header class="kb-head"><h1 tabindex="-1">运行对比</h1><div class="kb-head-tools">${btn('返回报告','open-strategy',`data-id="${st.id}"`)}</div></header>
   <section class="kb-panel"><div class="kb-row kb-wrap"><b>收益曲线</b><span class="bt-legend is-bench"><i></i>${esc(a.time)} · v${a.ver}</span><span class="bt-legend"><i></i>最新 · v${b.ver}</span></div>${lineChart([{data:rb.eq.slice(0,n)},{data:ra.eq.slice(0,n),cls:'is-bench'}],{labels:yearLabels(rb.dates.slice(0,n))})}</section>
   <div class="bt-table" role="table" aria-label="指标对比" style="--bt-cols:minmax(0,1fr) minmax(0,1.4fr) minmax(0,1.4fr)"><div class="bt-tr bt-th" role="row"><span></span><span>${esc(a.time)}</span><span>最新</span></div>${rows.map(([k,x,y])=>`<div class="bt-tr" role="row"><span class="kb-sub">${k}</span><span>${esc(x)}</span><span>${x===y?esc(y):`<b>${esc(y)}</b>`}</span></div>`).join('')}</div>
   <p class="kb-hint">加粗的是两次运行不同的地方。历史回测不代表未来收益，不构成投资建议。</p>`;
 }

 /* ---------- 策略库预览 ---------- */
 function packView(){
  const p=pack();if(!p)return home();const loading=S.downloading[p.id];
  return `${crumb([['策略回测','go','data-view="home"'],['策略库','go','data-view="home"'],[p.name]])}
   <header class="kb-head"><div class="kb-row kb-grow"><span class="kb-cover is-large" aria-hidden="true"></span><div><h1 tabindex="-1">${esc(p.name)}</h1><p class="kb-sub">同花顺投研学院 · <span class="kb-badge">官方</span> · ${esc(p.cat)} · v1.0 · 2026-10-08 更新</p></div></div>
    <div class="kb-head-tools">${p.stId?btn('打开我的副本','open-strategy',`data-id="${p.stId}"`,'is-primary'):loading===-1?btn('重试','add-pack',`data-id="${p.id}"`,'is-primary'):loading?chip(`下载中 ${loading}%`,'is-parsing'):btn('使用这个策略','add-pack',`data-id="${p.id}"`,'is-primary')}</div></header>
   ${loading===-1?'<div class="kb-banner is-warn"><span>下载失败，没有在「我的策略」中留下任何内容。请检查网络后重试。</span></div>':''}
   <div class="kb-two"><section class="kb-panel"><b>策略说明</b><p>${esc(p.intro)}</p><div class="kb-field"><span>适合</span>${esc(p.fit)}</div><div class="kb-field"><span>不适合</span>${esc(p.unfit)}</div><b>规则</b><div class="bt-rules">${p.rules.map(([k,v])=>`<div><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join('')}</div></section>
   <section class="kb-panel"><b>官方回测摘要</b><div class="bt-mini"><span><b>${p.sum[0]}</b>近 5 年收益</span><span><b>${p.sum[1]}</b>最大回撤</span><span><b>${p.sum[2]}</b>夏普</span></div><p class="kb-sub">默认参数、近 5 年、基准沪深 300。下载后在你的机器上重新运行，结果以本机为准。</p><b>可调参数</b><div class="kb-row kb-wrap">${p.params.map(x=>chip(x)).join('')}</div><b>可以这样用</b><div class="kb-row kb-wrap">${['直接回测','换成我的自选作为股票池','让 AI 加一个止损条件'].map(x=>chip(x)).join('')}</div></section></div>
   <p class="kb-hint">下载的是独立副本：你对它的修改不会影响策略库原件，原件更新也不会覆盖你的修改。策略库内容为研究方法示例，不构成投资建议。</p>`;
 }

 /* ---------- 弹窗 ---------- */
 function modalHtml(){
  const m=S.modal;if(!m)return '';const st=cur();
  const shell=(title,body,foot)=>`<div class="kb-backdrop" data-act="close-modal"><section class="kb-modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="kb-row"><b>${title}</b><span class="kb-grow"></span><button type="button" class="kb-icon" data-act="close-modal" aria-label="关闭">×</button></div>${body}<div class="kb-row"><span class="kb-grow"></span>${foot}</div></section></div>`;
  const cancel=btn('取消','close-modal');
  if(m.name==='import')return shell('导入策略文件',`<button type="button" class="kb-drop" data-act="noop" data-toast="已选择 朋友分享的策略.strategy">点击选择策略文件，或将文件拖到这里<small>支持从 Lumi 导出的 .strategy 文件</small></button><div class="kb-banner is-warn"><span>策略文件包含代码，回测时会在你的电脑上直接运行。请只导入你信任的来源。</span></div><label class="kb-check"><input type="checkbox" data-check="imp.agree" ${S.imp.agree?'checked':''}>我了解并信任这个文件的来源</label>`,cancel+btn('导入','confirm-import',S.imp.agree?'':'disabled','is-primary'));
  if(m.name==='data')return shell('数据与存储',`<div class="kb-list"><div class="kb-list-row"><span>行情数据</span><span class="kb-sub">A 股与场内 ETF 日线 · 截至 ${DATA_DATE} · 1.8 GB</span></div><div class="kb-list-row"><span>回测环境</span><span class="kb-sub">已就绪 · 版本 2026.10</span></div><div class="kb-list-row"><span>数据范围</span><span class="kb-sub">日线行情、复权因子、分红送转、指数与行业、估值与财务指标</span></div></div><p class="kb-hint">行情数据全机共用，切换账号不会重复下载。清理后下次回测时重新下载；你的策略与运行记录不受影响。</p>`,btn('清理数据','noop','data-toast="已清理，下次回测时重新下载"','is-danger')+btn('立即更新','noop','data-toast="已是最新"')+btn('关闭','close-modal','','is-primary'));
  if(!st)return '';
  if(m.name==='signal')return shell('每日信号',`<p>每个交易日收盘后用最新数据运行「${esc(st.name)}」，给出当日应持仓与调仓清单。</p><label class="kb-select"><span>运行时间</span><select data-select="sig.time">${['每个交易日 15:30','每个交易日 20:00','下一交易日 8:30'].map(o=>`<option ${S.sig.time===o?'selected':''}>${o}</option>`).join('')}</select></label><label class="kb-check"><input type="checkbox" checked disabled>桌面通知与收件箱</label><label class="kb-check"><input type="checkbox" data-check="sig.sync" ${S.sig.sync?'checked':''} ${clientAttr()}>每次把应持仓同步到自选板块</label>${S.sig.sync?`<label class="kb-select"><span>自选板块</span><select data-select="sig.sector">${SECTORS.map(o=>`<option ${S.sig.sector===o?'selected':''}>${o}</option>`).join('')}</select></label><p class="kb-hint">同步会覆盖该板块原有成分。</p>`:''}<p class="kb-hint">信号直接由回测引擎计算，不重新生成策略；创建后可在「自动任务」中查看、暂停或删除。信号仅供参考，不会自动下单。</p>`,cancel+btn(st.signal?'更新':'创建','confirm-signal','','is-primary'));
  if(m.name==='alert'&&st.kind==='grid')return shell('盘中预警',`<p>把网格的每一条格价转成盘中预警，价格触及时提醒你。</p><div class="kb-list"><div class="kb-list-row"><span>沪深300ETF 跌到下一格买入价</span><span class="kb-sub">提醒买入 1000 股</span></div><div class="kb-list-row"><span>沪深300ETF 涨到下一格卖出价</span><span class="kb-sub">提醒卖出 1000 股</span></div><div class="kb-list-row"><span>价格跌破 3.60 元或突破 4.40 元</span><span class="kb-sub">提醒已破网</span></div></div><p class="kb-hint">每次成交后预警价会随所在的格自动更新。</p>`,cancel+btn('创建预警','confirm-alert','','is-primary'));
  if(m.name==='alert'&&st.kind==='dca')return shell('盘中预警','<p>定投按日期执行，没有需要盘中盯的价格条件。可以用「每日信号」在定投日提醒你。</p>',cancel+btn('改用每日信号','modal','data-modal="signal"','is-primary'));
  if(m.name==='alert'){const ok=st.kind==='timing';return shell('盘中预警',ok?`<p>把这个策略的买卖条件转成盘中预警，触发时提醒你。</p><div class="kb-list"><div class="kb-list-row"><span>沪深300ETF 的 20 日均线上穿 60 日均线</span><span class="kb-sub">提醒买入</span></div><div class="kb-list-row"><span>沪深300ETF 的 20 日均线下穿 60 日均线</span><span class="kb-sub">提醒卖出</span></div></div><p class="kb-hint">盘中按实时价格估算当日均线，可能与收盘后的结论不一致；以每日信号为准。</p>`:`<p>这个策略的买卖取决于整个股票池的排序，没有可以在盘中逐只判断的固定条件，无法准确转换成预警。</p><p class="kb-sub">可以改用「每日信号」，在每个交易日收盘后得到调仓清单。</p>`,cancel+(ok?btn('创建预警','confirm-alert','','is-primary'):btn('改用每日信号','modal','data-modal="signal"','is-primary')))}
  if(m.name==='sim'){const acc=simAccount(S.simForm.account),other=strategies.find(x=>x.sim&&x!==st&&x.sim.account===acc.id),ok=okRuns(st).length;return shell('模拟账户跟踪',!ok?'<p>这个策略还没有成功的回测结果。先运行一次回测，再开始模拟跟踪。</p>':`<p>按「${esc(st.name)}」每天的信号，在你的同花顺模拟炒股账户里买卖，看看策略在回测之后的真实表现。</p>
   <label class="kb-select"><span>模拟账户</span><select data-select="simForm.account" aria-label="模拟账户">${SIM_ACCOUNTS.map(a=>{const used=strategies.find(x=>x.sim&&x.sim.account===a.id);return `<option value="${a.id}" ${a.id===acc.id?'selected':''}>${a.name} · 可用 ${a.cash.toLocaleString()} 元${used?' · 正在跟踪「'+esc(used.name)+'」':''}</option>`}).join('')}</select></label>
   ${other?`<div class="kb-banner is-warn"><span>${acc.name}正在跟踪「${esc(other.name)}」。一个模拟账户同一时间只能跟踪一个策略，继续会停止对它的跟踪，已有持仓保留。也可以换一个模拟账户并行跟踪。</span></div>`:''}
   <label class="kb-label">投入资金（元）<input class="kb-input" type="number" data-input="simForm.capital" value="${esc(S.simForm.capital)}"></label>
   <div class="kb-label">执行方式<div class="kb-seg">${[['confirm','每次由我确认'],['auto','自动下单']].map(([id,label])=>`<button type="button" class="${S.simForm.mode===id?'is-active':''}" data-act="sim-mode" data-mode="${id}">${label}</button>`).join('')}</div><p class="kb-hint">${S.simForm.mode==='auto'?'每个交易日收盘后生成信号，下一个交易日开盘自动向模拟账户委托，结果通知你。':'每个交易日收盘后生成信号并通知你，你确认后才向模拟账户委托。'}</p></div>
   <div class="kb-banner"><span>只操作模拟账户。Lumi 不会也不能替你在真实交易账户下单。</span></div>
   <p class="kb-hint">开始跟踪会同时开启「每日信号」。停止跟踪不会自动卖出模拟账户里的持仓。</p>`,cancel+(ok?btn(other?'切换到这个策略':st.sim?'更新':'开始跟踪','confirm-sim','','is-primary'):btn('去运行回测','close-modal','','is-primary')))}
  if(m.name==='save')return shell('保存报告到文件',`<label class="kb-label">标题<input class="kb-input" data-input="rename" value="${esc(st.name)} 回测报告 ${DATA_DATE}"></label><p class="kb-hint">保存的是这一次运行的结果快照。之后重新运行或修改策略，不会改变已保存的报告。</p>`,cancel+btn('保存','confirm-save','','is-primary'));
  if(m.name==='sector'){const run=okRuns(st)[0],r=run&&compute(st,run);return shell('存为自选板块',`<p>把当前应持仓的 ${r?r.positions.length:0} 只标的存入同花顺自选板块。</p><div class="kb-seg">${[['new','新建板块'],['replace','覆盖已有板块']].map(([id,label])=>`<button type="button" class="${S.sector.mode===id?'is-active':''}" data-act="sector-mode" data-mode="${id}">${label}</button>`).join('')}</div>${S.sector.mode==='new'?`<label class="kb-label">板块名称<input class="kb-input" data-input="sector.name" value="${esc(S.sector.name||st.name)}" maxlength="12"></label>`:`<label class="kb-select"><span>板块</span><select data-select="sector.target">${SECTORS.map(o=>`<option ${S.sector.target===o?'selected':''}>${o}</option>`).join('')}</select></label><div class="kb-banner is-warn"><span>「${esc(S.sector.target)}」现有的成分会被替换为本次的 ${r?r.positions.length:0} 只。</span></div>`}`,cancel+btn(S.sector.mode==='new'?'创建':'确认覆盖','confirm-sector','',S.sector.mode==='new'?'is-primary':'is-danger'))}
  if(m.name==='rename')return shell('重命名',`<label class="kb-label">名称<input class="kb-input" data-input="rename" value="${esc(st.name)}" maxlength="30"></label>`,cancel+btn('保存','confirm-rename','','is-primary'));
  if(m.name==='delete')return shell('删除这个策略？',`<p>策略的所有版本和 ${st.runs.length} 条运行记录会一并删除。${st.signal?'关联的每日信号任务也会停止。':''}已保存到「文件」的报告不受影响。</p>`,cancel+btn('删除','confirm-delete','','is-danger'));
  if(m.name==='rollback')return shell(`回退到 v${m.ver}？`,`<p>会基于 v${m.ver} 生成一个新版本 v${st.ver+1}，现有版本和运行记录都保留。</p>`,cancel+btn('回退','confirm-rollback','','is-primary'));
  return '';
 }

 /* ---------- 交互说明 ---------- */
 const NOTES={
  home:['R1.1 导航入口「策略回测」（原「量化回测」）；页面与 Copilot 对话并排，左右可同时使用。','R1.2 首页：我的策略、策略库、数据截止日期；不在页面上放对话框，新建统一进 Copilot 对话。','R2.1–R2.3 在对话中创建：识别意图 → 补齐模糊规则（选择卡）→ 确认结构化策略 → 生成代码 → 回测 → 结果卡片；试试在对话里输入「帮我回测一下 600644，低买高卖，近两年」。','R2.2 / R2.7 只有关键歧义才追问；超出首期能力时说明并给出近似做法（试试「用 5 分钟线回测做 T」）。','R1.5 首次使用展示环境与数据准备进度，完成后自动继续。','R6.3 数据过期且客户端离线时仍可回测，并标注截止日期。','R1.4 首次进入说明与客户端同名组件的区别。','R10.5 策略库首期为官方精选；R3.5 导入外部文件需确认「将在本机执行代码」。'],
  strategy:['R4.1 / R2.5 左侧运行设置与参数面板：改完直接运行，不经过 AI（R4.2）。','R4.3 运行中展示进度与实时增长的曲线，可取消。','R8.1–R8.4 报告：指标、收益与回撤曲线、月度收益、交易明细；R8.5 每日持仓；R8.6 单标的 K 线买卖点。','R8.10 AI 解读标注「AI 生成」，不给买卖建议（R9.5）。','R9.2 多次调参后提示结果偏乐观；R9.3 样本内 / 样本外；R9.4 交易过少等提示。','R6.7 / R10.9 报告明示数据局限与自选股票池的选择偏差。','R3.3 每次保存或 AI 修改生成新版本，可回退。','R3.4 「策略」页可直接编辑代码，保存时检查语法与可用库（试试 import requests）；有未保存修改时 AI 不会覆盖。','R3.8 AI 修改后进入「改动」视图：新增与删除逐行标出，可保留、全部撤销或逐处撤销；任意两个相邻版本都可查看改动。','R4.4 运行记录留存版本、参数、设置与数据日期，可重开、可对比（R8.8）。','R4.7 运行失败给出可读原因与「让 AI 修复」。','R10.1 每日信号；R10.3 盘中预警（无法准确转换时明确告知）；R10.4 保存到文件。','R14 定投与网格：报告多出「定投视角」「网格视角」，使用各自的收益口径；网格的 K 线上画出格线，并明示日线近似的局限；网格可准确转成盘中预警。','R10.15–R10.21 模拟账户跟踪（更多 › 模拟账户跟踪）：按每日信号向模拟炒股账户下单，默认每次确认，可改为自动；只操作模拟账户；用户可有多个模拟账户，每个账户同一时间只跟踪一个策略，不同策略可各用一个账户并行；展示模拟表现与回测同期的偏差。','R10.10–R10.12 存为自选板块、点击标的打开客户端日 K、买卖点标到客户端 K 线；R10.14 客户端离线时置灰。'],
  compare:['R8.8 两次运行并排对比：指标表 + 曲线叠加，标出不同之处。','R3.3 可用于对比两个策略版本，或同一版本的不同参数。'],
  pack:['R10.5 策略库预览：说明、适合 / 不适合的场景、规则、可调参数、官方回测摘要。','下载的是独立副本，重复添加不产生第二份；下载失败不留下半成品。','官方回测摘要仅供参考，下载后以本机运行结果为准。']
 };
 function notesHtml(){
  const seg=(key,options)=>`<div class="kb-seg kb-wrap">${options.map(([id,label])=>`<button type="button" class="${S[key]===id?'is-active':''}" data-act="demo" data-key="${key}" data-value="${id}">${label}</button>`).join('')}</div>`;
  const demo=S.view==='home'?seg('dataState',[['ready','数据就绪'],['first','首次准备'],['stale','数据过期且离线']])
   :S.view==='strategy'?`<div class="kb-seg kb-wrap"><button type="button" class="${S.clientOffline?'is-active':''}" data-act="demo-offline">客户端离线</button><button type="button" class="${S.failNext?'is-active':''}" data-act="demo-fail">下次运行失败</button><button type="button" data-act="demo-tries">已调参多次</button><button type="button" data-act="demo-ai">AI 修改了策略</button></div>`
   :S.view==='pack'?`<div class="kb-seg kb-wrap"><button type="button" data-act="pack-fail">下载失败</button></div>`:'';
  return `<button type="button" class="kb-notes-toggle" data-act="toggle-notes" aria-expanded="${S.notes}">交互说明</button>${S.notes?`<aside class="kb-notes" aria-label="交互说明"><b>交互说明</b><ul>${(NOTES[S.view]||[]).map(n=>`<li>${esc(n)}</li>`).join('')}</ul>${demo?`<b>状态演示</b>${demo}`:''}</aside>`:''}`;
 }

 /* ---------- 渲染与事件 ---------- */
 const views={home,strategy:strategyView,compare:compareView,pack:packView};
 function draw(focusKey){
  if(!root)return;const old=root.querySelector('.kb-scroll'),top=old?old.scrollTop:0;
  root.innerHTML=`<div class="kb-scroll">${views[S.view]()}</div>${notesHtml()}${modalHtml()}`;
  const scroll=root.querySelector('.kb-scroll');if(scroll)scroll.scrollTop=focusKey===false?0:top;
  if(typeof focusKey==='string'){const input=root.querySelector(`[data-input="${focusKey}"]`);if(input){input.focus({preventScroll:true});const n=input.value.length;try{input.setSelectionRange(n,n)}catch{}}}
 }
 /* 回测进度只刷新右侧结果区，不打断左侧正在输入的设置 */
 function drawLive(){
  if(!root)return;const live=root.querySelector('[data-live]'),st=cur();
  if(live&&st&&S.view==='strategy'){live.innerHTML=liveHtml(st);return}
  const active=document.activeElement;if(active&&root.contains(active)&&/INPUT|TEXTAREA|SELECT/.test(active.tagName))return;
  draw();
 }
 function go(view,params={}){Object.assign(S,{view,menu:null,modal:null},params);draw(false)}
 const setPath=(path,value)=>{const [head,key]=path.split('.');if(!key){S[head]=value;return}const st=cur();if(head==='set')st.set[key]=value;else if(head==='param')st.params[+key].value=value;else if(head==='st')st[key]=value;else (S[head]||(S[head]={}))[key]=value};
 function openChat(question){if(question)state.draft=question;else if(!state.draft)state.draft='';if(state.mode!=='split')togglePageCopilot();else render({preservePage:true})}
 function startRun(st){
  if(S.run){toast('已有回测在运行，这一次已加入队列，会在当前回测结束后开始');return}
  if(new Date(st.set.end)<=new Date(st.set.start)){toast('结束日期需要晚于开始日期');return}
  for(const p of st.params){const v=+p.value;if(!(v>=p.min&&v<=p.max)){toast(`${p.label}需要在 ${p.min}–${p.max} 之间`);return}}
  const fail=S.failNext;S.failNext=false;st.error=null;S.viewRun=null;S.run={stId:st.id,pct:0,snap:snapshot(st),fail};S.tab=['report','logs'].includes(S.tab)?S.tab:'report';draw();
  const tick=()=>{
   const run=S.run;if(!run||run.stId!==st.id)return;run.pct=Math.min(100,run.pct+(st.kind==='timing'?26:9));
   if(run.fail&&run.pct>=45){S.run=null;st.error={line:14,msg:'KeyError: \'pe_ttm\' —— 所选区间内有标的缺少该指标'};addRun(st,'failed',run.snap);toast('回测失败：策略第 14 行报错');draw();return}
   if(run.pct>=100){S.run=null;st.tries++;st.updated='刚刚';const done=addRun(st,'ok',run.snap);toast(`回测完成，用时 ${compute(st,done).secs.toFixed(1)} 秒`);draw();return}
   drawLive();setTimeout(tick,320);
  };
  setTimeout(tick,320);
 }
 /* AI 修改策略：保存为新版本并自动回测，同时进入「改动」视图等待用户保留或撤销 */
 const AI_PATCH={
  fix:code=>code.includes('    targets = pe[pe > 0]')?code.replace('    targets = pe[pe > 0]','    pe = pe.dropna()                         # 跳过缺少指标的标的\n    targets = pe[pe > 0]'):code.replace('def initialize(context):','def initialize(context):\n    context.skip_missing = True              # 跳过缺少指标的标的'),
  stop:code=>{let out=code.replace(/(\n {4}run_(?:monthly|daily)\([^\n]*)/,'\n    context.stop = param("stop", 0.08)$1\n    run_daily(stop_loss)');out=out.includes('    order_target_weights({s: 1 / len(targets) for s in targets})')?out.replace('    order_target_weights({s: 1 / len(targets) for s in targets})','    weights = {s: 1 / len(targets) for s in targets}\n    order_target_weights(weights)'):out.replace('        order_target_percent(context.target, 0)','        order_target_percent(context.target, 0)     # 均线死叉，清仓');return out+'\n\ndef stop_loss(context):\n    for s, pos in context.positions.items():\n        if pos.price / pos.cost - 1 < -context.stop:\n            order_target_percent(s, 0)       # 亏损超过止损线，次日开盘卖出'}
 };
 function startRunQuiet(st){const tab=S.tab;startRun(st);S.tab=tab;draw()}
 function applyAi(st,kind,note){
  if(st.draft!=null&&st.draft!==st.code){toast('你有未保存的手动修改。请先保存或放弃，AI 不会覆盖你正在写的内容');S.tab='code';draw();return false}
  if(kind==='stop'&&st.code.includes('def stop_loss')){toast('这个策略已经有止损了，换一个策略演示');return false}
  st.draft=null;st.checkError=null;st.review={code:st.code,ver:st.ver,manual:st.manual};saveVersion(st,AI_PATCH[kind](st.code),note,'AI');st.error=null;S.tab='code';S.codeView='diff';S.diffVer=st.ver;draw(false);startRunQuiet(st);return true;
 }
 /* 对话生成策略（R2）：把对话里确认过的规则转成「我的策略」中的一条。choice 是对模糊说法的补齐选择 */
 const shiftYears=(date,years)=>{const d=new Date(date+'T00:00:00Z');d.setUTCFullYear(d.getUTCFullYear()-years);d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)};
 const NUM={一:1,二:2,两:2,三:3,四:4,五:5,十:10};
 function specFromText(text,choice=null,input={}){
  const years=[...text.matchAll(/近([一二两三四五十]|\d+)年/g)].map(m=>NUM[m[1]]||+m[1]).at(-1)||5;
  const code=(text.match(/(?<!\d)\d{6}(?!\d)/)||[])[0],single=code?(code==='600644'?'乐山电力 600644':'自选标的 '+code):'沪深300ETF 510300';
  const special=/定投/.test(text)?'dca':/网格/.test(text)?'grid':null,self=/自选/.test(text);
  const timing=!special&&(!!choice||!!code||/均线|突破|上穿|下穿|择时|布林/.test(text)),etf=/ETF/i.test(text)&&!timing;
  let kind=special||(timing?'timing':'rotate'),more;
  if(special)more={...preset(special)};
  else if(timing){
   const name=single.split(' ')[0];
   const variants={
    boll:{rules:[['标的',single],['买入','收盘价触及布林带下轨且空仓时，次日开盘买入'],['卖出','收盘价触及布林带上轨且持仓时，次日开盘卖出'],['参数','布林带 20 日、2 倍标准差'],['仓位','目标仓位 80%']],params:[param('window','布林带窗口',20,10,60,'日'),param('width','带宽倍数',2,1,3,'倍')],code:CODE.boll},
    price:{rules:[['标的',single],['买入','收盘价 ≤ '+(input.buy||'8.00')+' 元且空仓时，次日开盘买入'],['卖出','收盘价 ≥ '+(input.sell||'10.00')+' 元且持仓时，次日开盘卖出'],['仓位','目标仓位 80%']],params:[param('buy','买入价',input.buy||8,0.01,10000,'元'),param('sell','卖出价',input.sell||10,0.01,10000,'元')],code:CODE.price},
    ma:{rules:[['标的',single],['买入','收盘价低于 60 日均线 10% 以上且空仓时，次日开盘买入'],['卖出','收盘价回到 60 日均线以上且持仓时，次日开盘卖出'],['仓位','目标仓位 80%']],params:[param('ma','均线',60,20,250,'日'),param('gap','偏离幅度',10,3,30,'%')],code:CODE.ma}
   };
   const v=variants[choice]||{rules:timingRules().map(r=>r[0]==='标的'?['标的',single]:r),params:[param('fast','短均线',20,5,60,'日'),param('slow','长均线',60,20,250,'日')],code:CODE.timing};
   more={pool:'沪深300',single,params:v.params,rules:v.rules,code:v.code,drift:.0016,vol:.016};
   if(name!=='沪深300ETF')more.rules=more.rules.map(r=>r);
  }else more={pool:self?'我的自选':etf?'场内 ETF':'沪深300',params:[param('hold_num','持仓数量',self?3:etf?2:10,1,30,'只'),param('interval','调仓间隔',etf?5:20,5,60,'个交易日')],rules:rotateRules(self?'我的自选（运行时成分快照）':etf?'场内 ETF':'沪深 300 成分股',self?3:etf?2:10)};
  more.set={...defaults(),start:shiftYears(DATA_DATE,years)};
  const title=code?single.split(' ')[0]+' · '+({boll:'布林带区间',price:'固定价格区间',ma:'均线偏离'}[choice]||'均线择时'):text.replace(/^(帮我|请|我想)?(回测一下|回测)?/,'').slice(0,14);
  return {name:title,desc:text,kind,more,years};
 }
 function createFromSpec(spec,chat){
  const st=strategy(spec.name,spec.desc,spec.kind,spec.more);
  st.justCreated=true;st.fromChat=chat||spec.desc.slice(0,10);st.updated='刚刚';st.versions=[{ver:1,time:'刚刚',note:'对话生成',by:'AI',code:st.code}];strategies.unshift(st);draw();return st.id;
 }
 const byId=id=>strategies.find(x=>x.id===id);
 function progress(id){const st=byId(id);if(!st)return {missing:true};if(S.run?.stId===id){const r=compute(st,S.run.snap);return {running:true,pct:S.run.pct,date:r.dates[Math.max(0,Math.floor(r.weeks*S.run.pct/100)-1)]}}const last=st.runs[0];return {running:false,status:last?.status||'none',error:st.error}}
 function summary(id){const st=byId(id),run=st&&okRuns(st)[0];if(!run)return null;const r=compute(st,run);return {name:st.name,ver:st.ver,total:r.m.total,annual:r.m.annual,mdd:r.m.mdd,sharpe:r.m.sharpe,vol:r.m.vol,bench:r.b.total,count:r.count,win:r.win,start:run.set.start,end:run.set.end,benchmark:run.set.benchmark,eq:r.eq,bm:r.bm,dataDate:run.dataDate,secs:r.secs,code:st.code}}
 function open(id){Object.assign(S,{view:'strategy',stId:id,tab:'report',viewRun:null,cmp:null,menu:null,modal:null});if(state.nav==='策略回测'&&root?.isConnected)draw(false);else navigate('策略回测')}
 const acts={
  noop(el){S.menu=null;if(el.dataset.toast)toast(el.dataset.toast);else draw()},
  go(el){go(el.dataset.view)},
  'open-strategy'(el){go('strategy',{stId:el.dataset.id,tab:'report',viewRun:null,cmp:null,tradeStock:'全部'})},
  'open-pack'(el){go('pack',{packId:el.dataset.id})},
  tab(el){S.tab=el.dataset.tab;S.menu=null;draw()},
  seg(el){S[el.dataset.key]=el.dataset.value;draw()},
  menu(el){S.menu=S.menu===el.dataset.menu?null:el.dataset.menu;draw()},
  'row-menu'(el){S.menu=S.menu===el.dataset.id?null:el.dataset.id;draw()},
  modal(el){S.menu=null;S.modal={name:el.dataset.modal};if(el.dataset.modal==='sim'&&cur()?.sim)S.simForm={mode:cur().sim.mode,capital:cur().sim.capital,account:cur().sim.account};if(el.dataset.modal==='signal'&&cur()?.signal)S.sig={time:cur().signal.time,sync:!!cur().signal.sector,sector:cur().signal.sector||'回测持仓'};draw()},
  'close-modal'(el,e){if(el.classList.contains('kb-backdrop')&&e.target!==el)return;S.modal=null;draw()},
  'toggle-notes'(){S.notes=!S.notes;draw()},
  demo(el){S[el.dataset.key]=el.dataset.value;S.pending=null;draw()},
  'demo-offline'(){S.clientOffline=!S.clientOffline;draw()},
  'demo-fail'(){S.failNext=!S.failNext;toast(S.failNext?'下一次运行将演示失败':'已取消');draw()},
  'demo-tries'(){cur().tries=7;draw()},
  'new-in-chat'(){openChat();toast('在对话中描述你的策略，AI 会先补齐规则请你确认')},
  'hide-tip'(){S.tipClient=false;draw()},
  run(){startRun(cur())},
  'cancel-run'(){const st=cur(),run=S.run;S.run=null;if(run)addRun(st,'cancelled',run.snap);toast('已取消，回测进程已结束');draw()},
  'reset-settings'(){cur().set=defaults();toast('已恢复默认设置');draw()},
  'view-run'(el){S.viewRun=el.dataset.id;S.tab='report';draw(false)},
  'view-latest'(){S.viewRun=null;draw()},
  compare(el){go('compare',{cmp:el.dataset.id})},
  'filter-stock'(el){S.tradeStock=el.dataset.stock;S.menu=null;draw()},
  'open-kline'(el){S.menu=null;toast('已在同花顺客户端打开 '+el.dataset.stock+' 的日 K 页');draw()},
  'mark-kline'(el){S.menu=null;toast('已把 '+el.dataset.stock+' 的买卖点标到客户端 K 线，可在 K 线上一键清除');draw()},
  'chat-edit'(){const st=cur();openChat('修改策略「'+st.name+'」：');toast('已在对话中带上这个策略，说出想怎么改，修改后生成新版本并重新回测')},
  'ai-fix'(){const st=cur();toast('AI 正在根据报错修改策略…');setTimeout(()=>{if(cur()===st)applyAi(st,'fix','AI 修复：跳过缺少指标的标的')},900)},
  'demo-ai'(){applyAi(cur(),'stop','对话修改：加入 8% 止损')},
  'code-view'(el){S.codeView=el.dataset.view;if(el.dataset.view==='diff')S.diffVer=cur().ver;draw()},
  'view-diff'(el){S.codeView='diff';S.diffVer=+el.dataset.ver;draw()},
  'edit-code'(){const st=cur();if(st.review){toast('先保留或撤销 AI 的修改，再手动编辑');return}st.draft=st.code;st.checkError=null;S.codeView='code';draw('st.draft')},
  'cancel-edit'(){const st=cur();st.draft=null;st.checkError=null;toast('已放弃修改');draw()},
  'save-code'(el){const st=cur(),code=(st.draft||'').replace(/\s+$/,'');if(code===st.code){toast('代码没有变化');return}
   const lib=code.match(/^\s*(?:import|from)\s+(requests|os|subprocess|socket|urllib)\b/m);
   if(lib){st.checkError='不能使用 '+lib[1]+'：回测环境只包含预置的库，且不允许联网或访问本机文件。';draw();return}
   if(!/def initialize\(/.test(code)){st.checkError='缺少 initialize(context) 函数，引擎无法启动这个策略。';draw();return}
   st.draft=null;st.checkError=null;st.manual=true;saveVersion(st,code,'手动编辑','手动');S.codeView='diff';S.diffVer=st.ver;toast('已保存为 v'+st.ver);if(el.dataset.run)startRunQuiet(st);else draw()},
  'keep-ai'(){const st=cur();st.review=null;st.manual=false;toast('已保留 AI 的修改');draw()},
  'undo-ai'(){const st=cur(),r=st.review;if(S.run?.stId===st.id)S.run=null;st.versions=st.versions.filter(v=>v.ver<=r.ver);st.ver=r.ver;st.code=r.code;st.manual=r.manual;st.review=null;S.codeView='code';S.diffVer=null;toast('已撤销 AI 的修改，恢复到 v'+st.ver);draw()},
  'undo-hunk'(el){const st=cur(),h=+el.dataset.h,rows=diffLines(st.review.code,st.code),code=rows.filter(r=>r.t===' '||(r.h===h?r.t==='-':r.t==='+')).map(r=>r.s).join('\n');
   if(code===st.review.code){acts['undo-ai']();return}st.code=code;st.versions[0].code=code;toast('已撤销这一处，其余修改保留。重新运行后结果才会更新');draw()},
  rollback(el){S.modal={name:'rollback',ver:+el.dataset.ver};draw()},
  'confirm-rollback'(){const st=cur(),from=S.modal.ver;st.review=null;st.draft=null;saveVersion(st,verCode(st,from),'回退自 v'+from,'');S.modal=null;toast('已生成 v'+st.ver+'，可重新运行查看结果');draw()},
  'confirm-signal'(){const st=cur();st.signal={time:S.sig.time,sector:S.sig.sync?S.sig.sector:''};S.modal=null;toast('已创建每日信号，可在「自动任务」中管理');draw()},
  'signal-off'(){const st=cur();if(st.sim){toast('模拟账户跟踪依赖每日信号。请先停止跟踪');return}st.signal=null;toast('已关闭每日信号');draw()},
  'confirm-alert'(){cur().alert=true;S.modal=null;toast('已创建 2 条盘中预警，可在「自动任务 › 预警」中管理');draw()},
  'sim-mode'(el){S.simForm.mode=el.dataset.mode;draw()},
  'confirm-sim'(){const st=cur(),cap=+S.simForm.capital;if(!okRuns(st).length)return;const acc=simAccount(S.simForm.account);if(!(cap>=10000&&cap<=acc.cash)){toast('投入资金需要在 1 万到该模拟账户可用资金（'+acc.cash.toLocaleString()+' 元）之间');return}for(const x of strategies)if(x!==st&&x.sim?.account===acc.id)x.sim=null;st.sim={mode:S.simForm.mode,capital:S.simForm.capital,account:acc.id,paused:false,orders:'pending'};if(!st.signal)st.signal={time:'每个交易日 15:30',sector:''};S.modal=null;S.tab='report';toast('已开始模拟账户跟踪，下一次信号生成后'+(st.sim.mode==='auto'?'自动下单':'通知你确认'));draw()},
  'sim-order'(){cur().sim.orders='sent';toast('已向模拟账户提交委托，可在客户端「模拟炒股」中查看');draw()},
  'sim-skip'(){cur().sim.orders='skipped';toast('已跳过这一次');draw()},
  'sim-pause'(){const sim=cur().sim;sim.paused=!sim.paused;toast(sim.paused?'已暂停下单，信号照常生成':'已恢复');draw()},
  'sim-stop'(){cur().sim=null;toast('已停止跟踪。模拟账户里的持仓保留，不会自动卖出');draw()},
  'confirm-save'(){S.modal=null;toast('已保存到「文件」');draw()},
  'sector-mode'(el){S.sector.mode=el.dataset.mode;draw()},
  'confirm-sector'(){const name=S.sector.mode==='new'?(S.sector.name||cur().name):S.sector.target;S.modal=null;toast((S.sector.mode==='new'?'已创建自选板块「':'已覆盖自选板块「')+name+'」');draw()},
  'confirm-rename'(){const name=(S.rename||'').trim();if(!name){toast('请填写名称');return}cur().name=name;S.modal=null;S.rename='';draw()},
  duplicate(){const st=cur(),copy={...st,id:'s'+(++seq),name:st.name+' 副本',source:'自建',fromPack:null,signal:null,sim:null,alert:false,set:{...st.set},params:st.params.map(p=>({...p})),versions:[{ver:1,time:'刚刚',note:'复制自「'+st.name+'」'}],ver:1,review:null,draft:null,runs:[],tries:0,updated:'刚刚',justCreated:false};strategies.unshift(copy);go('strategy',{stId:copy.id,tab:'report'});toast('已复制，运行记录不随之复制')},
  'confirm-delete'(){const st=cur();if(S.run?.stId===st.id)S.run=null;strategies.splice(strategies.indexOf(st),1);const p=packs.find(x=>x.stId===st.id);if(p)p.stId=null;toast('已删除策略及其运行记录');go('home')},
  'confirm-import'(){const st=strategy('朋友分享的策略','从文件导入。','rotate',{source:'导入',params:[param('hold_num','持仓数量',5,1,30,'只')],rules:rotateRules('中证 500 成分股',5),pool:'中证500',versions:[{ver:1,time:'刚刚',note:'从文件导入'}]});strategies.unshift(st);S.imp.agree=false;go('strategy',{stId:st.id,tab:'code'});toast('已导入，运行前可以先看一下规则与代码')},
  'add-pack'(el){const p=packs.find(x=>x.id===el.dataset.id);if(p.stId){toast('已添加过，不会重复创建');return}S.downloading[p.id]=10;draw();const tick=()=>{if(S.downloading[p.id]===-1||S.downloading[p.id]==null)return;S.downloading[p.id]+=30;if(S.downloading[p.id]>=100){delete S.downloading[p.id];const st=strategy(p.name,p.intro,p.kind,PRESET[p.kind]?{source:'策略库',fromPack:p.id,...preset(p.kind),versions:[{ver:1,time:'刚刚',note:'从策略库下载'}]}:{source:'策略库',fromPack:p.id,rules:p.rules,pool:p.kind==='timing'?'场内 ETF':'沪深300',single:p.kind==='timing'?'沪深300ETF 510300':undefined,params:p.kind==='timing'?[param('fast','短均线',20,5,60,'日'),param('slow','长均线',60,20,250,'日')]:[param('hold_num','持仓数量',10,1,30,'只'),param('interval','调仓间隔',20,5,60,'个交易日')],versions:[{ver:1,time:'刚刚',note:'从策略库下载'}]});strategies.unshift(st);p.stId=st.id;toast('已添加到「我的策略」');go('strategy',{stId:st.id,tab:'report'});return}draw();setTimeout(tick,350)};setTimeout(tick,350)},
  'pack-fail'(){S.downloading[S.packId]=-1;draw()}
 };
 function bind(){
  root.onclick=e=>{const el=e.target.closest('[data-act]');if(!el||el.disabled){if(S.menu&&!e.target.closest('.kb-menu')){S.menu=null;draw()}return}e.stopPropagation();acts[el.dataset.act]?.(el,e)};
  root.onkeydown=e=>{if(e.key==='Escape'&&(S.modal||S.menu)){S.modal=null;S.menu=null;draw();return}if((e.key==='Enter'||e.key===' ')&&e.target.matches('.kb-card')){e.preventDefault();e.target.click()}if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&e.target.matches('[data-input="prompt"]'))acts.generate()};
  root.oninput=e=>{const key=e.target.dataset.input;if(!key)return;setPath(key,e.target.value);if(key==='q')draw('q')};
  root.onchange=e=>{const t=e.target;if(t.dataset.select){setPath(t.dataset.select,t.value);draw()}else if(t.dataset.check){setPath(t.dataset.check,t.checked);draw()}};
 }
 function mount(wb){
  root=document.createElement('section');root.className='kb-page bt-page';root.dataset.morePage='backtest';root.setAttribute('aria-label','策略回测');wb.append(root);bind();draw();return root;
 }
 return {mount,codeOf:id=>byId(id)?.code,specFromText,createFromSpec,progress,summary,open,run:id=>{const st=byId(id);if(st)startRun(st)},cancel:id=>{if(S.run?.stId===id)acts['cancel-run']()},aiStop:id=>{const st=byId(id);return !!st&&applyAi(st,'stop','对话修改：加入 8% 止损')}};
})();
