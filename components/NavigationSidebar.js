/* Record markup copied from the August project demo. */
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
          <section class="sidebar-block project-history">
            <div class="sidebar-section-head">
              <button class="sidebar-section-toggle" type="button" aria-expanded="true" data-sidebar-section-toggle>
                <span data-sidebar-organize-label>知识库</span><img src="assets/navigation/下拉.svg" alt="">
              </button>
              <div class="sidebar-hover-actions">
                <button type="button" aria-label="更多" title="更多" aria-haspopup="menu" aria-expanded="false" data-sidebar-project-more><img src="assets/navigation/更多.svg" alt=""></button>
              </div>
              <div class="sidebar-organize-menu" role="menu" data-sidebar-organize-menu hidden>
                <p>整理</p>
                <button class="is-selected" type="button" role="menuitemradio" aria-checked="true" data-organize-mode="按知识库"><i><img src="assets/navigation/勾.svg" alt=""></i><span>按知识库</span></button>
                <button type="button" role="menuitemradio" aria-checked="false" data-organize-mode="在一个列表中"><i><img src="assets/navigation/勾.svg" alt=""></i><span>在一个列表中</span></button>
                <p>排序方式</p>
                <button type="button" role="menuitemradio" aria-checked="false" data-sort-mode="最近更新"><i><img src="assets/navigation/勾.svg" alt=""></i><span>最近更新</span></button>
                <button class="is-selected" type="button" role="menuitemradio" aria-checked="true" data-sort-mode="手动排序"><i><img src="assets/navigation/勾.svg" alt=""></i><span>手动排序</span></button>
              </div>
            </div>
            <div class="history-list flat-conversation-list" data-flat-conversation-list hidden></div>
            <div class="project-row">
              <button class="project-group is-expanded" type="button" data-toggle-project data-project-name="CPO行业研究" aria-expanded="true" aria-controls="sidebar-project-cpo">
                <span><i aria-hidden="true"></i><img src="assets/navigation/项目-打开.svg" alt=""><b>CPO行业研究</b></span>
              </button>
              <div class="sidebar-hover-actions">
                <button type="button" aria-label="更多" title="更多" data-project-more data-project-name="CPO行业研究"><img src="assets/navigation/更多.svg" alt=""></button>
                <button type="button" aria-label="新对话" title="新对话" data-sidebar-new-project-chat data-project-name="CPO行业研究"><img src="assets/navigation/新对话.svg" alt=""></button>
              </div>
            </div>
            <div class="project-chat-list" id="sidebar-project-cpo">
              <div class="sidebar-chat-row">
                <button class="sidebar-chat-main" type="button" data-open-chat="产业链与市场空间" data-project-name="CPO行业研究"><b>产业链与市场空间</b><em>刚刚</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
              <div class="sidebar-chat-row">
                <button class="sidebar-chat-main" type="button" data-open-chat="重点公司财务对比" data-project-name="CPO行业研究"><b>重点公司财务对比</b><em>1天</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
            </div>
            <div class="project-row">
              <button class="project-group is-expanded" type="button" data-toggle-project data-project-name="电力短线分析" aria-expanded="true" aria-controls="sidebar-project-power"><span><i aria-hidden="true"></i><img src="assets/navigation/项目-打开.svg" alt=""><b>电力短线分析</b></span></button>
              <div class="sidebar-hover-actions">
                <button type="button" aria-label="更多" title="更多" data-project-more data-project-name="电力短线分析"><img src="assets/navigation/更多.svg" alt=""></button>
                <button type="button" aria-label="新对话" title="新对话" data-sidebar-new-project-chat data-project-name="电力短线分析"><img src="assets/navigation/新对话.svg" alt=""></button>
              </div>
            </div>
            <div class="project-chat-list" id="sidebar-project-power">
              <div class="sidebar-chat-row">
                <button class="sidebar-chat-main" type="button" data-open-chat="今日电力板块异动" data-project-name="电力短线分析"><b>今日电力板块异动</b><em>今天 14:36</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
              <div class="sidebar-chat-row">
                <button class="sidebar-chat-main" type="button" data-open-chat="政策与资金面跟踪" data-project-name="电力短线分析"><b>政策与资金面跟踪</b><em>昨天 18:12</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
            </div>
            <div class="project-row">
              <button class="project-group is-expanded" type="button" data-toggle-project data-project-name="价值股分析" aria-expanded="true" aria-controls="sidebar-project-value"><span><i aria-hidden="true"></i><img src="assets/navigation/项目-打开.svg" alt=""><b>价值股分析</b></span></button>
              <div class="sidebar-hover-actions">
                <button type="button" aria-label="更多" title="更多" data-project-more data-project-name="价值股分析"><img src="assets/navigation/更多.svg" alt=""></button>
                <button type="button" aria-label="新对话" title="新对话" data-sidebar-new-project-chat data-project-name="价值股分析"><img src="assets/navigation/新对话.svg" alt=""></button>
              </div>
            </div>
            <div class="project-chat-list" id="sidebar-project-value">
              <div class="sidebar-chat-row">
                <button class="sidebar-chat-main" type="button" data-open-chat="高股息候选筛选" data-project-name="价值股分析"><b>高股息候选筛选</b><em>今天 10:18</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
              <div class="sidebar-chat-row">
                <button class="sidebar-chat-main" type="button" data-open-chat="现金流与估值对比" data-project-name="价值股分析"><b>现金流与估值对比</b><em>7月26日</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
            </div>
            <button class="sidebar-project-show-more" type="button" data-sidebar-project-show-more hidden>显示更多</button>
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
              <div class="sidebar-chat-row">
                <button class="history-row" type="button" data-open-chat="半导体板块复盘"><b>半导体板块复盘</b><em>2天</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
              <div class="sidebar-chat-row">
                <button class="history-row" type="button" data-open-chat="财报指标整理"><b>财报指标整理</b><em>3天</em></button>
                <div class="sidebar-hover-actions">
                  <button type="button" aria-label="置顶" title="置顶" data-pin-chat><img src="assets/navigation/pin-outline.svg" alt=""></button>
                  <button class="is-danger" type="button" aria-label="删除" title="删除" data-delete-chat><img src="assets/navigation/删除.svg" alt=""></button>
                </div>
              </div>
            </div>
          </section>`;
