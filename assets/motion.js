/* Page motion. Decoration on top of a page that works without it:
   - .rv elements fade up and .io elements get "in" when they come into view; .split headlines rise word by word,
   - numbers count up, the badge ribbon runs (faster while you scroll), a light follows the cursor in the intro,
   - the showcase windows lean in from their side and straighten up in the middle of the screen,
   - buttons lean towards the cursor, cards light up under it, countdowns and the overlay clock tick.
   Visitors who prefer reduced motion get the finished page straight away. */
(function(){
  var root = document.documentElement;
  var still = !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function(x, a, b){ a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, x)); };
  var $$ = function(q, el){ return [].slice.call((el || document).querySelectorAll(q)); };

  /* ---------- split headlines into masked words / letters ---------- */
  $$('.split').forEach(function(el){
    var letters = el.dataset.split === 'chars', i = 0;
    if(!el.getAttribute('aria-hidden')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType === 3){
          var frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n\r]+)/).forEach(function(part){
            if(!part) return;
            if(/^[ \t\n\r]+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
            (letters ? part.split('') : [part]).forEach(function(p){
              var w = document.createElement('span'), inner = document.createElement('span');
              w.className = 'w'; w.setAttribute('aria-hidden', 'true'); inner.textContent = p; inner.style.setProperty('--i', i++);
              w.appendChild(inner); frag.appendChild(w);
            });
          });
          n.parentNode.replaceChild(frag, n);
        } else if(n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
  });

  /* ---------- showcase windows: scale each page replica to its window ---------- */
  var macs = $$('.mac'), rows = $$('.sc-row');
  function sizeWindows(){
    macs.forEach(function(m){ var w = m.clientWidth; if(w) m.style.setProperty('--cs', (w / 720).toFixed(4)); });
  }
  if(still){
    root.classList.remove('js');
    sizeWindows(); addEventListener('resize', sizeWindows);
    $$('.canvas .screen').forEach(function(s){ s.classList.add('on'); });
  } else {
    root.classList.add('anim');
    sizeWindows(); addEventListener('resize', sizeWindows);

    /* ---------- reveal on scroll ---------- */
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); if(e.target.matches('.count')) countUp(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('.rv, .io, .split, .count, .sc-row').forEach(function(el){ io.observe(el); });
    requestAnimationFrame(function(){ $$('.hero .rv, .hero .split').forEach(function(el){ el.classList.add('in'); io.unobserve(el); }); });

    /* ---------- numbers count up ---------- */
    $$('.count').forEach(function(el){ el.textContent = '0' + (el.dataset.suffix || ''); });
    function countUp(el){
      var to = +el.dataset.to, suf = el.dataset.suffix || '', t0 = null, dur = 2200;
      (function frame(t){
        if(t0 === null) t0 = t;
        var k = clamp((t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e).toLocaleString('en-US') + suf;
        if(k < 1) requestAnimationFrame(frame);
      })(performance.now());
    }

    /* ---------- one loop for everything tied to scrolling ---------- */
    var ribbon = document.getElementById('ribbon'), bar = document.querySelector('.progress');
    var lastY = scrollY, boost = 0, x = 0, last = performance.now();
    function loop(now){
      var dt = Math.min(64, now - last); last = now;
      var y = scrollY, v = y - lastY; lastY = y;
      boost += (Math.min(40, Math.abs(v)) - boost) * 0.08;
      if(ribbon){
        var half = ribbon.scrollWidth / 2 || 1;
        x = (x + dt * (0.03 + boost * 0.025) * (v < 0 ? -1 : 1)) % half; if(x < 0) x += half;
        ribbon.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px,0,0)';
      }
      if(bar){ var max = root.scrollHeight - innerHeight; bar.style.setProperty('--sp', (max > 0 ? y / max : 0).toFixed(4)); }
      // showcase: a window leans back on its own side while it comes in and stands up straight in the middle
      for(var w = 0; w < rows.length; w++){
        var row = rows[w], m = macs[w], rr = row.getBoundingClientRect();
        if(rr.bottom < -200 || rr.top > innerHeight + 200) continue;
        var k = clamp(((rr.top + rr.height / 2) - innerHeight / 2) / innerHeight, -1, 1), side = row.classList.contains('sc-r') ? -1 : 1;
        var ease = k * Math.abs(k) * 0.6 + k * 0.4;
        m.style.setProperty('--ry', (side * ease * 16).toFixed(2) + 'deg');
        m.style.setProperty('--rx', (ease * 9).toFixed(2) + 'deg');
        m.style.setProperty('--ty', (ease * 60).toFixed(1) + 'px');
        m.style.setProperty('--sc', (1 - Math.abs(ease) * 0.07).toFixed(4));
        if(Math.abs(k) < 0.32){ var sc0 = m.querySelector('.screen'); if(sc0 && !sc0.classList.contains('on')) sc0.classList.add('on'); }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ---------- pointer: light in the intro, magnetic buttons, card light ---------- */
    if(fine){
      var hero = document.querySelector('.hero'), glow = document.querySelector('.glow');
      if(hero && glow) hero.addEventListener('pointermove', function(e){
        var r = hero.getBoundingClientRect();
        glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        glow.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
      $$('.mag').forEach(function(b){
        b.addEventListener('pointermove', function(e){
          var r = b.getBoundingClientRect();
          b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
          b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.32).toFixed(1) + 'px');
        });
        b.addEventListener('pointerleave', function(){ b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
      });
      $$('.node, .card-l').forEach(function(n){
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
    ['work', 'services', 'about', 'contact'].forEach(function(id){ var s = document.getElementById(id); if(s) no.observe(s); });
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
