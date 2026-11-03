(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  try{window.magicianTrash=JSON.parse(localStorage.getItem('magician-trash')||'[]')}catch{window.magicianTrash=[]}
  const side=document.querySelector('.side');
  const box=document.createElement('section');box.id='taskTrash';
  box.style.cssText='border:1px dashed #c8c7bd;border-radius:10px;padding:12px;color:#747870;background:#f5f4ee;min-height:72px;transition:background .15s,border-color .15s';
  side.insertBefore(box,side.querySelector('.side-bottom'));
  const save=()=>{localStorage.setItem('magician-trash',JSON.stringify(window.magicianTrash));localStorage.setItem('magician-tasks',JSON.stringify(tasks));localStorage.setItem('magician-inventory',JSON.stringify(window.magicianInventory||[]));render();if(document.querySelector('.nav [data-module="food"]')?.classList.contains('active'))openModule('food');window.renderMagicianTrash();pushCloud?.()};
  window.renderMagicianTrash=()=>{
    const count=window.magicianTrash.length;
    box.innerHTML=`<div style="font-size:13px;font-weight:600;color:#535d52">♧ 垃圾箱 <span style="font-weight:400;color:#90958d">${count||''}</span></div><div style="font-size:11px;margin-top:5px">把任务或食材拖到这里</div>${count?`<details style="margin-top:9px"><summary style="font-size:11px;cursor:pointer">查看并恢复</summary><div id="trashItems" style="max-height:170px;overflow:auto;margin-top:7px">${window.magicianTrash.slice().reverse().map(t=>`<div style="border-top:1px solid #deded6;padding:7px 0;font-size:11px;line-height:1.4"><span>${t.kind==='inventory'?`食材 · ${esc(t.stock?.name)} · ${esc(t.stock?.amount)}`:`任务 · ${esc(t.n)} · ${esc(t.date||'未排期')}`}</span><button type="button" data-restore="${esc(t.id)}" style="display:block;color:#4b694f;text-decoration:underline;padding:4px 0">恢复</button></div>`).join('')}</div></details>`:''}`;
    box.querySelectorAll('[data-restore]').forEach(btn=>btn.onclick=()=>{const i=window.magicianTrash.findIndex(t=>String(t.id)===btn.dataset.restore);if(i<0)return;const [item]=window.magicianTrash.splice(i,1);if(item.kind==='inventory')(window.magicianInventory=window.magicianInventory||[]).splice(Math.min(item.index??window.magicianInventory.length,window.magicianInventory.length),0,item.stock);else tasks.push(item);save();toast(item.kind==='inventory'?'已恢复食材':'已恢复任务')});
  };
  const remove=id=>{const i=tasks.findIndex(t=>String(t.id)===String(id));if(i<0)return;const [task]=tasks.splice(i,1);window.magicianTrash.push(task);save();undoFn=()=>{const k=window.magicianTrash.findIndex(t=>String(t.id)===String(task.id));if(k>=0)window.magicianTrash.splice(k,1);tasks.splice(Math.min(i,tasks.length),0,task);save()};toast('已移到垃圾箱，可撤销')};
  window.moveInventoryToTrash=index=>{const inventory=window.magicianInventory||[];if(!Number.isInteger(index)||index<0||index>=inventory.length)return;const [stock]=inventory.splice(index,1),id=`stock-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;window.magicianTrash.push({kind:'inventory',id,index,stock});save();undoFn=()=>{const i=window.magicianTrash.findIndex(t=>t.id===id);if(i>=0)window.magicianTrash.splice(i,1);inventory.splice(Math.min(index,inventory.length),0,stock);save()};toast('食材已移到垃圾箱，可撤销')};
  box.addEventListener('dragover',e=>{e.preventDefault();box.classList.add('drag-target')});
  box.addEventListener('dragleave',()=>box.classList.remove('drag-target'));
  box.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();box.classList.remove('drag-target');const stockData=e.dataTransfer.getData('application/x-lumi-inventory');if(stockData){try{const ref=JSON.parse(stockData),item=(window.magicianInventory||[])[ref.index];if(item&&item.name===ref.name&&item.amount===ref.amount)window.moveInventoryToTrash(ref.index)}catch{}return}remove(e.dataTransfer.getData('task'))});
  window.renderMagicianTrash();
})();
