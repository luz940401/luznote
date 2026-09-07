(() => {
  'use strict';
  const $ = id => document.getElementById(id), store = AdventureClues;
  const KEY='adventure-notes-v1', LEGACY='dnd-v3', DIRTY='adventure-notes-dirty', URLKEY='adventure-notes-gs-url', PENDING='adventure-clues-pending';
  let app=store.read(), editing=false, editId='', activeId='', busy=false, visible=[], opened=[], activePage=0;
  let gsUrl=localStorage.getItem(URLKEY)||localStorage.getItem('dnd-gs-url')||'';
  function status(text,error=false){$('sync-status').textContent=text;$('sync-status').classList.toggle('error',error);}
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
  function persist(data){localStorage.setItem(KEY,JSON.stringify(data));localStorage.setItem(LEGACY,JSON.stringify(data));}
  function live(){return (Array.isArray(app.clues)?app.clues:[]).filter(c=>!c.deletedAt);}
  function images(c){return Array.isArray(c.images)?c.images.filter(url=>typeof url==='string'&&url.trim()):c.imageUrl?[c.imageUrl]:[];}
  function imageLines(){return $('image-input').value.split(/\r?\n/).map(url=>url.trim()).filter(Boolean);}
  function chapter(c){return app.nodes?.[c.chapterId]?.title||c.chapterTitle||'';}
  function chapters(select,blank){
    const previous=select.value;select.replaceChildren(new Option(blank,''));
    for(const id of app.rootIds||[])if(app.nodes?.[id])select.add(new Option(app.nodes[id].title,id));
    if(select.id==='chapter-filter')for(const c of live())if(c.chapterId&&![...select.options].some(o=>o.value===c.chapterId))select.add(new Option(chapter(c)||'原章節已移除',c.chapterId));
    select.value=previous;
  }
  function render(){
    chapters($('chapter-filter'),'全部章節');
    const query=$('search').value.trim().toLocaleLowerCase(),kind=$('kind-filter').value,source=$('chapter-filter').value;
    visible=live().filter(c=>(!query||[c.title,c.note,c.location,chapter(c)].join(' ').toLocaleLowerCase().includes(query))&&(!kind||c.kind===kind)&&(!source||c.chapterId===source));
    visible.sort((a,b)=>$('sort').value==='title'?String(a.title).localeCompare(String(b.title),'zh-Hant'):$('sort').value==='oldest'?String(a.createdAt).localeCompare(String(b.createdAt)):String(b.createdAt).localeCompare(String(a.createdAt)));
    $('count').textContent=`${visible.length} 件收藏${visible.length!==live().length?' ／ 共 '+live().length+' 件':''}`;
    $('gallery').replaceChildren();
    for(const c of visible){
      const pages=images(c),coverUrl=pages[0]||'';
      const card=document.createElement('article');card.className='clue-card';
      const cover=document.createElement('button');cover.className='card-cover';cover.setAttribute('aria-label','查看 '+c.title);
      const placeholder=document.createElement('span');placeholder.className='cover-placeholder';placeholder.textContent=coverUrl?'圖片暫時無法載入\n點開查看文字與原始連結':'◇\n'+(c.kind||'線索')+'收藏';
      if(coverUrl){const img=document.createElement('img');img.alt=c.title;img.loading='lazy';cover.append(img);store.image(img,coverUrl,placeholder);}
      if(pages.length){const count=document.createElement('span');count.className='page-count';count.textContent=pages.length+' 張圖片';cover.append(count);}
      cover.append(placeholder);cover.onclick=()=>view(c.id);
      const content=document.createElement('div');content.className='card-body';
      const badge=document.createElement('span');badge.className='badge';badge.textContent=c.kind||'其他';
      const title=document.createElement('button');title.className='card-title';title.textContent=c.title;title.onclick=()=>view(c.id);
      const meta=document.createElement('p');meta.className='card-meta';meta.textContent=[chapter(c),c.location].filter(Boolean).join(' · ');
      const note=document.createElement('p');note.className='card-note';note.textContent=c.note||'尚未補上說明';
      content.append(badge,title,meta,note);
      {const actions=document.createElement('div');actions.className='card-actions';const edit=document.createElement('button');edit.className='btn';edit.textContent='編輯';edit.onclick=()=>editor(c.id);const remove=document.createElement('button');remove.className='btn danger';remove.textContent='移除收藏';remove.onclick=()=>removeClue(c.id);actions.append(edit);if(editing)actions.append(remove);content.append(actions);}
      card.append(cover,content);$('gallery').append(card);
    }
    $('empty').hidden=visible.length>0;
    $('empty').textContent=live().length?'沒有符合的收藏。\n試試其他關鍵字，或清除篩選。':'收藏架還是空的。\n點「＋ 加入線索」，加入遊戲中找到的第一封信或第一件道具。';
  }
  function open(id){$(id)._opener=document.activeElement;$(id).showModal();}
  document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>$(button.dataset.close).close());
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>{if(dialog._opener?.isConnected)dialog._opener.focus();}));
  function editor(id=''){
    editId=id;const c=live().find(item=>item.id===id)||{};
    $('editor-title').textContent=id?'編輯線索':'加入線索';$('title-input').value=c.title||'';$('kind-input').value=c.kind||'信件';
    chapters($('chapter-input'),'未指定章節');
    if(c.chapterId&&![...$('chapter-input').options].some(o=>o.value===c.chapterId))$('chapter-input').add(new Option(c.chapterTitle||'原章節已移除',c.chapterId));
    $('chapter-input').value=c.chapterId||'';$('image-input').value=images(c).join('\n');$('location-input').value=c.location||'';$('note-input').value=c.note||'';$('form-error').textContent='';preview();open('editor');
  }
  function preview(){
    const urls=imageLines();$('image-pages').replaceChildren();
    urls.forEach((url,index)=>{
      const row=document.createElement('div');row.className='image-page-row';
      const img=document.createElement('img');img.alt='第 '+(index+1)+' 頁預覽';img.loading='lazy';
      const fallback=document.createElement('span');fallback.className='page-error';fallback.textContent=store.media(url)?'無法預覽':'連結無效';store.image(img,url,fallback);
      const label=document.createElement('span');label.className='page-label';label.textContent='第 '+(index+1)+' 頁'+(index===0?' · 封面':'');
      const tools=document.createElement('div');tools.className='page-actions';
      function button(text,title,disabled,action){const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.textContent=text;btn.setAttribute('aria-label',title);btn.disabled=disabled;btn.onclick=()=>{action();$('image-input').value=urls.join('\n');preview();};tools.append(btn);}
      button('↑','第 '+(index+1)+' 頁往前移',index===0,()=>{[urls[index-1],urls[index]]=[urls[index],urls[index-1]];});
      button('↓','第 '+(index+1)+' 頁往後移',index===urls.length-1,()=>{[urls[index+1],urls[index]]=[urls[index],urls[index+1]];});
      button('移除','移除第 '+(index+1)+' 頁',false,()=>urls.splice(index,1));
      row.append(img,fallback,label,tools);$('image-pages').append(row);
    });
  }
  function loadPageImage(id,url,title,errorId){
    // A new element isolates pending load/error events from the previous page.
    const img=document.createElement('img');img.id=id;img.alt=title;$(id).replaceWith(img);store.image(img,url,$(errorId));
  }
  function showPage(index){
    const c=live().find(item=>item.id===activeId);if(!c)return;
    const pages=images(c);activePage=Math.max(0,Math.min(index,pages.length-1));
    $('viewer-media').hidden=!pages.length;
    if(!pages.length){if($('lightbox').open)$('lightbox').close();return;}
    const url=pages[activePage],title=c.title+' · 第 '+(activePage+1)+' 頁',data=store.media(url);
    loadPageImage('view-image',url,title,'view-image-error');
    $('view-drive').hidden=!data;if(data)$('view-drive').href=data.original;
    $('page-position').textContent='第 '+(activePage+1)+' / '+pages.length+' 頁';
    $('page-prev').disabled=activePage===0;$('page-next').disabled=activePage===pages.length-1;
    $('page-thumbs').replaceChildren();$('page-thumbs').hidden=pages.length<2;
    pages.forEach((url,i)=>{const button=document.createElement('button');button.className='page-thumb';button.setAttribute('aria-label','前往第 '+(i+1)+' 頁');button.setAttribute('aria-current',String(i===activePage));const img=document.createElement('img');img.alt='';img.loading='lazy';store.image(img,url);const number=document.createElement('span');number.textContent=i+1;button.append(img,number);button.onclick=()=>showPage(i);$('page-thumbs').append(button);});
    const thumb=$('page-thumbs').children[activePage];if(thumb)$('page-thumbs').scrollLeft=Math.max(0,thumb.offsetLeft-$('page-thumbs').offsetLeft-$('page-thumbs').clientWidth/2+thumb.offsetWidth/2);
    if($('lightbox').open)showFullPage();
  }
  function showFullPage(){
    const c=live().find(item=>item.id===activeId),pages=c?images(c):[],url=pages[activePage];if(!url)return;
    loadPageImage('full-image',url,c.title+' · 第 '+(activePage+1)+' 頁','full-error');
    $('full-position').textContent='第 '+(activePage+1)+' / '+pages.length+' 頁';
    $('full-prev').disabled=activePage===0;$('full-next').disabled=activePage===pages.length-1;
    const data=store.media(url);$('full-drive').hidden=!data;if(data)$('full-drive').href=data.original;
    $('lightbox').scrollTop=0;
  }
  function view(id,keepList=false){
    const c=live().find(item=>item.id===id);if(!c)return;
    if(!keepList)opened=visible.map(item=>item.id);activeId=id;
    $('view-title').textContent=c.title;$('view-kind').textContent=c.kind||'其他';$('view-location').textContent=c.location?'取得於：'+c.location:'';$('view-note').textContent=c.note||'尚未補上說明。';
    const source=$('view-chapter');source.hidden=!c.chapterId;source.textContent='來源章節：'+(chapter(c)||'未命名');
    if(app.nodes?.[c.chapterId])source.href='./index.html#node='+encodeURIComponent(c.chapterId);else{source.removeAttribute('href');source.textContent+='（已移除）';}
    showPage(0);
    const index=opened.indexOf(id);$('previous').disabled=index<=0;$('next').disabled=index<0||index>=opened.length-1;$('view-position').textContent=`${index+1} / ${opened.length}`;
    if(!$('viewer').open)open('viewer');else $('viewer').scrollTop=0;
  }
  async function cloudRead(){const response=await fetch(gsUrl,{signal:AbortSignal.timeout(15000)});const result=await response.json();if(!result.ok)throw new Error(result.error||'讀取失敗');return result.data?JSON.parse(result.data):{};}
  async function refresh(){
    if(busy)return;
    app=store.read();render();
    if(!gsUrl){status('尚未連結雲端 · 目前顯示本機收藏');return;}
    if(pending().length){await syncCollection();app=store.read();render();return;}
    if(localStorage.getItem(DIRTY)==='1'){status('本機有尚未同步的筆記 · 目前顯示本機收藏',true);return;}
    busy=true;status('正在讀取雲端…');
    try{const cloud=await cloudRead();
      // A different tab may have saved while this request was pending.
      if(localStorage.getItem(DIRTY)==='1'){app=store.read();status('本機有新的變更，請先回主筆記同步',true);}
      else{app={...cloud,clues:store.merge(cloud.clues,store.read().clues)};persist(app);status('已同步 · '+new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}));}
      render();
    }catch(e){status('雲端讀取失敗 · 顯示本機收藏',true);}finally{busy=false;}
  }
  function pending(){try{return JSON.parse(localStorage.getItem(PENDING)||'[]');}catch{return [];}}
  async function syncCollection(){
    if(busy)return false;
    if(!gsUrl){status('已保存在本機 · 連結雲端後按同步',true);return false;}
    busy=true;$('save-button').disabled=true;
    try{
      status('正在確認最新資料…');
      const cloud=await cloudRead(),sent=pending();
      // Only handouts are applied to the latest cloud document. Unsent story edits
      // stay in the local document, and their shared dirty flag is never cleared here.
      const next={...cloud,clues:store.merge(cloud.clues,store.read().clues,sent),updatedAt:new Date().toISOString()};
      status('正在保存到雲端…');
      const response=await fetch(gsUrl,{method:'POST',body:new URLSearchParams({value:JSON.stringify(next)}),signal:AbortSignal.timeout(15000)});
      const result=await response.json();if(!result.ok)throw new Error(result.error||'保存失敗');
      const outstanding=pending().filter(c=>!sent.some(item=>item.id===c.id&&item.updatedAt===c.updatedAt));
      localStorage.setItem(PENDING,JSON.stringify(outstanding));
      app={...store.read(),clues:store.merge(next.clues,store.read().clues)};persist(app);
      status(outstanding.length?'已同步 · 還有新收藏等待同步':'已同步 · 玩家重新整理即可看到');return true;
    }catch{status('已保存在本機 · 雲端同步失敗，請按「同步」重試',true);return false;}
    finally{busy=false;$('save-button').disabled=false;}
  }
  async function saveRecord(record){
    if(busy)throw new Error('正在同步，請稍後再儲存。');
    const latest=store.read();
    const next={...latest,clues:store.merge(latest.clues,[record])};
    // Keep a separate outbox so phone users can retry without uploading old notes.
    localStorage.setItem(PENDING,JSON.stringify(store.merge(pending(),[record])));
    persist(next);app=next;render();
    return syncCollection();
  }
  $('clue-form').onsubmit=async e=>{
    e.preventDefault();const title=$('title-input').value.trim(),pages=imageLines();
    if(!title){$('form-error').textContent='請填寫標題。';return;}
    const invalid=pages.findIndex(url=>!store.media(url));
    if(invalid!==-1){$('form-error').textContent='第 '+(invalid+1)+' 行不是有效的 Google Drive 圖片分享連結，請修正後再儲存。';return;}
    const old=live().find(c=>c.id===editId),now=new Date().toISOString(),chapterId=$('chapter-input').value;
    const record={id:old?.id||'clue-'+crypto.randomUUID(),title,kind:$('kind-input').value,images:pages,imageUrl:pages[0]||'',chapterId,chapterTitle:app.nodes?.[chapterId]?.title||old?.chapterTitle||'',location:$('location-input').value.trim(),note:$('note-input').value,createdAt:old?.createdAt||now,updatedAt:now};
    try{const synced=await saveRecord(record);$('editor').close();toast(synced?'線索已儲存並同步':'線索已儲存在本機；請查看同步狀態。');}catch(error){$('form-error').textContent=error.message;}
  };
  async function removeClue(id){
    const record=live().find(c=>c.id===id);if(!record||!confirm(`移除「${record.title}」的收藏紀錄？Google Drive 原始檔案會保留。`))return;
    const now=new Date().toISOString();try{await saveRecord({...record,deletedAt:now,updatedAt:now});toast('收藏紀錄已移除');}catch(e){toast(e.message);}
  }
  $('mode-button').onclick=()=>{editing=!editing;$('mode-button').textContent=editing?'完成整理':'整理收藏';$('mode-button').setAttribute('aria-pressed',String(editing));$('mode-note').textContent=editing?'整理模式 · 加入素材與說明，供玩家回顧':'觀看模式 · 點選圖片或標題查看完整內容';render();};
  $('add-button').onclick=()=>editor();$('image-input').oninput=preview;
  for(const id of ['search','kind-filter','chapter-filter','sort'])$(id).addEventListener(id==='search'?'input':'change',render);
  $('reset-button').onclick=()=>{for(const id of ['search','kind-filter','chapter-filter'])$(id).value='';render();};
  $('previous').onclick=()=>view(opened[opened.indexOf(activeId)-1],true);$('next').onclick=()=>view(opened[opened.indexOf(activeId)+1],true);
  $('page-prev').onclick=()=>showPage(activePage-1);$('page-next').onclick=()=>showPage(activePage+1);
  $('full-prev').onclick=()=>showPage(activePage-1);$('full-next').onclick=()=>showPage(activePage+1);
  $('zoom-image').onclick=()=>{open('lightbox');showFullPage();};
  document.addEventListener('keydown',e=>{if((!$('viewer').open&&!$('lightbox').open)||!['ArrowLeft','ArrowRight'].includes(e.key)||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;e.preventDefault();showPage(activePage+(e.key==='ArrowRight'?1:-1));});
  $('sync-button').onclick=refresh;
  $('connection-button').onclick=()=>{$('url-input').value=gsUrl;open('connection');};
  $('connection-form').onsubmit=async e=>{e.preventDefault();const value=$('url-input').value.trim();if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(value)){$('connection-error').textContent='請貼上以 /exec 結尾的 Google Apps Script 網址。';return;}gsUrl=value;localStorage.setItem(URLKEY,value);$('connection').close();await refresh();};
  window.addEventListener('storage',e=>{if(e.key===KEY&&!busy){app=store.read();render();if($('viewer').open&&!live().some(c=>c.id===activeId))$('viewer').close();}if(e.key===URLKEY)gsUrl=e.newValue||'';});
  refresh();
})();
