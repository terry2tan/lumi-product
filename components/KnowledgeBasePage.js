/* 知识库交互稿（10-19 改版）：从「项目」改为一个个人知识存档，线框保真度。
   两个卖点：① 把网页、短视频、文件快速内化成知识存档（抽取 → 提炼 → 切成片段）；
   ② 知识库以工具接口（kb.search / kb.read / kb.save）开放给 AI，对话中自动检索片段并标注引用。
   存与用都通过 AI 完成（见 KnowledgeChat），本页只负责浏览、核对和少量设置，不再有多库、文件夹、资料包与发布。 */
window.KnowledgeBasePage=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 /* 来源平台 → 内容形态。视频走语音转写，图文走正文提取，文件走解析，对话沉淀直接取回答原文。 */
 const PLATFORMS=[
  [/douyin|iesdouyin/,'抖音','video'],[/bilibili|b23\.tv/,'B 站','video'],[/xiaohongshu|xhslink/,'小红书','post'],
  [/mp\.weixin/,'公众号','article'],[/xueqiu/,'雪球','article'],[/zhihu/,'知乎','article'],[/./,'网页','article']
 ];
 const KINDS={video:'视频',article:'文章',post:'图文笔记',file:'文件',answer:'对话沉淀',note:'随手记'};
 const FILTERS=[['all','全部'],['video','视频'],['article','文章'],['file','文件'],['answer','对话沉淀']];
 /* 抽取过程按形态展示，让用户知道 AI 做了什么，但不需要用户参与。 */
 const STEPS={video:['打开视频','转写语音','提炼要点','切分片段'],post:['打开笔记','识别图片文字','提炼要点','切分片段'],article:['打开网页','提取正文','提炼要点','切分片段'],file:['解析文件','提取正文','提炼要点','切分片段'],answer:['读取回答','提炼要点','切分片段'],note:['整理文字','提炼要点','切分片段'],media:['读取文件','转写语音','提炼要点','切分片段'],image:['读取图片','识别文字','提炼要点','切分片段'],
  fallback:['服务端读取','被拦截，改用本机读取','提取正文','提炼要点','切分片段'],local:['读取你看到的这一页','提取正文','提炼要点','切分片段'],paste:['整理粘贴的正文','提炼要点','切分片段']};
 /* 可上传的文件：文档解析正文，图片识别文字，音视频转写语音。原文件本身也保存一份。 */
 const FILE_TYPES=[[/^(pdf|docx?|pptx?|xlsx?|md|txt|html?|epub)$/,'file'],[/^(png|jpe?g|webp|heic)$/,'image'],[/^(mp3|m4a|wav|mp4|mov)$/,'media']];
 const ACCEPT='.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.txt,.html,.epub,.png,.jpg,.jpeg,.webp,.heic,.mp3,.m4a,.wav,.mp4,.mov';
 /* 冷启动：运营挑选的大 V 内容，按用户自选股和最近对话的主题推荐。一键存入后就能直接问，让用户第一次就看到知识库能做什么。 */
 const PICKS=[
  {who:'光通信观察',platform:'雪球',badge:'行业大 V',fans:'12.6 万关注',topic:'光模块',tags:['光模块','CPO'],ask:'1.6T 光模块什么时候开始放量？',items:[
   ['article','CPO 量产进度跟踪（10 月）','https://xueqiu.com/1234567/301122334','第 3 段','头部厂商的 CPO 样品已经进入客户验证，但量产时间普遍推迟到 2027 年下半年。'],
   ['article','800G 与 1.6T 的切换节奏','https://xueqiu.com/1234567/300998877','第 2 段','1.6T 光模块预计明年二季度开始放量，800G 仍是明年出货的主力。']]},
  {who:'老陈复盘',platform:'抖音',badge:'投资顾问',fans:'86 万粉丝',topic:'短线复盘',tags:['情绪周期','短线'],ask:'现在处于情绪周期的哪个阶段？',items:[
   ['video','情绪周期四阶段，3 分钟讲清','https://v.douyin.com/iRpQ1aB/','00:45','情绪周期分启动、发酵、高潮、退潮四个阶段，判断依据是连板高度和炸板率。'],
   ['video','退潮期的三个信号','https://v.douyin.com/iRpQ3eF/','01:12','退潮期最明显的信号是高位股集体跳水、炸板率超过四成、成交额连续萎缩。'],
   ['video','龙头股怎么识别','https://v.douyin.com/iRpQ2cD/','00:58','真正的龙头是板块里最先涨停、分歧时最先回封的那一只。']]},
  {who:'半导体课堂',platform:'B 站',badge:'知识区 UP 主',fans:'48 万粉丝',topic:'半导体',tags:['半导体','国产化'],ask:'半导体设备国产化率最低的是哪个环节？',items:[
   ['video','半导体设备国产化，一期讲透','https://www.bilibili.com/video/BV1Ab4y1c7Xy','18:30','刻蚀和薄膜沉积的国产化率已经超过三成，光刻和量测仍然不到一成。'],
   ['video','光刻机为什么这么难','https://www.bilibili.com/video/BV1Cd4y1e8Zz','07:15','光刻机难在光源、物镜和工件台三大系统，每一个都需要几十年的工艺积累。']]},
  {who:'稳稳的幸福',platform:'小红书',badge:'精选作者',fans:'9.3 万粉丝',topic:'红利低波',tags:['红利低波','定投'],ask:'红利低波在什么环境下容易失效？',items:[
   ['post','红利低波怎么选指数','https://www.xiaohongshu.com/explore/6701','图 1 文字','选红利低波指数先看股息率和波动率的筛选规则，再看行业集中度，银行占比太高要小心。'],
   ['post','我的再平衡规则','https://www.xiaohongshu.com/explore/6702','正文','每半年再平衡一次，单只权重超过 15% 就减到 10%，利率快速上行时降低仓位。']]}
 ];
 const pickSample=(p,[kind,title,,loc,text])=>({title,author:p.who,duration:kind==='video'?'3:20':undefined,tags:p.tags,summary:text,points:[text.split('，')[0]],chunks:[[loc,text]]});
 /* 工具设计参考 Lenny's Data 连接器：先搜后读、逐级加载。
    list 浏览 → search 返回命中片段 → read_excerpt 取某段上下文 → read 全文（尽量少用），另加 save 负责写入。
    工具说明里直接教模型怎么检索：把问题改写成 2–6 个关键词，同义词用 | 连接，命中弱就换角度多搜几次。
    每个片段都带 loc（时间点 / 段落 / 页码）和 source_url，回答据此标注引用；搜不到时返回说明，而不是空结果。 */
 const TOOLS=[
  ['kb_search','query, type?, limit?','跨标题、要点、标签和原文检索，返回命中的知识与片段（含 loc、matched_terms、source_url）。query 用改写后的关键词，如「CPO|共封装|良率」。','先用'],
  ['kb_read_excerpt','id, query?, match_index?, radius?','读取某条知识里命中位置前后的一段原文，不必加载全文。','再用'],
  ['kb_list','type?, limit?, offset?','按形态、时间浏览知识库目录，用于「我最近存了什么」这类问题。',''],
  ['kb_read','id','读取一条知识保存下来的原文（视频逐字稿、文章正文、文件全文）。只在需要通读、逐句引用时使用。','少用'],
  ['kb_save','url | file | text, note?','把链接、文件或一段文字存为知识：读取 → 转写 / 提取 → 提炼 → 切片。','写入']
 ];
 let seq=100;
 const chunk=(loc,text)=>({id:'c'+(++seq),loc,text});
 const item=(o)=>({id:'k'+(++seq),status:'ready',tags:[],points:[],chunks:[],cites:[],...o});
 const items=[
  item({kind:'video',platform:'抖音',title:'3 分钟看懂 CPO：为什么说它是光模块的下一代',author:'科技老张',url:'https://v.douyin.com/iRk2Pq8/',saved:'10-18 22:41',via:'对话中发送链接',duration:'3:12',
   summary:'用交换机的功耗瓶颈引出 CPO，对比可插拔方案，认为 CPO 会先在 AI 集群的交换机侧落地。',tags:['CPO','光模块'],
   points:['CPO 把光引擎和交换芯片封在一起，主要解决功耗和带宽密度','2027 年前可插拔仍是主流，CPO 先在交换机侧小批量落地','真正的门槛是量产良率和坏了以后怎么维修'],
   chunks:[chunk('00:18','交换机带宽每两年翻一倍，光模块的功耗已经占到整机三成以上，这是 CPO 出现的直接原因。'),chunk('01:05','CPO 把光引擎直接封装到交换芯片旁边，电信号走的距离从十几厘米缩到几毫米，功耗能降三到五成。'),chunk('02:14','我的判断是 2027 年之前可插拔依然是主流，CPO 会先在 AI 集群的交换机侧小批量用起来。'),chunk('02:47','大家担心的不是技术能不能做，而是量产良率，以及光引擎坏了整块板子要不要一起换。')],
   cites:[{chat:'CPO 渗透节奏怎么看',time:'今天 09:12',n:2}]}),
  item({kind:'article',platform:'雪球',title:'CPO 渗透率的三个分歧',author:'光通信观察',url:'https://xueqiu.com/1234567/298765432',saved:'10-11 21:14',via:'对话中发送链接',
   summary:'列出市场对 CPO 渗透节奏的三处分歧：量产良率、现场可维护性、头部客户导入时间。',tags:['CPO','渗透率'],
   points:['分歧集中在量产良率，而不是技术可行性','头部客户的导入时间可能比卖方预期早两个季度'],
   chunks:[chunk('第 2 段','市场对 CPO 渗透节奏的分歧集中在三处：量产良率、现场可维护性，以及头部客户的导入时间。'),chunk('第 5 段','从供应链调研看，头部客户的导入时间可能比卖方普遍预期早两个季度，但首批量不会大。'),chunk('第 7 段','良率是最大的不确定性：目前光引擎封装良率还没有公开数据，各家说法差距很大。')],
   cites:[{chat:'CPO 渗透节奏怎么看',time:'今天 09:12',n:1},{chat:'光模块龙头对比',time:'10-15 20:30',n:1}]}),
  item({kind:'video',platform:'B 站',title:'硅光与 CPO 技术讲解（下）',author:'半导体课堂',url:'https://www.bilibili.com/video/BV1xx411c7mD',saved:'10-09 20:02',via:'知识库页添加',duration:'48:20',
   summary:'从硅光芯片的制造工艺讲到外置光源方案，后半段讨论国内厂商在光引擎环节的进展。',tags:['硅光','CPO'],
   points:['外置光源是 CPO 方案里价值量最集中的环节之一','国内厂商在光引擎封装上与海外差距在一到两年'],
   chunks:[chunk('12:40','外置光源把激光器从封装里拿出来，坏了可以单独换，这是目前主流 CPO 方案解决可维护性的办法。'),chunk('31:05','光引擎和外置光源加起来，大概占 CPO 方案价值量的一半以上。'),chunk('44:18','国内几家在光引擎封装上已经送样，但和海外头部比，量产节奏大概落后一到两年。')],
   cites:[]}),
  item({kind:'article',platform:'公众号',title:'海外云厂商 Q3 资本开支：整体上修，节奏分化',author:'算力研究所',url:'https://mp.weixin.qq.com/s/Xa82kQ',saved:'10-08 08:20',via:'对话中发送链接',
   summary:'汇总四家海外云厂商最近一个季度的资本开支指引与同比变化，指出上修集中在 AI 服务器与网络。',tags:['资本开支','云厂商','光模块'],
   points:['四家合计资本开支指引整体上修','增量主要投向 AI 服务器与数据中心网络','有一家明确放缓明年节奏'],
   chunks:[chunk('第 1 段','四家海外云厂商三季度合计资本开支同比增长约四成，全年指引整体上修。'),chunk('第 4 段','增量主要花在 AI 服务器和数据中心网络上，800G 光模块需求因此持续偏紧。'),chunk('第 6 段','其中一家在电话会上表示明年资本开支增速会放缓，节奏开始分化。')],
   cites:[{chat:'光模块龙头对比',time:'10-15 20:30',n:2}]}),
  item({kind:'post',platform:'小红书',title:'红利低波定投一年复盘，最大回撤 6%',author:'稳稳的幸福',url:'https://www.xiaohongshu.com/explore/66f0',saved:'10-06 12:10',via:'对话中发送链接',
   summary:'作者按月定投红利低波指数一年的记录，包括回撤、再平衡和两次想放弃的时刻。',tags:['红利低波','定投'],
   points:['一年最大回撤约 6%，明显小于宽基','利率快速上行的两个月表现最差'],
   chunks:[chunk('图 2 文字','按月定投 12 期，最大回撤 6.1%，同期沪深 300 最大回撤 14%。'),chunk('正文','表现最差的是利率快速上行那两个月，高股息的吸引力被债券收益率压住了。')],
   cites:[{chat:'高股息组合再平衡',time:'10-12 21:05',n:1}]}),
  item({kind:'file',platform:'PDF',title:'光模块行业深度：CPO 技术路线与产业链.pdf',author:'本地文件',saved:'09-18 16:02',via:'知识库页添加',pages:42,
   summary:'梳理 CPO 相对可插拔方案的功耗与密度优势，拆解光引擎、外置光源、封装三个环节的价值量分布。',tags:['CPO','产业链'],
   points:['光引擎与外置光源是价值量最集中的两个环节','CPO 量产的关键约束在封装良率'],
   chunks:[chunk('第 12 页','CPO 方案中光引擎与外置光源合计价值量占比约 55%，是产业链最值得关注的两个环节。'),chunk('第 18 页','封装良率是 CPO 能否规模量产的关键约束，目前行业仍处于工程验证阶段。')],
   cites:[{chat:'CPO 渗透节奏怎么看',time:'今天 09:12',n:1}]}),
  item({kind:'answer',platform:'对话',title:'CPO 产业链上下游梳理',author:'Lumi 的回答',saved:'10-12 10:31',via:'对话中说「记下来」',fromChat:'产业链与市场空间',
   summary:'按上游器件、中游封装、下游设备整理的产业链清单。',tags:['产业链','CPO'],
   points:['上游器件国产化率差异大','中游封装集中度高'],
   chunks:[chunk('第 1 段','上游器件包括激光器、调制器和硅光芯片，其中高速激光器国产化率仍然较低。'),chunk('第 2 段','中游光引擎封装集中度高，头部几家占据大部分份额。')],
   cites:[]}),
  item({kind:'video',platform:'抖音',title:'（无法读取）',author:'—',url:'https://v.douyin.com/iRm9xYz/',saved:'10-17 19:30',via:'对话中发送链接',status:'failed',failType:'private',reason:'这条视频仅粉丝可见，Lumi 打不开。'})
 ];
 const settings={autoSearch:true,autoSave:true};
 const S={view:'home',id:null,chunk:null,q:'',filter:'all',tag:'',add:'',notes:false,demo:'normal',confirm:null,picksOpen:true,pickPage:0,dragging:false};
 let root=null,toastTimer=0;
 const get=id=>items.find(x=>x.id===id);
 const chip=(text,cls='')=>`<span class="kb-chip ${cls}">${esc(text)}</span>`;
 const btn=(label,act,attrs='',cls='')=>`<button type="button" class="kb-btn ${cls}" data-act="${act}" ${attrs}>${esc(label)}</button>`;
 const link=(label,act,attrs='')=>`<button type="button" class="kb-link" data-act="${act}" ${attrs}>${esc(label)}</button>`;
 const badge=x=>`<span class="kn-badge is-${x.kind}">${esc(x.platform)}</span>`;
 const ready=()=>items.filter(x=>x.status==='ready');
 const chunkCount=()=>ready().reduce((n,x)=>n+x.chunks.length,0);
 /* 原文字数：演示数据按片段长度估算；对话沉淀与随手记的原文就是片段本身。 */
 const words=x=>x.words??Math.round(x.chunks.reduce((n,c)=>n+c.text.length,0)*(['answer','note'].includes(x.kind)?1:x.kind==='video'?6:9)/10)*10;
 const lines=(n=3)=>`<div class="wf-text kn-gap" aria-hidden="true">${Array.from({length:n},(_,i)=>`<span class="wf-line" style="--wf-line-width:${[92,100,78,96,64][i%5]}%;max-width:none"></span>`).join('')}</div>`;
 function toast(text){clearTimeout(toastTimer);let t=root?.querySelector('.kb-toast');if(!root)return;if(!t){t=document.createElement('div');t.className='kb-toast';t.setAttribute('role','status');root.append(t)}t.textContent=text;t.hidden=false;toastTimer=setTimeout(()=>t.hidden=true,2600)}

 /* ---------- 存入：本页的添加框与对话共用同一个流程 ---------- */
 function detect(text){
  const url=String(text).match(/https?:\/\/[^\s，。]+/)?.[0];
  if(url){const [,platform,kind]=PLATFORMS.find(([re])=>re.test(url));return{kind,platform,url}}
  const name=text.trim(),ext=name.match(/\.([a-z0-9]{2,5})$/i)?.[1].toLowerCase();
  if(ext&&FILE_TYPES.some(([re])=>re.test(ext))){const [,flow]=FILE_TYPES.find(([re])=>re.test(ext));return{kind:'file',flow,platform:ext.toUpperCase(),title:name}}
  return{kind:'note',platform:'随手记',text:name};
 }
 /* 演示数据：按平台给出一份「抽取结果」。真实产品里由抽取服务返回。 */
 const SAMPLES={
  '抖音':{title:'光模块涨这么多，还能上车吗？讲讲 1.6T 的节奏',author:'财经阿杰',duration:'2:46',tags:['光模块','1.6T'],summary:'作者认为 1.6T 光模块明年开始放量，但估值已经反映了大部分预期，建议等回调。',points:['1.6T 光模块明年开始放量','当前估值已反映大部分预期'],chunks:[['00:32','1.6T 光模块明年会开始放量，头部客户已经下了第一批订单。'],['01:50','但是现在的估值已经把明年的增长基本算进去了，追高的性价比不高。']]},
  'B 站':{title:'一口气讲清楚光通信产业链',author:'硬核科普君',duration:'21:08',tags:['光通信','产业链'],summary:'从光芯片到光模块再到交换机，按环节讲清楚光通信产业链的分工与利润分布。',points:['利润最厚的是光芯片和高速光模块','设备环节议价能力最强的是交换机厂商'],chunks:[['03:20','光芯片和高速光模块是这条产业链里利润最厚的两个环节。'],['15:42','交换机厂商对下游议价能力最强，光模块厂商其实是被动接单。']]},
  '小红书':{title:'我的高股息组合 2026 年三季度调仓',author:'慢慢变富',tags:['高股息','调仓'],summary:'作者三季度减持了两只银行股，换入电力和高速公路。',points:['减持银行，加仓电力与高速公路'],chunks:[['图 1 文字','三季度减了两只银行，换成电力和高速公路，组合股息率基本没变。']]},
  '公众号':{title:'电力板块三季报前瞻：火电盈利修复',author:'能源观察',tags:['电力','三季报'],summary:'煤价回落叠加电价稳定，火电三季度盈利有望继续修复。',points:['煤价回落带动火电盈利修复','绿电受电价下行拖累'],chunks:[['第 2 段','三季度煤价同比回落约一成，火电度电盈利继续修复。'],['第 5 段','绿电受市场化电价下行拖累，盈利弹性不如火电。']]},
  '雪球':{title:'聊聊 800G 光模块的价格战',author:'光通信观察',tags:['光模块','价格'],summary:'作者认为 800G 光模块明年价格降幅会扩大，但头部厂商靠份额维持利润。',points:['800G 明年降价幅度扩大','头部靠份额维持利润'],chunks:[['第 3 段','800G 光模块明年的年降幅度可能从 15% 扩大到 20% 以上。']]},
  '知乎':{title:'如何理解 CPO 对光模块厂商的冲击？',author:'匿名用户',tags:['CPO','光模块'],summary:'回答认为 CPO 短期不会替代可插拔光模块，光模块厂商也在布局光引擎。',points:['CPO 短期不会替代可插拔','光模块厂商也在做光引擎'],chunks:[['第 1 段','CPO 短期内不会替代可插拔光模块，两者会长期并存。']]},
  '网页':{title:'政策解读：容量电价机制落地',author:'网页',tags:['电力','政策'],summary:'容量电价机制明年起执行，火电的固定成本回收更有保障。',points:['容量电价明年起执行'],chunks:[['第 1 段','容量电价机制明年 1 月起执行，火电固定成本的回收更有保障。']]},
  'file':{author:'本地文件',tags:['研报'],summary:'（解析完成后的摘要）',points:['（提炼出的要点）'],chunks:[['第 1 页','（解析出的第一个片段）']]},
  'note':{author:'你',tags:['随手记'],points:[]}
 };
 /* 读取策略，由易到难，全程不代登录、不绕过付费墙和验证码：
    ① 服务端读取公开页面，大部分网页到这一步就够了；
    ② 被拦截时（如公众号对机房 IP 的「环境异常」）自动改由本机客户端读取，请求来自用户自己的网络，一次只读这一页；
    ③ 仍需登录或验证时如实说明，并给三条路：在应用内打开（用户自己登录后存当前页）、粘贴正文、上传截图。 */
 const FAILS={
  login:{label:'需要登录',reason:'这个页面要登录后才能看到正文。Lumi 不会代你登录。'},
  blocked:{label:'被验证拦截',reason:'服务端和本机读取都被网站的人机验证拦下了。Lumi 不会绕过验证。'},
  private:{label:'无法访问',reason:'这条视频仅粉丝可见，Lumi 打不开。'},
  nosound:{label:'没有可用语音',reason:'这条视频没有可识别的语音，不会用简介或评论代替。'}
 };
 const VIA={browser:'应用内打开后保存',paste:'粘贴正文',shot:'上传截图识别',retry:'重新读取'};
 /* 推进一条知识的读取步骤；listeners 让知识库页和对话卡片看到同一条的进度。 */
 function run(x,steps,finish,onStep){
  if(onStep)x.listeners=[...(x.listeners||[]),onStep];
  Object.assign(x,{status:'reading',step:0,steps});
  const ping=()=>{(x.listeners||[]).forEach(f=>f(x));draw()};
  const tick=()=>{x.step++;if(x.step>=steps.length){finish();ping()}else{ping();setTimeout(tick,650)}};
  setTimeout(tick,650);draw();return{item:x,steps};
 }
 function fill(x,s,plain=''){
  const texts=plain?plain.split(/\n+|。/).map(t=>t.trim()).filter(Boolean).slice(0,6):null;
  const known=[...new Set(ready().flatMap(y=>y.tags))].filter(t=>plain.includes(t));
  Object.assign(x,{status:'ready',failType:null,reason:null,
   title:/正在读取|无法读取/.test(x.title)?(s.title||texts?.[0]?.slice(0,20)||'未命名'):x.title,author:x.author&&x.author!=='—'?x.author:(s.author||x.platform),
   tags:texts?(known.length?known.slice(0,3):[s.tags?.[0]||'随手记']):s.tags,summary:texts?texts[0].slice(0,60):s.summary,points:texts?texts.slice(0,3):s.points,
   chunks:texts?texts.map((t,i)=>chunk(`第 ${i+1} 段`,t)):s.chunks.map(([loc,t])=>chunk(loc,t))});
 }
 function fail(x,type){Object.assign(x,{status:'failed',failType:type,reason:FAILS[type].reason,author:'—',duration:undefined,title:x.title==='正在读取…'?'（无法读取）':x.title})}
 /* 新建一条「存档中」的知识，按步骤推进到可检索；onStep 用于对话卡片同步刷新。 */
 function ingest(text,{via='知识库页添加',fromChat=null,title=null,body=null,sample=null,onStep}={}){
  const d=detect(text),kind=body?'answer':d.kind,s=sample||SAMPLES[kind==='file'||kind==='note'||kind==='answer'?(kind==='answer'?'note':kind):d.platform]||SAMPLES['网页'];
  if(d.url&&items.some(x=>x.url===d.url&&x.status!=='failed'))return{dup:items.find(x=>x.url===d.url&&x.status!=='failed')};
  /* 演示开关只作用于下一条：需要登录、被验证拦截、视频没有语音。 */
  const outcome=d.url&&['login','blocked'].includes(S.demo)?S.demo:kind==='video'&&S.demo==='fail'?'nosound':null;if(outcome)S.demo='normal';
  const plain=body||d.text||'';
  const flow=d.flow||(outcome==='blocked'||(!outcome&&d.platform==='公众号')?'fallback':kind);
  const x=item({kind,flow,platform:kind==='answer'?'对话':d.platform,url:d.url,author:kind==='answer'?'Lumi 的回答':s.author,duration:s.duration,saved:'刚刚',via,fromChat,
   title:title||d.title||(kind==='note'?plain.slice(0,20)||'随手记':'正在读取…'),tags:[]});
  items.unshift(x);
  const steps=outcome==='blocked'?STEPS.fallback.slice(0,2):outcome?(STEPS[kind]||STEPS.article).slice(0,outcome==='nosound'?2:1):STEPS[flow]||STEPS.article;
  return run(x,steps,()=>outcome?fail(x,outcome):fill(x,s,kind==='note'||kind==='answer'?plain:''),onStep);
 }
 /* 失败后的补救：在应用内打开后存当前页、粘贴正文、上传截图，或者重新读取。仍是同一条知识，出处不变。 */
 function fix(id,{how,text='',onStep}={}){
  const x=get(id);if(!x)return null;
  Object.assign(x,{via:VIA[how],saved:'刚刚',title:x.title==='（无法读取）'?'正在读取…':x.title,flow:{browser:'local',paste:'paste',shot:'image',retry:x.kind}[how]});
  const s=SAMPLES[x.platform]||SAMPLES['网页'];
  return run(x,STEPS[x.flow]||STEPS.article,()=>how==='paste'?fill(x,{},text):fill(x,s),onStep);
 }
 function remove(id){const i=items.findIndex(x=>x.id===id);if(i>=0)items.splice(i,1);if(S.id===id)S.view='home';draw()}

 /* ---------- 检索：对话里的 kb_search 调用这里 ---------- */
 /* 演示用的「改写查询」：从用户原话里挑出知识库认识的关键词，补上同义词，拼成 a|b|c。真实产品由模型按工具说明自己改写。 */
 const SYNONYMS={'CPO':['共封装'],'良率':['量产'],'光模块':['800G','1.6T'],'资本开支':['capex'],'红利低波':['高股息'],'渗透率':['渗透']};
 function rewrite(text){
  const vocab=[...new Set(ready().flatMap(x=>[...x.tags,...Object.keys(SYNONYMS)]))].filter(k=>String(text).includes(k));
  const extra=['良率','渗透','节奏','维修','价值量','回撤','国产化'].filter(k=>String(text).includes(k));
  const terms=[...new Set([...vocab,...extra])];
  return [...new Set(terms.flatMap(t=>[t,...(SYNONYMS[t]||[])]))].slice(0,6).join('|');
 }
 function search(query,{limit=3}={}){
  const terms=String(query).split('|').map(t=>t.trim()).filter(Boolean);const results=[];
  for(const x of ready()){
   const hay=[x.title,x.summary,...x.tags,...x.points].join(' ');
   const snippets=x.chunks.map(c=>({c,m:terms.filter(t=>c.text.includes(t))})).filter(s=>s.m.length).sort((a,b)=>b.m.length-a.m.length);
   const matched=[...new Set([...terms.filter(t=>hay.includes(t)),...snippets.flatMap(s=>s.m)])];
   if(!snippets.length)continue;
   results.push({item:x,chunk:snippets[0].c,matched,score:snippets[0].m.length*2+matched.length,snippets:snippets.slice(0,2).map(s=>({chunk:s.c,matched:s.m}))});
  }
  results.sort((a,b)=>b.score-a.score);
  const hits=results.slice(0,limit);
  return{query:terms.join('|'),terms,total_results:results.length,total:chunkCount(),hits,
   message:hits.length?'':`知识库里没有与「${terms.join('、')||query}」相关的片段。最近存入的是「${ready()[0]?.title||'—'}」。`};
 }
 /* 面板里展示的返回结构，字段与真实接口一致。 */
 function sampleResponse(){
  const r=search('CPO|共封装|良率',{limit:1}),h=r.hits[0];
  return JSON.stringify({query:r.query,terms:r.terms,total_results:r.total_results,results:h?[{id:h.item.id,title:h.item.title,type:KINDS[h.item.kind],platform:h.item.platform,author:h.item.author,saved_at:h.item.saved,tags:h.item.tags,matched_terms:h.matched,
   snippets:h.snippets.map(s=>({chunk_id:s.chunk.id,loc:s.chunk.loc,text:s.chunk.text,matched_terms:s.matched})),source_url:h.item.url||null}]:[],message:r.message||undefined},null,1);
 }
 function cite(hits,chat){for(const h of hits){const c=h.item.cites.find(x=>x.chat===chat&&x.time==='刚刚');if(c)c.n++;else h.item.cites.unshift({chat,time:'刚刚',n:1})}draw()}

 /* ---------- 首页：添加框 + 知识列表 + 侧栏（工具接口、引用动态、两个开关） ---------- */
 /* 三种存入方式放在同一个框里：粘链接、粘文字、传文件。整个框都可以拖文件进来。 */
 function addBox(){
  return `<form class="kn-add ${S.dragging?'is-drag':''}" data-form="add">
    <div class="kn-add-row"><input class="kb-input kb-grow" data-input="add" value="${esc(S.add)}" placeholder="粘贴链接或一段文字，或者把文件拖到这里" aria-label="粘贴链接或文字存入知识库">
     <label class="kb-btn kn-upload" tabindex="0" role="button">上传文件<input type="file" data-file multiple accept="${ACCEPT}" hidden></label>${btn('存入','add-submit','','is-primary')}</div>
    <div class="kn-add-kinds"><span><b>链接</b>抖音 · B 站 · 小红书 · 公众号 · 雪球 · 任意网页</span><span><b>文件</b>PDF · Word · PPT · Excel · 图片 · 音视频</span><span><b>文字</b>会议纪要、聊天记录、自己的想法</span></div>
    ${S.dragging?'<div class="kn-drop-hint">松开即可存入知识库</div>':''}</form>
   <p class="kb-hint">也可以在对话里把链接或文件发给 Lumi，或者说「把这个记下来」，效果一样；公众号文章还可以在微信里直接转发给 Lumi。原文会完整保存一份，原链接失效也能看。</p>`;
 }
 function picksHtml(big=false){
  const order=[...PICKS.slice(S.pickPage%PICKS.length),...PICKS.slice(0,S.pickPage%PICKS.length)].slice(0,big?4:3);
  const saved=p=>p.items.every(([,,url])=>items.some(x=>x.url===url&&x.status!=='failed'));
  const head=`<div class="kb-row kb-wrap"><b>大 V 推荐</b><span class="kb-sub">按你关注的光模块、半导体、红利低波推荐 · 存进来就能问</span><span class="kb-grow"></span>${link('换一批','picks-next')}${big?'':link(S.picksOpen?'收起':'展开','picks-toggle')}</div>`;
  if(!big&&!S.picksOpen)return `<section class="kn-picks is-closed">${head}</section>`;
  return `<section class="kn-picks">${head}<div class="kn-pick-grid">${order.map(p=>{const i=PICKS.indexOf(p),done=saved(p);return `<article class="kn-pick">
    <div class="kb-row"><span class="kn-avatar" aria-hidden="true">${esc(p.who[0])}</span><div class="kb-grow"><b>${esc(p.who)}</b><p class="kb-sub">${esc(p.platform)} · ${esc(p.badge)} · ${esc(p.fans)}</p></div></div>
    <ul class="kn-pick-list">${p.items.map(([kind,title])=>`<li><span class="kn-pick-kind">${kind==='video'?'视频':kind==='post'?'图文':'文章'}</span>${esc(title)}</li>`).join('')}</ul>
    <p class="kb-sub">存进来后可以问：「${esc(p.ask)}」</p>
    <div class="kb-row">${done?`${chip('已存入','is-notice')}${btn('去问问','pick-ask',`data-i="${i}"`,'is-small')}`:btn(`存入这 ${p.items.length} 条`,'pick-save',`data-i="${i}"`,'is-small is-primary')}</div></article>`}).join('')}</div>
   <p class="kb-hint">推荐内容由运营从公开平台挑选，作者认证信息来自原平台。内容仅供参考，不构成投资建议。</p></section>`;
 }
 function card(x){
  if(x.status==='reading'){const steps=x.steps||STEPS[x.flow||x.kind]||STEPS.article;return `<article class="kn-item is-reading" aria-busy="true"><div class="kn-item-head">${badge(x)}<span class="kb-sub">${esc(x.via)} · 刚刚</span></div><h3>${esc(x.title)}</h3>
   <ol class="kn-steps">${steps.map((s,i)=>`<li class="${i<x.step?'is-done':i===x.step?'is-active':''}">${s}</li>`).join('')}</ol>${x.url?`<p class="kb-sub kn-url">${esc(x.url)}</p>`:''}</article>`}
  if(x.status==='failed'){
   const f=FAILS[x.failType]||FAILS.private,web=['login','blocked'].includes(x.failType),video=x.kind==='video';
   return `<article class="kn-item is-failed"><div class="kn-item-head">${badge(x)}<span class="kb-sub">${esc(x.via)} · ${esc(x.saved)}</span>${chip('没有存进来 · '+f.label,'is-warn')}</div>
    <p>${esc(f.reason)}${web?'可以在应用内打开，由你自己登录或完成验证后再存这一页。':`可以把${video?'视频文案或字幕':'正文'}粘贴进来，或者上传截图。`}</p>${x.platform==='公众号'?'<p class="kb-sub">公众号文章也可以在微信里直接转发给 Lumi。</p>':''}<p class="kb-sub kn-url">${esc(x.url||'')}</p>
    ${S.pasteFor===x.id?`<div class="kn-paste"><textarea class="kb-textarea" data-input="paste" placeholder="${video?'粘贴视频文案或字幕…':'粘贴文章正文…'}" aria-label="粘贴正文">${esc(S.paste)}</textarea><div class="kb-row">${btn('保存','paste-save',`data-id="${x.id}"`,'is-small is-primary')}${btn('取消','paste-cancel','','is-small')}<span class="kb-sub">出处仍记为原链接</span></div></div>`:''}
    <div class="kb-row kb-wrap">${web?btn('在应用内打开','browse',`data-id="${x.id}"`,'is-small is-primary'):''}${S.pasteFor===x.id?'':btn(video?'粘贴文案或字幕':'粘贴正文','paste-open',`data-id="${x.id}"`,'is-small')}<label class="kb-btn is-small kn-upload" tabindex="0" role="button">上传截图<input type="file" data-shot="${x.id}" accept="image/*" multiple hidden></label>${web?'':btn('重试','retry',`data-id="${x.id}"`,'is-small')}${btn('移除','remove',`data-id="${x.id}"`,'is-small')}</div></article>`;
  }
  const cited=x.cites.reduce((n,c)=>n+c.n,0);
  return `<article class="kn-item" data-act="open" data-id="${x.id}" tabindex="0" role="button" aria-label="查看 ${esc(x.title)}">
   <div class="kn-item-head">${badge(x)}<span class="kb-sub">${esc(x.author)} · ${esc(x.saved)}${x.duration?' · '+esc(x.duration):''}</span><span class="kb-grow"></span>${x.saved==='刚刚'?chip('新存入','is-notice'):''}</div>
   <h3>${esc(x.title)}</h3><p class="kn-summary">${esc(x.summary)}</p>
   <div class="kn-item-foot">${x.tags.map(t=>`<button type="button" class="kb-chip is-action ${S.tag===t?'is-on':''}" data-act="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}<span class="kb-grow"></span><span class="kb-sub">原文 ${words(x).toLocaleString()} 字 · ${x.chunks.length} 个片段${cited?` · 被引用 ${cited} 次`:''}</span></div></article>`;
 }
 function home(){
  const q=S.q.trim();
  const list=items.filter(x=>(S.filter==='all'||x.kind===S.filter||(S.filter==='article'&&x.kind==='post')||(S.filter==='answer'&&x.kind==='note'))&&(!S.tag||x.tags.includes(S.tag))&&(!q||[x.title,x.summary,x.author,...(x.tags||[]),...x.chunks.map(c=>c.text)].join(' ').includes(q)));
  const empty=S.demo==='empty';
  /* 标签由 AI 入库时自动打，这里按出现次数列出，充当「分类」；用户不需要建文件夹。 */
  const tagCount={};for(const x of ready())for(const t of x.tags)tagCount[t]=(tagCount[t]||0)+1;
  const tags=Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const recent=items.flatMap(x=>x.cites.map(c=>({...c,x}))).sort((a,b)=>(b.time==='刚刚')-(a.time==='刚刚')||(b.time.startsWith('今天'))-(a.time.startsWith('今天'))).slice(0,4);
  const toggle=(key,label,hint)=>`<div class="kb-row kn-setting"><div class="kb-grow"><b>${label}</b><p class="kb-hint">${hint}</p></div><button type="button" class="kb-toggle ${settings[key]?'is-on':''}" data-act="toggle" data-key="${key}" role="switch" aria-checked="${settings[key]}" aria-label="${label}"><i></i></button></div>`;
  const main=empty?`<div class="kn-empty"><p>知识库还是空的</p><p class="kb-sub">刷到值得留下的视频、文章，把链接发给 Lumi 就行。Lumi 会读完、保存原文、提炼要点、切成片段存在这里，之后你问到相关问题时，它会自己翻出来并标明出处。不知道从哪开始？先存几条大 V 的内容试试：</p></div>${picksHtml(true)}`
   :`${picksHtml()}<div class="kb-row kb-wrap kn-filter"><div class="kb-seg kb-wrap" role="group" aria-label="按形态筛选">${FILTERS.map(([id,label])=>`<button type="button" class="${S.filter===id?'is-active':''}" data-act="filter" data-filter="${id}" aria-pressed="${S.filter===id}">${label}</button>`).join('')}</div><span class="kb-grow"></span><input class="kb-input" type="search" data-input="q" value="${esc(S.q)}" placeholder="搜索标题、要点或原文" aria-label="搜索知识库"></div>
    <div class="kn-tags" role="group" aria-label="按标签筛选"><span class="kb-sub">标签</span>${tags.map(([t,n])=>`<button type="button" class="kb-chip is-action ${S.tag===t?'is-on':''}" data-act="tag" data-tag="${esc(t)}" aria-pressed="${S.tag===t}">${esc(t)} <small>${n}</small></button>`).join('')}${S.tag?link('清除','tag','data-tag=""'):''}</div>
    <div class="kn-list">${list.map(card).join('')||'<p class="kb-empty">没有找到相关内容，换一个关键词或标签试试。</p>'}</div>`;
  return `<header class="kb-head"><div><h1 tabindex="-1">知识库</h1><p class="kb-sub">把刷到、读到的内容交给 Lumi 存下来；之后对话时，Lumi 会自己来这里翻，并标出引用了哪一段。</p></div>
    <div class="kn-stats"><span><b>${ready().length}</b>条知识</span><span><b>${chunkCount()}</b>个片段</span><span><b>${items.reduce((n,x)=>n+x.cites.reduce((m,c)=>m+c.n,0),0)}</b>次被引用</span></div></header>
   ${addBox()}
   <div class="kn-layout"><div class="kn-main">${main}</div>
    <aside class="kb-side">
     <section class="kb-panel"><b>Lumi 最近引用</b>${recent.map(r=>`<button type="button" class="kn-cite" data-act="open" data-id="${r.x.id}"><span>在「${esc(r.chat)}」中引用了 ${r.n} 段</span><small>${esc(r.x.title)} · ${esc(r.time)}</small></button>`).join('')||'<p class="kb-sub">还没有被引用过。</p>'}</section>
     <section class="kb-panel"><div class="kb-row"><b>开放给 AI 的工具</b>${chip(TOOLS.length+' 个')}</div><p class="kb-hint">知识库以工具的形式开放给 Lumi，对话、目标和自动任务都通过它们读写。先搜片段、再按需读上下文，尽量不整篇加载。</p>
      <ul class="kn-tools">${TOOLS.map(([name,arg,desc,tag])=>`<li><div class="kb-row"><code>${name}(${esc(arg)})</code>${tag?chip(tag):''}</div><span>${esc(desc)}</span></li>`).join('')}</ul>
      <details class="kn-sample"><summary>kb_search 返回示例</summary><pre>${esc(sampleResponse())}</pre></details></section>
     <section class="kb-panel">${toggle('autoSearch','对话时自动检索','问到相关问题时，Lumi 先查知识库，回答里标出引用的片段。')}${toggle('autoSave','对话里的链接自动存档','发给 Lumi 的链接会顺手存进来，不用额外说明。可随时撤销。')}</section>
    </aside></div>`;
 }

 /* ---------- 原文快照：存入时完整保存，原链接失效、作者删帖也能看。片段在原文里就地标出，引用点进来时高亮。 ---------- */
 function originalHtml(x){
  const own=['answer','note'].includes(x.kind);
  const what={video:'视频逐字稿（语音转写）',post:'笔记正文与图片文字',article:'网页正文',file:'文件全文',answer:'回答原文',note:'你的原话'}[x.kind];
  const extra={video:'视频本身不下载，保存逐字稿与关键帧截图。',post:`同时保存了 ${x.chunks.length+2} 张原图。`,article:'图片与表格一并保存，去掉了广告和评论区。',file:'原文件也已保存，可以随时打开。'}[x.kind]||'';
  const para=c=>`<div id="chunk-${c.id}" class="kn-para is-chunk ${S.chunk===c.id?'is-hit':''}"><span class="kn-loc">${esc(c.loc)}</span><p>${esc(c.text)}</p></div>`;
  const body=own?x.chunks.map(para).join(''):`${x.chunks.map((c,i)=>`${lines(i?2:3)}${para(c)}`).join('')}${lines(3)}`;
  return `<section class="kb-panel kn-original"><div class="kb-row kb-wrap"><b>原文</b>${chip('已完整保存','is-notice')}<span class="kb-sub">${what} · 约 ${words(x).toLocaleString()} 字 · 保存于 ${esc(x.saved)}</span><span class="kb-grow"></span>${x.kind==='file'?btn('打开原文件','noop','','is-small'):''}${btn('复制原文','copy-original','','is-small')}${btn('导出 Markdown','noop','','is-small')}</div>
   <p class="kb-hint">${extra}标出来的 ${x.chunks.length} 段是 Lumi 切出的检索片段，对话里引用的就是它们。</p>
   <div class="kn-original-body">${body}</div></section>`;
 }

 /* ---------- 应用内打开：真实网页，用户自己登录或完成验证；Lumi 只读当前这一页 ---------- */
 function browser(){
  const x=get(S.id);if(!x)return home();
  const s=SAMPLES[x.platform]||SAMPLES['网页'],gate=!S.unlocked,login=x.failType==='login';
  return `<nav class="kb-crumb" aria-label="位置">${link('知识库','home')}<span>/</span><b>应用内打开</b></nav>
   <div class="kn-browser"><div class="kn-browser-bar">${badge(x)}<code class="kb-grow">${esc(x.url)}</code>${chip('使用你自己的登录状态')}</div>
    <div class="kn-browser-page">${gate?`<div class="kb-empty-box"><p>${login?'登录后查看全文':'环境异常，完成验证后即可继续访问'}</p>
      <p class="kb-sub">${login?`这是${esc(x.platform)}的真实页面，请用你自己的账号登录。Lumi 不会代你登录，也不会保存你的密码。`:'这是网站自己的验证，请你自己完成。Lumi 不会绕过验证。'}</p>
      <div class="kn-gate" aria-hidden="true">${login?'<span></span><span></span><i>登录</i>':'<span class="is-box"></span><i>完成验证</i>'}</div>
      <button type="button" class="kn-demo" data-act="unlock">演示：${login?'我已登录':'我已完成验证'}</button></div>`
     :`<h2>${esc(s.title)}</h2><p class="kb-sub">${esc(s.author)}</p>${lines(4)}<p>${esc(s.chunks[0][1])}</p>${lines(5)}${s.chunks[1]?`<p>${esc(s.chunks[1][1])}</p>`:''}${lines(3)}`}</div>
    <div class="kn-browser-foot"><span class="kb-sub kb-grow">${gate?'看到正文后再存。':'Lumi 只读取你当前看到的这一页，不翻页、不批量抓取，也不会记住你的登录信息。'}</span>${btn('取消','home','','is-small')}${btn('存这一页','browse-save',`data-id="${x.id}"`+(gate?' disabled':''),'is-primary')}</div></div>`;
 }

 /* ---------- 单条知识：出处、AI 提炼、原文、引用记录 ---------- */
 function detail(){
  const x=get(S.id);if(!x)return home();
  const origin=x.kind==='answer'?`保存自对话「${esc(x.fromChat||'对话')}」`:x.kind==='file'?`本地文件 · 共 ${x.pages||'—'} 页`:`${esc(x.author)}${x.duration?' · 视频 '+esc(x.duration):''}`;
  const how={video:'已转写视频语音，片段带时间点',post:'已识别图片里的文字',article:'已提取正文，去掉了广告和评论',file:'已解析正文',answer:'取自 Lumi 的回答原文',note:'取自你的原话'}[x.kind];
  return `<nav class="kb-crumb" aria-label="位置">${link('知识库','home')}<span>/</span><b>${esc(x.title)}</b></nav>
   <header class="kb-head"><div class="kb-grow"><div class="kb-row kb-wrap">${badge(x)}<span class="kb-sub">${KINDS[x.kind]} · ${origin} · ${esc(x.saved)} ${esc(x.via)}</span></div><h1 tabindex="-1" class="kn-title">${esc(x.title)}</h1>${x.url?`<p class="kb-sub">${link('打开原网页 ↗','noop')} <code>${esc(x.url)}</code></p>`:''}</div>
    <div class="kb-head-tools">${btn('在对话中问它','ask',`data-id="${x.id}"`,'is-primary')}${btn('删除','confirm-remove',`data-id="${x.id}"`)}</div></header>
   <div class="kb-reader"><div class="kb-side">
     <section class="kb-panel"><div class="kb-row kb-wrap"><b>AI 提炼</b>${chip('AI 生成','is-ai')}<span class="kb-grow"></span><span class="kb-sub">${how}</span></div><p>${esc(x.summary)}</p><ul class="kn-points">${x.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><div class="kb-row kb-wrap">${x.tags.map(t=>chip(t)).join('')}</div></section>
     ${originalHtml(x)}</div>
    <aside class="kb-side"><section class="kb-panel"><b>引用记录</b>${x.cites.map(c=>`<div class="kn-cite is-static"><span>「${esc(c.chat)}」引用了 ${c.n} 段</span><small>${esc(c.time)}</small></div>`).join('')||'<p class="kb-sub">还没有被引用过。问到相关问题时，Lumi 会自动用上。</p>'}</section>
     <section class="kb-panel"><b>说明</b><p class="kb-hint">原文在存入时完整保存，之后不再依赖原链接。只存能读到的内容；视频没有语音、图片没有文字时如实说明，不用简介或评论代替。引用时一律标出处和位置，方便回看原文核对。</p></section></aside></div>
   ${S.confirm===x.id?`<div class="kb-backdrop" data-act="cancel-remove"><section class="kb-modal" role="dialog" aria-modal="true" aria-label="删除这条知识"><b>删除这条知识？</b><p>删除后 Lumi 不会再检索和引用它，已经回答过的内容不受影响。</p><div class="kb-row"><span class="kb-grow"></span>${btn('取消','cancel-remove')}${btn('删除','remove',`data-id="${x.id}"`,'is-danger')}</div></section></div>`:''}`;
 }

 /* ---------- 交互说明 ---------- */
 const NOTES={
  home:['定位：知识库不再是「项目」，而是一个个人知识存档。不分库、不建文件夹；分类靠 AI 入库时自动打的标签，列表上方按出现次数列出，点一下即筛选。','卖点一 · 快速内化：同一个框支持三种存入——粘链接（抖音、B 站、小红书、公众号、雪球、任意网页）、粘一段文字、传文件（「上传文件」按钮或把文件拖到页面任意位置；文档解析正文、图片识别文字、音视频转写语音）。Lumi 自动读取 → 保存原文 → 提炼要点 → 切成可检索的片段。全程不需要确认，失败时如实说明原因。','读取策略（由易到难，全程不代登录、不绕过付费墙和验证码）：① 服务端读取公开页面；② 被拦截时（如公众号对机房 IP 的「环境异常」）自动改由本机客户端读取——请求来自用户自己的网络、一次只读这一页，用户无感，进度里显示「被拦截，改用本机读取」；③ 仍需登录或验证时，卡片如实说明原因，并给三条路：在应用内打开（用户自己登录 / 验证后存当前页）、粘贴正文或字幕、上传截图识别文字。补救后仍是同一条知识，出处记为原链接。公众号另有入口：在微信里把文章转发给 Lumi。用「状态演示」切换下一个链接的结果。','冷启动：列表上方是「大 V 推荐」，按自选股和最近对话的主题推荐大 V 的内容合集，一键存入后给出「可以这样问」，存好即可在对话里试。空知识库时它是页面主体；之后可收起。推荐由运营挑选，作者认证信息取自原平台。','对话里是同一个流程：直接把链接发给 Lumi，或者说「把这个记下来」。开关「对话里的链接自动存档」关掉后，只有明确说要存时才存。','卖点二 · 工具接口（参考 Lenny’s Data 连接器）：kb_search → kb_read_excerpt → kb_read 逐级加载，kb_list 浏览目录，kb_save 写入。工具说明教模型把问题改写成「关键词|同义词」再搜；每个片段带 loc 与 source_url，回答据此标注引用，点击回到这里的原文位置；搜不到时返回说明而不是空结果。','页面只负责浏览、核对和删除；不提供编辑、打标签、分组等整理功能，这些交给 AI。','右上角统计与卡片上的「被引用 N 次」，用来让用户感到存下的东西真的被用上了。'],
  browser:['应用内浏览器加载的是真实页面，登录和验证由用户自己完成；Lumi 不代填账号密码，不保存登录信息，也不绕过验证码。','看到正文后「存这一页」才可用；只读取当前这一页，不翻页、不批量抓取。','存入后回到知识库，原来那张失败卡片变成读取进度，完成后是一条正常的知识，出处仍是原链接。','对话里失败卡片上的「在应用内打开」也进入这里。'],
  detail:['原文在存入时完整保存一份快照（视频是逐字稿 + 关键帧，图文含原图，文件保留原文件），原链接失效或作者删帖也不受影响；可复制、导出 Markdown。','「AI 提炼」是摘要和要点，给人看的；原文里标出的段落是检索片段，是 AI 检索和引用的单位，视频带时间点，文章带段落、页码。线框中的灰色占位行代表原文其余部分。','从对话里的引用点进来时，原文中对应片段高亮并滚动到位。','「在对话中问它」会在右侧对话区填好一个问题，由用户决定是否发送。','删除只影响之后的检索，不改已经发生的回答。']
 };
 function notesHtml(){
  const demo=S.view==='home'?`<div class="kb-seg kb-wrap">${[['normal','正常'],['empty','空知识库'],['login','下一个链接需要登录'],['blocked','下一个链接被验证拦截'],['fail','下一个视频没有语音']].map(([id,label])=>`<button type="button" class="${S.demo===id?'is-active':''}" data-act="demo" data-demo="${id}">${label}</button>`).join('')}</div>`:'';
  return `<button type="button" class="kb-notes-toggle" data-act="toggle-notes" aria-expanded="${S.notes}">交互说明</button>${S.notes?`<aside class="kb-notes" aria-label="交互说明"><b>交互说明</b><ul>${(NOTES[S.view]||[]).map(n=>`<li>${esc(n)}</li>`).join('')}</ul>${demo?`<b>状态演示</b>${demo}`:''}</aside>`:''}`;
 }

 /* ---------- 渲染与事件 ---------- */
 function draw(reset){
  if(!root?.isConnected)return;const scroller=root.querySelector('.kb-scroll'),scroll=scroller?.scrollTop||0,focus=document.activeElement?.dataset?.input;
  const tip=root.querySelector('.kb-toast');
  root.innerHTML=`<div class="kb-scroll">${S.view==='detail'?detail():S.view==='browser'?browser():home()}</div>${notesHtml()}`;if(tip)root.append(tip);
  const next=root.querySelector('.kb-scroll');next.scrollTop=reset?0:scroll;
  if(focus){const input=root.querySelector(`[data-input="${focus}"]`);if(input){input.focus({preventScroll:true});const n=input.value.length;try{input.setSelectionRange(n,n)}catch{}}}
  if(reset&&S.chunk)requestAnimationFrame(()=>root.querySelector('#chunk-'+S.chunk)?.scrollIntoView({block:'center'}));
 }
 function openChat(question){if(question)state.draft=question;if(state.mode!=='split')togglePageCopilot();else render({preservePage:true})}
 const acts={
  noop(){toast('交互稿：此处不展开')},
  home(){S.view='home';S.chunk=null;draw(true)},
  open(el){S.view='detail';S.id=el.dataset.id;S.chunk=null;draw(true)},
  filter(el){S.filter=el.dataset.filter;draw()},
  tag(el){S.tag=S.tag===el.dataset.tag?'':el.dataset.tag;draw()},
  'add-submit'(){const v=S.add.trim();if(!v){toast('先粘贴链接或文字，也可以点「上传文件」');return}const r=ingest(v);S.add='';if(r.dup){toast('这条内容已经存过了，不会重复保存');S.view='detail';S.id=r.dup.id;draw(true);return}if(S.demo==='empty')S.demo='normal';S.filter='all';S.q='';S.tag='';draw()},
  'picks-next'(){S.pickPage++;draw()},
  'picks-toggle'(){S.picksOpen=!S.picksOpen;draw()},
  'pick-save'(el){const p=PICKS[el.dataset.i];p.items.forEach((it,i)=>setTimeout(()=>{ingest(it[2],{via:'大 V 推荐',sample:pickSample(p,it)});if(S.demo==='empty'){S.demo='normal';draw()}},i*250));toast(`正在存入${p.who}的 ${p.items.length} 条内容，存好后就能问`)},
  'pick-ask'(el){const p=PICKS[el.dataset.i];openChat(p.ask);toast('问题已填入对话框，Lumi 会引用刚存的内容回答')},
  'copy-original'(){toast('已复制原文（含出处）')},
  retry(el){fix(el.dataset.id,{how:'retry'})},
  browse(el){S.view='browser';S.id=el.dataset.id;S.unlocked=false;draw(true)},
  unlock(){S.unlocked=true;draw()},
  'browse-save'(el){fix(el.dataset.id,{how:'browser'});S.view='home';draw(true);toast('正在读取你看到的这一页')},
  'paste-open'(el){S.pasteFor=el.dataset.id;S.paste='';draw();root.querySelector('[data-input="paste"]')?.focus()},
  'paste-cancel'(){S.pasteFor=null;draw()},
  'paste-save'(el){if(S.paste.trim().length<10){toast('正文太短了，多粘贴一些');return}fix(el.dataset.id,{how:'paste',text:S.paste});S.pasteFor=null;S.paste='';draw()},
  remove(el){S.confirm=null;remove(el.dataset.id);toast('已删除，Lumi 之后不会再引用它')},
  'confirm-remove'(el){S.confirm=el.dataset.id;draw()},
  'cancel-remove'(el,e){if(el.classList.contains('kb-backdrop')&&e.target!==el)return;S.confirm=null;draw()},
  ask(el){const x=get(el.dataset.id);openChat(`根据我存的「${x.title}」，${x.kind==='video'?'这个视频':'这篇内容'}的核心观点是什么？哪些地方需要再验证？`);toast('问题已填入对话框，点击发送即可')},
  toggle(el){const k=el.dataset.key;settings[k]=!settings[k];toast({autoSearch:settings[k]?'已开启：对话时会先查知识库':'已关闭：对话不再自动检索知识库',autoSave:settings[k]?'已开启：发给 Lumi 的链接会自动存档':'已关闭：只有明确说「存一下」时才存'}[k]);draw()},
  'toggle-notes'(){S.notes=!S.notes;draw()},
  demo(el){S.demo=el.dataset.demo;draw()}
 };
 function bind(){
  root.onclick=e=>{const el=e.target.closest('[data-act]');if(!el||el.disabled)return;e.preventDefault();e.stopPropagation();acts[el.dataset.act]?.(el,e)};
  root.onsubmit=e=>{e.preventDefault();acts['add-submit']()};
  root.onkeydown=e=>{if(e.key==='Escape'&&S.confirm){S.confirm=null;draw();return}if((e.key==='Enter'||e.key===' ')&&e.target.matches('.kn-item[role="button"],.kn-upload')){e.preventDefault();e.target.click()}};
  root.oninput=e=>{const key=e.target.dataset.input;if(!key)return;S[key]=e.target.value;if(key==='q')draw()};
  /* 选文件或拖文件：每个文件各存一条，原文件本身也保存。 */
  const addFiles=files=>{const list=[...files];if(!list.length)return;let skipped=0;for(const f of list){if(detect(f.name).kind==='file')ingest(f.name);else skipped++}if(S.demo==='empty')S.demo='normal';S.filter='all';S.q='';S.tag='';S.view='home';draw();toast(skipped?`已开始存入 ${list.length-skipped} 个文件，${skipped} 个格式暂不支持`:`已开始存入 ${list.length} 个文件`)};
  root.onchange=e=>{if(e.target.matches('[data-file]')){addFiles(e.target.files);e.target.value=''}else if(e.target.dataset.shot&&e.target.files.length){fix(e.target.dataset.shot,{how:'shot'});toast(`正在识别 ${e.target.files.length} 张截图里的文字`)}};
  const hasFiles=e=>[...(e.dataTransfer?.types||[])].includes('Files');
  root.ondragover=e=>{if(!hasFiles(e)||S.view!=='home')return;e.preventDefault();if(!S.dragging){S.dragging=true;draw()}};
  root.ondragleave=e=>{if(S.dragging&&!root.contains(e.relatedTarget)){S.dragging=false;draw()}};
  root.ondrop=e=>{if(!hasFiles(e)||S.view!=='home')return;e.preventDefault();S.dragging=false;addFiles(e.dataTransfer.files)};
 }
 function mount(wb){root=document.createElement('section');root.className='kb-page';root.dataset.morePage='projects';root.setAttribute('aria-label','知识库');wb.append(root);bind();draw();return root}
 /* 供对话区跳转：打开某条知识，并高亮被引用的片段。 */
 function open({id,chunk:c=null}={}){S.view='detail';S.id=id;S.chunk=c;if(state.nav!=='知识库')navigate('知识库');else draw(true)}
 function browse(id){S.view='browser';S.id=id;S.unlocked=false;if(state.nav!=='知识库')navigate('知识库');else draw(true)}
 return {mount,open,browse,ingest,fix,remove,search,rewrite,cite,settings,get,detect,FAILS};
})();
