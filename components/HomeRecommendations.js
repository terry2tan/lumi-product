/* Homepage headline, recommendation cards and market strip (方案 2026-10-15). All figures are prototype samples, not live quotes. */
window.HomeRecommendations = (() => {
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const svg = (paths, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const signed = value => Number.isFinite(value) ? (value > 0 ? '+' : '') + value.toFixed(2) + '%' : '--';
  const tone = value => value > 0 ? 'rise' : value < 0 ? 'fall' : '';
  const verify = '请先核实来源、交易日期及数据口径，区分已披露事实与推断，不把短时变化直接作为投资结论。';
  const compose = (title, body, question, extra = '') => `${title}：${body}\n${question}${extra ? '\n' + extra : ''}\n${verify}`;
  const market = { title: '芯片股领跌，超4500股下跌', body: '超4500股下跌，创业板跌2.16%、半导体跌近3%，白酒、煤炭逆势上涨。板块强弱分化，关注芯片股能否止跌，以及相关个股的资金表现。', question: '芯片板块领跌，哪些个股跌幅最大？', action: '查看芯片股跌幅排名',
    temp: { index: -0.75, up: 809, down: 4575, flat: 177 } };
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
  const hotTalk = { title: '覆铜板高景气，龙头业绩大增', body: '比较覆铜板、PCB等环节的景气传导，核实收入结构、产品价格与成本变化。', action: '解读覆铜板产业链' };
  hotTalk.question = `围绕“${hotTalk.title}”，${hotTalk.body}请说明依据、影响路径、差异和风险。`;
  // Fallback snapshot of the 10jqka hot lists; replaced by the live list when it loads.
  const ranks = {
    plates: { url: 'https://dq.10jqka.com.cn/fuyao/hot_list_data/out/hot_list/v1/plate?type=concept', field: 'plate_list', rows: [['PCB概念', '', -2.86, 8.3], ['短剧游戏', '', 0.35, 8.1], ['冰雪产业', '', -1.35, 7.2]] },
    stocks: { url: 'https://dq.10jqka.com.cn/fuyao/hot_list_data/out/hot_list/v1/stock?stock_type=a&type=day&list_type=normal', field: 'stock_list', rows: [['东百集团', '600693', -10.01, 397.6], ['龙版传媒', '605577', -1.42, 387.5], ['金健米业', '600127', -1.08, 379.9]] },
  };

  function beijing(date = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(date).map(p => [p.type, p.value]));
    return { ...parts, minutes: Number(parts.hour) * 60 + Number(parts.minute), weekend: ['Sat', 'Sun'].includes(parts.weekday) };
  }
  function relativeTime(ts) {
    const t = beijing(new Date(ts)), now = beijing(), day = x => Date.UTC(+x.year, +x.month - 1, +x.day), diff = Math.round((day(now) - day(t)) / 864e5), hm = `${t.hour}:${t.minute}`;
    return diff === 0 ? `今天 ${hm}` : diff === 1 ? `昨天 ${hm}` : `${+t.month}月${+t.day}日 ${hm}`;
  }
  function headline() {
    const box = make('div', 'hr-headline');
    box.append(make('h1', 'mh-welcome-title', '重要变化，我已帮你梳理。接下来想深入哪一条？'), make('p', 'mh-welcome-subtitle', '新闻、题材、盘面与自选的关键线索已整理，点选下方继续分析，也可以直接提问。'));
    return box;
  }

  function recommendations({ ask, openDialog, openWatchlist, openMonitor }) {
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
    const newsPrompt = item => compose(item.title, item.body, item.question, `来源：${item.source}，${relativeTime(item.ts)}。`);
    function original(item) {
      return link('查看原文', () => openDialog(item.title, d => {
        d.append(make('p', 'mh-muted', `${item.source} · ${relativeTime(item.ts)}`), make('p', 'mh-article-body', item.body));
        const b = make('button', 'mh-primary', '让 AI 解读这条资讯'); b.type = 'button'; b.onclick = () => ask(newsPrompt(item)); d.append(b);
      }));
    }
    function drivingEvents(title, events) {
      return link('驱动事件', () => openDialog(title, d => { d.append(make('p', 'mh-muted', '驱动事件 · 用户提供的事件文本，未独立核验')); events.forEach(text => d.append(make('p', 'mh-article-body', text))); }));
    }
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
    const cards = [
      newsCard(news.mem, '重点事件'),
      card({ category: topicLabel, links: [drivingEvents(hotTopic.title, hotTopic.events)], title: hotTopic.title, body: hotTopic.body, button: action(hotTopic.action, hotTopic.question, compose(hotTopic.title, hotTopic.body, hotTopic.question, `驱动事件：\n${hotTopic.events.join('\n')}`)) }),
      card({ category: '行情解读', links: [link('AI盯盘', openMonitor)], title: market.title, body: market.body, button: action(market.action, market.question, compose(market.title, market.body, market.question)) }),
      card({ category: '自选动态', links: [link('查看自选', openWatchlist)], title: watchTitle, body: watchBody, button: action('对比同花顺与东方财富', watchQuestion, compose(watchTitle, watchBody, watchQuestion, '请结合业务构成、资金与公告比较，不把涨幅差距当成必然补涨的证据。')) }),
      topicDetail(topics[0]), watchNewsCard(), fundsCard(), newsCard(news.xhcm, '新闻头条'),
      topicDetail(topics[1]), topicDetail(topics[2]), newsCard(news.samsung, '新闻头条'),
      card({ category: '热门话题', title: hotTalk.title, body: hotTalk.body, button: action(hotTalk.action, hotTalk.question, compose(hotTalk.title, hotTalk.body, hotTalk.question)) }),
    ];
    const pages = []; for (let i = 0; i < cards.length; i += 4) pages.push(cards.slice(i, i + 4));

    const section = make('section', 'hr-section'); section.setAttribute('aria-label', '为你推荐');
    const bar = make('nav', 'hr-pager'); bar.setAttribute('aria-label', '推荐线索切换');
    const grid = make('div', 'hr-grid'); grid.id = 'home-recommendation-grid';
    const refresh = make('button', 'hr-refresh'); refresh.type = 'button'; refresh.setAttribute('aria-label', '换一换，显示下一组推荐'); refresh.setAttribute('aria-controls', grid.id);
    refresh.innerHTML = `${svg('<path d="M20 7v5h-5"/><path d="M20 12a8 8 0 1 1-2.34-5.66L20 8"/>', 'hr-refresh-icon')}<span>换一换</span>`;
    bar.append(refresh);
    let page = 0;
    function show(index) { page = index % pages.length; grid.replaceChildren(...pages[page]); refresh.title = `当前第${page + 1}组，共${pages.length}组；点击切换下一组`; }
    refresh.onclick = () => show(page + 1);
    bar.hidden = pages.length < 2; section.append(bar, grid); show(0);
    return section;
  }

  function marketStrip({ ask, openDialog, openMarket, openMore }) {
    const section = make('section', 'hr-markets'); section.setAttribute('aria-label', '行情概览');
    function panel(title, icon, linkLabel, onLink, cls = '') {
      const article = make('article', `hr-market-card ${cls}`.trim()), header = make('header'), h2 = make('h2');
      h2.innerHTML = svg(icon); h2.append(title);
      const link = make('button', 'hr-market-link', `${linkLabel} ›`); link.type = 'button'; link.onclick = onLink;
      header.append(h2, link); article.append(header); return article;
    }
    const t = market.temp, total = t.up + t.down + t.flat, up = (t.up / total * 100).toFixed(2), flat = ((t.up + t.flat) / total * 100).toFixed(2);
    const temp = panel('市场温度', '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 12l3-3 3 3 4-5M9 21h6M12 18v3"/>', '大盘指数', openMarket), breadth = make('div', 'hr-breadth'), ring = make('div', 'hr-ring'), stats = make('div', 'hr-stats');
    ring.style.background = `conic-gradient(var(--hr-rise) 0 ${up}%,#8592a8 ${up}% ${flat}%,var(--hr-fall) ${flat}% 100%)`;
    ring.setAttribute('role', 'img'); ring.setAttribute('aria-label', `上涨${t.up}家，下跌${t.down}家，平盘${t.flat}家`);
    for (const [label, value, cls] of [['上证指数', signed(t.index), tone(t.index)], ['上涨', `${t.up.toLocaleString()}家`, 'rise'], ['下跌', `${t.down.toLocaleString()}家`, 'fall'], ['平盘', `${t.flat}家`, '']]) { const row = make('div'); row.append(make('span', null, label), make('span', cls, value)); stats.append(row); }
    breadth.append(ring, stats); temp.append(breadth);
    function rankPanel(key, title, icon, linkLabel) {
      const article = panel(title, icon, linkLabel, openMarket), head = make('div', 'hr-rank-head'), list = make('div', 'hr-rank-list');
      ['名称', '涨跌幅', '热度'].forEach(text => head.append(make('span', null, text)));
      const render = rows => list.replaceChildren(...rows.map(([name, code, change, heat]) => {
        const b = make('button', 'hr-rank-row'); b.type = 'button'; b.setAttribute('aria-label', `分析${name}`); b.title = code ? `${name} ${code}` : name;
        b.append(make('span', 'hr-rank-name', name), make('span', tone(change), signed(change)), make('span', 'hr-rank-heat', Number.isFinite(heat) ? `${heat.toFixed(1)}万` : '--'));
        b.onclick = () => ask(`分析${name}${code ? `（${code}）` : ''}的近期表现、关注原因与主要风险`); return b;
      }));
      render(ranks[key].rows); article.append(head, list);
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
      fetch(ranks[key].url, { signal: controller.signal, cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(payload => {
        const items = payload?.status_code === 0 && Array.isArray(payload.data?.[ranks[key].field]) ? payload.data[ranks[key].field] : [];
        const rows = items.filter(x => x && typeof x.name === 'string').sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999)).slice(0, 3)
          .map(x => [x.name, x.code == null ? '' : String(x.code), x.rise_and_fall == null || x.rise_and_fall === '' ? null : Number(x.rise_and_fall), x.rate == null || x.rate === '' ? null : Number(x.rate) / 10000]);
        if (rows.length && list.isConnected) render(rows);
      }).catch(() => {}).finally(() => clearTimeout(timer));
      return article;
    }
    const game = panel('游戏娱乐', '<path d="m12 3 3 7 6 3-6 2-3 6-3-6-6-2 6-3Z"/>', '更多功能', openMore, 'hr-game-card'), preview = make('div', 'hr-game-preview'), copy = make('span', 'hr-game-copy', '飞机大战');
    preview.innerHTML = '<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M29 4h6l4 23 19 13v7l-20-6-2 12 8 6v3l-12-3-12 3v-3l8-6-2-12-20 6v-7l19-13Z"/></svg>';
    copy.append(make('small', null, '看盘累了？来一把飞机大战！')); preview.append(copy);
    const start = make('button', 'hr-game-start', '开始游戏 →'); start.type = 'button'; start.onclick = () => planeGame(openDialog); game.append(preview, start);
    section.append(temp,
      rankPanel('plates', '热门板块', '<circle cx="12" cy="12" r="9"/><path d="M12 3v9h9"/>', '全部板块'),
      rankPanel('stocks', '热门A股', '<path d="M6 3v18M12 3v18M18 3v18"/><rect x="4" y="7" width="4" height="6" rx="1"/><rect x="10" y="12" width="4" height="5" rx="1"/><rect x="16" y="5" width="4" height="6" rx="1"/>', '全部A股'),
      game);
    return section;
  }

  function planeGame(openDialog) {
    openDialog('飞机大战', d => {
      const c = make('canvas', 'hr-plane-canvas'), score = make('p', 'mh-muted', '得分：0'), again = make('button', 'mh-primary', '重新开始');
      c.width = c.height = 360; c.tabIndex = 0; c.setAttribute('aria-label', '飞机大战游戏区域'); again.type = 'button'; again.onclick = () => planeGame(openDialog);
      d.append(make('p', 'mh-muted', '方向键移动，自动射击。飞机大战，与真实交易无关。'), c, score, again);
      const ctx = c.getContext('2d'), keys = {}; let x = 180, y = 320, points = 0, frame = 0, shots = [], foes = [], over = false;
      c.onkeydown = e => { if (e.key.startsWith('Arrow')) { e.preventDefault(); keys[e.key] = true; } }; c.onkeyup = e => keys[e.key] = false;
      c.onpointermove = e => { const r = c.getBoundingClientRect(); x = (e.clientX - r.left) * 360 / r.width; y = (e.clientY - r.top) * 360 / r.height; };
      function tick() {
        if (!c.isConnected || over) return; frame++;
        x = Math.max(12, Math.min(348, x + (keys.ArrowRight ? 4 : 0) - (keys.ArrowLeft ? 4 : 0))); y = Math.max(20, Math.min(340, y + (keys.ArrowDown ? 4 : 0) - (keys.ArrowUp ? 4 : 0)));
        if (frame % 12 === 0) shots.push({ x, y: y - 15 }); if (frame % 40 === 0) foes.push({ x: 16 + Math.random() * 328, y: -10 });
        ctx.clearRect(0, 0, 360, 360); ctx.fillStyle = '#768bea'; ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x - 12, y + 12); ctx.lineTo(x, y + 6); ctx.lineTo(x + 12, y + 12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#88caff'; shots.forEach(s => { s.y -= 6; ctx.fillRect(s.x - 2, s.y, 4, 10); });
        ctx.fillStyle = '#ed7581'; foes.forEach(f => { f.y += 2; ctx.fillRect(f.x - 10, f.y - 10, 20, 20); const hit = shots.find(s => Math.abs(s.x - f.x) < 13 && Math.abs(s.y - f.y) < 14); if (hit) { f.y = 400; hit.y = -20; points += 10; } if (Math.abs(f.x - x) < 20 && Math.abs(f.y - y) < 22) over = true; });
        shots = shots.filter(s => s.y > 0); foes = foes.filter(f => f.y < 380);
        score.textContent = `得分：${points}${over ? ' · 游戏结束，点击重新开始' : ''}`; requestAnimationFrame(tick);
      }
      requestAnimationFrame(() => { c.focus(); tick(); });
    });
  }

  return { headline, recommendations, marketStrip };
})();
