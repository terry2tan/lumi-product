/* First-use introduction, shared by the home conversation and Copilot. */
window.LumiWelcome=(()=>{
  const capabilities=[
    {title:'越聊越懂你',text:'持续记住你的投资偏好、关注标的和研究线索。',path:'M8 4h8M9 2v4m6-4v4M7 4H5v18h14V4h-2M8 11h8M8 16h5'},
    {title:'重要变化，主动提醒',text:'关注标的异动和行业资讯，有值得留意的变化就来提醒。',path:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'},
    {title:'持续跟进你的目标',text:'围绕目标和盯盘任务持续跟进，研究线索和进展留在这里。',path:'M21 12a9 9 0 1 1-9-9M17 7l-5 5m5-9v4h4M16 12a4 4 0 1 1-4-4'}
  ];
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  function mount(parent,{thread,embedded=false}){
    const view=make('section',`conversation-view personal-conversation lumi-welcome${embedded?' chat-panel':''}`);
    view.dataset.threadId=thread.id;view.setAttribute('aria-label','认识你的 Lumi');
    if(embedded&&navigationPages[state.nav]){view.id='page-copilot';view.append(createCopilotToolbar())}
    const scroll=make('div','conversation-log lumi-welcome-scroll'),body=make('div','lumi-welcome-body');
    scroll.setAttribute('aria-label','Lumi 欢迎页');scroll.tabIndex=0;scroll.onscroll=()=>thread.scrollTop=scroll.scrollTop;
    const intro=make('header','lumi-welcome-intro'),avatarControl=make('div','lumi-welcome-avatar'),avatar=make('img');
    avatar.dataset.lumiAvatar='';avatar.src=LumiProfile.avatar;avatar.alt=LumiProfile.name;avatar.draggable=false;
    avatarControl.append(avatar);LumiAvatarMotion.attach(avatarControl,avatar);
    intro.append(avatarControl,make('h1',null,`你好，我是 ${LumiProfile.name}`));
    const cards=make('div','lumi-welcome-capabilities');cards.setAttribute('aria-label','Lumi 能力');
    for(const capability of capabilities){
      const card=make('article','lumi-welcome-capability'),icon=make('span','lumi-welcome-icon');icon.setAttribute('aria-hidden','true');
      icon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${capability.path}"/></svg>`;
      card.append(icon,make('h2',null,capability.title),make('p',null,capability.text));cards.append(card);
    }
    const start=make('button','lumi-welcome-start','立即体验');start.type='button';start.onclick=()=>{start.disabled=true;ChatStore.startLumi()};
    body.append(intro,cards,start);scroll.append(body);view.append(scroll);parent.append(view);return view;
  }
  return{mount};
})();
