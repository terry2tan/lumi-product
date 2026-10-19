/* Record markup copied from the August demo; conversations are listed by time. */
window.NavigationHistoryTemplate=()=>`          <section class="sidebar-block" data-pinned-chat-section>
            <div class="sidebar-section-head">
              <button class="sidebar-section-toggle" type="button" aria-expanded="true" data-sidebar-section-toggle>
                <span>置顶</span><img src="assets/navigation/下拉.svg" alt="">
              </button>
            </div>
            <div class="history-list" id="sidebar-pinned-list" data-pinned-chat-list>
              <div class="sidebar-chat-row is-pinned" data-pin-origin="sidebar-history-list">
                <button class="history-row" type="button" data-open-chat="今日市场行情分析"><b>今日市场行情分析</b><em>1天</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="取消置顶" title="取消置顶" data-pin-chat><img src="assets/navigation/pin-filled.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
            </div>
          </section>
          <section class="sidebar-block" data-history-chat-section>
            <div class="sidebar-section-head">
              <button class="sidebar-section-toggle" type="button" aria-expanded="true" data-sidebar-section-toggle>
                <span>对话</span><img src="assets/navigation/下拉.svg" alt="">
              </button>
              <div class="sidebar-hover-actions">
                <button type="button" aria-label="更多" title="更多" aria-haspopup="menu" aria-expanded="false" data-sidebar-history-more><img src="assets/navigation/更多.svg" alt=""></button>
                <button type="button" aria-label="新对话" title="新对话" data-new-chat><img src="assets/navigation/新对话.svg" alt=""></button>
              </div>
            </div>
            <div class="history-list" id="sidebar-history-list" data-history-chat-list>
${[['产业链与市场空间','刚刚'],['今日电力板块异动','今天 14:36'],['高股息候选筛选','今天 10:18'],['重点公司财务对比','1天'],['政策与资金面跟踪','1天'],['半导体板块复盘','2天'],['财报指标整理','3天'],['现金流与估值对比','7月26日']].map(([title,time])=>`              <div class="sidebar-chat-row">
                <button class="history-row" type="button" data-open-chat="${title}"><b>${title}</b><em>${time}</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>`).join('\n')}
            </div>
          </section>`;
