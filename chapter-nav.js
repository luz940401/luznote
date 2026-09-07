/* One chapter hierarchy, two ways to navigate it. Reading never moves map nodes. */
(() => {
  const isMap = !!document.getElementById('map-wrap');
  const mobile = () => matchMedia('(max-width:900px)').matches;
  const openIds = new Set();
  let selected = '', query = '', signature = '', frame = 0, hashFocused = false;
  const body = document.body;
  body.classList.add('has-chapter-nav');
  if (localStorage.getItem('adventure-chapter-collapsed') === '1') body.classList.add('chapter-collapsed');
  const toggle = document.createElement('button');
  toggle.className = 'chapter-toggle'; toggle.textContent = '☰ 目錄'; toggle.setAttribute('aria-controls','chapter-nav');
  document.querySelector('header').prepend(toggle);
  const shade = document.createElement('button'); shade.className = 'chapter-shade'; shade.setAttribute('aria-label','關閉目錄');
  const nav = document.createElement('nav'); nav.id = 'chapter-nav'; nav.className = 'chapter-nav'; nav.setAttribute('aria-label','章節目錄');
  nav.innerHTML = '<div class="chapter-head">章節目錄<button class="chapter-close" aria-label="收起目錄">×</button></div><input class="chapter-search" aria-label="搜尋章節標題" placeholder="搜尋章節標題…"><div class="chapter-list"></div>';
  body.append(shade,nav);
  const list = nav.querySelector('.chapter-list');
  function state() {
    const modal=mobile()&&body.classList.contains('chapter-open');
    toggle.setAttribute('aria-expanded', String(mobile() ? modal : !body.classList.contains('chapter-collapsed')));
    document.querySelectorAll('body>header,body>main,body>#map-wrap').forEach(el=>el.inert=modal);
    if(modal){nav.setAttribute('role','dialog');nav.setAttribute('aria-modal','true');}
    else{nav.removeAttribute('role');nav.removeAttribute('aria-modal');}
  }
  function close() {
    if (mobile()) body.classList.remove('chapter-open');
    else { body.classList.add('chapter-collapsed'); localStorage.setItem('adventure-chapter-collapsed','1'); }
    state(); toggle.focus({preventScroll:true});
  }
  toggle.onclick = () => {
    if (mobile()) body.classList.toggle('chapter-open');
    else { body.classList.toggle('chapter-collapsed'); localStorage.setItem('adventure-chapter-collapsed',body.classList.contains('chapter-collapsed')?'1':'0'); }
    state(); if (mobile() && body.classList.contains('chapter-open')) nav.querySelector('input').focus();
  };
  shade.onclick = close; nav.querySelector('.chapter-close').onclick = close;
  document.addEventListener('keydown',e => {
    if(!mobile()||!body.classList.contains('chapter-open'))return;
    if(e.key==='Escape')close();
    if(e.key==='Tab'){
      const items=[...nav.querySelectorAll('button:not(:disabled),input,a[href]')];
      const first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  nav.querySelector('input').oninput = e => { query = e.target.value.trim().toLocaleLowerCase(); draw(); };
  function mark(id) {
    selected=id;
    list.querySelectorAll('.chapter-link').forEach(a => { if(a.dataset.nodeId===id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current'); });
  }
  function go(id) {
    if(!nodes[id])return;
    if(mobile())close();
    if(isMap){
      const pos=positions[id],wrap=document.getElementById('map-wrap');
      if(!pos)return;
      document.querySelectorAll('.chapter-focus').forEach(el=>el.classList.remove('chapter-focus'));
      const el=document.querySelector(`.node[data-node-id="${id}"]`);
      const width=el?.offsetWidth||210,height=el?.offsetHeight||84;
      wrap.scrollTo({left:Math.max(0,(pos.x+width/2)*zoom-wrap.clientWidth/2),top:Math.max(0,(pos.y+height/2)*zoom-wrap.clientHeight/2),behavior:'instant'});
      if(el){el.classList.add('chapter-focus');el.focus({preventScroll:true});setTimeout(()=>el.classList.remove('chapter-focus'),1800);}
      history.replaceState(null,'','#node='+encodeURIComponent(id));
    }else{
      const cleared=!!(searchQuery||typeFilter||statusFilter);
      searchQuery='';typeFilter='';statusFilter='';
      document.getElementById('search-inp').value='';
      document.getElementById('type-filter').value='';document.getElementById('status-filter').value='';
      document.getElementById('search-clear').style.display='none';
      document.getElementById('search-info').style.display='none';
      history.replaceState(null,'','#node='+encodeURIComponent(id));focusNode(id);
      if(cleared){
        const notice=document.createElement('div');notice.className='chapter-notice';notice.setAttribute('role','status');notice.textContent='已清除搜尋與篩選，顯示選取的筆記';body.append(notice);setTimeout(()=>notice.remove(),3000);
      }
    }
    mark(id);
  }
  function draw(){
    list.replaceChildren();
    function matches(id,seen=new Set()){
      if(seen.has(id)||!nodes[id])return false;seen.add(id);
      return nodes[id].title.toLocaleLowerCase().includes(query)||(nodes[id].children||[]).some(c=>matches(c,seen));
    }
    function row(id,parent,seen=new Set()){
      if(!nodes[id]||seen.has(id)||(query&&!matches(id)))return;
      const trail=new Set(seen);trail.add(id);const n=nodes[id],kids=(n.children||[]).filter(c=>nodes[c]&&!trail.has(c));
      const wrap=document.createElement('div'),line=document.createElement('div');line.className='chapter-row';
      const arrow=document.createElement('button');arrow.className='chapter-arrow';
      const expanded=!!query||openIds.has(id);arrow.textContent=kids.length?(expanded?'▾':'▸'):'';
      if(kids.length){arrow.setAttribute('aria-label',(expanded?'收合':'展開')+n.title);arrow.setAttribute('aria-expanded',String(expanded));arrow.onclick=()=>{expanded?openIds.delete(id):openIds.add(id);draw();};}
      else{arrow.disabled=true;arrow.setAttribute('aria-hidden','true');}
      const a=document.createElement('a');a.className='chapter-link';a.href='#node='+encodeURIComponent(id);a.dataset.nodeId=id;a.textContent=n.title||'未命名章節';a.onclick=e=>{e.preventDefault();go(id);};
      line.append(arrow,a);wrap.append(line);parent.append(wrap);
      if(expanded){const children=document.createElement('div');children.className='chapter-children';kids.forEach(c=>row(c,children,trail));wrap.append(children);}
    }
    rootIds.forEach(id=>row(id,list));
    if(!list.children.length){const empty=document.createElement('p');empty.className='chapter-empty';empty.textContent=query?'找不到符合的章節':'新增主線後，章節會出現在這裡。';list.append(empty);}
    mark(selected);
  }
  function refresh(){
    const next=JSON.stringify(rootIds.map(id=>id))+JSON.stringify(Object.values(nodes).map(n=>[n.id,n.title,n.children]));
    if(next!==signature){signature=next;draw();}
    if(isMap&&!hashFocused){
      const match=location.hash.match(/^#node=([\w-]+)$/);
      if(match&&positions[match[1]]){hashFocused=true;setTimeout(()=>go(match[1]),100);}
    }
  }
  new MutationObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(refresh);}).observe(document.getElementById(isMap?'map':'tree'),{childList:true,subtree:true});
  if(!isMap){
    let scrolling=false;
    window.addEventListener('scroll',()=>{if(scrolling)return;scrolling=true;requestAnimationFrame(()=>{
      scrolling=false;const top=document.querySelector('header').getBoundingClientRect().bottom+36;
      let active='';for(const id of rootIds){const el=document.querySelector(`.node-wrap[data-id="${id}"]`);if(el&&el.getBoundingClientRect().top<=top)active=id;}
      if(active)mark(active);
    });},{passive:true});
  }
  new ResizeObserver(entries=>{document.documentElement.style.setProperty('--chapter-header',Math.ceil(entries[0].target.getBoundingClientRect().height)+'px');state();}).observe(document.querySelector('header'));
  refresh();state();
})();
