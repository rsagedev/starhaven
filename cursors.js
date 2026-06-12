/* cursors.js — live shared cursors, drop into any page */
(function(){
  // each page must define window.API (your backend URL) before loading this.
  const API = window.API || '';
  const layer=document.getElementById('cursorLayer');
  const box=document.getElementById('noCursors');   // optional toggle (may not exist on every page)
  if(!layer) return;                                 // page didn't include the layer; do nothing
  const ghosts={};
  let ws=null, sendTimer=0, enabled=true, retry=0;

  try{ enabled = localStorage.getItem('noCursors')!=='1'; }catch(_){}
  if(box) box.checked=!enabled;

  function wsUrl(){
    const base = API || location.origin;
    return base.replace(/^http/,'ws') + '/cursors?page=' + encodeURIComponent(location.pathname);
  }
  function connect(){
    if(!enabled || ws) return;
    try{ ws=new WebSocket(wsUrl()); }catch(_){ return; }
    ws.onmessage=function(e){
      let m; try{ m=JSON.parse(e.data); }catch(_){ return; }
      if(m.gone){ if(ghosts[m.id]){ ghosts[m.id].remove(); delete ghosts[m.id]; } return; }
      let g=ghosts[m.id];
      if(!g){ g=document.createElement('div'); g.className='ghost'; g.textContent='\u27A4'; layer.appendChild(g); ghosts[m.id]=g; }
      g.style.color=m.c;
      const x=m.x*document.documentElement.clientWidth;
      g.style.transform='translate('+x+'px,'+m.y+'px) rotate(-45deg)';
    };
    ws.onclose=function(){ ws=null; clearGhosts(); if(enabled && retry<6){ retry++; setTimeout(connect,2000*retry); } };
    ws.onopen=function(){ retry=0; };
  }
  function clearGhosts(){ for(const id in ghosts){ ghosts[id].remove(); delete ghosts[id]; } }

  document.addEventListener('mousemove',function(e){
    if(!enabled || !ws || ws.readyState!==1) return;
    const now=Date.now(); if(now-sendTimer<40) return; sendTimer=now;
    ws.send(JSON.stringify({ x:e.pageX/document.documentElement.clientWidth, y:e.pageY }));
  });

  if(box) box.addEventListener('change',function(){
    enabled=!box.checked;
    try{ localStorage.setItem('noCursors', box.checked?'1':'0'); }catch(_){}
    if(!enabled){ if(ws){ws.close();} ws=null; clearGhosts(); } else { retry=0; connect(); }
  });

  connect();
})();