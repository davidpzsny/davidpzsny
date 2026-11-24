/* Page motion. Decoration on top of a page that works without it:
   - .rv elements fade up and .io elements get "in" when they come into view; .split headlines rise word by word,
   - numbers count up, the badge ribbon runs (faster while you scroll), a light follows the cursor in the intro,
   - scrolling past "Projects" flies through the "o" of the title, and the work comes out of it,
   - the showcase windows turn, roll or spin into place (each its own way), face you in the middle and leave the other way,
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
  var macs = $$('.mac'), rows = $$('.sc-row'), texts = rows.map(function(r){ return r.querySelector('.sc-text'); });
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
    $$('.rv, .io, .split, .count, .sc-row').forEach(function(el){ if(!el.classList.contains('pz')) io.observe(el); });
    requestAnimationFrame(function(){ $$('.hero .rv, .hero .split').forEach(function(el){ el.classList.add('in'); io.unobserve(el); }); });

    /* ---------- Projects: fly through the "o" of the title ---------- */
    var zoom = document.getElementById('zoom'), zPin, zTitle, zPortal, zO, zPz = [], zOn = false, zA = {x: 0, y: 0}, zR = {x: 10, y: 10}, zW = 0, zH = 0, zMax = 20, pzIn = false;
    if(zoom){
      zPin = zoom.querySelector('.zoom-pin'); zTitle = zoom.querySelector('.zoom-title'); zPortal = zoom.querySelector('.zoom-portal');
      zPz = $$('.pz', zoom);
      zO = $$('.big .w > span', zTitle).filter(function(sp){ return sp.textContent === 'o'; })[0];
    }
    // the inside of the letter: its centre (from the glyph's ink box) and the size of the hole, read off a canvas
    function letterHole(font){
      var c = document.createElement('canvas'), x = c.getContext('2d');
      x.font = font; var m = x.measureText('o');
      var L = m.actualBoundingBoxLeft || 0, R = m.actualBoundingBoxRight || 0, A = m.actualBoundingBoxAscent || 0, D = m.actualBoundingBoxDescent || 0;
      var w = Math.ceil(L + R) + 8, h = Math.ceil(A + D) + 8, cx = Math.round(4 + (L + R) / 2), cy = Math.round(4 + (A + D) / 2);
      c.width = w; c.height = h; x.font = font; x.fillStyle = '#000'; x.fillText('o', 4 + L, 4 + A);
      var d = x.getImageData(0, 0, w, h).data, ix = 0, iy = 0;
      while(cx + ix < w && d[(cy * w + cx + ix) * 4 + 3] < 100) ix++;
      while(cy + iy < h && d[((cy + iy) * w + cx) * 4 + 3] < 100) iy++;
      return {dx: (R - L) / 2, dy: (A - D) / 2, ix: ix || (L + R) * 0.3, iy: iy || (A + D) * 0.3};
    }
    function measureZoom(){
      if(!zoom || !zO) return;
      zOn = getComputedStyle(zPin).position === 'sticky';
      zTitle.style.transform = 'none';
      var h2 = zO.closest('.big'), cs = getComputedStyle(h2);
      var g = letterHole(cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily);
      var pr = zPin.getBoundingClientRect(), orc = zO.getBoundingClientRect();
      var probe = document.createElement('i'); probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      zO.parentNode.appendChild(probe); var base = probe.getBoundingClientRect().top; probe.parentNode.removeChild(probe);
      zA = {x: orc.left - pr.left + g.dx, y: base - pr.top - g.dy};
      zR = {x: g.ix * 0.97, y: g.iy * 0.97};
      zW = zPin.clientWidth; zH = zPin.clientHeight;
      zTitle.style.setProperty('--ox', zA.x.toFixed(1) + 'px'); zTitle.style.setProperty('--oy', zA.y.toFixed(1) + 'px');
      // big enough that the hole of the letter covers the whole screen
      zMax = Math.sqrt(Math.pow(zW / 2 / zR.x, 2) + Math.pow(zH / 2 / zR.y, 2)) * 1.04;
      if(!zOn){ zTitle.style.transform = zTitle.style.opacity = zTitle.style.visibility = ''; zPortal.style.clipPath = ''; }
    }
    function revealPortal(){
      if(pzIn) return; pzIn = true;
      zPz.forEach(function(el){ el.classList.add('in'); });
    }
    measureZoom(); addEventListener('resize', measureZoom);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(measureZoom);

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
      // Projects: the camera flies into the "o", the hole opens up and the project comes out of it
      if(zoom && zO){
        var zr = zoom.getBoundingClientRect();
        if(!zOn){ if(zPortal.getBoundingClientRect().top < innerHeight * 0.88) revealPortal(); }
        else if(zr.bottom > -50 && zr.top < innerHeight + 50){
          var zp = clamp(-zr.top / Math.max(1, zr.height - innerHeight));
          var z = clamp((zp - 0.06) / 0.72), ez = z * z * z * (z * (z * 6 - 15) + 10);
          var s = Math.exp(Math.log(zMax) * ez), q = clamp(ez / 0.4); q = q * q * (3 - 2 * q);
          var cx = zA.x + (zW / 2 - zA.x) * q, cy = zA.y + (zH / 2 - zA.y) * q;
          zTitle.style.transform = 'translate(' + (cx - zA.x).toFixed(1) + 'px,' + (cy - zA.y).toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
          zTitle.style.visibility = z >= 1 ? 'hidden' : '';
          var rx = zR.x * s, ry = zR.y * s;
          zPortal.style.clipPath = z >= 1 ? 'none' : 'ellipse(' + rx.toFixed(1) + 'px ' + ry.toFixed(1) + 'px at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px)';
          var pc = clamp((z - 0.38) / 0.48); pc = pc * pc * (3 - 2 * pc);
          zPortal.style.setProperty('--pc', pc.toFixed(3));
          zPortal.style.setProperty('--cx', cx.toFixed(1) + 'px'); zPortal.style.setProperty('--cy', cy.toFixed(1) + 'px');
          zPortal.style.setProperty('--gr', Math.min(Math.max(rx, ry) * 1.05, Math.max(zW, zH) * 0.42).toFixed(1) + 'px');
          zPortal.style.setProperty('--ga', (0.2 - pc * 0.1).toFixed(3));
          if(pc > 0.15) revealPortal();
        }
      }
      // showcase: every window has its own way in (turn, drum roll or spin, from the left or the right),
      // faces you in the middle of the screen and leaves the opposite way
      var vw = document.documentElement.clientWidth;
      for(var w = 0; w < rows.length; w++){
        var row = rows[w], m = macs[w], rr = row.getBoundingClientRect();
        if(rr.bottom < -innerHeight || rr.top > innerHeight * 2){ m.style.setProperty('--op', 0); continue; }
        var stacked = vw <= 980, tx = texts[w];   // on phones the text sits under its window, so each follows its own centre
        var mc = stacked ? rr.top + m.offsetHeight / 2 : rr.top + rr.height / 2;
        var k = clamp((mc - innerHeight / 2) / (innerHeight * 0.8), -1, 1);   // +1 coming in from below, -1 leaving at the top
        var a = Math.max(0, Math.abs(k) - 0.14) / 0.86, e = (k < 0 ? -1 : 1) * a * a * (3 - 2 * a);   // flat for a while in the middle
        var fx = row.dataset.fx || 'turn', d = row.dataset.from === 'left' ? -1 : 1, ae = Math.abs(e), f;
        if(fx === 'drum') f = {tx: 0, ty: e * innerHeight * 0.16, tz: -ae * 380, ry: 0, rx: -e * 64, rz: 0, sc: 1 - ae * 0.08};
        else if(fx === 'spin') f = {tx: e * d * vw * 0.3, ty: e * 70, tz: -ae * 620, ry: -e * d * 38, rx: ae * 8, rz: -e * d * 32, sc: 1 - ae * 0.3};
        else f = {tx: e * d * vw * 0.42, ty: e * 40, tz: -ae * 420, ry: -e * d * 78, rx: ae * 6, rz: -e * d * 3, sc: 1 - ae * 0.12};
        m.style.setProperty('--tx', f.tx.toFixed(1) + 'px');
        m.style.setProperty('--tz', f.tz.toFixed(1) + 'px');
        m.style.setProperty('--ty', f.ty.toFixed(1) + 'px');
        m.style.setProperty('--ry', f.ry.toFixed(2) + 'deg');
        m.style.setProperty('--rx', f.rx.toFixed(2) + 'deg');
        m.style.setProperty('--rz', f.rz.toFixed(2) + 'deg');
        m.style.setProperty('--sc', f.sc.toFixed(4));
        m.style.setProperty('--op', (1 - Math.pow(Math.abs(e), 3) * 0.85).toFixed(3));
        // the text steps aside while its window spins past it, and is fully there once the window faces you
        if(tx){
          var kt = stacked ? clamp(((rr.bottom - tx.offsetHeight / 2) - innerHeight / 2) / (innerHeight * 0.8), -1, 1) : k;
          var tq = clamp((Math.abs(kt) - 0.3) / 0.45), ts = tq * tq * (3 - 2 * tq);
          tx.style.setProperty('--top', (1 - ts * 0.9).toFixed(3));
          tx.style.setProperty('--ttx', (fx === 'drum' ? 0 : (kt < 0 ? -1 : 1) * d * ts * Math.min(70, vw * 0.05)).toFixed(1) + 'px');
        }
        if(Math.abs(k) < 0.3){ var sc0 = m.querySelector('.screen'); if(sc0 && !sc0.classList.contains('on')) sc0.classList.add('on'); }
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
