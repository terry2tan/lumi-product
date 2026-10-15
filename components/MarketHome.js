/* New-conversation homepage: recommendation cards, market strip and composer. All datasets are local demo snapshots. */
window.MarketHome = (() => {
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const preference = {scroll:0};
  let root, dialog;
  function ask(text) { closeDialog();const input=root.querySelector('.conversation-input');input.value=text;input.oninput();input.closest('.mh-composer').scrollIntoView({block:'nearest'});input.focus({preventScroll:true}); }
  function closeDialog(){if(dialog){dialog.close();dialog.remove();dialog=null}}
  function openDialog(title, build) {
    closeDialog();dialog=make('dialog','mh-dialog');dialog.setAttribute('aria-label',title);const currentDialog=dialog;
    const close=make('button','mh-icon');close.type='button';close.setAttribute('aria-label','关闭详情');close.innerHTML=closeIcon;close.onclick=closeDialog;
    const h=make('header','mh-dialog-head');h.append(make('h2',null,title),close);dialog.append(h);build(dialog);dialog.addEventListener('click',e=>{if(e.target===currentDialog)closeDialog()});dialog.addEventListener('close',()=>{currentDialog.remove();if(dialog===currentDialog)dialog=null});document.body.append(dialog);dialog.showModal();
  }
  function mount(parent){closeDialog();root=make('section','market-home');root.setAttribute('aria-label','新对话首页');
    const hero=make('div','mh-hero'),welcome=make('div','mh-welcome'),logo=make('img','mh-welcome-logo');logo.src='assets/bd5dc.png';logo.alt='';logo.width=64;logo.height=58;welcome.append(logo,HomeRecommendations.headline());
    const recommendations=HomeRecommendations.recommendations({ask,openDialog,openWatchlist:()=>navigate('自选'),openMonitor:openLumi});
    const markets=HomeRecommendations.marketStrip({ask,openDialog,openMarket:()=>navigate('沪深股'),openMore:()=>navigate('商城')});
    const composer=make('div','mh-composer');hero.append(welcome,recommendations,markets,composer,make('p','mh-disclaimer','AI 生成内容仅供参考，不构成投资建议。'));root.append(hero);
    parent.append(root);bindComposer(composer,{home:true,showDisclaimer:false});root.querySelector('.conversation-input').placeholder='输入你想了解的股票、题材或市场问题';
    root.scrollTop=preference.scroll;root.onscroll=()=>preference.scroll=root.scrollTop;
    const mounted=root;const observer=new ResizeObserver(([entry])=>{mounted.classList.toggle('mh-narrow',entry.contentRect.width<980);mounted.classList.toggle('mh-small',entry.contentRect.width<660);mounted.querySelector('.chat-composer')?.refreshComposer?.();if(!mounted.isConnected)observer.disconnect()});observer.observe(root);
    return root;
  }
  function addToWatchlist(items){const existing=AppWatchlist.list(),codes=new Set(existing.map(row=>row.code)),added=items.filter(item=>!codes.has(item.ticker||item.thscode?.split('.')[0])).map(item=>({...item,code:item.ticker||item.thscode.split('.')[0],tag:item.group||item.industry||'股票'}));if(added.length)AppWatchlist.replace([...existing,...added]);return added.length;}
  return {mount,addToWatchlist};
})();
