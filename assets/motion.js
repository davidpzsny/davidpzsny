/* Page motion:
   - .rv elements fade up when they come into view (and the hero product shot tilts upright as you scroll),
   - the feature tour switches the screen on the right to match the step in the middle of the window,
   - countdowns and the overlay clock tick live.
   Visitors who prefer reduced motion get everything at once, without movement. */
(function(){
  var root = document.documentElement;
  var still = !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function(x){ return Math.min(1, Math.max(0, x)); };

  if(still){ root.classList.remove('js'); }
  else {
    root.classList.add('anim');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });
    // the intro (and the product shot under it) plays right away, even if only a part of it is on screen yet
    requestAnimationFrame(function(){ document.querySelectorAll('.hero .rv').forEach(function(el){ el.classList.add('in'); io.unobserve(el); }); });

    // hero shot: from tilted back to upright while it scrolls up into view
    var tilt = document.getElementById('tilt'), queued = false;
    var update = function(){
      queued = false; if(!tilt) return;
      var r = tilt.getBoundingClientRect();
      tilt.style.setProperty('--t', clamp((innerHeight * 0.95 - r.top) / (innerHeight * 0.7)).toFixed(4));
    };
    var queue = function(){ if(!queued){ queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue); update();
  }

  // feature tour: the step crossing the middle of the window picks the screen
  var steps = [].slice.call(document.querySelectorAll('.step')), screens = document.querySelectorAll('.screen'), url = document.getElementById('tourUrl');
  function show(i){
    steps.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    screens.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    if(url && steps[i] && url.textContent !== steps[i].dataset.url){
      url.style.opacity = 0;
      setTimeout(function(){ url.textContent = steps[i].dataset.url; url.style.opacity = 1; }, 180);
    }
  }
  if(steps.length && matchMedia('(max-width: 980px)').matches){
    // phones and tablets: every step gets its own small screen above the text instead of one screen that stays put
    steps.forEach(function(st, i){
      var src = screens[i]; if(!src) return;
      var dev = document.createElement('div'); dev.className = 'm-device'; dev.setAttribute('aria-hidden', 'true');
      dev.innerHTML = '<div class="chrome"><i></i><i></i><i></i><span></span></div><div class="screens"></div>';
      dev.querySelector('.chrome span').textContent = st.dataset.url;
      var c = src.cloneNode(true); c.classList.remove('on'); dev.querySelector('.screens').appendChild(c);
      st.insertBefore(dev, st.firstChild);
    });
    var turnOn = function(st){ var s = st.querySelector('.m-device .screen'); if(s) s.classList.add('on'); };
    if('IntersectionObserver' in window){
      var mo = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ turnOn(e.target); mo.unobserve(e.target); } });
      }, { threshold: 0.3 });
      steps.forEach(function(s){ mo.observe(s); });
    } else steps.forEach(turnOn);
  } else if(steps.length && 'IntersectionObserver' in window){
    var so = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) show(steps.indexOf(e.target)); });
    }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });
    steps.forEach(function(s){ so.observe(s); });
  }

  // live countdowns and the overlay clock
  var M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var pad = function(n){ return String(n).padStart(2, '0'); };
  function tick(){
    var now = new Date();
    document.querySelectorAll('[data-countdown]').forEach(function(el){
      var ms = Date.parse(el.dataset.countdown) - now; if(isNaN(ms)) return;
      var txt = ms <= 0 ? 'ended' : (function(){
        var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
        return d ? d + 'd ' + h + 'h ' + pad(m) + 'm' : h + 'h ' + pad(m) + 'm';
      })();
      el.textContent = (el.dataset.prefix || '') + txt;
    });
    document.querySelectorAll('[data-clock]').forEach(function(el){
      el.textContent = pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes()) + ':' + pad(now.getUTCSeconds());
      var day = el.parentNode.querySelector('small');
      if(day) day.textContent = M[now.getUTCMonth()] + ' ' + now.getUTCDate() + ', ' + now.getUTCFullYear();
    });
  }
  tick(); setInterval(tick, 1000);
})();
