/* Shared Lumi service-message pool for browser and native app. */
window.LumiProactive=(()=>{
  const pool=ChatStore.watchNotes;
  let timer=null,sent=0,nextIndex=0,dueAt=null,typing=false,generation=0,stopped=false;
  function after(ms,callback=deliver){dueAt=Date.now()+ms;timer=setTimeout(callback,ms)}
  const ready=()=>ChatStore.get('lumi')?.onboarding?.phase==='complete';
  function schedule(){if(pool.length&&ready())after(sent<2?20000+Math.floor(Math.random()*100001):600000+Math.floor(Math.random()*1200001))}
  function deliver(){
    timer=null;dueAt=null;
    if(!ready())return;
    if(ChatStore.get('lumi')?.pending){after(1000);return}
    typing=true;after(1200,finish);ChatStore.setProactiveTyping(true);
  }
  async function finish(){
    timer=null;dueAt=null;typing=false;ChatStore.setProactiveTyping(false);
    if(ChatStore.get('lumi')?.pending){after(1000);return}
    const token=generation;let note=pool[nextIndex];
    if(token!==generation||stopped)return;
    if(!ChatStore.get('lumi')?.pending&&ChatStore.appendProactive(note,nextIndex)){
      sent++;nextIndex=(nextIndex+1)%pool.length;
    }
    schedule();
  }
  function start(){stopped=false;if(timer===null)schedule()}
  function stop(){generation++;stopped=true;if(timer!==null)clearTimeout(timer);timer=null;dueAt=null;typing=false;ChatStore.setProactiveTyping(false)}
  addEventListener('conversation:changed',event=>{
    if(event.detail.id!=='lumi')return;
    if(event.detail.reason==='lumi-ready'&&!stopped&&timer===null)schedule();
    if(!typing||!ChatStore.get('lumi')?.pending)return;
    clearTimeout(timer);typing=false;after(1000);ChatStore.setProactiveTyping(false);
  });
  addEventListener('pagehide',stop);
  addEventListener('pageshow',event=>{if(event.persisted)start()});
  start();
  return{start,stop,get status(){return{sent,nextIndex,dueAt,typing,poolSize:pool.length}}};
})();
