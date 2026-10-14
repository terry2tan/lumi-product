window.AccountMenu = () => {
  const icons = {
    sparkle: '<path d="m12 4 2.5 6.5L21 13l-6.5 2.5L12 22l-2.5-6.5L3 13l6.5-2.5Z"/><path d="M4 2v4M2 4h4M20 2v4M18 4h4"/>',
    levels: '<path d="M4 5v14L17 5M15 15a3 3 0 0 1 6 0c0 2-6 4-6 6h6"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20v-2a7 7 0 0 1 14 0v2M16 5a3.5 3.5 0 0 1 0 7M18 15a6 6 0 0 1 4 5"/>',
    ticket: '<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4Z"/><path d="M9 6v2m0 3v2m0 3v2"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    settings: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><circle cx="12" cy="12" r="3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2M12 17h.01"/>',
    update: '<path d="M7 18H6a4 4 0 0 1-1-7.9 7 7 0 0 1 13.8-1.6A4.8 4.8 0 0 1 18 18h-1M12 21V11m-4 4 4-4 4 4"/>',
    rollback: '<path d="M4 8V3m0 5h5M4 8a9 9 0 1 1-1 8"/><path d="M3 12h.01M5 20h.01"/>',
    feedback: '<path d="M20 12V4H4v16h10M7 8h10M7 12h7m1 5 3 3 5-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    switch: '<path d="M3 8h18l-4-4M21 16H3l4 4"/>',
    logout: '<path d="M10 4H4v16h6m5-13 5 5-5 5m-7-5h12"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>'
  };
  const icon = name => `<svg class="account-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const row = ({label, glyph, chevron = false, detail = ''}) => `<button type="button" class="account-menu-button account-menu-row" aria-label="${label}">${icon(glyph)}<span class="account-menu-label">${label}</span>${detail ? `<span class="account-menu-detail">${detail}</span>` : ''}${chevron ? icon('chevron') : ''}</button>`;
  const groups = [
    [{label:'Levels 权限',glyph:'levels',chevron:true},{label:'圈子论坛',glyph:'people',chevron:true},{label:'兑换码',glyph:'ticket',chevron:true}],
    [...(window.NativeBridge?.available?[{label:'Codex 账号与工具',glyph:'settings'}]:[]),{label:'消息中心',glyph:'bell'},{label:'系统设置',glyph:'settings'},{label:'帮助与反馈',glyph:'help'},{label:'检查更新',glyph:'update'},{label:'软件回退',glyph:'rollback'},{label:'反馈',glyph:'feedback'},{label:'重置（测试）',glyph:'rollback'},{label:'关于',glyph:'info',detail:'远航版 15.03.68'}],
    [{label:'切换账号',glyph:'switch'},{label:'退出',glyph:'logout'}]
  ];
  const menu = document.createElement('section');
  menu.className = 'account-popover';
  menu.setAttribute('aria-label','个人中心菜单');
  menu.innerHTML = `<button type="button" class="account-menu-button account-menu-profile" aria-label="账号"><span class="account-menu-avatar" aria-hidden="true"></span><span class="account-menu-identity"><span class="account-menu-username">mo_255161079</span></span><span class="account-menu-level">L2</span></button><button type="button" class="account-menu-button account-menu-quota" aria-label="免费任务次数"><span class="account-menu-quota-icon">${icon('sparkle')}</span><span class="account-menu-label">免费任务次数</span><span class="account-menu-count">8 <small>次</small></span></button>${groups.map(items => `<div class="account-menu-group">${items.map(row).join('')}</div>`).join('')}`;
  return menu;
};
