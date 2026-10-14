/* Message reply controls and a single quoted message in Lumi's composer. */
(() => {
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const icons={more:'M4 12h.01M12 12h.01M20 12h.01',reply:'m9 5-6 6 6 6M3 11h9a8 8 0 0 1 8 8',message:'M8 6h12v15H8zM4 10H3v11h2M11 10h6M11 14h6M11 18h3',close:'m6 6 12 12M18 6 6 18'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]}"/></svg>`;
  function button(label,name,cls,action){const b=make('button',cls);b.type='button';b.setAttribute('aria-label',label);b.title=label;b.innerHTML=icon(name);b.onclick=action;return b;}
  function messageRow(message,thread,content){
    const row=make('div','lumi-message-row'),actions=make('div','lumi-message-actions');actions.setAttribute('aria-label','Lumi 消息操作');
    content.onpointerenter=()=>row.classList.add('is-actions-visible');
    row.onpointerleave=()=>row.classList.remove('is-actions-visible');
    const more=button('更多消息操作','more','conversation-icon-button',()=>{});
    const reply=button('回复这条消息','reply','conversation-icon-button',()=>{
      thread.replyQuote={id:message.id,text:ChatStore.messageText(message),author:LumiProfile.name,avatar:LumiProfile.avatar};
      const view=reply.closest('.conversation-view');refresh(view,thread);view.querySelector('.conversation-input').focus({preventScroll:true});
    });
    actions.append(more,reply);row.append(content,actions);return row;
  }
  function refresh(view,thread){const root=view?.querySelector('.lumi-home-composer');if(root)renderQuote(root,thread);}
  function renderQuote(root,thread){
    const key=JSON.stringify(thread.replyQuote||null);if(root.lumiReplyKey===key)return;root.lumiReplyKey=key;
    root.querySelector('.lumi-reply-quote')?.remove();root.classList.toggle('has-reply-quote',!!thread.replyQuote);
    const quote=thread.replyQuote;if(!quote){if(root.classList.contains('is-preview-floating'))root.refreshComposer?.();return}
    const wrap=make('div','lumi-reply-quote'),chip=make('div','lumi-reply-quote-chip');
    const preview=make('div','lumi-reply-quote-preview');preview.id=`lumi-quote-${quote.id}`;preview.setAttribute('role','region');preview.setAttribute('aria-label','引用消息预览');preview.hidden=true;
    const heading=make('div','lumi-reply-quote-author'),avatar=make('img');avatar.src=quote.avatar;avatar.alt='';heading.append(avatar,make('strong',null,quote.author));preview.append(heading,make('div','lumi-reply-quote-text',quote.text));
    const open=button('预览引用消息','message','lumi-reply-quote-open',()=>show(true));open.append(make('span',null,'1 条消息'));open.setAttribute('aria-controls',preview.id);open.setAttribute('aria-expanded','false');
    const remove=button('取消引用','close','lumi-reply-quote-remove',()=>{thread.replyQuote=null;renderQuote(root,thread);root.querySelector('.conversation-input').focus({preventScroll:true})});
    function show(visible){preview.hidden=!visible;open.setAttribute('aria-expanded',String(visible));}
    wrap.onpointerenter=()=>show(true);wrap.onpointerleave=()=>{if(!wrap.contains(document.activeElement))show(false)};
    wrap.onfocusout=()=>requestAnimationFrame(()=>{if(wrap.isConnected&&!wrap.contains(document.activeElement))show(false)});
    wrap.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();show(false);root.querySelector('.conversation-input').focus({preventScroll:true})}};
    chip.append(open,remove);wrap.append(chip,preview);root.prepend(wrap);if(root.classList.contains('is-preview-floating'))root.refreshComposer?.();
  }
  function quotedMessage(quote){
    const block=make('blockquote','lumi-sent-quote');block.append(make('strong',null,quote.author),make('div',null,quote.text));block.title=quote.text;return block;
  }
  window.LumiReply={messageRow,renderQuote,refresh,quotedMessage};
})();
