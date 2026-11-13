/* Uses the existing exercise IDs; never writes to training storage. */
function photoNotice(id){return PHOTO_DATA[id]?.note||'No se encontró una fotografía adecuada con licencia de reutilización verificada.';}
function creditHTML(p){if(p?.provided)return `${esc(p.title)} · ${esc(p.author)} · Aportada por el usuario · ${esc(p.license)} · ${esc(p.changes)}`;return p?`${esc(p.title)} · ${esc(p.author)} · <a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Fuente</a> · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a>${p.extraCredit?` · <a href="${esc(p.extraCredit)}" target="_blank" rel="noopener noreferrer">PTPioneer</a>`:''} · ${esc(p.changes)}`:'';}
function photoMarkup(id){const e=EX[id],p=PHOTO_DATA[id];return p?`<figure class="photo-wrap"><button class="photo-open" type="button" data-photo="${esc(id)}" aria-label="Ampliar fotografía de ${esc(e.name)}"><img class="photo" src="${esc(e.img)}" alt="${esc(p.alt)}" loading="lazy" decoding="async"><span>⤢ Ampliar</span></button><figcaption>${p.scope==='apparatus'?'Referencia del aparato':p.scope==='variant'?'Otra variante':p.provided?'Imagen de referencia':'Foto de referencia'}<br><a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${p.provided?'Archivo aportado':'Fuente y licencia'}</a></figcaption></figure>`:`<div class="photo-missing" role="img" aria-label="Foto pendiente para ${esc(e.name)}">🏋️<br>Foto pendiente</div>`;}
function renderCatalog(){
 const input=document.getElementById('catalogSearch'),filter=document.getElementById('catalogFilter');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const term=normalize(input.value),kind=filter.value;
 const items=Object.entries(EX).filter(([id,e])=>normalize(e.name+' '+e.muscle).includes(term)&&(kind==='all'||kind==='photos'&&PHOTO_DATA[id]||kind==='pending'&&!PHOTO_DATA[id]));
 document.getElementById('catalogCount').textContent=`${items.length} ejercicios · ${Object.keys(PHOTO_DATA).length} con imagen · ${Object.keys(EX).length-Object.keys(PHOTO_DATA).length} pendientes`;
 document.getElementById('catalogGrid').innerHTML=items.length?items.map(([id,e])=>`<article class="catalog-item">${photoMarkup(id)}<h3>${esc(e.name)}</h3><div class="tiny">${esc(e.muscle)}</div><p>${esc(e.cue)}</p><div class="photo-notice">${esc(photoNotice(id))}</div><details><summary>Fuente y derechos de uso</summary><div class="photo-credit">${PHOTO_DATA[id]?creditHTML(PHOTO_DATA[id]):'No se publica una imagen sin derechos verificados.'}</div></details><a class="btn-ghost" href="${yurl(e)}" target="_blank" rel="noopener noreferrer">▶ YouTube</a></article>`).join(''):'<p class="muted">No hay ejercicios que coincidan.</p>';
}
let zoomScale=1,zoomX=0,zoomY=0,photoTrigger=null;
const photoPointers=new Map();let lastPinch=null;
function paintZoom(){const stage=document.getElementById('zoomStage');const maxX=stage.clientWidth*(zoomScale-1)/2,maxY=stage.clientHeight*(zoomScale-1)/2;zoomX=Math.max(-maxX,Math.min(maxX,zoomX));zoomY=Math.max(-maxY,Math.min(maxY,zoomY));document.getElementById('zoomImage').style.transform=`translate(${zoomX}px,${zoomY}px) scale(${zoomScale})`;document.getElementById('zoomValue').textContent=Math.round(zoomScale*100)+'%';}
function changeZoom(value){zoomScale=Math.max(1,Math.min(5,value));paintZoom();}
function openPhoto(id,trigger){const p=PHOTO_DATA[id];if(!p)return;const d=document.getElementById('photoViewer');photoTrigger=trigger;document.getElementById('photoTitle').textContent=EX[id].name;const img=document.getElementById('zoomImage');img.src=EX[id].img;img.alt=p.alt;document.getElementById('photoCaption').innerHTML=`<p class="photo-notice">${esc(p.note)}</p><p class="photo-credit">${creditHTML(p)}</p>`;zoomScale=1;zoomX=zoomY=0;photoPointers.clear();lastPinch=null;d.showModal();paintZoom();document.body.style.overflow='hidden';document.getElementById('photoClose').focus();}
function closePhoto(){document.getElementById('photoViewer').close();}
function initPhotos(){
 renderCatalog();document.getElementById('catalogSearch').addEventListener('input',renderCatalog);document.getElementById('catalogFilter').addEventListener('change',renderCatalog);
 document.addEventListener('click',event=>{const b=event.target.closest('[data-photo]');if(b)openPhoto(b.dataset.photo,b);});
 const d=document.getElementById('photoViewer'),stage=document.getElementById('zoomStage');
 document.getElementById('photoClose').addEventListener('click',closePhoto);document.getElementById('zoomIn').addEventListener('click',()=>changeZoom(zoomScale+.5));document.getElementById('zoomOut').addEventListener('click',()=>changeZoom(zoomScale-.5));document.getElementById('zoomReset').addEventListener('click',()=>{zoomX=zoomY=0;changeZoom(1);});
 d.addEventListener('close',()=>{document.body.style.overflow='';photoPointers.clear();lastPinch=null;if(photoTrigger?.isConnected)photoTrigger.focus();else document.getElementById('main').focus();});
 d.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();changeZoom(zoomScale+.5);}if(e.key==='-'){e.preventDefault();changeZoom(zoomScale-.5);}});
 stage.addEventListener('wheel',e=>{e.preventDefault();changeZoom(zoomScale+(e.deltaY<0?.25:-.25));},{passive:false});
 stage.addEventListener('dblclick',()=>{zoomX=zoomY=0;changeZoom(zoomScale>1?1:2);});
 const distance=()=>{const p=[...photoPointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):null;};
 stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);photoPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastPinch=distance();});
 stage.addEventListener('pointermove',e=>{const old=photoPointers.get(e.pointerId);if(!old)return;photoPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(photoPointers.size===2){const dist=distance();if(lastPinch>0)changeZoom(zoomScale*dist/lastPinch);lastPinch=dist;}else if(photoPointers.size===1){zoomX+=e.clientX-old.x;zoomY+=e.clientY-old.y;paintZoom();}});
 const release=e=>{photoPointers.delete(e.pointerId);lastPinch=distance();};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);window.addEventListener('resize',()=>{if(d.open)paintZoom();});
}
window.addEventListener('DOMContentLoaded',initPhotos);
