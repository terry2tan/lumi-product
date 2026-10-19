/* Contextual wireframe welcome states for non-market business pages. */
window.CopilotWelcome=(()=>{
  const contexts={
    workbench:{name:'工作台',description:'围绕已保存的产物，继续修改、整理或补充内容。',questions:['帮我整理工作台中的内容','继续完善这份研究报告','把这些产物归纳成一份摘要']},
    feedback:{name:'反馈',description:'整理使用中遇到的问题与改进建议。',questions:['帮我整理这次遇到的问题','把建议梳理成清晰的反馈','还需要补充哪些复现信息']},
    settings:{name:'系统设置',description:'了解偏好设置，整理适合当前使用习惯的配置。',questions:['帮我了解这项设置','整理我的使用偏好','哪些设置与当前问题有关']},
    catalog:{name:'商城',description:'围绕商城里的功能与服务，了解用途、比较差异或整理使用需求。',questions:['帮我了解这项功能适合什么场景','对比这两项服务的区别','按我的使用需求整理选择思路']},
    goals:{name:'目标',description:'说出想让 Lumi 持续帮你做什么。一起补齐要盯的内容、是否定时给结果和推送渠道，确认后自动收进「目标」。',questions:['帮我盯住铂力特的订单与交付，有实质变化再提醒我','每个交易日 08:30 给我自选股的盘前要点','科华数据和太辰光出公告或业绩预告时告诉我']},
    documents:{name:'文件',description:'围绕文件资料，提炼重点、对比内容或整理成后续研究材料。',questions:['帮我提炼这份文件的重点','对比两份资料中的关键差异','把资料整理成一份研究提纲']},
    projects:{name:'知识库',description:'把链接发给我就能存进知识库：视频会转写语音，文章会提取正文，再提炼要点、切成片段。之后问到相关问题，我会自己检索并标出引用。',questions:['https://v.douyin.com/iRk7Ab3/ 帮我存一下','CPO 量产良率的问题，我存过的资料里怎么说','我最近存了哪些关于光模块的内容']},
    news:{name:'资讯',description:'围绕资讯与市场事件，梳理重点、前后进展以及需要观察的影响。',questions:['帮我提炼这条资讯的核心信息','把相关事件按时间顺序整理','这条消息有哪些后续观察点']},
    funds:{name:'基金/ETF',description:'围绕基金与 ETF，了解产品特点、比较持仓结构和跟踪指标。',questions:['帮我了解这只 ETF 的跟踪方向','对比这两只基金的持仓结构','整理需要持续跟踪的产品指标']},
    futures:{name:'期货',description:'围绕期货品种与合约，整理行情变化、供需线索和风险观察点。',questions:['帮我梳理这个品种的供需线索','比较不同合约需要关注的差异','整理本轮波动的风险观察点']},
    backtest:{name:'策略回测',description:'描述你想怎么交易。一起补齐规则，生成策略，在对话里查看回测结果，并自动收进「我的策略」。',questions:['帮我回测一下 600644，低买高卖，近两年','沪深 300 里每月买入市盈率最低的 10 只，等权持有','每月 1 号定投 2000 元沪深300ETF，回测近五年']}
  };
  const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node};
  function mount(parent,{embedded=true,thread=null}={}){
    const route=navigationPages[state.nav],context=contexts[route];if(!context)return;
    const view=make('section',`copilot-welcome${embedded?' chat-panel':''}`);view.id='page-copilot';view.dataset.welcomePage=route;view.setAttribute('aria-label',`${context.name} Copilot 新对话`);
    const toolbar=createCopilotToolbar();toolbar.querySelector('.conversation-heading')?.remove();view.append(toolbar);
    const content=make('div','copilot-welcome-scroll'),body=make('div','copilot-welcome-body');
    const symbol=make('div','wf-box copilot-welcome-symbol');symbol.setAttribute('aria-hidden','true');
    symbol.innerHTML='<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 8h32v32H8zM8 8l32 32M40 8 8 40" stroke="currentColor"/></svg>';
    body.append(symbol,make('h2','copilot-welcome-title',`围绕${context.name}开始对话`));
    const page=make('div','wf-box copilot-welcome-context');page.append(make('span','copilot-welcome-context-label',`当前页面：${context.name}`),make('p',null,context.description));body.append(page);
    const suggestions=make('div','copilot-welcome-suggestions');suggestions.setAttribute('aria-label',`${context.name}示例问题`);
    const draft={kind:'regular',pending:false,get draft(){return thread?.draft??state.draft},set draft(value){state.draft=value;if(thread)thread.draft=value}};
    const composer=ConversationPage.composer(draft,{submitDraft:text=>{if(!text.trim())return false;state.draft=text;send();return true}});
    composer.classList.add('copilot-welcome-composer');const input=composer.querySelector('.conversation-input');input.classList.add('editor');input.placeholder=`围绕${context.name}提问`;
    for(const question of context.questions){
      const button=make('button','wf-box copilot-welcome-question',question);button.type='button';button.onclick=()=>{input.value=question;input.oninput();input.focus({preventScroll:true})};suggestions.append(button);
    }
    body.append(suggestions);content.append(body);view.append(content);
    const bottom=make('div','conversation-bottom copilot-welcome-bottom');bottom.append(composer,make('p','conversation-disclaimer','AI生成内容仅供参考，不构成投资建议'));view.append(bottom);parent.append(view);return view;
  }
  return {mount,supports:route=>Object.hasOwn(contexts,route)};
})();
