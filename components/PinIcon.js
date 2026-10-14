/* The same supplied icon pair represents pin state across the application. */
window.PinIcon={
 src:filled=>`assets/navigation/pin-${filled?'filled':'outline'}.svg`,
 html:(filled,className='')=>`<img class="${className}" src="${PinIcon.src(filled)}" width="16" height="16" alt="" aria-hidden="true" draggable="false">`
};
