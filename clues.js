(() => {
  'use strict';
  const $ = id => document.getElementById(id), store = AdventureClues;
  const KEY='adventure-notes-v1', LEGACY='dnd-v3', DIRTY='adventure-notes-dirty', URLKEY='adventure-notes-gs-url', PENDING='adventure-clues-pending';
  let app=store.read(), editing=false, editId='', activeId='', busy=false, visible=[], opened=[], opener=null;
  let gsUrl=localStorage.getItem(URLKEY)||localStorage.getItem('dnd-gs-url')||'';
  function status(text,error=false){$('sync-status').textContent=text;$('sync-status').classList.toggle('error',error);}
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
  function persist(data){localStorage.setItem(KEY,JSON.stringify(data));localStorage.setItem(LEGACY,JSON.stringify(data));}
  function live(){return (Array.isArray(app.clues)?app.clues:[]).filter(c=>!c.deletedAt);}
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
      const card=document.createElement('article');card.className='clue-card';
      const cover=document.createElement('button');cover.className='card-cover';cover.setAttribute('aria-label','查看 '+c.title);
      const placeholder=document.createElement('span');placeholder.className='cover-placeholder';placeholder.textContent=c.imageUrl?'圖片暫時無法載入\n點開查看文字與原始連結':'◇\n'+(c.kind||'線索')+'收藏';
      if(c.imageUrl){const img=document.createElement('img');img.alt=c.title;img.loading='lazy';cover.append(img);store.image(img,c.imageUrl,placeholder);}
      cover.append(placeholder);cover.onclick=()=>view(c.id);
      const content=document.createElement('div');content.className='card-body';
      const badge=document.createElement('span');badge.className='badge';badge.textContent=c.kind||'其他';
      const title=document.createElement('button');title.className='card-title';title.textContent=c.title;title.onclick=()=>view(c.id);
      const meta=document.createElement('p');meta.className='card-meta';meta.textContent=[chapter(c),c.location].filter(Boolean).join(' · ');
      const note=document.createElement('p');note.className='card-note';note.textContent=c.note||'尚未補上說明';
      content.append(badge,title,meta,note);
      if(editing){const actions=document.createElement('div');actions.className='card-actions';const edit=document.createElement('button');edit.className='btn';edit.textContent='編輯';edit.onclick=()=>editor(c.id);const remove=document.createElement('button');remove.className='btn danger';remove.textContent='移除收藏';remove.onclick=()=>removeClue(c.id);actions.append(edit,remove);content.append(actions);}
      card.append(cover,content);$('gallery').append(card);
    }
    $('empty').hidden=visible.length>0;
    $('empty').textContent=live().length?'沒有符合的收藏。\n試試其他關鍵字，或清除篩選。':'收藏架還是空的。\n點「整理收藏」，加入遊戲中找到的第一封信或第一件道具。';
  }
  function open(id){opener=document.activeElement;$(id).showModal();}
  document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>$(button.dataset.close).close());
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();}));
  function editor(id=''){
    if(!editing)return;
    editId=id;const c=live().find(item=>item.id===id)||{};
    $('editor-title').textContent=id?'編輯線索':'加入線索';$('title-input').value=c.title||'';$('kind-input').value=c.kind||'信件';
    chapters($('chapter-input'),'未指定章節');
    if(c.chapterId&&![...$('chapter-input').options].some(o=>o.value===c.chapterId))$('chapter-input').add(new Option(c.chapterTitle||'原章節已移除',c.chapterId));
    $('chapter-input').value=c.chapterId||'';$('image-input').value=c.imageUrl||'';$('location-input').value=c.location||'';$('note-input').value=c.note||'';$('form-error').textContent='';preview();open('editor');
  }
  function preview(){const value=$('image-input').value.trim();$('preview').hidden=!value;if(value)store.image($('preview-image'),value,$('preview-error'));}
  function view(id,keepList=false){
    const c=live().find(item=>item.id===id);if(!c)return;
    if(!keepList)opened=visible.map(item=>item.id);activeId=id;
    $('view-title').textContent=c.title;$('view-kind').textContent=c.kind||'其他';$('view-location').textContent=c.location?'取得於：'+c.location:'';$('view-note').textContent=c.note||'尚未補上說明。';
    const source=$('view-chapter');source.hidden=!c.chapterId;source.textContent='來源章節：'+(chapter(c)||'未命名');
    if(app.nodes?.[c.chapterId])source.href='./index.html#node='+encodeURIComponent(c.chapterId);else{source.removeAttribute('href');source.textContent+='（已移除）';}
    $('viewer-media').hidden=!c.imageUrl;
    if(c.imageUrl){$('view-image').alt=c.title;store.image($('view-image'),c.imageUrl,$('view-image-error'));const data=store.media(c.imageUrl);$('view-drive').hidden=!data;if(data)$('view-drive').href=data.original;}
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
    e.preventDefault();const title=$('title-input').value.trim(),url=$('image-input').value.trim();
    if(!title){$('form-error').textContent='請填寫標題。';return;}
    if(url&&!store.media(url)){$('form-error').textContent='請貼上有效的 Google Drive 圖片分享連結。';return;}
    const old=live().find(c=>c.id===editId),now=new Date().toISOString(),chapterId=$('chapter-input').value;
    const record={id:old?.id||'clue-'+crypto.randomUUID(),title,kind:$('kind-input').value,imageUrl:url,chapterId,chapterTitle:app.nodes?.[chapterId]?.title||old?.chapterTitle||'',location:$('location-input').value.trim(),note:$('note-input').value,createdAt:old?.createdAt||now,updatedAt:now};
    try{const synced=await saveRecord(record);$('editor').close();toast(synced?'線索已儲存並同步':'線索已儲存在本機；請查看同步狀態。');}catch(error){$('form-error').textContent=error.message;}
  };
  async function removeClue(id){
    const record=live().find(c=>c.id===id);if(!record||!confirm(`移除「${record.title}」的收藏紀錄？Google Drive 原始檔案會保留。`))return;
    const now=new Date().toISOString();try{await saveRecord({...record,deletedAt:now,updatedAt:now});toast('收藏紀錄已移除');}catch(e){toast(e.message);}
  }
  $('mode-button').onclick=()=>{editing=!editing;$('mode-button').textContent=editing?'完成整理':'整理收藏';$('mode-button').setAttribute('aria-pressed',String(editing));$('add-button').hidden=!editing;$('mode-note').textContent=editing?'整理模式 · 加入素材與說明，供玩家回顧':'觀看模式 · 點選圖片或標題查看完整內容';render();};
  $('add-button').onclick=()=>editor();$('image-input').oninput=preview;
  for(const id of ['search','kind-filter','chapter-filter','sort'])$(id).addEventListener(id==='search'?'input':'change',render);
  $('reset-button').onclick=()=>{for(const id of ['search','kind-filter','chapter-filter'])$(id).value='';render();};
  $('previous').onclick=()=>view(opened[opened.indexOf(activeId)-1],true);$('next').onclick=()=>view(opened[opened.indexOf(activeId)+1],true);
  $('zoom-image').onclick=()=>{const c=live().find(item=>item.id===activeId);if(!c)return;const image=$('full-image');image.alt=c.title;image.src=$('view-image').currentSrc;open('lightbox');};
  $('sync-button').onclick=refresh;
  $('connection-button').onclick=()=>{$('url-input').value=gsUrl;open('connection');};
  $('connection-form').onsubmit=async e=>{e.preventDefault();const value=$('url-input').value.trim();if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(value)){$('connection-error').textContent='請貼上以 /exec 結尾的 Google Apps Script 網址。';return;}gsUrl=value;localStorage.setItem(URLKEY,value);$('connection').close();await refresh();};
  window.addEventListener('storage',e=>{if(e.key===KEY&&!busy){app=store.read();render();if($('viewer').open&&!live().some(c=>c.id===activeId))$('viewer').close();}if(e.key===URLKEY)gsUrl=e.newValue||'';});
  refresh();
})();
