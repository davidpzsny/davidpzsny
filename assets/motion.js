/* Page motion. Decoration on top of a page that works without it:
   - .rv elements fade up and .io elements get "in" when they come into view; .split headlines rise word by word,
   - numbers count up, the badge ribbon runs (faster while you scroll), a light follows the cursor in the intro,
   - the gallery turns vertical scrolling into a 3D row of pages that moves from right to left,
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

  /* ---------- gallery sizing (also used without motion, then the pages simply stack) ---------- */
  var gal = document.getElementById('gallery'), track = document.getElementById('gTrack'), cards = $$('.card'), N = cards.length;
  var cw = 900, gap = 56;
  function sizeGallery(){
    if(!gal) return;
    var vw = document.documentElement.clientWidth, vh = innerHeight, phone = vw < 720, moving = root.classList.contains('anim');
    var cs;
    if(moving){
      cw = Math.min(980, vw * (phone ? 0.84 : 0.64)); cs = cw / 720;
      var room = vh - 68 - 64 - (phone ? 160 : 150);                  // header, counter row, caption and air
      if(40 + 450 * cs > room){ cs = Math.max(0.42, (room - 40) / 450); cw = cs * 720; }
    } else { cw = Math.min(900, vw - (phone ? 40 : 80)); cs = cw / 720; }
    gap = phone ? 18 : Math.round(Math.min(72, vw * 0.04));
    gal.style.setProperty('--cw', cw.toFixed(1) + 'px'); gal.style.setProperty('--cs', cs.toFixed(4));
    gal.style.setProperty('--gap', gap + 'px'); gal.style.setProperty('--gn', Math.max(1, N - 1));
    if(track && moving) track.style.padding = '0 ' + ((vw - cw) / 2).toFixed(1) + 'px';
  }

  if(still){
    root.classList.remove('js');
    sizeGallery(); addEventListener('resize', sizeGallery);
    $$('.canvas .screen').forEach(function(s){ s.classList.add('on'); });
  } else {
    root.classList.add('anim');
    sizeGallery(); addEventListener('resize', sizeGallery);

    /* ---------- reveal on scroll ---------- */
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); if(e.target.matches('.count')) countUp(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('.rv, .io, .split, .count').forEach(function(el){ io.observe(el); });
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
    var gNum = document.getElementById('gNum'), gBar = document.getElementById('gBar');
    var lastY = scrollY, boost = 0, x = 0, last = performance.now(), cur = 0, shownNum = -1;
    var dwell = function(t){ var f = Math.floor(t), r = t - f; return f + r * r * r * (r * (r * 6 - 15) + 10); };   // rests on each page, then moves on
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
      if(gal && track && N){
        var r = gal.getBoundingClientRect(), run = gal.offsetHeight - innerHeight;
        var p = clamp(-r.top / (run || 1)), target = Math.min(N - 1, dwell(p * (N - 1)));
        cur += (target - cur) * 0.12; if(Math.abs(target - cur) < 0.0005) cur = target;
        track.style.transform = 'translate3d(' + (-cur * (cw + gap)).toFixed(1) + 'px,0,0)';
        cards.forEach(function(c, i){
          var d = i - cur, a = Math.abs(d);
          var rot = clamp(d, -1.4, 1.4) * -34, z = -Math.min(a, 2) * 260, sc = 1 - Math.min(a, 1.5) * 0.05;
          c.style.transform = 'translateZ(' + z.toFixed(1) + 'px) rotateY(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
          c.style.opacity = clamp(1 - Math.max(0, a - 0.9) * 0.75, 0.12, 1).toFixed(3);
          var on = a < 0.5;
          if(on !== c.classList.contains('on')){ c.classList.toggle('on', on); if(on){ var s = c.querySelector('.screen'); if(s) s.classList.add('on'); } }
        });
        var n = Math.round(cur);
        if(n !== shownNum && gNum){ shownNum = n; gNum.textContent = String(n + 1).padStart(2, '0'); }
        if(gBar) gBar.style.setProperty('--gp', (cur / Math.max(1, N - 1)).toFixed(4));
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
