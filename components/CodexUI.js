/* App-owned account, workspace, tool activity and approval controls. */
window.CodexUI=(()=>{
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const button=(text,action,cls='')=>{const b=node('button','codex-button '+cls,text);b.type='button';b.onclick=action;return b};
  let configuration=null,settings=null,approval=null,activeRequest=null,loginId=null,refreshing=null;
  const requests=new Map(),activities=new Map();
  function note(root,text,error=false){const n=root.querySelector('.codex-note')||node('p','codex-note');n.textContent=text;n.classList.toggle('is-error',error);if(!n.isConnected)root.append(n)}
  async function run(root,action){try{return await action()}catch(error){note(root,error.message,true)}}
  function dialog(title){
    const d=node('dialog','codex-dialog'),head=node('header','codex-dialog-header'),h=node('h2',null,title),close=button('关闭',()=>d.close());
    head.append(h,close);d.append(head);d.setAttribute('aria-label',title);document.body.append(d);d.showModal();d.addEventListener('close',()=>d.remove(),{once:true});return d;
  }
  async function refresh(){
    if(!NativeBridge.available)return null;
    if(refreshing)return refreshing;
    refreshing=NativeBridge.call('configuration').then(value=>{
      if(value?.provider!=='codex'||!value.account||!Array.isArray(value.models))throw new Error('应用仍在运行旧版对话引擎，请退出并重新打开同花顺AI。');
      if(!value.models.length)throw new Error('Codex 暂未返回可用模型，请检查连接后重试。');
      configuration=value;ChatModels.configure(value);window.dispatchEvent(new CustomEvent('codex:configuration',{detail:value}));return value;
    }).catch(error=>{ChatModels.fail(error.message);throw error}).finally(()=>refreshing=null);
    return refreshing;
  }
  function field(root,label,placeholder='',type='text'){
    const wrap=node('label','codex-field'),input=node('input');input.type=type;input.placeholder=placeholder;wrap.append(node('span',null,label),input);root.append(wrap);return input;
  }
  async function renderSettings(){
    const d=settings;if(!d?.isConnected)return;
    d.querySelector('.codex-settings-body')?.remove();const body=node('div','codex-settings-body');d.append(body);
    note(body,'正在连接 Codex…');
    try{
      const config=await refresh();if(!body.isConnected)return;body.replaceChildren();
      const account=node('section','codex-section');account.append(node('h3',null,'ChatGPT 账号'));
      const identity=config.loggedIn?(config.account.email||'已登录 ChatGPT'):'尚未登录';account.append(node('p','codex-account',identity));
      if(config.account.chatgptPlanType||config.account.planType)account.append(node('p','codex-secondary',config.account.chatgptPlanType||config.account.planType));
      const actions=node('div','codex-actions');
      actions.append(button(config.loggedIn?'切换 ChatGPT 账号':'使用 ChatGPT 登录',()=>run(body,async()=>{
        const value=await NativeBridge.call('codexLogin');loginId=value.loginId;note(body,'请在浏览器完成登录，完成后会自动更新。');
      }),'is-primary'));
      if(config.loggedIn)actions.append(button('退出账号',()=>run(body,async()=>{await NativeBridge.call('codexLogout');await renderSettings()})));
      if(loginId)actions.append(button('取消登录',()=>run(body,async()=>{await NativeBridge.call('codexCancelLogin',{loginId});loginId=null;await renderSettings()})));
      account.append(actions);body.append(account);
      const workspace=node('section','codex-section');workspace.append(node('h3',null,'工作目录'),node('p','codex-path',config.workspace));
      workspace.append(button('选择文件夹',()=>run(body,async()=>{const value=await NativeBridge.call('chooseWorkspace');if(value){await renderSettings();window.dispatchEvent(new Event('codex:files-changed'))}})));body.append(workspace);
      const tools=node('section','codex-section');tools.append(node('h3',null,'MCP 工具'));body.append(tools);
      const list=node('div','codex-mcp-list');tools.append(list);note(list,'正在读取工具…');
      const rows=await NativeBridge.call('mcpStatus');if(!body.isConnected)return;list.replaceChildren();
      if(!rows.length)list.append(node('p','codex-secondary','尚未添加 MCP 服务'));
      for(const row of rows){
        const entry=node('div','codex-mcp-row'),info=node('div');info.append(node('strong',null,row.name),node('p','codex-secondary',`${Object.keys(row.tools||{}).length} 个工具 · ${row.authStatus==='loggedIn'?'已登录':row.authStatus==='notLoggedIn'?'需要授权':'已配置'}`));
        const actions=node('div','codex-actions');
        if(row.authStatus==='notLoggedIn')actions.append(button('授权',()=>run(body,async()=>{await NativeBridge.call('mcpLogin',{name:row.name});note(body,'已打开工具授权，请完成后刷新。')})));
        actions.append(button('移除',()=>run(body,async()=>{await NativeBridge.call('mcpConfigure',{name:row.name,remove:true});await renderSettings()})));
        entry.append(info,actions);list.append(entry);
      }
      const form=node('form','codex-mcp-form'),name=field(form,'服务名称','例如：research'),transport=node('select');
      transport.setAttribute('aria-label','MCP 连接方式');for(const [value,text] of [['http','远程服务'],['stdio','本地程序']]){const o=node('option',null,text);o.value=value;transport.append(o)}form.append(transport);
      const url=field(form,'服务地址','https://example.com/mcp'),command=field(form,'启动程序','例如：/opt/homebrew/bin/npx'),args=field(form,'参数列表','["-y", "package-name"]');
      command.closest('label').hidden=args.closest('label').hidden=true;transport.onchange=()=>{url.closest('label').hidden=transport.value!=='http';command.closest('label').hidden=args.closest('label').hidden=transport.value!=='stdio'};
      const add=button('添加服务',null,'is-primary');add.type='submit';form.append(add);
      form.onsubmit=event=>{event.preventDefault();run(body,async()=>{add.disabled=true;try{let payload={name:name.value.trim()};if(transport.value==='http')payload.url=url.value.trim();else{const parsed=JSON.parse(args.value||'[]');if(!Array.isArray(parsed)||parsed.some(v=>typeof v!=='string'))throw new Error('参数需为字符串数组。');payload={...payload,command:command.value.trim(),args:parsed}}await NativeBridge.call('mcpConfigure',payload);await renderSettings()}finally{add.disabled=false}})};
      tools.append(form);const footer=node('div','codex-actions');footer.append(button('刷新工具',()=>renderSettings()),button('打开详细配置',()=>run(body,()=>NativeBridge.call('openCodexConfiguration'))));tools.append(footer);
    }catch(error){note(body,error.message,true);body.append(button('重新连接',()=>renderSettings()))}
  }
  function openSettings(){if(!NativeBridge.available)return;if(settings?.isConnected){settings.focus();return}settings=dialog('Codex 账号与工具');settings.classList.add('codex-settings');renderSettings()}
  function resolveRequest(request,payload){return run(approval,async()=>{await NativeBridge.call('answerRequest',{requestId:request.requestId,...payload})})}
  function showRequest(){
    if(approval?.isConnected||!requests.size)return;
    const request=requests.values().next().value,params=request.params||{},method=request.method;
    activeRequest=request.requestId;approval=dialog(method.includes('requestUserInput')?'需要你的回答':method.includes('elicitation')?'工具请求':'允许此操作？');
    approval.classList.add('codex-approval');const d=approval,thread=ChatStore.get(request.threadId);d.append(node('p','codex-secondary',thread?.title||'当前任务'));
    if(params.reason||params.message)d.append(node('p',null,params.reason||params.message));
    if(params.cwd)d.append(node('p','codex-path',params.cwd));
    if(params.command)d.append(node('pre','codex-operation',params.command));
    if(params.networkApprovalContext)d.append(node('p',null,'网络访问：'+(params.networkApprovalContext.host||'')+' '+(params.networkApprovalContext.protocol||'')));
    if(params.additionalPermissions||params.permissions)d.append(node('pre','codex-operation',JSON.stringify(params.additionalPermissions||params.permissions,null,2)));
    if(params.item?.changes)for(const change of params.item.changes){d.append(node('strong',null,change.path),node('pre','codex-operation',change.diff||change.kind?.type||'文件变更'))}
    let submitPayload=()=>({accept:true}),valid=()=>true;
    if(method==='item/tool/requestUserInput'){
      const answers=[];
      for(const question of params.questions||[]){const group=node('div','codex-question');group.append(node('p',null,question.question));let select=null;
        if(question.options?.length){select=node('select');select.setAttribute('aria-label',question.question);select.append(node('option',null,'选择回答'));select.firstChild.value='';for(const option of question.options){const o=node('option',null,option.label);o.value=option.label;select.append(o)}group.append(select)}
        const input=field(group,select?'补充回答':'回答','',question.isSecret?'password':'text');answers.push({question,select,input});d.append(group);
      }
      valid=()=>answers.every(a=>a.input.value.trim()||a.select?.value);
      submitPayload=()=>({answers:Object.fromEntries(answers.map(a=>[a.question.id,{answers:[a.input.value.trim()||a.select?.value||'']}]))});
    }else if(method==='mcpServer/elicitation/request'){
      if(params.mode==='url'){d.append(node('p','codex-path',params.url));const a=node('a','codex-button','打开授权页面');a.href=params.url;a.target='_blank';a.rel='noopener noreferrer';d.append(a)}
      else{
        const values=[],schema=params.requestedSchema||{};
        for(const [key,property] of Object.entries(schema.properties||{})){
          const input=field(d,property.title||key,property.description||'',property.type==='boolean'?'checkbox':property.type==='number'||property.type==='integer'?'number':'text');
          input.required=(schema.required||[]).includes(key);if(property.enum){input.setAttribute('list','codex-enum-'+key);const choices=node('datalist');choices.id='codex-enum-'+key;for(const value of property.enum){const option=node('option');option.value=String(value);choices.append(option)}d.append(choices)}
          values.push({key,property,input});
        }
        valid=()=>values.every(({input,property})=>(!input.required||input.type==='checkbox'||!!input.value.trim())&&(!input.value||!property.enum||property.enum.some(value=>String(value)===input.value)));
        submitPayload=()=>({accept:true,content:Object.fromEntries(values.filter(({input})=>input.type==='checkbox'||input.value!=='').map(({key,property,input})=>[key,input.type==='checkbox'?input.checked:property.type==='integer'||property.type==='number'?Number(input.value):property.type==='array'||property.type==='object'?JSON.parse(input.value):input.value]))});
      }
    }
    const actions=node('div','codex-actions');actions.append(button('拒绝',()=>resolveRequest(request,method==='item/tool/requestUserInput'?{answers:{}}:{accept:false,decision:'decline'})));
    if(method==='item/commandExecution/requestApproval'||method==='item/fileChange/requestApproval'){
      const allowed=params.availableDecisions; if(!allowed||allowed.includes('acceptForSession'))actions.append(button('本次会话允许',()=>resolveRequest(request,{decision:'acceptForSession'})));
    }
    actions.append(button(method==='item/tool/requestUserInput'?'提交回答':'允许一次',()=>{if(!valid()){note(d,'请完成必填内容，并选择有效的回答。',true);return}run(d,()=>resolveRequest(request,submitPayload()))},'is-primary'));d.append(actions);
    d.addEventListener('cancel',event=>{event.preventDefault();resolveRequest(request,method==='item/tool/requestUserInput'?{answers:{}}:{accept:false,decision:'decline'})});
    d.querySelector('.codex-dialog-header button').onclick=()=>resolveRequest(request,method==='item/tool/requestUserInput'?{answers:{}}:{accept:false,decision:'decline'});
  }
  function receive(event){
    if(event.type==='request'){requests.set(event.requestId,event);showRequest()}
    if(event.type==='requestResolved'){requests.delete(event.requestId);if(activeRequest===event.requestId){approval?.close();approval=null;activeRequest=null;queueMicrotask(showRequest)}}
    if(event.type==='activity'){
      const thread=ChatStore.get(event.threadId);if(thread?.pendingAnswer){const list=thread.pendingAnswer.activities||(thread.pendingAnswer.activities=[]),index=list.findIndex(item=>item.id===event.item.id);if(index<0)list.push(event.item);else list[index]=event.item;window.dispatchEvent(new CustomEvent('conversation:changed',{detail:{id:thread.id,reason:'stream'}}))}
    }
    if(event.type==='turnEnded'){window.dispatchEvent(new Event('codex:files-changed'))}
    if(event.type==='account'){
      if(event.method==='account/login/completed'){loginId=null;if(event.params.success===false&&settings)note(settings,event.params.error||'登录未完成。',true)}
      refresh().then(()=>{if(settings?.isConnected)renderSettings()}).catch(()=>{});
    }
    if(event.type==='disconnected'){requests.clear();approval?.close();approval=null;activeRequest=null;configuration=null}
  }
  function activityView(message){
    const root=node('details','codex-activity');root.append(node('summary',null,message.streaming?'任务执行中':'任务执行记录'));
    for(const item of message.activities||[]){const row=node('details','codex-activity-row'),name=item.type==='commandExecution'?'运行命令':item.type==='fileChange'?'修改文件':item.type==='webSearch'?'搜索网页':item.type==='dynamicToolCall'?'查询金融数据':`${item.server||''} ${item.tool||'调用工具'}`;
      const status={inProgress:'进行中',completed:'完成',failed:'失败',declined:'已拒绝'}[item.status]||'';row.append(node('summary',null,`${name} · ${status}`));
      if(item.command)row.append(node('pre',null,item.command));if(item.cwd)row.append(node('p','codex-path',item.cwd));
      if(item.aggregatedOutput)row.append(node('pre',null,item.aggregatedOutput.slice(-40000)));
      for(const change of item.changes||[])row.append(node('strong',null,change.path),node('pre',null,(change.diff||'').slice(0,40000)));
      if(item.error)row.append(node('p',null,typeof item.error==='string'?item.error:item.error.message||'工具调用失败'));
      root.append(row);
    }return root;
  }
  document.addEventListener('codex:files-changed',()=>{document.querySelectorAll('.home-file-tree-view').forEach(view=>view.refreshNativeTree?.())});
  if(NativeBridge.available)queueMicrotask(()=>refresh().catch(()=>{}));
  return {openSettings,refresh,receive,activityView,get configuration(){return configuration}};
})();
