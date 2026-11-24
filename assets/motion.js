/* Scroll motion: elements with .rv fade up when they come into view, and the "Projects" intro draws the
   Badge Database logo as you scroll through it. Nothing moves for visitors who prefer reduced motion. */
(function(){
  var root = document.documentElement;
  if(!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){ root.classList.remove('js'); return; }
  root.classList.add('anim');

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });

  var intro = document.getElementById('intro'); if(!intro) return;
  var ring = intro.querySelector('.m-ring');
  var clamp = function(x){ return Math.min(1, Math.max(0, x)); };
  var seg = function(p, a, b){ return clamp((p - a) / (b - a)); };
  var out3 = function(t){ return 1 - Math.pow(1 - t, 3); };
  var back = function(t){ var c1 = 1.70158, c3 = c1 + 1; return t <= 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  var queued = false;
  function update(){
    queued = false;
    var r = intro.getBoundingClientRect(), lead = innerHeight * 0.5, run = intro.offsetHeight - innerHeight;
    var p = clamp((lead - r.top) / (run + lead));               // 0 when the intro is half way up the screen, 1 when it lets go
    var v = { ring: out3(seg(p, 0.02, 0.44)), b: out3(seg(p, 0.32, 0.58)), dot: back(seg(p, 0.54, 0.68)),
              word: out3(seg(p, 0.28, 0.58)), sub: out3(seg(p, 0.62, 0.80)) };
    for(var k in v) intro.style.setProperty('--' + k, v[k].toFixed(4));
    if(ring) ring.style.strokeDashoffset = (1 - v.ring).toFixed(4);
  }
  function queue(){ if(!queued){ queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
})();
