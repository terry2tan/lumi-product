/* Browser-only transport boundary. */
window.NativeBridge=Object.freeze({available:false,titleInset:0,
 call:()=>Promise.reject(new Error('此操作暂不可用。')),
 cancelThread:()=>{},reset:()=>location.reload(),
 setWindowState:()=>{},receive:()=>false,resolve:()=>{},event:()=>{}});
