/* Player handouts are independent of story nodes. Tombstones prevent stale tabs
   from bringing deleted handouts back. All pages retain them when saving. */
window.AdventureClues = (() => {
  const key = 'adventure-notes-v1';
  function read() {
    let data={};
    try { data=JSON.parse(localStorage.getItem(key)||localStorage.getItem('dnd-v3')||'{}'); } catch {}
    try { data.clues=merge(data.clues,JSON.parse(localStorage.getItem('adventure-clues-pending')||'[]')); } catch {}
    return data;
  }
  function merge(...lists) {
    const records = new Map();
    for (const list of lists) for (const item of Array.isArray(list) ? list : []) {
      if (!item || typeof item.id !== 'string') continue;
      const old = records.get(item.id);
      if (!old || String(item.updatedAt || '') >= String(old.updatedAt || '')) records.set(item.id, item);
    }
    return [...records.values()];
  }
  function preserve(data) { return {...data, clues: merge(data.clues, read().clues)}; }
  async function prepareSave(data, url) {
    const next = preserve(data);
    // Retrieve just the latest handout collection before legacy full-document saves.
    // Do not POST an old collection if the prerequisite read fails.
    const response = await fetch(url,{signal:AbortSignal.timeout(15000)});
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || '無法確認最新線索資料，請重試同步');
    const cloud = result.data ? JSON.parse(result.data) : {};
    next.clues = merge(next.clues, cloud.clues);
    const cached = {...read(), clues:merge(next.clues,read().clues)};
    localStorage.setItem(key,JSON.stringify(cached));
    localStorage.setItem('dnd-v3',JSON.stringify(cached));
    return next;
  }
  function media(value) {
    try {
      const url = new URL(String(value).trim());
      if (url.protocol !== 'https:') return null;
      if (!['drive.google.com', 'lh3.googleusercontent.com'].includes(url.hostname)) return null;
      const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ||
        (url.hostname === 'lh3.googleusercontent.com' ? url.pathname.match(/^\/d\/([^/=]+)/)?.[1] : '') || url.searchParams.get('id');
      if (!id || !/^[\w-]+$/.test(id)) return null;
      const resource = url.searchParams.get('resourcekey');
      const suffix = resource ? '&resourcekey=' + encodeURIComponent(resource) : '';
      return {original: url.href, view: `https://drive.google.com/file/d/${id}/view?usp=sharing${suffix}`,
        previews: [`https://drive.google.com/thumbnail?id=${id}&sz=w1600${suffix}`, `https://lh3.googleusercontent.com/d/${id}=w1600${resource ? '?resourcekey=' + encodeURIComponent(resource) : ''}`]};
    } catch { return null; }
  }
  function image(img, value, fallback) {
    const data = media(value);
    if (!data) { img.hidden = true; if (fallback) fallback.hidden = false; return; }
    let index = 0;
    img.hidden = false;
    if (fallback) fallback.hidden = true;
    img.onerror = () => {
      if (++index < data.previews.length) img.src = data.previews[index];
      else { img.hidden = true; if (fallback) fallback.hidden = false; }
    };
    img.src = data.previews[0];
  }
  return {read, merge, preserve, prepareSave, media, image};
})();
