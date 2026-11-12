(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const getJSON = u => fetch(u, { cache: 'no-cache' }).then(r => { if (!r.ok) throw 0; return r.json(); }).catch(() => null);
  $('#year').textContent = new Date().getFullYear();

  // Portrait fallback until assets/img/profile.webp exists
  const img = $('.portrait img');
  img.addEventListener('error', () => {
    const ph = Object.assign(document.createElement('div'), { className: 'ph', textContent: 'KZ' });
    ph.setAttribute('role', 'img'); ph.setAttribute('aria-label', 'Initials KZ');
    img.replaceWith(ph);
  });

  // Timeline trace fills while scrolling
  const tls = $$('.timeline');
  const root = document.documentElement;
  const trace = () => {
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--sp', (max > 0 ? Math.min(1, scrollY / max) : 0).toFixed(3));
    drawTimelines();
  };
  const drawTimelines = () => tls.forEach(tl => {
    const r = tl.getBoundingClientRect();
    tl.style.setProperty('--p', Math.max(0, Math.min(1, (innerHeight * 0.65 - r.top) / r.height)).toFixed(3));
  });
  addEventListener('scroll', trace, { passive: true });
  addEventListener('resize', trace);
  trace();

  // Dialogs
  const pd = $('#pd'), pbody = $('#pbody'), vw = $('#viewer'), stage = $('#stage'), cap = $('#caption');
  $$('dialog').forEach(d => {
    d.addEventListener('click', e => { if (e.target === d || e.target.dataset.close !== undefined) d.close(); });
  });
  vw.addEventListener('close', () => { stage.innerHTML = ''; });
  pd.addEventListener('close', () => { if (/^#[pa]-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); });

  const view = (item) => {
    stage.innerHTML = '';
    const t = item.type || (/\.pdf$/i.test(item.src) ? 'pdf' : 'image');
    let el;
    if (t === 'video') el = Object.assign(document.createElement('video'), { src: item.src, controls: true, autoplay: true });
    else if (t === 'drive') el = Object.assign(document.createElement('iframe'), { src: item.src, title: item.caption || 'Drive media', allow: 'autoplay' });
    else if (t === 'pdf') { el = Object.assign(document.createElement('iframe'), { src: item.src, title: item.caption || 'Document' }); el.className = 'pdf'; }
    else el = Object.assign(document.createElement('img'), { src: item.src, alt: item.caption || '' });
    stage.append(el);
    if (item.link) stage.insertAdjacentHTML('beforeend', `<p class="vlink"><a href="${esc(item.link)}" target="_blank" rel="noopener">Open credential</a></p>`);
    cap.textContent = item.caption || '';
    vw.showModal();
  };

  const tile = (item) => {
    const b = document.createElement('button');
    b.className = 'tile';
    b.setAttribute('aria-label', 'Open: ' + (item.caption || item.type));
    if (item.type === 'video') b.innerHTML = `<video src="${esc(item.src)}#t=0.5" preload="metadata" muted playsinline></video><span class="tag">Video</span>`;
    else if (item.type === 'drive') { b.classList.add('drive'); b.textContent = item.caption || 'Open from Google Drive'; }
    else b.innerHTML = `<img src="${esc(item.src)}" alt="${esc(item.caption)}" loading="lazy">`;
    b.addEventListener('click', () => view(item));
    return b;
  };

  // Sideways slider for any list of photos/videos
  const norm = (x, label) => typeof x === 'string'
    ? { type: /\.(mp4|webm|mov)$/i.test(x) ? 'video' : 'image', src: x, caption: label } : x;
  const carousel = (items, label = 'Media') => {
    const wrap = document.createElement('div');
    wrap.className = 'car' + (items.length < 2 ? ' single' : '');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-roledescription', 'carousel');
    wrap.setAttribute('aria-label', label);
    const frame = document.createElement('div'); frame.className = 'frame';
    const track = document.createElement('div'); track.className = 'track';
    items.forEach(it => {
      const s = tile(it); s.classList.add('slide');
      if (it.caption && it.caption !== label) s.insertAdjacentHTML('beforeend', `<span class="cap">${esc(it.caption)}</span>`);
      track.append(s);
    });
    frame.append(track); wrap.append(frame);
    if (items.length > 1) {
      const slides = [...track.children];
      const btn = (cls, txt, aria) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = txt; b.setAttribute('aria-label', aria); return b; };
      const prev = btn('cnav prev', '‹', 'Previous'), next = btn('cnav next', '›', 'Next');
      const dots = document.createElement('div'); dots.className = 'dots';
      const go = i => track.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' });
      const dotEls = slides.map((_, i) => { const d = btn('dot', '', `Go to item ${i + 1}`); d.addEventListener('click', () => go(i)); dots.append(d); return d; });
      const idx = () => {
        if (track.scrollWidth > track.clientWidth + 2 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) return slides.length - 1;
        return slides.reduce((b, s, i) => Math.abs(s.offsetLeft - track.scrollLeft) < Math.abs(slides[b].offsetLeft - track.scrollLeft) ? i : b, 0);
      };
      const sync = () => { const i = idx(); dotEls.forEach((d, k) => d.setAttribute('aria-current', k === i)); prev.disabled = i === 0; next.disabled = i === slides.length - 1; };
      prev.addEventListener('click', () => go(Math.max(0, idx() - 1)));
      next.addEventListener('click', () => go(Math.min(slides.length - 1, idx() + 1)));
      track.addEventListener('scroll', sync, { passive: true });
      frame.append(prev, next); wrap.append(dots); sync();
    }
    return wrap;
  };

  // Projects
  let projects = [], awards = [];
  const showProject = (p) => {
    const list = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
    pbody.innerHTML = `
      <p class="when">${esc([p.event, p.period].filter(Boolean).join(', '))}</p>
      <h2 id="pt">${esc(p.title)}</h2>
      <p class="role"><em>${esc(p.role)}</em></p>
      ${p.result ? `<p class="result">${esc(p.result)}</p>` : ''}
      ${p.demo ? `<div class="demo">${p.demo.type === 'drive' ? `<iframe src="${esc(p.demo.src)}" title="Demo video" allow="autoplay" allowfullscreen></iframe>` : `<video src="${esc(p.demo.src)}" ${p.demo.poster ? `poster="${esc(p.demo.poster)}"` : ''} controls preload="metadata" playsinline></video>`}</div>` : ''}
      <h3>Overview</h3><p>${esc(p.summary)}</p>
      ${p.contributions?.length ? `<h3>What I did</h3><ul>${list(p.contributions)}</ul>` : ''}
      ${p.stack?.length ? `<h3>Stack</h3><ul class="chips">${list(p.stack)}</ul>` : ''}
      ${p.media?.length ? `<h3>Media</h3><div id="pm"></div>` : ''}
      ${p.links?.length ? `<p class="plinks">${p.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p>` : ''}`;
    const pm = $('#pm', pbody);
    if (pm) pm.replaceWith(carousel(p.media, p.title));
    pd.showModal();
    pd.scrollTop = 0;
    history.replaceState(null, '', '#p-' + p.id);
  };

  const showAward = async (a) => {
    const ok = a.certificate ? await fetch(a.certificate, { method: 'HEAD' }).then(r => r.ok).catch(() => false) : false;
    const pdf = /\.pdf$/i.test(a.certificate || '');
    const cert = !a.certificate ? '' : ok
      ? `<h3>Certificate</h3>${pdf ? `<iframe class="pdf" src="${esc(a.certificate)}" title="Certificate"></iframe>` : `<img src="${esc(a.certificate)}" alt="Certificate for ${esc(a.title)}">`}`
      : `<h3>Certificate</h3><p class="note">Certificate file not added yet. Put it at <em>${esc(a.certificate)}</em>.</p>`;
    pbody.innerHTML = `
      <p class="when">${esc(a.date)}</p>
      <h2 id="pt">${esc(a.title)}</h2>
      <p class="role"><em>${esc(a.event)}</em></p>
      ${a.note ? `<p>${esc(a.note)}</p>` : ''}
      ${cert}
      ${a.photos?.length ? `<h3>Photos</h3><div id="pm"></div>` : ''}
      ${a.link ? `<p class="plinks"><a href="${esc(a.link)}" target="_blank" rel="noopener">Open credential</a></p>` : ''}`;
    const pm = $('#pm', pbody);
    if (pm) pm.replaceWith(carousel(a.photos.map(x => norm(x, a.title)), a.title));
    pd.showModal();
    pd.scrollTop = 0;
    history.replaceState(null, '', '#a-' + a.id);
  };

  // Education / Experience entries open a detail popup
  const showEntry = (li, d = {}) => {
    const card = $('.glass', li), title = $('h3', card).textContent;
    const photos = (Array.isArray(d) ? d : d.photos || []).map(x => norm(x, title));
    const hl = Array.isArray(d) ? [] : d.highlights || [];
    pbody.innerHTML = `
      <p class="when">${esc($('time', li).textContent)}</p>
      <h2 id="pt">${esc(title)}</h2>
      <p class="role"><em>${$('.org', card).innerHTML}</em></p>
      ${$$('p:not(.org)', card).map(p => `<p>${p.innerHTML}</p>`).join('')}
      ${hl.length ? `<h3>Details</h3><ul>${hl.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${photos.length ? `<h3>Photos</h3><div id="pm"></div>` : ''}`;
    const pm = $('#pm', pbody);
    if (pm) pm.replaceWith(carousel(photos, title));
    pd.showModal();
    pd.scrollTop = 0;
  };

  const renderProjects = () => {
    const ul = $('#plist');
    ul.innerHTML = '';
    projects.forEach(p => {
      const li = document.createElement('li');
      li.dataset.tags = (p.tags || []).join(' ');
      li.innerHTML = `<button class="card glass" aria-haspopup="dialog">
        ${p.cover ? `<img class="cover" src="${esc(p.cover)}" alt="" loading="lazy">` : ''}
        <span class="t">${esc(p.title)}</span>
        <span class="when">${esc([p.event, p.period].filter(Boolean).join(', '))}</span>
        <span class="role">${esc(p.role)}</span>
        <span class="sum">${esc(p.tagline)}</span>
        <span class="more">View details</span></button>`;
      $('button', li).addEventListener('click', () => showProject(p));
      ul.append(li);
    });
  };

  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f;
    $$('#plist li').forEach(li => { li.hidden = f !== 'all' && !li.dataset.tags.split(' ').includes(f); });
  }));

  // Media: gallery, certificates, documents
  Promise.all([getJSON('data/projects.json'), getJSON('data/media.json'), getJSON('data/experience.json')]).then(([pj, md, ex]) => {
    projects = pj || [];
    renderProjects();
    const { gallery = [], certificates = [], documents = [] } = md || {};
    awards = (md && md.awards) || [];
    if (gallery.length) {
      $('#gallery').hidden = false; $('#nav-gallery').hidden = false;
      gallery.forEach(g => $('#grid').append(tile(g)));
    }
    // Journey entries: click to open details (+ photo slider from data/experience.json)
    $$('#experience .entry').forEach(li => {
      const card = $('.glass', li), d = (ex || {})[li.dataset.id] || {};
      const n = (Array.isArray(d) ? d : d.photos || []).length;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-haspopup', 'dialog');
      card.insertAdjacentHTML('beforeend', `<span class="more">View details${n ? `, ${n} photo${n > 1 ? 's' : ''}` : ''}</span>`);
      card.addEventListener('click', () => showEntry(li, d));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showEntry(li, d); } });
    });
    awards.forEach(a => {
      const li = document.createElement('li');
      li.innerHTML = `<button aria-haspopup="dialog"><div><strong>${esc(a.title)}</strong>, ${esc(a.event)}</div><span>${esc(a.date)}</span></button>`;
      $('button', li).addEventListener('click', () => showAward(a));
      $('#awards').append(li);
    });
    certificates.forEach(c => {
      const li = document.createElement('li');
      const href = c.link || c.file;
      li.innerHTML = `<a class="row" href="${esc(href)}" target="_blank" rel="noopener">${esc(c.title)}<span>${esc(c.issuer)}</span></a>`;
      $('#certs').append(li);
    });
    documents.forEach(d => {
      const li = document.createElement('li');
      li.innerHTML = `<a class="row" href="${esc(d.file)}" target="_blank" rel="noopener">${esc(d.title)}<span>${esc(d.note || '')}</span></a>`;
      $('#docs').append(li);
    });
    const m = location.hash.match(/^#([pa])-(.+)$/);
    if (m) {
      const hit = (m[1] === 'p' ? projects : awards).find(x => x.id === m[2]);
      if (hit) (m[1] === 'p' ? showProject : showAward)(hit);
    }
  });
})();