/* Local conversation data and session state. */
(() => {
  const watchNotes = [
    {topic:'证券',text:'证券板块午后突然发力，华鑫证券封板并带动东吴证券、天风证券及多只ETF，短线资金集中度明显提升。\n\n但大盘仍偏弱，中证2000跌幅显著深于沪深300，暂未看到政策或基本面催化，更像权重方向的情绪修复。\n\n后续看华鑫封单能否稳住、券商能否继续放量扩散；若仅龙头独强、ETF冲高回落，行情仍是脉冲，难确认市场风格反转。'},
    {topic:'券商中线',text:'这一下先别急着把它当成风格反转。中线看，券商有业绩修复和低估值支撑，机构预计行业利润仍有增长，东吴等也存在PB修复空间；但高成交能否持续仍是问号。若后续量能扩散并被业绩验证，才是趋势起点，否则仍属情绪催化，安全边际有限。'},
    {topic:'市场',text:'相比午盘，跌势有些收敛，市场从单边普跌转成弱势分化，但上涨家数仍未占优。成交明显放大，说明承接和抛压都在增加，暂不能简单当作抄底信号。跌停尚未扩散到失控，情绪是偏弱但未恐慌。中小盘仍是重灾区，先看指数能否止跌、下跌家数继续收敛，别急着追反弹。'},
    {topic:'文化传媒',text:'文化传媒午后异动暂未见明确消息催化，更像弱市中的资金试探。龙版传媒涨停带来情绪牵引，但新华文轩、电声股份能否同步放量，决定这是板块扩散还是单点脉冲。\n\n当前中证2000明显弱于沪深300，成长风格仍在退潮；若龙版封单松动、跟风回落，传媒行情大概率难脱离短线博弈。'},
    {topic:'海外利率',text:'日本10年期国债收益率回落，说明日债市场避险升温，但目前尚未形成对A股流动性或风格切换的明确传导。\n\nA股仍是中证2000明显弱于沪深300、成长指数承压的退潮格局。\n\n该消息暂不足以支撑成长反弹，更像海外利率扰动，需观察日元、全球债券及A股权重能否同步企稳。'},
    {topic:'影视院线',text:'影视院线午后走强，上海电影封板并带动华策影视、横店影视，说明资金从此前传媒单点脉冲进一步向院线方向试探，但暂未看到明确消息催化。\n\n当前中证2000明显弱于沪深300，成长风格仍在退潮，板块逆势更像情绪切换。\n\n关键看上海电影封单能否稳定、华策影视和横店影视能否持续放量补涨；若龙头开板、跟风回落，行情仍偏短线脉冲。'},
    {topic:'AI视频',text:'传媒方向出现新分支：AI视频概念上行，吉视传媒涨停，龙版传媒、华策影视、流金科技同步响应，较此前院线单点脉冲新增了题材内部扩散信号。\n\n但中证2000明显弱于沪深300，成长风格仍在退潮，暂更像弱市中的情绪切换。\n\n关键看吉视传媒封单能否稳定、跟风能否持续放量；若龙头开板且后排回落，板块仍是短线脉冲，难确认主线反转。'},
    {topic:'苹果链',text:'苹果削减iPhone 18 Pro订单，核心影响不是单一公司，而是消费电子需求预期下修。\n\n若消息属实，苹果链短线或出现冲高回落、跟风扩散失败。当前中证2000明显弱于沪深300，成长风格仍在退潮，板块承压会被放大；后续需看苹果链能否放量止跌，否则应按景气走弱理解。'},
    {topic:'消费电子中线',text:'这条消息短线会放大苹果链分歧，但中线还不能直接等同于消费电子景气反转。机构仍看好端侧AI、新品周期和高端零部件，行业业绩尚有支撑；只是iPhone 18 Pro预售偏弱尚未被最终销量验证。若后续供应商订单和盈利预期同步下修，才构成趋势走弱信号。'}
  ];
  const stockTable = {
    headers:['代码','名称','最新价','涨跌幅'],
    rows:[['600744.SH','华银电力','7.00','+10.06%'],['601231.SH','环旭电子','27.92','+10.01%'],['603601.SH','再升科技','9.96','+10.06%'],['002543.SZ','万和电气','7.90','+10.03%'],['002912.SZ','中新赛克','21.37','+9.98%'],['688568.SH','中科星图','33.49','+9.05%'],['603318.SH','水发燃气','10.09','+7.23%'],['603106.SH','恒银科技','8.16','+4.21%'],['300846.SZ','首都在线','19.75','+4.11%'],['002643.SZ','万润股份','13.37','+3.65%'],['300311.SZ','任子行','5.71','+3.44%'],['600582.SH','天地科技','4.92','+2.93%'],['300317.SZ','珈伟新能','4.28','+2.64%'],['601187.SH','厦门银行','7.45','+2.48%'],['300691.SZ','联合光电','14.62','+1.60%'],['300897.SZ','山科智能','16.28','+1.31%']]
  };
  let counter=Date.now(), messageCounter=Date.now();
  const threads=new Map();
  const clock=(d=new Date())=>{
    const zone={timeZone:'Asia/Shanghai'},parts=Object.fromEntries(new Intl.DateTimeFormat('en',{...zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).map(part=>[part.type,part.value]));
    return{timestamp:d.getTime(),date:`${parts.year}-${parts.month}-${parts.day}`,time:d.toLocaleTimeString('zh-CN',{...zone,hour:'2-digit',minute:'2-digit',hour12:false}),day:`${Number(parts.month)}月${Number(parts.day)}日`};
  };
  const message=(role,text,extra={})=>({id:`message-${++messageCounter}`,role,text,time:'10:43',day:'10月8日',status:role==='user'?'已读':null,...extra});
  const messageText=item=>[item.text,item.table?[item.table.headers,...item.table.rows].map(row=>row.join('\t')).join('\n'):null,item.after,item.relatedTargets?.length?LumiRelatedTargets.text(item.relatedTargets):null].filter(Boolean).join('\n\n');
  const sameQuote=(a,b)=>!a&&!b||!!a&&!!b&&a.id===b.id&&a.text===b.text;
  const create=(title='新对话',extra={})=>{const thread={id:`thread-${++counter}`,title,kind:'regular',messages:[],draft:'',scrollTop:null,pending:false,...extra};threads.set(thread.id,thread);return thread};
  const stockReply=()=>({text:'放量突破20日线的选股，我先按成交量放大、价格突破20日均线整理候选。',reasoning:'先按成交量放大、价格突破20日均线整理候选，再按涨跌幅查看。放量只是筛选条件，还需要观察突破后的承接和量能持续性。',table:stockTable,after:'其中 5 只当日涨停（华银电力、环旭电子、再升科技、万和电气、中新赛克）。放量只是筛选条件，还要结合突破后的承接、量能持续性和回撤观察。\n\n需要我把这些股票归进一个自选板块，或者对其中某只做进一步分析吗？',source:'同花顺 · 2026-09-10',elapsed:'58秒'});
  const seeds={
    '今日市场行情分析':{prompt:'放量突破二十日线的股票',reply:stockReply()},
    '产业链与市场空间':{prompt:'帮我梳理 CPO 产业链和市场空间的研究框架。',reply:{text:'可以先按上游器件、中游封装与光模块、下游算力需求拆开。产业链位置不同，订单、产能与利润兑现的节奏也不同。\n\n研究时，把需求预期和已兑现的收入区分开，重点跟踪客户验证、订单交付、产品结构和毛利率变化。\n\n我把产业链结构放在报告里，后续可以继续补充你关注的公司。',report:true}},
    '重点公司财务对比':{prompt:'重点公司的财务对比，先看哪些指标？',reply:{text:'先用同一报告期对齐三个维度：收入增长、利润质量、经营现金流。\n\n收入看增长来自产品放量还是价格变化；利润看毛利率、费用率及非经常性损益；现金流看回款是否跟上收入，以及应收和存货是否同时增加。',table:{headers:['维度','重点观察'],rows:[['收入','增长来源、产品结构、交付节奏'],['利润','毛利率、费用率、经常性利润'],['现金流','经营现金流、应收账款、存货']]}}},
    '今日电力板块异动':{prompt:'电力板块异动，帮我整理一下观察重点。',reply:{text:'先看龙头强度和板块跟随，而不是只看一只股票的涨幅。\n\n华银电力可以作为观察样本，继续跟踪成交量、封单和板块内其他公司的响应。如果只有龙头独强、后排冲高回落，先按短线脉冲观察。'}},
    '政策与资金面跟踪':{prompt:'从资金面看，午后的反弹能确认吗？',reply:{text:watchNotes[2].text}},
    '高股息候选筛选':{prompt:'高股息候选，帮我列一下筛选条件。',reply:{text:'先把分红稳定性、现金流覆盖和资产负债情况放在一起看。股息率只是一项条件，不能替代对盈利持续性的判断。\n\n可以先筛选连续分红、经营现金流能覆盖分红、债务结构清晰的公司，再对照行业周期和未来资本开支。'}},
    '现金流与估值对比':{prompt:'现金流与估值对比应该怎么整理？',reply:{text:'先看经营现金流能否持续覆盖资本开支，再把自由现金流与估值放到同一张表里。\n\n对比时统一报告期，剔除一次性项目，并区分行业周期、现金流稳定性和增长投入。这样才能看出估值差异背后的原因。'}},
    '半导体板块复盘':{prompt:'帮我整理半导体板块的复盘框架。',reply:{text:'把板块强弱、量能扩散和个股承接分开记录。先看指数与上涨家数，再看成交是否集中在少数龙头。\n\n个股层面，保留放量、回撤、关键位置和消息催化四项观察，避免用一次拉升替代对趋势的判断。'}},
    '财报指标整理':{prompt:'把财报里需要跟踪的指标整理一下。',reply:{text:'我按盈利、现金流和资产负债三组整理，后续可以沿用同一口径更新。',table:{headers:['类别','指标'],rows:[['盈利','营业收入、归母净利润、毛利率'],['现金流','经营现金流、资本开支、自由现金流'],['资产负债','应收账款、存货、有息负债']]}}}
  };
  function seed(title){
    const existing=[...threads.values()].find(t=>t.kind==='regular'&&t.title===title);if(existing)return existing;
    const spec=seeds[title],thread=create(title);if(spec)thread.messages=[message('user',spec.prompt),message('assistant',spec.reply.text,{...spec.reply})];
    if(title==='产业链与市场空间')thread.messages[1].files=[
      {id:'cpo-company-comparison',title:'重点公司对比',type:'text',text:'对比范围：光模块、光器件与封装环节。\n\n公司对比维度：主营产品、客户结构、研发投入、产能规划与订单交付。\n\n下一步：按同一报告期补齐财务数据，并记录每项信息的出处。'},
      {id:'cpo-market-sizing',title:'市场空间测算',type:'text',text:'测算路径：数据中心建设规模 × 单机连接数量 × 产品单价。\n\n情景划分：保守、基准与积极情景，分别调整渗透率、出货量与价格假设。\n\n敏感性分析：优先观察出货节奏和产品单价变化对市场规模的影响。'},
      {id:'cpo-financial-metrics',title:'财务指标整理',type:'text',text:'收入：按产品与地区拆分，记录增长来源。\n\n盈利：对齐毛利率、研发费用率与经常性利润。\n\n现金流：结合应收账款、存货和经营现金流检查利润质量。'},
      {id:'cpo-research-checklist',title:'研究跟踪清单',type:'text',text:'产品验证：跟踪客户认证和新产品量产进度。\n\n产能与订单：核对新增产能、订单可见度和交付节奏。\n\n风险观察：记录技术路线变化、客户集中度、价格竞争与资本开支变化。'}
    ];
    return thread;
  }
  const lumi=create('你的 Lumi',{id:'lumi',kind:'personal'});threads.delete(`thread-${counter}`);threads.set('lumi',lumi);
  const lumiProfile={risk:'稳健',horizon:'3～6个月',reminders:'仅持仓相关的关键变化，合并同类消息',holdings:[
    {name:'科华数据',weight:22,theme:'算力基础设施'},
    {name:'太辰光',weight:18,theme:'光通信与算力'},
    {name:'铂力特',weight:14,theme:'高端制造'}
  ]};
  lumi.profile=lumiProfile;lumi.scrollTop=0;
  const lumiIntroduction=[
    {text:'你好，我是 Lumi，你的个人投资助手。',delay:900},
    {text:'你可以随时找我聊持仓、分析资讯、做复盘。与你有关的重要变化，我也会主动在这里告诉你。',delay:1700},
    {text:'要给我起个名字吗？',delay:1100,action:{label:'编辑Lumi个人资料',type:'lumi-profile'}},
    {text:'发现你最近在电池行业有很多短线交易，是否需要我帮你监控相关标的的异动和行业资讯？',delay:2200}
  ];
  /* 「你的 Lumi」进入即是动态信息流，不再先走欢迎页与自我介绍。 */
  lumi.onboarding={phase:'complete',next:lumiIntroduction.length};
  function holdingsReview(){return{text:'好，我先把持仓关系和公告观察重点放在一起。科华数据与太辰光合计占仓位 40%，我会把共同的算力线索合并整理，再区分各自公司的变化。',table:{headers:['持仓','仓位占比','公告观察重点'],rows:lumiProfile.holdings.map(holding=>[holding.name,`${holding.weight}%`,holding.name==='科华数据'?'算力基础设施项目、订单兑现与现金流':holding.name==='太辰光'?'光通信需求、客户订单与毛利率':'新增订单、产能利用与交付节奏'])},after:'你可以把近期公告发给我，我会按这张对照补上已确认的变化和待核实的内容。'}};
  function replyFor(text,thread,quote){
    if(thread.kind==='personal'&&/调整.*投资偏好|重新梳理.*投资周期/.test(text))return{text:'可以，我们先确认三件事：你通常打算持有多久、希望怎样控制回撤，以及什么变化值得在盘中提醒你。\n\n你可以直接说新的偏好，我会按你最新的说明继续这段对话。'};
    const source=quote?thread.messages.find(item=>item.id===quote.id):thread.messages.filter(item=>item.role==='assistant').at(-1);
    if(thread.kind==='personal'&&(/公告.*对照|整理.*持仓|持仓.*整理/.test(text)||/^(好|好的|可以|先整理|帮我整理)[！!。.\s]*$/.test(text)&&source?.service==='holdings-review'))return holdingsReview();
    if(quote&&/这条|这段|这句话|这件事|分析|解释/.test(text))return{text:`关于你引用的这段内容，可以先分开看已经提到的变化和仍需验证的条件。\n\n${quote.text}\n\n我们可以沿着其中的标的和观察条件继续整理，你想先看哪一部分？`};
    if(/^(你好|在吗|谢谢|好的|收到)[！!。.\s]*$/.test(text))return{text:/谢谢/.test(text)?'不客气。有新的关注点，随时告诉我。':'在的。你想先关注哪只股票或哪个板块？'};
    if(thread.kind==='regular'&&/放量|二十日|20日|选股/.test(text))return stockReply();
    if(/提醒|帮.*盯|盯一下|布置|任务|收盘后|每天/.test(text))return{text:`记下了：${text}\n\n我会围绕你提到的标的和条件继续跟进，变化留在这段对话里。`,task:{title:text,status:'待跟进'}};
    let index=/苹果|消费电子|iPhone/i.test(text)?8:/日本|日债|日元/.test(text)?4:/AI视频/.test(text)?6:/电影|院线/.test(text)?5:/传媒|龙版/.test(text)?3:/券商|证券|华鑫/.test(text)?(/中线|趋势|反转/.test(text)?1:0):/市场|大盘|行情|指数/.test(text)?2:-1;
    if(index>=0)return{text:watchNotes[index].text};
    if(thread.kind==='personal'&&/黄金|贵金属|紫金矿业|中金黄金|山东黄金/.test(text))return{text:'黄金相关公司可以先放在一起观察，再结合金价变化、成本与产量分别研究。相关标的整理在下面，你可以打开行情，或继续指定一家公司深入看。',relatedTargets:LumiRelatedTargets.gold()};
    if(/CPO|算力|产业链/i.test(text))return{...seeds['产业链与市场空间'].reply};
    const targets=thread.kind==='personal'?LumiRelatedTargets.resolve(text):[];
    if(targets.length)return{text:`我先把${targets.map(item=>item.name).join('、')}整理到相关标的里。你可以打开行情，或继续告诉我想对比估值、财务还是业务进展。`,relatedTargets:targets};
    return{text:`我记下了「${text}」。你可以继续补充关注的标的、时间范围或触发条件，我们就在这里接着聊。`};
  }
  const savedKey='thsai-codex-conversations';
  function persist(){if(!NativeBridge.available)return;try{localStorage.setItem(savedKey,JSON.stringify([...threads.values()].map(thread=>({id:thread.id,title:thread.title,kind:thread.kind,messages:thread.messages,draft:thread.draft,profile:thread.profile,attachments:thread.attachments,scrollTop:thread.scrollTop,onboarding:thread.onboarding}))))}catch{}}
  if(NativeBridge.available)try{const saved=JSON.parse(localStorage.getItem(savedKey)||'[]');for(const thread of saved)if(typeof thread.id==='string'&&Array.isArray(thread.messages))threads.set(thread.id,{...thread,pending:false})}catch{}
  for(const thread of threads.values())for(const item of thread.messages){
    const savedId=/^message-(\d+)$/.exec(item.id);
    if(savedId)messageCounter=Math.max(messageCounter,Number(savedId[1]));
  }
  const restoredLumi=threads.get('lumi');
  if(restoredLumi&&restoredLumi.onboarding?.phase!=='complete')restoredLumi.onboarding={phase:'complete',next:lumiIntroduction.length};
  addEventListener('conversation:changed',event=>{if(event.detail.reason!=='stream')persist()});addEventListener('pagehide',persist);
  let requestSequence=0;
  const changed=(id,reason='update',messageId=null)=>window.dispatchEvent(new CustomEvent('conversation:changed',{detail:{id,reason,messageId}}));
  let introTimer=null,introGeneration=0;
  function resumeLumiIntroduction(){
    const thread=threads.get('lumi');
    if(!thread||thread.onboarding?.phase!=='introducing'||introTimer!==null)return false;
    const token=introGeneration;
    const retry=()=>{introTimer=setTimeout(()=>{introTimer=null;resumeLumiIntroduction()},1000)};
    if(thread.pending){retry();return true}
    const index=thread.onboarding.next,spec=lumiIntroduction[index];
    if(!spec){thread.onboarding.phase='complete';thread.introTyping=false;changed('lumi','lumi-ready');return true}
    thread.introTyping=true;
    introTimer=setTimeout(()=>{
      introTimer=null;
      if(token!==introGeneration||threads.get('lumi')!==thread||thread.onboarding.phase!=='introducing')return;
      thread.introTyping=false;
      if(thread.pending){retry();changed('lumi','lumi-intro-typing');return}
      const answer=message('assistant',spec.text,{...clock(),origin:'initial',introductionIndex:index,...(spec.action?{action:spec.action}:{})});
      thread.messages.push(answer);thread.onboarding.next=index+1;thread.pendingScroll='bottom';
      const finished=thread.onboarding.next===lumiIntroduction.length;
      if(finished)thread.onboarding.phase='complete';
      // Reserve the pause before publishing, so a remount cannot start another timer.
      if(!finished)introTimer=setTimeout(()=>{introTimer=null;resumeLumiIntroduction()},550);
      changed('lumi',finished?'lumi-ready':'lumi-intro',answer.id);
    },spec.delay);
    changed('lumi','lumi-intro-typing');return true;
  }
  function startLumi(){
    const thread=threads.get('lumi');if(thread?.onboarding?.phase!=='welcome')return false;
    thread.onboarding.phase='introducing';thread.onboarding.next=0;thread.pendingScroll='bottom';
    changed('lumi','lumi-start');resumeLumiIntroduction();return true;
  }
  addEventListener('pagehide',()=>{introGeneration++;clearTimeout(introTimer);introTimer=null;const thread=threads.get('lumi');if(thread)thread.introTyping=false});
  addEventListener('pageshow',event=>{if(event.persisted)resumeLumiIntroduction()});
  function enrichRelated(thread,answer){
    if(thread.kind!=='personal'||!FuyaoData.available())return;
    LumiRelatedTargets.enrich(answer).then(added=>{if(added&&threads.get(thread.id)===thread&&thread.messages.includes(answer))changed(thread.id,'related-targets',answer.id)}).catch(()=>{});
  }
  function appendProactive(note,poolIndex){
    const thread=threads.get('lumi');if(!thread||thread.pending||thread.onboarding?.phase!=='complete'||!note?.text)return false;
    const answer=message('assistant',note.text,{...clock(),topic:note.topic,origin:note.origin||'proactive',poolIndex,relatedTargets:note.relatedTargets});LumiRelatedTargets.prepare(answer,{live:FuyaoData.available()});thread.messages.push(answer);
    thread.pendingScroll='bottom';changed(thread.id,'proactive',answer.id);enrichRelated(thread,answer);return true;
  }
  function setProactiveTyping(typing){
    const thread=threads.get('lumi');if(!thread||typing&&thread.onboarding?.phase!=='complete'||!!thread.proactiveTyping===typing)return;
    thread.proactiveTyping=typing;if(typing)thread.pendingScroll='bottom';changed(thread.id,'proactive-typing');
  }
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const active=(thread,token)=>threads.get(thread.id)===thread&&thread.activeRequest===token;
  async function personalReceipts(thread,user,token){
    await pause(600);if(!active(thread,token)||!thread.pending)return;
    user.status='已送达';changed(thread.id);
    await pause(800);if(!active(thread,token)||!thread.pending)return;
    user.status='已读';user.receiptTime=clock().time;changed(thread.id);
  }
  function requestMessages(thread,target){
    const end=target?thread.messages.indexOf(target):thread.messages.length;
    const history=thread.messages.slice(0,end).filter(item=>['user','assistant'].includes(item.role)&&item.text.trim()).slice(-80);
    const context=typeof state==='undefined'?'首页':state.nav;
    const system=`你是同花顺 AI 中的${thread.kind==='personal'?'Lumi 个人助手':'对话助手'}，用中文回答。当前页面：${context}。行情和财务以金融数据工具实际返回的结果为准，旧历史、投资画像、项目资料与自动任务为示例内容，不能据此声称读取了最新行情、用户真实账户、文件，或实际安排了预警、自动任务、交易。没有工具结果时不要编造数据。用清晰的段落或列表回答。`;
    const profile=thread.kind==='personal'?`\nLumi 的示例投资画像与持仓：${JSON.stringify(thread.profile)}。这不是用户真实账户数据；用户在对话中的最新说明优先于此示例。初始主动服务是示例信息。后续行情更新为界面参考内容，实时查询应以工具返回结果为准，不能据此声称实际执行了任务。`:'';
    return [{role:'system',content:system+profile},...history.map(item=>({role:item.role,...(item.role==='assistant'?{reasoning_content:item.reasoning||''}:{}),content:item.quote?`引用 ${item.quote.author} 的消息：\n${item.quote.text}\n\n我的回复：\n${messageText(item)}`:messageText(item)}))];
  }
  function runRequest(thread,user,target=null){
    if(thread.pending)return false;
    const token=++requestSequence,started=Date.now(),live=!!window.NativeBridge?.available;
    const attachments=user.attachments||thread.attachments||[];if(!target){user.attachments=attachments;thread.attachments=[]}
    const messages=live?requestMessages(thread,target):null,modelOptions={...ChatModels.snapshot(),threadId:thread.id,userMessageId:user.id,regenerate:!!target,attachments};
    const preview=message('assistant','',{...clock(),streaming:true,reasoning:'',thinking:false,origin:live?'codex':'demo'});
    if(target)preview.id=target.id;
    thread.activeRequest=token;thread.pending=true;thread.pendingPhase='waiting';thread.error=null;thread.failedAnswer=null;
    thread.pendingAnswer=preview;thread.pendingTargetId=target?.id||null;
    if(target)target.regenerating=true;
    else {user.status=null;delete user.receiptTime}
    changed(thread.id);
    if(thread.kind==='personal'&&!target)personalReceipts(thread,user,token);
    // Keep a small display buffer so unusually large network chunks do not appear all at once.
    const queue=[],received={text:'',reasoning:''};let queued=0,timer=null,drained=null;
    function pump(){
      timer=null;
      if(!active(thread,token)){drained?.();return}
      const chunk=queue[0];
      if(chunk){
        const size=Math.min(32,Math.max(2,Math.ceil(queued/80))),part=chunk.chars.splice(0,size).join('');queued-=Array.from(part).length;
        if(chunk.kind==='reasoning'){
          if(!preview.reasoning){preview.thinkingOpen=true;preview.thinking=true}
          preview.reasoning+=part;thread.pendingPhase='thinking';
        }else{
          if(!preview.text){preview.thinking=false;preview.thinkingOpen=false}
          preview.text+=part;thread.pendingPhase='answer';
        }
        if(!chunk.chars.length)queue.shift();changed(thread.id,'stream',preview.id);
      }
      if(queue.length)timer=setTimeout(pump,32);else {drained?.();drained=null}
    }
    function enqueue(delta){
      if(!active(thread,token))return;
      for(const kind of ['reasoning','text']){
        const text=typeof delta[kind]==='string'?delta[kind]:'';if(!text)continue;
        received[kind]+=text;const chars=Array.from(text);queued+=chars.length;queue.push({kind,chars});
      }
      if(queue.length&&timer===null)timer=setTimeout(pump,0);
    }
    const flush=()=>queue.length?new Promise(resolve=>drained=resolve):Promise.resolve();
    (async()=>{
      if(live)await CodexUI.refresh();Object.assign(modelOptions,ChatModels.snapshot());
      const reply=live?await NativeBridge.complete(messages,enqueue,modelOptions):(await pause(160),replyFor(user.text,thread,user.quote));
      if(!live&&!modelOptions.thinking)delete reply.reasoning;
      if(!active(thread,token))return;
      if(typeof reply?.text!=='string'||!reply.text.trim())throw new Error('返回了空白回答，请重试。');
      for(const kind of ['reasoning','text']){
        const full=reply[kind]||'';
        if(!full.startsWith(received[kind]))throw new Error('回答传输不完整，请重试。');
        enqueue({[kind]:full.slice(received[kind].length)});
      }
      await flush();if(!active(thread,token))return;
      const answer=Object.assign(preview,reply,{...clock(),streaming:false,thinking:false,elapsed:`${Math.max(1,Math.round((Date.now()-started)/1000))}秒`});
      if(thread.kind==='personal')LumiRelatedTargets.prepare(answer,{live:FuyaoData.available()});
      if(!live&&(reply.report||/生成.*(报告|文档|文件)|整理.*(报告|文档|文件)|写.*(报告|文档|文件)/.test(user.text))){
        const match=user.text.match(/(?:一份|一个|生成|整理|写)([^，。！？\n]*?(?:报告|文档|文件))/);
        answer.document={id:`file-${thread.id}-${answer.id}`,title:!live&&reply.report?'CPO 产业链研究报告':match?.[1]?.replace(/^(?:成|为|一份|一个)/,'').trim()||'对话整理报告',type:!live&&reply.report?'cpo':'text',text:reply.text};
      }
      if(live&&reply.files?.length)answer.files=reply.files.map(path=>({id:'local:'+path,title:path.split('/').at(-1),type:'local',path,text:''}));
      if(reply.truncated)answer.after='回答已达到本次长度上限，可以继续追问“继续”。';
      if(target)thread.messages[thread.messages.indexOf(target)]=answer;else thread.messages.push(answer);
      if(thread.kind==='personal'&&!target){user.status='已读';user.receiptTime=clock().time}
      thread.pending=false;thread.pendingPhase=null;thread.pendingAnswer=null;thread.pendingTargetId=null;
      if(target)target.regenerating=false;changed(thread.id,'reply',answer.id);enrichRelated(thread,answer);
    })().catch(async error=>{
      await flush();if(!active(thread,token))return;
      thread.error={message:error.message||'请求失败，请重试。',userId:user.id,targetId:target?.id||null,prompt:user.text};
      if(!target){
        if(preview.text||preview.reasoning)thread.failedAnswer=Object.assign(preview,{streaming:false,thinking:false,interrupted:true});
        if(thread.kind==='personal')user.status='未完成';
        if(!thread.draft){thread.draft=user.text;thread.restoreFailedDraft=true;if(!thread.replyQuote&&user.quote)thread.replyQuote={...user.quote}}
      }
    }).finally(()=>{
      clearTimeout(timer);if(!active(thread,token))return;
      if(target)target.regenerating=false;
      if(thread.pending){thread.pending=false;thread.pendingPhase=null;thread.pendingAnswer=null;thread.pendingTargetId=null;changed(thread.id)}
    });
    return true;
  }
  function retry(id){
    const thread=threads.get(id),error=thread?.error;if(!thread||thread.pending||!error)return false;
    const user=thread.messages.find(item=>item.id===error.userId),target=error.targetId?thread.messages.find(item=>item.id===error.targetId):null;
    if(!user||error.targetId&&!target)return false;
    if(!target&&thread.draft===error.prompt&&sameQuote(thread.replyQuote,user.quote)){thread.draft='';thread.replyQuote=null;thread.clearSubmittedDraft=true}
    return runRequest(thread,user,target);
  }
  function regenerate(id,messageId){
    const thread=threads.get(id),target=thread?.messages.find(item=>item.id===messageId);if(!thread||thread.pending||!target||target.role!=='assistant')return false;
    const user=thread.messages.slice(0,thread.messages.indexOf(target)).findLast(item=>item.role==='user');
    return user?runRequest(thread,user,target):false;
  }
  function submit(id,text){
    const thread=threads.get(id);text=text.trim();if(!thread||!text||thread.pending||thread.onboarding?.phase==='welcome')return false;
    if(thread.error&&!thread.error.targetId&&thread.error.prompt===text&&sameQuote(thread.replyQuote,thread.messages.find(item=>item.id===thread.error.userId)?.quote))return retry(id);
    const user=message('user',text,{...clock(),status:null,origin:window.NativeBridge?.available?'codex':'demo',...(thread.replyQuote?{quote:{...thread.replyQuote}}:{})});
    thread.introTyping=false;thread.messages.push(user);thread.draft='';thread.replyQuote=null;thread.pendingScroll='bottom';return runRequest(thread,user);
  }
  function stop(id){
    const thread=threads.get(id);if(!thread?.pending)return;
    if(NativeBridge.available){NativeBridge.cancelThread(id);return}
    const answer=thread.pendingAnswer,target=thread.messages.find(item=>item.id===thread.pendingTargetId);
    thread.activeRequest=++requestSequence;
    if(answer?.text&&!target)thread.messages.push({...answer,streaming:false,thinking:false,interrupted:true});
    if(target)target.regenerating=false;
    thread.pending=false;thread.pendingPhase=null;thread.pendingAnswer=null;thread.pendingTargetId=null;thread.error=null;
    changed(id,'stop',answer?.id);
  }
  window.ChatStore={startLumi,resumeLumiIntroduction,stop,threads,watchNotes,messageText,appendProactive,setProactiveTyping,seed,create,get:id=>threads.get(id),submit,retry,regenerate,rename:(id,title)=>{const t=threads.get(id);if(t){t.title=title;persist()}},remove:id=>{if(id!=='lumi'){stop(id);threads.delete(id);persist()}},clock};
})();
