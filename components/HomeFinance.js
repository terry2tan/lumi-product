/* Adapters for the OPC reference components. Data and actions stay local to this demo. */
window.HomeFinance = (() => {
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const quoteTone = value => value < 0 ? 'text-fall-3' : value > 0 ? 'text-rise-3' : '';
  const percent = value => Number.isFinite(value)?`${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)}%`:'--';
  function create(id, title) {
    const template = document.createElement('template');
    template.innerHTML = HomeFinanceTemplates[id];
    const root = template.content.firstElementChild.cloneNode(true);
    root.dataset.demo = 'true';
    if (title) root.querySelector('h2').textContent = title;
    if (!root.querySelector('[data-state-slot]')) {
      const state = make('div', 'component-state');
      state.dataset.stateSlot = '';
      state.setAttribute('role', 'status');
      state.hidden = true;
      root.append(state);
    }
    return root;
  }
  function state(root, kind, message) {
    const slot = root.querySelector('[data-state-slot]');
    slot.hidden = !kind;
    slot.dataset.state = kind || '';
    slot.textContent = message || '';
  }
  function action(label, run, capability) {
    const button = make('button', 'market-control', label);
    button.type = 'button';
    button.onclick = run;
    if (capability) button.dataset.clientCapability = capability;
    return button;
  }
  function tabs(labels, selected, run, name) {
    const list = make('div', 'market-toolbar-main');
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', name);
    const activate = (tab, focus) => {
      for (const item of list.children) {
        const active = item === tab;
        item.classList.toggle('is-selected', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      }
      if (focus) tab.focus();
      run(tab.textContent);
    };
    labels.forEach((label, index) => {
      const tab = action(label, () => activate(tab));
      tab.className = 'market-tab' + (label === selected ? ' is-selected' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(label === selected));
      tab.tabIndex = label === selected ? 0 : -1;
      tab.dataset.actionId = `${name}-${index}`;
      tab.onkeydown = event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? labels.length - 1 :
          (index + (event.key === 'ArrowRight' ? 1 : -1) + labels.length) % labels.length;
        activate(list.children[next], true);
      };
      list.append(tab);
    });
    return list;
  }
  function indices(items, open) {
    const root = create('core-index-group', '核心指数');
    const grid = root.querySelector('.cig-grid');
    grid.replaceChildren(...items.map(([name, code, price, change, delta]) => {
      const card = create('index-quote-card');
      card.querySelector('[data-state-slot]').remove();
      card.dataset.actionId = `home-open-index-${code}`;
      card.setAttribute('aria-label', `查看${name}`);
      card.querySelector('.iqc-name').textContent = name;
      card.querySelector('.iqc-point').textContent = price;
      card.querySelector('.iqc-change').className = 'iqc-change ' + quoteTone(change);
      const values = card.querySelectorAll('.iqc-change b');
      values[0].textContent = delta;
      values[1].textContent = percent(change);
      card.querySelector('.iqc-extra').textContent = code;
      card.onclick = () => open({name, code, price, change});
      return card;
    }));
    return root;
  }
  function analysis(items, market, ask) {
    const root = create('ai-summary-analysis', 'AI 市场解读');
    root.dataset.capability = '新闻资讯,实时行情';
    root.querySelector('.ais-summary p').textContent = items[0][1];
    const insights = root.querySelectorAll('.ais-insights article');
    ['新闻驱动', '市场分化', '风险提示'].forEach((title, i) => {
      insights[i].querySelector('h3').textContent = title;
      insights[i].querySelector('p').textContent = i === 2 ?
        '量能与板块表现仍可能变化，结合公告和后续交易观察。AI 生成内容仅供参考，不构成投资建议。' : items[i + 1][1];
    });
    root.querySelector('.ais-evidence').remove();
    const button = root.querySelector('[data-ai-refresh]');
    const loading = root.querySelector('.ais-loading');
    const status = root.querySelector('[data-ai-status]');
    status.textContent = '市场解读';
    const label = root.querySelector('[data-ai-refresh-label]');
    const finish = message => {
      root.classList.remove('is-loading');
      root.setAttribute('aria-busy', 'false');
      loading.setAttribute('aria-hidden', 'true');
      button.disabled = false;
      label.textContent = '分析最新数据';
      status.textContent = message;
    };
    button.onclick = () => {
      loading.style.minHeight = root.querySelector('.ais-content').getBoundingClientRect().height + 'px';
      root.classList.add('is-loading');
      root.setAttribute('aria-busy', 'true');
      loading.setAttribute('aria-hidden', 'false');
      button.disabled = true;
      label.textContent = '分析中…';
      status.textContent = '正在获取最新数据并分析…';
      root.dispatchEvent(new CustomEvent('component:analyze-latest', {bubbles:true, detail:{sources:root.dataset.capability}}));
      // The offline demo prepares a conversation using its available snapshot;
      // it does not claim that live data or a fresh AI result was fetched.
      ask(`请分析${market}市场的最新行情和资讯。当前 Demo 数据截至 10月09日 15:00：${items.map(item => item[0]).join('；')}。`);
      finish('分析问题已填入上方输入框，发送后继续分析');
    };
    root.addEventListener('component:analysis-error', () => finish('最新数据分析失败，请稍后重试'));
    return root;
  }
  function breadth(values, market) {
    const root = create('market-breadth-distribution', market === '全球' ? '全球市场表现' : '市场涨跌分布');
    if (market === '全球') {
      root.querySelector('.mbd-summary').replaceChildren(...values.map(value => make('span', '', value)));
      root.querySelector('.mbd-bar').hidden = true;
      root.querySelector('.mbd-buckets').hidden = true;
      return root;
    }
    const rise = Number(values[0].replaceAll(',', '')), fall = Number(values[1].replaceAll(',', ''));
    const flat = market === 'A股' ? 182 : market === '港股' ? 64 : 96;
    const total = rise + fall + flat;
    const counts = [rise, flat, fall];
    root.querySelectorAll('.mbd-summary strong').forEach((node, i) => node.textContent = counts[i].toLocaleString('en-US'));
    root.querySelectorAll('.mbd-bar i').forEach((node, i) => node.style.setProperty('--share', counts[i] / total * 100));
    root.querySelector('.mbd-bar').setAttribute('aria-label', `上涨 ${rise}，平盘 ${flat}，下跌 ${fall}`);
    const buckets = [Math.round(fall * .02), Math.round(fall * .13), 0, Math.round(rise * .81), Math.round(rise * .17), 0];
    buckets[2] = fall - buckets[0] - buckets[1];
    buckets[5] = rise - buckets[3] - buckets[4];
    root.querySelectorAll('.mbd-buckets > span').forEach((node, i) => {
      node.querySelector('em').textContent = buckets[i].toLocaleString('en-US');
      node.querySelector('i').style.setProperty('--height', Math.max(6, buckets[i] / Math.max(...buckets) * 100) + '%');
      node.querySelector('i').className = i < 3 ? 'is-fall' : 'is-rise';
    });
    const stats = make('div', 'hf-volume');
    stats.append(make('span', '', '成交额'), make('strong', '', values[2]), make('small', '', '较昨日 ' + values[3]));
    root.append(stats);
    return root;
  }
  function table(items, {rank = false, field = '所属行业', open, add}) {
    const root = create('stock-data-table');
    root.dataset.slotId = rank ? 'home-ranking-quotes' : 'home-watchlist-quotes';
    if (rank) root.classList.add('hf-ranking-table');
    const identity = root.querySelector('.sdt-left');
    const middle = root.querySelector('.sdt-middle');
    const operations = root.querySelector('.sdt-right');
    if (rank) identity.querySelector('thead tr').prepend(make('th', '', '排名'));
    middle.querySelector('thead tr').lastElementChild.textContent = field;
    [identity, middle, operations].forEach(node => node.querySelector('tbody').replaceChildren());
    items.forEach((item, index) => {
      const key = `${root.dataset.slotId}-${item.code}`;
      const rows = [identity, middle, operations].map(node => {
        const row = make('tr');
        row.dataset.stockRow = key;
        node.querySelector('tbody').append(row);
        return row;
      });
      if (rank) rows[0].append(make('td', 'hf-rank', String(index + 1).padStart(2, '0')));
      const name = make('td'); name.append(make('b', '', item.name));
      rows[0].append(name, make('td', 'sdt-code', item.code));
      rows[1].append(make('td', quoteTone(item.change), item.price || '—'), make('td', quoteTone(item.change), percent(item.change)),
        make('td', '', field === '成交额' ? (Number.isFinite(item.turnover)?`${item.turnover.toFixed(1)}亿`:'--') : item.tag || '—'));
      const cell = make('td'), actions = make('div', 'component-row-actions');
      const locate = action('打开', () => open(item), '打开 / 定位');
      locate.dataset.actionId = key + '-open';
      locate.setAttribute('aria-label', `查看${item.name}`);
      const watch = action('＋自选', () => add(item), '自选股管理');
      watch.dataset.actionId = key + '-watch';
      watch.setAttribute('aria-label', `加入自选${item.name}`);
      actions.append(locate, watch); cell.append(actions); rows[2].append(cell);
    });
    const setRow = key => root.querySelectorAll('[data-stock-row]').forEach(row => row.classList.toggle('is-hovered', Boolean(key) && row.dataset.stockRow === key));
    root.dataset.tableReady = 'true';
    root.addEventListener('pointerover', event => {const row = event.target.closest('[data-stock-row]'); if (row) setRow(row.dataset.stockRow);});
    root.addEventListener('pointerleave', () => setRow(null));
    if (!items.length) state(root, 'empty', '没有匹配的证券，可清空搜索或添加自选');
    return root;
  }
  function watchlist({query, group, search, switchGroup, batch, manage}) {
    const root = create('watchlist-monitor', '我的自选');
    const input = root.querySelector('input');
    input.placeholder = '搜索名称或代码';
    input.setAttribute('aria-label', '搜索首页自选');
    input.value = query;
    input.oninput = () => {
      root.dispatchEvent(new CustomEvent('component:watchlist-search', {bubbles:true, detail:{query:input.value}}));
      search(input.value);
    };
    input.onkeydown = event => {if (event.key === 'Escape') {input.value = ''; search('');}};
    const batchButton = root.querySelector('[data-action-id="watchlist-batch-add"]');
    batchButton.textContent = '添加';
    batchButton.setAttribute('aria-label', '批量添加自选');
    batchButton.onclick = batch;
    root.querySelector('.widget-titlebar').append(action('管理', manage, '自选股管理'));
    root.querySelector('[role="tablist"]').replaceWith(tabs(['全部', '算力', '高股息'], group, switchGroup, '自选分组'));
    const items = make('div', 'hf-watch-items');
    items.dataset.watchlistItems = '';
    root.querySelector('[data-reuse-component="stock-data-table"]').replaceWith(items);
    return root;
  }
  function watchItems(items, open) {
    const list = make('div', 'hf-watch-list');
    const labels = make('div', 'hf-watch-labels');
    labels.append(make('span', '', '名称 / 代码'), make('span', '', '最新价'), make('span', '', '涨跌幅'));
    list.append(labels);
    for (const item of items) {
      const row = make('button', 'hf-watch-row');
      row.type = 'button';
      row.setAttribute('aria-label', `查看${item.name}`);
      row.onclick = () => open(item);
      const identity = make('span', 'hf-watch-identity');
      identity.append(make('strong', '', item.name), make('small', '', item.code));
      row.append(identity, make('span', quoteTone(item.change), item.price || '—'), make('span', quoteTone(item.change), percent(item.change)));
      list.append(row);
    }
    if (!items.length) list.append(make('p', 'mh-empty', '没有匹配的自选股'));
    return list;
  }
  function news(items, selected, filter, open) {
    const root = create('news-event-stream', '资讯与事件');
    root.querySelector('[role="tablist"]').replaceWith(tabs(['精选', '自选相关', '快讯'], selected, filter, '资讯类型'));
    const list = root.querySelector('.nes-list');
    list.replaceChildren(...items.map(item => {
      const row = make('li'), copy = make('div');
      const title = make('h3'), button = action(item.title, () => open(item));
      button.className = 'hf-news-open';
      button.setAttribute('aria-label', `查看资讯：${item.title}`);
      title.append(button);
      copy.append(make('span', '', item.tag), title, make('p', '', item.body), make('small', '', item.related ? '自选相关' : ''));
      row.append(make('time', '', item.time), copy);
      return row;
    }));
    if (!items.length) state(root, 'empty', '暂无相关资讯，可切换到精选');
    return root;
  }
  function ranking(items, selected, filter, open, add, market) {
    const root = create('stock-ranking-table', '市场排行');
    root.dataset.capability = '代码列表排序 / 排行,实时行情';
    root.classList.add('market-component');
    const header = make('header', 'widget-titlebar');
    header.append(root.querySelector('h2'), make('span', 'market-data-date', market));
    root.prepend(header);
    header.after(tabs(['涨幅榜', '跌幅榜', '成交榜'], selected, filter, '排行类型'));
    root.querySelector('[data-component="stock-data-table"]').replaceWith(table(items, {rank:true, field:'成交额', open, add}));
    return root;
  }
  function heatmap(market, sectors, resolve, open) {
    const root = create('market-heatmap', market === '全球' ? '全球重点资产云图' : `${market}重点个股云图`);
    const groups = root.querySelectorAll('.mhm-sector');
    groups.forEach((group, i) => {
      if (market !== 'A股') {
        const [name, change, names] = sectors[i];
        group.querySelector('h3').textContent = name;
        const grid = group.querySelector('.mhm-sector-grid');
        const example = grid.firstElementChild.cloneNode(true);
        grid.replaceChildren(...names.slice(0, 6).map((name, j, array) => {
          const button = example.cloneNode(true);
          const count = array.length;
          let col, row, w, h;
          if (count === 4) {col = (j % 2) * 3 + 1; row = Math.floor(j / 2) * 3 + 1; w = h = 3;}
          else if (count === 5) {col = j === 0 ? 1 : ((j - 1) % 2) * 3 + 1; row = j === 0 ? 1 : Math.floor((j - 1) / 2) * 2 + 3; w = j === 0 ? 6 : 3; h = 2;}
          else {col = (j % 2) * 3 + 1; row = Math.floor(j / 2) * 2 + 1; w = 3; h = 2;}
          button.style.cssText = `--cell-col:${col};--cell-row:${row};--cell-w:${w};--cell-h:${h}`;
          button.querySelector('b').textContent = name;
          button.querySelector('strong').textContent = percent(j === 2 ? -Math.abs(change * .38) : change);
          button.dataset.actionId = `home-cloud-${market}-${i}-${j}`;
          return button;
        }));
      }
      group.querySelectorAll('.mhm-cell').forEach((button, j) => {
        const name = button.querySelector('b').textContent;
        const change = Number(button.querySelector('strong').textContent.replace('−', '-').replace('%', ''));
        const code = market === 'A股' ? button.dataset.actionId.replace('cloud-open-', '') : '';
        const item = resolve(name, code, change, group.querySelector('h3').textContent);
        button.querySelector('strong').textContent = percent(item.change);
        const level = Math.min(4, Math.max(1, Math.ceil(Math.abs(item.change) / 2)));
        const area = Number(button.style.getPropertyValue('--cell-w')) * Number(button.style.getPropertyValue('--cell-h'));
        const amount = (area * (i === 0 ? 4 : 1) * .6).toFixed(1);
        const size = market === 'A股' ? (button.classList.contains('is-xl') ? 'is-xl ' : button.classList.contains('is-lg') ? 'is-lg ' : '') : area >= 6 ? 'is-lg ' : '';
        button.className = 'mhm-cell ' + size + `is-${item.change < 0 ? 'fall' : 'rise'}-${level}`;
        button.dataset.actionId = `home-cloud-open-${market}-${code || i + '-' + j}`;
        button.dataset.clientCapability = '打开 / 定位';
        button.setAttribute('aria-label', `${name} ${percent(item.change)}，成交额 ${amount}亿`);
        button.title = `${name} ${code}\n涨跌幅 ${percent(item.change)}\n成交额 ${amount}亿`;
        button.onclick = () => open(item);
      });
    });
    return root;
  }
  return {indices, analysis, breadth, watchlist, watchItems, table, news, ranking, heatmap, state, tabs};
})();
