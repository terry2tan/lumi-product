/* Homepage headline and paginated recommendation cards (方案 2026-10-14). All figures are prototype samples, not live quotes. */
window.HomeRecommendations = (() => {
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const signed = value => (value > 0 ? '+' : '') + value.toFixed(2) + '%';
  const tone = value => value > 0 ? 'rise' : value < 0 ? 'fall' : '';
  const verify = '请先核实来源、交易日期及数据口径，区分已披露事实与推断，不把短时变化直接作为投资结论。';
  const compose = (title, body, question, extra = '') => `${title}：${body}\n${question}${extra ? '\n' + extra : ''}\n${verify}`;
  const market = { hero: '低开高走', title: '芯片股领跌，超4500股下跌', body: '超4500股下跌，创业板跌2.16%、半导体跌近3%，白酒、煤炭逆势上涨。板块强弱分化，关注芯片股能否止跌，以及相关个股的资金表现。', question: '芯片板块领跌，哪些个股跌幅最大？', action: '查看芯片股跌幅排名' };
  const news = {
    mem: { title: '日韩存储股大跌，A股芯片跟跌', source: '同花顺7x24快讯', ts: '2026-10-13T09:25:00+08:00', body: '韩国综指一度跌6%，海力士跌超8%、三星跌超6%，A股存储芯片开盘跟跌。海外波动与产业链业务关联，是排查相关个股影响的关注点。', question: '日韩存储股大跌，哪些A股公司受影响？', action: '分析存储芯片对A股的影响' },
    xhcm: { title: '新华传媒10连板后停牌核查', source: '同花顺7x24快讯', ts: '2026-10-12T19:15:00+08:00', body: '新华传媒10连板累计涨159.51%，今起停牌核查，收购财联社尚未完成。关注核查公告与收购进展，区分已披露事实和市场预期。', question: '新华传媒10连板后停牌，重点核查什么？', action: '梳理新华传媒核查重点' },
    samsung: { title: '三星Q3利润增长，存储贡献居首', source: '财联社', ts: '2026-10-08T08:16:00+08:00', body: '三星Q3营业利润同比增782.5%，存储业务贡献最大，但增速较二季度放缓。关注存储需求变化，以及相关A股公司的业务联系与业绩兑现。', question: '三星业绩影响哪些A股公司？', action: '梳理相关A股公司' },
  };
  const hotTopic = { title: '覆铜板缺货涨价，超声电子业绩预增', body: '覆铜板缺货涨价，超声电子预计2026年前三季度净利润增长90.78%–102.00%。上半年利润降1.17%，关注涨价传导与成本变化。', question: '覆铜板涨价，超声电子及相关A股公司如何受益？', action: '挖掘覆铜板涨价受益股',
    events: ['1、超声电子预计2026年前三季度净利润增长90.78%至102.00%，主要由于覆铜板行业高景气度、产品订单充足、售价上行以及公司产能利用率提高和降本增效措施的实施。', '2、制作印刷电路板的核心材料覆铜板需求旺盛，缺货涨价情况持续，超声电子作为大陆覆铜板龙头厂商有望积极受益。', '3、公司上半年营收增长10.04%、净利润下降1.17%，主要受上游原材料价格波动和汇兑损失影响。', '4、为提升盈利能力，公司将推进产品价格调整、建立长期战略合作关系、加大新材料和新工艺研发投入。'] };
  const topics = [
    { title: '覆铜板高景气，龙头业绩大增', sector: '元件', limitUp: 9, change: 4.74, action: '解读覆铜板龙头业绩', question: '覆铜板高景气、龙头业绩大增，哪些A股公司与这条题材相关，业绩增长来自哪些业务环节？' },
    { title: 'Meta 发布 Muse Wonder 系列旗舰 AI 模型', sector: '人工智能', limitUp: 20, change: 0.48, action: '分析Meta新模型产业影响', question: 'Meta发布Muse Wonder系列旗舰AI模型，对人工智能产业链和相关A股公司有何影响？' },
    { title: '光通信龙头三季度业绩大幅预增', sector: '光模块/CPO', limitUp: 11, change: 3.04, action: '解读光通信龙头业绩预增', question: '光通信龙头三季度业绩大幅预增，哪些光模块/CPO公司与这条线索有关？' },
  ];
  const watchNews = [
    { headline: '尊界V800风波需要一个真相', stock: '江淮汽车', code: '600418', change: 4.72, question: '江淮汽车相关资讯“尊界V800风波需要一个真相”的具体事实与最新进展是什么？请区分事实和争议，并分析对业务、市场预期与股价的可能影响及风险。' },
    { headline: '东方财富：10月9日获融资买入5.43亿元', stock: '东方财富', code: '300059', change: 1.23, question: '东方财富10月9日融资买入5.43亿元，应如何理解？请对比融资偿还、融资余额与成交额，并结合股价表现分析；融资买入不等于融资净买入。' },
  ];
  const funds = { stock: '工商银行', code: '601398', inflow: 2.27, change: 0.36, sector: '银行', sectorChange: -1.01, action: '分析工商银行资金流入', question: '工商银行主力净流入2.27亿元、个股涨0.36%，而银行板块跌1.01%，这种资金与价格表现如何解读？' };
  const hotTalk = { title: '机器人关注升温，零部件业务如何验证', body: '围绕减速器、执行器与整机环节，核实产品验证、客户订单和量产进度。', action: '分析机器人零部件', question: '机器人关注升温，哪些零部件公司的产品验证与订单进度值得核实？' };

  function beijing(date = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(date).map(p => [p.type, p.value]));
    return { ...parts, minutes: Number(parts.hour) * 60 + Number(parts.minute), weekend: ['Sat', 'Sun'].includes(parts.weekday) };
  }
  function relativeTime(ts) {
    const t = beijing(new Date(ts)), now = beijing(), day = x => Date.UTC(+x.year, +x.month - 1, +x.day), diff = Math.round((day(now) - day(t)) / 864e5), hm = `${t.hour}:${t.minute}`;
    return diff === 0 ? `今天 ${hm}` : diff === 1 ? `昨天 ${hm}` : `${+t.month}月${+t.day}日 ${hm}`;
  }
  function headline() {
    const title = make('h1', 'mh-welcome-title');
    if (beijing().weekend) title.append(make('span', 'hr-closed-badge', '已收盘'), `上个交易日大盘${market.hero}，开始复盘吧`);
    else title.textContent = `大盘${market.hero}，哪些变化值得关注？`;
    return title;
  }

  function create({ ask, openDialog, openWatchlist, openMonitor }) {
    const now = beijing(), topicLabel = !now.weekend && now.minutes >= 540 && now.minutes < 570 ? '盘前关注' : '热点题材';
    const link = (label, onClick) => { const b = make('button', 'hr-link', label); b.type = 'button'; b.append(make('span', null, '›')); b.onclick = onClick; return b; };
    const action = (label, question, prompt) => { const b = make('button', 'hr-action'); b.type = 'button'; b.title = question; b.setAttribute('aria-label', `${label}：${question}`); b.append(make('span', 'hr-action-label', label), make('span', 'hr-action-arrow', '→')); b.onclick = () => ask(prompt); return b; };
    function card({ category, byline, links = [], title, body, button, cls = '' }) {
      const article = make('article', `hr-card ${cls}`.trim()), meta = make('div', 'hr-meta');
      meta.append(make('span', 'hr-category', category));
      if (byline) meta.append(make('span', 'hr-byline', byline));
      meta.append(...links);
      const heading = make('h2', 'hr-title', title); heading.title = title;
      article.append(meta, heading);
      if (body) { const p = make('p', 'hr-body', body); p.title = body; article.append(p); }
      if (button) { const foot = make('div', 'hr-foot'); foot.append(button); article.append(foot); }
      return article;
    }
    function original(item) {
      return link('查看原文', () => openDialog(item.title, d => {
        d.append(make('p', 'mh-muted', `${item.source} · ${relativeTime(item.ts)}`), make('p', 'mh-article-body', item.body));
        const b = make('button', 'mh-primary', '让 AI 解读这条资讯'); b.type = 'button'; b.onclick = () => ask(newsPrompt(item)); d.append(b);
      }));
    }
    function drivingEvents(title, events) {
      return link('驱动事件', () => openDialog(title, d => { d.append(make('p', 'mh-muted', '驱动事件 · 用户提供的事件文本，未独立核验')); events.forEach(text => d.append(make('p', 'mh-article-body', text))); }));
    }
    const newsPrompt = item => compose(item.title, item.body, item.question, `来源：${item.source}，${relativeTime(item.ts)}。`);
    const newsCard = (item, category) => card({ category, byline: `${item.source} · ${relativeTime(item.ts)}`, links: [original(item)], title: item.title, body: item.body, button: action(item.action, item.question, newsPrompt(item)) });
    function topicDetail(topic) {
      const body = `${topic.sector}板块涨停${topic.limitUp}家、涨幅${signed(topic.change)}。结合题材驱动与公告核实产业链业务关联。`;
      const events = [`题材驱动线索：${topic.title}`, `板块统计：${topic.sector}，涨停${topic.limitUp}家，涨幅${signed(topic.change)}。`, '标题与统计来自参考图，原文和交易日期尚需核实。'];
      return card({ category: `${topicLabel} · 单题材解读`, links: [drivingEvents(topic.title, events)], title: topic.title, body, button: action(topic.action, topic.question, compose(topic.title, body, topic.question, `驱动事件：\n${events.join('\n')}`)) });
    }
    function watchNewsCard() {
      const article = make('article', 'hr-card hr-table-card'), meta = make('div', 'hr-meta'); meta.append(make('span', 'hr-category', '自选速览'));
      const table = make('table', 'hr-table'); table.setAttribute('aria-label', '新闻、关联个股和涨幅');
      const head = make('tr'); ['新闻', '个股', '涨幅'].forEach(text => { const th = make('th', null, text); th.scope = 'col'; head.append(th); });
      const thead = make('thead'), tbody = make('tbody'); thead.append(head);
      for (const item of watchNews) {
        const row = make('tr'), cell = make('td'), b = make('button', 'hr-table-question', item.headline); b.type = 'button'; b.title = item.question;
        b.onclick = () => ask(compose(item.headline, `${item.stock}（${item.code}）涨幅${signed(item.change)}。`, item.question));
        cell.append(b); row.append(cell, make('td', 'hr-table-stock', item.stock), make('td', tone(item.change), signed(item.change))); tbody.append(row);
      }
      table.append(thead, tbody); article.append(meta, table); return article;
    }
    function fundsCard() {
      const title = `${funds.stock} 主力净流入${funds.inflow.toFixed(2)}亿`, body = `${funds.stock}（${funds.code}）主力净流入${funds.inflow.toFixed(2)}亿元，个股涨跌幅${signed(funds.change)}，${funds.sector}板块涨跌幅${signed(funds.sectorChange)}。`;
      const article = card({ category: '资金异动', title, button: action(funds.action, funds.question, compose(title, body, funds.question, '主力资金统计口径与交易日期需核实，不把资金流入直接等同于后续上涨。')), cls: 'hr-funds-card' });
      article.querySelector('.hr-title').append(make('span', `hr-funds-change ${tone(funds.change)}`, signed(funds.change)));
      const sector = make('div', 'hr-sector-tag'); sector.append(make('span', null, funds.sector), make('span', tone(funds.sectorChange), signed(funds.sectorChange)));
      article.querySelector('.hr-title').after(sector); return article;
    }
    const watchTitle = '金融科技大涨，同花顺没跟上', watchBody = '同花顺涨3.21%，金融科技涨5.60%，落后2.39个百分点。同板块东方财富涨8.20%、指南针涨7.50%。', watchQuestion = '同花顺落后金融科技，与东方财富差在哪？';
    const pages = [
      [
        newsCard(news.mem, '重点事件'),
        card({ category: topicLabel, links: [drivingEvents(hotTopic.title, hotTopic.events)], title: hotTopic.title, body: hotTopic.body, button: action(hotTopic.action, hotTopic.question, compose(hotTopic.title, hotTopic.body, hotTopic.question, `驱动事件：\n${hotTopic.events.join('\n')}`)) }),
        card({ category: '行情解读', links: [link('AI盯盘', openMonitor)], title: market.title, body: market.body, button: action(market.action, market.question, compose(market.title, market.body, market.question)) }),
        card({ category: '自选动态', links: [link('查看自选', openWatchlist)], title: watchTitle, body: watchBody, button: action('对比同花顺与东方财富', watchQuestion, compose(watchTitle, watchBody, watchQuestion, '请结合业务构成、资金与公告比较，不把涨幅差距当成必然补涨的证据。')) }),
      ],
      [topicDetail(topics[0]), watchNewsCard(), fundsCard(), newsCard(news.xhcm, '新闻头条'), topicDetail(topics[1]), topicDetail(topics[2])],
      [newsCard(news.samsung, '新闻头条'), card({ category: '热门话题', title: hotTalk.title, body: hotTalk.body, button: action(hotTalk.action, hotTalk.question, compose(hotTalk.title, hotTalk.body, hotTalk.question)) })],
    ];

    const section = make('section', 'hr-section'); section.setAttribute('aria-label', '为你推荐');
    const pager = make('nav', 'hr-pager'); pager.setAttribute('aria-label', '推荐线索翻页');
    const prev = make('button', 'hr-page-nav', '‹'), count = make('span', 'hr-page-count'), next = make('button', 'hr-page-nav', '›');
    prev.type = next.type = 'button'; prev.setAttribute('aria-label', '上一组推荐'); next.setAttribute('aria-label', '下一组推荐'); count.setAttribute('aria-live', 'polite');
    pager.append(prev, count, next);
    const grid = make('div', 'hr-grid');
    let page = 0;
    function show(index) {
      page = Math.min(Math.max(0, index), pages.length - 1);
      grid.dataset.columns = pages[page].length > 4 ? '3' : '2';
      grid.replaceChildren(...pages[page]);
      count.textContent = `${page + 1}/${pages.length}`; prev.disabled = page === 0; next.disabled = page === pages.length - 1;
    }
    prev.onclick = () => show(page - 1); next.onclick = () => show(page + 1);
    section.append(pager, grid); show(0);
    return { headline: headline(), section };
  }
  return { create };
})();
