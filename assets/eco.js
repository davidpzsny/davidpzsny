/* The live pieces around the website (stream chat, X feed, Discord bot, automation log) and the contact form.
   Each demo runs only while it is on screen; with reduced motion they show one finished state. */
(function(){
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var B = function(id){ return 'https://static-cdn.jtvnw.net/badges/v1/' + id + '/2'; };
  var LOGO = 'assets/badgedb-logo.png';
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var BADGES = [
    ['Golden Iguana', '62c3816a-87d6-4ca0-bce0-fca6bcfa719f'], ['RuneScape Santa Hat', '2bee9264-647c-4bdc-921f-cb5e651b1c64'],
    ['Minecraft Golden Frog', '8d2de51b-76ac-4680-89c8-89e710663b09'], ['Gallica', 'd2adf631-2045-4246-9c34-201487e809ae'],
    ['RuneScape Bones', '95507c79-f87e-4a0d-9940-92af830b3b36'], ['Warrior Jar Alexander', 'a080167b-6264-404b-b9b1-e5a68348299f'],
    ['DOOM: The Dark Ages', '80e404b7-673b-4ca8-ab69-1779f9685eec'], ['Purple Chain', '07fdf1d1-f160-4415-821e-391a90852db6']];

  // run a demo only while its card is visible
  function whileVisible(el, start, stop){
    if(!el) return;
    if(still || !('IntersectionObserver' in window)){ start(true); return; }
    new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? start(false) : stop(); }); }, { threshold: 0.2 }).observe(el);
  }
  function timers(){ var list = []; return { add: function(fn, ms){ list.push(setTimeout(fn, ms)); }, clear: function(){ list.forEach(clearTimeout); list = []; } }; }

  /* ---------- stream chat ---------- */
  (function(){
    var card = document.querySelector('[data-eco="stream"]'), box = card && card.querySelector('.tw-msgs'); if(!box) return;
    var lines = [
      ['mira_', '#ff7ab6', '!badges'],
      ['StreamElements', '#a970ff', 'Active now: GTA VI (watch 1h a day), PAYDAY 3, DOOM: The Dark Ages and more. Full list on badgedatabase.com', 1],
      ['kovi', '#4ade80', 'how do i get the golden iguana?'],
      ['StreamElements', '#a970ff', 'Golden Iguana: collect every GTA VI badge and emote. Ends Dec 1.', 1],
      ['nightowl', '#facc15', 'just got the purple chain 🎉'],
      ['tomsk', '#60a5fa', '!soon'],
      ['StreamElements', '#a970ff', 'Coming up: Questline 4: Path of Shadows (Dec 1), TwitchCon 2027 Berlin.', 1],
      ['ari', '#f472b6', 'this overlay is so clean']];
    var i = 0, t = null;
    function push(){
      var l = lines[i++ % lines.length], p = document.createElement('p');
      if(l[3]) p.className = 'bot';
      p.innerHTML = '<b style="color:' + l[1] + '">' + esc(l[0]) + '</b>: ' + esc(l[2]);
      box.appendChild(p); while(box.children.length > 7) box.removeChild(box.firstChild);
    }
    whileVisible(card, function(once){ if(once){ for(var k = 0; k < 6; k++) push(); return; } if(t) return; if(!box.children.length){ push(); push(); } t = setInterval(push, 1900); },
                       function(){ clearInterval(t); t = null; });
  })();

  /* ---------- X feed ---------- */
  (function(){
    var card = document.querySelector('[data-eco="x"]'), feed = card && card.querySelector('.xfeed'); if(!feed) return;
    var i = 0, t = null, mins = [1, 4, 9, 15, 23, 31];
    function post(animate){
      var b = BADGES[i++ % BADGES.length], el = document.createElement('div');
      el.className = 'xp'; if(!animate) el.style.animation = 'none';
      el.innerHTML = '<img src="' + LOGO + '" alt=""><div class="xp-m"><div class="xp-h"><b>Badge Database</b>@BadgeDatabase · now</div>' +
        '<div class="xp-t">Twitch global badge added: <b>' + esc(b[0]) + '</b></div>' +
        '<div class="xp-card"><img src="' + B(b[1]) + '" alt=""><span><small>New Twitch global badge</small><b>' + esc(b[0]) + '</b></span></div></div>';
      feed.insertBefore(el, feed.firstChild);
      [].slice.call(feed.querySelectorAll('.xp-h')).forEach(function(h, k){ if(k) h.innerHTML = h.innerHTML.replace(/· .*$/, '· ' + mins[Math.min(k, mins.length - 1)] + 'm'); });
      while(feed.children.length > 5) feed.removeChild(feed.lastChild);
    }
    for(var k = 0; k < 3; k++) post(false);
    whileVisible(card, function(once){ if(once || t) return; t = setInterval(function(){ post(true); }, 3200); }, function(){ clearInterval(t); t = null; });
  })();

  /* ---------- Discord bot ---------- */
  (function(){
    var card = document.querySelector('[data-eco="discord"]'), body = card && card.querySelector('.dc-body'), typed = card && card.querySelector('.dc-typed'); if(!body) return;
    var row = function(img, name, right){ return '<div><img src="' + B(img) + '" alt="">' + esc(name) + '<em>' + esc(right) + '</em></div>'; };
    var script = [
      ['nightowl', '/active', 'Active badges', row(BADGES[7][1], 'Grand Theft Auto VI', '6d left') + row('8346da26-6494-4edb-945d-63a50a6e416b', 'PAYDAY 3', '18h left') + row(BADGES[6][1], 'DOOM: The Dark Ages', '17d left')],
      ['mira_', '/soon', 'Coming up', row(BADGES[5][1], 'Questline 4: Path of Shadows', 'Dec 1') + row(BADGES[1][1], 'RuneScape Santa Hat', 'December')],
      ['kovi', '/badge golden iguana', 'Golden Iguana', row(BADGES[0][1], 'Collect every GTA VI badge and emote', 'Sub') + '<div>Ends Dec 1, 07:59 UTC</div>']];
    var T = timers(), step = 0, running = false;
    function add(html){ var m = document.createElement('div'); m.className = 'dc-m'; m.innerHTML = html; body.appendChild(m); while(body.children.length > 4) body.removeChild(body.firstChild); }
    function exchange(s, instant){
      add('<span class="dc-av">' + esc(s[0][0].toUpperCase()) + '</span><div><div class="dc-n">' + esc(s[0]) + '</div><span class="dc-cmd">' + esc(s[1]) + '</span></div>');
      var reply = function(){ add('<span class="dc-av"><img src="' + LOGO + '" alt=""></span><div><div class="dc-n">Badge Database<i>APP</i></div><div class="dc-embed"><b>' + esc(s[2]) + '</b>' + s[3] + '</div></div>'); };
      instant ? reply() : T.add(reply, 650);
    }
    function run(){
      var s = script[step++ % script.length], k = 0;
      (function type(){
        if(!running) return;
        if(k <= s[1].length){ typed.textContent = s[1].slice(0, k++); T.add(type, 70); return; }
        T.add(function(){ typed.textContent = ''; exchange(s); T.add(run, 3400); }, 350);
      })();
    }
    whileVisible(card, function(once){
      if(once){ exchange(script[0], true); return; }
      if(running) return; running = true; if(!body.children.length) exchange(script[2], true); T.add(run, 600);
    }, function(){ running = false; T.clear(); typed.textContent = ''; });
  })();

  /* ---------- automation log ---------- */
  (function(){
    var card = document.querySelector('[data-eco="ci"]'), box = card && card.querySelector('.term-body'); if(!box) return;
    var T = timers(), run = 5403, nb = 0, running = false;
    var pad = function(n){ return String(n).padStart(2, '0'); };
    function lines(){
      var b = BADGES[nb++ % BADGES.length][0], now = new Date(), m = Math.floor(now.getUTCMinutes() / 15) * 15;
      return [
        ['head', '▶ Run #' + (run++).toLocaleString('en-US') + '  <span class="dim">· ' + pad(now.getUTCHours()) + ':' + pad(m) + ' UTC</span>'],
        ['ok', '✓ 458 global badge sets checked'],
        ['add', '+ New badge: ' + esc(b)],
        ['ok', '✓ Details filled in: objective, category, dates'],
        ['ok', '✓ 471 pages rebuilt · sitemap updated'],
        ['ok', '✓ Posted to X with a generated image'],
        ['ok', '✓ Discord server events synced'],
        ['ok', '✓ Deployed to badgedatabase.com'],
        ['dim', 'next run in <span class="nx">15:00</span>']];
    }
    function print(list, k, instant){
      if(k >= list.length){ if(!instant) countdown(15 * 60); return; }
      var p = document.createElement('p'); p.className = list[k][0]; p.innerHTML = list[k][1]; box.appendChild(p);
      instant ? print(list, k + 1, true) : T.add(function(){ print(list, k + 1); }, k === 0 ? 500 : 420 + Math.random() * 260);
    }
    function countdown(s){
      var nx = box.querySelector('.nx'); if(!nx || !running) return;
      if(s <= 0){ T.add(function(){ box.innerHTML = ''; print(lines(), 0); }, 300); return; }
      nx.textContent = Math.floor(s / 60) + ':' + pad(s % 60);
      T.add(function(){ countdown(s - 37); }, 60);              // a quarter hour, fast forwarded
    }
    whileVisible(card, function(once){
      if(once){ print(lines(), 0, true); return; }
      if(running) return; running = true; box.innerHTML = ''; print(lines(), 0);
    }, function(){ running = false; T.clear(); });
  })();

  /* ---------- contact form (Formspree) ---------- */
  (function(){
    var form = document.getElementById('contactForm'); if(!form) return;
    var note = form.querySelector('.f-note'), btn = form.querySelector('.f-send'), label = form.querySelector('.f-label');
    var say = function(t, err){ note.textContent = t; note.className = 'f-note' + (err ? ' err' : ''); };
    form.addEventListener('input', function(e){ var f = e.target.closest('.f-field'); if(f) f.classList.remove('bad'); });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email, msg = form.elements.message, bad = [];
      if(!name.value.trim()) bad.push(name);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if(msg.value.trim().length < 10) bad.push(msg);
      bad.forEach(function(el){ el.closest('.f-field').classList.add('bad'); });
      if(bad.length){ say('Please fill in your name, a valid email and a few words about the project.', true); bad[0].focus(); return; }
      if(form.elements._gotcha.value){ form.classList.add('sent'); return; }            // a bot filled the hidden field
      var endpoint = form.dataset.endpoint;
      if(!endpoint){ say('Sending is not switched on yet. Please try again a little later.', true); return; }
      btn.disabled = true; label.textContent = 'Sending…'; say('');
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function(r){ if(!r.ok) throw new Error(r.status); form.classList.add('sent'); form.reset(); })
        .catch(function(){ say('Something went wrong. Please try again in a minute.', true); })
        .then(function(){ btn.disabled = false; label.textContent = 'Send message'; });
    });
  })();
})();
