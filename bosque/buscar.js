/* Buscador y barra fija del Oasis: filtra fichas de la página, busca en todas las guías y abre la ficha al llegar por enlace. */
(function(){
  var norm=function(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};
  var css='.bqbar{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-bottom:1px solid var(--line);margin:-26px -16px;padding:8px 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}'+
  '.bqw{position:relative;flex:1;min-width:0}.bqi{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:9px 12px 9px 36px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)}'+
  '.bqi:focus{outline:2px solid var(--accent);outline-offset:1px}.bqw:before{content:"\\1F50D";position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:14px;opacity:.7;pointer-events:none}'+
  '.bqr{position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.15);max-height:60vh;overflow:auto;display:none;padding:4px}.bqr.on{display:block}'+
  '.bqr a{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:8px;text-decoration:none;color:var(--ink)}.bqr a:hover,.bqr a[aria-selected="true"]{background:color-mix(in srgb,var(--accent) 12%,transparent)}'+
  '.bqr .e{font-size:20px;line-height:1.1;flex:none;width:24px;text-align:center}.bqr b{font-family:var(--display);font-size:14.5px;display:block}.bqr small{color:var(--muted);font-size:12.5px;display:block}'+
  '.bqr .h{font-family:var(--display);font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:8px 10px 2px}'+
  '.bqs{position:relative}.bqs>summary{list-style:none;cursor:pointer;font-family:var(--display);font-weight:700;font-size:14px;border:1px solid var(--line);border-radius:10px;padding:9px 12px;background:var(--surface);white-space:nowrap}.bqs>summary::-webkit-details-marker{display:none}'+
  '.bqs nav{position:absolute;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.15);padding:6px;display:flex;flex-direction:column;min-width:220px;max-height:60vh;overflow:auto}.bqs nav a{padding:7px 10px;border-radius:8px;text-decoration:none;color:var(--ink);font-family:var(--display);font-size:14px}.bqs nav a:hover{background:color-mix(in srgb,var(--accent) 12%,transparent)}'+
  '.bqn{flex-basis:100%;font-size:13px;color:var(--muted);font-family:var(--display);margin:0}.bqup{position:fixed;right:14px;bottom:14px;z-index:40;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15);display:none}.bqup.on{display:block}'+
  '.bqhide{display:none!important}mark.bqm{background:color-mix(in srgb,var(--accent) 30%,transparent);color:inherit;border-radius:3px}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  var header=document.querySelector('header');if(!header)return;
  var bar=document.createElement('div');bar.className='bqbar';
  bar.innerHTML='<div class="bqw"><label class="sr" for="bqi" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Buscar</label><input id="bqi" class="bqi" type="search" autocomplete="off" placeholder="Buscar en el Oasis (tecla /)" aria-controls="bqr" aria-expanded="false"><div id="bqr" class="bqr" role="listbox"></div></div>';
  var nav=header.querySelector('.nav');
  if(nav&&nav.querySelectorAll('a[href^="#"]').length>2){var sec=document.createElement('details');sec.className='bqs';sec.innerHTML='<summary>☰ Secciones</summary><nav></nav>';
    nav.querySelectorAll('a').forEach(function(a){var c=a.cloneNode(true);c.addEventListener('click',function(){sec.open=false});sec.querySelector('nav').appendChild(c)});bar.appendChild(sec);
    document.addEventListener('click',function(e){if(!sec.contains(e.target))sec.open=false});}
  header.parentNode.insertBefore(bar,header.nextSibling);
  var info=document.createElement('p');info.className='bqn';info.hidden=true;bar.appendChild(info);
  var inp=bar.querySelector('#bqi'),res=bar.querySelector('#bqr');
  var cards=[].slice.call(document.querySelectorAll('article.of, details.tech, .tile, .ofs > article'));
  var ctext=cards.map(function(c){return norm(c.textContent)});
  var here=location.pathname.replace(/index\.html$/,'');
  var IDX=null,loading=false;
  function load(cb){if(IDX)return cb();if(loading)return;loading=true;fetch('/bosque/buscar.json').then(function(r){return r.json()}).then(function(j){IDX=j;IDX.forEach(function(x){x.n=norm(x.t+' '+x.d+' '+x.k+' '+x.p)});cb()}).catch(function(){IDX=[]})}
  function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var sel=-1;
  function filterPage(words){var n=0;
    cards.forEach(function(c,i){var ok=!words.length||words.every(function(w){return ctext[i].indexOf(w)>=0});c.classList.toggle('bqhide',!ok);if(ok&&c.tagName!=='A')n++});
    document.querySelectorAll('.grpbox,.cat').forEach(function(g){var any=g.querySelector('details.tech:not(.bqhide), .tile:not(.bqhide)');g.classList.toggle('bqhide',words.length>0&&!any)});
    if(words.length){info.hidden=false;info.textContent=n?(n+' ficha'+(n>1?'s':'')+' en esta página'):(cards.length?'Nada en esta página: mira los resultados de otras guías.':'');}else info.hidden=true;}
  function render(q){var words=norm(q).split(/\s+/).filter(Boolean);filterPage(words);
    if(!words.length){res.classList.remove('on');inp.setAttribute('aria-expanded','false');return}
    load(function(){var out=IDX.filter(function(x){return words.every(function(w){return x.n.indexOf(w)>=0})});
      out.sort(function(a,b){var ta=norm(a.t),tb=norm(b.t);var sa=words.every(function(w){return ta.indexOf(w)>=0})?0:1,sb=words.every(function(w){return tb.indexOf(w)>=0})?0:1;return sa-sb});
      var other=out.filter(function(x){return x.u.split('#')[0]!==here}).slice(0,12),same=out.filter(function(x){return x.u.split('#')[0]===here}).slice(0,5);
      var h='';if(same.length)h+='<div class="h">En esta página</div>'+same.map(item).join('');
      if(other.length)h+='<div class="h">En otras guías</div>'+other.map(item).join('');
      if(!h)h='<div class="h">Sin resultados para “'+esc(q)+'”</div>';
      res.innerHTML=h;res.classList.add('on');inp.setAttribute('aria-expanded','true');sel=-1;})}
  function item(x){return '<a role="option" href="'+x.u+'"><span class="e">'+esc(x.e||'•')+'</span><span><b>'+esc(x.t)+'</b><small>'+esc(x.p)+(x.d?' · '+esc(x.d.slice(0,90)):'')+'</small></span></a>'}
  var tm;inp.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(function(){render(inp.value)},120)});
  inp.addEventListener('focus',function(){load(function(){});if(inp.value)render(inp.value)});
  inp.addEventListener('keydown',function(e){var as=res.querySelectorAll('a');
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!as.length)return;sel=(sel+(e.key==='ArrowDown'?1:-1)+as.length)%as.length;as.forEach(function(a,i){a.setAttribute('aria-selected',i===sel)});as[sel].scrollIntoView({block:'nearest'})}
    else if(e.key==='Enter'){if(as.length){e.preventDefault();(as[sel>=0?sel:0]).click()}}
    else if(e.key==='Escape'){inp.value='';render('');inp.blur()}});
  res.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;var u=a.getAttribute('href');if(u.split('#')[0]===here){e.preventDefault();res.classList.remove('on');inp.value='';filterPage([]);history.replaceState(null,'','#'+u.split('#')[1]);openHash()}});
  document.addEventListener('click',function(e){if(!bar.contains(e.target))res.classList.remove('on')});
  document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'&&document.activeElement.tagName!=='SELECT'){e.preventDefault();inp.focus()}});
  function openHash(){if(!location.hash)return;var t;try{t=document.querySelector(decodeURIComponent(location.hash))}catch(e){return}if(!t)return;
    var p=t;while(p){if(p.tagName==='DETAILS')p.open=true;if(p.hidden)p.hidden=false;p=p.parentElement}
    var d=t.querySelector&&t.querySelector(':scope > details');if(d)d.open=true;
    setTimeout(function(){t.scrollIntoView({block:'start'});window.scrollBy(0,-(bar.offsetHeight+8))},60)}
  window.addEventListener('hashchange',openHash);if(location.hash)setTimeout(openHash,80);
  var up=document.createElement('button');up.className='bqup';up.type='button';up.setAttribute('aria-label','Subir al inicio');up.textContent='↑';document.body.appendChild(up);
  up.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});
  window.addEventListener('scroll',function(){up.classList.toggle('on',window.scrollY>900)},{passive:true});
  document.querySelectorAll('section[id],article[id],details[id],h2[id]').forEach(function(el){if(!el.style.scrollMarginTop)el.style.scrollMarginTop='64px'});
})();
