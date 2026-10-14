/* The two-level market navigation follows the original market component. */
window.MarketNavigation={categories:['自选','个股','沪深股','港股','美股','英股','环球','扩展','选股','发现','资讯'],secondaryCount:7};
function selectMarketCategory(label){
 NavigationHistory.remember();state.selectedPage=label;state.marketSecondary=null;
 if(state.nav!=='行情'){navigate('行情');return}
 const wb=WorkspaceTabs.marketNode();if(wb)syncMarketPrimaryNavigation(wb);
 sidebarView.syncRailSelection();NavigationHistory.record();NavigationHistory.sync();
}
function syncMarketPrimaryNavigation(wb){
 const category=state.selectedPage,individual=category==='个股',secondary=wb.querySelector('.market-secondary-nav');
 for(const button of wb.querySelectorAll('[data-market-category]')){const selected=button.dataset.marketCategory===category;button.setAttribute('aria-pressed',String(selected));if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')}
 wb.classList.toggle('market-individual-view',individual);secondary.hidden=individual;
 if(secondary.dataset.category!==category){
  secondary.dataset.category=category;secondary.replaceChildren();
  if(!individual)for(let index=0;index<MarketNavigation.secondaryCount;index++){
   const button=document.createElement('button');button.type='button';button.className='market-secondary-placeholder';button.dataset.marketSecondary=index?`section-${index}`:'';
   button.setAttribute('aria-label',`${category}二级导航 ${index+1}`);button.innerHTML='<span class="wf-line" aria-hidden="true"></span>';
   button.onclick=()=>{NavigationHistory.remember();state.marketSecondary=button.dataset.marketSecondary||null;syncMarketPrimaryNavigation(wb);NavigationHistory.record();NavigationHistory.sync()};secondary.append(button);
  }
 }
 for(const button of secondary.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.marketSecondary===(state.marketSecondary||'')));
 const detail=wb.querySelector('.stock-detail-page');if(!detail)return;
 const key=`${category}::${state.marketSecondary||'overview'}`;detail.hidden=!individual;wb.dataset.marketSection=key;if(individual)detail.fuyaoActivate?.();
 if(!individual&&!Array.from(wb.querySelectorAll('[data-market-page]')).some(page=>page.dataset.marketPage===key))MoreFeaturePages.mountMarket(wb,category,{key,section:Number((state.marketSecondary||'').split('-')[1])||0});
 for(const page of wb.querySelectorAll('[data-market-page]'))page.hidden=individual||page.dataset.marketPage!==key;
 sidebarView.syncRailSelection();PanelResize.sync();
}
function market(wb){
 const nav=document.createElement('div');nav.className='market-nav';
 const row=document.createElement('div');row.className='market-primary-row';
 const primary=document.createElement('nav');primary.className='market-primary-nav';primary.setAttribute('aria-label','行情一级导航');
 for(const label of MarketNavigation.categories){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.marketCategory=label;if(label==='扩展')button.insertAdjacentHTML('beforeend','<img src="assets/0eb97.svg" alt="">');button.onclick=()=>selectMarketCategory(label);primary.append(button)}
 const search=document.createElement('label');search.className='market-search';search.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4 4"/></svg>';
 const input=document.createElement('input');input.type='search';input.placeholder='行情/股票';input.setAttribute('aria-label','行情/股票');input.autocomplete='off';search.append(input);row.append(primary,search);
 const secondary=document.createElement('nav');secondary.className='market-secondary-nav';secondary.setAttribute('aria-label','行情二级导航');
 nav.append(row,secondary);wb.append(nav);
 StockDetailPage.mount(wb);marketStatusBar(wb);syncMarketPrimaryNavigation(wb);window.FuyaoData?.bindSearch(input,wb);
}
