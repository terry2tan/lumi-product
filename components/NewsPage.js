/* 资讯交互稿（10-26）：主要思路来自资讯组《资讯 - 客户端》方案，按 Lumi 的线框保真度收敛。
   ① 资讯首页三栏：热门文章 / 深度专题 · 今日头条 / 要闻 · 7×24 快讯 / 财经日历；栏目可显示或收起。
   ② 任意文章就地变成三栏阅读：同栏目标题 · 正文 · AI 解读。AI 解读按「理解 / 溯源 / 数据 / 市场 / 决策」分层，
      按阅读时间分 60 秒 / 3 分钟 / 10 分钟三档，模块逐个解锁；机会与风险并置（合规要求）。
   ③ AI 解读信息流：按内容类型（推荐 / 事件 / 数据 / 政策 / 新闻）订阅信息源，也可一句话生成专属信息流。
   ④ 与 Lumi 打通：追问、在对话中问、盯信号（新建目标）、新建简报都只在右侧对话框填好内容，由用户决定发送；可存入知识库。 */
window.NewsPage=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const TABS=[['home','资讯首页'],['flash','快讯'],['deep','AI 解读'],['calendar','日历'],['mustread','投资必读']];
 /* 默认收起的栏目，在「＋ 栏目」里打开后出现在顶部。 */
 const EXTRA=[['notice','公告','上市公司公告速递'],['research','机构调研','机构调研纪要'],['interactive','互动易','投资者互动问答'],['report','研报','券商研究报告']];
 const SECS={headline:'今日头条',hot:'要闻',flash:'快讯',notice:'公告',research:'机构调研',interactive:'互动易',report:'研报'};
 const MARKETS=[['all','全部'],['ashare','A股'],['hk','港股'],['us','美股'],['macro','宏观'],['commodity','商品']];
 const KINDS=[['rec','推荐','事件 · 政策 · 数据 · 新闻混合'],['event','事件','会议 · 财报 · 地缘'],['data','数据','宏观 · 行业 · 高频'],['policy','政策','发文 · 监管 · 产业'],['news','新闻','资讯 · 公告 · 研报']];
 /* 每类内容有独立的信息源：资讯栏目 / 政策来源 / 数据机构 / 事件类型。 */
 const SOURCES={
  news:[['headline','要闻'],['flash','快讯'],['hot','热门文章'],['notice','公告'],['research','机构调研'],['report','研报']],
  policy:[['state','国务院'],['csrc','证监会'],['pboc','中国人民银行'],['ndrc','发改委'],['miit','工信部']],
  data:[['nbs','国家统计局'],['pboc_d','央行'],['customs','海关总署'],['bls','美国劳工部'],['assoc','行业协会高频']],
  event:[['monetary','货币政策'],['earnings','财报季'],['conference','产业大会'],['geo','地缘与供给'],['meeting','重大会议']]
 };
 /* 按新闻类型推荐的解读角度组合。 */
 const TYPE_TIP={'政策发布':'名词解释 + 背景 + 因果链 + 关联方向','宏观数据':'关键数据 + 脉络 + 因果链 + 接下来盯什么','国际联动':'背景 + 因果链 + 相关行情 + 历史参照','市场异动':'相关行情 + 关键数据 + 因果链 + 机会与风险','公司公告':'背景 + 关键数据 + 脉络 + 多空对照','突发快讯':'背景 + 脉络 + 相关行情 + 接下来盯什么'};
 /* AI 解读模块：[键, 标题, 层, 档位]。档位 1 = 60 秒，2 = 3 分钟，3 = 10 分钟。 */
 const MODS=[['verdict','综合研判','理解',1],['one','一句话看懂','理解',1],['data','关键数据','数据',1],['quotes','相关行情','市场',1],
  ['bg','背景知识','理解',2],['line','事件脉络','溯源',2],['terms','名词解释','理解',2],['bullbear','多空对照','决策',2],
  ['chain','因果链','溯源',3],['hist','历史参照','溯源',3],['dirs','关联方向','市场',3],['signals','接下来盯什么','决策',3],['risk','机会与风险','决策',3],['asks','继续追问','决策',3]];
 const DEPTHS=[['fast','60 秒',1],['mid','3 分钟',2],['deep','10 分钟',3]];

 /* ---------- 演示数据 ---------- */
 const A=[
  {id:'n1',sec:'headline',kind:'policy',src:'policy:state',mk:'macro',lv:'high',type:'政策发布',title:'国常会部署扩大服务消费，提出六方面举措',from:'新华社',time:'10-26 08:30',views:'12.8 万',tags:['服务消费','养老','文旅'],
   sum:'会议提出放宽服务业准入、增加养老托育供给、丰富文旅体育消费场景等六方面举措，政策重心从商品补贴转向服务供给。',
   body:['国务院常务会议今天研究扩大服务消费的举措。会议指出，服务消费潜力大、带动就业多，要从供给和需求两端同时发力。','会议提出六方面举措：放宽服务业市场准入；增加养老、托育等民生服务供给；丰富文旅、体育消费场景；完善带薪休假落实机制；加强服务消费金融支持；优化服务消费环境。','会议要求各有关部门抓紧出台配套细则，年底前推动一批措施落地见效。'],
   ai:{verdict:['偏多',64,'对社会服务、旅游、养老等方向是中期利好；短期看配套细则和资金规模，对消费数据的拉动需要 1–2 个季度验证。'],
    one:'政策重心从「补贴买东西」转向「让人愿意、也有地方花钱买服务」，养老、托育、文旅、体育是四个明确方向。',
    data:[['举措','6 方面','覆盖供给、需求、环境'],['重点领域','4 个','养老 / 托育 / 文旅 / 体育'],['服务消费占居民消费','约 46%','仍低于发达经济体']],
    quotes:[['社会服务指数','+2.1%'],['旅游及景区','+3.4%'],['上证指数','+0.4%']],
    bg:'服务消费指餐饮、旅游、养老、教育、医疗等「买体验」的支出。近两年商品消费靠以旧换新拉动明显，但服务消费的供给（场地、牌照、人员）跟不上，是这轮政策要解决的问题。',
    line:[['2024-08','国务院印发促进服务消费高质量发展的意见'],['2025-03','提振消费专项行动方案发布'],['2026-10-26','国常会部署扩大服务消费六方面举措']],
    terms:[['服务消费','购买服务而不是实物商品的支出，如旅游、餐饮、养老、教育'],['供给约束','需求存在但供给跟不上：场地、牌照、从业人员不足']],
    bull:['从需求补贴转向放开供给，持续性更好','服务业就业密集，有助于改善收入预期'],bear:['没有提具体资金规模，力度要看细则','收入预期偏弱时，服务消费恢复偏慢'],
    chain:['放宽准入、增加供给','服务价格和可得性改善','居民服务支出上升','行业收入与就业回升'],
    hist:['2024 年 8 月','服务消费意见发布后','相关板块短期走强，随后跟随细则落地节奏分化'],
    dirs:[['旅游及景区','准入放宽、假期消费'],['养老服务','需求刚性、供给缺口大'],['体育产业','赛事放开、场馆运营']],
    signals:['各部委配套细则的发布时间和资金规模','11 月社零中服务零售额增速','年底前文旅预订数据'],
    opp:'若细则带明确资金和准入放开，服务业龙头的收入弹性较大。',risk:'当前多为方向性表述，落地偏慢时板块容易冲高回落；居民收入预期是更根本的约束。',
    asks:['这次和 2024 年的服务消费意见有什么不同？','哪些细分方向受益最直接？','对我的自选股有什么影响？']}},
  {id:'n2',sec:'headline',kind:'data',src:'data:nbs',mk:'macro',lv:'high',type:'宏观数据',title:'9 月规上工业企业利润同比增长 8.6%，连续三个月回升',from:'国家统计局',time:'10-26 09:30',views:'8.6 万',tags:['工业利润','PPI'],
   sum:'利润增速好于预期，价格回升和高技术制造是主要拉动；上游和下游利润分化仍然明显。',
   body:['国家统计局今天发布数据，9 月全国规模以上工业企业利润同比增长 8.6%，增速比 8 月加快 3.4 个百分点。1–9 月累计利润同比增长 3.1%。','分行业看，高技术制造业利润增长 18.4%，电子、专用设备拉动明显；原材料行业利润随价格回升改善；消费品制造业利润仍小幅下降。','统计局表示，工业品价格降幅收窄、市场需求回暖，带动企业利润持续恢复。'],
   ai:{verdict:['偏多',60,'盈利修复延续，对周期和高端制造是边际利好；要看 10 月 PPI 是否继续改善。'],
    one:'利润连续三个月回升，靠的是价格回升和高技术制造，消费品制造还没跟上。',
    data:[['9 月利润同比','+8.6%','前值 +5.2%，预期 +7.0%'],['1–9 月累计','+3.1%','较 1–8 月加快 0.6 个百分点'],['高技术制造','+18.4%','拉动最大'],['营收利润率','5.6%','同比提高 0.3 个百分点']],
    quotes:[['有色金属指数','+1.2%'],['机械设备','+0.9%'],['上证指数','+0.4%']],
    bg:'规上工业企业指年营收 2000 万元以上的工业企业。利润数据每月下旬发布，是观察企业盈利和价格传导的核心指标。',
    line:[['7 月','利润同比转正'],['8 月','同比 +5.2%'],['9 月','同比 +8.6%，连续三个月回升']],
    terms:[['营收利润率','利润总额 ÷ 营业收入，每 100 元收入赚多少钱'],['PPI','工业品出厂价格指数，回升通常先于利润改善']],
    bull:['价格与利润同步改善，修复质量较好','高技术制造保持高增长'],bear:['消费品制造仍在下降，需求端不均衡','基数效应在四季度减弱'],
    chain:['PPI 降幅收窄','出厂价格回升','毛利改善','利润增速回升','补库存意愿提高'],
    signals:['10 月 PPI 环比能否转正','消费品制造利润是否跟上','10 月 PMI 新订单指数'],
    opp:'利润修复向中游设备和原材料扩散时，相关行业估值有修复空间。',risk:'若 10 月价格回落，本轮修复可能只是基数效应；分化行业不宜整体外推。',
    asks:['哪些行业利润改善最明显？','这和 PPI 的关系是什么？','四季度利润还能继续回升吗？']}},
  {id:'n3',sec:'headline',kind:'event',src:'event:monetary',mk:'us',lv:'high',type:'国际联动',title:'美联储本周议息前瞻：市场押注再降 25 个基点',from:'财联社',time:'10-26 07:50',views:'6.1 万',tags:['美联储','降息','美元'],
   sum:'利率期货隐含的降息概率超过九成，市场更关注声明对 12 月的暗示和对就业的判断。',
   body:['美联储将于本周四凌晨公布利率决议。利率期货显示，市场认为降息 25 个基点的概率约为 92%。','多家机构认为，降息本身已被充分定价，真正影响市场的是声明中对后续路径的措辞，以及主席记者会对就业放缓的判断。','若声明暗示 12 月继续降息，美元可能进一步走弱；若措辞偏谨慎，风险资产或出现回调。'],
   ai:{verdict:['中性',52,'降息基本被定价，方向取决于声明措辞；对港股科技和黄金偏正面，对美元偏负面。'],
    one:'降息几乎是确定的，真正要看的是声明怎么说 12 月。',
    data:[['降息 25bp 概率','约 92%','利率期货隐含'],['9 月核心 PCE','2.7%','前值 2.8%'],['9 月失业率','4.4%','连续两月上升']],
    quotes:[['美元指数','-0.2%'],['COMEX 黄金','+0.6%'],['恒生科技','+1.1%']],
    bg:'美联储每年召开 8 次议息会议。市场对单次会议结果通常提前定价，因此会后行情更多由声明措辞、点阵图和记者会决定。',
    line:[['9 月','降息 25 个基点，重启降息'],['10 月中','多位官员表态支持继续降息'],['本周四','公布利率决议']],
    terms:[['点阵图','美联储官员对未来利率的预测分布，每季度公布一次'],['鹰派 / 鸽派','偏向收紧 / 偏向宽松的政策立场']],
    bull:['降息延续，全球流动性改善','美元走弱利好非美资产'],bear:['已被充分定价，存在「买预期、卖事实」','通胀若反弹，降息节奏可能放缓'],
    chain:['美联储降息','美债收益率下行','美元走弱','资金流向新兴市场','港股科技估值修复'],
    hist:['2019 年 7–10 月','连续三次预防式降息','第三次降息后声明转向观望，美元先跌后稳'],
    dirs:[['港股科技','对美债利率最敏感'],['黄金','美元走弱、实际利率下行'],['有色金属','美元计价商品']],
    signals:['声明对 12 月是否「继续调整」的措辞','记者会对就业的判断','会后 10 年期美债收益率的位置'],
    opp:'若声明偏鸽，利率敏感资产有一段估值修复。',risk:'市场已充分定价，偏鹰措辞可能引发短线回调；汇率波动会影响港股表现。',
    asks:['降息对 A 股有什么影响？','如果声明偏鹰，哪些资产受冲击最大？','帮我对比 2019 年那轮降息']}},
  {id:'n4',sec:'hot',kind:'news',src:'news:hot',mk:'ashare',lv:'high',type:'市场异动',mine:true,title:'存储芯片价格连续第三个月上涨，DDR5 合约价环比涨 12%',from:'证券时报',time:'10-26 10:12',views:'9.3 万',tags:['存储芯片','半导体','AI 服务器'],
   sum:'AI 服务器对高端存储的需求挤占产能，通用 DRAM 供给收紧，合约价连续三个月上涨。',
   body:['据行业机构数据，10 月 DDR5 合约价环比上涨约 12%，为连续第三个月上涨；NAND 晶圆现货价周环比上涨约 8%。','机构认为，AI 服务器对 HBM 等高端存储的需求持续增长，原厂把更多产能转向高端产品，通用 DRAM 供给趋紧。','受消息影响，今天存储芯片板块大幅走强，半导体指数上涨 2.8%。'],
   ai:{verdict:['偏多',66,'存储进入上行周期，利润修复弹性大；要看终端需求能否承接涨价。'],
    one:'AI 服务器把存储产能「吸走」了，通用存储变紧、价格上涨，已经是第三个月。',
    data:[['DDR5 合约价环比','+12%','连续第 3 个月上涨'],['NAND 晶圆现货','+8%','周环比'],['四季度涨价预期','8%–13%','机构调研']],
    quotes:[['半导体指数','+2.8%'],['存储芯片','+4.6%'],['科创 50','+1.9%']],
    bg:'存储芯片是典型的周期行业，价格由供需决定，波动大。原厂扩产周期长，需求突然增加时价格上涨往往持续数个季度。',
    line:[['8 月','合约价止跌回升'],['9 月','涨幅扩大'],['10 月','DDR5 合约价环比 +12%']],
    terms:[['HBM','高带宽内存，AI 加速卡的关键配套'],['合约价','原厂与大客户按月或季度谈定的价格，比现货价更稳定']],
    bull:['AI 需求带来结构性增量','原厂资本开支克制，供给偏紧'],bear:['手机、PC 等终端需求偏弱','涨价过快可能抑制采购'],
    chain:['AI 服务器出货增加','HBM 挤占产能','通用 DRAM 供给收紧','合约价上涨','存储厂商利润修复'],
    hist:['2016–2018 年','上一轮存储上行周期','持续约 8 个季度，后期因原厂扩产而反转'],
    dirs:[['存储模组','直接受益涨价'],['半导体设备','原厂扩产预期'],['封测','HBM 先进封装']],
    signals:['11 月合约价谈判结果','原厂是否大幅上调资本开支','手机与 PC 出货能否承接涨价'],
    opp:'涨价周期早中期，存储相关公司利润弹性大。',risk:'周期品价格波动剧烈，若终端需求转弱或原厂扩产，价格可能快速回落。',
    asks:['这轮存储涨价能持续多久？','和我自选里的半导体股有什么关系？','HBM 和普通 DRAM 有什么区别？']}},
  {id:'n5',sec:'hot',kind:'news',src:'news:report',mk:'ashare',lv:'mid',type:'公司公告',title:'多家券商上调四季度 A 股盈利预测，科技与红利成配置主线',from:'中国证券报',time:'10-26 09:05',views:'4.2 万',tags:['券商策略','盈利预测'],
   sum:'三季报预告整体好于预期，多家券商上调全年盈利预测，建议「科技成长 + 高股息」哑铃配置。',body:['随着三季报预告陆续披露，多家券商策略团队上调了四季度 A 股盈利预测。','从配置建议看，科技成长与高股息红利成为主要方向，部分机构建议关注业绩确定性高的消费龙头。']},
  {id:'n6',sec:'hot',kind:'news',src:'news:hot',mk:'ashare',lv:'mid',type:'公司公告',mine:true,title:'固态电池中试线密集投产，产业化时间表提前',from:'第一财经',time:'10-25 21:40',views:'7.5 万',tags:['固态电池','新能源'],
   sum:'多家电池企业固态电池中试线投产，行业预期小批量装车时间提前到 2027 年。',body:['近一个月内，多家电池企业宣布固态电池中试线投产或进入调试阶段。','业内人士表示，固态电池仍面临成本和良率挑战，但小批量装车时间有望提前到 2027 年。']},
  {id:'n7',sec:'headline',kind:'event',src:'event:earnings',mk:'ashare',lv:'mid',type:'公司公告',title:'三季报披露进入高峰，本周超 2000 家公司集中发布',from:'上海证券报',time:'10-26 07:20',views:'3.9 万',tags:['三季报','财报季'],
   sum:'本周是三季报披露最密集的一周，已披露公司中超过六成净利润同比增长。',body:['据统计，本周将有超过 2000 家上市公司发布三季报，披露进入高峰。','从已披露情况看，超过六成公司前三季度净利润同比增长，电子、有色、汽车零部件行业表现突出。'],
   ai:{one:'本周是三季报最密集的一周，先看业绩预告和实际值的差距。',data:[['本周披露','2000+ 家','全年最密集'],['已披露增长占比','约 62%','净利润同比']],
    line:[['10 月中','业绩预告密集发布'],['本周','三季报披露高峰'],['10-31','三季报披露截止']],signals:['自选股的实际业绩与预告差距','毛利率是否环比改善','四季度订单和指引'],
    asks:['帮我看本周哪些自选股发三季报','三季报重点看哪些指标？']}},
  {id:'n8',sec:'hot',kind:'policy',src:'policy:csrc',mk:'ashare',lv:'mid',type:'政策发布',title:'证监会：推动中长期资金入市，提高权益类基金占比',from:'证券日报',time:'10-25 18:30',views:'5.4 万',tags:['中长期资金','公募'],
   sum:'证监会表示将完善中长期资金入市配套政策，引导公募基金提高权益类产品占比。',body:['证监会有关负责人表示，将进一步完善中长期资金入市的配套政策，打通社保、保险、年金等资金入市堵点。','同时推动公募基金提高权益类基金占比，完善长周期考核机制。']},
  {id:'n9',sec:'hot',kind:'data',src:'data:pboc_d',mk:'macro',lv:'mid',type:'宏观数据',title:'9 月社融增量 2.6 万亿元，M1 增速回升',from:'中国人民银行',time:'10-24 17:00',views:'3.1 万',tags:['社融','M1'],
   sum:'社融增量同比多增，政府债券仍是主要支撑；M1 增速回升，企业活期存款有所改善。',body:['中国人民银行发布数据，9 月社会融资规模增量 2.6 万亿元，比上年同期多增。','9 月末 M1 同比增速较上月回升，显示企业资金活化程度有所改善。']},
  {id:'n10',sec:'hot',kind:'news',src:'news:hot',mk:'commodity',lv:'mid',type:'市场异动',title:'黄金冲高回落，COMEX 金价单日振幅超 3%',from:'华尔街见闻',time:'10-26 06:40',views:'4.8 万',tags:['黄金','美元'],
   sum:'议息会议前避险与获利了结交织，金价盘中创新高后回落。',body:['隔夜 COMEX 黄金盘中创出新高后快速回落，单日振幅超过 3%。','分析人士认为，议息会议前市场情绪谨慎，部分资金选择获利了结。']},
  /* 快讯：只有摘要，没有深度素材；阅读时如实说明，可让 Lumi 现场解读。 */
  {id:'f1',sec:'flash',kind:'news',src:'news:flash',mk:'ashare',lv:'high',type:'突发快讯',time:'14:52',title:'存储芯片板块午后持续走强，板块指数涨超 4%',sum:'存储芯片板块午后持续走强，多只个股涨停，板块指数涨幅扩大至 4.6%。'},
  {id:'f2',sec:'flash',kind:'data',src:'data:nbs',mk:'macro',lv:'high',type:'宏观数据',time:'09:30',title:'国家统计局：9 月规上工业企业利润同比增长 8.6%',sum:'国家统计局：9 月规上工业企业利润同比增长 8.6%，1–9 月累计增长 3.1%。',ref:'n2'},
  {id:'f3',sec:'flash',kind:'news',src:'news:flash',mk:'hk',lv:'mid',type:'突发快讯',time:'14:20',title:'恒生科技指数涨幅扩大至 1.5%，南向资金净买入超 60 亿港元',sum:'恒生科技指数涨幅扩大至 1.5%，南向资金今日净买入超过 60 亿港元。'},
  {id:'f4',sec:'flash',kind:'policy',src:'policy:miit',mk:'macro',lv:'mid',type:'政策发布',time:'13:45',title:'工信部：加快推进人形机器人标准体系建设',sum:'工信部表示，将加快人形机器人标准体系建设，推动关键零部件攻关和场景应用。'},
  {id:'f5',sec:'flash',kind:'news',src:'news:flash',mk:'us',lv:'mid',type:'国际联动',time:'11:08',title:'美股期货小幅走高，纳指期货涨 0.4%',sum:'美股三大股指期货小幅走高，纳指期货涨 0.4%，市场等待本周议息结果。'},
  {id:'f6',sec:'flash',kind:'event',src:'event:conference',mk:'ashare',lv:'mid',type:'突发快讯',time:'10:36',title:'全球智能汽车大会开幕，多家车企发布新一代智驾方案',sum:'全球智能汽车大会今日开幕，多家车企发布新一代智能驾驶方案。'},
  {id:'f7',sec:'flash',kind:'news',src:'news:flash',mk:'commodity',lv:'mid',type:'突发快讯',time:'10:02',title:'国内期货开盘，沪金跌 0.8%，沪铜涨 0.6%',sum:'国内商品期货开盘，沪金跌 0.8%，沪铜涨 0.6%，碳酸锂涨 2.1%。'},
  {id:'f8',sec:'flash',kind:'policy',src:'policy:state',mk:'macro',lv:'high',type:'政策发布',time:'08:30',title:'国常会：研究扩大服务消费的举措',sum:'国务院常务会议研究扩大服务消费的举措，提出六方面措施。',ref:'n1'},
  {id:'f9',sec:'flash',kind:'news',src:'news:flash',mk:'ashare',lv:'mid',type:'突发快讯',time:'09:25',title:'A 股集合竞价：沪指高开 0.2%，存储芯片板块领涨',sum:'集合竞价阶段，沪指高开 0.2%，深成指高开 0.3%，存储芯片板块领涨。'},
  {id:'f10',sec:'flash',kind:'event',src:'event:monetary',mk:'us',lv:'mid',type:'国际联动',time:'07:40',title:'利率期货：美联储本周降息 25 个基点的概率约 92%',sum:'利率期货显示，市场预计美联储本周降息 25 个基点的概率约为 92%。',ref:'n3'},
  /* 默认收起的栏目 */
  {id:'g1',sec:'notice',kind:'news',src:'news:notice',mk:'ashare',lv:'mid',type:'公司公告',mine:true,title:'华芯装备：前三季度净利润同比增长 46%',from:'公司公告',time:'10-25 20:15',sum:'前三季度营收与净利润均实现较快增长，刻蚀设备订单饱满。',body:['公司发布三季报，前三季度实现营业收入同比增长 32%，净利润同比增长 46%。','公司表示，刻蚀和薄膜沉积设备订单饱满，新产品在客户端验证顺利。']},
  {id:'g2',sec:'notice',kind:'news',src:'news:notice',mk:'ashare',lv:'mid',type:'公司公告',title:'东岭新材：拟投资 12 亿元建设固态电解质产线',from:'公司公告',time:'10-25 19:40',sum:'公司拟投资 12 亿元建设固态电解质产线，建设期 18 个月。',body:['公司公告拟投资 12 亿元建设年产 2000 吨固态电解质产线，建设期 18 个月。']},
  {id:'g3',sec:'research',kind:'news',src:'news:research',mk:'ashare',lv:'mid',type:'公司公告',title:'32 家机构调研华芯装备：关注新品验证和海外订单',from:'调研纪要',time:'10-24',sum:'机构关注新品验证进度、海外订单和毛利率变化。',body:['本次调研共 32 家机构参与，问题集中在新产品验证进度、海外订单和毛利率。','公司表示新产品已进入多家客户产线验证，预计明年贡献收入。']},
  {id:'g4',sec:'interactive',kind:'news',src:'news:interactive',mk:'ashare',lv:'mid',type:'公司公告',title:'投资者问东岭新材：固态电解质是否已向电池厂送样？',from:'互动易',time:'10-25',sum:'公司回复：已向多家电池企业送样，具体合作以公告为准。',body:['问：公司固态电解质产品是否已向电池厂送样？','答：公司已向多家电池企业送样测试，具体合作情况请以公司公告为准。']},
  {id:'g5',sec:'report',kind:'news',src:'news:report',mk:'ashare',lv:'mid',type:'公司公告',title:'存储行业深度：AI 驱动的新一轮上行周期',from:'某券商研究所',time:'10-24',sum:'报告认为本轮存储上行周期由 AI 需求驱动，持续性好于以往。',body:['报告认为，本轮存储价格上涨由 AI 服务器需求驱动，与以往由手机、PC 驱动的周期不同。','报告预计上行周期将持续至 2027 年上半年。']}
 ];
 const TOPICS=[['存储芯片涨价周期','AI 驱动的新一轮上行，持续多久？','存储'],['服务消费新政','从商品补贴到服务供给','服务消费'],['美联储降息路径','降息节奏与全球资产','美联储']];
 const INDICES=[['上证指数','3,428.6','+0.42%'],['深证成指','11,032.1','+0.68%'],['恒生指数','25,861.3','+1.02%'],['纳指期货','23,214.5','+0.40%']];
 const MOVES=[['14:52','存储芯片','+4.6%','DDR5 合约价连续三个月上涨，AI 服务器需求挤占产能'],['14:20','恒生科技','+1.5%','南向资金大幅净买入，议息前利率敏感资产走强'],['10:36','智能驾驶','+2.2%','全球智能汽车大会开幕，多家车企发布智驾方案']];
 /* 日历：本周 10-26（周一）到 11-01。 */
 const DAYS=['10-26 周一','10-27 周二','10-28 周三','10-29 周四','10-30 周五','10-31 周六','11-01 周日'];
 const CAL_TYPES=[['all','全部'],['eco','经济数据'],['event','事件'],['earn','财报'],['ipo','新股']];
 const REGIONS={cn:'中国',us:'美国',eu:'欧元区',jp:'日本'};
 const CAL=[
  {id:'c1',d:0,time:'09:30',rg:'cn',type:'eco',star:3,title:'9 月规上工业企业利润同比',prev:'5.2%',exp:'7.0%',act:'8.6%',ref:'n2',what:'年营收 2000 万元以上工业企业的利润增速，看企业盈利和价格传导。',why:'连续三个月回升，决定市场对四季度盈利修复的判断。',watch:['高技术制造与消费品制造的分化','与 10 月 PPI 的对应关系']},
  {id:'c2',d:0,time:'22:30',rg:'us',type:'eco',star:1,title:'10 月达拉斯联储制造业指数',prev:'-8.7',exp:'-6.0',act:'',what:'美国得州地区制造业景气调查。',why:'影响有限，议息前的边际参考。',watch:['新订单分项']},
  {id:'c3',d:1,time:'22:00',rg:'us',type:'eco',star:2,title:'10 月谘商会消费者信心指数',prev:'94.2',exp:'93.0',act:'',what:'美国消费者对当前和未来经济的信心。',why:'与就业预期高度相关，影响美联储对需求的判断。',watch:['就业「难找」分项']},
  {id:'c4',d:1,time:'全天',rg:'cn',type:'ipo',star:1,title:'新股申购：科瑞微（科创板）',prev:'',exp:'',act:'',what:'科创板新股申购，主营模拟芯片。',why:'半导体新股定价可参考同行估值。',watch:['发行市盈率与行业对比']},
  {id:'c5',d:2,time:'20:30',rg:'us',type:'eco',star:3,title:'美国三季度 GDP 年化季环比初值',prev:'3.8%',exp:'2.9%',act:'',what:'美国经济增长的最全面指标，初值修正幅度可能较大。',why:'议息前最后一个重要数据，影响对降息节奏的判断。',watch:['个人消费分项','核心 PCE 物价指数']},
  {id:'c6',d:2,time:'盘后',rg:'cn',type:'earn',star:2,title:'三季报披露高峰：超 600 家公司',prev:'',exp:'',act:'',ref:'n7',what:'本周三季报披露最密集的一天。',why:'业绩与预告的差距会带来个股分化。',watch:['自选股的实际业绩与预告差距','毛利率环比变化']},
  {id:'c7',d:3,time:'02:00',rg:'us',type:'event',star:3,title:'美联储公布利率决议',prev:'3.75%–4.00%',exp:'3.50%–3.75%',act:'',ref:'n3',what:'美联储议息会议结果和政策声明，随后主席召开记者会。',why:'市场已基本定价降息，关键看声明对 12 月的暗示。',watch:['声明措辞','记者会对就业的判断','会后美债收益率']},
  {id:'c8',d:4,time:'11:00',rg:'jp',type:'event',star:3,title:'日本央行公布利率决议',prev:'0.75%',exp:'0.75%',act:'',what:'日本央行货币政策会议结果。',why:'日元利率变化影响全球套息交易。',watch:['是否暗示下次加息时间']},
  {id:'c9',d:4,time:'18:00',rg:'eu',type:'eco',star:2,title:'欧元区三季度 GDP 初值',prev:'0.1%',exp:'0.2%',act:'',what:'欧元区经济增长初值。',why:'影响欧央行降息预期和欧元走势。',watch:['德国、法国分项']},
  {id:'c10',d:5,time:'09:30',rg:'cn',type:'eco',star:3,title:'10 月官方制造业 PMI',prev:'49.8',exp:'50.0',act:'',what:'制造业景气度，50 为荣枯线。',why:'能否重回 50 以上，是判断经济修复的关键信号。',watch:['新订单指数','出厂价格指数']}
 ];
 /* 投资必读：精选栏目 + 我的简报（简报和目标一样，在对话中新建）。 */
 const COLUMNS=[['morning','早盘必读','每天 8:00 · 隔夜要闻与今日关注',['n1','n3','n2']],['hot','热点追踪','盘中更新 · 异动板块的来龙去脉',['n4','f3','n6']],['notice','晚间公告精选','每天 20:00 · 值得看的公告',['g1','g2']],['report','研报精选','每天 · 券商研报与调研',['g5','g3','n5']]];
 const BRIEFS=[{id:'b1',title:'自选股公告与调研简报',when:'每天 20:00',scope:'自选股 12 只 · 公告 / 调研 / 互动易',today:['华芯装备三季报：净利润同比 +46%，好于预告中值','东岭新材拟投资 12 亿元建固态电解质产线','华芯装备接待 32 家机构调研，关注新品验证']},
  {id:'b2',title:'半导体周报',when:'每周一 8:00',scope:'半导体 · 要闻 / 研报 / 数据',today:['存储合约价连续第三个月上涨，DDR5 环比 +12%','券商深度：本轮存储周期由 AI 驱动，持续性好于以往','本周关注：美联储决议对科技股估值的影响']}];

 /* ---------- 状态 ---------- */
 let root,toastTimer,tick;
 const S={tab:'home',extra:[],navOpen:false,reading:null,depth:'mid',shown:0,fav:new Set(),read:new Set(),saved:new Set(),
  important:false,market:'all',q:'',kind:'rec',sort:'new',filter:'all',srcOpen:false,
  subs:new Set(['news:headline','news:flash','news:hot','policy:state','policy:csrc','policy:miit','data:nbs','data:pboc_d','event:monetary','event:earnings','event:conference']),custom:[],cu:'',
  day:0,calType:'all',calImp:false,region:'all',calSel:'c1',col:'morning',brief:'b1',notes:false};
 const get=id=>A.find(x=>x.id===id);
 const mods=a=>MODS.filter(([k])=>has(a,k));
 const level=()=>DEPTHS.find(([d])=>d===S.depth)[2];
 const visible=a=>mods(a).filter(m=>m[3]<=level());
 function has(a,k){const ai=a.ai;if(!ai)return k==='one';return k==='bullbear'?!!ai.bull:k==='risk'?!!ai.opp:!!ai[k]}
 function toast(text){clearTimeout(toastTimer);let t=root?.querySelector('.kb-toast');if(!root)return;if(!t){t=document.createElement('div');t.className='kb-toast';t.setAttribute('role','status');root.append(t)}t.textContent=text;t.hidden=false;toastTimer=setTimeout(()=>t.hidden=true,2600)}
 function openChat(question){if(question)state.draft=question;if(state.mode!=='split')togglePageCopilot();else render({preservePage:true})}

 /* ---------- 小部件 ---------- */
 const btn=(label,act,attrs='',cls='')=>`<button type="button" class="kb-btn ${cls}" data-act="${act}" ${attrs}>${label}</button>`;
 const chip=(label,cls='')=>`<span class="kb-chip ${cls}">${esc(label)}</span>`;
 const seg=(items,cur,act,label)=>`<div class="kb-seg" role="group" aria-label="${label}">${items.map(([id,name])=>`<button type="button" class="${cur===id?'is-active':''}" aria-pressed="${cur===id}" data-act="${act}" data-v="${id}">${name}</button>`).join('')}</div>`;
 const more=tab=>`<button type="button" class="nw-more" data-act="tab" data-v="${tab}">更多 ›</button>`;
 const card=(title,body,tools='')=>`<section class="nw-card"><header class="nw-card-head"><h2>${title}</h2>${tools}</header>${body}</section>`;
 const tagsOf=a=>(a.mine?chip('自选相关','is-notice'):'')+(a.lv==='high'?chip('重要'):'');
 const chg=v=>`<span class="nw-chg ${String(v).startsWith('-')?'is-down':'is-up'}">${esc(v)}</span>`;
 const row=(a,extra='')=>`<button type="button" class="nw-row${S.read.has(a.id)?' is-read':''}" data-act="read" data-id="${a.id}"><span class="nw-row-title">${esc(a.title)}</span><span class="nw-row-meta">${tagsOf(a)}<span>${esc(a.from||SECS[a.sec])} · ${esc(a.time)}</span>${extra}</span></button>`;

 /* ---------- 资讯首页 ---------- */
 function home(){
  const head=A.filter(a=>a.sec==='headline'),hot=A.filter(a=>a.sec==='hot'),lead=head[0];
  const flash=A.filter(a=>a.sec==='flash').sort((a,b)=>b.time.localeCompare(a.time)).slice(0,6);
  const today=CAL.filter(c=>c.d===0||c.d===2||c.d===3).slice(0,4);
  return `<div class="nw-home">
   <div class="nw-col">
    ${card('热门文章',`<ol class="nw-rank">${[...hot].sort((a,b)=>parseFloat(b.views)-parseFloat(a.views)).slice(0,6).map((a,i)=>`<li><b>${i+1}</b>${row(a)}</li>`).join('')}</ol>`,more('deep'))}
    ${card('深度专题',TOPICS.map(([t,d,kw])=>`<button type="button" class="nw-topic" data-act="topic" data-kw="${kw}"><b>${t}</b><span class="kb-sub">${d}</span></button>`).join(''),'')}
   </div>
   <div class="nw-col nw-col-main">
    ${card('今日头条',`<button type="button" class="nw-lead" data-act="read" data-id="${lead.id}"><span class="nw-lead-title">${esc(lead.title)}</span><span class="nw-lead-sum">${esc(lead.sum)}</span><span class="nw-row-meta">${tagsOf(lead)}<span>${esc(lead.from)} · ${esc(lead.time)}</span><span class="kb-chip is-ai">AI 解读 ${mods(lead).length} 项</span></span></button>${head.slice(1).map(a=>row(a)).join('')}`)}
    ${card('要闻',hot.map(a=>row(a)).join(''),'')}
   </div>
   <div class="nw-col">
    ${card('<span class="nw-live"></span>7×24 快讯',`<ul class="nw-flash-mini">${flash.map(a=>`<li><time>${a.time}</time><button type="button" class="nw-link${a.lv==='high'?' is-strong':''}" data-act="read" data-id="${a.id}">${esc(a.title)}</button></li>`).join('')}</ul>`,more('flash'))}
    ${card('财经日历',today.map(c=>`<button type="button" class="nw-cal-mini" data-act="cal-open" data-id="${c.id}"><span class="kb-sub">${DAYS[c.d].slice(0,5)} ${c.time} · ${REGIONS[c.rg]}</span><span>${esc(c.title)}</span><span class="nw-star">${'★'.repeat(c.star)}</span></button>`).join(''),more('calendar'))}
   </div></div>`;
 }

 /* ---------- 三栏阅读：标题列表 · 正文 · AI 解读 ---------- */
 function listFor(a){
  if(S.tab==='deep')return feed();
  if(S.tab==='mustread')return COLUMNS.find(c=>c[0]===S.col)[3].map(get);
  const sec=a.sec==='headline'||a.sec==='hot'?['headline','hot']:[a.sec];
  return A.filter(x=>sec.includes(x.sec));
 }
 function reader(){
  const a=get(S.reading),list=listFor(a);
  const backTo=TABS.concat(EXTRA).find(([id])=>id===S.tab)?.[1]||'资讯首页';
  return `<div class="nw-reader">
   <aside class="nw-pane nw-list-pane"><header class="nw-pane-head">${S.tab==='deep'?deepHead():`<button type="button" class="kb-link" data-act="close">‹ 返回${backTo}</button><span class="kb-sub">${esc(SECS[a.sec]||'')}</span>`}</header>
    <div class="nw-pane-body" data-scroll="list">${list.length?list.map(x=>`<button type="button" class="nw-list-item${x.id===a.id?' is-active':''}${S.read.has(x.id)?' is-read':''}" data-act="read" data-id="${x.id}"><span>${esc(x.title)}</span><small>${esc(x.from||SECS[x.sec])} · ${esc(x.time)}</small></button>`).join(''):`<p class="kb-sub nw-empty">没有符合条件的内容。调整信息源或筛选条件试试。</p>`}</div></aside>
   <article class="nw-pane nw-doc"><div class="nw-pane-body" data-scroll="doc">
    <div class="kb-row kb-wrap">${tagsOf(a)}${chip(a.type)}</div>
    <h1 tabindex="-1">${esc(a.title)}</h1>
    <p class="kb-sub">${esc(a.from||SECS[a.sec])} · ${esc(a.time)}${a.views?` · ${a.views} 阅读`:''}</p>
    <div class="kb-row kb-wrap nw-doc-tools">${btn('在对话中问','ask','','is-primary is-small')}${btn(S.saved.has(a.id)?'已存入知识库':'存入知识库','save','',`is-small`)}${a.ref?btn('看完整报道','read',`data-id="${a.ref}"`,'is-small'):''}</div>
    <div class="nw-body">${(a.body||[a.sum]).map(p=>`<p>${esc(p)}</p>`).join('')}</div>
    ${a.tags?`<div class="kb-row kb-wrap">${a.tags.map(t=>chip(t)).join('')}</div>`:''}
    <section class="nw-comments"><b>评论</b><p class="kb-sub">交互稿：评论区沿用现有资讯评论，此处不展开。</p></section>
   </div></article>
   <aside class="nw-pane nw-ai">${aiPanel(a)}</aside></div>`;
 }
 function aiPanel(a){
  const all=mods(a),vis=visible(a),shown=vis.slice(0,S.shown),done=S.shown>=vis.length;
  const counts=DEPTHS.map(([id,name,lv])=>[id,`${name} · ${all.filter(m=>m[3]<=lv).length} 项`]);
  return `<header class="nw-pane-head"><b>AI 解读</b><span class="kb-grow"></span>${chip('AI 生成','is-ai')}</header>
   <div class="nw-pane-body" data-scroll="ai">
    ${a.ai?`<div class="nw-depth"><span class="kb-sub">阅读深度</span>${seg(counts,S.depth,'depth','阅读深度')}</div>
    <p class="kb-sub">「${esc(a.type)}」类内容推荐角度：${esc(TYPE_TIP[a.type]||'背景 + 关键数据 + 接下来盯什么')}</p>
    <div class="nw-prog" aria-live="polite"><div class="kb-row"><span>${done?'解读完成':'AI 正在组织解读…'}</span><span class="kb-grow"></span><span>${Math.min(S.shown,vis.length)} / ${vis.length}</span></div><div class="nw-prog-bar"><i style="width:${vis.length?Math.min(100,S.shown/vis.length*100):100}%"></i></div></div>
    ${layers(shown,a)}`:fallback(a)}
    <p class="nw-disclaimer">AI 基于正文与公开信息生成，演示数据；不构成投资建议。</p>
   </div>`;
 }
 /* 按「理解 / 溯源 / 数据 / 市场 / 决策」分组展示已解锁的模块。 */
 function layers(shown,a){
  const order=['理解','溯源','数据','市场','决策'];
  return order.map(layer=>{const list=shown.filter(m=>m[2]===layer);return list.length?`<div class="nw-layer"><span class="nw-layer-name">${layer}</span>${list.map(m=>mod(m,a)).join('')}</div>`:''}).join('');
 }
 function mod([k,title],a){
  const ai=a.ai,fav=S.fav.has(a.id+k);
  const body={
   verdict:()=>`<div class="kb-row"><b class="nw-stance">${ai.verdict[0]}</b><span class="nw-score"><i style="width:${ai.verdict[1]}%"></i></span><span class="kb-sub">${ai.verdict[1]} / 100</span></div><p>${esc(ai.verdict[2])}</p>`,
   one:()=>`<p class="nw-one">${esc(ai.one)}</p>`,
   data:()=>`<table class="nw-table">${ai.data.map(([l,v,n])=>`<tr><td>${esc(l)}</td><td><b>${esc(v)}</b></td><td class="kb-sub">${esc(n)}</td></tr>`).join('')}</table>`,
   quotes:()=>`<div class="nw-quotes">${ai.quotes.map(([n,v])=>`<span>${esc(n)}${chg(v)}</span>`).join('')}</div>`,
   bg:()=>`<p>${esc(ai.bg)}</p>`,
   line:()=>`<ol class="nw-line">${ai.line.map(([d,t])=>`<li><time>${esc(d)}</time><span>${esc(t)}</span></li>`).join('')}</ol>`,
   terms:()=>ai.terms.map(([t,d])=>`<p><b>${esc(t)}</b>：${esc(d)}</p>`).join(''),
   bullbear:()=>`<div class="nw-two"><div><b>看多</b><ul>${ai.bull.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><b>看空</b><ul>${ai.bear.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>`,
   chain:()=>`<div class="nw-chain">${ai.chain.map(x=>`<span>${esc(x)}</span>`).join('<i>→</i>')}</div>`,
   hist:()=>`<p><b>${esc(ai.hist[0])}</b> · ${esc(ai.hist[1])}</p><p class="kb-sub">${esc(ai.hist[2])}</p>`,
   dirs:()=>`<table class="nw-table">${ai.dirs.map(([n,w])=>`<tr><td><b>${esc(n)}</b></td><td class="kb-sub">${esc(w)}</td></tr>`).join('')}</table><p class="kb-sub">只列方向，不推荐具体标的。</p>`,
   signals:()=>`<ol class="nw-signals">${ai.signals.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>${btn('让 Lumi 帮我盯','watch','','is-small')}`,
   risk:()=>`<div class="nw-two"><div><b>机会</b><p>${esc(ai.opp)}</p></div><div><b>风险</b><p>${esc(ai.risk)}</p></div></div>`,
   asks:()=>`<div class="kb-row kb-wrap">${ai.asks.map(q=>`<button type="button" class="kb-chip is-action" data-act="follow" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`
  }[k]();
  /* 只给刚解锁的模块做淡入，重绘时已有模块不再闪动。 */
  const fresh=tick&&visible(a)[S.shown-1]?.[0]===k;
  return `<section class="nw-mod${fresh?' is-new':''}"><header class="kb-row"><b>${title}</b><span class="kb-grow"></span><button type="button" class="nw-fav" data-act="fav" data-k="${k}" aria-pressed="${fav}">${fav?'★ 已收藏':'☆ 收藏'}</button></header>${body}</section>`;
 }
 /* 没有深度素材（快讯、接口实时内容）：只给摘要，并如实说明。 */
 function fallback(a){
  return `<section class="nw-mod"><header class="kb-row"><b>一句话看懂</b></header><p class="nw-one">${esc(a.sum)}</p></section>
   <section class="nw-mod is-dashed"><header class="kb-row"><b>深度解读还没生成</b></header><p class="kb-sub">这条是实时${a.sec==='flash'?'快讯':'内容'}，还没经过解读素材加工（名词解释、背景、因果链、历史参照等），这里不拼凑。可以让 Lumi 结合最新行情现场解读。</p>
    <div class="kb-row kb-wrap">${btn('让 Lumi 现场解读','ask','','is-small is-primary')}${a.ref?btn('看完整报道的解读','read',`data-id="${a.ref}"`,'is-small'):''}</div></section>`;
 }

 /* ---------- 快讯 ---------- */
 function flash(){
  const q=S.q.trim();
  const list=A.filter(a=>a.sec==='flash'&&(!S.important||a.lv==='high')&&(S.market==='all'||a.mk===S.market)&&(!q||(a.title+a.sum).includes(q))).sort((a,b)=>b.time.localeCompare(a.time));
  return `<div class="nw-flash">
   <div class="nw-flash-main">
    <div class="nw-toolbar"><b>10 月 26 日 周一</b><label class="kb-check"><input type="checkbox" data-act="important" ${S.important?'checked':''}>只看重要</label><label class="kb-check"><input type="checkbox" data-act="voice">语音播报</label><span class="kb-grow"></span><input class="kb-input" type="search" placeholder="搜索快讯、股票、关键词" data-input="q" value="${esc(S.q)}" aria-label="搜索快讯"></div>
    ${seg(MARKETS,S.market,'market','市场')}
    <ol class="nw-timeline">${list.map(a=>`<li class="${a.lv==='high'?'is-high':''}"><time>${a.time}</time><button type="button" data-act="read" data-id="${a.id}"><b>${esc(a.title)}</b><span>${esc(a.sum)}</span></button></li>`).join('')||'<li class="kb-sub">没有符合条件的快讯</li>'}</ol>
   </div>
   <aside class="nw-col">
    ${card('主要指数',`<table class="nw-table">${INDICES.map(([n,v,c])=>`<tr><td>${n}</td><td>${v}</td><td>${chg(c)}</td></tr>`).join('')}</table>`)}
    ${card('异动解读',MOVES.map(([t,n,c,why])=>`<div class="nw-move"><div class="kb-row"><span class="kb-sub">${t}</span><b>${n}</b>${chg(c)}</div><p class="kb-sub">${esc(why)}</p><button type="button" class="kb-link" data-act="follow" data-q="${esc(`${n}今天为什么${c.startsWith('-')?'下跌':'上涨'}？后面还能持续吗？`)}">问 Lumi 为什么</button></div>`).join(''))}
   </aside></div>`;
 }

 /* ---------- AI 解读信息流 ---------- */
 function feed(){
  const kinds=S.kind==='rec'?['event','policy','data','news']:[S.kind];
  let list=A.filter(a=>kinds.includes(a.kind)&&(S.subs.has(a.src)||S.custom.some(c=>match(a,c))));
  if(S.filter==='unread')list=list.filter(a=>!S.read.has(a.id));
  if(S.filter==='high')list=list.filter(a=>a.lv==='high');
  const score=a=>S.sort==='hot'?parseFloat(a.views||0):S.sort==='imp'?(a.lv==='high'?1:0):0;
  return list.sort((a,b)=>score(b)-score(a)||stamp(b).localeCompare(stamp(a)));
 }
 /* 快讯只记时分，都是今天发的；排序时补上日期。 */
 const stamp=a=>a.sec==='flash'?'10-26 '+a.time:a.time;
 const match=(a,kw)=>(a.title+a.sum+(a.tags||[]).join('')).includes(kw);
 function deepHead(){
  const n=S.subs.size+S.custom.length;
  return `<div class="nw-deep-head">${seg(KINDS,S.kind,'kind','内容类型')}
   <div class="kb-row kb-wrap"><span class="kb-sub">已订阅 ${n} 个信息源</span><span class="kb-grow"></span><button type="button" class="kb-link" data-act="src-open">管理信息源</button></div>
   ${S.custom.length?`<div class="kb-row kb-wrap">${S.custom.map(c=>`<span class="kb-chip is-ai">✦ ${esc(c)}<button type="button" data-act="cu-remove" data-kw="${esc(c)}" aria-label="移除 ${esc(c)}">×</button></span>`).join('')}</div>`:''}
   <div class="kb-row kb-wrap">${seg([['new','最新'],['hot','最热'],['imp','最重要']],S.sort,'sort','排序')}${seg([['all','全部'],['unread','未读'],['high','重要']],S.filter,'filter','筛选')}</div></div>`;
 }
 function sources(){
  const kinds=S.kind==='rec'?['news','policy','data','event']:[S.kind];
  const title={news:'资讯栏目',policy:'政策来源',data:'数据发布机构',event:'事件类型'};
  return `<div class="kb-backdrop" data-act="src-close"><section class="kb-modal nw-src" role="dialog" aria-modal="true" aria-label="管理信息源">
   <div class="kb-row"><b>管理我的信息源</b><span class="kb-grow"></span><button type="button" class="kb-icon" data-act="src-close" aria-label="关闭">×</button></div>
   <p class="kb-sub">每类内容有独立的信息源；只展示你勾选的来源。也可以一句话生成专属信息流。</p>
   ${kinds.map(k=>`<div class="nw-src-group"><b>${title[k]}</b><div class="kb-row kb-wrap">${SOURCES[k].map(([id,name])=>{const key=k+':'+id,on=S.subs.has(key);return `<button type="button" class="kb-chip is-action${on?' is-notice':''}" aria-pressed="${on}" data-act="sub" data-key="${key}">${on?'✓ ':''}${name}</button>`}).join('')}</div></div>`).join('')}
   <div class="nw-src-group"><b>自定义 AI 筛选</b><form class="kb-row" data-form="custom"><input class="kb-input kb-grow" placeholder="例如：芯片行业重要新闻" data-input="cu" value="${esc(S.cu)}" aria-label="一句话描述想看的内容">${btn('生成信息流','cu-add','','is-primary')}</form><p class="kb-sub">AI 提取关键词，生成一条专属信息流，自动加入信息源。</p></div>
   <div class="kb-row"><span class="kb-grow"></span>${btn('完成','src-close','','is-primary')}</div></section></div>`;
 }

 /* ---------- 日历 ---------- */
 function calendar(){
  const ok=c=>(S.calType==='all'||c.type===S.calType)&&(!S.calImp||c.star===3)&&(S.region==='all'||c.rg===S.region);
  const list=CAL.filter(c=>c.d===S.day&&ok(c)),sel=CAL.find(c=>c.id===S.calSel);
  return `<div class="nw-cal">
   <div class="nw-cal-main">
    <div class="nw-days">${DAYS.map((d,i)=>`<button type="button" class="${S.day===i?'is-active':''}" data-act="day" data-v="${i}"><b>${d.slice(0,5)}</b><span>${d.slice(6)}${i===0?' · 今天':''}</span><small>${CAL.filter(c=>c.d===i&&ok(c)).length} 项</small></button>`).join('')}</div>
    <div class="kb-row kb-wrap">${seg(CAL_TYPES,S.calType,'cal-type','类型')}<label class="kb-check"><input type="checkbox" data-act="cal-imp" ${S.calImp?'checked':''}>只看 ★★★</label><span class="kb-grow"></span><select data-act="region" aria-label="地区"><option value="all">全部地区</option>${Object.entries(REGIONS).map(([k,v])=>`<option value="${k}" ${S.region===k?'selected':''}>${v}</option>`).join('')}</select></div>
    <table class="nw-table nw-cal-table"><thead><tr><th>时间</th><th>地区</th><th>事项</th><th>重要性</th><th>前值</th><th>预期</th><th>公布</th></tr></thead><tbody>
    ${list.map(c=>`<tr class="${c.id===S.calSel?'is-active':''}" data-act="cal-sel" data-id="${c.id}" tabindex="0"><td>${c.time}</td><td>${REGIONS[c.rg]}</td><td>${esc(c.title)}</td><td class="nw-star">${'★'.repeat(c.star)}</td><td>${c.prev||'—'}</td><td>${c.exp||'—'}</td><td><b>${c.act||'—'}</b></td></tr>`).join('')||'<tr><td colspan="7" class="kb-sub">这一天没有符合条件的事项</td></tr>'}</tbody></table>
   </div>
   <aside class="nw-pane nw-ai"><header class="nw-pane-head"><b>AI 解读</b><span class="kb-grow"></span>${chip('AI 生成','is-ai')}</header><div class="nw-pane-body">
    ${sel?`<p class="kb-sub">${DAYS[sel.d]} ${sel.time} · ${REGIONS[sel.rg]} · <span class="nw-star">${'★'.repeat(sel.star)}</span></p><h2>${esc(sel.title)}</h2>
     ${sel.prev?`<div class="nw-quotes"><span>前值 <b>${sel.prev}</b></span><span>预期 <b>${sel.exp||'—'}</b></span><span>公布 <b>${sel.act||'待公布'}</b></span></div>`:''}
     <section class="nw-mod"><b>这是什么</b><p>${esc(sel.what)}</p></section>
     <section class="nw-mod"><b>为什么重要</b><p>${esc(sel.why)}</p></section>
     <section class="nw-mod"><b>重点看</b><ol class="nw-signals">${sel.watch.map(w=>`<li>${esc(w)}</li>`).join('')}</ol></section>
     <div class="kb-row kb-wrap">${sel.act?'':btn('公布时提醒我','remind','','is-small')}${btn('在对话中问','cal-ask','','is-small is-primary')}${sel.ref?btn('看相关报道','read',`data-id="${sel.ref}"`,'is-small'):''}</div>`:'<p class="kb-sub">点击中间任意事项，查看 AI 解读。</p>'}
    <p class="nw-disclaimer">AI 基于公开信息生成，演示数据；不构成投资建议。</p></div></aside></div>`;
 }

 /* ---------- 投资必读 ---------- */
 function mustread(){
  const col=COLUMNS.find(c=>c[0]===S.col);
  return `<div class="nw-must">
   <aside class="nw-col">${card('精选栏目',COLUMNS.map(([id,name,desc])=>`<button type="button" class="nw-topic${S.col===id?' is-active':''}" data-act="col" data-v="${id}"><b>${name}</b><span class="kb-sub">${desc}</span></button>`).join(''))}</aside>
   <div class="nw-col nw-col-main">${card(col[1],col[3].map(get).map(a=>row(a)).join(''),`<span class="kb-sub">${col[2]}</span>`)}</div>
   <aside class="nw-col">${card('我的简报',BRIEFS.map(b=>`<div class="nw-brief${S.brief===b.id?' is-open':''}"><button type="button" class="nw-brief-head" data-act="brief" data-v="${b.id}" aria-expanded="${S.brief===b.id}"><b>${esc(b.title)}</b><span class="kb-sub">${esc(b.when)} · ${esc(b.scope)}</span></button>
    ${S.brief===b.id?`<div class="nw-brief-body"><span class="kb-sub">今天这一期</span><ul>${b.today.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><div class="kb-row kb-wrap">${btn('在对话中修改','brief-edit',`data-v="${b.id}"`,'is-small')}</div></div>`:''}</div>`).join(''),btn('＋ 新建','brief-new','','is-small'))}
    <p class="kb-hint">简报和目标一样在对话中新建：说出想看什么、多久一次，Lumi 确认后定时生成。</p></aside></div>`;
 }

 /* ---------- 默认收起的栏目 ---------- */
 function section(sec){
  const [,name,desc]=EXTRA.find(([id])=>id===sec);
  return `<div class="nw-section">${card(name,A.filter(a=>a.sec===sec).map(a=>row(a)).join(''),`<span class="kb-sub">${desc}</span>`)}</div>`;
 }

 /* ---------- 框架：顶部栏目 + 栏目管理 ---------- */
 function nav(){
  const tabs=TABS.concat(EXTRA.filter(([id])=>S.extra.includes(id)));
  return `<header class="nw-top"><h1>资讯</h1><nav class="nw-tabs" role="tablist" aria-label="资讯栏目">${tabs.map(([id,name])=>`<button type="button" role="tab" aria-selected="${S.tab===id}" class="${S.tab===id?'is-active':''}" data-act="tab" data-v="${id}">${name}</button>`).join('')}
   <button type="button" class="nw-tab-add" data-act="nav-toggle" aria-expanded="${S.navOpen}" aria-label="管理栏目" title="管理栏目">＋</button></nav>
   ${S.navOpen?`<div class="nw-nav-pop" role="dialog" aria-label="管理栏目"><b>栏目</b><p class="kb-sub">资讯首页、快讯、AI 解读、日历、投资必读固定展示；下面的栏目按需打开。</p>${EXTRA.map(([id,name,desc])=>`<label class="kb-check"><input type="checkbox" data-act="extra" data-v="${id}" ${S.extra.includes(id)?'checked':''}><span>${name}<small class="kb-sub"> · ${desc}</small></span></label>`).join('')}</div>`:''}</header>`;
 }
 const NOTES={
  home:['资讯是侧栏「工作台」之后的一级入口。首页三栏：左「热门文章 / 深度专题」，中「今日头条 / 要闻」，右「7×24 快讯 / 财经日历」；各模块「更多」跳到对应栏目。','和自选股相关的条目标「自选相关」，依据自选股和最近对话的关注。','顶部栏目：资讯首页、快讯、AI 解读、日历、投资必读固定展示；公告、机构调研、互动易、研报默认收起，在「＋」里打开。','点开任意文章不跳页，就地变成三栏阅读：左同栏目标题、中正文、右 AI 解读。深度专题点进去是 AI 解读里的一条专属信息流。','右侧对话区是资讯页的 Copilot，可以随时问。'],
  reader:['右栏 AI 解读按「理解 / 溯源 / 数据 / 市场 / 决策」五层组织；按阅读时间分三档：60 秒（4 项）、3 分钟（8 项）、10 分钟（全部）。','打开文章后模块逐个解锁，顶部显示进度，避免一次堆满；切换档位时已解锁的保留，继续解锁新增的。','按新闻类型推荐角度组合：政策看名词和影响推演，数据看关键数据和脉络，国际联动看因果链和历史参照。','「机会与风险」并置展示，底部固定提示不构成投资建议；「关联方向」只列方向，不推荐具体标的（合规要求）。','与 Lumi 打通：「在对话中问」「继续追问」「问 Lumi 为什么」只把问题填进右侧对话框，由用户决定发送；「让 Lumi 帮我盯」在对话中新建目标；「存入知识库」把正文存成一条知识，之后对话可以引用。','快讯等实时内容没有深度素材时只展示摘要，并如实说明，可让 Lumi 现场解读，不拼凑模块。'],
  flash:['7×24 快讯按时间倒序，重要快讯加粗；可只看重要、按市场筛选、搜索关键词，语音播报为交互稿占位。','右侧「异动解读」把盘中异动和原因放在一起，可直接问 Lumi 为什么涨、还能不能持续。','点快讯进入三栏阅读；快讯对应有完整报道时，可跳到完整报道看解读。'],
  deep:['AI 解读是个人化信息流：按内容类型分「推荐 / 事件 / 数据 / 政策 / 新闻」，推荐是其余四类的混合。','每类内容有独立信息源（资讯栏目、政策来源、数据机构、事件类型），在「管理信息源」勾选；只展示勾选的来源。','一句话生成专属信息流：如「芯片行业重要新闻」，AI 提取关键词后作为一条信息源加入，可随时移除。','推荐流可按最新 / 最热 / 最重要排序，可筛未读和重要；读过的标题变灰。'],
  calendar:['本周七天一条日期条，每天显示事项数；可按经济数据、事件、财报、新股筛选，只看三星，按地区筛。','点任意事项，右侧给出 AI 解读：这是什么、为什么重要、重点看什么。','未公布的事项可「公布时提醒我」，在对话中新建一个定时目标；已公布的数据可跳到相关报道看完整解读。'],
  mustread:['左侧是编辑精选栏目（早盘必读、热点追踪、晚间公告精选、研报精选），中间是栏目内容。','右侧「我的简报」是按用户关注定时生成的 AI 简报，可展开今天这一期。','新建和修改简报都在对话中完成（与目标一致）：说出想看什么、多久一次，Lumi 确认后定时生成。'],
  section:['公告、机构调研、互动易、研报是默认收起的栏目，在顶部「＋」中打开后出现。点开同样进入三栏阅读。']
 };
 function notesHtml(){
  const key=S.reading?'reader':EXTRA.some(([id])=>id===S.tab)?'section':S.tab;
  return `<button type="button" class="kb-notes-toggle" data-act="toggle-notes" aria-expanded="${S.notes}">交互说明</button>${S.notes?`<aside class="kb-notes" aria-label="交互说明"><b>交互说明</b><ul>${(NOTES[key]||[]).map(n=>`<li>${esc(n)}</li>`).join('')}</ul></aside>`:''}`;
 }

 /* ---------- 渲染与事件 ---------- */
 function draw(reset){
  if(!root?.isConnected)return stop();
  const keep={};for(const el of root.querySelectorAll('[data-scroll]'))keep[el.dataset.scroll]=el.scrollTop;
  const focus=document.activeElement?.dataset?.input,tip=root.querySelector('.kb-toast');
  const body=S.reading?reader():S.tab==='home'?home():S.tab==='flash'?flash():S.tab==='deep'?deepList():S.tab==='calendar'?calendar():S.tab==='mustread'?mustread():section(S.tab);
  root.innerHTML=`${nav()}<div class="nw-main" data-scroll="main">${body}</div>${S.srcOpen?sources():''}${notesHtml()}`;if(tip)root.append(tip);
  for(const el of root.querySelectorAll('[data-scroll]'))el.scrollTop=reset&&el.dataset.scroll!=='list'?0:keep[el.dataset.scroll]||0;
  if(focus){const input=root.querySelector(`[data-input="${focus}"]`);if(input){input.focus({preventScroll:true});const n=input.value.length;try{input.setSelectionRange(n,n)}catch{}}}
 }
 /* AI 解读没有选中文章时，默认打开信息流第一条。 */
 function deepList(){const first=feed()[0];if(first){S.reading=first.id;S.read.add(first.id);start();return reader()}return `<div class="nw-reader"><aside class="nw-pane nw-list-pane"><header class="nw-pane-head">${deepHead()}</header><div class="nw-pane-body"><p class="kb-sub nw-empty">没有符合条件的内容。调整信息源或筛选条件试试。</p></div></aside></div>`}
 function stop(){clearInterval(tick);tick=null}
 /* 模块逐个解锁：每 0.35 秒解锁一个，直到当前档位全部展示。 */
 function start(reset=true){
  stop();if(reset)S.shown=0;const a=get(S.reading);if(!a?.ai)return;
  tick=setInterval(()=>{if(!root?.isConnected||S.reading!==a.id)return stop();S.shown++;if(S.shown>=visible(a).length)stop();draw()},350);
 }
 function open(id){S.reading=id;S.read.add(id);S.navOpen=false;start();draw(true);root.querySelector('.nw-doc h1')?.focus({preventScroll:true})}
 const acts={
  tab(el){S.tab=el.dataset.v;S.reading=null;S.navOpen=false;stop();draw(true)},
  'nav-toggle'(){S.navOpen=!S.navOpen;draw()},
  extra(el){const v=el.dataset.v;S.extra=S.extra.includes(v)?S.extra.filter(x=>x!==v):[...S.extra,v];if(!S.extra.includes(S.tab)&&EXTRA.some(([id])=>id===S.tab))S.tab='home';draw()},
  read(el){open(el.dataset.id)},
  close(){S.reading=null;stop();draw(true)},
  depth(el){S.depth=el.dataset.v;start(false);draw()},
  fav(el){const k=S.reading+el.dataset.k;S.fav.has(k)?S.fav.delete(k):S.fav.add(k);toast(S.fav.has(k)?'已收藏这个模块':'已取消收藏');draw()},
  ask(){const a=get(S.reading);openChat(`帮我解读这条资讯：「${a.title}」。它说了什么、为什么重要、对市场和我的自选股有什么影响？`);toast('问题已填入对话框，点击发送即可')},
  follow(el){openChat(el.dataset.q);toast('问题已填入对话框，点击发送即可')},
  watch(){const a=get(S.reading);openChat(`帮我新建一个目标：持续跟踪「${a.title}」的后续，重点盯 ${a.ai.signals.map((s,i)=>`${i+1}. ${s}`).join('；')}。有变化时提醒我。`);toast('在对话中确认要盯什么、多久给一次结果，Lumi 会收进「目标」')},
  save(){const a=get(S.reading);if(S.saved.has(a.id))return toast('这条已经存过了');KnowledgeBasePage.ingest(`${a.title}\n${(a.body||[a.sum]).join('\n')}`,{via:'从资讯存入',title:a.title});S.saved.add(a.id);toast('已存入知识库，之后对话可以引用它');draw()},
  important(el){S.important=el.checked;draw()},
  voice(el){toast(el.checked?'交互稿：开启后新的重要快讯会语音播报':'已关闭语音播报')},
  market(el){S.market=el.dataset.v;draw()},
  kind(el){S.kind=el.dataset.v;S.reading=null;draw(true)},
  sort(el){S.sort=el.dataset.v;draw()},
  filter(el){S.filter=el.dataset.v;draw()},
  'src-open'(){S.srcOpen=true;draw()},
  'src-close'(el,e){if(el.classList.contains('kb-backdrop')&&e.target!==el)return;S.srcOpen=false;draw()},
  sub(el){const k=el.dataset.key;S.subs.has(k)?S.subs.delete(k):S.subs.add(k);draw()},
  'cu-add'(){const v=S.cu.trim();if(!v)return toast('先用一句话描述想看的内容');const kw=v.replace(/(行业|领域|相关)?(的)?(重要|最新|热门)?(新闻|资讯|消息|动态)$/,'')||v;if(S.custom.includes(kw))return toast('已经有这条信息流了');S.custom.push(kw);S.cu='';const n=A.filter(a=>match(a,kw)).length;toast(n?`已生成「${kw}」信息流，匹配 ${n} 条`:`已生成「${kw}」信息流，暂时没有匹配的内容`);draw()},
  'cu-remove'(el){S.custom=S.custom.filter(c=>c!==el.dataset.kw);S.reading=null;draw()},
  topic(el){const kw=el.dataset.kw;if(!S.custom.includes(kw))S.custom.push(kw);S.tab='deep';S.kind='rec';S.reading=A.find(a=>match(a,kw))?.id||null;if(S.reading){S.read.add(S.reading);start()}draw(true);toast(`已打开「${kw}」专题信息流`)},
  day(el){S.day=+el.dataset.v;S.calSel=CAL.find(c=>c.d===S.day)?.id||null;draw()},
  'cal-type'(el){S.calType=el.dataset.v;draw()},
  'cal-imp'(el){S.calImp=el.checked;draw()},
  region(el){S.region=el.value;draw()},
  'cal-sel'(el){S.calSel=el.dataset.id;draw()},
  'cal-open'(el){const c=CAL.find(x=>x.id===el.dataset.id);S.tab='calendar';S.reading=null;S.day=c.d;S.calSel=c.id;draw(true)},
  'cal-ask'(){const c=CAL.find(x=>x.id===S.calSel);openChat(`${c.title}（${DAYS[c.d]} ${c.time}）${c.act?`公布值 ${c.act}，预期 ${c.exp}`:`预期 ${c.exp||'—'}`}。这个数据对市场有什么影响？我需要关注什么？`);toast('问题已填入对话框，点击发送即可')},
  remind(){const c=CAL.find(x=>x.id===S.calSel);openChat(`帮我新建一个目标：${DAYS[c.d]} ${c.time}「${c.title}」公布时提醒我，并告诉我和预期 ${c.exp||''} 的差距、对我的自选股有什么影响。`);toast('在对话中确认后，Lumi 会收进「目标」并按时提醒')},
  col(el){S.col=el.dataset.v;draw()},
  brief(el){S.brief=S.brief===el.dataset.v?null:el.dataset.v;draw()},
  'brief-new'(){openChat('帮我新建一份简报：');toast('在对话中说出想看什么、多久一次，Lumi 会先和你确认')},
  'brief-edit'(el){const b=BRIEFS.find(x=>x.id===el.dataset.v);openChat(`修改我的简报「${b.title}」（${b.when}）：`);toast('在对话中说出要怎么改')},
  'toggle-notes'(){S.notes=!S.notes;draw()}
 };
 function bind(){
  root.onclick=e=>{const el=e.target.closest('[data-act]');if(!el||el.disabled||el.tagName==='INPUT'||el.tagName==='SELECT')return;e.preventDefault();e.stopPropagation();acts[el.dataset.act]?.(el,e)};
  root.onchange=e=>{const el=e.target.closest('input[data-act],select[data-act]');if(el)acts[el.dataset.act]?.(el,e)};
  root.oninput=e=>{const key=e.target.dataset.input;if(!key)return;S[key]=e.target.value;if(key==='q')draw()};
  root.onsubmit=e=>{e.preventDefault();if(e.target.dataset.form==='custom')acts['cu-add']()};
  root.onkeydown=e=>{if(e.key==='Escape'&&(S.srcOpen||S.navOpen)){S.srcOpen=false;S.navOpen=false;draw();return}if((e.key==='Enter'||e.key===' ')&&e.target.matches('tr[data-act]')){e.preventDefault();e.target.click()}};
 }
 function mount(wb){stop();root=document.createElement('section');root.className='kb-page nw-page';root.dataset.morePage='news';root.setAttribute('aria-label','资讯');wb.append(root);bind();if(S.reading&&get(S.reading)?.ai&&S.shown<visible(get(S.reading)).length)start(false);draw();return root}
 return {mount,open:id=>{S.tab='home';if(state.nav!=='资讯')navigate('资讯');open(id)}};
})();
