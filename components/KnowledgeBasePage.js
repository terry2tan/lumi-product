/* 知识库（原「项目」）交互稿：线框保真度，主要流程可点。
   对应需求稿 lumi/docs/requirements-pool/agent/knowledge-base/REQUIREMENTS.md（R1–R10）。 */
window.KnowledgeBasePage=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const STATUS={ready:['可问答','已提取正文，可检索、可引用'],partial:['部分可用','只提取到部分正文，回答可能不完整'],saved:['仅保存','没有可检索的正文，不能用于问答'],parsing:['解析中','正在提取正文并建立索引'],failed:['解析失败','未能提取正文，可重试或手动粘贴文字']};
 const ORIGINAL=['对话沉淀','粘贴文字','新建笔记'];
 /* 可在应用内编辑的是 Markdown / 纯文本类资料：笔记、网页收藏、保存的 AI 回答、资料包里的 .md。 */
 const editable=d=>['笔记','Markdown','网页'].includes(d.type)&&!['parsing','failed'].includes(d.status);
 let seq=100;
 const doc=(title,type,source,status,date,more={})=>({id:'d'+(++seq),title,type,source,status,date,tags:[],stocks:[],points:[],summary:'',...more});
 const libs=[
  {id:'cpo',name:'CPO行业研究',desc:'跟踪 CPO 技术路线、产业链公司与海外资本开支。',folder:'D:\\投研\\CPO行业研究',updated:'刚刚',autoOrganize:true,instruction:'回答先给结论，再列依据；涉及数字必须注明资料与日期。',chats:['产业链与市场空间','重点公司财务对比'],tasks:['每周一 9:00 汇总上周新增资料的观点变化'],docs:[
   doc('光模块行业深度：CPO 技术路线与产业链.pdf','PDF','本地上传','ready','2026-09-18',{tags:['CPO','光模块','产业链'],stocks:['中际旭创','新易盛','天孚通信'],summary:'梳理 CPO 相对可插拔方案的功耗与密度优势，拆解光引擎、外置光源、封装三个环节的价值量分布。',points:['2027 年前可插拔仍是主流，CPO 先在交换机侧落地','光引擎与外置光源是价值量最集中的两个环节']}),
   doc('海外云厂商资本开支跟踪（2026Q3）.docx','DOCX','本地上传','ready','2026-10-08',{tags:['资本开支','云厂商'],stocks:['中际旭创'],summary:'汇总四家海外云厂商最近一个季度的资本开支指引与同比变化。',points:['资本开支指引整体上修，但各家节奏分化']}),
   doc('CPO 渗透率的三个分歧','网页','网页收藏','ready','2026-10-11',{platform:'雪球',author:'光通信观察',url:'https://xueqiu.com/1234567/298765432',captured:'2026-10-11 21:14',tags:['CPO','渗透率'],stocks:['新易盛'],summary:'作者列出市场对 CPO 渗透节奏的三处分歧：良率、可维护性、客户导入时间。',points:['分歧集中在量产良率，而非技术可行性']}),
   doc('硅光与 CPO 技术讲解（字幕）','网页','网页收藏','partial','2026-10-09',{platform:'B 站',author:'半导体课堂',url:'https://www.bilibili.com/video/BV1xx411c7mD',captured:'2026-10-09 20:02',tags:['硅光'],summary:'平台字幕只覆盖前 18 分钟，后半段无字幕。',points:[]}),
   doc('AI 回答：CPO 产业链上下游梳理','笔记','对话沉淀','ready','2026-10-12',{aiGenerated:true,fromChat:'产业链与市场空间',tags:['产业链'],stocks:['天孚通信','太辰光'],summary:'按上游器件、中游封装、下游设备整理的产业链清单。',points:['上游器件国产化率差异大']}),
   doc('我的笔记：跟踪指标清单','笔记','粘贴文字','ready','2026-10-10',{refs:[],bodyHtml:'<h3>每季度更新</h3><ul><li>海外云厂商资本开支指引</li><li>800G / 1.6T 光模块出货节奏</li><li>头部客户 CPO 导入时间表</li></ul><blockquote>下次财报季补上 1.6T 的出货口径。</blockquote>',tags:['跟踪指标'],summary:'每季度需要更新的六个指标及其数据来源。',points:['核心看海外资本开支与 800G/1.6T 出货节奏'],annotation:'下次财报季补上 1.6T 的出货口径。'}),
   doc('机构调研纪要（扫描件）.pdf','PDF','本地上传','saved','2026-09-30'),
   doc('产业链图谱.png','图片','本地上传','saved','2026-09-21'),
   doc('加密研报.pdf','PDF','本地上传','failed','2026-10-12',{error:'文件已加密，无法提取正文'})
  ],artifacts:['CPO 产业链对比表.xlsx','重点公司财务对比报告.html']},
  {id:'power',name:'电力短线分析',desc:'由原「项目」升级而来，资料正在后台建立索引。',folder:'D:\\投研\\电力短线分析',updated:'1 天前',indexing:62,autoOrganize:true,instruction:'',chats:['火电与绿电轮动复盘'],tasks:[],docs:[
   doc('电力板块 9 月复盘.md','Markdown','本地上传','ready','2026-10-01',{tags:['复盘'],summary:'按周记录板块涨跌与成交结构。',points:['成交集中在龙头，后排跟随度弱']}),
   doc('煤价与火电盈利弹性测算.xlsx','表格','本地上传','parsing','2026-10-11'),
   doc('电改政策文件汇编.pdf','PDF','本地上传','parsing','2026-10-11')
  ],artifacts:[]},
  {id:'value',name:'价值股分析',desc:'高股息与低估值标的的长期跟踪。',folder:'D:\\投研\\价值股分析',updated:'3 天前',autoOrganize:false,instruction:'',chats:['高股息组合再平衡'],tasks:[],docs:[
   doc('红利指数成分股对比.docx','DOCX','本地上传','ready','2026-09-12',{tags:['红利'],summary:'（已关闭自动整理，未生成摘要）'})
  ],artifacts:[]},
  {id:'fin',name:'财报阅读与核验',desc:'从阅读顺序、指标口径到证据核验的研究方法。',folder:'D:\\投研\\财报阅读与核验',updated:'5 天前',autoOrganize:true,instruction:'',fromPack:'p-fin',packVersion:'1.0',updateTo:'1.1',chats:[],tasks:[],docs:[
   doc('财报阅读的五步清单.md','Markdown','资料包','ready','2026-08-20',{tags:['财报','方法'],summary:'确认范围、阅读业务变化、三表联读、查看附注、留下下一步。',points:['每个结论至少对应一处原始证据']}),
   doc('财报比较口径检查表.md','Markdown','资料包','ready','2026-08-20',{tags:['财报','口径'],summary:'比较两期财报前需要核对的主体、期间、单位与指标口径。',points:[],annotation:'我加了港股披露口径的差异。',edited:true}),
   doc('业绩判断记录模板.md','Markdown','资料包','ready','2026-08-20',{tags:['模板'],summary:'记录尚未证实的业绩判断及其验证条件。',points:[]})
  ],artifacts:[]}
 ];
 const packs=[
  {id:'p-fin',group:'official',name:'财报阅读与核验',author:'同花顺投研学院',badge:'官方',version:'1.1',updated:'2026-10-10',count:4,cat:'财报研究',intro:'从阅读顺序、指标口径到证据核验，把财报中的数字整理成有依据的研究记录。',nature:'研究方法整理，不构成投资建议。',toc:['财报阅读的五步清单','财报比较口径检查表','业绩判断记录模板','现金流质量核对表（1.1 新增）'],questions:['第一次阅读一家公司的财报，应该按什么顺序？','比较两期财报之前，要先核对哪些口径？'],libId:'fin'},
  {id:'p-value',group:'official',name:'价值投资研究清单',author:'同花顺投研学院',badge:'官方',version:'1.0',updated:'2026-09-28',count:3,cat:'价值研究',intro:'看懂企业如何赚钱，梳理竞争优势与现金去向，留下有证据的价值研究笔记。',nature:'研究方法整理，人物名称仅用于主题发现，不代表本人观点或背书。',toc:['企业如何赚钱：商业模式阅读清单','竞争优势：从判断到证据','资本配置记录表'],questions:['按商业模式清单，我还缺哪些原始资料？','哪些竞争优势判断只有说法，还没有证据？']},
  {id:'p-industry',group:'official',name:'行业研究入门',author:'同花顺投研学院',badge:'官方',version:'2.0',updated:'2026-09-15',count:5,cat:'行业研究',intro:'从产业链拆解到景气跟踪的入门方法与模板。',nature:'研究方法整理，不构成投资建议。',toc:['产业链拆解模板','景气指标清单','竞争格局分析框架','行业研究提纲','访谈问题清单'],questions:['帮我整理一份行业研究提纲','如何跟踪产业链景气变化？']},
  {id:'p-mood',group:'community',name:'短线情绪周期复盘',author:'老陈复盘',badge:'投资顾问',version:'3.2',updated:'2026-10-12',count:18,downloads:'2.3 万',cat:'短线复盘',intro:'三年的日度情绪周期复盘笔记与记录模板。',nature:'用户发布的原创笔记。第三方资料只提供标题与原文链接。不构成投资建议。',toc:['情绪周期四阶段判断表','2026 年 9 月复盘笔记','龙头识别记录模板','（仅链接）某财经媒体：成交额与情绪的关系'],questions:['当前处于情绪周期的哪个阶段，依据是什么？']},
  {id:'p-semi',group:'community',name:'半导体设备跟踪',author:'芯片小王',badge:'精选',version:'1.4',updated:'2026-10-05',count:11,downloads:'8,620',cat:'行业研究',intro:'设备国产化率、订单与验证进度的持续跟踪笔记。',nature:'用户发布的原创笔记。第三方资料只提供标题与原文链接。不构成投资建议。',toc:['设备国产化率跟踪表','订单与验证进度笔记','（仅链接）公司公告：重大合同'],questions:['哪些环节的国产化率提升最快？']},
  {id:'p-div',group:'community',name:'红利低波研究笔记',author:'稳稳的幸福',badge:'',version:'1.0',updated:'2026-09-20',count:7,downloads:'1,204',cat:'价值研究',intro:'红利低波策略的选股条件与回撤记录。',nature:'用户发布的原创笔记。不构成投资建议。',toc:['选股条件清单','历年回撤记录','再平衡规则'],questions:['红利低波策略在什么环境下容易失效？']}
 ];
 const publications=[{libId:'value',name:'价值股分析',status:'未通过',reason:'简介中含收益承诺表述，请修改后重新提交。',version:'1.0'}];
 const bookmarks=[{name:'光通信观察（雪球）',url:'https://xueqiu.com/u/1234567'},{name:'半导体课堂（B 站）',url:'https://space.bilibili.com/100200'}];
 const PLATFORM={
  '通用文章':'提取标题、正文段落与表格；过滤隐藏内容和图标噪声。',
  '雪球':'长文按通用文章规则提取；短帖只取当前这一条，不含评论。',
  '贴吧':'需进入具体帖子的第一页；只取当前可见的主帖，不含跟帖。帖子列表页不作为正文。',
  '小红书':'只取笔记详情页的可见文字、标题、作者与已加载的图片链接；纯图片笔记没有可用文字。',
  'B 站':'读取平台已有字幕并保留时间戳；没有字幕时不保存，不用视频简介替代。'
 };
 const S={view:'home',libId:null,docId:null,packId:null,tab:'overview',homeQ:'',docQ:'',fSource:'全部',fStatus:'全部',fTag:'',modal:null,notes:false,menu:null,libState:'normal',readOnlyDoc:null,
  clip:{url:'',stage:'idle',platform:'通用文章',mode:'正文',outcome:'ok',target:'cpo',title:'',note:'',bookmark:false,newLib:false},
  pub:{step:1,libId:null,checked:{},agree:false},draftNew:{name:'',desc:'',folderMode:'default'},downloading:{}};
 let root=null,toastTimer=0;
 const inLib=()=>['lib','doc','note'].includes(S.view)?S.libId:null;
 const targetId=()=>S.modalTarget||inLib()||S.lastLib||libs[0]?.id;
 const makeLib=name=>{const l={id:'n'+(++seq),name,desc:'',folder:'D:\\投研\\'+name,updated:'刚刚',autoOrganize:true,instruction:'',chats:[],tasks:[],docs:[],artifacts:[]};libs.unshift(l);return l};
 const lib=()=>libs.find(l=>l.id===S.libId),curDoc=()=>lib()?.docs.find(d=>d.id===S.docId),pack=()=>packs.find(p=>p.id===S.packId);
 const chip=(text,cls='')=>`<span class="kb-chip ${cls}">${esc(text)}</span>`;
 const statusChip=d=>`<span class="kb-chip kb-status is-${d.status}" title="${esc(STATUS[d.status][1])}">${STATUS[d.status][0]}</span>`;
 const btn=(label,act,attrs='',cls='')=>`<button type="button" class="kb-btn ${cls}" data-act="${act}" ${attrs}>${esc(label)}</button>`;
 const link=(label,act,attrs='')=>`<button type="button" class="kb-link" data-act="${act}" ${attrs}>${esc(label)}</button>`;
 const lines=(n=3)=>`<div class="wf-text">${Array.from({length:n},(_,i)=>`<span class="wf-line" style="--wf-line-width:${[92,100,78,96,64][i%5]}%;max-width:none"></span>`).join('')}</div>`;
 const crumb=items=>`<nav class="kb-crumb" aria-label="位置">${items.map(([label,act,attrs],i)=>i<items.length-1?`${link(label,act,attrs||'')}<span>/</span>`:`<b>${esc(label)}</b>`).join('')}</nav>`;
 function toast(text){clearTimeout(toastTimer);let t=root.querySelector('.kb-toast');if(!t){t=document.createElement('div');t.className='kb-toast';t.setAttribute('role','status');root.append(t)}t.textContent=text;t.hidden=false;toastTimer=setTimeout(()=>t.hidden=true,2600)}

 /* ---------- 首页 ---------- */
 function libCard(l){
  const ready=l.docs.filter(d=>d.status==='ready'||d.status==='partial').length;
  return `<article class="kb-card" data-act="open-lib" data-id="${l.id}" tabindex="0" role="button" aria-label="打开知识库 ${esc(l.name)}">
   <div class="kb-card-head"><span class="kb-cover" aria-hidden="true"></span><div><h3>${esc(l.name)}</h3><p class="kb-sub">${l.docs.length} 份资料 · ${ready} 份可问答 · ${esc(l.updated)}更新</p></div></div>
   <p class="kb-desc">${esc(l.desc)}</p>
   <div class="kb-card-foot">${l.indexing?chip(`建立索引中 ${l.indexing}%`,'is-parsing'):''}${l.updateTo?chip(`有更新 v${l.updateTo}`,'is-notice'):''}${l.fromPack?chip('来自资料包'):''}${publications.some(p=>p.libId===l.id)?chip('已提交发布'):''}</div>
  </article>`;
 }
 function packCard(p){
  const added=!!p.libId,loading=S.downloading[p.id];
  return `<article class="kb-card" data-act="open-pack" data-id="${p.id}" tabindex="0" role="button" aria-label="预览 ${esc(p.name)}">
   <div class="kb-card-head"><span class="kb-cover" aria-hidden="true"></span><div><h3>${esc(p.name)}</h3><p class="kb-sub">${esc(p.author)}${p.badge?` · <span class="kb-badge">认证·${esc(p.badge)}</span>`:''}</p></div></div>
   <p class="kb-desc">${esc(p.intro)}</p>
   <div class="kb-card-foot"><span class="kb-sub">${p.count} 份资料 · v${p.version}${p.downloads?` · ${p.downloads} 次添加`:''}</span><span class="kb-grow"></span>${added?chip('已添加'):loading?chip(`下载中 ${loading}%`,'is-parsing'):btn('添加','add-pack',`data-id="${p.id}"`,'is-small')}</div>
  </article>`;
 }
 function home(){
  const q=S.homeQ.trim(),hit=x=>!q||x.name.includes(q)||(x.intro||x.desc||'').includes(q);
  const mine=libs.filter(hit),official=packs.filter(p=>p.group==='official'&&hit(p)),community=packs.filter(p=>p.group==='community'&&hit(p));
  const section=(title,sub,body,extra='')=>`<section class="kb-section"><div class="kb-row"><h2>${title}</h2><span class="kb-sub">${sub}</span><span class="kb-grow"></span>${extra}</div><div class="kb-grid">${body||'<p class="kb-empty">没有找到相关知识库</p>'}</div></section>`;
  return `<header class="kb-head"><h1 tabindex="-1">知识库</h1><div class="kb-head-tools"><input class="kb-input" type="search" data-input="homeQ" value="${esc(S.homeQ)}" placeholder="搜索知识库" aria-label="搜索知识库"><span class="kb-menu-anchor">${btn('添加资料 ▾','lib-menu','data-menu="home-add" aria-haspopup="menu"')}${S.menu==='home-add'?`<div class="kb-menu is-right" role="menu"><button type="button" role="menuitem" data-act="new-note">新建笔记</button><button type="button" role="menuitem" data-act="modal" data-modal="upload">上传文件</button><button type="button" role="menuitem" data-act="modal" data-modal="paste">粘贴文字</button><button type="button" role="menuitem" data-act="new-clip">从网页收藏</button></div>`:''}</span>${btn('新建知识库','modal','data-modal="new-lib"','is-primary')}</div></header>
   ${section('我的知识库',`${mine.length} 个`,mine.map(libCard).join(''),link('我的发布','go','data-view="publications"'))}
   ${section('官方推荐','运营提供，已过合规审核',official.map(packCard).join(''))}
   ${section('社区推荐','用户发布，先审后发',community.map(packCard).join(''),link('发布我的知识库','start-publish'))}
   <p class="kb-hint">社区内容为用户原创笔记，第三方资料只提供标题与原文链接。内容仅供参考，不构成投资建议。</p>`;
 }

 /* ---------- 知识库详情 ---------- */
 function libBanners(l){
  let out='';
  if(S.libState==='folder-missing')out+=`<div class="kb-banner is-warn"><span>找不到关联的文件夹：${esc(l.folder)}。资料暂时无法打开和检索。</span><span class="kb-grow"></span>${btn('重新选择文件夹','relink-folder','','is-small')}</div>`;
  if(l.indexing)out+=`<div class="kb-banner"><span>正在为已有文件建立索引（${l.indexing}%）。期间可以正常浏览和对话，尚未完成的资料暂时搜不到。</span><span class="kb-progress" aria-hidden="true"><i style="width:${l.indexing}%"></i></span></div>`;
  if(l.updateTo)out+=`<div class="kb-banner is-notice"><span>作者发布了新版本 v${l.updateTo}（你当前是 v${l.packVersion}）。</span><span class="kb-grow"></span>${btn('查看更新','modal','data-modal="update"','is-small')}</div>`;
  return out;
 }
 function overview(l){
  const usable=l.docs.filter(d=>d.status==='ready'||d.status==='partial');
  const tags={},stocks={};for(const d of l.docs){for(const t of d.tags)tags[t]=(tags[t]||0)+1;for(const s of d.stocks)stocks[s]=(stocks[s]||0)+1}
  const points=l.docs.flatMap(d=>d.points.map(p=>({p,d}))).slice(0,5);
  const stat=(n,label)=>`<div class="kb-stat"><b>${n}</b><span>${label}</span></div>`;
  if(!l.docs.length)return emptyLib();
  return `<div class="kb-stats">${stat(l.docs.length,'资料')}${stat(usable.length,'可问答')}${stat(l.docs.filter(d=>d.status==='saved').length,'仅保存')}${stat(l.docs.filter(d=>d.date>='2026-10-07').length,'本周新增')}</div>
   <div class="kb-two"><section class="kb-panel"><div class="kb-row"><b>最近新增的观点</b>${chip('AI 生成','is-ai')}</div>${l.autoOrganize?(points.map(({p,d})=>`<div class="kb-point"><p>${esc(p)}</p>${link('出自：'+d.title,'open-doc',`data-id="${d.id}"`)}</div>`).join('')||'<p class="kb-empty">暂无</p>'):`<p class="kb-empty">已关闭自动整理，不会生成观点。可在「设置」中开启。</p>`}</section>
   <section class="kb-panel"><b>主题分布</b><div class="kb-row kb-wrap">${Object.entries(tags).map(([t,n])=>`<button type="button" class="kb-chip is-action" data-act="filter-tag" data-tag="${esc(t)}">${esc(t)} ${n}</button>`).join('')||'<span class="kb-sub">暂无标签</span>'}</div><b>涉及标的</b><div class="kb-row kb-wrap">${Object.entries(stocks).map(([s,n])=>chip(`${s} ${n}`)).join('')||'<span class="kb-sub">暂无</span>'}</div></section></div>
   <section class="kb-panel"><b>可以这样问</b><div class="kb-row kb-wrap">${['这个库里有哪些资料，各自讲了什么？','不同资料对 CPO 渗透节奏的看法有什么分歧？','还缺哪些资料才能回答量产良率的问题？'].map(q=>`<button type="button" class="kb-chip is-action" data-act="ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></section>`;
 }
 const emptyLib=()=>`<div class="kb-empty-box"><p>这里还没有资料</p><p class="kb-sub">写一篇笔记、上传文件、粘贴文字，或从网页收藏。资料会保存在这个知识库的文件夹里。</p><div class="kb-row kb-wrap" style="justify-content:center">${btn('新建笔记','new-note','','is-primary')}${btn('上传文件','modal','data-modal="upload"')}${btn('粘贴文字','modal','data-modal="paste"')}${btn('从网页收藏','new-clip')}</div></div>`;
 function docsTab(l){
  if(S.libState==='empty'||!l.docs.length)return emptyLib();
  const q=S.docQ.trim(),sources=['全部',...new Set(l.docs.map(d=>d.source))];
  const rows=l.docs.filter(d=>(S.fSource==='全部'||d.source===S.fSource)&&(S.fStatus==='全部'||STATUS[d.status][0]===S.fStatus)&&(!S.fTag||d.tags.includes(S.fTag))&&(!q||d.title.includes(q)||d.summary.includes(q)||d.tags.some(t=>t.includes(q))));
  const select=(key,options,label)=>`<label class="kb-select"><span>${label}</span><select data-select="${key}" aria-label="${label}">${options.map(o=>`<option ${S[key]===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
  return `<div class="kb-row kb-wrap kb-toolbar"><input class="kb-input kb-grow" type="search" data-input="docQ" value="${esc(S.docQ)}" placeholder="搜索标题、标签或正文" aria-label="搜索资料">${select('fSource',sources,'来源')}${select('fStatus',['全部',...Object.values(STATUS).map(s=>s[0])],'状态')}${S.fTag?`<span class="kb-chip is-action">标签：${esc(S.fTag)}<button type="button" data-act="filter-tag" data-tag="" aria-label="清除标签筛选">×</button></span>`:''}</div>
   <div class="kb-table" role="table" aria-label="资料列表"><div class="kb-tr kb-th" role="row"><span>标题</span><span>来源</span><span>状态</span><span>标签</span><span>日期</span><span></span></div>
   ${rows.map(d=>`<div class="kb-tr" role="row"><span class="kb-title-cell"><button type="button" class="kb-link" data-act="open-doc" data-id="${d.id}">${esc(d.title)}</button>${d.aiGenerated?chip('AI 生成','is-ai'):''}${q&&d.summary.includes(q)?`<small>命中正文：…${esc(d.summary.slice(Math.max(0,d.summary.indexOf(q)-12),d.summary.indexOf(q)+q.length+18))}…</small>`:''}</span><span>${esc(d.source)}${d.platform?` · ${esc(d.platform)}`:''}</span><span>${statusChip(d)}</span><span class="kb-tags">${d.tags.map(t=>chip(t)).join('')}</span><span>${d.date}</span><span class="kb-menu-anchor"><button type="button" class="kb-icon" data-act="doc-menu" data-id="${d.id}" aria-label="${esc(d.title)} 的操作" aria-haspopup="menu">⋯</button>${S.menu===d.id?docMenu(d):''}</span></div>`).join('')||'<p class="kb-empty">没有找到相关资料，换一个关键词或调整筛选。</p>'}</div>
   <p class="kb-hint">「仅保存」的资料（图片、音视频、扫描件）可以打开和下载，但没有可检索的正文，不会出现在回答依据里。</p>`;
 }
 const docMenu=d=>`<div class="kb-menu" role="menu">${[...(editable(d)?[['编辑','edit-note']]:[]),['引用到对话','cite-doc'],['复制到其他知识库','copy-doc'],...(d.status==='failed'?[['重试解析','retry-doc']]:[]),...(d.status==='ready'?[['重新整理','reorganize']]:[]),['在文件夹中显示','reveal'],['删除','delete-doc']].map(([label,act])=>`<button type="button" role="menuitem" data-act="${act}" data-id="${d.id}">${label}</button>`).join('')}</div>`;
 function chatsTab(l){
  return `<div class="kb-row">${btn('在此知识库中新对话','new-chat','','is-primary')}<span class="kb-sub">在知识库内发起的对话默认可检索本库，无需手动引用。</span></div>
   <div class="kb-list">${l.chats.map(c=>`<button type="button" class="kb-list-row" data-act="open-chat" data-title="${esc(c)}"><span>${esc(c)}</span><span class="kb-sub">打开对话</span></button>`).join('')||'<p class="kb-empty">还没有对话</p>'}</div>
   <section class="kb-panel kb-sample" aria-label="示例：库内对话的回答形态"><div class="kb-row"><b>示例：带出处的回答</b><span class="kb-sub">（回答形态示意，真实回答在左侧对话区）</span></div>
    <p class="kb-bubble">不同资料对 CPO 渗透节奏的看法有什么分歧？</p>
    <div class="kb-answer"><p>库内三份资料的分歧集中在量产良率，而不是技术可行性<sup>[1]</sup>。行业深度报告认为 2027 年前可插拔仍是主流，CPO 先在交换机侧落地<sup>[2]</sup>；雪球作者则认为客户导入时间可能更早<sup>[1]</sup>。</p>
     <p class="kb-sub">本库没有关于具体良率数据的资料，以上未包含良率数字。可以补充相关调研纪要后再问。</p>
     <div class="kb-sources"><span class="kb-sub">依据</span>${l.docs.slice(0,3).filter(d=>d.status==='ready').slice(0,2).map((d,i)=>`<button type="button" class="kb-source" data-act="open-doc" data-id="${d.id}">[${i+1}] ${esc(d.title)} · ${d.date}${d.type==='PDF'?' · 第 12 页':''}</button>`).join('')}</div>
     <div class="kb-row">${btn('保存到知识库','save-answer-sample','','is-small')}${btn('复制','noop','','is-small')}</div></div>
    <p class="kb-hint">只依据引用范围内的资料作答；找不到依据时如实说明，不扩大到其他知识库，也不用通用知识冒充库内结论。</p></section>`;
 }
 const artifactsTab=l=>`<div class="kb-list">${l.artifacts.map(a=>`<div class="kb-list-row"><span>${esc(a)}</span><span class="kb-row">${btn('保存为知识库资料','save-artifact',`data-name="${esc(a)}"`,'is-small')}${btn('打开','noop','','is-small')}</span></div>`).join('')||'<p class="kb-empty">暂无对话产物。对话中生成的报告、表格会出现在这里。</p>'}</div><p class="kb-hint">对话产物默认不进入检索。保存为资料后会被解析、整理，并可在回答中被引用。</p>`;
 function settingsTab(l){
  return `<section class="kb-panel"><b>知识库指令</b><textarea class="kb-textarea" data-input="lib.instruction" placeholder="例如：回答先给结论，再列依据；涉及数字必须注明资料与日期。" aria-label="知识库指令">${esc(l.instruction)}</textarea><p class="kb-hint">约束本库内对话的处理方式与输出要求。</p></section>
   <section class="kb-panel"><div class="kb-row"><div class="kb-grow"><b>入库时自动整理</b><p class="kb-hint">每份可问答的资料入库后自动生成摘要、标签、涉及标的与核心观点。整理会把资料内容发送给模型并消耗额度。</p></div><button type="button" class="kb-toggle ${l.autoOrganize?'is-on':''}" data-act="toggle-organize" role="switch" aria-checked="${!!l.autoOrganize}" aria-label="入库时自动整理"><i></i></button></div></section>
   <section class="kb-panel"><b>关联文件夹</b><div class="kb-row"><code class="kb-grow">${esc(l.folder)}</code>${btn('打开文件夹','reveal','','is-small')}${btn('重新选择','relink-folder','','is-small')}</div><p class="kb-hint">文件夹是资料的唯一存放处。在资源管理器里新增、修改、删除文件后，这里会自动跟上。索引与整理结果可随时从文件夹重建。</p><div class="kb-row">${btn('重新建立索引','reindex','','is-small')}</div></section>
   <section class="kb-panel"><b>自动任务</b>${l.tasks.map(t=>`<div class="kb-list-row"><span>${esc(t)}</span><span class="kb-sub">可检索本库</span></div>`).join('')||'<p class="kb-empty">暂无关联的自动任务</p>'}</section>
   <section class="kb-panel"><b>删除知识库</b><p class="kb-hint">只解除关联并删除索引，文件夹和其中的文件保留。</p>${btn('删除知识库','delete-lib','','is-small is-danger')}</section>`;
 }
 function libView(){
  const l=lib();if(!l)return home();
  const tabs=[['overview','概览'],['docs',`资料 ${l.docs.length}`],['chats',`对话 ${l.chats.length}`],['artifacts','对话产物'],['settings','设置']];
  const body={overview,docs:docsTab,chats:chatsTab,artifacts:artifactsTab,settings:settingsTab}[S.tab](l);
  return `${crumb([['知识库','go','data-view="home"'],[l.name]])}
   <header class="kb-head"><div class="kb-row kb-grow"><span class="kb-cover is-large" aria-hidden="true"></span><div><h1 tabindex="-1">${esc(l.name)}</h1><p class="kb-sub">${esc(l.desc)}</p><p class="kb-sub"><code>${esc(l.folder)}</code></p></div></div>
    <div class="kb-head-tools">${btn('新对话','new-chat')}<span class="kb-menu-anchor">${btn('添加资料 ▾','lib-menu','data-menu="add"','is-primary')}${S.menu==='add'?`<div class="kb-menu" role="menu"><button type="button" role="menuitem" data-act="new-note">新建笔记</button><button type="button" role="menuitem" data-act="modal" data-modal="upload">上传文件</button><button type="button" role="menuitem" data-act="modal" data-modal="paste">粘贴文字</button><button type="button" role="menuitem" data-act="new-clip">从网页收藏</button></div>`:''}</span>${btn('发布到社区','start-publish',`data-id="${l.id}"`)}<span class="kb-menu-anchor"><button type="button" class="kb-icon" data-act="lib-menu" data-menu="more" aria-label="更多操作" aria-haspopup="menu">⋯</button>${S.menu==='more'?`<div class="kb-menu is-right" role="menu"><button type="button" role="menuitem" data-act="modal" data-modal="edit-lib">编辑名称、简介与封面</button><button type="button" role="menuitem" data-act="reindex">重新建立索引</button><button type="button" role="menuitem" data-act="delete-lib">删除知识库</button></div>`:''}</span></div></header>
   ${libBanners(l)}
   <div class="kb-tabs" role="tablist">${tabs.map(([id,label])=>`<button type="button" role="tab" aria-selected="${S.tab===id}" class="${S.tab===id?'is-active':''}" data-act="tab" data-tab="${id}">${label}</button>`).join('')}</div>
   <div class="kb-tab-body">${S.libState==='folder-missing'&&S.tab!=='settings'?'<p class="kb-empty">文件夹不可用。重新选择文件夹后恢复。</p>':body}</div>`;
 }

 /* ---------- 资料阅读 ---------- */
 function docView(){
  const l=lib(),d=curDoc();if(!d)return libView();
  const noText=d.status==='saved'||d.status==='failed'||d.status==='parsing';
  const origin=d.source==='网页收藏'?`<div class="kb-origin"><b>出处</b><span>${esc(d.platform)} · ${esc(d.author)} · 采集于 ${esc(d.captured)}</span>${link('查看原网页 ↗','noop')}<code>${esc(d.url)}</code></div>`:d.source==='对话沉淀'?`<div class="kb-origin"><b>出处</b><span>保存自对话「${esc(d.fromChat)}」 · ${d.date}</span>${chip('AI 生成 · 待核对','is-ai')}</div>`:'';
  const body=d.status==='saved'?`<div class="kb-empty-box"><p>仅保存：这份资料没有可检索的正文</p><p class="kb-sub">图片、音视频和扫描件可以打开和下载，但不能用于问答。可以另外导入对应的文字或纪要。</p>${btn('用系统应用打开','reveal')}</div>`
   :d.status==='failed'?`<div class="kb-empty-box"><p>解析失败：${esc(d.error)}</p><div class="kb-row" style="justify-content:center">${btn('重试','retry-doc',`data-id="${d.id}"`)}${btn('手动粘贴文字','modal','data-modal="paste"')}</div></div>`
   :d.status==='parsing'?`<div class="kb-empty-box"><p>正在提取正文并建立索引…</p><p class="kb-sub">完成后即可检索和引用，不影响浏览其他资料。</p></div>`
   :d.bodyHtml!=null?`<h2>${esc(d.title||'未命名笔记')}</h2><div class="kb-note-body">${d.bodyHtml||'<p class="kb-sub">（空白笔记）</p>'}</div>`
   :`${d.status==='partial'?'<div class="kb-banner is-warn">只提取到部分正文，回答可能不完整。关键内容请回看原件。</div>':''}<h2>${esc(d.title.replace(/\.[a-z]+$/i,''))}</h2>${lines(4)}<p class="kb-quote">${esc(d.summary)}</p>${lines(5)}${d.source==='网页收藏'?`<button type="button" class="kb-image" data-act="load-image">图片未加载 · 点击后从原站加载</button>`:''}${lines(3)}`;
  const organize=noText?'<p class="kb-empty">没有正文，无法整理。</p>':!l.autoOrganize&&!d.points.length?`<p class="kb-empty">本库已关闭自动整理。</p>${btn('整理这一篇','reorganize',`data-id="${d.id}"`,'is-small')}`
   :`<p class="kb-field"><span>摘要</span>${esc(d.summary)}</p><div class="kb-field"><span>标签</span><div class="kb-row kb-wrap">${d.tags.map(t=>`<span class="kb-chip is-action">${esc(t)}<button type="button" data-act="remove-tag" data-tag="${esc(t)}" aria-label="移除标签 ${esc(t)}">×</button></span>`).join('')}${link('+ 添加','add-tag')}</div></div><div class="kb-field"><span>涉及标的</span><div class="kb-row kb-wrap">${d.stocks.map(s=>chip(s)).join('')||'<span class="kb-sub">无</span>'}</div></div><div class="kb-field"><span>核心观点</span>${d.points.map(p=>`<p>· ${esc(p)}</p>`).join('')||'<span class="kb-sub">无</span>'}</div><p class="kb-field"><span>资料日期</span>${d.date} ${link('修改','noop')}</p>${btn('重新整理','reorganize',`data-id="${d.id}"`,'is-small')}`;
  return `${crumb([['知识库','go','data-view="home"'],[l.name,'open-lib',`data-id="${l.id}"`],[d.title]])}
   <div class="kb-reader"><article class="kb-panel kb-article"><div class="kb-row">${statusChip(d)}<span class="kb-sub">${esc(d.type)} · ${esc(d.source)} · ${d.date}</span>${d.edited?chip('已编辑'):''}<span class="kb-grow"></span>${editable(d)?btn('编辑','edit-note',`data-id="${d.id}"`,'is-small'):''}${btn('引用到对话','cite-doc',`data-id="${d.id}"`,'is-small is-primary')}${btn('在文件夹中显示','reveal','','is-small')}</div>${origin}${body}</article>
   <aside class="kb-side"><section class="kb-panel"><div class="kb-row"><b>AI 整理</b>${chip('AI 生成','is-ai')}</div>${organize}</section>
   <section class="kb-panel"><b>我的批注</b><textarea class="kb-textarea" data-input="doc.annotation" placeholder="写下你的判断、疑问或待验证事项…" aria-label="我的批注">${esc(d.annotation||'')}</textarea><div class="kb-row">${btn('保存批注','save-annotation','','is-small')}<span class="kb-sub">批注不修改原文件，随知识库文件夹一起迁移。</span></div></section></aside></div>`;
 }

 /* ---------- 笔记编辑（R10） ---------- */
 function noteView(){
  const l=lib(),d=curDoc();if(!d)return libView();
  const tools=[['标题','formatBlock','h3'],['加粗','bold'],['列表','insertUnorderedList'],['编号','insertOrderedList'],['引用块','formatBlock','blockquote'],['正文','formatBlock','p']];
  const others=l.docs.filter(x=>x!==d&&x.title);
  const marks=`${d.aiGenerated?chip('AI 生成','is-ai'):''}${d.source==='网页收藏'?chip('网页收藏 · 出处保留'):''}${d.source==='资料包'?chip('来自资料包 · 改动后不随作者更新'):''}${d.edited?chip('已编辑'):''}`;
  const fileName=(d.title||'未命名笔记').replace(/\.md$/,'')+'.md';
  return `${crumb([['知识库','go','data-view="home"'],[l.name,'open-lib',`data-id="${l.id}"`],[d.title||'未命名笔记']])}
   ${S.noteExternal?`<div class="kb-banner is-warn"><span>这个文件刚刚在应用外被修改了。</span><span class="kb-grow"></span>${btn('重新加载文件','note-external','data-keep="0"','is-small')}${btn('保留我正在写的','note-external','data-keep="1"','is-small')}</div>`:''}
   <div class="kb-reader"><article class="kb-panel kb-article">
    <div class="kb-row"><input class="kb-input kb-grow kb-note-title" data-input="doc.title" value="${esc(d.title)}" placeholder="笔记标题" aria-label="笔记标题">${d.draft?`<label class="kb-select"><span>保存到</span><select data-select="note.lib" aria-label="保存到">${libs.map(x=>`<option value="${x.id}" ${x===l?'selected':''}>${esc(x.name)}</option>`).join('')}<option value="__new">+ 新建知识库…</option></select></label>`:''}<span class="kb-sub" data-note-status role="status">${d.isNew?'尚未输入内容':'已自动保存'}</span>${btn('完成','note-done','','is-small is-primary')}</div>
    ${d.draft&&S.noteNewLib?`<div class="kb-row"><input class="kb-input kb-grow" data-input="noteNewName" placeholder="新知识库名称（最多 30 字）" maxlength="30" aria-label="新知识库名称">${btn('创建','note-create-lib','','is-small')}</div>`:''}
    <div class="kb-row kb-wrap kb-note-tools" role="toolbar" aria-label="格式">${tools.map(([label,cmd,arg])=>`<button type="button" class="kb-btn is-small" data-keep-focus data-act="note-format" data-cmd="${cmd}" data-arg="${arg||''}">${label}</button>`).join('')}<span class="kb-menu-anchor"><button type="button" class="kb-btn is-small" data-act="lib-menu" data-menu="note-ref" aria-haspopup="menu">引用资料 ▾</button>${S.menu==='note-ref'?`<div class="kb-menu" role="menu">${others.map(x=>`<button type="button" role="menuitem" data-act="note-ref" data-id="${x.id}">${esc(x.title)}</button>`).join('')||'<span class="kb-sub" style="padding:8px">库内暂无其他资料</span>'}</div>`:''}</span>${marks?`<span class="kb-grow"></span>${marks}`:''}</div>
    <div class="kb-editor" contenteditable="true" data-note-editor="${d.id}" role="textbox" aria-multiline="true" aria-label="笔记正文" data-placeholder="写下你的判断、复盘或跟踪清单…">${d.bodyHtml||''}</div>
    <p class="kb-hint">所见即所得的 Markdown 编辑（Milkdown）。内容保存为知识库文件夹里的 .md 文件；停止输入后自动保存，随后更新索引与 AI 整理。</p></article>
   <aside class="kb-side"><section class="kb-panel"><b>文件</b><code>${esc(l.folder+'\\'+fileName)}</code><p class="kb-hint">也可以用其他编辑器修改这个文件，回到这里会自动跟上。</p></section>
   <section class="kb-panel"><b>笔记里引用的资料</b>${(d.refs||[]).map(id=>l.docs.find(x=>x.id===id)).filter(Boolean).map(x=>`<div>${link(x.title,'open-doc',`data-id="${x.id}"`)}</div>`).join('')||'<p class="kb-sub">还没有引用。用「引用资料」把库内资料链接进笔记。</p>'}</section>
   <section class="kb-panel"><b>发布时</b><p class="kb-hint">${ORIGINAL.includes(d.source)?'这是你的原创内容，发布到社区时可以带正文。':'这是第三方资料，即使编辑过，发布时也只公开标题与原文链接。'}</p></section></aside></div>`;
 }
 function syncEditor(){const editor=root?.querySelector('[data-note-editor]');if(!editor)return;const d=libs.flatMap(l=>l.docs).find(x=>x.id===editor.dataset.noteEditor);if(d)d.bodyHtml=editor.innerHTML}
 let noteTimers=[];
 function noteChanged(){
  const d=curDoc(),status=root.querySelector('[data-note-status]');if(!d||!status)return;
  noteTimers.forEach(clearTimeout);d.isNew=false;if(!ORIGINAL.includes(d.source))d.edited=true;status.textContent='正在保存…';
  noteTimers=[setTimeout(()=>{const node=root.querySelector('[data-note-status]');if(node)node.textContent='已自动保存 · 正在更新索引'},900),setTimeout(()=>{const node=root.querySelector('[data-note-status]');if(node)node.textContent='已自动保存 · 索引与整理已更新';const text=(d.bodyHtml||'').replace(/<[^>]+>|&nbsp;/g,' ').replace(/\s+/g,' ').trim();if(text&&libs.some(l=>l.docs.includes(d)&&l.autoOrganize)){d.summary=text.slice(0,60);if(!d.tags.length)d.tags=['笔记']}},3200)];
 }

 /* ---------- 应用内网页收藏 ---------- */
 function clipView(){
  const c=S.clip,loaded=c.stage!=='idle',fail=c.outcome==='fail',login=c.outcome==='login';
  const page=!loaded?`<div class="kb-empty-box"><p>输入链接后在这里打开原网页</p><p class="kb-sub">加载的是真实页面，可以登录、翻页、进入具体文章。</p>
    <label class="kb-check"><input type="checkbox" data-check="clip.bookmark" ${c.bookmark?'checked':''}>记为常看来源（只保存入口，不会自动抓取内容）</label>
    <div class="kb-row kb-wrap" style="justify-content:center"><span class="kb-sub">常看来源</span>${bookmarks.map((b,i)=>`<span class="kb-chip is-action"><button type="button" data-act="clip-bookmark" data-i="${i}">${esc(b.name)}</button><button type="button" data-act="remove-bookmark" data-i="${i}" aria-label="移除 ${esc(b.name)}">×</button></span>`).join('')||'<span class="kb-sub">暂无</span>'}</div>
    <p class="kb-hint">只在你操作时读取当前页面；不批量抓取、不自动同步历史文章，不绕过登录、付费墙和验证码。</p></div>`
   :login?'<div class="kb-web"><div class="kb-web-bar">'+esc(c.url)+'</div><div class="kb-empty-box"><p>该页面需要登录或验证</p><p class="kb-sub">请直接在页面中完成登录或验证。应用不会代替你登录，也不会绕过验证。</p></div></div>'
   :`<div class="kb-web"><div class="kb-web-bar">${esc(c.url)}</div><div class="kb-web-body"><h2>${esc(c.title||'CPO 渗透率的三个分歧')}</h2><p class="kb-sub">光通信观察 · 10-11 21:02</p>${lines(4)}<p class="${c.mode==='选区'?'kb-selected':''}">市场对 CPO 渗透节奏的分歧集中在三处：量产良率、现场可维护性，以及头部客户的导入时间。</p>${lines(5)}<div class="wf-box" style="height:120px"></div>${lines(3)}</div></div>`;
  const preview=!loaded?'<p class="kb-empty">打开网页后在这里预览提取结果</p>'
   :login?'<p class="kb-empty">登录后再提取</p>'
   :fail?`<div class="kb-banner is-warn">没有提取到完整正文。${c.platform==='B 站'?'该视频没有可用的平台字幕，不会用简介替代。':'页面结构可能特殊，或内容尚未加载。'}</div><textarea class="kb-textarea" data-input="clip.note2" placeholder="可以把正文或现成的字幕粘贴到这里…" aria-label="粘贴文字"></textarea>`
   :`<div class="kb-extract"><b>${c.mode==='选区'?'选中内容':'正文'}预览</b><p>${c.mode==='选区'?'市场对 CPO 渗透节奏的分歧集中在三处：量产良率、现场可维护性，以及头部客户的导入时间。':'市场对 CPO 渗透节奏的分歧集中在三处：量产良率、现场可维护性，以及头部客户的导入时间。……（共约 2,300 字，1 张表格，3 张图片保留原站链接）'}</p></div>`;
  const saved=c.stage==='saved';
  const result=saved?(c.outcome==='dup'?`<div class="kb-banner">已收藏过这篇内容，没有重复保存。${link('查看资料','open-saved-clip')}</div>`:`<div class="kb-banner is-notice">已保存到「${esc(libs.find(l=>l.id===c.target)?.name)}」，正在解析。<span class="kb-grow"></span>${link('查看资料','open-saved-clip')}${link('让 AI 分析','analyze-clip')}</div>`):'';
  const from=libs.find(l=>l.id===c.from);
  return `${crumb([['知识库','go','data-view="home"'],...(from?[[from.name,'open-lib',`data-id="${from.id}"`]]:[]),['从网页收藏']])}
   <div class="kb-row kb-toolbar"><input class="kb-input kb-grow" data-input="clip.url" value="${esc(c.url)}" placeholder="粘贴文章链接、主页链接或平台分享文案" aria-label="网页地址">${btn('打开','clip-open','','is-primary')}</div>
   <div class="kb-clip"><div class="kb-clip-page" aria-label="网页视图">${page}</div>
   <aside class="kb-side" aria-label="收藏面板"><section class="kb-panel"><b>收藏到知识库</b>
    <label class="kb-select"><span>内容类型</span><select data-select="clip.platform" aria-label="内容类型">${Object.keys(PLATFORM).map(p=>`<option ${c.platform===p?'selected':''}>${p}</option>`).join('')}</select></label><p class="kb-hint">${PLATFORM[c.platform]}</p>
    <div class="kb-seg" role="group" aria-label="收藏范围">${['正文','选区'].map(m=>`<button type="button" class="${c.mode===m?'is-active':''}" data-act="clip-mode" data-mode="${m}">${m==='正文'?'整篇正文':'选中内容'}</button>`).join('')}</div>
    <label class="kb-label">标题<input class="kb-input" data-input="clip.title" value="${esc(c.title)}" placeholder="打开网页后自动填入"></label>
    ${preview}
    <label class="kb-label">备注（选填）<textarea class="kb-textarea" data-input="clip.note" placeholder="为什么收藏、想验证什么…">${esc(c.note)}</textarea></label>
    <label class="kb-select"><span>保存到</span><select data-select="clip.target" aria-label="保存到">${libs.map(l=>`<option value="${l.id}" ${c.target===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}<option value="__new">+ 新建知识库…</option></select></label>
    ${c.newLib?`<div class="kb-row"><input class="kb-input kb-grow" data-input="clip.newName" placeholder="新知识库名称（最多 30 字）" maxlength="30">${btn('创建','clip-create-lib','','is-small')}</div>`:''}
    ${result}
    <div class="kb-row">${btn(fail?'保存粘贴的文字':'保存到知识库','clip-save',loaded&&!login?'':'disabled','is-primary')}${saved?btn('继续浏览','clip-continue'):''}</div>
    <p class="kb-hint">保存为该知识库文件夹里的 Markdown 文件，并记录原网址、作者、平台与采集时间。图片保留原站链接。</p></section></aside></div>`;
 }

 /* ---------- 资料包预览 ---------- */
 function packView(){
  const p=pack();if(!p)return home();
  const added=!!p.libId,loading=S.downloading[p.id],failed=S.downloading[p.id]===-1;
  const action=added?`${chip('已添加')}${btn('查看我的副本','open-lib',`data-id="${p.libId}"`)}`:failed?`<span class="kb-sub">下载失败：网络中断，未创建知识库。</span>${btn('重试','add-pack',`data-id="${p.id}"`,'is-primary')}`:loading?`<span class="kb-progress is-wide" aria-label="下载进度"><i style="width:${loading}%"></i></span><span class="kb-sub">下载中 ${loading}%</span>`:btn('添加到我的知识库','add-pack',`data-id="${p.id}"`,'is-primary');
  return `${crumb([['知识库','go','data-view="home"'],[p.group==='official'?'官方推荐':'社区推荐','go','data-view="home"'],[p.name]])}
   <header class="kb-head"><div class="kb-row kb-grow"><span class="kb-cover is-large" aria-hidden="true"></span><div><h1 tabindex="-1">${esc(p.name)}</h1><p class="kb-sub">${esc(p.author)}${p.badge?` · <span class="kb-badge">认证·${esc(p.badge)}</span>`:''} · v${p.version} · 更新于 ${p.updated} · ${p.count} 份资料</p><p class="kb-sub">${esc(p.intro)}</p></div></div><div class="kb-head-tools">${action}</div></header>
   <div class="kb-banner">只读预览。添加后会在本地创建一份属于你的副本，可自由增删改，不影响原版。</div>
   <div class="kb-two"><section class="kb-panel"><b>资料目录</b><div class="kb-list">${p.toc.map((t,i)=>`<button type="button" class="kb-list-row" data-act="preview-doc" data-i="${i}"><span>${esc(t)}</span><span class="kb-sub">${t.startsWith('（仅链接）')?'原文链接 ↗':'试读'}</span></button>`).join('')}</div></section>
   <section class="kb-panel"><b>内容性质</b><p>${esc(p.nature)}</p><b>推荐提问</b><div class="kb-row kb-wrap">${p.questions.map(q=>chip(q)).join('')}</div>${p.group==='community'?`<div class="kb-row">${link('举报','modal','data-modal="report"')}</div>`:''}</section></div>`;
 }

 /* ---------- 发布 ---------- */
 const pubMode=d=>ORIGINAL.includes(d.source)?['带正文','原创内容']:d.url?['仅链接','第三方资料，只公开标题与原文链接']:['仅标题','第三方文件，无原文链接，只公开标题'];
 function publishView(){
  const P=S.pub,l=libs.find(x=>x.id===P.libId);
  const steps=['基本信息','发布清单','确认提交'];
  const head=`${crumb([['知识库','go','data-view="home"'],...(l?[[l.name,'open-lib',`data-id="${l.id}"`]]:[]),['发布到社区']])}<div class="kb-steps">${steps.map((s,i)=>`<span class="${P.step===i+1?'is-active':''}${P.step>i+1?' is-done':''}">${i+1}. ${s}</span>`).join('')}</div>`;
  if(!l)return `${head}<section class="kb-panel"><b>选择要发布的知识库</b><div class="kb-list">${libs.filter(x=>!x.fromPack).map(x=>`<button type="button" class="kb-list-row" data-act="start-publish" data-id="${x.id}"><span>${esc(x.name)}</span><span class="kb-sub">${x.docs.length} 份资料</span></button>`).join('')}</div><p class="kb-hint">从资料包添加的知识库不能再次发布。</p></section>`;
  if(P.step===1)return `${head}<section class="kb-panel kb-form"><label class="kb-label">名称<input class="kb-input" value="${esc(l.name)}"></label><label class="kb-label">简介<textarea class="kb-textarea">${esc(l.desc)}</textarea></label><label class="kb-select"><span>分类</span><select><option>行业研究</option><option>价值研究</option><option>短线复盘</option><option>财报研究</option></select></label><div class="kb-label">封面<div class="kb-row"><span class="kb-cover is-large"></span>${btn('上传封面','noop','','is-small')}</div></div><div class="kb-row"><span class="kb-grow"></span>${btn('取消','open-lib',`data-id="${l.id}"`)}${btn('下一步','pub-step','data-step="2"','is-primary')}</div></section>`;
  if(P.step===2){
   const on=l.docs.filter(d=>P.checked[d.id]!==false);
   return `${head}<section class="kb-panel"><div class="kb-row"><b>将要公开的内容</b><span class="kb-sub">已选 ${on.length} / ${l.docs.length} 项 · 带正文 ${on.filter(d=>pubMode(d)[0]==='带正文').length} 项</span></div>
    <div class="kb-table"><div class="kb-tr kb-th kb-pub"><span></span><span>标题</span><span>来源</span><span>公开方式</span></div>${l.docs.map(d=>`<label class="kb-tr kb-pub"><span><input type="checkbox" data-pub="${d.id}" ${P.checked[d.id]!==false?'checked':''} aria-label="发布 ${esc(d.title)}"></span><span>${esc(d.title)}</span><span>${esc(d.source)}</span><span>${chip(pubMode(d)[0],pubMode(d)[0]==='带正文'?'is-notice':'')}<small>${pubMode(d)[1]}</small></span></label>`).join('')}</div>
    <p class="kb-hint">只有你自己写的笔记、批注和 AI 整理结果会带正文。网页收藏、研报等第三方资料不公开正文和原件。</p><p class="kb-hint">以下内容不会随包发布：本地路径、账号信息、对话记录、知识库指令。</p>
    <div class="kb-row"><span class="kb-grow"></span>${btn('上一步','pub-step','data-step="1"')}${btn('下一步','pub-step','data-step="3"','is-primary')}</div></section>`;
  }
  return `${head}<section class="kb-panel kb-form"><b>提交前请确认</b><label class="kb-check"><input type="checkbox" data-check="pub.agree" ${P.agree?'checked':''}>带正文的内容是我的原创，我有权公开；内容不含收益承诺与个股买卖指令。</label><p class="kb-hint">提交后进入审核，通过后才会在社区可见；未通过会告知原因。发布后可随时更新版本或下架，下架不影响已添加用户的本地副本。</p><p class="kb-hint">内容页将展示：内容仅供参考，不构成投资建议。</p><div class="kb-row"><span class="kb-grow"></span>${btn('上一步','pub-step','data-step="2"')}${btn('提交审核','pub-submit',P.agree?'':'disabled','is-primary')}</div></section>`;
 }
 function publicationsView(){
  return `${crumb([['知识库','go','data-view="home"'],['我的发布']])}<header class="kb-head"><h1 tabindex="-1">我的发布</h1><div class="kb-head-tools">${btn('发布知识库','start-publish','','is-primary')}</div></header>
   <div class="kb-list">${publications.map((p,i)=>`<div class="kb-list-row is-tall"><div><b>${esc(p.name)}</b> <span class="kb-sub">v${p.version}</span> ${chip(p.status,p.status==='已发布'?'is-notice':p.status==='未通过'?'is-warn':'is-parsing')}${p.reason?`<p class="kb-sub">原因：${esc(p.reason)}</p>`:p.status==='审核中'?'<p class="kb-sub">审核通过前社区不可见。</p>':''}</div><span class="kb-row">${p.status==='未通过'?btn('修改后重新提交','start-publish',`data-id="${p.libId}"`,'is-small'):''}${p.status==='已发布'?btn('更新版本','start-publish',`data-id="${p.libId}"`,'is-small')+btn('下架','unpublish',`data-i="${i}"`,'is-small'):''}${p.status==='审核中'?btn('模拟：审核通过','approve',`data-i="${i}"`,'is-small'):''}</span></div>`).join('')||'<p class="kb-empty">还没有发布过知识库</p>'}</div>`;
 }

 /* ---------- 弹窗 ---------- */
 function modalHtml(){
  const m=S.modal;if(!m)return '';
  const shell=(title,body,foot)=>`<div class="kb-backdrop" data-act="close-modal"><section class="kb-modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="kb-row"><b>${title}</b><span class="kb-grow"></span><button type="button" class="kb-icon" data-act="close-modal" aria-label="关闭">×</button></div>${body}<div class="kb-row"><span class="kb-grow"></span>${foot}</div></section></div>`;
  const libPick=`<label class="kb-select"><span>保存到</span><select data-select="modalTarget" aria-label="保存到">${libs.map(l=>`<option value="${l.id}" ${targetId()===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}<option value="__new">+ 新建知识库…</option></select></label>${S.modalNewLib?`<div class="kb-row"><input class="kb-input kb-grow" data-input="modalNewName" placeholder="新知识库名称（最多 30 字）" maxlength="30" aria-label="新知识库名称">${btn('创建','modal-create-lib','','is-small')}</div>`:''}${!inLib()?'<p class="kb-hint">默认是你最近用过的知识库。</p>':''}`;
  if(m.name==='new-lib')return shell('新建知识库',`<label class="kb-label">名称<input class="kb-input" data-input="draftNew.name" value="${esc(S.draftNew.name)}" placeholder="例如：AI 产业链跟踪" maxlength="30"></label><label class="kb-label">简介（选填）<textarea class="kb-textarea" data-input="draftNew.desc" placeholder="你希望在这里积累什么？">${esc(S.draftNew.desc)}</textarea></label><div class="kb-label">文件夹<div class="kb-seg">${[['default','默认位置新建同名文件夹'],['pick','选择已有文件夹']].map(([id,label])=>`<button type="button" class="${S.draftNew.folderMode===id?'is-active':''}" data-act="folder-mode" data-mode="${id}">${label}</button>`).join('')}</div><p class="kb-hint">${S.draftNew.folderMode==='pick'?'选择后，文件夹里已有的文件会在后台建立索引。':'资料会保存在这个文件夹里，你可以随时用资源管理器查看。'}</p></div>`,btn('取消','close-modal')+btn('创建','create-lib','','is-primary'));
  if(m.name==='edit-lib')return shell('编辑知识库',`<label class="kb-label">名称<input class="kb-input" value="${esc(lib().name)}"></label><label class="kb-label">简介<textarea class="kb-textarea">${esc(lib().desc)}</textarea></label><div class="kb-label">封面<div class="kb-row"><span class="kb-cover is-large"></span>${btn('上传封面','noop','','is-small')}</div></div>`,btn('取消','close-modal')+btn('保存','close-modal','','is-primary'));
  if(m.name==='upload')return shell('上传文件',`<button type="button" class="kb-drop" data-act="fake-upload">点击选择文件，或将文件拖到这里<small>PDF、DOCX、Markdown、TXT、HTML 可提取正文；图片、音视频、扫描件仅保存。单个文件不超过 50 MB。</small></button>${libPick}`,btn('取消','close-modal'));
  if(m.name==='paste')return shell('粘贴文字',`<label class="kb-label">标题<input class="kb-input" data-input="paste.title" placeholder="例如：本周行业会议纪要"></label><label class="kb-label">正文<textarea class="kb-textarea is-tall" data-input="paste.body" placeholder="粘贴文章、会议纪要或你的研究笔记…"></textarea></label>${libPick}`,btn('取消','close-modal')+btn('保存为笔记','save-paste','','is-primary'));
  if(m.name==='update'){const l=lib();return shell(`更新到 v${l.updateTo}`,`<div class="kb-list"><div class="kb-list-row"><span>新增 1 个文件</span><span class="kb-sub">现金流质量核对表.md</span></div><div class="kb-list-row"><span>替换 2 个未改动的文件</span><span class="kb-sub">财报阅读的五步清单.md 等</span></div><div class="kb-list-row"><span>保留 1 个你改过的文件，不更新</span><span class="kb-sub">财报比较口径检查表.md</span></div></div><p class="kb-hint">你自己新增的资料和批注不受影响。</p>`,btn('暂不更新','close-modal')+btn('更新','apply-update','','is-primary'))}
  if(m.name==='save-chat')return shell('保存到知识库',`<label class="kb-label">标题<input class="kb-input" data-input="saveChat.title" value="${esc(m.title||'')}"></label>${libPick}<p class="kb-hint">保存为笔记文件，记录来自哪次对话与保存时间，并标注为 AI 生成。</p>`,btn('取消','close-modal')+btn('保存','confirm-save-chat','','is-primary'));
  if(m.name==='copy-doc')return shell('复制到其他知识库',`${libPick}<p class="kb-hint">一份文件只属于一个知识库。复制后两份文件互不影响。</p>`,btn('取消','close-modal')+btn('复制','confirm-copy','','is-primary'));
  if(m.name==='pack-doc')return shell(m.title,m.linkOnly?`<p>这是第三方资料，知识库中只提供标题与原文链接。</p><p>${link('打开原文链接 ↗','noop')}</p>`:`${lines(4)}<p class="kb-quote">（只读试读，添加到我的知识库后可批注、引用和修改）</p>${lines(5)}`,btn('关闭','close-modal'));
  if(m.name==='report')return shell('举报',`<div class="kb-seg kb-wrap">${['侵权','虚假或误导','收益承诺','其他'].map(r=>`<button type="button" data-act="noop">${r}</button>`).join('')}</div><label class="kb-label">说明（选填）<textarea class="kb-textarea"></textarea></label>`,btn('取消','close-modal')+btn('提交','submit-report','','is-primary'));
  if(m.name==='delete-doc')return shell('删除这份资料？',`<p>文件会从知识库文件夹中移入系统回收站，索引同步清除。</p>`,btn('取消','close-modal')+btn('删除','confirm-delete-doc','','is-danger'));
  return '';
 }

 /* ---------- 交互说明 ---------- */
 const NOTES={
  home:['R1.1 原「项目」入口统一改称「知识库」；存量项目自动出现在「我的知识库」（R1.2）。','R8.1 首页三区：我的知识库 / 官方推荐 / 社区推荐。','「添加资料」与知识库详情页的菜单一致，形式统一：上传文件、粘贴文字是各自独立的弹窗；新建笔记、从网页收藏直接进入全页。四者都在流程里选择保存到哪个知识库：从首页进入默认最近用过的库，从库内进入默认当前库，也可就地新建。','「新建知识库」单独成按钮：它是建容器，不是加内容。','卡片角标：建立索引中（R1.3）、有更新（R8.5）、来自资料包。'],
  lib:['R1.4 在原有对话、对话产物之上增加「概览」「资料」。','R2.3 每份资料如实展示解析状态：可问答 / 部分可用 / 仅保存 / 解析中 / 解析失败。','R3.1 搜索命中正文时显示命中片段。','R3.2 库内「新对话」默认挂载本库；R3.4 回答带出处，点击打开原文。','R4 概览中的观点、标签、标的由入库时 AI 整理生成，可在「设置」关闭（R4.5）。','R2.4 文件夹是真源：外部增删改自动跟上；文件夹不可用时提示重新选择。'],
  doc:['R4.1 右侧为 AI 整理结果，标注「AI 生成」；标签与日期可改，可重新整理（R4.2）。','R2.7 批注不修改原文件。','R5.4 网页收藏的资料展示出处；R5.8 图片点击后才从原站加载。','「仅保存」「解析失败」「解析中」各有独立状态页，不展示空白正文。'],
  clip:['R5.1（已调整）首页与库内的「从网页收藏」都直接进入本页，不再在首页就地展开；保存位置在右侧选择。','R5.7 勾选「记为常看来源」才保存书签，常看来源在打开网页前展示。','R5.2 左侧是真实网页，可登录、翻页；R5.3 右侧预览提取结果，确认后保存。','R5.5 提取失败如实提示并提供粘贴文字；不用简介或评论冒充正文。','R5.6 重复收藏不产生第二份。','R6 内容类型自动识别，此处可手动切换查看各平台规则。','R5.9 只读取当前页面，不批量抓取，不绕过登录与验证。'],
  pack:['R8.2 下载前只读预览：简介、目录、试读、推荐提问。','R8.3 添加后在本地创建独立副本；重复添加不产生第二份。','R8.6 展示作者、认证、版本、更新时间与内容性质。','R8.7 下载失败不留下半成品。'],
  publish:['R9.2 原创笔记带正文；第三方资料仅链接或仅标题。','R9.3 逐项标明公开方式，可取消勾选。','R9.7 本地路径、账号信息、对话记录不随包发布。','R9.4 先审后发；R9.5 可更新版本、下架。'],
  note:['R10.1 「添加资料 → 新建笔记」直接进入编辑器，在知识库文件夹里生成一个 .md 文件；点「完成」前可在顶部「保存到」切换或新建知识库。','R10.2 所见即所得的 Markdown 编辑（Milkdown），停止输入后自动保存，没有保存按钮。','R10.3 可编辑范围：笔记、粘贴存下的文字、保存的 AI 回答、网页收藏、资料包里的 Markdown；PDF、Word 不可编辑。','R10.4 编辑非原创来源的资料后保留「AI 生成」「出处」标记，并加「已编辑」。','R10.5 保存后自动更新索引与 AI 整理，输入过程中不触发。','R10.6 「引用资料」把库内其他资料链接进笔记，点击跳转。','R10.7 文件在应用外被修改时提示，由用户选择重新加载或保留，不静默覆盖。'],
  publications:['R9.4 审核中 / 已发布 / 未通过（附原因）。','R9.5 下架不影响已添加用户的本地副本。']
 };
 function notesHtml(){
  const key=S.view==='doc'?'doc':S.view;
  const demo=S.view==='lib'?`<div class="kb-seg kb-wrap">${[['normal','正常'],['empty','空库'],['folder-missing','文件夹不可用']].map(([id,label])=>`<button type="button" class="${S.libState===id?'is-active':''}" data-act="lib-state" data-state="${id}">${label}</button>`).join('')}</div>`
   :S.view==='clip'?`<div class="kb-seg kb-wrap">${[['ok','提取成功'],['fail','提取失败'],['dup','重复收藏'],['login','需要登录']].map(([id,label])=>`<button type="button" class="${S.clip.outcome===id?'is-active':''}" data-act="clip-outcome" data-outcome="${id}">${label}</button>`).join('')}</div>`
   :S.view==='note'?`<div class="kb-seg kb-wrap"><button type="button" class="${S.noteExternal?'is-active':''}" data-act="note-external-demo">文件被外部修改</button></div>`
   :S.view==='pack'?`<div class="kb-seg kb-wrap"><button type="button" data-act="pack-fail">下载失败</button></div>`:'';
  return `<button type="button" class="kb-notes-toggle" data-act="toggle-notes" aria-expanded="${S.notes}">交互说明</button>${S.notes?`<aside class="kb-notes" aria-label="交互说明"><b>交互说明</b><ul>${(NOTES[key]||[]).map(n=>`<li>${esc(n)}</li>`).join('')}</ul>${demo?`<b>状态演示</b>${demo}`:''}</aside>`:''}`;
 }

 /* ---------- 渲染与事件 ---------- */
 const views={home,lib:libView,doc:docView,note:noteView,clip:clipView,pack:packView,publish:publishView,publications:publicationsView};
 function draw(focusKey){
  if(!root)return;const scroll=root.querySelector('.kb-scroll')?.scrollTop||0;
  root.innerHTML=`<div class="kb-scroll">${views[S.view]()}</div>${notesHtml()}${modalHtml()}`;
  root.querySelector('.kb-scroll').scrollTop=focusKey===false?0:scroll;
  if(typeof focusKey==='string'){const input=root.querySelector(`[data-input="${focusKey}"]`);if(input){input.focus({preventScroll:true});const n=input.value.length;try{input.setSelectionRange(n,n)}catch{}}}
 }
 function go(view,params={}){Object.assign(S,{view,menu:null,modal:null},params);if(['home','pack','publications'].includes(view)&&window.KnowledgeChat)KnowledgeChat.setRefs(KnowledgeChat.refs().filter(ref=>!ref.auto));draw(false)}
 const setPath=(path,value)=>{const [head,key]=path.split('.');if(!key){S[head]=value;return}if(head==='lib')lib()[key]=value;else if(head==='doc')curDoc()[key]=value;else (S[head]||(S[head]={}))[key]=value};
 function addDoc(l,d){S.lastLib=l.id;l.docs.unshift(d);l.updated='刚刚';if(d.status==='parsing')setTimeout(()=>{d.status='ready';if(l.autoOrganize){d.summary=d.summary||'（入库后自动生成的摘要）';d.tags=d.tags.length?d.tags:['待确认'];d.points=d.points.length?d.points:['（入库后自动生成的核心观点）']}draw()},1800)}
 function openChatWith(refs,question){window.KnowledgeChat?.setRefs(refs);if(question)state.draft=question;if(state.mode!=='split')togglePageCopilot();else render({preservePage:true})}
 const acts={
  noop(){toast('交互稿：此处不展开')},
  go(el){go(el.dataset.view)},
  'open-lib'(el){S.lastLib=el.dataset.id;go('lib',{libId:el.dataset.id,tab:'overview',docQ:'',fTag:'',fSource:'全部',fStatus:'全部',libState:'normal'});window.KnowledgeChat?.setRefs([{kind:'lib',id:lib().id,name:lib().name,auto:true}])},
  'open-doc'(el){go('doc',{docId:el.dataset.id})},
  'new-note'(){const l=libs.find(x=>x.id===targetId()),d=doc('','笔记','新建笔记','ready','2026-10-13',{bodyHtml:'',isNew:true,draft:true,refs:[]});l.docs.unshift(d);l.updated='刚刚';S.lastLib=l.id;S.libState='normal';go('note',{libId:l.id,docId:d.id,noteExternal:false,noteNewLib:false});root.querySelector('.kb-note-title')?.focus()},
  'edit-note'(el){const d=lib().docs.find(x=>x.id===el.dataset.id)||curDoc();if(d.bodyHtml==null)d.bodyHtml=`<p>${esc(d.summary||'（原有正文）')}</p><p>（这里是这份资料原有的正文，可以直接修改。）</p>`;d.refs=d.refs||[];go('note',{docId:d.id,noteExternal:false})},
  'note-format'(el){const editor=root.querySelector('[data-note-editor]');editor.focus();document.execCommand(el.dataset.cmd,false,el.dataset.arg||null);syncEditor();noteChanged()},
  'note-ref'(el){const d=curDoc(),x=lib().docs.find(y=>y.id===el.dataset.id);d.bodyHtml=(d.bodyHtml||'')+`<p><button type="button" class="kb-note-ref" contenteditable="false" data-act="open-doc" data-id="${x.id}">${esc(x.title)}</button>&nbsp;</p>`;d.refs=[...new Set([...(d.refs||[]),x.id])];S.menu=null;draw();noteChanged()},
  'note-done'(){const d=curDoc();d.draft=false;S.noteNewLib=false;if(!d.title.trim())d.title='未命名笔记';noteTimers.forEach(clearTimeout);go('doc',{docId:d.id});toast('已保存到知识库文件夹')},
  'note-move'(el){const to=libs.find(x=>x.id===el.value),from=lib(),d=curDoc();if(!to||to===from)return;from.docs.splice(from.docs.indexOf(d),1);to.docs.unshift(d);to.updated='刚刚';S.libId=S.lastLib=to.id;S.noteNewLib=false;draw();toast('已移到「'+to.name+'」')},
  'note-create-lib'(){const name=(S.noteNewName||'').trim();if(!name){toast('请填写知识库名称');return}if(libs.some(l=>l.name===name)){toast('已有同名知识库，请换一个名称');return}const l=makeLib(name);S.noteNewName='';acts['note-move']({value:l.id})},
  'note-external-demo'(){S.noteExternal=!S.noteExternal;draw()},
  'note-external'(el){S.noteExternal=false;toast(el.dataset.keep==='1'?'已保留你正在写的内容，并覆盖文件':'已重新加载文件内容');draw()},
  'open-pack'(el){go('pack',{packId:el.dataset.id})},
  tab(el){S.tab=el.dataset.tab;S.menu=null;draw(false)},
  modal(el){S.menu=null;S.modalNewLib=false;S.modal={name:el.dataset.modal};draw()},
  'close-modal'(el,e){if(el.classList.contains('kb-backdrop')&&e.target!==el)return;S.modal=null;S.modalTarget=null;S.modalNewLib=false;draw()},
  'toggle-notes'(){S.notes=!S.notes;draw()},
  'lib-state'(el){S.libState=el.dataset.state;draw()},
  'lib-menu'(el){S.menu=S.menu===el.dataset.menu?null:el.dataset.menu;draw()},
  'doc-menu'(el){S.menu=S.menu===el.dataset.id?null:el.dataset.id;draw()},
  'filter-tag'(el){S.fTag=el.dataset.tag;S.tab='docs';draw()},
  'modal-create-lib'(){const name=(S.modalNewName||'').trim();if(!name){toast('请填写知识库名称');return}if(libs.some(l=>l.name===name)){toast('已有同名知识库，请换一个名称');return}const l=makeLib(name);S.modalTarget=l.id;S.modalNewLib=false;S.modalNewName='';toast('已创建知识库「'+name+'」');draw()},
  'clip-bookmark'(el){S.clip.url=bookmarks[el.dataset.i].url;acts['clip-open']()},
  'remove-bookmark'(el){bookmarks.splice(el.dataset.i,1);toast('已移除来源入口，已保存的资料不受影响');draw()},
  'new-clip'(){go('clip',{clip:{...S.clip,stage:'idle',url:'',title:'',note:'',newLib:false,from:inLib(),target:targetId()}})},
  'clip-open'(){const c=S.clip;if(!c.url.trim()){toast('请先粘贴链接');return}if(!/^https?:\/\//.test(c.url.trim())){const m=c.url.match(/https?:\/\/\S+/);if(!m){toast('没有识别到有效的 http / https 链接');return}c.url=m[0]}
   if(c.bookmark&&!bookmarks.some(b=>b.url===c.url))bookmarks.push({name:new URL(c.url).hostname,url:c.url});
   c.platform=/xueqiu/.test(c.url)?'雪球':/tieba/.test(c.url)?'贴吧':/xiaohongshu|xhslink/.test(c.url)?'小红书':/bilibili|b23/.test(c.url)?'B 站':'通用文章';
   c.stage='loaded';c.title=c.outcome==='login'?'':({'B 站':'硅光与 CPO 技术讲解（字幕）','贴吧':'【讨论】CPO 量产节奏到底卡在哪','小红书':'一图看懂 CPO 产业链'}[c.platform]||'CPO 渗透率的三个分歧');go('clip')},
  'clip-mode'(el){S.clip.mode=el.dataset.mode;draw()},
  'clip-outcome'(el){S.clip.outcome=el.dataset.outcome;S.clip.stage=S.clip.stage==='idle'?'idle':'loaded';draw()},
  'clip-create-lib'(){const name=(S.clip.newName||'').trim();if(!name){toast('请填写知识库名称');return}const l={id:'n'+(++seq),name,desc:'',folder:'D:\\投研\\'+name,updated:'刚刚',autoOrganize:true,instruction:'',chats:[],tasks:[],docs:[],artifacts:[]};libs.unshift(l);S.clip.target=l.id;S.clip.newLib=false;toast('已创建知识库「'+name+'」');draw()},
  'clip-save'(){const c=S.clip,l=libs.find(x=>x.id===c.target);if(c.outcome!=='dup'){const d=doc(c.title||'未命名网页','网页','网页收藏','parsing','2026-10-13',{platform:c.platform,author:'光通信观察',url:c.url,captured:'2026-10-13 10:20',annotation:c.note});addDoc(l,d);c.savedDoc=d.id}else c.savedDoc=l.docs.find(d=>d.source==='网页收藏')?.id;c.stage='saved';draw()},
  'clip-continue'(){S.clip.stage='loaded';S.clip.note='';draw()},
  'open-saved-clip'(){const c=S.clip;if(c.savedDoc)go('doc',{libId:c.target,docId:c.savedDoc});else go('lib',{libId:c.target,tab:'docs'})},
  'analyze-clip'(){const c=S.clip,l=libs.find(x=>x.id===c.target),d=l.docs.find(x=>x.id===c.savedDoc);openChatWith([{kind:'doc',id:d.id,name:d.title}],'帮我提炼这篇文章的核心观点，并指出需要验证的地方');toast('已引用这份资料，问题已填入输入框，需要你点击发送')},
  'folder-mode'(el){S.draftNew.folderMode=el.dataset.mode;draw()},
  'create-lib'(){const name=S.draftNew.name.trim();if(!name){toast('请填写知识库名称');return}if(libs.some(l=>l.name===name)){toast('已有同名知识库，请换一个名称');return}const l={id:'n'+(++seq),name,desc:S.draftNew.desc,folder:'D:\\投研\\'+name,updated:'刚刚',autoOrganize:true,instruction:'',chats:[],tasks:[],docs:[],artifacts:[],indexing:S.draftNew.folderMode==='pick'?8:0};libs.unshift(l);S.draftNew={name:'',desc:'',folderMode:'default'};go('lib',{libId:l.id,tab:'overview'})},
  'fake-upload'(){const l=libs.find(x=>x.id===targetId());addDoc(l,doc('新上传的研报.pdf','PDF','本地上传','parsing','2026-10-13'));S.modal=null;S.modalTarget=null;toast('已保存到文件夹，正在解析');if(S.view==='lib'){S.tab='docs';S.libState='normal'}draw()},
  'save-paste'(){const p=S.paste||{};if(!(p.title||'').trim()||!(p.body||'').trim()){toast('请填写标题与正文');return}const l=libs.find(x=>x.id===targetId());addDoc(l,doc(p.title.trim(),'笔记','粘贴文字','parsing','2026-10-13'));S.paste={};S.modal=null;S.modalTarget=null;toast('已保存为笔记');if(S.view==='lib'){S.tab='docs';S.libState='normal'}draw()},
  'new-chat'(){const l=lib();openChatWith([{kind:'lib',id:l.id,name:l.name,auto:true}]);toast('已在对话中挂载「'+l.name+'」')},
  'open-chat'(el){const l=lib();openChatWith([{kind:'lib',id:l.id,name:l.name,auto:true}]);toast('打开对话「'+el.dataset.title+'」（已挂载本库）')},
  ask(el){const l=lib();openChatWith([{kind:'lib',id:l.id,name:l.name,auto:true}],el.dataset.q)},
  'cite-doc'(el){const d=lib().docs.find(x=>x.id===el.dataset.id);S.menu=null;if(d.status==='saved'||d.status==='failed'||d.status==='parsing'){toast('这份资料没有可检索的正文，不能引用');draw();return}window.KnowledgeChat?.addRef({kind:'doc',id:d.id,name:d.title});openChatWith(window.KnowledgeChat?.refs()||[]);toast('已引用到对话')},
  'copy-doc'(el){S.menu=null;S.modal={name:'copy-doc',docId:el.dataset.id};draw()},
  'confirm-copy'(){const target=libs.find(l=>l.id===(S.modalTarget||'cpo')),d=lib().docs.find(x=>x.id===S.modal.docId);if(target&&d&&target!==lib())target.docs.unshift({...d,id:'d'+(++seq)});S.modal=null;S.modalTarget=null;toast('已复制到「'+target.name+'」');draw()},
  'retry-doc'(el){const d=lib().docs.find(x=>x.id===el.dataset.id);d.status='parsing';S.menu=null;draw();setTimeout(()=>{d.status='failed';draw();toast('仍然无法提取正文：'+d.error)},1500)},
  reorganize(el){const d=lib().docs.find(x=>x.id===el.dataset.id)||curDoc();S.menu=null;toast('正在重新整理…');setTimeout(()=>{d.summary=d.summary||'（重新整理生成的摘要）';if(!d.tags.length)d.tags=['待确认'];if(!d.points.length)d.points=['（重新整理生成的核心观点）'];draw();toast('整理完成')},1200);draw()},
  reveal(){S.menu=null;toast('在资源管理器中打开对应位置');draw()},
  'delete-doc'(el){S.menu=null;S.modal={name:'delete-doc',docId:el.dataset.id};draw()},
  'confirm-delete-doc'(){const l=lib(),i=l.docs.findIndex(d=>d.id===S.modal.docId);if(i>=0)l.docs.splice(i,1);S.modal=null;toast('已删除，可在系统回收站恢复文件');draw()},
  'remove-tag'(el){const d=curDoc();d.tags=d.tags.filter(t=>t!==el.dataset.tag);draw()},
  'add-tag'(){curDoc().tags.push('新标签');draw()},
  'save-annotation'(){toast('批注已保存')},
  'load-image'(el){el.textContent='图片已加载（示意）';el.disabled=true},
  'toggle-organize'(){const l=lib();l.autoOrganize=!l.autoOrganize;toast(l.autoOrganize?'已开启：新资料入库后自动整理':'已关闭：新资料不再自动整理，已有结果保留');draw()},
  'relink-folder'(){S.libState='normal';toast('已重新关联文件夹，正在核对文件变化');draw()},
  reindex(){const l=lib();S.menu=null;l.indexing=5;draw();const tick=()=>{l.indexing+=19;if(l.indexing>=100){l.indexing=0;toast('索引已重建，原文件未改动')}else setTimeout(tick,500);draw()};setTimeout(tick,500)},
  'delete-lib'(){const l=lib();libs.splice(libs.indexOf(l),1);const p=packs.find(x=>x.libId===l.id);if(p)p.libId=null;window.KnowledgeChat?.setRefs([]);toast('已删除知识库，文件夹与文件保留');go('home')},
  'add-pack'(el){const p=packs.find(x=>x.id===el.dataset.id);if(p.libId){toast('已添加过，不会重复创建');return}S.downloading[p.id]=10;draw();const tick=()=>{if(S.downloading[p.id]===-1)return;S.downloading[p.id]+=30;if(S.downloading[p.id]>=100){delete S.downloading[p.id];const l={id:'n'+(++seq),name:p.name,desc:p.intro,folder:'D:\\投研\\'+p.name,updated:'刚刚',autoOrganize:true,instruction:'',fromPack:p.id,packVersion:p.version,chats:[],tasks:[],artifacts:[],docs:p.toc.filter(t=>!t.startsWith('（仅链接）')).map(t=>doc(t+'.md','Markdown','资料包','ready','2026-10-13',{summary:'（资料包自带的整理结果）',tags:[p.cat]}))};libs.unshift(l);p.libId=l.id;toast('已添加到我的知识库')}else setTimeout(tick,450);draw()};setTimeout(tick,450)},
  'pack-fail'(){S.downloading[S.packId]=-1;draw()},
  'preview-doc'(el){const t=pack().toc[el.dataset.i];S.modal={name:'pack-doc',title:t,linkOnly:t.startsWith('（仅链接）')};draw()},
  'submit-report'(){S.modal=null;toast('已提交举报，我们会尽快处理');draw()},
  'apply-update'(){const l=lib();l.docs.unshift(doc('现金流质量核对表.md','Markdown','资料包','ready','2026-10-13',{tags:['财报'],summary:'（资料包自带的整理结果）'}));l.packVersion=l.updateTo;l.updateTo=null;S.modal=null;toast('已更新。1 个你改过的文件未被更新');draw()},
  'start-publish'(el){const id=el.dataset.id||null,l=libs.find(x=>x.id===id);if(l?.fromPack){toast('从资料包添加的知识库不能再次发布');return}S.pub={step:1,libId:id,checked:{},agree:false};go('publish')},
  'pub-step'(el){S.pub.step=+el.dataset.step;draw(false)},
  'pub-submit'(){const l=libs.find(x=>x.id===S.pub.libId),old=publications.findIndex(p=>p.libId===l.id);if(old>=0)publications.splice(old,1);publications.unshift({libId:l.id,name:l.name,status:'审核中',version:'1.0'});toast('已提交审核');go('publications')},
  approve(el){publications[el.dataset.i].status='已发布';toast('审核通过，已在社区可见');draw()},
  unpublish(el){publications.splice(el.dataset.i,1);toast('已下架，不影响已添加用户的本地副本');draw()},
  'save-answer-sample'(){S.modal={name:'save-chat',title:'AI 回答：CPO 渗透节奏的分歧'};draw()},
  'save-artifact'(el){addDoc(lib(),doc(el.dataset.name,'文件','对话沉淀','parsing','2026-10-13',{aiGenerated:true,fromChat:lib().chats[0]||'对话'}));toast('已保存为知识库资料，正在解析');S.tab='docs';draw()},
  'confirm-save-chat'(){const l=libs.find(x=>x.id===targetId()),title=(S.saveChat?.title||S.modal.title||'AI 回答').trim();addDoc(l,doc(title,'笔记','对话沉淀','parsing','2026-10-13',{aiGenerated:true,fromChat:S.modal.fromChat||l.chats[0]||'对话'}));S.modal=null;S.modalTarget=null;S.saveChat=null;toast('已保存到「'+l.name+'」');draw()}
 };
 function bind(){
  root.onmousedown=e=>{if(e.target.closest('[data-keep-focus]'))e.preventDefault()};
  root.onclick=e=>{syncEditor();const el=e.target.closest('[data-act]');if(!el||el.disabled){if(S.menu&&!e.target.closest('.kb-menu')){S.menu=null;draw()}return}e.stopPropagation();acts[el.dataset.act]?.(el,e)};
  root.onkeydown=e=>{if(e.key==='Escape'&&(S.modal||S.menu)){S.modal=null;S.menu=null;draw();return}if((e.key==='Enter'||e.key===' ')&&e.target.matches('.kb-card')){e.preventDefault();e.target.click()}if(e.key==='Enter'&&e.target.matches('[data-input="clip.url"]'))acts['clip-open']()};
  root.oninput=e=>{if(e.target.matches('[data-note-editor]')){syncEditor();noteChanged();return}const key=e.target.dataset.input;if(!key)return;setPath(key,e.target.value);if(key==='doc.title'&&S.view==='note')noteChanged();if(['homeQ','docQ'].includes(key))draw(key)};
  root.onchange=e=>{const t=e.target;if(t.dataset.select){if(t.dataset.select==='clip.target'&&t.value==='__new'){S.clip.newLib=true;draw();return}if(t.dataset.select==='modalTarget'&&t.value==='__new'){S.modalNewLib=true;draw();return}if(t.dataset.select==='note.lib'){syncEditor();if(t.value==='__new'){S.noteNewLib=true;draw()}else acts['note-move'](t);return}setPath(t.dataset.select,t.value);draw()}else if(t.dataset.check){setPath(t.dataset.check,t.checked);draw()}else if(t.dataset.pub){S.pub.checked[t.dataset.pub]=t.checked;draw()}};
 }
 function mount(wb){
  root=document.createElement('section');root.className='kb-page';root.dataset.morePage='projects';root.setAttribute('aria-label','知识库');wb.append(root);bind();draw();return root;
 }
 /* 供对话区调用：把一条回答存为知识库里的笔记（R7.1），返回知识库名称。 */
 function addNote(libId,title,fromChat){const l=libs.find(x=>x.id===libId)||libs[0];addDoc(l,doc(title,'笔记','对话沉淀','parsing','2026-10-13',{aiGenerated:true,fromChat}));if(root?.isConnected)draw();return l.name}
 return {mount,addNote,libs:()=>libs};
})();
