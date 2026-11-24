/* Page motion. Everything here is decoration on top of a page that works without it:
   - .rv elements fade up and .io elements switch to their "in" state when they come into view,
   - .split headlines rise word by word (or letter by letter),
   - numbers count up, the badge ribbon runs (faster while you scroll), the hero shot tilts upright,
   - the feature tour swaps the screen on the right to match the step in the middle of the window,
   - buttons lean towards the cursor, cards light up under it, countdowns and the overlay clock tick.
   Visitors who prefer reduced motion get the finished page straight away. */
(function(){
  var root = document.documentElement;
  var still = !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function(x, a, b){ return Math.min(b === undefined ? 1 : b, Math.max(a || 0, x)); };
  var $$ = function(q, el){ return [].slice.call((el || document).querySelectorAll(q)); };

  /* ---------- split headlines into masked words / letters ---------- */
  $$('.split').forEach(function(el){
    var letters = el.dataset.split === 'chars', i = 0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType === 3){
          var frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n\r]+)/).forEach(function(part){
            if(!part) return;
            if(/^[ \t\n\r]+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
            var pieces = letters ? part.split('') : [part];
            pieces.forEach(function(p){
              var w = document.createElement('span'), inner = document.createElement('span');
              w.className = 'w'; inner.textContent = p; inner.style.setProperty('--i', i++); w.appendChild(inner); frag.appendChild(w);
            });
          });
          n.parentNode.replaceChild(frag, n);
        } else if(n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    if(!el.getAttribute('aria-hidden')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  });

  if(still){ root.classList.remove('js'); }
  else {
    root.classList.add('anim');

    /* ---------- reveal on scroll ---------- */
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); if(e.target.matches('.count')) countUp(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('.rv, .io, .split, .count').forEach(function(el){ io.observe(el); });
    requestAnimationFrame(function(){      // the intro plays right away
      $$('.hero .rv, .hero .split').forEach(function(el){ el.classList.add('in'); io.unobserve(el); });
    });

    /* ---------- numbers count up ---------- */
    var fmt = function(n){ return n.toLocaleString('en-US'); };
    $$('.count').forEach(function(el){ el.textContent = '0' + (el.dataset.suffix || ''); });
    function countUp(el){
      var to = +el.dataset.to, suf = el.dataset.suffix || '', t0 = null, dur = 2200;
      (function frame(t){
        if(t0 === null) t0 = t;
        var k = clamp((t - t0) / dur), e = 1 - Math.pow(1 - k, 3);                    // ease out cubic
        el.textContent = fmt(Math.round(to * e)) + suf;
        if(k < 1) requestAnimationFrame(frame);
      })(performance.now());
    }

    /* ---------- scroll-linked: hero tilt, ribbon speed, progress line ---------- */
    var tilt = document.getElementById('tilt'), ribbon = document.getElementById('ribbon'), bar = document.querySelector('.progress');
    var lastY = scrollY, boost = 0, x = 0, last = performance.now();
    function loop(now){
      var dt = Math.min(64, now - last); last = now;
      var y = scrollY, v = y - lastY; lastY = y;
      boost += (Math.min(40, Math.abs(v)) - boost) * 0.08;               // smoothed scroll speed
      if(ribbon){
        var half = ribbon.scrollWidth / 2 || 1;
        x = (x + dt * (0.03 + boost * 0.025) * (v < 0 ? -1 : 1)) % half; if(x < 0) x += half;
        ribbon.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px,0,0)';
      }
      if(tilt){ var r = tilt.getBoundingClientRect(); tilt.style.setProperty('--t', clamp((innerHeight * 0.95 - r.top) / (innerHeight * 0.7)).toFixed(4)); }
      if(bar){ var max = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--sp', (max > 0 ? y / max : 0).toFixed(4)); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ---------- pointer: magnetic buttons, card light ---------- */
    if(fine){
      $$('.mag').forEach(function(b){
        b.addEventListener('pointermove', function(e){
          var r = b.getBoundingClientRect();
          b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
          b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.32).toFixed(1) + 'px');
        });
        b.addEventListener('pointerleave', function(){ b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
      });
      $$('.node').forEach(function(n){
        n.addEventListener('pointermove', function(e){
          var r = n.getBoundingClientRect();
          n.style.setProperty('--mx', (e.clientX - r.left) + 'px'); n.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }
  }

  /* ---------- header: highlight the section in view ---------- */
  var links = $$('.top nav a');
  if(links.length && 'IntersectionObserver' in window){
    var no = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'about', 'contact'].forEach(function(id){ var s = document.getElementById(id); if(s) no.observe(s); });
  }

  /* ---------- feature tour ---------- */
  var steps = $$('.step'), screens = $$('.screen'), url = document.getElementById('tourUrl'), prog = document.getElementById('tourProg');
  function show(i){
    steps.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    screens.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    if(prog) prog.style.setProperty('--tp', ((i + 1) / steps.length).toFixed(4));
    if(url && steps[i] && url.textContent !== steps[i].dataset.url){
      url.style.opacity = 0;
      setTimeout(function(){ url.textContent = steps[i].dataset.url; url.style.opacity = 1; }, 180);
    }
  }
  if(steps.length && matchMedia('(max-width: 980px)').matches){
    // phones and tablets: every step gets its own small screen above the text
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

  /* ---------- live countdowns and the overlay clock ---------- */
  var M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var pad = function(n){ return String(n).padStart(2, '0'); };
  function tick(){
    var now = new Date();
    $$('[data-countdown]').forEach(function(el){
      var ms = Date.parse(el.dataset.countdown) - now; if(isNaN(ms)) return;
      var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
      el.textContent = (el.dataset.prefix || '') + (ms <= 0 ? 'ended' : d ? d + 'd ' + h + 'h ' + pad(m) + 'm' : h + 'h ' + pad(m) + 'm');
    });
    $$('[data-clock]').forEach(function(el){
      el.textContent = pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes()) + ':' + pad(now.getUTCSeconds());
      var day = el.parentNode.querySelector('small');
      if(day) day.textContent = M[now.getUTCMonth()] + ' ' + now.getUTCDate() + ', ' + now.getUTCFullYear();
    });
  }
  tick(); setInterval(tick, 1000);
})();
