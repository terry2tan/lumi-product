/* Screenshot reference data for the compact market footer. */
function marketStatusBar(wb){
 const bar=document.createElement('footer');
 bar.className='market-status-bar';
 bar.setAttribute('aria-label','行情状态栏');
 const indices=[
  ['沪指','3820.71','+8.81','+0.23%','7903.28亿','up'],
  ['深指','12657.14','+36.24','+0.29%','8974.11亿','up'],
  ['创指','3047.27','+10.61','+0.35%','4398.68亿','up'],
  ['科创综指','1731.26','-1.32','-0.08%','2496.38亿','down']
 ];
 bar.innerHTML=`
  <div class="market-status-tools" aria-label="行情工具"></div>
  <div class="market-status-indices" tabindex="0" aria-label="指数行情">
   ${indices.map(([label,value,change,percent,volume,direction])=>`<div class="market-status-index"><span class="market-index-name">${label}</span><span class="market-index-change ${direction}">${value}</span><span class="market-index-change ${direction}">${change}</span><span class="market-index-change ${direction}">${percent}</span><span class="market-index-volume">${volume}</span></div>`).join('')}
  </div>
  <div class="market-status-info"><button class="market-quick-account" type="button">3分钟快速开户</button><button class="market-keyboard-assistant" type="button" aria-label="键盘精灵" title="键盘精灵"><img src="assets/pages/377a9.svg" alt=""></button><span class="market-connection" aria-label="行情已连接"><i></i><i></i><i></i></span><time>14:26:19</time></div>`;
 wb.classList.add('has-market-status');
 wb.append(bar);
 window.FuyaoData?.mountIndices(bar);
 wb.marketToolMenu=new MarketToolsMenu(bar,marketToolsPanel(wb,bar));
}
