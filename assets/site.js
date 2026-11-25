/* Small things every page needs: the menu on phones and the FAQ that opens smoothly. */
(function(){
  'use strict';
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu on phones ---------- */
  var btn = document.querySelector('.menu-btn'), sheet = document.getElementById('sheet'), root = document.documentElement, closing = null;
  function setOpen(open){
    if(!btn || !sheet) return;
    clearTimeout(closing);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    root.classList.toggle('menu-open', open);
    if(open){ sheet.hidden = false; requestAnimationFrame(function(){ requestAnimationFrame(function(){ sheet.classList.add('open'); }); }); }
    else { sheet.classList.remove('open'); closing = setTimeout(function(){ sheet.hidden = true; }, still ? 0 : 320); }
  }
  if(btn && sheet){
    btn.addEventListener('click', function(){ setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    sheet.addEventListener('click', function(e){ if(e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true'){ setOpen(false); btn.focus(); } });
    addEventListener('resize', function(){ if(innerWidth > 720 && btn.getAttribute('aria-expanded') === 'true') setOpen(false); });
  }

  /* ---------- FAQ: open and close with a little height animation ---------- */
  [].forEach.call(document.querySelectorAll('.qa'), function(d){
    var sum = d.querySelector('summary'), body = d.querySelector('.qa-a'), anim = null;
    if(!sum || !body || still || !body.animate) return;
    sum.addEventListener('click', function(e){
      e.preventDefault();
      if(anim) anim.cancel();
      if(!d.open){
        d.open = true;
        var h = body.scrollHeight;
        anim = body.animate([{height: '0px', opacity: 0}, {height: h + 'px', opacity: 1}], {duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)'});
        anim.onfinish = function(){ anim = null; };
      } else {
        var h2 = body.offsetHeight;
        anim = body.animate([{height: h2 + 'px', opacity: 1}, {height: '0px', opacity: 0}], {duration: 300, easing: 'cubic-bezier(.4,0,.2,1)'});
        anim.onfinish = function(){ d.open = false; anim = null; };
      }
    });
  });
})();
