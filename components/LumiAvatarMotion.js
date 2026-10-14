/* Shared desktop-pet hover clip: 48 transparent frames at 24 fps, once per entry. */
(() => {
  const count=48,fps=24,duration=2000,fw=224,fh=216,columns=8;
  let clipPromise;
  const clip=()=>clipPromise??=Promise.all(['hover-48.png','hover-48-left.png'].map(async file=>{const image=new Image();image.src='assets/lumi-hover/'+file;await image.decode();return image})).catch(()=>null);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const controllers=new WeakMap();
  reduced.addEventListener('change',()=>document.querySelectorAll('.lumi-floating-avatar,.lumi-welcome-avatar').forEach(control=>controllers.get(control)?.stop()));
  function attach(control,avatar){
    const canvas=document.createElement('canvas');canvas.className='lumi-pet-canvas';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');control.append(canvas);
    let playing=false,raf=0,generation=0,images=null,currentFrame=0,direction=0;
    const supported=()=>avatar.getAttribute('src')==='assets/lumi-pink.png';
    const draw=frame=>{
      if(!images||!supported()||reduced.matches||!control.isConnected||!control.getClientRects().length)return false;
      const box=control.getBoundingClientRect(),width=box.width+16,height=box.height+16,dpr=Math.min(devicePixelRatio||1,3);
      const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
      if(canvas.width!==pixelWidth)canvas.width=pixelWidth;if(canvas.height!==pixelHeight)canvas.height=pixelHeight;
      const ctx=canvas.getContext('2d'),scale=Math.min(box.width/192,box.height/184),dw=fw*scale,dh=fh*scale;
      ctx.setTransform(pixelWidth/width,0,0,pixelHeight/height,0,0);ctx.clearRect(0,0,width,height);
      ctx.drawImage(images[direction],frame%columns*fw,Math.floor(frame/columns)*fh,fw,fh,(width-dw)/2,(height-dh)/2,dw,dh);
      currentFrame=frame;canvas.hidden=false;control.classList.add('is-pet-ready');return true;
    };
    const stop=()=>{
      generation++;cancelAnimationFrame(raf);playing=false;currentFrame=0;control.classList.remove('is-pet-playing');delete control.dataset.petFrame;
      if(!draw(0)){canvas.hidden=true;control.classList.remove('is-pet-ready')}
    };
    const start=async event=>{
      if(playing||reduced.matches||!supported()||event?.pointerType==='touch')return;
      if(event?.type==='focus'&&!control.matches(':focus-visible'))return;
      const token=++generation;playing=true;images=await clip();if(token!==generation)return;
      if(!images||!control.isConnected||!supported()||reduced.matches){stop();return}
      const box=control.getBoundingClientRect();direction=event?.clientX<box.left+box.width/2?1:0;
      const started=performance.now();let previous=-1;draw(0);control.classList.add('is-pet-playing');
      const tick=()=>{
        if(token!==generation)return;
        const elapsed=performance.now()-started;
        if(!control.isConnected||!control.getClientRects().length||!supported()||reduced.matches||elapsed>=duration){stop();return}
        const frame=Math.max(0,Math.min(count-1,Math.floor(elapsed*fps/1000)));
        if(frame!==previous){draw(frame);control.dataset.petFrame=String(frame);previous=frame}
        raf=requestAnimationFrame(tick);
      };tick();
    };
    control.addEventListener('pointerenter',start);control.addEventListener('focus',start);
    controllers.set(control,{stop});
    new MutationObserver(stop).observe(avatar,{attributes:true,attributeFilter:['src']});
    new ResizeObserver(()=>draw(currentFrame)).observe(control);
    clip().then(result=>{images=result;if(!playing)draw(0)});return control;
  }
  window.LumiAvatarMotion={attach};
})();
