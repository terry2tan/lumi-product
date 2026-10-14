/* Adapted from 260716 远程使用/demo/app.js: independent channel state and QR transitions. */
window.LumiRemoteUse=(()=>{
const channelStateLabels = {
  disconnected: "未连接",
  loading: "连接中",
  waiting: "连接中",
  expired: "连接中",
  refreshing: "连接中",
  connecting: "连接中",
  connected: "已连接",
  paused: "已暂停",
  error: "获取失败",
};

const channelGuideCopy = {
  thsapp: {
    title: "同花顺手机APP配置指南",
    intro: "完成连接后，可在同花顺手机APP的消息中心与同花顺AI对话。",
    steps: [
      "打开渠道开关，等待连接二维码生成。",
      "使用同花顺手机APP扫描二维码并完成连接。",
      "进入手机客户端消息中心，向同花顺AI发送消息。",
    ],
  },
  wechat: {
    title: "微信配置指南",
    intro: "完成连接后，可通过微信助理接收和回复同花顺AI消息。",
    steps: [
      "打开渠道开关，等待连接二维码生成。",
      "使用微信扫一扫扫描二维码并完成连接。",
      "返回微信助理对话，向同花顺AI发送消息。",
    ],
  },
  feishu: {
    title: "飞书配置指南",
    intro: "完成连接后，可通过飞书机器人接收和回复同花顺AI消息。",
    steps: [
      "打开渠道开关，等待连接二维码生成。",
      "使用飞书扫一扫扫描二维码并完成连接。",
      "进入飞书机器人对话，向同花顺AI发送消息。",
    ],
  },
};

const expandedStates = new Set([
  "loading",
  "waiting",
  "expired",
  "refreshing",
  "connecting",
  "error",
]);

const enabledStates = new Set([
  "loading",
  "waiting",
  "expired",
  "refreshing",
  "connecting",
  "connected",
  "error",
]);


const channels=[
  {id:'thsapp',name:'同花顺手机APP',icon:'tonghuashun-mobile.png',description:'接收并回复 Lumi 消息',scan:'打开同花顺手机APP，扫描二维码完成连接'},
  {id:'wechat',name:'微信',icon:'wechat.svg',description:'接收并回复 Lumi 消息',scan:'打开微信扫一扫，扫描二维码完成连接'},
  {id:'feishu',name:'飞书',icon:'feishu.svg',description:'接收并回复 Lumi 消息',scan:'打开飞书扫一扫，扫描二维码完成连接'}
];
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const formatCountdown=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
let root,dialog;
function closeDialog(){dialog?.close()}
function openDialog(title,anchor,build){
  closeDialog();const current=make('dialog','lumi-remote-dialog');dialog=current;current.setAttribute('aria-label',title);
  const header=make('header','lumi-remote-dialog-head'),close=make('button','lumi-remote-dialog-close','×');close.type='button';close.setAttribute('aria-label','关闭'+title);close.onclick=closeDialog;header.append(make('h2',null,title),close);current.append(header);build(current);
  current.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation()});current.addEventListener('click',event=>{if(event.target===current)current.close()});current.addEventListener('close',()=>{current.remove();if(dialog===current)dialog=null;if(anchor?.isConnected){const target=anchor.disabled?anchor.closest('[data-channel]')?.querySelector('[data-channel-switch]'):anchor;target?.focus({preventScroll:true})}});document.body.append(current);current.showModal();
}
function actionButton(label,cls,action){const el=make('button',cls,label);el.type='button';el.onclick=action;return el}
function openConfigGuide(channel,anchor){const copy=channelGuideCopy[channel.id];openDialog(copy.title,anchor,body=>{body.append(make('p',null,copy.intro));const steps=make('ol','lumi-remote-guide-steps');for(const text of copy.steps)steps.append(make('li',null,text));body.append(steps);const actions=make('footer','lumi-remote-dialog-actions');actions.append(actionButton('知道了','is-primary',closeDialog));body.append(actions)})}
function openUnbindConfirm(model,anchor){openDialog(`解除${model.channel.name}绑定？`,anchor,body=>{body.append(make('p',null,`解除后将无法继续通过${model.channel.name}使用同花顺AI，再次使用需要重新扫码连接。`));const actions=make('footer','lumi-remote-dialog-actions');actions.append(actionButton('取消','',closeDialog),actionButton('解除绑定','is-danger',()=>{setChannelState(model,'disconnected');closeDialog()}));body.append(actions)})}
function clearModelTimers(model) {
  window.clearTimeout(model.transitionTimer);
  window.clearInterval(model.countdownTimer);
  model.generation = (model.generation || 0) + 1;
  model.transitionTimer = null;
  model.countdownTimer = null;
}

function renderChannel(model) {
  const { card, state } = model;
  const channel = card.dataset.channel;
  const switchButton = card.querySelector("[data-channel-switch]");
  const status = card.querySelector("[data-status]");
  const statusLabel = status.querySelector("[data-status-label]");
  const refreshButton = card.querySelector("[data-refresh-qr]");
  card.dataset.state = state;
  statusLabel.textContent = channelStateLabels[state];
  switchButton.setAttribute("aria-checked", String(enabledStates.has(state)));
  switchButton.disabled = state === "connecting";
  refreshButton.disabled = state === "refreshing";

  const hasBinding = state === "connected" || state === "paused";
  status.disabled = !hasBinding;
  status.setAttribute(
    "aria-label",
    hasBinding ? `${channelStateLabels[state]}，解除绑定` : channelStateLabels[state],
  );

  if (state === "expired" || state === "refreshing") {
    const countdown = card.querySelector("[data-countdown]");
    if (countdown) countdown.textContent = "00:00";
  }

  if (!expandedStates.has(state)) {
    const countdown = card.querySelector("[data-countdown]");
    if (countdown) countdown.textContent = "15:00";
  }
}

async function drawQr(model) {
  const canvases = [
    ...model.card.querySelectorAll("[data-qr], [data-expired-qr]"),
  ];
  const channel = model.card.dataset.channel;
  const content = `lumi-remote://${channel}/bind/demo-${Date.now()}`;

  if (!window.LocalQRCode) {
    throw new Error("二维码组件不可用");
  }

  await Promise.all(
    canvases.map((canvas) => window.LocalQRCode.toCanvas(canvas, content, {
      width: 184,
      margin: 1,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    })),
  );
}

function startCountdown(model) {
  window.clearInterval(model.countdownTimer);
  model.expiresAt = Date.now() + 15 * 60 * 1000;

  const update = () => {
    model.remainingSeconds = Math.max(0, Math.ceil((model.expiresAt - Date.now()) / 1000));
    const countdown = model.card.querySelector("[data-countdown]");
    if (countdown) countdown.textContent = formatCountdown(model.remainingSeconds);

    if (model.remainingSeconds <= 0) {
      window.clearInterval(model.countdownTimer);
      model.countdownTimer = null;
      setChannelState(model, "expired");
      return;
    }


  };

  update();
  model.countdownTimer = window.setInterval(update, 1000);
}

function setChannelState(model, state) {
  clearModelTimers(model);
  model.state = state;
  renderChannel(model);

  if (state === "waiting") {
    startCountdown(model);
  }
}

function shouldSimulateQrFailure(model) {
  const params = new URLSearchParams(window.location.search);
  const failureChannel = params.get("remote_fail");
  if (failureChannel !== model.card.dataset.channel || model.failureConsumed) {
    return false;
  }

  model.failureConsumed = true;
  return true;
}

function requestQr(model, preserveExpiredQr = false) {
  setChannelState(model, preserveExpiredQr ? "refreshing" : "loading");

  const generation = model.generation;
  model.transitionTimer = window.setTimeout(async () => {
    if (shouldSimulateQrFailure(model)) {
      setChannelState(model, "error");
      return;
    }

    try {
      await drawQr(model);
      if (model.generation === generation) setChannelState(model, "waiting");
    } catch {
      if (model.generation === generation) setChannelState(model, "error");
    }
  }, 650);
}

function beginConnection(model) {
  if (model.state !== "waiting") return;

  setChannelState(model, "connecting");
  model.transitionTimer = window.setTimeout(() => {
    setChannelState(model, "connected");
  }, 900);
}

function handleSwitch(model) {
  switch (model.state) {
    case "disconnected":
      requestQr(model);
      break;
    case "loading":
    case "waiting":
    case "expired":
    case "refreshing":
    case "error":
      setChannelState(model, "disconnected");
      break;
    case "connected":
      setChannelState(model, "paused");
      break;
    case "paused":
      setChannelState(model, "connected");
      break;
    default:
      break;
  }
}


function createCard(channel){
  const card=make('article','lumi-remote-card');card.dataset.channel=channel.id;card.dataset.state='disconnected';
  card.innerHTML=`<header class="lumi-remote-card-head">
    <img class="lumi-remote-logo" src="assets/remote-use/${channel.icon}" alt="">
    <span class="lumi-remote-copy"><span class="lumi-remote-title"><strong>${channel.name}</strong><button class="lumi-remote-guide-link" type="button" data-config-guide aria-haspopup="dialog">配置指南</button></span><small>${channel.description}</small></span>
    <button class="lumi-remote-status" type="button" data-status disabled><span data-status-label>未连接</span><span class="lumi-remote-unbind-label">解除绑定</span></button>
    <button class="lumi-remote-switch" type="button" role="switch" aria-checked="false" aria-label="${channel.name}远程使用" data-channel-switch><span></span></button>
  </header><div class="lumi-remote-expand" data-channel-expand>
    <div class="lumi-remote-state lumi-remote-loading" data-state-view="loading"><span class="lumi-remote-spinner"></span><strong>正在获取二维码</strong><p>请稍候</p></div>
    <div class="lumi-remote-state lumi-remote-waiting" data-state-view="waiting">
      <button class="lumi-remote-qr-button" type="button" data-simulate-scan aria-label="模拟扫码连接${channel.name}"><canvas width="184" height="184" data-qr></canvas></button>
      <button class="lumi-remote-expired-qr" type="button" data-refresh-qr aria-label="刷新${channel.name}二维码"><canvas width="184" height="184" data-expired-qr></canvas><span class="lumi-remote-expired-qr-overlay"><span class="lumi-remote-expired-qr-copy"><strong>二维码已过期</strong><span>点击刷新</span></span><span class="lumi-remote-qr-refresh-spinner" aria-hidden="true"></span></span></button>
      <div class="lumi-remote-waiting-copy"><span class="lumi-remote-pairing-illustration" aria-hidden="true"><svg viewBox="0 0 88 36" fill="none"><rect class="lumi-remote-pairing-device" x="2.5" y="3.5" width="18" height="29" rx="3"/><path class="lumi-remote-pairing-device-detail" d="M8 28.5h7"/><circle class="lumi-remote-pairing-dot" cx="31" cy="18" r="2"/><circle class="lumi-remote-pairing-dot" cx="39" cy="18" r="2"/><circle class="lumi-remote-pairing-dot" cx="47" cy="18" r="2"/><rect class="lumi-remote-pairing-device" x="57.5" y="5.5" width="27" height="20" rx="2.5"/><path class="lumi-remote-pairing-device" d="M54 29h34l-2 3H56l-2-3Z"/></svg></span><strong>使用${channel.name}扫码连接</strong><p>${channel.scan}</p><small>二维码将在 <button class="lumi-remote-countdown-trigger" type="button" data-expire-qr aria-label="使${channel.name}二维码过期"><b data-countdown>15:00</b></button> 后过期</small></div>
    </div>
    <div class="lumi-remote-state lumi-remote-connecting" data-state-view="connecting"><span class="lumi-remote-spinner"></span><strong>正在连接</strong><p>已识别扫码，请稍候</p></div>
    <div class="lumi-remote-state lumi-remote-error" data-state-view="error"><span class="lumi-remote-state-icon">!</span><strong>二维码获取失败</strong><p>请检查后重新获取</p><button type="button" data-retry-qr>重新获取</button></div>
  </div>`;
  const model={card,channel,state:'disconnected',transitionTimer:null,countdownTimer:null,remainingSeconds:900,generation:0,failureConsumed:false};
  card.querySelector('[data-channel-switch]').onclick=()=>handleSwitch(model);
  card.querySelector('[data-simulate-scan]').onclick=()=>beginConnection(model);
  card.querySelector('[data-expire-qr]').onclick=()=>setChannelState(model,'expired');
  card.querySelector('[data-refresh-qr]').onclick=()=>requestQr(model,true);
  card.querySelector('[data-retry-qr]').onclick=()=>requestQr(model);
  const guide=card.querySelector('[data-config-guide]'),status=card.querySelector('[data-status]');guide.onclick=()=>openConfigGuide(channel,guide);status.onclick=()=>openUnbindConfirm(model,status);
  renderChannel(model);return card;
}
function render(){if(root)return root;root=make('div','lumi-remote-list lumi-profile-settings-group');root.setAttribute('aria-label','远程使用渠道');for(const channel of channels)root.append(createCard(channel));return root}
return{render};
})();
