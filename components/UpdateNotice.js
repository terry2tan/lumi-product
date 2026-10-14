/* A page-load notice that remains outside navigation and conversation renders. */
(() => {
  if(document.getElementById('global-update-notice'))return;
  const notice=document.createElement('section');
  notice.id='global-update-notice';
  notice.className='update-notice';
  notice.setAttribute('aria-labelledby','global-update-title');
  notice.innerHTML=`
    <div class="update-notice-heading">
      <svg class="update-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>
      <p id="global-update-title">有可用更新</p>
    </div>
    <button type="button" class="update-notice-close" aria-label="关闭更新提醒" title="关闭" data-update-close><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
    <button type="button" class="update-notice-button update-notice-secondary" data-update-later>稍后再说</button>
    <button type="button" class="update-notice-button update-notice-primary" data-update-view>查看更新</button>`;
  const dismiss=()=>{notice.hidden=true};
  notice.querySelector('[data-update-close]').onclick=dismiss;
  notice.querySelector('[data-update-later]').onclick=dismiss;
  notice.querySelector('[data-update-view]').onclick=()=>notice.dispatchEvent(new CustomEvent('app:update-requested',{bubbles:true}));
  document.body.append(notice);
  window.UpdateNotice={show:()=>{notice.hidden=false},hide:dismiss};
})();
