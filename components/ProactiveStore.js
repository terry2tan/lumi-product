/* 主动服务 Agent 的共享演示数据：目标（含原自动任务迁移来的定时检查）、Lumi 的建议、信息流卡片与后台运行记录。
   对应需求稿 lumi/docs/requirements-pool/workflow/proactive-agent/REQUIREMENTS.md（R4、R5、R6、R8）。
   GoalsPage、LumiFeed 与 LumiProfile 都从这里读写，保证同一份事实。 */
window.ProactiveStore=(()=>{
  /* 信号目录（SIGNAL-CATALOG.md）的演示子集。ready=false 表示数据尚未就绪，只能登记为「暂时盯不了」。 */
  const signals=[
    {id:'A1',group:'行情异动',name:'涨跌幅越阈',mode:'实时',ready:true},
    {id:'A3',group:'行情异动',name:'异常放量',mode:'实时',ready:true},
    {id:'A4',group:'行情异动',name:'主力资金异动',mode:'实时',ready:true},
    {id:'A6',group:'行情异动',name:'触及我画的线',mode:'实时',ready:true},
    {id:'C1',group:'公告与研报',name:'重要公告（订单、业绩预告、增减持等）',mode:'每天 4 次',ready:true},
    {id:'C6',group:'公告与研报',name:'监管事项（问询函、立案、处罚）',mode:'每天 4 次',ready:true},
    {id:'E2',group:'公告与研报',name:'研报评级与目标价变化',mode:'每天',ready:true},
    {id:'C2',group:'公告与研报',name:'业绩与市场预期的差距',mode:'—',ready:false,reason:'缺少一致预期数据'},
    {id:'D1',group:'日历',name:'财报披露日临近',mode:'每天',ready:false,reason:'事件日历接口未就绪'},
    {id:'G1',group:'持仓',name:'持仓盈亏与回撤',mode:'—',ready:false,reason:'缺少持仓数据'}
  ];
  const signal=id=>signals.find(item=>item.id===id);
  const channels=['应用内','微信','飞书'];

  /* 检查项是两种之一：signal（有实质变化才提醒，后台只读）与 timed（到点必给结果，沿用原自动任务的权限与执行保障）。 */
  const goals=[
    {id:'g1',title:'跟踪算力主题的共同风险',desc:'对照科华数据与太辰光，关注订单与业绩兑现。',status:'active',origin:'对话中确认 · 10月8日',securities:['科华数据','太辰光'],push:['应用内'],
      checks:[{kind:'signal',signal:'C1'},{kind:'signal',signal:'A1'},{kind:'signal',signal:'A4'},{kind:'signal',signal:'E2'},{kind:'signal',signal:'C2'}],
      progress:[{at:'今天 08:50',text:'科华数据披露新签数据中心订单，太辰光无新公告；板块资金小幅净流入。',notified:true,card:'f1'},{at:'10月10日 15:10',text:'没有新的变化。',notified:false},{at:'10月9日 11:35',text:'太辰光获机构调研，关注点集中在海外客户订单。',notified:true}],
      note:'你更在意回撤而不是短线涨幅，同类消息合并提醒。\n科华数据：看订单兑现节奏与现金流。\n太辰光：看海外客户集中度。'},
    {id:'g4',title:'盘前情报',desc:'每个交易日开盘前，整理隔夜外盘、政策要闻和自选股公告。',status:'active',origin:'由「自动任务」迁移 · 10月14日',migrated:true,securities:[],push:['应用内','微信'],
      checks:[{kind:'timed',rule:'每个交易日',time:'08:30',prompt:'整理隔夜外盘、政策要闻和我自选股的新公告，生成 3 条盘前要点。'}],
      progress:[{at:'今天 08:30',text:'已生成今日盘前要点，并推送到微信。',notified:true,card:'f2'},{at:'10月13日 08:30',text:'已生成，并推送到微信。',notified:true}],
      runs:[{at:'今天 08:30',status:'成功',took:'48 秒'},{at:'10月13日 08:30',status:'成功',took:'52 秒'},{at:'10月10日 08:30',status:'成功',took:'45 秒'},{at:'10月9日 08:30',status:'离线错过',took:'—'},{at:'10月8日 08:30',status:'成功',took:'50 秒'}],note:''},
    {id:'g5',title:'收盘复盘',desc:'收盘后复盘自选股表现；盘中有大幅波动也及时告诉我。',status:'active',origin:'由「自动任务」迁移 · 10月14日，之后添加了盯盘',migrated:true,securities:['自选股'],push:['应用内','飞书'],
      checks:[{kind:'timed',rule:'每个交易日',time:'15:30',prompt:'复盘我自选股今天的涨跌、成交和板块表现，列出明天需要留意的地方。'},{kind:'signal',signal:'A1'}],
      progress:[{at:'昨天 15:30',text:'今天没有需要特别留意的变化，已按时给出复盘。',notified:true,card:'f4'},{at:'昨天 14:21',text:'太辰光突破你画的 52.00，已提醒。',notified:true,card:'f3'}],
      runs:[{at:'昨天 15:30',status:'成功',took:'61 秒'},{at:'10月10日 15:30',status:'成功',took:'58 秒'},{at:'10月9日 15:30',status:'成功',took:'66 秒'}],note:''},
    {id:'g2',title:'关注持仓的关键变化',desc:'合并公告、业绩和行业消息，减少重复提醒。',status:'active',origin:'手动创建 · 10月6日',securities:['科华数据','太辰光','铂力特'],push:['应用内'],
      checks:[{kind:'signal',signal:'C1'},{kind:'signal',signal:'A3'},{kind:'signal',signal:'G1'}],
      progress:[{at:'10月10日 08:50',text:'铂力特发布回购进展公告，金额较小，没有提醒你。',notified:false}],note:'只提醒与持仓直接相关的变化。'},
    {id:'g3',title:'建立投资偏好',desc:'已整理投资周期、风险偏好和提醒方式。',status:'done',origin:'手动创建 · 10月5日',securities:[],push:['应用内'],checks:[],progress:[{at:'10月6日',text:'已完成。',notified:false}],note:''}
  ];
  const candidates=[
    {id:'c1',title:'留意铂力特的产能与交付节奏',desc:'你最近两次问到铂力特的交付情况。可以由我每天看一次新公告与订单变化。',why:'依据：10月10日、10月11日的两次对话',checks:[{kind:'signal',signal:'C1'}],securities:['铂力特']},
    {id:'c2',title:'跟踪日债收益率对成长风格的影响',desc:'你问过海外利率变化会不会传导到 A 股成长板块。',why:'依据：10月11日的一次对话',checks:[{kind:'signal',signal:'E2'}],securities:[]}
  ];

  /* 信息流卡片：insight=主动提醒（信号型）、timed=定时报告、alert=预警跟进。 */
  const feed=[
    {id:'f1',kind:'insight',goal:'g1',source:'盘前检查',day:'今天',time:'08:50',unread:true,
      title:'科华数据新签数据中心订单，太辰光暂无新消息',summary:'金额约占去年营收的 6%，对你关注的「订单兑现」是正面进展。',
      body:'科华数据昨晚披露新签一笔数据中心项目订单，金额约占去年营收的 6%，交付集中在明年上半年，对你关注的「订单兑现」是正面进展。\n\n太辰光没有新公告；算力板块昨日资金小幅净流入，两家公司的共同风险暂时没有变化。',
      evidence:['科华数据《关于签订日常经营合同的公告》 · 10月11日 19:32','算力板块资金流向 · 10月11日收盘','科华数据日 K 与成交量 · 今天 08:50'],
      follow:['这笔订单对全年业绩影响有多大？','对比两家公司今年的订单情况']},
    {id:'f2',kind:'timed',goal:'g4',source:'盘前情报 · 每个交易日 08:30',day:'今天',time:'08:30',unread:false,pushed:'已同时推送到微信',
      title:'今日盘前要点：隔夜美股科技股走强，留意算力与消费电子',summary:'3 条要点，其中 1 条与你的自选股有关。',
      body:'1. 隔夜纳斯达克上涨 1.2%，半导体与云计算领涨，A 股算力方向开盘可能受带动。\n\n2. 苹果削减新机订单的传闻仍在发酵，消费电子的分歧可能加大。\n\n3. 你的自选股昨晚有 1 条新公告：科华数据新签数据中心订单，详见另一张提醒卡片。',
      evidence:['隔夜外盘收盘数据 · 今天 05:00','你的自选股公告 · 截至今天 08:20'],follow:['展开讲讲第一条']},
    {id:'f3',kind:'alert',goal:'g5',source:'预警跟进 · 太辰光 突破 52.00',day:'昨天',time:'14:21',unread:false,
      title:'太辰光突破你画的 52.00，暂未发现消息面原因',summary:'光通信板块同步走强，成交量约为近 20 日均量的 2.1 倍。',
      body:'太辰光 14:21 突破你画的 52.00 水平线。同时段没有新的公告或研报；光通信板块整体上涨、龙头同步放量，更像板块联动，而不是个股消息。\n\n成交量约为近 20 日均量的 2.1 倍。',
      evidence:['太辰光分时与成交量 · 昨天 14:21','光通信板块涨跌与资金 · 昨天 14:21'],follow:['这次上涨能持续吗？']},
    {id:'f4',kind:'timed',goal:'g5',source:'收盘复盘 · 每个交易日 15:30',day:'昨天',time:'15:30',unread:false,pushed:'已同时推送到飞书',
      title:'收盘复盘：今天没有需要特别留意的变化',summary:'自选股整体跟随大盘，没有单只异动；明天留意算力板块的量能。',
      body:'今天你的自选股整体跟随大盘，没有单只股票出现异常波动或成交放大。\n\n明天可以留意两点：算力板块午后回落后的量能是否恢复；太辰光突破 52.00 后能否站稳。',
      evidence:['自选股收盘数据 · 昨天 15:00'],follow:['明天开盘先看什么？']}
  ];
  const runs=[
    {at:'今天 10:12',trigger:'空闲时',goal:'g2',result:'无事可报',tone:'',detail:'检查了 3 只持仓的新公告，没有发现新的变化。'},
    {at:'今天 08:50',trigger:'盘前检查',goal:'g1',result:'已提醒',tone:'ok',detail:'科华数据新签订单属于目标关注的变化，且近 3 天未提醒过同类内容。',card:'f1'},
    {at:'今天 08:30',trigger:'定时 · 盘前情报',goal:'g4',result:'已给出结果',tone:'ok',detail:'按时生成并推送到微信。',card:'f2'},
    {at:'昨天 15:30',trigger:'定时 · 收盘复盘',goal:'g5',result:'已给出结果',tone:'ok',detail:'没有新变化，仍按时给出复盘。',card:'f4'},
    {at:'昨天 15:10',trigger:'收盘后检查',goal:'g1',result:'已拦截 · 内容重复',tone:'mute',detail:'结论与当天 11:35 已提醒的内容基本相同，没有再次打扰你。'},
    {at:'昨天 15:20',trigger:'目标发现',goal:null,result:'新增 2 条建议',tone:'lumi',detail:'回看了当天 3 次对话，建议已放在目标页顶部。'},
    {at:'昨天 11:35',trigger:'午间检查',goal:'g1',result:'已跳过 · 行情未连接',tone:'',detail:'当时无法获取行情数据，本次不计入当天次数。'}
  ];
  const settings={volume:'少',migrationNotice:true};
  const read=new Set(),votes=new Map(),muted=new Set();
  let sequence=10;
  const emit=reason=>window.dispatchEvent(new CustomEvent('proactive:changed',{detail:{reason}}));
  const goal=id=>goals.find(item=>item.id===id);
  const card=id=>feed.find(item=>item.id===id);
  const checkLabel=check=>{
    if(check.kind==='timed')return{tag:'定时',name:`${check.rule} ${check.time} 给出结果`,mode:'到点必给',ready:true};
    const spec=signal(check.signal)||{name:check.signal,mode:'—',ready:false};
    return{tag:'盯',name:spec.name,mode:spec.ready?spec.mode:'暂时盯不了',ready:spec.ready,reason:spec.reason};
  };
  const timedCheck=item=>item.checks.find(check=>check.kind==='timed');
  function addGoal(data){
    const item={id:'g'+(++sequence),status:'active',origin:'手动创建 · 今天',securities:[],push:['应用内'],checks:[],progress:[],runs:[],note:'',...data};
    goals.unshift(item);emit('goal-added');return item;
  }
  function updateGoal(id,patch){const item=goal(id);if(!item)return;Object.assign(item,patch);emit('goal-updated')}
  function removeGoal(id){const index=goals.findIndex(item=>item.id===id);if(index>=0){goals.splice(index,1);emit('goal-removed')}}
  function acceptCandidate(id){
    const index=candidates.findIndex(item=>item.id===id);if(index<0)return null;
    const [item]=candidates.splice(index,1);
    return addGoal({title:item.title,desc:item.desc,origin:'来自 Lumi 的建议 · 今天',checks:item.checks,securities:item.securities});
  }
  function dismissCandidate(id){const index=candidates.findIndex(item=>item.id===id);if(index>=0){candidates.splice(index,1);emit('candidate-dismissed')}}
  /* 立即执行：定时检查的结果作为新的定时报告卡片进入信息流。 */
  function runNow(id){
    const item=goal(id),check=item&&timedCheck(item);if(!check)return null;
    const now=ChatStore.clock(),entry={id:'f'+(++sequence),kind:'timed',goal:id,source:`${item.title} · 立即执行`,day:'今天',time:now.time,unread:true,pushed:item.push.length>1?`已同时推送到${item.push.filter(name=>name!=='应用内').join('、')}`:'',
      title:`${item.title}：已按你的要求生成`,summary:'这是一次手动执行的结果，不影响原来的定时安排。',body:`按「${check.prompt}」生成的结果会出现在这里。\n\n这是演示内容；实际产品中，这里是本次运行的完整输出。`,evidence:[],follow:[]};
    feed.unshift(entry);(item.runs||(item.runs=[])).unshift({at:`今天 ${now.time}`,status:'成功',took:'—'});
    item.progress.unshift({at:`今天 ${now.time}`,text:'手动执行一次，结果已放进「你的 Lumi」。',notified:true,card:entry.id});
    runs.unshift({at:`今天 ${now.time}`,trigger:'立即执行',goal:id,result:'已给出结果',tone:'ok',detail:'由你手动触发。',card:entry.id});
    emit('run-now');return entry;
  }
  function markRead(id){if(!read.has(id)){read.add(id);emit('read')}}
  const isUnread=item=>!!item.unread&&!read.has(item.id);
  function vote(id,value){votes.set(id,votes.get(id)===value?null:value);emit('vote')}
  function toggleMute(goalId){muted.has(goalId)?muted.delete(goalId):muted.add(goalId);emit('mute')}
  return{signals,signal,channels,goals,candidates,feed,runs,settings,goal,card,checkLabel,timedCheck,addGoal,updateGoal,removeGoal,acceptCandidate,dismissCandidate,runNow,markRead,isUnread,vote,votes,toggleMute,muted,emit};
})();
