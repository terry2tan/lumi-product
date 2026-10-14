/* Lumi identity and profile view shared by home and Copilot. */
window.LumiProfile=(()=>{
  const identity={name:'Lumi',avatar:'assets/lumi-pink.png'};
  /* 目标与「目标」页共用 ProactiveStore，勾选完成即同步。 */
  let view=null;
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
  const pencil=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15z"/></svg>';
  function button(label,cls,action){const el=make('button',cls);el.type='button';el.setAttribute('aria-label',label);el.title=label;el.onclick=action;return el}
  function activity(){const latest=ChatStore.get('lumi').messages.findLast(message=>message.role==='assistant'&&!message.regenerating),today=ChatStore.clock();return latest?`最近活跃：${latest.day===today.day?'今天':latest.day} ${latest.time}`:'最近活跃：刚刚'}
  function updateIdentity(){
    for(const img of document.querySelectorAll('[data-lumi-avatar],.lumi-entry>img,.copilot-lumi-switch>img')){img.src=identity.avatar;img.alt=identity.name}
    for(const title of document.querySelectorAll('[data-lumi-profile-name]')){title.textContent=identity.name;title.title=identity.name}
    window.dispatchEvent(new CustomEvent('lumi:profile-changed'));
  }
  function section(title){const root=make('section','lumi-profile-section'),heading=make('header','lumi-profile-section-heading');heading.append(make('h3',null,title));root.append(heading);return root}
  function render(){
    if(view)return view;
    view=make('section','lumi-profile-view');view.dataset.profileId='lumi';
    const inner=make('div','lumi-profile-inner'),header=make('header','lumi-profile-header');
    const avatarArea=make('div','lumi-profile-avatar-area');
    const avatar=button('编辑 Lumi 头像','lumi-profile-avatar',()=>{picker.hidden=!picker.hidden;avatar.setAttribute('aria-expanded',String(!picker.hidden));if(!picker.hidden)picker.querySelector('button').focus({preventScroll:true})});
    avatar.setAttribute('aria-expanded','false');avatar.setAttribute('aria-controls','lumi-avatar-picker');
    const image=make('img');image.dataset.lumiAvatar='';image.src=identity.avatar;image.alt=identity.name;
    const edit=make('span','lumi-profile-avatar-edit');edit.innerHTML=pencil();avatar.append(image,edit);
    const picker=make('div','lumi-avatar-picker');picker.id='lumi-avatar-picker';picker.hidden=true;picker.setAttribute('aria-label','选择 Lumi 头像');
    const hidePicker=()=>{picker.hidden=true;avatar.setAttribute('aria-expanded','false')};
    const choices=make('div','lumi-avatar-choices');
    for(const [src,label] of [['assets/lumi-pink.png','粉色 Lumi 头像'],['assets/navigation/lumi.png','蓝色 Lumi 头像']]){
      const choice=button(label,'lumi-avatar-choice',()=>{identity.avatar=src;updateIdentity();hidePicker();avatar.focus({preventScroll:true})}),img=make('img');img.src=src;img.alt='';choice.append(img);choices.append(choice);
    }
    const upload=button('上传本地头像','lumi-profile-upload',()=>input.click());upload.textContent='上传图片';
    const input=make('input');input.type='file';input.accept='image/png,image/jpeg,image/webp,image/gif';input.hidden=true;input.setAttribute('aria-label','头像图片文件');
    const error=make('p','lumi-profile-error');error.setAttribute('role','alert');error.hidden=true;
    input.onchange=async()=>{
      const file=input.files?.[0];input.value='';if(!file)return;
      error.hidden=true;
      if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024){error.textContent='请选择 5MB 以内的 PNG、JPG、WebP 或 GIF 图片。';error.hidden=false;return}
      const url=URL.createObjectURL(file);
      try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas'),size=Math.min(img.naturalWidth,img.naturalHeight);canvas.width=canvas.height=256;canvas.getContext('2d').drawImage(img,(img.naturalWidth-size)/2,(img.naturalHeight-size)/2,size,size,0,0,256,256);identity.avatar=canvas.toDataURL('image/png');updateIdentity();hidePicker();avatar.focus({preventScroll:true})}
      catch{error.textContent='图片无法读取，请换一张。';error.hidden=false}
      finally{URL.revokeObjectURL(url)}
    };
    picker.append(choices,upload,input,error);avatarArea.append(avatar,picker);
    picker.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();hidePicker();avatar.focus({preventScroll:true})}};
    document.addEventListener('pointerdown',event=>{if(view.isConnected&&!avatarArea.contains(event.target))hidePicker()});
    const info=make('div','lumi-profile-info'),nameRow=make('div','lumi-profile-name-row'),name=make('h2');name.dataset.lumiProfileName='';name.textContent=identity.name;name.title=identity.name;
    const nameEdit=button('编辑 Lumi 名称','lumi-profile-name-edit',()=>{nameRow.hidden=true;form.hidden=false;nameInput.value=identity.name;nameError.hidden=true;nameInput.focus({preventScroll:true});nameInput.select()});nameEdit.innerHTML=pencil();nameRow.append(name,nameEdit);
    const form=make('form','lumi-profile-name-form');form.hidden=true;
    const nameInput=make('input','lumi-profile-name-input');nameInput.type='text';nameInput.maxLength=24;nameInput.setAttribute('aria-label','Lumi 名称');nameInput.autocomplete='off';
    const save=make('button','lumi-profile-save','保存');save.type='submit';
    const cancel=button('取消编辑名称','lumi-profile-cancel',()=>{form.hidden=true;nameRow.hidden=false;nameEdit.focus({preventScroll:true})});cancel.textContent='取消';
    const nameError=make('p','lumi-profile-error');nameError.hidden=true;nameError.setAttribute('role','alert');
    form.append(nameInput,save,cancel,nameError);form.onsubmit=e=>{e.preventDefault();const value=nameInput.value.trim();if(!value){nameError.textContent='请输入名称。';nameError.hidden=false;nameInput.focus();return}identity.name=value;updateIdentity();form.hidden=true;nameRow.hidden=false;nameEdit.focus({preventScroll:true})};
    form.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();cancel.click()}};
    const lastActive=make('p','lumi-profile-active',activity());lastActive.dataset.lumiProfileActivity='';info.append(nameRow,form,make('p','lumi-profile-role','你的个人投资助手'),lastActive);header.append(avatarArea,info);inner.append(header);
    const goalCard=section('目标'),goalList=make('ul','lumi-profile-goals lumi-profile-settings-group');
    const fillGoals=()=>{goalList.replaceChildren();for(const goal of ProactiveStore.goals){const done=goal.status==='done',row=make('li','lumi-profile-goal'+(done?' is-complete':''));const label=make('label'),check=make('input');check.type='checkbox';check.checked=done;check.setAttribute('aria-label',`完成目标：${goal.title}`);check.onchange=()=>ProactiveStore.updateGoal(goal.id,{status:check.checked?'done':'active'});const text=make('span','lumi-profile-row-text');text.append(make('strong',null,goal.title),make('span','lumi-profile-description',goal.desc));label.append(text,check);row.append(label);goalList.append(row)}};
    fillGoals();addEventListener('proactive:changed',fillGoals);
    const manage=make('button','lumi-profile-manage-goals','管理目标 ›');manage.type='button';manage.onclick=()=>GoalsPage.open();
    goalCard.querySelector('.lumi-profile-section-heading').append(manage);goalCard.append(goalList);inner.append(goalCard);
    const profile=ChatStore.get('lumi').profile,knowledge=section('知识'),facts=make('dl','lumi-profile-facts lumi-profile-settings-group');
    for(const [title,text] of [['投资偏好',`${profile.risk} · ${profile.horizon} · 关注回撤`],['提醒方式',profile.reminders],['持仓信息',profile.holdings.map(holding=>`${holding.name} ${holding.weight}%`).join('、')]]){const row=make('div','lumi-profile-fact');row.append(make('dt',null,title),make('dd',null,text));facts.append(row)}knowledge.append(facts);inner.append(knowledge);
    const monitors=section('盯盘');monitors.append(LumiWatchlist.render());inner.append(monitors);const remote=section('远程使用');remote.append(LumiRemoteUse.render());inner.append(remote);view.append(inner);return view;
  }
  addEventListener('conversation:changed',event=>{if(event.detail.reason!=='stream'&&event.detail.id==='lumi')view?.querySelector('[data-lumi-profile-activity]')?.replaceChildren(document.createTextNode(activity()))});
  return{render,get name(){return identity.name},get avatar(){return identity.avatar}};
})();
